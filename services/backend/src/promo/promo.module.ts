import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoCodeEntity } from './entities/promo-code.entity';
import { PromoUsageEntity } from './entities/promo-usage.entity';
import { PromoController } from './promo.controller';
import { PromoService } from './promo.service';

@Module({
  imports: [TypeOrmModule.forFeature([PromoCodeEntity, PromoUsageEntity])],
  controllers: [PromoController],
  providers: [PromoService],
  exports: [PromoService],
})
export class PromoModule {}
