import * as Sentry from '@sentry/nextjs';

const isProduction = process.env.NODE_ENV === 'production';
const isObservabilityEnabled = process.env.NEXT_PUBLIC_ENABLE_OBSERVABILITY === 'true';

if (isObservabilityEnabled && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || 'mangafusion-frontend@0.1.0',

    // Performance monitoring
    tracesSampleRate: isProduction ? 0.1 : 1.0,

    // Session replay (optional - can be resource intensive)
    replaysSessionSampleRate: isProduction ? 0.1 : 0.5,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration(),
    ],

    // Filter out noise
    beforeSend(event, hint) {
      // Ignore non-error events for certain types
      if (event.request?.url?.includes('/api/health')) {
        return null;
      }

      // Ignore certain browser extension errors
      if (event.exception?.values?.[0]?.value?.includes('chrome-extension')) {
        return null;
      }

      return event;
    },

    // Track specific user actions
    beforeBreadcrumb(breadcrumb, hint) {
      // Add custom data to breadcrumbs
      if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
        // Add correlation ID if available (handle both xhr and fetch)
        let correlationId;
        if (breadcrumb.category === 'xhr') {
          correlationId = hint?.xhr?.getResponseHeader?.('X-Correlation-ID');
        } else if (breadcrumb.category === 'fetch' && hint?.response) {
          correlationId = hint.response.headers?.get?.('X-Correlation-ID');
        }

        if (correlationId) {
          breadcrumb.data = {
            ...breadcrumb.data,
            correlation_id: correlationId,
          };
        }
      }
      return breadcrumb;
    },
  });
}
