# MangaFusion Observability Guide

This document describes the comprehensive observability implementation for MangaFusion, including error tracking, distributed tracing, structured logging, and performance monitoring.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Setup Instructions](#setup-instructions)
5. [Usage Guide](#usage-guide)
6. [Monitoring Dashboards](#monitoring-dashboards)
7. [Alerts & SLOs](#alerts--slos)
8. [Cost Tracking](#cost-tracking)
9. [Troubleshooting](#troubleshooting)

## Overview

The observability stack consists of:

- **Sentry**: Error tracking and performance monitoring for both frontend (Next.js) and backend (NestJS)
- **OpenTelemetry**: Distributed tracing for tracking requests across services
- **Pino**: Structured JSON logging with correlation IDs
- **Custom Metrics**: AI API usage tracking, token consumption, and cost estimation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Sentry    │  │ API Wrapper  │  │ Error Boundary  │   │
│  │  Browser    │  │ (Correlation)│  │   Component     │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP + Correlation ID
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (NestJS)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ OpenTelemetry│  │    Sentry    │  │  Pino Logger     │ │
│  │ Instrumentation│ │   Node SDK   │  │ (Structured)     │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Observability Module (Global)                      │   │
│  │  - TracingService                                   │   │
│  │  - LoggerService                                    │   │
│  │  - CorrelationInterceptor                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ EpisodesService  │  │ PlannerService   │               │
│  │ (Instrumented)   │  │ (Instrumented)   │               │
│  └──────────────────┘  └──────────────────┘               │
│  ┌──────────────────┐                                      │
│  │ RendererService  │                                      │
│  │ (Instrumented)   │                                      │
│  └──────────────────┘                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ OTLP / Sentry API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Observability Backends                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Sentry.io  │  │  Jaeger/OTLP │  │ Log Storage  │     │
│  │ (Errors+APM) │  │  (Traces)    │  │  (ELK/Cloud) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Backend Observability Module

Located in `/backend/src/observability/`, this module provides:

#### TracingService
```typescript
// Start a traced async operation
await this.tracing.traceAsync('operation-name', async (span) => {
  span.setAttribute('custom.attribute', 'value');
  return await doWork();
});

// Trace AI API calls with automatic metrics
await this.tracing.traceAICall('openai', 'gpt-4', 'completion', async (span) => {
  return await callOpenAI();
});

// Trace manga operations
await this.tracing.traceMangaOperation('page_generation', episodeId, async (span) => {
  return await generatePage();
}, { pageNumber: 1 });
```

#### LoggerService
```typescript
// Structured logging with trace context
this.logger.log('Message', { custom: 'data' });
this.logger.error('Error occurred', stackTrace, { context: 'data' });

// Log AI metrics
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

// Log manga generation metrics
this.logger.logMangaMetrics({
  episodeId: 'abc-123',
  pageNumber: 1,
  operation: 'page_generation',
  status: 'completed',
  durationMs: 45000,
});
```

#### CorrelationInterceptor
Automatically:
- Generates or extracts correlation IDs from requests
- Adds correlation IDs to response headers
- Logs all HTTP requests with latency and status
- Captures errors with correlation context

### 2. Frontend API Wrapper

Located in `/lib/observability/api-wrapper.ts`:

```typescript
// Wrap API routes with observability
export default withObservability(
  async (req, res) => {
    // Your API logic here
  },
  {
    operationName: 'generate-manga-page',
  }
);

// Track manga operations
trackMangaOperation('planning', episodeId, {
  seedTitle: 'My Manga',
});

// Log performance
logPerformance('page-render', durationMs, {
  pageNumber: 1,
});
```

### 3. Sentry Configuration

Three configuration files for different Next.js environments:
- `sentry.client.config.ts` - Browser-side error tracking
- `sentry.server.config.ts` - Server-side rendering errors
- `sentry.edge.config.ts` - Edge runtime errors

### 4. OpenTelemetry Instrumentation

`/backend/src/instrumentation.ts` must be loaded BEFORE any application code:
- Auto-instruments HTTP, database, and other common operations
- Sends traces to configurable OTLP endpoint
- Integrates with Sentry for error correlation

## Setup Instructions

### Step 1: Install Dependencies

Already installed via:
```bash
# Frontend
npm install @sentry/nextjs @opentelemetry/api pino pino-http pino-pretty

# Backend
cd backend
npm install @sentry/node @sentry/nestjs @opentelemetry/api @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node pino nestjs-pino pino-http pino-pretty
```

### Step 2: Configure Environment Variables

Copy `.env.observability.example` and add to your `.env`:

```bash
# Enable observability (set to true in production)
ENABLE_OBSERVABILITY=true
NEXT_PUBLIC_ENABLE_OBSERVABILITY=true

# Sentry DSN (get from sentry.io)
SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/project-id

# OpenTelemetry endpoint (Jaeger, Honeycomb, etc.)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces

# Log level
LOG_LEVEL=info
```

### Step 3: Set Up Sentry

1. Create account at [sentry.io](https://sentry.io)
2. Create a new project (or two: one for frontend, one for backend)
3. Copy the DSN from Settings → Projects → [Your Project] → Client Keys
4. Add DSN to `.env` file

### Step 4: Set Up Tracing Backend (Choose One)

#### Option A: Jaeger (Local Development)

```bash
# Run Jaeger via Docker
docker run -d \
  --name jaeger \
  -p 16686:16686 \
  -p 14268:14268 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest

# Access Jaeger UI at http://localhost:16686
```

Set in `.env`:
```
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

#### Option B: Honeycomb

1. Sign up at [honeycomb.io](https://www.honeycomb.io/)
2. Get API key from Settings
3. Set in `.env`:
```
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io/v1/traces
OTEL_EXPORTER_OTLP_HEADERS={"x-honeycomb-team":"your-api-key","x-honeycomb-dataset":"mangafusion"}
```

#### Option C: Grafana Cloud

1. Sign up for Grafana Cloud
2. Get OTLP credentials
3. Set in `.env`:
```
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-us-central-0.grafana.net/otlp
OTEL_EXPORTER_OTLP_HEADERS={"Authorization":"Basic base64-encoded-credentials"}
```

### Step 5: Start the Application

```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
npm run dev
```

### Step 6: Verify Setup

1. **Check Logs**: You should see startup messages:
   ```
   ✅ Sentry initialized
   ✅ OpenTelemetry initialized
   ```

2. **Check Sentry**: Visit your Sentry project dashboard - you should see events within minutes of errors occurring

3. **Check Traces**:
   - For Jaeger: Visit http://localhost:16686
   - For Honeycomb/Grafana: Visit your dashboard
   - Search for service "mangafusion-backend"

4. **Test Error Tracking**: Trigger an error and check Sentry:
   ```bash
   curl http://localhost:4000/api/test-error
   ```

## Usage Guide

### Instrumenting New Services

```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../observability/logger.service';
import { TracingService } from '../observability/tracing.service';

@Injectable()
export class MyService {
  private readonly logger: LoggerService;

  constructor(
    logger: LoggerService,
    private readonly tracing: TracingService,
  ) {
    this.logger = logger.child({ context: 'MyService' });
  }

  async doWork() {
    return this.tracing.traceAsync('my-operation', async (span) => {
      this.logger.log('Starting work');

      span.setAttribute('custom.attribute', 'value');

      try {
        const result = await performWork();
        this.logger.log('Work completed', { result });
        return result;
      } catch (error) {
        this.logger.error('Work failed', error.stack, { context });
        throw error;
      }
    });
  }
}
```

### Tracking AI API Calls

Use the built-in helpers to track AI API calls with automatic cost estimation:

```typescript
import { calculateAICost } from '../observability/instrumentation-helpers';

const cost = calculateAICost('openai', 'gpt-4', promptTokens, completionTokens);

this.logger.logAIMetrics({
  provider: 'openai',
  model: 'gpt-4',
  operation: 'completion',
  promptTokens,
  completionTokens,
  totalTokens,
  latencyMs,
  success: true,
  cost,
});
```

### Performance Budgets

Check if operations exceed performance budgets:

```typescript
import { checkPerformanceBudget } from '../observability/instrumentation-helpers';

const startTime = Date.now();
await generatePage();
const duration = Date.now() - startTime;

const budget = checkPerformanceBudget('page_generation', duration);
if (budget.exceeded) {
  this.logger.warn('Performance budget exceeded', {
    operation: 'page_generation',
    duration,
    budget: budget.budget,
    overage: budget.overage,
  });
}
```

## Monitoring Dashboards

### Recommended Metrics to Track

#### Error Rates
- **Overall error rate**: Errors per minute across all services
- **Error rate by endpoint**: Track which API endpoints fail most
- **Error rate by operation**: Planning vs generation vs character creation

#### Performance Metrics
- **API latency (P50, P95, P99)**: Response times for all API endpoints
- **AI generation latency**: Time to generate pages, characters, outlines
- **Database query latency**: Track Prisma query performance

#### AI Usage Metrics
- **Token consumption**: Tokens used per hour/day
- **Cost per operation**: Average cost for planning, page gen, etc.
- **Provider distribution**: % of requests to OpenAI vs Gemini
- **Model usage**: Which models are used most frequently

#### Business Metrics
- **Episodes created**: Count of new episodes per day
- **Pages generated**: Total pages generated
- **Success rate**: % of successful vs failed generations
- **User errors**: Client-side errors affecting user experience

### Sample Sentry Dashboard

Create these in Sentry → Dashboards:

1. **Error Overview**
   - Total errors (last 24h)
   - Error rate trend
   - Top 10 error types
   - Errors by browser/OS (frontend)

2. **Performance Overview**
   - API endpoint latency (P95)
   - Slow transactions (>5s)
   - Transaction throughput
   - Apdex score

3. **AI Operations**
   - Custom query: `manga.operation:page_generation`
   - Average duration by operation
   - Success rate by operation
   - Cost breakdown (custom tag)

### Sample Jaeger/OpenTelemetry Queries

1. **Find slow page generations**:
   - Service: `mangafusion-backend`
   - Operation: `manga.page_generation`
   - Min Duration: `45s`

2. **Trace a specific request**:
   - Search by tag: `trace_id` or `correlation_id`
   - View full request flow through all services

3. **Find AI API errors**:
   - Service: `mangafusion-backend`
   - Tags: `error:true AND ai.provider:openai`

## Alerts & SLOs

### Recommended Alerts

Set up in Sentry → Alerts or your monitoring tool:

1. **High Error Rate**
   - Condition: Error rate > 5% over 10 minutes
   - Severity: Critical
   - Notify: On-call engineer

2. **Slow Page Generation**
   - Condition: P95 latency > 60s for manga.page_generation
   - Severity: Warning
   - Notify: Team channel

3. **AI API Failures**
   - Condition: >10 AI API errors in 5 minutes
   - Severity: High
   - Notify: Team channel

4. **High AI Costs**
   - Condition: Estimated daily cost > $100
   - Severity: Warning
   - Notify: Product owner

5. **Database Errors**
   - Condition: Any Prisma connection error
   - Severity: Critical
   - Notify: On-call engineer

### Service Level Objectives (SLOs)

| Metric | Target | Measurement Window |
|--------|--------|-------------------|
| API Availability | 99.9% | 30 days |
| Page Generation Success Rate | 95% | 7 days |
| API Latency (P95) | < 5s | 24 hours |
| Page Generation Time (P95) | < 60s | 24 hours |
| Error Rate | < 1% | 24 hours |

## Cost Tracking

### AI Provider Costs

The system estimates costs based on:

```typescript
// In instrumentation-helpers.ts
export const AI_COSTS = {
  openai: {
    'gpt-5-mini': { input: 0.0001, output: 0.0002 },
    'gpt-image-1': { per_image: 0.04 },
  },
  gemini: {
    'gemini-2.5-flash': { input: 0.00001, output: 0.00003 },
  },
};
```

**Update these values** based on current pricing from:
- OpenAI: https://openai.com/pricing
- Google AI: https://ai.google.dev/pricing

### Monitoring Costs

Query structured logs for cost analysis:

```bash
# Daily cost summary
cat backend.log | grep '"metric_type":"ai_api_call"' | \
  jq -s 'map(.cost) | add'

# Cost by operation
cat backend.log | grep '"metric_type":"ai_api_call"' | \
  jq -s 'group_by(.operation) |
    map({operation: .[0].operation, total_cost: map(.cost) | add})'
```

Or use Sentry custom tags to create dashboards.

## Troubleshooting

### No Traces Appearing in Jaeger

1. Check OTLP endpoint is reachable:
   ```bash
   curl http://localhost:4318/v1/traces
   ```

2. Verify `ENABLE_OBSERVABILITY=true` in `.env`

3. Check backend startup logs for:
   ```
   ✅ OpenTelemetry initialized
   ```

4. Ensure `instrumentation.ts` is imported BEFORE app code in `main.ts`

### Sentry Not Receiving Errors

1. Verify DSN is correct:
   ```bash
   echo $SENTRY_DSN
   ```

2. Check network connectivity:
   ```bash
   curl -I https://sentry.io
   ```

3. Test with manual error:
   ```typescript
   Sentry.captureException(new Error('Test error'));
   ```

4. Check Sentry rate limits (free tier has limits)

### Logs Not Structured

1. Ensure `LOG_LEVEL` is set in `.env`

2. In production, logs should be JSON:
   ```json
   {"level":"info","time":"2025-01-01T00:00:00.000Z","msg":"Message"}
   ```

3. In development, use pretty printing:
   ```
   npm install -D pino-pretty
   ```

### High Memory Usage

OpenTelemetry and Sentry can increase memory usage. To optimize:

1. Lower trace sample rate in production:
   ```typescript
   tracesSampleRate: 0.1, // 10% of requests
   ```

2. Disable session replay on frontend:
   ```typescript
   replaysSessionSampleRate: 0,
   ```

3. Use log rotation for file-based logs

### Correlation IDs Not Propagating

1. Ensure `CorrelationInterceptor` is registered globally
2. Check `X-Correlation-ID` header in API responses:
   ```bash
   curl -I http://localhost:4000/api/episodes
   ```
3. Frontend must pass header to backend:
   ```typescript
   fetch('/api/endpoint', {
     headers: { 'X-Correlation-ID': correlationId }
   })
   ```

## Best Practices

1. **Always use structured logging**: Pass objects, not string concatenation
2. **Add context to spans**: Use `span.setAttribute()` for debugging
3. **Don't log sensitive data**: Mask API keys, user data, PII
4. **Use correlation IDs**: Track requests across services
5. **Set performance budgets**: Monitor and alert on SLO violations
6. **Review dashboards weekly**: Look for trends and anomalies
7. **Test in development**: Enable observability locally to catch issues early
8. **Rotate API keys**: Update Sentry DSN periodically
9. **Monitor costs**: Track AI API expenses closely
10. **Document custom metrics**: Keep this guide updated

## Further Reading

- [Sentry Documentation](https://docs.sentry.io/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Pino Documentation](https://getpino.io/)
- [Observability Engineering Book](https://www.oreilly.com/library/view/observability-engineering/9781492076438/)
