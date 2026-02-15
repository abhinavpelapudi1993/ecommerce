import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { CreditLedgerEntity, CreditEntryType } from './entities/credit-ledger.entity';
import type { GrantCreditDto } from './dto/grant-credit.dto';
import type { DeductCreditDto } from './dto/deduct-credit.dto';
import type { CreditBalanceResponse, CreditLedgerEntryResponse } from './dto/credit-balance.dto';

@Injectable()
export class CreditService {
  constructor(
    @InjectRepository(CreditLedgerEntity)
    private readonly ledgerRepo: Repository<CreditLedgerEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getBalance(customerId: string): Promise<CreditBalanceResponse> {
    const balance = await this.computeBalance(customerId);
    const ledger = await this.ledgerRepo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return {
      customerId,
      balance,
      ledger: ledger.map(this.toLedgerResponse),
    };
  }

  async grantCredit(customerId: string, dto: GrantCreditDto): Promise<CreditBalanceResponse> {
    return this.dataSource.transaction(async (manager) => {
      await this.acquireCustomerLock(manager, customerId);

      const entry = manager.create(CreditLedgerEntity, {
        customerId,
        amount: dto.amount,
        type: CreditEntryType.Grant,
        reason: dto.reason,
      });
      await manager.save(entry);

      const balance = await this.computeBalanceInTx(manager, customerId);
      const ledger = await manager.find(CreditLedgerEntity, {
        where: { customerId },
        order: { createdAt: 'DESC' },
        take: 50,
      });

      return {
        customerId,
        balance,
        ledger: ledger.map(this.toLedgerResponse),
      };
    });
  }

  async deductCredit(customerId: string, dto: DeductCreditDto): Promise<CreditBalanceResponse> {
    return this.dataSource.transaction(async (manager) => {
      await this.acquireCustomerLock(manager, customerId);

      const balance = await this.computeBalanceInTx(manager, customerId);
      if (balance < dto.amount) {
        throw new BadRequestException(
          `Insufficient balance. Available: ${balance}, Requested: ${dto.amount}`,
        );
      }

      const entry = manager.create(CreditLedgerEntity, {
        customerId,
        amount: -dto.amount,
        type: CreditEntryType.Deduct,
        reason: dto.reason,
      });
      await manager.save(entry);

      const newBalance = balance - dto.amount;
      const ledger = await manager.find(CreditLedgerEntity, {
        where: { customerId },
        order: { createdAt: 'DESC' },
        take: 50,
      });

      return {
        customerId,
        balance: newBalance,
        ledger: ledger.map(this.toLedgerResponse),
      };
    });
  }

  private async computeBalance(customerId: string): Promise<number> {
    const result = await this.ledgerRepo
      .createQueryBuilder('entry')
      .select('COALESCE(SUM(entry.amount), 0)', 'balance')
      .where('entry.customer_id = :customerId', { customerId })
      .getRawOne<{ balance: string }>();

    return parseFloat(result?.balance || '0');
  }

  async computeBalanceInTx(manager: EntityManager, customerId: string): Promise<number> {
    const result = await manager
      .createQueryBuilder(CreditLedgerEntity, 'entry')
      .select('COALESCE(SUM(entry.amount), 0)', 'balance')
      .where('entry.customer_id = :customerId', { customerId })
      .getRawOne<{ balance: string }>();

    return parseFloat(result?.balance || '0');
  }

  async acquireCustomerLock(manager: EntityManager, customerId: string): Promise<void> {
    const lockKey = this.hashCustomerId(customerId);
    await manager.query('SELECT pg_advisory_xact_lock($1)', [lockKey]);
  }

  private hashCustomerId(customerId: string): number {
    let hash = 0;
    for (let i = 0; i < customerId.length; i++) {
      const char = customerId.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return hash;
  }

  private toLedgerResponse(entry: CreditLedgerEntity): CreditLedgerEntryResponse {
    return {
      id: entry.id,
      amount: Number(entry.amount),
      type: entry.type,
      reason: entry.reason,
      referenceId: entry.referenceId,
      createdAt: entry.createdAt.toISOString(),
    };
  }
}
