import { ZodError } from 'zod';

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Sleep utility for retry delays
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
export const calculateBackoff = (
  attempt: number,
  config: RetryConfig
): number => {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelayMs);
};

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  operationName: string = 'Operation'
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      console.log(`[${operationName}] Attempt ${attempt}/${config.maxAttempts}`);
      const result = await operation();

      if (attempt > 1) {
        console.log(`[${operationName}] Succeeded on attempt ${attempt}`);
      }

      return result;
    } catch (error) {
      lastError = error as Error;
      const isLastAttempt = attempt === config.maxAttempts;

      console.error(
        `[${operationName}] Attempt ${attempt}/${config.maxAttempts} failed:`,
        error instanceof Error ? error.message : String(error)
      );

      if (isLastAttempt) {
        console.error(`[${operationName}] All ${config.maxAttempts} attempts failed`);
        break;
      }

      const delayMs = calculateBackoff(attempt, config);
      console.log(`[${operationName}] Retrying in ${delayMs}ms...`);
      await sleep(delayMs);
    }
  }

  throw lastError || new Error(`${operationName} failed after ${config.maxAttempts} attempts`);
}

/**
 * Advanced JSON extraction with multiple strategies
 */
export function extractJson(text: string): any {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }

  const strategies = [
    // Strategy 1: Direct parse
    () => JSON.parse(text),

    // Strategy 2: Trim and parse
    () => JSON.parse(text.trim()),

    // Strategy 3: Find first { ... } block
    () => {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        return JSON.parse(text.slice(start, end + 1));
      }
      throw new Error('No JSON object found');
    },

    // Strategy 4: Extract from markdown code fence
    () => {
      const jsonFence = text.match(/```json\s*([\s\S]*?)\s*```/i);
      if (jsonFence) {
        return JSON.parse(jsonFence[1].trim());
      }

      const genericFence = text.match(/```\s*([\s\S]*?)\s*```/);
      if (genericFence) {
        return JSON.parse(genericFence[1].trim());
      }

      throw new Error('No code fence found');
    },

    // Strategy 5: Find balanced braces
    () => {
      const start = text.indexOf('{');
      if (start === -1) throw new Error('No opening brace found');

      let depth = 0;
      let inString = false;
      let escapeNext = false;

      for (let i = start; i < text.length; i++) {
        const char = text[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === '\\') {
          escapeNext = true;
          continue;
        }

        if (char === '"' && !inString) {
          inString = true;
        } else if (char === '"' && inString) {
          inString = false;
        }

        if (!inString) {
          if (char === '{') depth++;
          if (char === '}') {
            depth--;
            if (depth === 0) {
              return JSON.parse(text.slice(start, i + 1));
            }
          }
        }
      }

      throw new Error('No balanced JSON object found');
    },

    // Strategy 6: Remove common prefixes and try again
    () => {
      const cleaned = text
        .replace(/^[^{]*/, '') // Remove everything before first {
        .replace(/[^}]*$/, ''); // Remove everything after last }

      if (cleaned) {
        return JSON.parse(cleaned);
      }
      throw new Error('Failed to clean and parse');
    },
  ];

  const errors: string[] = [];

  for (let i = 0; i < strategies.length; i++) {
    try {
      const result = strategies[i]();
      if (result && typeof result === 'object') {
        if (i > 0) {
          console.log(`JSON extraction succeeded using strategy ${i + 1}`);
        }
        return result;
      }
    } catch (error) {
      errors.push(`Strategy ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.error('All JSON extraction strategies failed:', errors);
  throw new Error(`Failed to extract JSON from response. Tried ${strategies.length} strategies.`);
}

/**
 * Attempt to repair common JSON issues
 */
export function repairJson(text: string): string {
  let repaired = text;

  // Remove trailing commas before closing braces/brackets
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  // Fix unescaped quotes in strings (basic attempt)
  // This is tricky and may not catch all cases

  // Remove comments (not valid JSON but sometimes AI adds them)
  repaired = repaired.replace(/\/\/.*$/gm, '');
  repaired = repaired.replace(/\/\*[\s\S]*?\*\//g, '');

  // Fix single quotes to double quotes (only outside of already quoted strings)
  // This is a simplified approach
  repaired = repaired.replace(/'([^']*?)'/g, '"$1"');

  return repaired;
}

/**
 * Extract and repair JSON from AI response
 */
export function extractAndRepairJson(text: string): any {
  // First try direct extraction
  try {
    return extractJson(text);
  } catch (firstError) {
    console.log('Initial JSON extraction failed, attempting repair...');

    // Try to repair and extract again
    try {
      const repaired = repairJson(text);
      return extractJson(repaired);
    } catch (repairError) {
      console.error('JSON repair failed:', repairError);
      throw firstError; // Throw the original error
    }
  }
}

/**
 * Format Zod errors into readable messages
 */
export function formatZodError(error: ZodError): string {
  const issues = error.issues.map(issue => {
    const path = issue.path.join('.');
    return `  - ${path || 'root'}: ${issue.message}`;
  });

  return `Validation failed:\n${issues.join('\n')}`;
}

/**
 * Metrics tracker for planner operations
 */
export class PlannerMetrics {
  private successCount = 0;
  private failureCount = 0;
  private totalAttempts = 0;
  private validationErrors = 0;
  private jsonExtractionErrors = 0;
  private apiErrors = 0;
  private retrySuccesses = 0;

  recordSuccess(attemptNumber: number): void {
    this.successCount++;
    this.totalAttempts += attemptNumber;
    if (attemptNumber > 1) {
      this.retrySuccesses++;
    }
  }

  recordFailure(attemptCount: number, errorType: 'validation' | 'json' | 'api'): void {
    this.failureCount++;
    this.totalAttempts += attemptCount;

    switch (errorType) {
      case 'validation':
        this.validationErrors++;
        break;
      case 'json':
        this.jsonExtractionErrors++;
        break;
      case 'api':
        this.apiErrors++;
        break;
    }
  }

  getStats() {
    const total = this.successCount + this.failureCount;
    return {
      successCount: this.successCount,
      failureCount: this.failureCount,
      totalRequests: total,
      successRate: total > 0 ? (this.successCount / total * 100).toFixed(2) + '%' : 'N/A',
      averageAttempts: total > 0 ? (this.totalAttempts / total).toFixed(2) : 'N/A',
      retrySuccesses: this.retrySuccesses,
      validationErrors: this.validationErrors,
      jsonExtractionErrors: this.jsonExtractionErrors,
      apiErrors: this.apiErrors,
    };
  }

  logStats(): void {
    console.log('=== Planner Metrics ===');
    const stats = this.getStats();
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('======================');
  }
}
