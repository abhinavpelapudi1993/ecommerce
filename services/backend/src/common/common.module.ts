import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { IdempotencyKeyEntity } from './entities/idempotency-key.entity';
import { IdempotencyGuard } from './guards/idempotency.guard';
import { IdempotencyInterceptor } from './interceptors/idempotency.interceptor';
import { IdempotencyCleanupService } from './services/idempotency-cleanup.service';
import { IdempotencyService } from './services/idempotency.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([IdempotencyKeyEntity])],
  providers: [
    IdempotencyService,
    IdempotencyGuard,
    IdempotencyCleanupService,
    IdempotencyInterceptor,
  ],
  exports: [IdempotencyService, IdempotencyGuard, IdempotencyInterceptor],
})
export class CommonModule {}
