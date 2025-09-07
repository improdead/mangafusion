import { Module } from '@nestjs/common';
import { EpisodesModule } from './episodes/episodes.module';
import { PagesModule } from './pages/pages.module';
import { EventsModule } from './events/events.module';
import { PlannerModule } from './planner/planner.module';
import { RendererModule } from './renderer/renderer.module';
import { StorageModule } from './storage/storage.module';
import { PrismaModule } from './prisma/prisma.module';
import { TTSModule } from './tts/tts.module';

@Module({
  imports: [EventsModule, PlannerModule, RendererModule, StorageModule, PrismaModule, TTSModule, EpisodesModule, PagesModule],
})
export class AppModule {}

