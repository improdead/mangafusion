import { Body, Controller, Get, Param, Post, Res, Sse, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Observable } from 'rxjs';
import { Response } from 'express';
import { EventsService, EventPayload } from '../events/events.service';
import { EpisodesService } from './episodes.service';
import { ExportService } from '../export/export.service';
import { EpisodeSeed } from './types';

@Controller()
export class EpisodesController {
  constructor(
    private readonly episodes: EpisodesService,
    private readonly events: EventsService,
    private readonly exportService: ExportService
  ) {}

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

  @Post('episodes/:id/export')
  async exportEpisode(
    @Param('id') id: string,
    @Query('format') format: string = 'pdf',
    @Query('includeAudio') includeAudio: string = 'false',
    @Res() res: Response
  ) {
    try {
      // Validate format
      if (!['pdf', 'cbz'].includes(format)) {
        return res.status(400).json({ error: 'Invalid format. Must be "pdf" or "cbz"' });
      }

      // Get episode data
      const episode = await this.episodes.getEpisode(id);
      if (!episode) {
        return res.status(404).json({ error: 'Episode not found' });
      }

      // Check if episode has pages
      if (!episode.pages || episode.pages.length === 0) {
        return res.status(400).json({ error: 'Episode has no pages' });
      }

      // Filter pages that have images
      const pagesWithImages = episode.pages.filter(p => p.imageUrl);
      if (pagesWithImages.length === 0) {
        return res.status(400).json({ error: 'Episode has no generated pages yet' });
      }

      // Sort pages by page number
      const sortedPages = pagesWithImages
        .map(p => ({
          pageNumber: p.pageNumber,
          imageUrl: p.imageUrl!,
          audioUrl: (p as any).audioUrl || undefined,
        }))
        .sort((a, b) => a.pageNumber - b.pageNumber);

      const episodeTitle = episode.seedInput?.title || `Episode_${id}`;

      // Generate export
      const result = await this.exportService.export({
        episodeId: id,
        episodeTitle,
        pages: sortedPages,
        format: format as 'pdf' | 'cbz',
        includeAudio: includeAudio === 'true',
      });

      // Set response headers
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('Content-Length', String(result.size));

      // Send the file
      res.send(result.buffer);
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      res.status(500).json({ error: errorMessage });
    }
  }
}
