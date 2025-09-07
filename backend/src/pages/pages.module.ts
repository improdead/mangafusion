import { Module } from '@nestjs/common';
import { EpisodesModule } from '../episodes/episodes.module';
import { TTSModule } from '../tts/tts.module';
import { PagesController } from './pages.controller';

@Module({
  imports: [EpisodesModule, TTSModule],
  controllers: [PagesController],
})
export class PagesModule {}

