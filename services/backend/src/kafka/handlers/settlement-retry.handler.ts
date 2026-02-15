import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { KafkaService } from '../kafka.service';
import { PurchaseEntity, PurchaseStatus } from '../../purchase/entities/purchase.entity';
import { TransactionEntity, TransactionType, TransactionStatus } from '../../purchase/entities/transaction.entity';
import { CompanyLedgerEntity, CompanyLedgerType } from '../../purchase/entities/company-ledger.entity';

@Injectable()
export class SettlementRetryHandler implements OnModuleInit {
  private readonly logger = new Logger(SettlementRetryHandler.name);

  constructor(
    private readonly kafkaService: KafkaService,
    @InjectRepository(PurchaseEntity)
    private readonly purchaseRepo: Repository<PurchaseEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
    @InjectRepository(CompanyLedgerEntity)
    private readonly companyLedgerRepo: Repository<CompanyLedgerEntity>,
    private readonly dataSource: DataSource,
  ) {}

  onModuleInit(): void {
    this.kafkaService.registerHandler('settlement-retry', this.handle.bind(this));
    this.logger.log('Settlement retry handler registered');
  }

  async handle(data: { purchaseId: string; retryCount: number }): Promise<void> {
    const { purchaseId, retryCount } = data;
    this.logger.log(`Processing settlement retry for purchase ${purchaseId}, attempt ${retryCount}`);

    const purchase = await this.purchaseRepo.findOneBy({ id: purchaseId });

    if (!purchase) {
      this.logger.error(`Purchase not found: ${purchaseId}`);
      return;
    }

    if (purchase.status === PurchaseStatus.Settled) {
      this.logger.log(`Purchase ${purchaseId} is already settled, skipping`);
      return;
    }

    if (purchase.status !== PurchaseStatus.SettlementFailed) {
      this.logger.warn(`Purchase ${purchaseId} has unexpected status: ${purchase.status}, skipping`);
      return;
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        // Release escrow (idempotency: check if already released)
        const existingRelease = await manager.findOne(CompanyLedgerEntity, {
          where: {
            referenceId: purchaseId,
            type: CompanyLedgerType.EscrowRelease,
          },
        });

        if (!existingRelease) {
          const escrowRelease = manager.create(CompanyLedgerEntity, {
            referenceId: purchaseId,
            type: CompanyLedgerType.EscrowRelease,
            amount: -Number(purchase.totalAmount),
            reason: `Escrow released via settlement retry for purchase ${purchaseId}`,
          });
          await manager.save(escrowRelease);
        }

        const ledgerEntry = manager.create(CompanyLedgerEntity, {
          referenceId: purchaseId,
          type: CompanyLedgerType.Sale,
          amount: purchase.totalAmount,
          reason: `Settlement retry for purchase ${purchaseId}`,
        });
        await manager.save(ledgerEntry);

        purchase.status = PurchaseStatus.Settled;
        purchase.settledAt = new Date();
        purchase.errorMessage = null;
        await manager.save(purchase);

        const transaction = manager.create(TransactionEntity, {
          purchaseId,
          customerId: purchase.customerId,
          type: TransactionType.ShipmentDelivered,
          amount: purchase.totalAmount,
          status: TransactionStatus.Completed,
          description: 'Settlement completed via retry',
        });
        await manager.save(transaction);
      });

      this.logger.log(`Settlement retry succeeded for purchase ${purchaseId}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Settlement retry failed for purchase ${purchaseId}: ${errorMsg}`);

      purchase.errorMessage = errorMsg;
      await this.purchaseRepo.save(purchase);

      if (retryCount < 3) {
        this.logger.log(`Scheduling retry ${retryCount + 1} for purchase ${purchaseId}`);
        await this.kafkaService.produce('settlement-retry', {
          purchaseId,
          retryCount: retryCount + 1,
        });
      } else {
        this.logger.error(`Max retries exceeded for settlement of purchase ${purchaseId}`);
      }
    }
  }
}
