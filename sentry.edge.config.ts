import * as Sentry from '@sentry/nextjs';

const isProduction = process.env.NODE_ENV === 'production';
const isObservabilityEnabled = process.env.NEXT_PUBLIC_ENABLE_OBSERVABILITY === 'true';

if (isObservabilityEnabled && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || 'mangafusion-frontend@0.1.0',
    tracesSampleRate: isProduction ? 0.1 : 1.0,
  });
}
