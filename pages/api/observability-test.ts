/**
 * Test API route for observability
 * Access at: http://localhost:3000/api/observability-test
 */

import { NextApiRequest, NextApiResponse } from 'next';
import {
  withObservability,
  trackMangaOperation,
  logPerformance,
} from '../../lib/observability/api-wrapper';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  // Simulate some work
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Track a manga operation
  trackMangaOperation('planning', 'test-episode-123', {
    testMode: true,
    seedTitle: 'Test Episode',
  });

  // Log performance
  const duration = Date.now() - startTime;
  logPerformance('test-operation', duration, {
    testMode: true,
  });

  res.status(200).json({
    success: true,
    message: 'Observability test completed',
    duration_ms: duration,
    observability_enabled: process.env.NEXT_PUBLIC_ENABLE_OBSERVABILITY === 'true',
    correlation_id: res.getHeader('X-Correlation-ID'),
    tips: [
      'Check your Sentry dashboard for this request',
      'Check Jaeger UI at http://localhost:16686 for traces',
      'Look for structured logs in console',
      'The correlation ID can be used to track this request',
    ],
  });
}

export default withObservability(handler, {
  operationName: 'observability-test',
});
