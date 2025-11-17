# Observability Quick Start Guide

## 5-Minute Setup

### 1. Install Jaeger (Local Tracing)

```bash
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 14268:14268 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest
```

### 2. Set Environment Variables

Add to `.env`:

```bash
# Minimum configuration for local development
ENABLE_OBSERVABILITY=true
NEXT_PUBLIC_ENABLE_OBSERVABILITY=true
LOG_LEVEL=debug
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces

# Optional: Add Sentry for error tracking
# SENTRY_DSN=your-sentry-dsn
# NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### 3. Start Application

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

### 4. Test Observability

Visit: http://localhost:3000/api/observability-test

### 5. View Results

- **Traces**: http://localhost:16686 (Jaeger UI)
- **Logs**: Check terminal output (structured JSON in production)
- **Sentry**: https://sentry.io (if configured)

## Common Use Cases

### Log a Message

```typescript
import { LoggerService } from '../observability/logger.service';

constructor(private readonly logger: LoggerService) {}

this.logger.log('Operation started', { customData: 'value' });
```

### Trace an Operation

```typescript
import { TracingService } from '../observability/tracing.service';

await this.tracing.traceAsync('my-operation', async (span) => {
  span.setAttribute('custom.attribute', 'value');
  return await doWork();
});
```

### Track AI API Call

```typescript
this.logger.logAIMetrics({
  provider: 'openai',
  model: 'gpt-4',
  operation: 'completion',
  promptTokens: 1000,
  completionTokens: 500,
  totalTokens: 1500,
  latencyMs: 2000,
  success: true,
  cost: 0.045,
});
```

### Wrap API Route

```typescript
import { withObservability } from '../../lib/observability/api-wrapper';

export default withObservability(
  async (req, res) => {
    // Your API logic
  },
  { operationName: 'my-api-endpoint' }
);
```

## Troubleshooting

### No traces in Jaeger?

1. Check Jaeger is running: `docker ps | grep jaeger`
2. Verify ENABLE_OBSERVABILITY=true
3. Check logs for "✅ OpenTelemetry initialized"

### Logs not structured?

- Production: Logs are JSON (pipe to `jq` for formatting)
- Development: Pretty-printed automatically

### High memory usage?

Lower sample rate in `.env`:
```bash
# Sample 10% of requests instead of 100%
OTEL_TRACE_SAMPLE_RATE=0.1
```

## Next Steps

- Read full guide: [OBSERVABILITY.md](./OBSERVABILITY.md)
- Set up Sentry for error tracking
- Configure alerts for production
- Create custom dashboards

## Key Files

```
├── backend/src/
│   ├── instrumentation.ts           # OTEL initialization (loaded first)
│   ├── observability/
│   │   ├── logger.service.ts        # Structured logging
│   │   ├── tracing.service.ts       # Distributed tracing
│   │   ├── correlation.interceptor.ts  # Request correlation
│   │   └── instrumentation-helpers.ts  # Utilities
│
├── lib/observability/
│   └── api-wrapper.ts               # Frontend API observability
│
├── sentry.client.config.ts          # Sentry browser config
├── sentry.server.config.ts          # Sentry SSR config
├── sentry.edge.config.ts            # Sentry edge config
│
└── .env.observability.example       # Configuration template
```

## Disable Observability

Set in `.env`:
```bash
ENABLE_OBSERVABILITY=false
NEXT_PUBLIC_ENABLE_OBSERVABILITY=false
```

All instrumentation will be skipped (zero overhead).
