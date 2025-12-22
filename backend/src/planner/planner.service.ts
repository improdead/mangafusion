import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { EpisodeSeed, PlannerOutput } from '../episodes/types';
import { ZodError } from 'zod';
import {
  EpisodeSeedSchema,
  PlannerOutputSchema,
} from './schemas';
import {
  withRetry,
  extractAndRepairJson,
  formatZodError,
  PlannerMetrics,
  DEFAULT_RETRY_CONFIG,
  RetryConfig,
} from './planner.utils';
import { generateStubOutline, mergeWithStub } from './planner.fallback';
import { LoggerService } from '../observability/logger.service';
import { TracingService } from '../observability/tracing.service';
import { validateAndSanitizeSeed, containsInjectionPatterns } from './prompt-sanitizer';

/**
 * Error types for better error handling
 */
export class PlannerValidationError extends Error {
  constructor(message: string, public readonly details: string) {
    super(message);
    this.name = 'PlannerValidationError';
  }
}

export class PlannerJsonExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlannerJsonExtractionError';
  }
}

export class PlannerApiError extends Error {
  constructor(message: string, public readonly provider: string) {
    super(message);
    this.name = 'PlannerApiError';
  }
}

@Injectable()
export class PlannerService {
  private readonly geminiApiKey = process.env.GEMINI_API_KEY;
  private readonly openaiApiKey = process.env.OPENAI_API_KEY;
  private readonly provider = process.env.PLANNER_PROVIDER || 'openai';
  private readonly geminiModel = process.env.PLANNER_MODEL || 'gemini-2.5-flash';
  private readonly openaiModel = process.env.OPENAI_PLANNER_MODEL || 'gpt-5-mini';
  private readonly enableStubFallback = process.env.PLANNER_ENABLE_STUB_FALLBACK !== 'false';
  private readonly enablePartialMerge = process.env.PLANNER_ENABLE_PARTIAL_MERGE !== 'false';

  private readonly metrics = new PlannerMetrics();
  private readonly logger: LoggerService;
  private readonly tracing: TracingService;

  // Retry configuration
  private readonly retryConfig: RetryConfig = {
    maxAttempts: parseInt(process.env.PLANNER_MAX_RETRIES || '3', 10),
    initialDelayMs: parseInt(process.env.PLANNER_INITIAL_DELAY_MS || '1000', 10),
    maxDelayMs: parseInt(process.env.PLANNER_MAX_DELAY_MS || '10000', 10),
    backoffMultiplier: parseFloat(process.env.PLANNER_BACKOFF_MULTIPLIER || '2'),
  };

  constructor(logger?: LoggerService, tracing?: TracingService) {
    const baseLogger = logger ?? new LoggerService('PlannerService');
    this.logger = baseLogger.child({ context: 'PlannerService' });
    this.tracing = tracing ?? new TracingService();
  }

  private get geminiClient() {
    if (!this.geminiApiKey) throw new Error('GEMINI_API_KEY not set');
    return new GoogleGenerativeAI(this.geminiApiKey);
  }

  private get openaiClient() {
    if (!this.openaiApiKey) throw new Error('OPENAI_API_KEY not set');
    return new OpenAI({ apiKey: this.openaiApiKey });
  }

  /**
   * Main entry point for outline generation with full hardening
   */
  async generateOutline(seed: EpisodeSeed): Promise<PlannerOutput> {
    const startTime = Date.now();
    this.logger.log('Starting Planner Request', {
      provider: this.provider,
      seedTitle: seed.title,
    });

    try {
      // Step 1: Validate input
      this.validateInput(seed);

      // Step 2: Generate outline with retries
      const output = await this.generateOutlineWithRetry(seed);

      // Step 3: Log success
      const duration = Date.now() - startTime;
      this.logger.log('Planner Success', { duration });

      return output;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Planner Failed', error instanceof Error ? error.stack : undefined, { duration });

      // Fallback to stub outline if enabled
      if (this.enableStubFallback) {
        this.logger.log('Attempting fallback to stub outline');
        try {
          const stubOutput = generateStubOutline(seed);
          this.logger.log('Stub outline generated successfully');
          return stubOutput;
        } catch (stubError) {
          this.logger.error('Stub outline generation also failed', stubError instanceof Error ? stubError.stack : undefined);
        }
      }

      throw error;
    } finally {
      this.metrics.logStats();
    }
  }

