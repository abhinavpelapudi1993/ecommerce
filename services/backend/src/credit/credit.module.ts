import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditLedgerEntity } from './entities/credit-ledger.entity';
import { CreditController } from './credit.controller';
import { CreditService } from './credit.service';

@Module({
  imports: [TypeOrmModule.forFeature([CreditLedgerEntity])],
  controllers: [CreditController],
  providers: [CreditService],
  exports: [CreditService],
})
export class CreditModule {}
