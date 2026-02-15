import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { IdempotencyService } from '../services/idempotency.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idempotencyService: IdempotencyService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.idempotencyCachedResponse) {
      return of(request.idempotencyCachedResponse);
    }

    return next.handle().pipe(
      tap((response) => {
        const key = request.headers['x-idempotency-key'] as string | undefined;

        if (key) {
          this.idempotencyService.storeResponse(key, response);
        }
      }),
    );
  }
}
