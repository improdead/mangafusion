# Planner Service - Hardened Implementation

This directory contains the hardened planner service with comprehensive validation, retry logic, and fallback strategies.

## Overview

The planner service generates 10-page manga outlines using AI (OpenAI GPT or Google Gemini). The hardened implementation includes:

- **Strict schema validation** using Zod
- **Retry logic** with exponential backoff
- **JSON extraction and repair** for malformed responses
- **Partial merge** for incomplete AI outputs
- **Stub fallback** for complete failures
- **Comprehensive metrics and logging**

## Files

- `planner.service.ts` - Main service with all hardening features
- `schemas.ts` - Zod schemas for input/output validation
- `planner.utils.ts` - Retry logic, JSON extraction, and metrics
- `planner.fallback.ts` - Stub outline generation and partial merge
- `planner.module.ts` - NestJS module definition

## Environment Variables

### Required
- `OPENAI_API_KEY` or `GEMINI_API_KEY` - API key for the chosen provider

### Optional Configuration

```bash
# Provider selection (default: openai)
PLANNER_PROVIDER=openai  # or 'gemini'

# Model selection
OPENAI_PLANNER_MODEL=gpt-5-mini
PLANNER_MODEL=gemini-2.5-flash

# Retry configuration
PLANNER_MAX_RETRIES=3                # Max retry attempts (default: 3)
PLANNER_INITIAL_DELAY_MS=1000        # Initial retry delay (default: 1000ms)
PLANNER_MAX_DELAY_MS=10000           # Max retry delay (default: 10000ms)
PLANNER_BACKOFF_MULTIPLIER=2         # Exponential backoff multiplier (default: 2)

# Fallback configuration
PLANNER_ENABLE_STUB_FALLBACK=true    # Enable stub outline fallback (default: true)
PLANNER_ENABLE_PARTIAL_MERGE=true    # Enable partial merge (default: true)
```

## Features

### 1. Input Validation

All episode seed data is validated before being sent to the AI:

- Title: Required, 1-200 characters
- Genre tags: 1-10 tags required
- Tone: Required, max 100 characters
- Setting: Required, max 500 characters
- Cast: 1-20 unique characters required
- Visual vibe: Optional, max 500 characters
- Description: Optional, max 2000 characters

### 2. Output Validation

AI responses are validated against a strict schema:

- Exactly 10 pages required
- Pages numbered sequentially 1-10
- Each page must have:
  - Story beat
  - Setting
  - Key actions (at least 1)
  - Layout hints (3-6 panels)
  - Dialogues (at least 1)
  - Panel numbers in dialogues must not exceed panel count
- Characters must have:
  - Name
  - Description
  - Valid asset filename (kebab-case/snake_case, .png, ASCII only)

### 3. Retry Logic

Failed API calls are retried up to 3 times (configurable) with exponential backoff:

- Attempt 1: Immediate
- Attempt 2: After 1 second (configurable)
- Attempt 3: After 2 seconds (configurable)

### 4. JSON Extraction

Multiple strategies are used to extract JSON from AI responses:

1. Direct parse
2. Trim and parse
3. Find balanced braces
4. Extract from markdown code fence
5. Remove common prefixes
6. JSON repair (remove trailing commas, comments, etc.)

### 5. Error Handling

Three custom error types provide detailed information:

- `PlannerValidationError` - Schema validation failed
- `PlannerJsonExtractionError` - Could not extract valid JSON
- `PlannerApiError` - API call failed

### 6. Fallback Strategies

**Partial Merge**: If AI returns incomplete but partially valid data, the system merges it with a stub outline.

**Stub Outline**: As a last resort, generates a basic but valid outline using the seed data.

### 7. Metrics

The service tracks and logs:

- Success/failure counts
- Success rate percentage
- Average attempts per request
- Retry successes
- Error type breakdown (validation/JSON/API)

## Usage Example

```typescript
import { PlannerService } from './planner/planner.service';

const planner = new PlannerService();

const seed = {
  title: 'The Last Guardian',
  genre_tags: ['action', 'fantasy'],
  tone: 'epic and dramatic',
  setting: 'A post-apocalyptic city',
  visual_vibe: 'Dark fantasy with high contrast',
  description: 'A lone warrior protects the last sanctuary',
  cast: [
    {
      name: 'Kira',
      traits: 'brave, determined',
      silhouette: 'athletic build',
      outfit: 'armored cloak',
    },
  ],
};

try {
  const outline = await planner.generateOutline(seed);
  console.log('Generated outline:', outline);

  // Get metrics
  const metrics = planner.getMetrics();
  console.log('Metrics:', metrics);
} catch (error) {
  console.error('Failed to generate outline:', error);
}
```

## Error Messages

The service provides detailed error messages:

```
Input validation failed:
  - title: Title is required
  - cast: At least one cast member is required

Schema validation failed:
  - pages: Exactly 10 pages are required
  - pages.0.dialogues: At least one dialogue entry is required per page
```

## Testing

See the test file for comprehensive testing examples:

```bash
npm run dev

# Make a test request to the episode endpoint
curl -X POST http://localhost:3000/episodes \
  -H "Content-Type: application/json" \
  -d @test-seed.json
```

## Performance

Typical performance with retry logic:

- Success on first attempt: ~3-10 seconds
- Success on retry: ~5-15 seconds
- Fallback to stub: <100ms

## Monitoring

Check logs for detailed information:

```
=== Starting Planner Request ===
Provider: openai
Seed title: The Last Guardian
Input validation passed
[Planner (openai)] Attempt 1/3
Calling OpenAI gpt-5-mini for manga planning...
Response received, extracting and validating JSON...
JSON extraction successful
Schema validation passed
=== Planner Success (4523ms) ===
=== Planner Metrics ===
  successCount: 1
  failureCount: 0
  totalRequests: 1
  successRate: 100.00%
  averageAttempts: 1.00
  retrySuccesses: 0
  validationErrors: 0
  jsonExtractionErrors: 0
  apiErrors: 0
======================
```

## Limitations

1. **Stub fallback** generates basic outlines that may lack narrative depth
2. **Partial merge** may not catch all AI errors
3. **JSON repair** has limitations with heavily malformed JSON
4. **Retry logic** increases latency on failures

## Future Improvements

- Add caching for similar requests
- Implement progressive prompting for better AI responses
- Add support for custom validation rules
- Implement streaming responses for better UX
- Add A/B testing between providers
