import { Controller, Get, Post, Body } from '@nestjs/common';
import { PromoService } from './promo.service';
import { CreatePromoDto } from './dto/create-promo.dto';
import { ValidatePromoDto, ValidatePromoResponse } from './dto/validate-promo.dto';
import type { PromoCodeEntity } from './entities/promo-code.entity';

@Controller('promos')
export class PromoController {
  constructor(private readonly promoService: PromoService) {}

  @Post()
  createPromo(@Body() dto: CreatePromoDto): Promise<PromoCodeEntity> {
    return this.promoService.createPromo(dto);
  }

  @Get()
  listPromos(): Promise<PromoCodeEntity[]> {
    return this.promoService.listPromos();
  }

  @Post('validate')
  validatePromo(@Body() dto: ValidatePromoDto): Promise<ValidatePromoResponse> {
    return this.promoService.validatePromo(dto.code, dto.purchaseAmount);
  }
}
