/**
 * Helper utilities for instrumenting manga generation pipeline
 */

import { Span } from '@opentelemetry/api';

/**
 * AI Provider cost estimates (per 1K tokens)
 * Update these based on current pricing
 */
export const AI_COSTS = {
  openai: {
    'gpt-5-mini': { input: 0.0001, output: 0.0002 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-image-1': { per_image: 0.04 }, // High quality 1024x1792
    'dall-e-3': { standard: 0.04, hd: 0.08 },
  },
  gemini: {
    'gemini-2.5-flash': { input: 0.00001, output: 0.00003 },
    'gemini-pro': { input: 0.0005, output: 0.0015 },
    'gemini-imagen-3': { per_image: 0.02 },
  },
};

/**
 * Calculate estimated cost for an AI API call
 */
export function calculateAICost(
  provider: 'openai' | 'gemini',
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const costs = AI_COSTS[provider];

  if (!costs) {
    return 0; // Unknown provider
  }

  const modelCost = (costs as any)[model];
  if (!modelCost) {
    return 0; // Unknown model
  }

  // For image models, return per-image cost
  if ('per_image' in modelCost) {
    return modelCost.per_image;
  }

  // For text models, calculate based on tokens
  if ('input' in modelCost && 'output' in modelCost) {
    return (
      (promptTokens / 1000) * modelCost.input +
      (completionTokens / 1000) * modelCost.output
    );
  }

  return 0;
}

/**
 * Add manga-specific attributes to a span
 */
export function addMangaAttributes(
  span: Span,
  data: {
    episodeId: string;
    pageNumber?: number;
    operation: string;
    provider?: string;
    model?: string;
  },
) {
  span.setAttributes({
    'manga.episode_id': data.episodeId,
    'manga.operation': data.operation,
    ...(data.pageNumber && { 'manga.page_number': data.pageNumber }),
    ...(data.provider && { 'ai.provider': data.provider }),
    ...(data.model && { 'ai.model': data.model }),
  });
}

/**
 * Performance budget thresholds (in milliseconds)
 */
export const PERFORMANCE_BUDGETS = {
  planning: 30000, // 30s for full outline generation
  character_generation: 15000, // 15s per character
  page_generation: 45000, // 45s per page
  page_regeneration: 45000,
  api_request: 5000, // 5s for general API requests
};

/**
 * Check if operation exceeded performance budget
 */
export function checkPerformanceBudget(
  operation: keyof typeof PERFORMANCE_BUDGETS,
  durationMs: number,
): { exceeded: boolean; budget: number; overage?: number } {
  const budget = PERFORMANCE_BUDGETS[operation];
  const exceeded = durationMs > budget;

  return {
    exceeded,
    budget,
    ...(exceeded && { overage: durationMs - budget }),
  };
}

/**
 * Common error categories for grouping in Sentry
 */
export function categorizeError(error: Error): {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
} {
  const message = error.message.toLowerCase();

  // API Key errors
  if (message.includes('api key') || message.includes('unauthorized')) {
    return { category: 'auth_error', severity: 'critical' };
  }

  // Rate limiting
  if (message.includes('rate limit') || message.includes('429')) {
    return { category: 'rate_limit', severity: 'medium' };
  }

  // Model availability
  if (message.includes('not found') || message.includes('not available')) {
    return { category: 'model_unavailable', severity: 'high' };
  }

  // Validation errors
  if (message.includes('validation') || message.includes('schema')) {
    return { category: 'validation_error', severity: 'medium' };
  }

  // Network errors
  if (message.includes('network') || message.includes('timeout')) {
    return { category: 'network_error', severity: 'medium' };
  }

  // Storage errors
  if (message.includes('storage') || message.includes('upload')) {
    return { category: 'storage_error', severity: 'high' };
  }

  // Default
  return { category: 'unknown_error', severity: 'high' };
}

/**
 * Extract useful metadata from an error for logging
 */
export function extractErrorMetadata(error: any): Record<string, any> {
  const metadata: Record<string, any> = {
    error_type: error.constructor?.name || 'Error',
    error_message: error.message || String(error),
  };

  // OpenAI specific errors
  if (error.status) {
    metadata.http_status = error.status;
  }
  if (error.code) {
    metadata.error_code = error.code;
  }
  if (error.type) {
    metadata.api_error_type = error.type;
  }

  // Gemini specific errors
  if (error.response) {
    metadata.api_response = JSON.stringify(error.response).slice(0, 500);
  }

  return metadata;
}
