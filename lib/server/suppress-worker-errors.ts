// Suppress worker thread errors in Next.js API routes
// These occur because BullMQ tries to spawn workers, which doesn't work in Next.js serverless
if (typeof process !== 'undefined' && !process.env.__WORKER_ERRORS_SUPPRESSED) {
  process.env.__WORKER_ERRORS_SUPPRESSED = 'true';

  const originalEmit = process.emit.bind(process);

  // @ts-ignore - Override process.emit to filter out worker errors
  process.emit = function (event: string, error: any) {
    if (event === 'uncaughtException' || event === 'unhandledRejection') {
      const message = error?.message || String(error);

      // Suppress BullMQ worker thread errors
      if (
        message.includes('worker') &&
        (message.includes('Cannot find module') ||
         message.includes('worker thread exited') ||
         message.includes('.next/server/vendor-chunks/lib/worker.js'))
      ) {
        // Silently ignore - these are expected in Next.js environment
        return false;
      }
    }

    return originalEmit(event, error);
  };
}

export {};
