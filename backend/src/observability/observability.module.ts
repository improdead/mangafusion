import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerService } from './logger.service';
import { TracingService } from './tracing.service';
import { CorrelationInterceptor } from './correlation.interceptor';

@Global()
@Module({
  providers: [
    LoggerService,
    TracingService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationInterceptor,
    },
  ],
  exports: [LoggerService, TracingService],
})
export class ObservabilityModule {}
