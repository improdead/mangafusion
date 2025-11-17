/**
 * Test script for observability setup
 * Run with: npx ts-node src/observability/test-observability.ts
 */

import { LoggerService } from './logger.service';
import { TracingService } from './tracing.service';

async function testLogging() {
  console.log('\n=== Testing LoggerService ===\n');

  const logger = new LoggerService('TestContext');

  // Test basic logging
  logger.log('Test info message', { custom: 'data' });
  logger.warn('Test warning message');
  logger.error('Test error message', 'Error stack trace', { errorCode: 500 });
  logger.debug('Test debug message');

  // Test AI metrics logging
  logger.logAIMetrics({
    provider: 'openai',
    model: 'gpt-4',
    operation: 'test-completion',
    promptTokens: 1000,
    completionTokens: 500,
    totalTokens: 1500,
    latencyMs: 2000,
    success: true,
    cost: 0.045,
  });

  // Test manga metrics logging
  logger.logMangaMetrics({
    episodeId: 'test-episode-123',
    pageNumber: 1,
    operation: 'page_generation',
    status: 'completed',
    durationMs: 45000,
    metadata: { model: 'gpt-image-1' },
  });

  console.log('✅ Logger tests passed\n');
}

async function testTracing() {
  console.log('\n=== Testing TracingService ===\n');

  const tracing = new TracingService();
  const logger = new LoggerService('TracingTest');

  // Test basic tracing
  const result1 = await tracing.traceAsync(
    'test-async-operation',
    async (span) => {
      span.setAttribute('test.attribute', 'value');
      tracing.addSpanEvent('Processing started');

      // Simulate work
      await new Promise((resolve) => setTimeout(resolve, 100));

      tracing.addSpanEvent('Processing completed');
      return 'success';
    },
  );

  logger.log('Async trace result:', { result: result1 });

  // Test AI call tracing
  const result2 = await tracing.traceAICall(
    'openai',
    'gpt-4',
    'test-call',
    async (span) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { response: 'AI response' };
    },
  );

  logger.log('AI trace result:', { result: result2 });

  // Test manga operation tracing
  const result3 = await tracing.traceMangaOperation(
    'page_generation',
    'test-episode-456',
    async (span) => {
      await new Promise((resolve) => setTimeout(resolve, 75));
      return { pageUrl: 'https://example.com/page.png' };
    },
    { pageNumber: 1 },
  );

  logger.log('Manga operation trace result:', { result: result3 });

  console.log('✅ Tracing tests passed\n');
}

async function testErrorHandling() {
  console.log('\n=== Testing Error Handling ===\n');

  const tracing = new TracingService();
  const logger = new LoggerService('ErrorTest');

  try {
    await tracing.traceAsync('failing-operation', async (span) => {
      throw new Error('Intentional test error');
    });
  } catch (error) {
    logger.log('Caught expected error:', {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  console.log('✅ Error handling tests passed\n');
}

async function main() {
  console.log('🧪 Starting Observability Tests...\n');
  console.log('Note: ENABLE_OBSERVABILITY must be "true" for full functionality\n');

  try {
    await testLogging();
    await testTracing();
    await testErrorHandling();

    console.log('\n✅ All observability tests passed!\n');
    console.log('Next steps:');
    console.log('1. Check your logs for structured JSON output');
    console.log('2. If Sentry is configured, check for test events');
    console.log('3. If Jaeger is running, check http://localhost:16686 for traces');
    console.log('\nTo test in a real request:');
    console.log('  curl http://localhost:4000/api/health');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  }
}

main();
