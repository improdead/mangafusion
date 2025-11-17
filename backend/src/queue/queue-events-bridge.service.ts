import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { EventsService, EventPayload } from '../events/events.service';

/**
 * Bridge service that listens to Redis pub/sub for worker events
 * and forwards them to the SSE EventsService.
 *
 * This allows background workers to emit progress events that are
 * delivered to frontend clients via SSE.
 */
@Injectable()
export class QueueEventsBridgeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueEventsBridgeService.name);
  private redisSubscriber?: Redis;
  private pageQueueEvents?: QueueEvents;
  private characterQueueEvents?: QueueEvents;
  private readonly WORKER_EVENTS_CHANNEL = 'worker:events';

  constructor(private readonly eventsService: EventsService) {}

  async onModuleInit() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.log('Redis events bridge disabled (no REDIS_URL)');
      return;
    }

    try {
      // Setup Redis pub/sub subscriber for worker events
      this.redisSubscriber = new Redis(url, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });

      this.redisSubscriber.subscribe(this.WORKER_EVENTS_CHANNEL, (err) => {
        if (err) {
          this.logger.error('Failed to subscribe to worker events channel:', err);
        } else {
          this.logger.log(`Subscribed to ${this.WORKER_EVENTS_CHANNEL} for worker event forwarding`);
        }
      });

      this.redisSubscriber.on('message', (channel, message) => {
        if (channel === this.WORKER_EVENTS_CHANNEL) {
          try {
            const event = JSON.parse(message);
            if (event.episodeId && event.type) {
              // Forward worker event to SSE clients
              this.eventsService.emit(event.episodeId, event as EventPayload);
              this.logger.debug(`Forwarded worker event: ${event.type} for episode ${event.episodeId}`);
            }
          } catch (error) {
            this.logger.error('Failed to parse worker event:', error);
          }
        }
      });

      // Setup BullMQ queue events for job lifecycle monitoring
      this.pageQueueEvents = new QueueEvents('generate:page', { connection: { url } });
      this.characterQueueEvents = new QueueEvents('generate:character', { connection: { url } });

      // Monitor job lifecycle events
      this.setupJobEventListeners(this.pageQueueEvents, 'page');
      this.setupJobEventListeners(this.characterQueueEvents, 'character');

      this.logger.log('Queue events bridge initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize queue events bridge:', error);
    }
  }

  async onModuleDestroy() {
    if (this.redisSubscriber) {
      await this.redisSubscriber.quit();
    }
    if (this.pageQueueEvents) {
      await this.pageQueueEvents.close();
    }
    if (this.characterQueueEvents) {
      await this.characterQueueEvents.close();
    }
    this.logger.log('Queue events bridge destroyed');
  }

  private setupJobEventListeners(queueEvents: QueueEvents, type: 'page' | 'character') {
    queueEvents.on('active', ({ jobId }) => {
      this.logger.debug(`[${type}] Job ${jobId} started processing`);
    });

    queueEvents.on('completed', ({ jobId, returnvalue }) => {
      this.logger.debug(`[${type}] Job ${jobId} completed:`, returnvalue);
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      this.logger.error(`[${type}] Job ${jobId} failed:`, failedReason);
    });

    queueEvents.on('progress', ({ jobId, data }) => {
      this.logger.debug(`[${type}] Job ${jobId} progress:`, data);
    });
  }

  /**
   * Helper for workers to publish events to this bridge.
   * Workers should call this via a Redis publisher.
   */
  static async emitWorkerEvent(redisUrl: string, event: EventPayload): Promise<void> {
    const publisher = new Redis(redisUrl);
    try {
      await publisher.publish('worker:events', JSON.stringify(event));
    } finally {
      await publisher.quit();
    }
  }
}
