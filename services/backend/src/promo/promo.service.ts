import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { PromoCodeEntity } from './entities/promo-code.entity';
import { PromoUsageEntity } from './entities/promo-usage.entity';
import type { CreatePromoDto } from './dto/create-promo.dto';
import type { ValidatePromoResponse } from './dto/validate-promo.dto';

interface ApplyResult {
  discountAmount: number;
  promoCodeId: string;
}

@Injectable()
export class PromoService {
  constructor(
    @InjectRepository(PromoCodeEntity)
    private readonly promoRepo: Repository<PromoCodeEntity>,
    @InjectRepository(PromoUsageEntity)
    private readonly usageRepo: Repository<PromoUsageEntity>,
  ) {}

  async createPromo(dto: CreatePromoDto): Promise<PromoCodeEntity> {
    const existing = await this.promoRepo.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BadRequestException(`Promo code "${dto.code}" already exists`);
    }

    const promo = this.promoRepo.create({
      code: dto.code.toUpperCase(),
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      maxUses: dto.maxUses ?? null,
      minPurchase: dto.minPurchase ?? 0,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      isActive: dto.isActive ?? true,
    });

    return this.promoRepo.save(promo);
  }

  async listPromos(): Promise<PromoCodeEntity[]> {
    return this.promoRepo.find({ order: { createdAt: 'DESC' } });
  }

  async validatePromo(
    code: string,
    purchaseAmount: number,
  ): Promise<ValidatePromoResponse> {
    const promo = await this.promoRepo.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!promo) {
      return { valid: false, discountAmount: 0, message: 'Promo code not found' };
    }

    const validation = this.checkPromoValidity(promo, purchaseAmount);
    if (!validation.valid) {
      return { valid: false, discountAmount: 0, message: validation.message };
    }

    const discountAmount = this.calculateDiscount(promo, purchaseAmount);
    return { valid: true, discountAmount };
  }

  async validateAndApply(
    code: string,
    customerId: string,
    purchaseAmount: number,
    manager: EntityManager,
  ): Promise<ApplyResult> {
    const promo = await manager.findOne(PromoCodeEntity, {
      where: { code: code.toUpperCase() },
    });

    if (!promo) {
      throw new BadRequestException(`Promo code "${code}" not found`);
    }

    const validation = this.checkPromoValidity(promo, purchaseAmount);
    if (!validation.valid) {
      throw new BadRequestException(validation.message);
    }

    const discountAmount = this.calculateDiscount(promo, purchaseAmount);

    // Increment usage count
    promo.currentUses += 1;
    await manager.save(promo);

    return { discountAmount, promoCodeId: promo.id };
  }

  async recordUsage(
    manager: EntityManager,
    promoCodeId: string,
    customerId: string,
    purchaseId: string,
  ): Promise<void> {
    const usage = manager.create(PromoUsageEntity, {
      promoCodeId,
      customerId,
      purchaseId,
    });
    await manager.save(usage);
  }

  private checkPromoValidity(
    promo: PromoCodeEntity,
    purchaseAmount: number,
  ): { valid: boolean; message?: string } {
    if (!promo.isActive) {
      return { valid: false, message: 'Promo code is not active' };
    }

    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return { valid: false, message: 'Promo code has expired' };
    }

    if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) {
      return { valid: false, message: 'Promo code usage limit reached' };
    }

    if (purchaseAmount < Number(promo.minPurchase)) {
      return {
        valid: false,
        message: `Minimum purchase amount is $${Number(promo.minPurchase).toFixed(2)}`,
      };
    }

    return { valid: true };
  }

  private calculateDiscount(
    promo: PromoCodeEntity,
    purchaseAmount: number,
  ): number {
    if (promo.discountType === 'percentage') {
      const discount = purchaseAmount * (Number(promo.discountValue) / 100);
      return Math.round(discount * 100) / 100;
    }

    // Fixed discount — can't exceed purchase amount
    return Math.min(Number(promo.discountValue), purchaseAmount);
  }
}
