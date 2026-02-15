import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KafkaService } from './kafka.service';
import { SettlementRetryHandler } from './handlers/settlement-retry.handler';
import { RefundRetryHandler } from './handlers/refund-retry.handler';
import { PurchaseEntity } from '../purchase/entities/purchase.entity';
import { TransactionEntity } from '../purchase/entities/transaction.entity';
import { CompanyLedgerEntity } from '../purchase/entities/company-ledger.entity';
import { RefundRequestEntity } from '../purchase/entities/refund-request.entity';
import { CreditLedgerEntity } from '../credit/entities/credit-ledger.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseEntity,
      TransactionEntity,
      CompanyLedgerEntity,
      RefundRequestEntity,
      CreditLedgerEntity,
    ]),
  ],
  providers: [KafkaService, SettlementRetryHandler, RefundRetryHandler],
  exports: [KafkaService],
})
export class KafkaModule {}
