import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { IdempotencyService } from './idempotency.service';

@Injectable()
export class IdempotencyCleanupService {
  private readonly logger = new Logger(IdempotencyCleanupService.name);

  constructor(private readonly idempotencyService: IdempotencyService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCleanup(): Promise<void> {
    this.logger.log('Running expired idempotency keys cleanup...');
    await this.idempotencyService.cleanupExpired();
    this.logger.log('Expired idempotency keys cleanup completed.');
  }
}
