/**
 * API Route Observability Wrapper
 * Wraps Next.js API routes with error tracking and performance monitoring
 */

import { NextApiRequest, NextApiResponse } from 'next';
import * as Sentry from '@sentry/nextjs';

export interface ApiMetrics {
  startTime: number;
  correlationId?: string;
}

/**
 * Generate or extract correlation ID from request
 */
export function getCorrelationId(req: NextApiRequest): string {
  return (
    (req.headers['x-correlation-id'] as string) ||
    (req.headers['x-request-id'] as string) ||
    `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );
}

/**
 * Wrap API route handler with observability
 */
export function withObservability<T = any>(
  handler: (req: NextApiRequest, res: NextApiResponse<T>) => Promise<void>,
  options: {
    operationName?: string;
    captureRequestBody?: boolean;
  } = {},
) {
  return async (req: NextApiRequest, res: NextApiResponse<T>) => {
    const startTime = Date.now();
    const correlationId = getCorrelationId(req);
    const operationName = options.operationName || `${req.method} ${req.url}`;

    // Add correlation ID to response headers
    res.setHeader('X-Correlation-ID', correlationId);

    // Start Sentry transaction if enabled
    const transaction =
      process.env.NEXT_PUBLIC_ENABLE_OBSERVABILITY === 'true'
        ? Sentry.startTransaction({
            name: operationName,
            op: 'http.server',
            data: {
              'http.method': req.method,
              'http.url': req.url,
              correlation_id: correlationId,
            },
          })
        : null;

    try {
      // Set Sentry context
      if (transaction) {
        Sentry.getCurrentScope().setContext('request', {
          method: req.method,
          url: req.url,
          correlationId,
          userAgent: req.headers['user-agent'],
        });
      }

      // Execute the handler
      await handler(req, res);

      // Log successful completion
      const latency = Date.now() - startTime;
      if (typeof window === 'undefined') {
        // Server-side only
        console.log(
          JSON.stringify({
            type: 'api_request',
            method: req.method,
            url: req.url,
            status: res.statusCode,
            latency_ms: latency,
            correlation_id: correlationId,
          }),
        );
      }

      transaction?.setStatus('ok');
    } catch (error) {
      const latency = Date.now() - startTime;

      // Capture error in Sentry
      if (process.env.NEXT_PUBLIC_ENABLE_OBSERVABILITY === 'true') {
        Sentry.captureException(error, {
          tags: {
            correlation_id: correlationId,
            api_route: req.url || 'unknown',
          },
          contexts: {
            request: {
              method: req.method,
              url: req.url,
              headers: req.headers,
            },
          },
        });
      }

      // Log error
      if (typeof window === 'undefined') {
        console.error(
          JSON.stringify({
            type: 'api_error',
            method: req.method,
            url: req.url,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            latency_ms: latency,
            correlation_id: correlationId,
          }),
        );
      }

      transaction?.setStatus('internal_error');

      // Re-throw to let Next.js handle the error response
      throw error;
    } finally {
      transaction?.finish();
    }
  };
}

/**
 * Track custom metric for manga generation operations
 */
export function trackMangaOperation(
  operation: 'planning' | 'generation' | 'regeneration' | 'character_gen',
  episodeId: string,
  metadata?: Record<string, any>,
) {
  if (process.env.NEXT_PUBLIC_ENABLE_OBSERVABILITY === 'true') {
    Sentry.addBreadcrumb({
      category: 'manga',
      message: `Manga ${operation}`,
      level: 'info',
      data: {
        episode_id: episodeId,
        operation,
        ...metadata,
      },
    });
  }

  // Console log for server-side
  if (typeof window === 'undefined') {
    console.log(
      JSON.stringify({
        type: 'manga_operation',
        operation,
        episode_id: episodeId,
        ...metadata,
      }),
    );
  }
}

/**
 * Log performance timing
 */
export function logPerformance(
  operation: string,
  durationMs: number,
  metadata?: Record<string, any>,
) {
  if (typeof window === 'undefined') {
    console.log(
      JSON.stringify({
        type: 'performance',
        operation,
        duration_ms: durationMs,
        ...metadata,
      }),
    );
  }

  // Add to Sentry breadcrumbs
  if (process.env.NEXT_PUBLIC_ENABLE_OBSERVABILITY === 'true') {
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${operation} took ${durationMs}ms`,
      level: 'info',
      data: {
        duration_ms: durationMs,
        ...metadata,
      },
    });
  }
}
