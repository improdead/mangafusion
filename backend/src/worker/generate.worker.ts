/**
 * MangaFusion Background Worker
 *
 * This worker processes background jobs for:
 * - Character generation (higher priority)
 * - Page generation (parallel processing)
 *
 * It requires REDIS_URL to be set and optionally uses DATABASE_URL for persistence.
 *
 * Environment Variables:
 * - REDIS_URL: Redis connection string (required)
 * - DATABASE_URL: PostgreSQL connection string (optional)
 * - WORKER_CONCURRENCY_PAGES: Number of concurrent page jobs (default: 2)
 * - WORKER_CONCURRENCY_CHARACTERS: Number of concurrent character jobs (default: 1)
 * - GEMINI_API_KEY or OPENAI_API_KEY: Required for image generation
 */

import 'dotenv/config';
import { Worker, QueueEvents, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import type { GeneratePageJobData, GenerateCharacterJobData } from '../queue/queue.service';
import type { EventPayload } from '../events/events.service';

// ==================== Configuration ====================

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error('REDIS_URL not set. Worker cannot start.');
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;
const CONCURRENCY_PAGES = parseInt(process.env.WORKER_CONCURRENCY_PAGES || '2', 10);
const CONCURRENCY_CHARACTERS = parseInt(process.env.WORKER_CONCURRENCY_CHARACTERS || '1', 10);

console.log(`[worker] Starting with configuration:
  - Page concurrency: ${CONCURRENCY_PAGES}
  - Character concurrency: ${CONCURRENCY_CHARACTERS}
  - Database: ${DATABASE_URL ? 'enabled' : 'disabled'}
`);

// ==================== Prisma Client ====================

const prisma = DATABASE_URL ? new PrismaClient() : undefined;

// ==================== Redis Event Publisher ====================

const eventPublisher = new Redis(REDIS_URL);

async function emitEvent(event: EventPayload): Promise<void> {
  try {
    await eventPublisher.publish('worker:events', JSON.stringify(event));
  } catch (error) {
    console.error('[worker] Failed to publish event:', error);
  }
}

// ==================== Storage Service (Standalone) ====================

class WorkerStorageService {
  private supabase: any = null;
  private readonly bucket: string;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    this.bucket = process.env.SUPABASE_BUCKET || 'manga-images';

    if (url && key) {
      this.supabase = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  get enabled(): boolean {
    return this.supabase !== null;
  }

  async uploadImage(buffer: Buffer, filename: string, contentType = 'image/png'): Promise<string> {
    if (!this.supabase) {
      // Return placeholder if storage not configured
      const encoded = encodeURIComponent(filename.split('/').pop() || 'page');
      return `https://placehold.co/1024x1536?text=${encoded}`;
    }

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .upload(filename, buffer, { contentType, upsert: true });

    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    const { data: publicData } = this.supabase.storage.from(this.bucket).getPublicUrl(data.path);
    return publicData.publicUrl;
  }
}

const storage = new WorkerStorageService();

// ==================== Renderer Service (Standalone) ====================

class WorkerRendererService {
  private readonly geminiApiKey = process.env.GEMINI_API_KEY;
  private readonly openaiApiKey = process.env.OPENAI_API_KEY;
  private readonly provider = process.env.RENDERER_PROVIDER || 'gemini';
  private readonly geminiModel = process.env.RENDERER_GEMINI_MODEL || 'gemini-2.0-flash-exp';
  private readonly openaiModel = process.env.RENDERER_OPENAI_MODEL || 'gpt-image-1';

  private get geminiClient() {
    if (!this.geminiApiKey) throw new Error('GEMINI_API_KEY not set');
    return new GoogleGenerativeAI(this.geminiApiKey);
  }

  private get openaiClient() {
    if (!this.openaiApiKey) throw new Error('OPENAI_API_KEY not set');
    return new OpenAI({ apiKey: this.openaiApiKey });
  }

  async generatePageImage(
    prompt: string,
    seed: number,
    episodeTitle: string,
    pageNumber: number,
  ): Promise<{ imageUrl: string; seed: number }> {
    if (this.provider === 'openai') {
      return this.generateWithOpenAI(prompt, seed, episodeTitle, pageNumber);
    } else {
      return this.generateWithGemini(prompt, seed, episodeTitle, pageNumber);
    }
  }

  private async generateWithGemini(
    prompt: string,
    seed: number,
    episodeTitle: string,
    pageNumber: number,
  ): Promise<{ imageUrl: string; seed: number }> {
    console.log(`[renderer] Generating with Gemini ${this.geminiModel}`);

    const model = this.geminiClient.getGenerativeModel({
      model: this.geminiModel,
    });

    const result = await model.generateContent([prompt]);
    const response = result.response;

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error('No image generated by Gemini');
    }

    // Gemini returns base64 image in parts
    const imagePart = response.candidates[0].content.parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
    if (!imagePart?.inlineData?.data) {
      throw new Error('No image data in Gemini response');
    }

    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
    const padded = String(pageNumber).padStart(2, '0');
    const filename = `episodes/${episodeTitle.replace(/[^a-zA-Z0-9]/g, '_')}/page_${padded}_${seed}.png`;
    const imageUrl = await storage.uploadImage(imageBuffer, filename, 'image/png');

    return { imageUrl, seed };
  }

  private async generateWithOpenAI(
    prompt: string,
    seed: number,
    episodeTitle: string,
    pageNumber: number,
  ): Promise<{ imageUrl: string; seed: number }> {
    console.log(`[renderer] Generating with OpenAI ${this.openaiModel}`);

    const response = await this.openaiClient.images.generate({
      model: this.openaiModel,
      prompt: prompt.slice(0, 32000),
      n: 1,
      size: '1024x1792',
      quality: 'hd',
      style: 'natural',
      response_format: 'b64_json',
    });

    const imageData = response.data?.[0];
    if (!imageData?.b64_json && !imageData?.url) {
      throw new Error('No image data returned from OpenAI');
    }

    let imageBuffer: Buffer;
    if (imageData.b64_json) {
      imageBuffer = Buffer.from(imageData.b64_json, 'base64');
    } else if (imageData.url) {
      const imgResponse = await fetch(imageData.url);
      imageBuffer = Buffer.from(await imgResponse.arrayBuffer());
    } else {
      throw new Error('Unable to get image from OpenAI response');
    }

    const padded = String(pageNumber).padStart(2, '0');
    const filename = `episodes/${episodeTitle.replace(/[^a-zA-Z0-9]/g, '_')}/page_${padded}_${seed}.png`;
    const imageUrl = await storage.uploadImage(imageBuffer, filename, 'image/png');

    return { imageUrl, seed };
  }

  async generateCharacterImage(
    name: string,
    description: string,
    visualStyle: string,
    episodeTitle: string,
    assetFilename: string,
  ): Promise<{ imageUrl: string }> {
    const prompt = `Character design sheet for "${name}": ${description}. Visual style: ${visualStyle}.
Full body character turnaround, front view, manga/anime art style, white background, clean lines, professional character concept art.`;

    const seed = Math.floor(Math.random() * 1_000_000);

    if (this.provider === 'openai') {
      const response = await this.openaiClient.images.generate({
        model: this.openaiModel,
        prompt: prompt.slice(0, 32000),
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        response_format: 'b64_json',
      });

      const imageData = response.data?.[0];
      if (!imageData?.b64_json && !imageData?.url) {
        throw new Error('No image data returned from OpenAI');
      }

      let imageBuffer: Buffer;
      if (imageData.b64_json) {
        imageBuffer = Buffer.from(imageData.b64_json, 'base64');
      } else if (imageData.url) {
        const imgResponse = await fetch(imageData.url);
        imageBuffer = Buffer.from(await imgResponse.arrayBuffer());
      } else {
        throw new Error('Unable to get image from OpenAI response');
      }

      const filename = `episodes/${episodeTitle.replace(/[^a-zA-Z0-9]/g, '_')}/characters/${assetFilename}`;
      const imageUrl = await storage.uploadImage(imageBuffer, filename, 'image/png');
      return { imageUrl };
    } else {
      const model = this.geminiClient.getGenerativeModel({
        model: this.geminiModel,
      });

      const result = await model.generateContent([prompt]);
      const response = result.response;

      const imagePart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
      if (!imagePart?.inlineData?.data) {
        throw new Error('No image data in Gemini response');
      }

      const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
      const filename = `episodes/${episodeTitle.replace(/[^a-zA-Z0-9]/g, '_')}/characters/${assetFilename}`;
      const imageUrl = await storage.uploadImage(imageBuffer, filename, 'image/png');
      return { imageUrl };
    }
  }
}

const renderer = new WorkerRendererService();

// ==================== Job Processors ====================

async function processPageJob(job: Job<GeneratePageJobData>) {
  const { episodeId, pageId, pageNumber, seed, styleRefUrls, editPrompt, baseImageUrl, dialogueTextOverride } = job.data;

  console.log(`[worker:page] Processing page ${pageNumber} for episode ${episodeId}`);

  try {
    // Emit progress start
    await emitEvent({
      type: 'page_progress',
      episodeId,
      page: pageNumber,
      pct: 5,
    });

    // Update page status to in_progress
    if (prisma) {
      await prisma.page.update({
        where: { id: pageId },
        data: { status: 'in_progress' },
      });
    }

    // Get episode and outline from database
    if (!prisma) {
      throw new Error('Database not configured - cannot retrieve episode data');
    }

    const episode = await prisma.episode.findUnique({
      where: { id: episodeId },
      include: { characters: true },
    });

    if (!episode) {
      throw new Error(`Episode ${episodeId} not found`);
    }

    const outline = episode.outline as any;
    const pageOutline = outline?.pages?.find((p: any) => p.page_number === pageNumber);
    if (!pageOutline) {
      throw new Error(`Page ${pageNumber} outline not found`);
    }

    await emitEvent({
      type: 'page_progress',
      episodeId,
      page: pageNumber,
      pct: 25,
    });

    // Build prompt (simplified version)
    const visualStyle = pageOutline.visual_style || outline?.pages?.[0]?.visual_style || 'manga style';
    const beat = pageOutline.beat || '';
    const setting = pageOutline.setting || '';
    const actions = pageOutline.key_actions?.join(', ') || '';

    let prompt = `Manga page ${pageNumber} for "${episode.seedInput?.title || 'manga'}".
Beat: ${beat}
Setting: ${setting}
Actions: ${actions}
Visual style: ${visualStyle}`;

    if (editPrompt) {
      prompt += `\n\nUser edit request: ${editPrompt}`;
    }

    const useSeed = seed || Math.floor(Math.random() * 1_000_000);

    await emitEvent({
      type: 'page_progress',
      episodeId,
      page: pageNumber,
      pct: 50,
    });

    // Generate the image
    const result = await renderer.generatePageImage(
      prompt,
      useSeed,
      (episode.seedInput as any)?.title || 'manga',
      pageNumber,
    );

    await emitEvent({
      type: 'page_progress',
      episodeId,
      page: pageNumber,
      pct: 90,
    });

    // Update database
    if (prisma) {
      await prisma.page.update({
        where: { id: pageId },
        data: {
          status: 'done',
          imageUrl: result.imageUrl,
          seed: result.seed,
          version: { increment: 1 },
        },
      });
    }

    // Emit completion
    const updatedPage = await prisma?.page.findUnique({ where: { id: pageId } });
    await emitEvent({
      type: 'page_done',
      episodeId,
      page: pageNumber,
      imageUrl: result.imageUrl,
      seed: result.seed,
      version: updatedPage?.version || 1,
    });

    console.log(`[worker:page] Completed page ${pageNumber} for episode ${episodeId}`);
    return result;
  } catch (error: any) {
    console.error(`[worker:page] Failed page ${pageNumber}:`, error);

    // Update database with error
    if (prisma) {
      await prisma.page.update({
        where: { id: pageId },
        data: {
          status: 'failed',
          error: error.message || String(error),
        },
      });
    }

    // Emit failure event
    await emitEvent({
      type: 'page_failed',
      episodeId,
      page: pageNumber,
      error: error.message || String(error),
    });

    throw error; // Re-throw to mark job as failed
  }
}

async function processCharacterJob(job: Job<GenerateCharacterJobData>) {
  const { episodeId, characterId, name, description, assetFilename, visualStyle, episodeTitle } = job.data;

  console.log(`[worker:character] Processing character "${name}" for episode ${episodeId}`);

  try {
    // Generate character image
    const result = await renderer.generateCharacterImage(
      name,
      description,
      visualStyle,
      episodeTitle,
      assetFilename,
    );

    // Update database
    if (prisma) {
      await (prisma as any).character.update({
        where: { id: characterId },
        data: { imageUrl: result.imageUrl },
      });
    }

    console.log(`[worker:character] Completed character "${name}" for episode ${episodeId}`);
    return result;
  } catch (error: any) {
    console.error(`[worker:character] Failed character "${name}":`, error);
    throw error;
  }
}

// ==================== Worker Setup ====================

const pageWorker = new Worker('generate:page', processPageJob, {
  connection: { url: REDIS_URL },
  concurrency: CONCURRENCY_PAGES,
});

const characterWorker = new Worker('generate:character', processCharacterJob, {
  connection: { url: REDIS_URL },
  concurrency: CONCURRENCY_CHARACTERS,
});

// Queue events for monitoring
const pageEvents = new QueueEvents('generate:page', { connection: { url: REDIS_URL } });
const characterEvents = new QueueEvents('generate:character', { connection: { url: REDIS_URL } });

// ==================== Event Handlers ====================

pageWorker.on('ready', () => console.log('[worker:page] Ready to process jobs'));
pageWorker.on('failed', (job, err) => console.error('[worker:page] Job failed:', job?.id, err.message));
pageWorker.on('completed', (job) => console.log('[worker:page] Job completed:', job.id));

characterWorker.on('ready', () => console.log('[worker:character] Ready to process jobs'));
characterWorker.on('failed', (job, err) => console.error('[worker:character] Job failed:', job?.id, err.message));
characterWorker.on('completed', (job) => console.log('[worker:character] Job completed:', job.id));

// ==================== Graceful Shutdown ====================

async function shutdown() {
  console.log('\n[worker] Shutting down gracefully...');

  await Promise.all([
    pageWorker.close(),
    characterWorker.close(),
    pageEvents.close(),
    characterEvents.close(),
    eventPublisher.quit(),
  ]);

  if (prisma) {
    await prisma.$disconnect();
  }

  console.log('[worker] Shutdown complete');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('[worker] Workers started successfully');

