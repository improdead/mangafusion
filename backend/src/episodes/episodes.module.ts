import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { PlannerModule } from '../planner/planner.module';
import { RendererModule } from '../renderer/renderer.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EpisodesController } from './episodes.controller';
import { EpisodesService } from './episodes.service';

@Module({
  imports: [EventsModule, PlannerModule, RendererModule, PrismaModule],
  controllers: [EpisodesController],
  providers: [EpisodesService],
  exports: [EpisodesService],
})
export class EpisodesModule {}

