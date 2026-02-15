import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseEntity, PurchaseStatus } from './entities/purchase.entity';
import { TransactionEntity, TransactionType, TransactionStatus } from './entities/transaction.entity';
import { CompanyLedgerEntity, CompanyLedgerType } from './entities/company-ledger.entity';

import { RefundRequestEntity, RefundRequestStatus, RefundRequestType } from './entities/refund-request.entity';
import { SupportUserEntity } from './entities/support-user.entity';
import { CreditLedgerEntity, CreditEntryType } from '../credit/entities/credit-ledger.entity';
import { CreditService } from '../credit/credit.service';
import { CustomerApiService } from '../external/customer-api.service';
import { ProductApiService } from '../external/product-api.service';
import { ShipmentApiService } from '../external/shipment-api.service';
import { PromoService } from '../promo/promo.service';
import { KafkaService } from '../kafka/kafka.service';
import type { CreatePurchaseDto } from './dto/create-purchase.dto';
import type { ListPurchasesDto } from './dto/list-purchases.dto';
import type { PurchaseResponse, PurchaseListResponse } from './dto/purchase-response.dto';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(PurchaseEntity)
    private readonly purchaseRepo: Repository<PurchaseEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
    @InjectRepository(CompanyLedgerEntity)
    private readonly companyLedgerRepo: Repository<CompanyLedgerEntity>,
    @InjectRepository(RefundRequestEntity)
    private readonly refundRequestRepo: Repository<RefundRequestEntity>,
    @InjectRepository(SupportUserEntity)
    private readonly supportUserRepo: Repository<SupportUserEntity>,
    private readonly dataSource: DataSource,
    private readonly creditService: CreditService,
    private readonly customerApi: CustomerApiService,
    private readonly productApi: ProductApiService,
    private readonly shipmentApi: ShipmentApiService,
    private readonly promoService: PromoService,
    private readonly kafkaService: KafkaService,
  ) {}

  private readonly logger = new Logger(PurchaseService.name);

  // ─── Purchase Creation ────────────────────────────────────────────

  async createPurchase(dto: CreatePurchaseDto): Promise<PurchaseResponse> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Lock customer to prevent concurrent balance issues
      await this.creditService.acquireCustomerLock(manager, dto.customerId);

      // 2. Fetch product from Product API (for pricing info)
      const product = await this.productApi.getProduct(dto.productId);

      // 3. Apply promo code if provided
      let discountAmount = 0;
      let promoCodeId: string | null = null;

      if (dto.promoCode) {
        const promo = await this.promoService.validateAndApply(
          dto.promoCode,
          dto.customerId,
          product.price * dto.quantity,
          manager,
        );
        discountAmount = promo.discountAmount;
        promoCodeId = promo.promoCodeId;
      }

      const totalAmount = product.price * dto.quantity - discountAmount;

      // 4. Check credit balance
      const currentBalance = await this.creditService.computeBalanceInTx(
        manager,
        dto.customerId,
      );

      if (currentBalance < totalAmount) {
        throw new BadRequestException(
          `Insufficient credit. Available: $${currentBalance.toFixed(2)}, Required: $${totalAmount.toFixed(2)}`,
        );
      }

      // 5. Deduct from customer credit
      const ledgerEntry = manager.create(CreditLedgerEntity, {
        customerId: dto.customerId,
        amount: -totalAmount,
        type: CreditEntryType.Purchase,
        reason: `Purchase of ${dto.quantity}x ${product.name}`,
      });
      await manager.save(ledgerEntry);

      // 6. Save purchase with status='pending'
      const purchase = manager.create(PurchaseEntity, {
        customerId: dto.customerId,
        productId: product.id,
        productSku: product.sku,
        productName: product.name,
        quantity: dto.quantity,
        priceAtPurchase: product.price,
        totalAmount,
        discountAmount,
        promoCodeId,
        status: PurchaseStatus.Pending,
      });
      await manager.save(purchase);

      // Update ledger entry with purchase reference
      ledgerEntry.referenceId = purchase.id;
      await manager.save(ledgerEntry);

      // 7. Create transaction record (order_placed, pending)
      const transaction = manager.create(TransactionEntity, {
        purchaseId: purchase.id,
        customerId: dto.customerId,
        type: TransactionType.OrderPlaced,
        amount: totalAmount,
        status: TransactionStatus.Pending,
        description: `Order placed for ${dto.quantity}x ${product.name}`,
      });
      await manager.save(transaction);

      // 7b. Record escrow entry in company ledger (funds held until delivery)
      const escrowEntry = manager.create(CompanyLedgerEntity, {
        amount: totalAmount,
        type: CompanyLedgerType.Escrow,
        referenceId: purchase.id,
        reason: `Escrow: ${dto.quantity}x ${product.name} held pending delivery`,
      });
      await manager.save(escrowEntry);

      // 8. Atomically decrement product stock via Product API
      //    This is atomic at the DB level — prevents race conditions
      //    Throws if insufficient stock
      await this.productApi.decrementStock(product.id, dto.quantity);

      // 9. Create shipment via Shipment API
      //    Use address confirmed by customer at checkout if provided,
      //    otherwise fall back to Customer API lookup
      //    If shipment fails, we must restore stock since the decrement
      //    already succeeded on the external API (not part of our DB tx)
      try {
        const shippingAddress = dto.shippingAddress
          ?? (await this.customerApi.getCustomer(dto.customerId)).shippingAddress;
        const shipment = await this.shipmentApi.createShipment({
          shippingAddress,
          products: [{ sku: product.sku, quantity: dto.quantity }],
        });

        // 10. Save shipmentId on purchase
        purchase.shipmentId = shipment.id;
        await manager.save(purchase);
      } catch (err) {
        // Compensate: restore stock since decrement already hit external API
        try {
          await this.productApi.incrementStock(product.id, dto.quantity);
        } catch (stockErr) {
          this.logger.error(
            `Failed to restore stock for product ${product.id} after shipment failure: ${stockErr}`,
          );
        }
        throw err;
      }

      return this.toResponse(purchase);
    });
  }

  // ─── Shipment Status Update + Auto-Settlement ────────────────────

  async updateShipmentStatus(shipmentId: string, status: string) {
    // Block updates for cancelled purchases
    const purchase = await this.purchaseRepo.findOne({
      where: { shipmentId },
    });

    if (purchase && purchase.status === PurchaseStatus.Cancelled) {
      throw new BadRequestException('Cannot update shipment for a cancelled order');
    }

    // 1. Update shipment status via Shipment API
    const shipment = await this.shipmentApi.updateShipmentStatus(shipmentId, status as any);

    // 2. If delivered, auto-settle the associated purchase
    if (status === 'delivered') {
      if (purchase && purchase.status === PurchaseStatus.Pending) {
        await this.settlePurchase(purchase.id);
      }
    }

    return shipment;
  }

  private async settlePurchase(purchaseId: string): Promise<PurchaseResponse> {
    return this.dataSource.transaction(async (manager) => {
      const purchase = await manager.findOne(PurchaseEntity, {
        where: { id: purchaseId },
      });

      if (!purchase) {
        throw new NotFoundException(`Purchase ${purchaseId} not found`);
      }

      if (purchase.status !== PurchaseStatus.Pending) {
        throw new BadRequestException(
          `Purchase cannot be settled. Current status: ${purchase.status}`,
        );
      }

      try {
        // 1a. Release escrow (funds no longer held)
        const escrowRelease = manager.create(CompanyLedgerEntity, {
          amount: -Number(purchase.totalAmount),
          type: CompanyLedgerType.EscrowRelease,
          referenceId: purchase.id,
          reason: `Escrow released: ${purchase.quantity}x ${purchase.productName} delivered`,
        });
        await manager.save(escrowRelease);

        // 1b. Add company_ledger entry (sale — revenue recognized)
        const companyEntry = manager.create(CompanyLedgerEntity, {
          amount: Number(purchase.totalAmount),
          type: CompanyLedgerType.Sale,
          referenceId: purchase.id,
          reason: `Sale: ${purchase.quantity}x ${purchase.productName}`,
        });
        await manager.save(companyEntry);

        // 2. Update purchase status → 'settled'
        purchase.status = PurchaseStatus.Settled;
        purchase.settledAt = new Date();
        await manager.save(purchase);

        // 3. Create transaction record (shipment_delivered, completed)
        const transaction = manager.create(TransactionEntity, {
          purchaseId: purchase.id,
          customerId: purchase.customerId,
          type: TransactionType.ShipmentDelivered,
          amount: Number(purchase.totalAmount),
          status: TransactionStatus.Completed,
          description: `Shipment delivered and purchase settled`,
        });
        await manager.save(transaction);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Settlement failed for purchase ${purchaseId}: ${errorMsg}`);

        // Mark as failed
        purchase.status = PurchaseStatus.SettlementFailed;
        purchase.errorMessage = errorMsg;
        await manager.save(purchase);

        // Create failed transaction record
        const failedTx = manager.create(TransactionEntity, {
          purchaseId: purchase.id,
          customerId: purchase.customerId,
          type: TransactionType.SettlementFailed,
          amount: Number(purchase.totalAmount),
          status: TransactionStatus.Failed,
          description: `Settlement failed: ${errorMsg}`,
          errorMessage: errorMsg,
        });
        await manager.save(failedTx);

        // Dispatch to Kafka for retry
        await this.kafkaService.produce('settlement-retry', {
          purchaseId,
          retryCount: 0,
        });
      }

      return this.toResponse(purchase);
    });
  }

  // ─── Refund Request Flow ──────────────────────────────────────────

  async createRefundRequest(
    customerId: string,
    purchaseId: string,
    type: RefundRequestType,
    reason: string,
    requestedAmount?: number,
  ): Promise<RefundRequestEntity> {
    const purchase = await this.purchaseRepo.findOne({
      where: { id: purchaseId },
    });

    if (!purchase) {
      throw new NotFoundException(`Purchase ${purchaseId} not found`);
    }

    if (purchase.customerId !== customerId) {
      throw new BadRequestException('Purchase does not belong to this customer');
    }

    if (purchase.status !== PurchaseStatus.Settled && purchase.status !== PurchaseStatus.PartiallyRefunded) {
      throw new BadRequestException(
        `Refund can only be requested for settled purchases. Current status: ${purchase.status}`,
      );
    }

    // Time window validation based on type
    if (purchase.settledAt) {
      const elapsed = Date.now() - new Date(purchase.settledAt).getTime();
      if (type === RefundRequestType.Return) {
        const returnWindowMs = 1 * 60 * 1000;
        if (elapsed > returnWindowMs) {
          throw new BadRequestException(
            'Return window has expired. Returns must be requested within 1 minute of delivery.',
          );
        }
      } else {
        const refundWindowMs = 2 * 60 * 1000;
        if (elapsed > refundWindowMs) {
          throw new BadRequestException(
            'Refund window has expired. Refunds must be requested within 2 minutes of delivery.',
          );
        }
      }
    }

    // Check no pending refund request exists
    const existing = await this.refundRequestRepo.findOne({
      where: { purchaseId, status: RefundRequestStatus.Pending },
    });

    if (existing) {
      throw new BadRequestException('A pending refund request already exists for this purchase');
    }

    const maxRefundable = Number(purchase.totalAmount) - Number(purchase.refundedAmount);

    if (type === RefundRequestType.Return) {
      // Return: full refund only
      requestedAmount = maxRefundable;
    } else {
      // Refund: max 50% of total amount
      const maxRefundPercent = Number(purchase.totalAmount) * 0.5;
      const effectiveMax = Math.min(maxRefundable, maxRefundPercent);

      if (!requestedAmount) {
        throw new BadRequestException('Refund requests must specify a requested amount');
      }

      if (requestedAmount > effectiveMax) {
        throw new BadRequestException(
          `Requested amount $${requestedAmount.toFixed(2)} exceeds maximum refundable $${effectiveMax.toFixed(2)} (50% of order total)`,
        );
      }
    }

    const request = this.refundRequestRepo.create({
      purchaseId,
      customerId,
      type,
      reason,
      requestedAmount: requestedAmount || null,
      status: RefundRequestStatus.Pending,
    });

    return this.refundRequestRepo.save(request);
  }

  async listRefundRequests(filters: {
    status?: string;
    customerId?: string;
  }): Promise<RefundRequestEntity[]> {
    const qb = this.refundRequestRepo.createQueryBuilder('rr');

    if (filters.status) {
      qb.andWhere('rr.status = :status', { status: filters.status });
    }
    if (filters.customerId) {
      qb.andWhere('rr.customer_id = :customerId', { customerId: filters.customerId });
    }

    qb.orderBy('rr.created_at', 'DESC');

    return qb.getMany();
  }

  async approveRefundRequest(
    requestId: string,
    approvedAmount: number,
    reviewerNote?: string,
  ): Promise<RefundRequestEntity> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(RefundRequestEntity, {
        where: { id: requestId },
      });

      if (!request) {
        throw new NotFoundException(`Refund request ${requestId} not found`);
      }

      if (request.status !== RefundRequestStatus.Pending) {
        throw new BadRequestException(`Refund request is already ${request.status}`);
      }

      const purchase = await manager.findOne(PurchaseEntity, {
        where: { id: request.purchaseId },
      });

      if (!purchase) {
        throw new NotFoundException(`Purchase ${request.purchaseId} not found`);
      }

      const maxRefundable = Number(purchase.totalAmount) - Number(purchase.refundedAmount);

      if (approvedAmount > maxRefundable + 0.01) {
        throw new BadRequestException(
          `Approved amount $${approvedAmount.toFixed(2)} exceeds maximum refundable $${maxRefundable.toFixed(2)}`,
        );
      }

      // Lock customer
      await this.creditService.acquireCustomerLock(manager, purchase.customerId);

      // Set approved amount and note before attempting the refund
      request.approvedAmount = approvedAmount;
      request.reviewerNote = reviewerNote || null;

      try {
        // 1. Deduct from company_ledger
        const companyEntry = manager.create(CompanyLedgerEntity, {
          amount: -approvedAmount,
          type: CompanyLedgerType.Refund,
          referenceId: purchase.id,
          reason: `Refund: ${request.reason}`,
        });
        await manager.save(companyEntry);

        // 2. Credit customer
        const ledgerEntry = manager.create(CreditLedgerEntity, {
          customerId: purchase.customerId,
          amount: approvedAmount,
          type: CreditEntryType.Refund,
          reason: request.reason,
          referenceId: purchase.id,
        });
        await manager.save(ledgerEntry);

        // 3. Update purchase
        const newRefundedAmount = Number(purchase.refundedAmount) + approvedAmount;
        const isFullRefund = Math.abs(newRefundedAmount - Number(purchase.totalAmount)) < 0.01;

        purchase.refundedAmount = newRefundedAmount;
        purchase.status = isFullRefund ? PurchaseStatus.Refunded : PurchaseStatus.PartiallyRefunded;
        await manager.save(purchase);

        // 4. Create transaction record
        const transaction = manager.create(TransactionEntity, {
          purchaseId: purchase.id,
          customerId: purchase.customerId,
          type: TransactionType.Refund,
          amount: approvedAmount,
          status: TransactionStatus.Completed,
          description: `Refund approved: $${approvedAmount.toFixed(2)}`,
        });
        await manager.save(transaction);

        // 5. If this is a return, update shipment status to "returned"
        if (request.type === RefundRequestType.Return && purchase.shipmentId) {
          try {
            await this.shipmentApi.updateShipmentStatus(purchase.shipmentId, 'returned');
          } catch (shipErr) {
            this.logger.error(`Failed to update shipment ${purchase.shipmentId} to returned: ${shipErr}`);
          }
        }

        // 6. Update refund request
        request.status = RefundRequestStatus.Approved;
        await manager.save(request);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Refund failed for request ${requestId}: ${errorMsg}`);

        // Mark as failed
        request.status = RefundRequestStatus.Failed;
        request.errorMessage = errorMsg;
        await manager.save(request);

        purchase.status = PurchaseStatus.RefundFailed;
        purchase.errorMessage = errorMsg;
        await manager.save(purchase);

        // Create failed transaction record
        const failedTx = manager.create(TransactionEntity, {
          purchaseId: purchase.id,
          customerId: purchase.customerId,
          type: TransactionType.RefundFailed,
          amount: approvedAmount,
          status: TransactionStatus.Failed,
          description: `Refund failed: ${errorMsg}`,
          errorMessage: errorMsg,
        });
        await manager.save(failedTx);

        // Dispatch to Kafka for retry
        await this.kafkaService.produce('refund-retry', {
          refundRequestId: requestId,
          purchaseId: purchase.id,
          retryCount: 0,
        });
      }

      return request;
    });
  }

  async rejectRefundRequest(
    requestId: string,
    reviewerNote?: string,
  ): Promise<RefundRequestEntity> {
    const request = await this.refundRequestRepo.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException(`Refund request ${requestId} not found`);
    }

    if (request.status !== RefundRequestStatus.Pending) {
      throw new BadRequestException(`Refund request is already ${request.status}`);
    }

    request.status = RefundRequestStatus.Rejected;
    request.reviewerNote = reviewerNote || null;

    return this.refundRequestRepo.save(request);
  }

  // ─── Company Balance ──────────────────────────────────────────────

  async getCompanyBalance(): Promise<{ balance: number; ledger: CompanyLedgerEntity[] }> {
    const result = await this.companyLedgerRepo
      .createQueryBuilder('cl')
      .select('COALESCE(SUM(cl.amount), 0)', 'balance')
      .getRawOne();

    const ledger = await this.companyLedgerRepo.find({
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return {
      balance: parseFloat(result.balance),
      ledger,
    };
  }

  // ─── Support Users ────────────────────────────────────────────────

  async findSupportUserByEmail(email: string): Promise<SupportUserEntity | null> {
    return this.supportUserRepo.findOne({ where: { email } });
  }

  async getSupportUser(id: string): Promise<SupportUserEntity> {
    const user = await this.supportUserRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Support user ${id} not found`);
    return user;
  }

  // ─── Order Cancellation ──────────────────────────────────────────

  async cancelPurchase(purchaseId: string, customerId: string): Promise<PurchaseResponse> {
    const purchase = await this.purchaseRepo.findOne({ where: { id: purchaseId } });

    if (!purchase) {
      throw new NotFoundException(`Purchase ${purchaseId} not found`);
    }

    if (purchase.customerId !== customerId) {
      throw new BadRequestException('Purchase does not belong to this customer');
    }

    if (purchase.status !== PurchaseStatus.Pending) {
      throw new BadRequestException(
        `Only pending orders can be cancelled. Current status: ${purchase.status}`,
      );
    }

    // Check if shipment has already been shipped
    if (purchase.shipmentId) {
      const shipment = await this.shipmentApi.getShipment(purchase.shipmentId);
      if (shipment.status !== 'processing') {
        throw new BadRequestException(
          `Order cannot be cancelled after shipment has been ${shipment.status}`,
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      await this.creditService.acquireCustomerLock(manager, customerId);

      // 0. Cancel the shipment
      if (purchase.shipmentId) {
        await this.shipmentApi.updateShipmentStatus(purchase.shipmentId, 'cancelled');
      }

      // 1. Credit back the purchase amount
      const creditEntry = manager.create(CreditLedgerEntity, {
        customerId,
        amount: Number(purchase.totalAmount),
        type: CreditEntryType.Refund,
        reason: `Order cancelled: ${purchase.quantity}x ${purchase.productName}`,
        referenceId: purchase.id,
      });
      await manager.save(creditEntry);

      // 2. Atomically restore product stock (best-effort — product may have been removed)
      try {
        await this.productApi.incrementStock(purchase.productId, purchase.quantity);
      } catch {
        this.logger.warn(
          `Could not restore stock for product ${purchase.productId} (may have been removed)`,
        );
      }

      // 3. Release escrow (funds no longer held by company)
      const escrowRelease = manager.create(CompanyLedgerEntity, {
        amount: -Number(purchase.totalAmount),
        type: CompanyLedgerType.EscrowRelease,
        referenceId: purchase.id,
        reason: `Escrow released: order cancelled by customer`,
      });
      await manager.save(escrowRelease);

      // 4. Update purchase status and mark full amount as refunded
      purchase.status = PurchaseStatus.Cancelled;
      purchase.refundedAmount = Number(purchase.totalAmount);
      await manager.save(purchase);

      // 5. Create transaction record
      const transaction = manager.create(TransactionEntity, {
        purchaseId: purchase.id,
        customerId,
        type: TransactionType.OrderCancelled,
        amount: Number(purchase.totalAmount),
        status: TransactionStatus.Completed,
        description: `Order cancelled by customer`,
      });
      await manager.save(transaction);

      return this.toResponse(purchase);
    });
  }

  // ─── Transactions ───────────────────────────────────────────────

  async getTransactions(purchaseId: string): Promise<TransactionEntity[]> {
    const purchase = await this.purchaseRepo.findOne({ where: { id: purchaseId } });
    if (!purchase) {
      throw new NotFoundException(`Purchase ${purchaseId} not found`);
    }

    return this.transactionRepo.find({
      where: { purchaseId },
      order: { createdAt: 'ASC' },
    });
  }

  // ─── Existing Methods ─────────────────────────────────────────────

  async listPurchases(dto: ListPurchasesDto): Promise<PurchaseListResponse> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;

    const qb = this.purchaseRepo.createQueryBuilder('p');

    if (dto.customerId) {
      qb.where('p.customer_id = :customerId', { customerId: dto.customerId });
    }

    qb.orderBy('p.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [purchases, total] = await qb.getManyAndCount();

    return {
      purchases: purchases.map(this.toResponse),
      total,
      page,
      limit,
    };
  }

  async getPurchase(purchaseId: string): Promise<PurchaseResponse> {
    const purchase = await this.purchaseRepo.findOne({
      where: { id: purchaseId },
    });

    if (!purchase) {
      throw new NotFoundException(`Purchase ${purchaseId} not found`);
    }

    return this.toResponse(purchase);
  }

  private toResponse(purchase: PurchaseEntity): PurchaseResponse {
    return {
      id: purchase.id,
      customerId: purchase.customerId,
      productId: purchase.productId,
      productSku: purchase.productSku,
      productName: purchase.productName,
      quantity: purchase.quantity,
      priceAtPurchase: Number(purchase.priceAtPurchase),
      totalAmount: Number(purchase.totalAmount),
      discountAmount: Number(purchase.discountAmount),
      shipmentId: purchase.shipmentId,
      status: purchase.status,
      errorMessage: purchase.errorMessage || null,
      refundedAmount: Number(purchase.refundedAmount),
      settledAt: purchase.settledAt ? purchase.settledAt.toISOString() : null,
      createdAt: purchase.createdAt.toISOString(),
      updatedAt: purchase.updatedAt.toISOString(),
    };
  }
}
