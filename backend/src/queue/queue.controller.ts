import { Controller, Get, Post, Delete, Param, HttpException, HttpStatus } from '@nestjs/common';
import { QueueService } from './queue.service';

/**
 * Queue Administration Controller
 *
 * Provides endpoints for monitoring and managing background job queues.
 * Useful for debugging, monitoring, and administrative tasks.
 */
@Controller('admin/queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  /**
   * Get queue statistics and health
   */
  @Get('stats')
  async getStats() {
    return await this.queueService.getQueueStats();
  }

  /**
   * Pause all queues (stops processing new jobs)
   */
  @Post('pause')
  async pause() {
    if (!this.queueService.enabled) {
      throw new HttpException('Queue is not enabled', HttpStatus.SERVICE_UNAVAILABLE);
    }

    await this.queueService.pauseQueues();
    return { success: true, message: 'Queues paused' };
  }

  /**
   * Resume all queues
   */
  @Post('resume')
  async resume() {
    if (!this.queueService.enabled) {
      throw new HttpException('Queue is not enabled', HttpStatus.SERVICE_UNAVAILABLE);
    }

    await this.queueService.resumeQueues();
    return { success: true, message: 'Queues resumed' };
  }

  /**
   * Clean old completed and failed jobs
   */
  @Post('clean')
  async clean() {
    if (!this.queueService.enabled) {
      throw new HttpException('Queue is not enabled', HttpStatus.SERVICE_UNAVAILABLE);
    }

    await this.queueService.cleanQueues();
    return { success: true, message: 'Old jobs cleaned' };
  }

  /**
   * Get job details
   */
  @Get(':queue/:jobId')
  async getJob(@Param('queue') queue: string, @Param('jobId') jobId: string) {
    if (!this.queueService.enabled) {
      throw new HttpException('Queue is not enabled', HttpStatus.SERVICE_UNAVAILABLE);
    }

    if (queue !== 'page' && queue !== 'character') {
      throw new HttpException('Invalid queue name', HttpStatus.BAD_REQUEST);
    }

    const job = await this.queueService.getJob(queue as 'page' | 'character', jobId);
    if (!job) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      timestamp: job.timestamp,
    };
  }

  /**
   * Cancel a job
   */
  @Delete(':queue/:jobId')
  async cancelJob(@Param('queue') queue: string, @Param('jobId') jobId: string) {
    if (!this.queueService.enabled) {
      throw new HttpException('Queue is not enabled', HttpStatus.SERVICE_UNAVAILABLE);
    }

    if (queue !== 'page' && queue !== 'character') {
      throw new HttpException('Invalid queue name', HttpStatus.BAD_REQUEST);
    }

    const success = await this.queueService.cancelJob(queue as 'page' | 'character', jobId);
    if (!success) {
      throw new HttpException('Failed to cancel job or job not found', HttpStatus.NOT_FOUND);
    }

    return { success: true, message: 'Job cancelled' };
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  async health() {
    return {
      enabled: this.queueService.enabled,
      status: this.queueService.enabled ? 'operational' : 'disabled',
    };
  }
}
