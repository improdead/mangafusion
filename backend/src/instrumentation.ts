/**
 * OpenTelemetry Instrumentation
 * This file must be loaded BEFORE any other application code
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import * as Sentry from '@sentry/node';
const { Resource } = require('@opentelemetry/resources');
const { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } = require('@opentelemetry/semantic-conventions');

const isProduction = process.env.NODE_ENV === 'production';
const isObservabilityEnabled = process.env.ENABLE_OBSERVABILITY === 'true';

// Initialize Sentry
if (isObservabilityEnabled && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || 'mangafusion-backend@0.1.0',
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    profilesSampleRate: isProduction ? 0.1 : 1.0,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.prismaIntegration(),
    ],
    beforeSend(event, hint) {
      // Filter out health check errors
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      return event;
    },
  });

  console.log('✅ Sentry initialized');
}

// Initialize OpenTelemetry
let sdk: NodeSDK | null = null;

if (isObservabilityEnabled) {
  const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'mangafusion-backend',
    [SEMRESATTRS_SERVICE_VERSION]: '0.1.0',
    'deployment.environment': process.env.NODE_ENV || 'development',
  });

  // Configure OTLP exporter (can send to Jaeger, Zipkin, or any OTLP-compatible backend)
  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
      ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS)
      : {},
  });

  sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable file system instrumentation (too noisy)
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
        // Configure HTTP instrumentation
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingRequestHook: (req) => {
            // Ignore health checks
            return req.url === '/api/health' || req.url === '/health';
          },
        },
      }),
    ],
  });

  sdk.start();
  console.log('✅ OpenTelemetry initialized');

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk?.shutdown()
      .then(() => console.log('OpenTelemetry SDK terminated'))
      .catch((error) => console.error('Error terminating OpenTelemetry SDK', error))
      .finally(() => process.exit(0));
  });
}

export { sdk };
