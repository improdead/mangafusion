import { Body, Controller, Get, Param, Post, Sse, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Observable } from 'rxjs';
import { EventsService, EventPayload } from '../events/events.service';
import { EpisodesService } from './episodes.service';
import { EpisodeSeed } from './types';

@Controller()
export class EpisodesController {
  constructor(private readonly episodes: EpisodesService, private readonly events: EventsService) {}

  @Get('health')
  health() {
    return { ok: true, service: 'mangafusion-backend' };
  }

  @Post('planner')
  async plan(@Body() seed: EpisodeSeed) {
    // minimal validation
    if (!seed || !seed.title || !seed.genre_tags || !seed.tone || !seed.setting || !seed.cast) {
      return { error: 'Missing required fields', required: ['title', 'genre_tags', 'tone', 'setting', 'cast'] };
    }
    const result = await this.episodes.planEpisode(seed);
    return result;
  }

  @Get('episodes/:id')
  async getEpisode(@Param('id') id: string) {
    const ep = await this.episodes.getEpisode(id);
    if (!ep) return { error: 'Not found' };
    return ep;
  }

  @Get('episodes/:id/characters')
  async getCharacters(@Param('id') id: string) {
    const ep = await this.episodes.getEpisode(id);
    if (!ep) return { error: 'Not found' };
    return { characters: ep.characters || [] };
  }

  @Post('episodes/:id/generate10')
  async generate(@Param('id') id: string) {
    this.episodes.startGeneration(id).catch((err) => {
      // emit failure event for the current page unknown; send generic failure
      this.events.emit(id, { type: 'page_failed', episodeId: id, page: -1, error: err.message });
    });
    return { started: true };
  }

  @Get('episodes/:id/style-refs')
  async listStyleRefs(@Param('id') id: string) {
    return this.episodes.listStyleRefs(id);
  }

  @Post('episodes/:id/style-refs')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadStyleRef(@Param('id') id: string, @UploadedFile() file: any) {
    if (!file) return { error: 'No file uploaded' };
    return this.episodes.uploadStyleRef(id, file);
  }

  @Sse('episodes/:id/stream')
  stream(@Param('id') id: string): Observable<{ data: EventPayload }> {
    return this.events.stream(id);
  }
}
