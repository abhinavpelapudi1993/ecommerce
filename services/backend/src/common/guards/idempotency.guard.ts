import {
  BadRequestException,
  CanActivate,
  ConflictException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IdempotencyService } from '../services/idempotency.service';

@Injectable()
export class IdempotencyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isIdempotencyRequired = this.reflector.get<boolean>(
      'idempotency_required',
      context.getHandler(),
    );

    if (!isIdempotencyRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-idempotency-key'] as string | undefined;

    if (!key) {
      throw new BadRequestException('X-Idempotency-Key header is required');
    }

    const result = await this.idempotencyService.checkAndAcquire(key);

    if (result === 'new') {
      return true;
    }

    if (result === 'in-progress') {
      throw new ConflictException('Request is already being processed');
    }

    request.idempotencyCachedResponse = result.response;
    return true;
  }
}
