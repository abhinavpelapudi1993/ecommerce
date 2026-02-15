import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggingModule } from '@ecommerce/logging';
import { getDatabaseConfig } from './config/database.config';
import { ConfigModule } from './config/config.module';
import { CacheModule } from './cache/cache.module';
import { ExternalModule } from './external/external.module';
import { CreditModule } from './credit/credit.module';
import { PurchaseModule } from './purchase/purchase.module';
import { PromoModule } from './promo/promo.module';
import { CommonModule } from './common/common.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    LoggingModule,
    TypeOrmModule.forRoot(getDatabaseConfig()),
    ScheduleModule.forRoot(),
    ConfigModule,
    CacheModule,
    CommonModule,
    ExternalModule,
    CreditModule,
    PurchaseModule,
    PromoModule,
    KafkaModule,
  ],
})
export class AppModule {}
