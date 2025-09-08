import { Injectable, Logger } from '@nestjs/common';
import { Queue, JobsOptions } from 'bullmq';

export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private generateQueue?: Queue;

  constructor() {
    const url = process.env.REDIS_URL;
    if (url) {
      this.generateQueue = new Queue('generate_page', { connection: { url } });
      this.logger.log('BullMQ enabled (REDIS_URL detected)');
    } else {
      this.logger.log('BullMQ disabled (no REDIS_URL)');
    }
  }

  get enabled() {
    return !!this.generateQueue;
  }

  async enqueueGeneratePage(episodeId: string, page: number, data: Record<string, any> = {}, opts: JobsOptions = {}) {
    if (!this.generateQueue) return;
    await this.generateQueue.add(
      'generate_page',
      { episodeId, page, ...data },
      { removeOnComplete: 100, removeOnFail: 100, ...opts },
    );
  }
}

