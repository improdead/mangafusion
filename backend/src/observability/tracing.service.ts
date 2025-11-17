import { Injectable } from '@nestjs/common';
import { trace, context, Span, SpanStatusCode, SpanKind, Context } from '@opentelemetry/api';
import * as Sentry from '@sentry/node';

const tracer = trace.getTracer('mangafusion-backend', '0.1.0');

export interface SpanOptions {
  kind?: SpanKind;
  attributes?: Record<string, any>;
}

@Injectable()
export class TracingService {
  /**
   * Start a new span for an operation
   */
  startSpan(name: string, options?: SpanOptions): Span {
    const span = tracer.startSpan(name, {
      kind: options?.kind || SpanKind.INTERNAL,
      attributes: options?.attributes,
    });

    return span;
  }

  /**
   * Execute a function within a traced span
   */
  async traceAsync<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    options?: SpanOptions,
  ): Promise<T> {
    const span = this.startSpan(name, options);

    return context.with(trace.setSpan(context.active(), span), async () => {
      try {
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });

        // Also capture in Sentry
        if (process.env.ENABLE_OBSERVABILITY === 'true') {
          Sentry.captureException(error);
        }

        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Execute a synchronous function within a traced span
   */
  trace<T>(name: string, fn: (span: Span) => T, options?: SpanOptions): T {
    const span = this.startSpan(name, options);

    return context.with(trace.setSpan(context.active(), span), () => {
      try {
        const result = fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });

        // Also capture in Sentry
        if (process.env.ENABLE_OBSERVABILITY === 'true') {
          Sentry.captureException(error);
        }

        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Add attributes to the current active span
   */
  addSpanAttributes(attributes: Record<string, any>) {
    const span = trace.getActiveSpan();
    if (span) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });
    }
  }

  /**
   * Add an event to the current active span
   */
  addSpanEvent(name: string, attributes?: Record<string, any>) {
    const span = trace.getActiveSpan();
    if (span) {
      span.addEvent(name, attributes);
    }
  }

  /**
   * Get the current active span
   */
  getActiveSpan(): Span | undefined {
    return trace.getActiveSpan();
  }

  /**
   * Trace AI API calls with standardized attributes
   */
  async traceAICall<T>(
    provider: 'openai' | 'gemini',
    model: string,
    operation: string,
    fn: (span: Span) => Promise<T>,
  ): Promise<T> {
    return this.traceAsync(
      `ai.${provider}.${operation}`,
      async (span) => {
        span.setAttributes({
          'ai.provider': provider,
          'ai.model': model,
          'ai.operation': operation,
        });

        const startTime = Date.now();
        try {
          const result = await fn(span);
          const latency = Date.now() - startTime;

          span.setAttributes({
            'ai.latency_ms': latency,
          });

          return result;
        } catch (error) {
          span.setAttribute('ai.error', error instanceof Error ? error.message : String(error));
          throw error;
        }
      },
      { kind: SpanKind.CLIENT },
    );
  }

  /**
   * Trace manga generation pipeline operations
   */
  async traceMangaOperation<T>(
    operation: 'planning' | 'character_generation' | 'page_generation' | 'retry',
    episodeId: string,
    fn: (span: Span) => Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<T> {
    return this.traceAsync(
      `manga.${operation}`,
      async (span) => {
        span.setAttributes({
          'manga.operation': operation,
          'manga.episode_id': episodeId,
          ...metadata,
        });

        return fn(span);
      },
      { kind: SpanKind.INTERNAL },
    );
  }

  /**
   * Get current trace ID for correlation
   */
  getCurrentTraceId(): string | undefined {
    const span = trace.getActiveSpan();
    if (span) {
      return span.spanContext().traceId;
    }
    return undefined;
  }

  /**
   * Create a Sentry transaction for long-running operations
   * Note: Newer Sentry SDK uses startSpan instead of startTransaction
   */
  startSentryTransaction(name: string, op: string) {
    if (process.env.ENABLE_OBSERVABILITY === 'true' && process.env.SENTRY_DSN) {
      // Use startSpan for newer Sentry SDK (v8+)
      return Sentry.startSpan({ name, op }, () => {
        // Return a mock transaction object for compatibility
        return { name, op };
      });
    }
    return null;
  }
}
