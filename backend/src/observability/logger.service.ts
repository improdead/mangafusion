import { Injectable, LoggerService as NestLoggerService, Optional } from '@nestjs/common';
import pino, { Logger as PinoLogger } from 'pino';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: PinoLogger;
  private readonly isProduction = process.env.NODE_ENV === 'production';

  constructor(@Optional() context?: string) {
    this.logger = pino({
      level: process.env.LOG_LEVEL || (this.isProduction ? 'info' : 'debug'),
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
      ...(this.isProduction
        ? {
            // Production: JSON output
            timestamp: pino.stdTimeFunctions.isoTime,
          }
        : {
            // Development: Pretty output
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss.l',
                ignore: 'pid,hostname',
              },
            },
          }),
    });

    if (context) {
      this.logger = this.logger.child({ context });
    }
  }

  /**
   * Get current trace context for correlation
   */
  private getTraceContext() {
    const span = trace.getActiveSpan();
    if (span) {
      const spanContext = span.spanContext();
      return {
        trace_id: spanContext.traceId,
        span_id: spanContext.spanId,
        trace_flags: spanContext.traceFlags,
      };
    }
    return {};
  }

  /**
   * Create a child logger with additional context
   */
  child(bindings: Record<string, any>): LoggerService {
    const childLogger = new LoggerService();
    childLogger.logger = this.logger.child(bindings);
    return childLogger;
  }

  /**
   * Log with trace context
   */
  private logWithContext(level: string, message: string, context?: any) {
    const traceContext = this.getTraceContext();
    const logFn = (this.logger as any)[level];
    if (typeof logFn === 'function') {
      logFn.call(this.logger, { ...context, ...traceContext }, message);
    }
  }

  log(message: string, context?: any) {
    this.logWithContext('info', message, context);
  }

  error(message: string, trace?: string, context?: any) {
    this.logWithContext('error', message, { trace, ...context });
  }

  warn(message: string, context?: any) {
    this.logWithContext('warn', message, context);
  }

  debug(message: string, context?: any) {
    this.logWithContext('debug', message, context);
  }

  verbose(message: string, context?: any) {
    this.logWithContext('trace', message, context);
  }

  /**
   * Log with custom level and structured data
   */
  logStructured(level: 'info' | 'error' | 'warn' | 'debug', data: Record<string, any>, message: string) {
    const traceContext = this.getTraceContext();
    this.logger[level]({ ...data, ...traceContext }, message);
  }

  /**
   * Log AI API call metrics
   */
  logAIMetrics(metrics: {
    provider: 'openai' | 'gemini';
    model: string;
    operation: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    latencyMs: number;
    success: boolean;
    error?: string;
    cost?: number;
  }) {
    const traceContext = this.getTraceContext();
    this.logger.info(
      {
        ...traceContext,
        metric_type: 'ai_api_call',
        ...metrics,
      },
      `AI API call: ${metrics.provider}/${metrics.model} - ${metrics.operation}`,
    );
  }

  /**
   * Log manga generation pipeline metrics
   */
  logMangaMetrics(metrics: {
    episodeId: string;
    pageNumber?: number;
    operation: 'planning' | 'character_generation' | 'page_generation' | 'retry';
    status: 'started' | 'completed' | 'failed';
    durationMs?: number;
    error?: string;
    metadata?: Record<string, any>;
  }) {
    const traceContext = this.getTraceContext();
    this.logger.info(
      {
        ...traceContext,
        metric_type: 'manga_generation',
        ...metrics,
      },
      `Manga ${metrics.operation}: ${metrics.status} ${metrics.pageNumber ? `(page ${metrics.pageNumber})` : ''}`,
    );
  }

  /**
   * Get the underlying Pino logger instance
   */
  getPinoLogger(): PinoLogger {
    return this.logger;
  }
}
