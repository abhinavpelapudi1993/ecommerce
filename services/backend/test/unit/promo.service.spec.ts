import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { PromoService } from '../../src/promo/promo.service';
import { PromoCodeEntity } from '../../src/promo/entities/promo-code.entity';
import { PromoUsageEntity } from '../../src/promo/entities/promo-usage.entity';

describe('PromoService', () => {
  let service: PromoService;
  let mockPromoRepo: Record<string, jest.Mock>;
  let mockUsageRepo: Record<string, jest.Mock>;

  const validPromo: Partial<PromoCodeEntity> = {
    id: 'promo-1',
    code: 'SAVE20',
    discountType: 'percentage',
    discountValue: 20,
    maxUses: 100,
    currentUses: 5,
    minPurchase: 50,
    expiresAt: new Date(Date.now() + 86400000),
    isActive: true,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockPromoRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'promo-new', ...data })),
    };

    mockUsageRepo = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromoService,
        { provide: getRepositoryToken(PromoCodeEntity), useValue: mockPromoRepo },
        { provide: getRepositoryToken(PromoUsageEntity), useValue: mockUsageRepo },
      ],
    }).compile();

    service = module.get<PromoService>(PromoService);
  });

  describe('createPromo', () => {
    it('should create a new promo code', async () => {
      mockPromoRepo.findOne.mockResolvedValue(null);

      const result = await service.createPromo({
        code: 'NEWCODE',
        discountType: 'fixed',
        discountValue: 25,
      });

      expect(result.code).toBe('NEWCODE');
      expect(mockPromoRepo.save).toHaveBeenCalled();
    });

    it('should reject duplicate codes', async () => {
      mockPromoRepo.findOne.mockResolvedValue(validPromo);

      await expect(
        service.createPromo({
          code: 'SAVE20',
          discountType: 'percentage',
          discountValue: 20,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validatePromo', () => {
    it('should return valid for a usable promo', async () => {
      mockPromoRepo.findOne.mockResolvedValue(validPromo);

      const result = await service.validatePromo('SAVE20', 100);

      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(20); // 20% of 100
    });

    it('should return invalid for a non-existent code', async () => {
      mockPromoRepo.findOne.mockResolvedValue(null);

      const result = await service.validatePromo('FAKE', 100);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Promo code not found');
    });

    it('should return invalid for an expired promo', async () => {
      mockPromoRepo.findOne.mockResolvedValue({
        ...validPromo,
        expiresAt: new Date(Date.now() - 86400000),
      });

      const result = await service.validatePromo('SAVE20', 100);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('expired');
    });

    it('should return invalid when usage limit reached', async () => {
      mockPromoRepo.findOne.mockResolvedValue({
        ...validPromo,
        currentUses: 100,
        maxUses: 100,
      });

      const result = await service.validatePromo('SAVE20', 100);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('limit');
    });

    it('should return invalid when below minimum purchase', async () => {
      mockPromoRepo.findOne.mockResolvedValue(validPromo);

      const result = await service.validatePromo('SAVE20', 30);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('Minimum');
    });

    it('should cap fixed discount to purchase amount', async () => {
      mockPromoRepo.findOne.mockResolvedValue({
        ...validPromo,
        discountType: 'fixed',
        discountValue: 200,
        minPurchase: 0,
      });

      const result = await service.validatePromo('SAVE20', 100);

      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(100); // capped at purchase amount
    });
  });
});
