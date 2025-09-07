import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EpisodesService } from '../episodes/episodes.service';
import { TTSService } from '../tts/tts.service';

@Controller()
export class PagesController {
  constructor(
    private readonly episodes: EpisodesService,
    private readonly tts: TTSService,
  ) {}

  @Get('pages/:id')
  async getPage(@Param('id') id: string) {
    const page = await this.episodes.getPageById(id);
    if (!page) {
      return { error: 'Not found' };
    }
    return page;
  }

  @Post('pages/:id/read')
  async ttsRead(@Param('id') id: string, @Body() body: any) {
    try {
      const page = await this.episodes.getPageById(id);
      if (!page) {
        return { error: 'Page not found' };
      }

      // Get dialogues for this page
      const dialogues = await this.episodes.getPageDialogue(id);
      if (!dialogues || dialogues.length === 0) {
        return { error: 'No dialogues found for this page' };
      }

      // Generate audio using TTS with optional voice selection
      const voiceId = body?.voice_id;
      const result = await this.tts.generatePageAudio(dialogues, voiceId);
      return { audioUrl: result.audioUrl, dialogues };
    } catch (error) {
      console.error('TTS generation failed:', error);
      return { error: error.message || 'TTS generation failed' };
    }
  }

  @Get('pages/:id/overlays')
  async getOverlays(@Param('id') id: string) {
    const page = await this.episodes.getPageById(id);
    if (!page) return { error: 'Not found' };
    return { overlays: page.overlays || [] };
  }

  @Post('pages/:id/overlays')
  async saveOverlays(@Param('id') id: string, @Body() body: any) {
    const page = await this.episodes.getPageById(id);
    if (!page) return { error: 'Not found' };
    const overlays = body?.overlays ?? body;
    try {
      await this.episodes.setPageOverlays(id, overlays);
      return { ok: true };
    } catch (e: any) {
      return { error: e?.message || String(e) };
    }
  }

  @Post('pages/:id/regenerate')
  async regenerate(@Param('id') id: string, @Body() body: any) {
    const prompt = body?.prompt || '';
    const styleRefUrls: string[] = body?.styleRefUrls || [];
    try {
      const result = await this.episodes.regeneratePage(id, prompt, styleRefUrls);
      return result;
    } catch (e: any) {
      return { error: e?.message || String(e) };
    }
  }

  @Post('pages/:id/retry')
  async retry(@Param('id') id: string) {
    try {
      const result = await this.episodes.retryPage(id);
      return result;
    } catch (e: any) {
      return { error: e?.message || String(e) };
    }
  }

  @Get('pages/:id/dialogue')
  async dialogue(@Param('id') id: string) {
    try {
      const data = await this.episodes.getPageDialogue(id);
      return { dialogues: data };
    } catch (e: any) {
      return { error: e?.message || String(e) };
    }
  }

  @Get('tts/voices')
  async getTTSVoices() {
    try {
      const voices = await this.tts.getVoices();
      return { voices };
    } catch (e: any) {
      return { error: e?.message || String(e) };
    }
  }

  @Get('tts/models')
  async getTTSModels() {
    try {
      const models = await this.tts.getModels();
      return { models };
    } catch (e: any) {
      return { error: e?.message || String(e) };
    }
  }

  @Get('tts/usage')
  async getTTSUsage() {
    try {
      const usage = await this.tts.getUsage();
      return usage;
    } catch (e: any) {
      return { error: e?.message || String(e) };
    }
  }
}
