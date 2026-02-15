import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AppLogger } from './app-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap((responseBody) => {
        const res = context.switchToHttp().getResponse();
        this.logger.logRequest({
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          responseTimeMs: Date.now() - startTime,
          requestBody: this.summarize(req.body),
          responseBody: this.summarize(responseBody),
          userAgent: req.headers?.['user-agent'],
          ip: req.ip,
        });
      }),
      catchError((error) => {
        this.logger.logRequest({
          method: req.method,
          path: req.originalUrl,
          statusCode: error.status || 500,
          responseTimeMs: Date.now() - startTime,
          requestBody: this.summarize(req.body),
          error: error.message,
          errorName: error.name,
          userAgent: req.headers?.['user-agent'],
          ip: req.ip,
        });
        return throwError(() => error);
      }),
    );
  }

  private summarize(body: unknown): unknown {
    if (!body) return undefined;
    const str = JSON.stringify(body);
    if (str.length > 1024) {
      return str.substring(0, 1024) + '...[truncated]';
    }
    return body;
  }
}
