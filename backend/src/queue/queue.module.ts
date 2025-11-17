import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { QueueService } from './queue.service';
import { QueueEventsBridgeService } from './queue-events-bridge.service';
import { QueueController } from './queue.controller';

@Module({
  imports: [EventsModule],
  controllers: [QueueController],
  providers: [QueueService, QueueEventsBridgeService],
  exports: [QueueService],
})
export class QueueModule {}

