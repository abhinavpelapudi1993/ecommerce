import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, SelectQueryBuilder } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { CreditService } from '../../src/credit/credit.service';
import { CreditLedgerEntity } from '../../src/credit/entities/credit-ledger.entity';

describe('CreditService', () => {
  let service: CreditService;
  let mockRepo: Partial<Record<keyof ReturnType<typeof getRepositoryToken>, jest.Mock>>;
  let mockDataSource: Partial<DataSource>;
  let mockManager: Partial<EntityManager>;

  const customerId = 'c0a80001-0000-4000-8000-000000000001';

  beforeEach(async () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ balance: '150.00' }),
    } as unknown as SelectQueryBuilder<CreditLedgerEntity>;

    mockRepo = {
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    mockManager = {
      create: jest.fn().mockImplementation((_entity, data) => data),
      save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'new-id', ...data })),
      find: jest.fn().mockResolvedValue([]),
      query: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    mockDataSource = {
      transaction: jest.fn().mockImplementation((cb) => cb(mockManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditService,
        { provide: getRepositoryToken(CreditLedgerEntity), useValue: mockRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<CreditService>(CreditService);
  });

  describe('getBalance', () => {
    it('should return the computed balance and ledger entries', async () => {
      const result = await service.getBalance(customerId);

      expect(result.customerId).toBe(customerId);
      expect(result.balance).toBe(150);
      expect(result.ledger).toEqual([]);
    });
  });

  describe('grantCredit', () => {
    it('should create a positive ledger entry', async () => {
      const result = await service.grantCredit(customerId, {
        amount: 50,
        reason: 'Welcome bonus',
      });

      expect(mockManager.create).toHaveBeenCalledWith(CreditLedgerEntity, {
        customerId,
        amount: 50,
        type: 'grant',
        reason: 'Welcome bonus',
      });
      expect(mockManager.save).toHaveBeenCalled();
      expect(result.customerId).toBe(customerId);
    });

    it('should acquire advisory lock before modifying', async () => {
      await service.grantCredit(customerId, { amount: 25, reason: 'Bonus' });
      expect(mockManager.query).toHaveBeenCalledWith(
        'SELECT pg_advisory_xact_lock($1)',
        expect.any(Array),
      );
    });
  });

  describe('deductCredit', () => {
    it('should throw if insufficient balance', async () => {
      // balance is 150 from mock
      await expect(
        service.deductCredit(customerId, { amount: 200, reason: 'Withdrawal' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a negative ledger entry when balance is sufficient', async () => {
      const result = await service.deductCredit(customerId, {
        amount: 50,
        reason: 'Manual deduction',
      });

      expect(mockManager.create).toHaveBeenCalledWith(CreditLedgerEntity, {
        customerId,
        amount: -50,
        type: 'deduct',
        reason: 'Manual deduction',
      });
      expect(result.customerId).toBe(customerId);
    });
  });
});
