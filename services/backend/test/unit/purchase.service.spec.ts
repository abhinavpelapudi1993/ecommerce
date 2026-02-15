import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PurchaseService } from '../../src/purchase/purchase.service';
import { PurchaseEntity, PurchaseStatus } from '../../src/purchase/entities/purchase.entity';
import { TransactionEntity } from '../../src/purchase/entities/transaction.entity';
import { CompanyLedgerEntity, CompanyLedgerType } from '../../src/purchase/entities/company-ledger.entity';
import { RefundRequestEntity, RefundRequestType } from '../../src/purchase/entities/refund-request.entity';
import { SupportUserEntity } from '../../src/purchase/entities/support-user.entity';
import { CreditService } from '../../src/credit/credit.service';
import { CustomerApiService } from '../../src/external/customer-api.service';
import { ProductApiService } from '../../src/external/product-api.service';
import { ShipmentApiService } from '../../src/external/shipment-api.service';
import { PromoService } from '../../src/promo/promo.service';
import { KafkaService } from '../../src/kafka/kafka.service';

describe('PurchaseService', () => {
  let service: PurchaseService;
  let mockManager: Partial<EntityManager>;
  let mockCreditService: Partial<CreditService>;
  let mockCustomerApi: Partial<CustomerApiService>;
  let mockProductApi: Partial<ProductApiService>;
  let mockShipmentApi: Partial<ShipmentApiService>;
  let mockPromoService: Partial<PromoService>;
  let mockPurchaseRepo: any;
  let mockRefundRequestRepo: any;
  let mockCompanyLedgerRepo: any;

  const testProduct = {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-1a2b3c4d5e01',
    sku: 'LAPTOP-PRO-15',
    name: 'ProBook Laptop 15"',
    description: 'A laptop',
    price: 1299.99,
    stock: 50,
    createdAt: Date.now(),
    lastModifiedAt: Date.now(),
  };

  const testCustomer = {
    id: 'c0a80001-0000-4000-8000-000000000001',
    name: 'Alice Johnson',
    billingAddress: { line1: '123 Main St', city: 'NYC', postalCode: '10001', state: 'NY', country: 'US' },
    shippingAddress: { line1: '456 Ship Ave', city: 'NYC', postalCode: '10002', state: 'NY', country: 'US' },
    email: 'alice@example.com',
    createdAt: Date.now(),
    lastModifiedAt: Date.now(),
  };

  const makePurchase = (overrides: Partial<PurchaseEntity> = {}): Partial<PurchaseEntity> => ({
    id: 'purchase-1',
    customerId: testCustomer.id,
    productId: testProduct.id,
    productSku: testProduct.sku,
    productName: testProduct.name,
    quantity: 1,
    priceAtPurchase: testProduct.price,
    totalAmount: testProduct.price,
    discountAmount: 0,
    promoCodeId: null,
    shipmentId: 'ship-123',
    status: PurchaseStatus.Pending,
    refundedAmount: 0,
    settledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const savedPurchase = makePurchase();

    mockManager = {
      create: jest.fn().mockImplementation((_entity, data) => ({
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      })),
      save: jest.fn().mockImplementation((data) => Promise.resolve({
        ...savedPurchase,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      })),
      findOne: jest.fn().mockResolvedValue(savedPurchase),
      query: jest.fn().mockResolvedValue([]),
    };

    mockCreditService = {
      acquireCustomerLock: jest.fn().mockResolvedValue(undefined),
      computeBalanceInTx: jest.fn().mockResolvedValue(2000),
    };

    mockCustomerApi = {
      getCustomer: jest.fn().mockResolvedValue(testCustomer),
    };

    mockProductApi = {
      getProduct: jest.fn().mockResolvedValue(testProduct),
      updateProduct: jest.fn().mockResolvedValue(testProduct),
      decrementStock: jest.fn().mockResolvedValue({ ...testProduct, stock: testProduct.stock - 1 }),
      incrementStock: jest.fn().mockResolvedValue({ ...testProduct, stock: testProduct.stock + 1 }),
    };

    mockShipmentApi = {
      createShipment: jest.fn().mockResolvedValue({ id: 'ship-123' }),
      updateShipmentStatus: jest.fn().mockResolvedValue({ id: 'ship-123', status: 'delivered' }),
    };

    mockPromoService = {
      validateAndApply: jest.fn().mockResolvedValue({ discountAmount: 100, promoCodeId: 'promo-1' }),
    };

    mockPurchaseRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      }),
      findOne: jest.fn().mockResolvedValue(null),
    };

    mockRefundRequestRepo = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'rr-1', ...data })),
      findOne: jest.fn().mockResolvedValue(null),
      createQueryBuilder: jest.fn().mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    };

    mockCompanyLedgerRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ balance: '0' }),
      }),
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseService,
        { provide: getRepositoryToken(PurchaseEntity), useValue: mockPurchaseRepo },
        { provide: getRepositoryToken(TransactionEntity), useValue: {} },
        { provide: getRepositoryToken(CompanyLedgerEntity), useValue: mockCompanyLedgerRepo },
        { provide: getRepositoryToken(RefundRequestEntity), useValue: mockRefundRequestRepo },
        { provide: getRepositoryToken(SupportUserEntity), useValue: {} },
        { provide: DataSource, useValue: { transaction: jest.fn((cb) => cb(mockManager)) } },
        { provide: CreditService, useValue: mockCreditService },
        { provide: CustomerApiService, useValue: mockCustomerApi },
        { provide: ProductApiService, useValue: mockProductApi },
        { provide: ShipmentApiService, useValue: mockShipmentApi },
        { provide: PromoService, useValue: mockPromoService },
        { provide: KafkaService, useValue: { produce: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<PurchaseService>(PurchaseService);
  });

  // ─── Purchase Creation ────────────────────────────────────────────

  describe('createPurchase', () => {
    it('should create a purchase with status pending and deduct credit', async () => {
      const result = await service.createPurchase({
        customerId: testCustomer.id,
        productId: testProduct.id,
        quantity: 1,
      });

      expect(mockCreditService.acquireCustomerLock).toHaveBeenCalled();
      expect(mockProductApi.getProduct).toHaveBeenCalledWith(testProduct.id);
      expect(mockCustomerApi.getCustomer).toHaveBeenCalledWith(testCustomer.id);
      expect(mockShipmentApi.createShipment).toHaveBeenCalled();
      expect(mockProductApi.decrementStock).toHaveBeenCalledWith(testProduct.id, 1);
      expect(result.status).toBe('pending');
    });

    it('should use provided shippingAddress and skip Customer API lookup', async () => {
      const customAddress = { line1: '999 Custom St', city: 'Denver', postalCode: '80202', state: 'CO', country: 'US' };

      await service.createPurchase({
        customerId: testCustomer.id,
        productId: testProduct.id,
        quantity: 1,
        shippingAddress: customAddress,
      });

      // Should NOT call Customer API since address was provided
      expect(mockCustomerApi.getCustomer).not.toHaveBeenCalled();
      // Should use the provided address for shipment
      expect(mockShipmentApi.createShipment).toHaveBeenCalledWith(
        expect.objectContaining({
          shippingAddress: customAddress,
        }),
      );
    });

    it('should create an escrow entry in company ledger on purchase', async () => {
      await service.createPurchase({
        customerId: testCustomer.id,
        productId: testProduct.id,
        quantity: 1,
      });

      expect(mockManager.create).toHaveBeenCalledWith(
        CompanyLedgerEntity,
        expect.objectContaining({
          type: CompanyLedgerType.Escrow,
          amount: testProduct.price,
        }),
      );
    });

    it('should apply promo code when provided', async () => {
      await service.createPurchase({
        customerId: testCustomer.id,
        productId: testProduct.id,
        quantity: 1,
        promoCode: 'SAVE100',
      });

      expect(mockPromoService.validateAndApply).toHaveBeenCalledWith(
        'SAVE100',
        testCustomer.id,
        testProduct.price,
        mockManager,
      );
    });

    it('should fail if credit balance is insufficient', async () => {
      (mockCreditService.computeBalanceInTx as jest.Mock).mockResolvedValue(10);

      await expect(
        service.createPurchase({
          customerId: testCustomer.id,
          productId: testProduct.id,
          quantity: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should fail if product stock is insufficient (atomic decrement rejects)', async () => {
      (mockProductApi.decrementStock as jest.Mock).mockRejectedValue(
        new Error('Insufficient stock. Available: 0, Requested: 1'),
      );

      await expect(
        service.createPurchase({
          customerId: testCustomer.id,
          productId: testProduct.id,
          quantity: 1,
        }),
      ).rejects.toThrow('Insufficient stock');
    });

    it('should rollback if shipment creation fails', async () => {
      (mockShipmentApi.createShipment as jest.Mock).mockRejectedValue(
        new Error('Shipment provider down'),
      );

      await expect(
        service.createPurchase({
          customerId: testCustomer.id,
          productId: testProduct.id,
          quantity: 1,
        }),
      ).rejects.toThrow('Shipment provider down');
    });

    it('should restore stock if shipment creation fails after stock was decremented', async () => {
      (mockShipmentApi.createShipment as jest.Mock).mockRejectedValue(
        new Error('Shipment provider down'),
      );
      (mockCreditService.computeBalanceInTx as jest.Mock).mockResolvedValue(5000);

      await expect(
        service.createPurchase({
          customerId: testCustomer.id,
          productId: testProduct.id,
          quantity: 2,
        }),
      ).rejects.toThrow('Shipment provider down');

      // Stock was decremented, then should be restored via incrementStock
      expect(mockProductApi.decrementStock).toHaveBeenCalledWith(testProduct.id, 2);
      expect(mockProductApi.incrementStock).toHaveBeenCalledWith(testProduct.id, 2);
    });
  });

  // ─── Settlement ───────────────────────────────────────────────────

  describe('updateShipmentStatus', () => {
    it('should auto-settle when shipment is delivered', async () => {
      const pendingPurchase = makePurchase({ status: PurchaseStatus.Pending });
      mockPurchaseRepo.findOne.mockResolvedValue(pendingPurchase);
      (mockManager.findOne as jest.Mock).mockResolvedValue(pendingPurchase);

      await service.updateShipmentStatus('ship-123', 'delivered');

      expect(mockShipmentApi.updateShipmentStatus).toHaveBeenCalledWith('ship-123', 'delivered');
      expect(mockManager.save).toHaveBeenCalled();
    });

    it('should create escrow release and sale entries on settlement', async () => {
      const pendingPurchase = makePurchase({ status: PurchaseStatus.Pending });
      mockPurchaseRepo.findOne.mockResolvedValue(pendingPurchase);
      (mockManager.findOne as jest.Mock).mockResolvedValue(pendingPurchase);

      await service.updateShipmentStatus('ship-123', 'delivered');

      expect(mockManager.create).toHaveBeenCalledWith(
        CompanyLedgerEntity,
        expect.objectContaining({
          type: CompanyLedgerType.EscrowRelease,
          amount: -Number(pendingPurchase.totalAmount),
        }),
      );
      expect(mockManager.create).toHaveBeenCalledWith(
        CompanyLedgerEntity,
        expect.objectContaining({
          type: CompanyLedgerType.Sale,
          amount: Number(pendingPurchase.totalAmount),
        }),
      );
    });

    it('should update shipment status without settling for non-delivered status', async () => {
      await service.updateShipmentStatus('ship-123', 'shipped');

      expect(mockShipmentApi.updateShipmentStatus).toHaveBeenCalledWith('ship-123', 'shipped');
    });

    it('should block shipment updates for cancelled orders', async () => {
      mockPurchaseRepo.findOne.mockResolvedValue(
        makePurchase({ status: PurchaseStatus.Cancelled }),
      );

      await expect(
        service.updateShipmentStatus('ship-123', 'shipped'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Refund Request ───────────────────────────────────────────────

  describe('createRefundRequest', () => {
    // ─── Return (full refund, 5-min window) ──────────────────────

    it('should create a return request for a settled purchase within 5-min window', async () => {
      mockPurchaseRepo.findOne.mockResolvedValue(
        makePurchase({ status: PurchaseStatus.Settled, settledAt: new Date(), totalAmount: 1000, refundedAmount: 0 }),
      );

      const result = await service.createRefundRequest(
        testCustomer.id,
        'purchase-1',
        RefundRequestType.Return,
        'Product defective',
      );

      expect(result.status).toBe('pending');
      expect(result.type).toBe('return');
      expect(result.requestedAmount).toBe(1000); // full refund
    });

    it('should fail return if 5-min window has expired', async () => {
      const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
      mockPurchaseRepo.findOne.mockResolvedValue(
        makePurchase({ status: PurchaseStatus.Settled, settledAt: sixMinutesAgo }),
      );

      await expect(
        service.createRefundRequest(testCustomer.id, 'purchase-1', RefundRequestType.Return, 'Want return'),
      ).rejects.toThrow(BadRequestException);
    });

    // ─── Refund (partial, max 50%, 10-min window) ────────────────

    it('should create a refund request with amount up to 50%', async () => {
      mockPurchaseRepo.findOne.mockResolvedValue(
        makePurchase({ status: PurchaseStatus.Settled, settledAt: new Date(), totalAmount: 1000, refundedAmount: 0 }),
      );

      const result = await service.createRefundRequest(
        testCustomer.id,
        'purchase-1',
        RefundRequestType.Refund,
        'Partial issue',
        400,
      );

      expect(result.status).toBe('pending');
      expect(result.type).toBe('refund');
      expect(result.requestedAmount).toBe(400);
    });

    it('should fail refund if amount exceeds 50% of order total', async () => {
      mockPurchaseRepo.findOne.mockResolvedValue(
        makePurchase({ status: PurchaseStatus.Settled, settledAt: new Date(), totalAmount: 1000, refundedAmount: 0 }),
      );

      await expect(
        service.createRefundRequest(testCustomer.id, 'purchase-1', RefundRequestType.Refund, 'Want more', 600),
      ).rejects.toThrow(BadRequestException);
    });

    it('should fail refund if no amount specified', async () => {
      mockPurchaseRepo.findOne.mockResolvedValue(
        makePurchase({ status: PurchaseStatus.Settled, settledAt: new Date() }),
      );

      await expect(
        service.createRefundRequest(testCustomer.id, 'purchase-1', RefundRequestType.Refund, 'No amount'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow refund within 10-min window but after 5-min', async () => {
      const sevenMinutesAgo = new Date(Date.now() - 7 * 60 * 1000);
      mockPurchaseRepo.findOne.mockResolvedValue(
        makePurchase({ status: PurchaseStatus.Settled, settledAt: sevenMinutesAgo, totalAmount: 1000, refundedAmount: 0 }),
      );

      const result = await service.createRefundRequest(
        testCustomer.id,
        'purchase-1',
        RefundRequestType.Refund,
        'Late refund',
        300,
      );

      expect(result.status).toBe('pending');
    });

    it('should fail refund if 10-min window has expired', async () => {
      const elevenMinutesAgo = new Date(Date.now() - 11 * 60 * 1000);
      mockPurchaseRepo.findOne.mockResolvedValue(
        makePurchase({ status: PurchaseStatus.Settled, settledAt: elevenMinutesAgo }),
      );

      await expect(
        service.createRefundRequest(testCustomer.id, 'purchase-1', RefundRequestType.Refund, 'Too late', 100),
      ).rejects.toThrow(BadRequestException);
    });

    // ─── Common validations ──────────────────────────────────────

    it('should fail if purchase is still pending (not settled)', async () => {
      mockPurchaseRepo.findOne.mockResolvedValue(
        makePurchase({ status: PurchaseStatus.Pending }),
      );

      await expect(
        service.createRefundRequest(testCustomer.id, 'purchase-1', RefundRequestType.Refund, 'Want refund', 100),
      ).rejects.toThrow(BadRequestException);
    });

    it('should fail if customer does not own the purchase', async () => {
      mockPurchaseRepo.findOne.mockResolvedValue(
        makePurchase({ status: PurchaseStatus.Settled, customerId: 'other-customer' }),
      );

      await expect(
        service.createRefundRequest(testCustomer.id, 'purchase-1', RefundRequestType.Refund, 'Want refund', 100),
      ).rejects.toThrow(BadRequestException);
    });

    it('should fail if a pending refund request already exists', async () => {
      mockPurchaseRepo.findOne.mockResolvedValue(
        makePurchase({ status: PurchaseStatus.Settled, settledAt: new Date() }),
      );
      mockRefundRequestRepo.findOne.mockResolvedValue({ id: 'existing', status: 'pending' });

      await expect(
        service.createRefundRequest(testCustomer.id, 'purchase-1', RefundRequestType.Refund, 'Want refund', 100),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Approve Refund ───────────────────────────────────────────────

  describe('approveRefundRequest', () => {
    it('should approve a pending refund request', async () => {
      const purchase = makePurchase({ status: PurchaseStatus.Settled, totalAmount: 1000, refundedAmount: 0 });
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce({ id: 'rr-1', purchaseId: 'purchase-1', status: 'pending', reason: 'Defective' })
        .mockResolvedValueOnce(purchase);

      const result = await service.approveRefundRequest('rr-1', 500, 'Partial refund approved');

      expect(mockCreditService.acquireCustomerLock).toHaveBeenCalled();
      expect(result.status).toBe('approved');
      expect(result.approvedAmount).toBe(500);
    });

    it('should throw if refund request not found', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.approveRefundRequest('nonexistent', 100)).rejects.toThrow(NotFoundException);
    });

    it('should throw if refund request is already processed', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue({
        id: 'rr-1',
        status: 'approved',
      });

      await expect(service.approveRefundRequest('rr-1', 100)).rejects.toThrow(BadRequestException);
    });

    it('should throw if approved amount exceeds maximum refundable', async () => {
      const purchase = makePurchase({ status: PurchaseStatus.Settled, totalAmount: 100, refundedAmount: 80 });
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce({ id: 'rr-1', purchaseId: 'purchase-1', status: 'pending', reason: 'test' })
        .mockResolvedValueOnce(purchase);

      await expect(service.approveRefundRequest('rr-1', 30)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Reject Refund ────────────────────────────────────────────────

  describe('rejectRefundRequest', () => {
    it('should reject a pending refund request', async () => {
      mockRefundRequestRepo.findOne.mockResolvedValue({
        id: 'rr-1',
        status: PurchaseStatus.Pending,
        reviewerNote: null,
      });

      const result = await service.rejectRefundRequest('rr-1', 'Not eligible');

      expect(result.status).toBe('rejected');
      expect(result.reviewerNote).toBe('Not eligible');
    });

    it('should throw if refund request not found', async () => {
      mockRefundRequestRepo.findOne.mockResolvedValue(null);

      await expect(service.rejectRefundRequest('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw if refund request is already processed', async () => {
      mockRefundRequestRepo.findOne.mockResolvedValue({
        id: 'rr-1',
        status: 'approved',
      });

      await expect(service.rejectRefundRequest('rr-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Order Cancellation ──────────────────────────────────────────

  describe('cancelPurchase', () => {
    it('should release escrow on cancellation', async () => {
      const pendingPurchase = makePurchase({ status: PurchaseStatus.Pending });
      mockPurchaseRepo.findOne.mockResolvedValue(pendingPurchase);
      (mockShipmentApi as any).getShipment = jest.fn().mockResolvedValue({ status: 'processing' });

      await service.cancelPurchase('purchase-1', testCustomer.id);

      expect(mockManager.create).toHaveBeenCalledWith(
        CompanyLedgerEntity,
        expect.objectContaining({
          type: CompanyLedgerType.EscrowRelease,
          amount: -Number(pendingPurchase.totalAmount),
        }),
      );
    });

    it('should credit customer, restore stock, and cancel purchase', async () => {
      const pendingPurchase = makePurchase({ status: PurchaseStatus.Pending });
      mockPurchaseRepo.findOne.mockResolvedValue(pendingPurchase);
      (mockShipmentApi as any).getShipment = jest.fn().mockResolvedValue({ status: 'processing' });

      const result = await service.cancelPurchase('purchase-1', testCustomer.id);

      expect(mockProductApi.incrementStock).toHaveBeenCalledWith(testProduct.id, 1);
      expect(result.status).toBe('cancelled');
    });

    it('should cancel the shipment when order is cancelled', async () => {
      const pendingPurchase = makePurchase({ status: PurchaseStatus.Pending });
      mockPurchaseRepo.findOne.mockResolvedValue(pendingPurchase);
      (mockShipmentApi as any).getShipment = jest.fn().mockResolvedValue({ status: 'processing' });
      (mockShipmentApi as any).updateShipmentStatus = jest.fn().mockResolvedValue({ id: 'ship-123', status: 'cancelled' });

      await service.cancelPurchase('purchase-1', testCustomer.id);

      expect(mockShipmentApi.updateShipmentStatus).toHaveBeenCalledWith('ship-123', 'cancelled');
    });

    it('should fail cancellation if shipment is already shipped', async () => {
      const pendingPurchase = makePurchase({ status: PurchaseStatus.Pending });
      mockPurchaseRepo.findOne.mockResolvedValue(pendingPurchase);
      (mockShipmentApi as any).getShipment = jest.fn().mockResolvedValue({ status: 'shipped' });

      await expect(
        service.cancelPurchase('purchase-1', testCustomer.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('should fail if purchase is not pending', async () => {
      mockPurchaseRepo.findOne.mockResolvedValue(
        makePurchase({ status: PurchaseStatus.Settled }),
      );

      await expect(
        service.cancelPurchase('purchase-1', testCustomer.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('should fail if customer does not own the purchase', async () => {
      mockPurchaseRepo.findOne.mockResolvedValue(
        makePurchase({ status: PurchaseStatus.Pending, customerId: 'other-customer' }),
      );

      await expect(
        service.cancelPurchase('purchase-1', testCustomer.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Company Balance ──────────────────────────────────────────────

  describe('getCompanyBalance', () => {
    it('should return company balance and ledger', async () => {
      const result = await service.getCompanyBalance();

      expect(result.balance).toBe(0);
      expect(result.ledger).toEqual([]);
    });
  });
});
