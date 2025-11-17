import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { LoggerService } from './logger.service';

@Injectable()
export class CorrelationInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Generate or extract correlation ID
    const correlationId =
      request.headers['x-correlation-id'] ||
      request.headers['x-request-id'] ||
      randomUUID();

    // Attach to request for downstream use
    request.correlationId = correlationId;

    // Add to response headers
    response.setHeader('X-Correlation-ID', correlationId);

    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const latency = Date.now() - startTime;
          this.logger.logStructured(
            'info',
            {
              correlation_id: correlationId,
              http_method: method,
              http_url: url,
              http_status: response.statusCode,
              latency_ms: latency,
              request_type: 'http_request',
            },
            `${method} ${url} ${response.statusCode} - ${latency}ms`,
          );
        },
        error: (error) => {
          const latency = Date.now() - startTime;
          this.logger.logStructured(
            'error',
            {
              correlation_id: correlationId,
              http_method: method,
              http_url: url,
              http_status: response.statusCode || 500,
              latency_ms: latency,
              request_type: 'http_request',
              error: error.message,
              error_stack: error.stack,
            },
            `${method} ${url} ERROR - ${latency}ms`,
          );
        },
      }),
    );
  }
}
