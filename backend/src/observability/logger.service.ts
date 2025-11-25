import { Injectable, LoggerService as NestLoggerService, Optional } from '@nestjs/common';
import pino, { Logger as PinoLogger } from 'pino';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: PinoLogger;
  private readonly isProduction = process.env.NODE_ENV === 'production';

  constructor(@Optional() context?: string) {
    try {
      // Disable pino-pretty transport to avoid worker thread issues in Next.js
      this.logger = pino({
        level: process.env.LOG_LEVEL || (this.isProduction ? 'info' : 'debug'),
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      });

      if (!this.logger) {
        throw new Error('Failed to initialize pino logger');
      }

      if (context) {
        this.logger = this.logger.child({ context });
      }
    } catch (error) {
      // Fallback to console if pino fails to initialize
      console.error('Failed to initialize LoggerService:', error);
      // Create a minimal pino logger as fallback
      this.logger = pino({ level: 'info' });
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
    if (!this.logger) {
      throw new Error('Cannot create child logger: parent logger is not initialized');
    }
    const childLogger = new LoggerService();
    childLogger.logger = this.logger.child(bindings);
    return childLogger;
  }

  /**
   * Log with trace context
   */
  private logWithContext(level: string, message: string, context?: any) {
    try {
      const traceContext = this.getTraceContext();
      const logFn = (this.logger as any)[level];
      if (typeof logFn === 'function') {
        logFn.call(this.logger, { ...context, ...traceContext }, message);
      }
    } catch (error) {
      // Silently ignore logging errors to prevent crashes
      // Fall back to console only for critical errors
      if (level === 'error') {
        console.error(message, context);
      }
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
    try {
      const traceContext = this.getTraceContext();
      this.logger[level]({ ...data, ...traceContext }, message);
    } catch (error) {
      // Silently ignore logging errors
    }
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
    try {
      const traceContext = this.getTraceContext();
      this.logger.info(
        {
          ...traceContext,
          metric_type: 'ai_api_call',
          ...metrics,
        },
        `AI API call: ${metrics.provider}/${metrics.model} - ${metrics.operation}`,
      );
    } catch (error) {
      // Silently ignore logging errors
    }
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
    try {
      const traceContext = this.getTraceContext();
      this.logger.info(
        {
          ...traceContext,
          metric_type: 'manga_generation',
          ...metrics,
        },
        `Manga ${metrics.operation}: ${metrics.status} ${metrics.pageNumber ? `(page ${metrics.pageNumber})` : ''}`,
      );
    } catch (error) {
      // Silently ignore logging errors
    }
  }

  /**
   * Get the underlying Pino logger instance
   */
  getPinoLogger(): PinoLogger {
    return this.logger;
  }
}