  /**
   * Validate input seed data
   */
  private validateInput(seed: EpisodeSeed): void {
    try {
      // First validate structure with Zod
      EpisodeSeedSchema.parse(seed);
      
      // Then sanitize and validate content
      const sanitized = validateAndSanitizeSeed(seed);
      
      // Check for injection patterns in original seed (for monitoring)
      const seedString = JSON.stringify(seed);
      if (containsInjectionPatterns(seedString)) {
        this.logger.warn('Potential prompt injection pattern detected in seed input');
      }
      
      this.logger.debug('Input validation and sanitization passed');
    } catch (error) {
      if (error instanceof ZodError) {
        const details = formatZodError(error);
        this.logger.error('Input validation failed', undefined, { details });
        throw new PlannerValidationError('Invalid episode seed data', details);
      }
      this.logger.error('Input sanitization failed', error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Generate outline with retry logic
   */
  private async generateOutlineWithRetry(seed: EpisodeSeed): Promise<PlannerOutput> {
    let currentAttempt = 0;

    try {
      const output = await withRetry(
        async () => {
          currentAttempt++;
          return this.provider === 'openai'
            ? await this.generateOutlineOpenAI(seed)
            : await this.generateOutlineGemini(seed);
        },
        this.retryConfig,
        `Planner (${this.provider})`
      );

      this.metrics.recordSuccess(currentAttempt);
      return output;
    } catch (error) {
      // Determine error type for metrics
      let errorType: 'validation' | 'json' | 'api' = 'api';
      if (error instanceof PlannerValidationError) {
        errorType = 'validation';
      } else if (error instanceof PlannerJsonExtractionError) {
        errorType = 'json';
      }

      this.metrics.recordFailure(currentAttempt, errorType);
      throw error;
    }
  }

  /**
   * Generate outline using OpenAI with validation
   */
  private async generateOutlineOpenAI(seed: EpisodeSeed): Promise<PlannerOutput> {
    if (!this.openaiApiKey) {
      throw new PlannerApiError('OPENAI_API_KEY not set', 'openai');
    }

    const { system, user, schema } = this.buildPrompt(seed);

    try {
      this.logger.log(`Calling OpenAI ${this.openaiModel} for manga planning`);

      const response = await this.openaiClient.chat.completions.create({
        model: this.openaiModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        // Note: GPT-5-mini only supports default temperature of 1, so we omit it
        response_format: { type: 'json_object' },
      });

      const text = response.choices[0]?.message?.content;
      if (!text) {
        throw new PlannerApiError('No response content from OpenAI', 'openai');
      }

      this.logger.debug('Response received, extracting and validating JSON');
      return this.extractAndValidate(text, seed);
    } catch (error) {
      if (error instanceof PlannerValidationError || error instanceof PlannerJsonExtractionError) {
        throw error;
      }

      this.logger.error('OpenAI API error', error instanceof Error ? error.stack : undefined);
      throw new PlannerApiError(
        `OpenAI API failed: ${error instanceof Error ? error.message : String(error)}`,
        'openai'
      );
    }
  }

  /**
   * Generate outline using Gemini with validation
   */
  private async generateOutlineGemini(seed: EpisodeSeed): Promise<PlannerOutput> {
    if (!this.geminiApiKey) {
      throw new PlannerApiError('GEMINI_API_KEY not set', 'gemini');
    }

    const { system, user, schema } = this.buildPrompt(seed);

    try {
      this.logger.log(`Calling Gemini ${this.geminiModel} for manga planning`);

      const model = this.geminiClient.getGenerativeModel({
        model: this.geminiModel,
        systemInstruction: system,
      });

      const result = await model.generateContent(user);
      const text = result.response.text();

      if (!text) {
        throw new PlannerApiError('No response content from Gemini', 'gemini');
      }

      this.logger.debug('Response received, extracting and validating JSON');
      return this.extractAndValidate(text, seed);
    } catch (error) {
      if (error instanceof PlannerValidationError || error instanceof PlannerJsonExtractionError) {
        throw error;
      }

      this.logger.error('Gemini API error', error instanceof Error ? error.stack : undefined);
      throw new PlannerApiError(
        `Gemini API failed: ${error instanceof Error ? error.message : String(error)}`,
        'gemini'
      );
    }
  }

  /**
   * Extract JSON and validate against schema
   */
  private extractAndValidate(text: string, seed: EpisodeSeed): PlannerOutput {
    // Step 1: Extract JSON
    let json: any;
    try {
      json = extractAndRepairJson(text);
      this.logger.debug('JSON extraction successful');
    } catch (error) {
      this.logger.error('JSON extraction failed', error instanceof Error ? error.stack : undefined);
      throw new PlannerJsonExtractionError(
        `Failed to extract JSON: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Step 2: Validate against schema
    try {
      const validated = PlannerOutputSchema.parse(json);
      this.logger.debug('Schema validation passed');
      return validated;
    } catch (error) {
      if (error instanceof ZodError) {
        const details = formatZodError(error);
        this.logger.error('Schema validation failed', undefined, { details });

        // Attempt partial merge if enabled
        if (this.enablePartialMerge) {
          this.logger.log('Attempting to merge partial output with stub');
          try {
            const merged = mergeWithStub(json as Partial<PlannerOutput>, seed);
            // Validate the merged result
            const validatedMerged = PlannerOutputSchema.parse(merged);
            this.logger.log('Partial merge successful and validated');
            return validatedMerged;
          } catch (mergeError) {
            this.logger.error('Partial merge failed', mergeError instanceof Error ? mergeError.stack : undefined);
          }
        }

        throw new PlannerValidationError('Output validation failed', details);
      }
      throw error;
    }
  }

  /**
   * Build prompt for AI generation
   */
  private buildPrompt(seed: EpisodeSeed) {
    const system = [
      'You are a manga production planner. Return STRICT JSON that adheres to the provided schema.',
      'Keep all values concise but specific and visual.',
      'Also prepare a concise character bible with stable asset filenames to be used as image references like <aoi.png>.',
      'Provide structured dialogue suggestions per panel for each page. These dialogues are for overlays (not baked into the image).',
      'When writing page prompts, explicitly reference characters using <asset_filename> tags and include staging.',
    ].join('\n');

    const schema = `{
  "characters": [
    {
      "name": "Aoi",
      "description": "concise visual design: hair/eyes/outfit/silhouette/props/pose",
      "asset_filename": "aoi.png"
    }
  ],
  "pages": [
    {
      "page_number": 1,
      "beat": "One-sentence story beat for this page",
      "setting": "Where/when",
      "key_actions": ["visually observable actions only"],
      "layout_hints": { "panels": 3-6, "notes": "angles, energy, pacing" },
      "visual_style": "global style description for the whole episode",
      "introduce_new_character": false,
      "new_characters": [],
      "dialogues": [
        {
          "panel_number": 1,
          "character": "Aoi",
          "text": "What was that sound?",
          "type": "dialogue"
        },
        {
          "panel_number": 2,
          "character": "Aoi",
          "text": "I need to find out...",
          "type": "thought"
        },
        {
          "panel_number": 3,
          "character": null,
          "text": "The wind howled through the empty streets",
          "type": "narration"
        },
        {
          "panel_number": 3,
          "character": null,
          "text": "WHOOSH",
          "type": "sound_effect"
        }
      ],
      "prompt": "<aoi.png> stands on the rooftop at dusk..."
    }
    // up to page 10
  ]
}`;

    const user = [
      'Make a 10-page outline for a manga episode based on this seed:',
      `- title: ${seed.title}`,
      `- description: ${seed.description ?? ''}`,
      `- genre_tags: ${JSON.stringify(seed.genre_tags)}`,
      `- tone: ${seed.tone}`,
      `- setting: ${seed.setting}`,
      `- visual_vibe: ${seed.visual_vibe ?? ''}`,
      `- cast: ${JSON.stringify(seed.cast)}`,
      '',
      'Schema:',
      schema,
      '',
      'Constraints:',
      '- Page 1 establishes the style, cast silhouettes/outfits, time-of-day, and overall look.',
      '- Pages 2–10 must escalate or vary setting per beat, while staying within the same art style.',
      '- characters: include ALL main cast (from seed) + any new characters introduced by outline.',
      '- asset_filename: kebab-case or snake_case, ASCII only, .png extension, unique per character.',
      '- In each page.prompt reference characters via <asset_filename> tags used in characters[].',
      '- dialogues: Write compelling dialogue, thoughts, narration, and sound effects for each panel.',
      '- Include 3-6 dialogue entries per page matching the panel count in layout_hints.',
      '- Dialogue type must be EXACTLY one of: "dialogue", "thought", "narration", "sound_effect" (no other values).',
      '- For "dialogue" and "thought" types, character must be the character name. For "narration" and "sound_effect", character should be null.',
      '- Dialogue should advance the story, reveal character, and create engaging manga reading experience.',
      '- Output must be valid JSON and fit the schema exactly.',
      '- CRITICAL: Return exactly 10 pages, numbered 1 through 10.',
      '- CRITICAL: Ensure all panel_number values in dialogues do not exceed the panels count in layout_hints.',
      '',
      'Return ONLY the JSON. No prose, no markdown fences.',
    ].join('\n');

    return { system, user, schema };
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return this.metrics.getStats();
  }
}
