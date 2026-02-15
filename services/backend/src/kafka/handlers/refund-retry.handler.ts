import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { KafkaService } from '../kafka.service';
import { PurchaseEntity, PurchaseStatus } from '../../purchase/entities/purchase.entity';
import { TransactionEntity, TransactionType, TransactionStatus } from '../../purchase/entities/transaction.entity';
import { CompanyLedgerEntity, CompanyLedgerType } from '../../purchase/entities/company-ledger.entity';
import { RefundRequestEntity, RefundRequestStatus } from '../../purchase/entities/refund-request.entity';
import { CreditLedgerEntity, CreditEntryType } from '../../credit/entities/credit-ledger.entity';

@Injectable()
export class RefundRetryHandler implements OnModuleInit {
  private readonly logger = new Logger(RefundRetryHandler.name);

  constructor(
    private readonly kafkaService: KafkaService,
    @InjectRepository(PurchaseEntity)
    private readonly purchaseRepo: Repository<PurchaseEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
    @InjectRepository(CompanyLedgerEntity)
    private readonly companyLedgerRepo: Repository<CompanyLedgerEntity>,
    @InjectRepository(RefundRequestEntity)
    private readonly refundRequestRepo: Repository<RefundRequestEntity>,
    private readonly dataSource: DataSource,
  ) {}

  onModuleInit(): void {
    this.kafkaService.registerHandler('refund-retry', this.handle.bind(this));
    this.logger.log('Refund retry handler registered');
  }

  async handle(data: { refundRequestId: string; purchaseId: string; retryCount: number }): Promise<void> {
    const { refundRequestId, purchaseId, retryCount } = data;
    this.logger.log(`Processing refund retry for request ${refundRequestId}, purchase ${purchaseId}, attempt ${retryCount}`);

    const request = await this.refundRequestRepo.findOneBy({ id: refundRequestId });

    if (!request) {
      this.logger.error(`Refund request not found: ${refundRequestId}`);
      return;
    }

    if (request.status === RefundRequestStatus.Approved) {
      this.logger.log(`Refund request ${refundRequestId} is already approved, skipping`);
      return;
    }

    if (request.status !== RefundRequestStatus.Failed) {
      this.logger.warn(`Refund request ${refundRequestId} has unexpected status: ${request.status}, skipping`);
      return;
    }

    const purchase = await this.purchaseRepo.findOneBy({ id: purchaseId });

    if (!purchase) {
      this.logger.error(`Purchase not found: ${purchaseId}`);
      return;
    }

    const refundAmount = Number(request.approvedAmount || 0);

    try {
      await this.dataSource.transaction(async (manager) => {
        // Idempotency check: see if a company ledger refund entry already exists for this request
        const existingLedgerEntry = await manager.findOne(CompanyLedgerEntity, {
          where: {
            referenceId: refundRequestId,
            type: CompanyLedgerType.Refund,
          },
        });

        if (!existingLedgerEntry) {
          const ledgerEntry = manager.create(CompanyLedgerEntity, {
            referenceId: refundRequestId,
            type: CompanyLedgerType.Refund,
            amount: refundAmount,
            reason: `Refund retry for request ${refundRequestId}, purchase ${purchaseId}`,
          });
          await manager.save(ledgerEntry);
        }

        // Credit the customer's balance
        const creditEntry = manager.create(CreditLedgerEntity, {
          customerId: request.customerId,
          amount: refundAmount,
          type: CreditEntryType.Refund,
          reason: `Refund credit-back retry for request ${refundRequestId}`,
          referenceId: purchaseId,
        });
        await manager.save(creditEntry);

        // Update purchase refund state
        purchase.refundedAmount = Number(purchase.refundedAmount) + refundAmount;
        purchase.status =
          purchase.refundedAmount >= Number(purchase.totalAmount)
            ? PurchaseStatus.Refunded
            : PurchaseStatus.PartiallyRefunded;
        purchase.errorMessage = null;
        await manager.save(purchase);

        // Update refund request status
        request.status = RefundRequestStatus.Approved;
        request.errorMessage = null;
        await manager.save(request);

        // Create transaction record
        const transaction = manager.create(TransactionEntity, {
          purchaseId,
          customerId: request.customerId,
          type: TransactionType.Refund,
          amount: refundAmount,
          status: TransactionStatus.Completed,
          description: `Refund completed via retry for request ${refundRequestId}`,
        });
        await manager.save(transaction);
      });

      this.logger.log(`Refund retry succeeded for request ${refundRequestId}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Refund retry failed for request ${refundRequestId}: ${errorMsg}`);

      request.errorMessage = errorMsg;
      await this.refundRequestRepo.save(request);

      purchase.errorMessage = errorMsg;
      await this.purchaseRepo.save(purchase);

      if (retryCount < 3) {
        this.logger.log(`Scheduling retry ${retryCount + 1} for refund request ${refundRequestId}`);
        await this.kafkaService.produce('refund-retry', {
          refundRequestId,
          purchaseId,
          retryCount: retryCount + 1,
        });
      } else {
        this.logger.error(`Max retries exceeded for refund request ${refundRequestId}`);
      }
    }
  }
}
