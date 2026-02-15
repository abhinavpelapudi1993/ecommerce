import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseEntity } from './entities/purchase.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { CompanyLedgerEntity } from './entities/company-ledger.entity';
import { RefundRequestEntity } from './entities/refund-request.entity';
import { SupportUserEntity } from './entities/support-user.entity';
import { PurchaseController } from './purchase.controller';
import { PurchaseService } from './purchase.service';
import { CreditModule } from '../credit/credit.module';
import { ExternalModule } from '../external/external.module';
import { PromoModule } from '../promo/promo.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseEntity,
      TransactionEntity,
      CompanyLedgerEntity,
      RefundRequestEntity,
      SupportUserEntity,
    ]),
    CreditModule,
    ExternalModule,
    PromoModule,
    KafkaModule,
  ],
  controllers: [PurchaseController],
  providers: [PurchaseService],
  exports: [PurchaseService],
})
export class PurchaseModule {}
