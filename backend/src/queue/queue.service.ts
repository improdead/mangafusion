import { Injectable, Logger } from '@nestjs/common';
import { Queue, JobsOptions, Job } from 'bullmq';

export interface GeneratePageJobData {
  episodeId: string;
  pageId: string;
  pageNumber: number;
  seed?: number;
  styleRefUrls?: string[];
  editPrompt?: string;
  baseImageUrl?: string;
  dialogueTextOverride?: string;
}

export interface GenerateCharacterJobData {
  episodeId: string;
  characterId: string;
  name: string;
  description: string;
  assetFilename: string;
  visualStyle: string;
  episodeTitle: string;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private pageQueue?: Queue;
  private characterQueue?: Queue;

  constructor() {
    const url = process.env.REDIS_URL;
    if (url) {
      // Page generation queue (lower priority, parallel processing)
      this.pageQueue = new Queue('generate-page', {
        connection: { url },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 200,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      // Character generation queue (higher priority, runs before pages)
      this.characterQueue = new Queue('generate-character', {
        connection: { url },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 200,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      this.logger.log('BullMQ enabled');
    } else {
      this.logger.debug('BullMQ disabled - using in-process generation');
    }
  }

  get enabled() {
    return !!(this.pageQueue && this.characterQueue);
  }

  /**
   * Enqueue a page generation job
   */
  async enqueueGeneratePage(data: GeneratePageJobData, opts: JobsOptions = {}): Promise<Job | undefined> {
    if (!this.pageQueue) return undefined;

    const job = await this.pageQueue.add(
      'generate_page',
      data,
      {
        jobId: `page:${data.episodeId}:${data.pageNumber}`,
        priority: 10, // Lower number = higher priority
        ...opts,
      },
    );

    this.logger.debug(`Enqueued page generation: episode=${data.episodeId} page=${data.pageNumber} jobId=${job.id}`);
    return job;
  }

  /**
   * Enqueue a character generation job (higher priority than pages)
   */
  async enqueueGenerateCharacter(data: GenerateCharacterJobData, opts: JobsOptions = {}): Promise<Job | undefined> {
    if (!this.characterQueue) return undefined;

    const job = await this.characterQueue.add(
      'generate_character',
      data,
      {
        jobId: `character:${data.episodeId}:${data.assetFilename}`,
        priority: 1, // Higher priority than pages
        ...opts,
      },
    );

    this.logger.debug(`Enqueued character generation: episode=${data.episodeId} character=${data.name} jobId=${job.id}`);
    return job;
  }

  /**
   * Get job status by ID
   */
  async getJob(queue: 'page' | 'character', jobId: string): Promise<Job | undefined> {
    const q = queue === 'page' ? this.pageQueue : this.characterQueue;
    if (!q) return undefined;
    return await q.getJob(jobId);
  }

  /**
   * Cancel a job
   */
  async cancelJob(queue: 'page' | 'character', jobId: string): Promise<boolean> {
    const job = await this.getJob(queue, jobId);
    if (!job) return false;

    try {
      await job.remove();
      this.logger.debug(`Cancelled job: ${jobId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to cancel job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    if (!this.enabled) {
      return { enabled: false };
    }

    const [pageCounts, characterCounts] = await Promise.all([
      this.pageQueue!.getJobCounts(),
      this.characterQueue!.getJobCounts(),
    ]);

    return {
      enabled: true,
      pages: {
        waiting: pageCounts.waiting,
        active: pageCounts.active,
        completed: pageCounts.completed,
        failed: pageCounts.failed,
        delayed: pageCounts.delayed,
      },
      characters: {
        waiting: characterCounts.waiting,
        active: characterCounts.active,
        completed: characterCounts.completed,
        failed: characterCounts.failed,
        delayed: characterCounts.delayed,
      },
    };
  }

  /**
   * Clean up completed and failed jobs
   */
  async cleanQueues(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.enabled) return;

    await Promise.all([
      this.pageQueue!.clean(olderThanMs, 100, 'completed'),
      this.pageQueue!.clean(olderThanMs, 100, 'failed'),
      this.characterQueue!.clean(olderThanMs, 100, 'completed'),
      this.characterQueue!.clean(olderThanMs, 100, 'failed'),
    ]);

    this.logger.log(`Cleaned jobs older than ${olderThanMs}ms`);
  }

  /**
   * Pause/Resume queues
   */
  async pauseQueues(): Promise<void> {
    if (!this.enabled) return;
    await Promise.all([
      this.pageQueue!.pause(),
      this.characterQueue!.pause(),
    ]);
    this.logger.log('Queues paused');
  }

  async resumeQueues(): Promise<void> {
    if (!this.enabled) return;
    await Promise.all([
      this.pageQueue!.resume(),
      this.characterQueue!.resume(),
    ]);
    this.logger.log('Queues resumed');
  }
}

