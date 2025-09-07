import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EventsService } from '../events/events.service';
import { PlannerService } from '../planner/planner.service';
import { getRendererConfig } from '../renderer/config';
import { RendererService } from '../renderer/renderer.service';
import { PrismaService } from '../prisma/prisma.service';
import { Character, Episode, EpisodeSeed, Page, PlannerOutput, PlannerOutlinePage, PlannerCharacter } from './types';

@Injectable()
export class EpisodesService {
  private episodes = new Map<string, Episode>();
  private pages = new Map<string, Page>();
  private characters = new Map<string, Character[]>(); // episodeId -> characters
  private styleRefs = new Map<string, string[]>(); // episodeId -> style ref URLs (in-memory fallback)

  constructor(
    private readonly events: EventsService,
    private readonly planner: PlannerService,
    private readonly renderer: RendererService,
    private readonly prisma: PrismaService,
  ) {}

  async planEpisode(seed: EpisodeSeed): Promise<{ episodeId: string; outline: PlannerOutput }> {
    const id = randomUUID();
    
    // Emit planning status events
    this.events.emit(id, { type: 'planning_started', episodeId: id, message: 'AI is analyzing your story concept...' });
    
    let outline: PlannerOutput;
    try {
      this.events.emit(id, { type: 'planning_progress', episodeId: id, message: 'Generating 10-page story outline...' });
      outline = await this.planner.generateOutline(seed);
      this.events.emit(id, { type: 'planning_progress', episodeId: id, message: 'Creating character designs...' });
    } catch (e) {
      this.events.emit(id, { type: 'planning_progress', episodeId: id, message: 'Using fallback story template...' });
      outline = this.stubOutline(seed);
    }
    const renderer = getRendererConfig();

    // Determine characters from planner output or seed
    const plannedCharacters = this.deriveCharacters(seed, outline);

    if (this.prisma.enabled) {
      const created = await this.prisma.client.episode.create({
        data: {
          id,
          seedInput: seed as any,
          outline: outline as any,
          rendererModel: renderer.imageModel,
          pages: {
            create: Array.from({ length: 10 }).map((_, idx) => ({
              pageNumber: idx + 1,
              status: 'queued',
              version: 0,
            })),
          },
        },
        include: { pages: true },
      });
      // mirror minimal state in-memory so existing methods can operate
      const episode: Episode = {
        id: created.id,
        seedInput: seed,
        outline,
        pages: created.pages.map((p) => ({
          id: p.id,
          episodeId: created.id,
          pageNumber: p.pageNumber,
          status: p.status as any,
          version: p.version ?? 0,
        })),
        createdAt: new Date(created.createdAt).getTime(),
        updatedAt: new Date(created.updatedAt).getTime(),
        rendererModel: created.rendererModel ?? undefined,
      };
      this.episodes.set(id, episode);
      for (const p of episode.pages) this.pages.set(p.id, p);

      // Persist characters (without images yet)
      if (plannedCharacters.length > 0) {
        await this.prisma.client.character.createMany({
          data: plannedCharacters.map((c) => ({
            episodeId: id,
            name: c.name,
            description: c.description,
            assetFilename: c.asset_filename,
          })),
          skipDuplicates: true,
        } as any);
      }
    } else {
      const episode: Episode = {
        id,
        seedInput: seed,
        outline,
        pages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        rendererModel: renderer.imageModel,
      };
      this.episodes.set(id, episode);
      for (let i = 1; i <= 10; i++) {
        const page: Page = {
          id: randomUUID(),
          episodeId: id,
          pageNumber: i,
          status: 'queued',
          version: 0,
        };
        this.pages.set(page.id, page);
        episode.pages.push(page);
      }
      // mirror characters in-memory
      this.characters.set(
        id,
        plannedCharacters.map<Character>((c) => ({
          id: randomUUID(),
          episodeId: id,
          name: c.name,
          description: c.description,
          assetFilename: c.asset_filename,
        })),
      );
    }

    this.events.emit(id, { type: 'planning_complete', episodeId: id, message: 'Story planning complete! Ready to generate pages.' });

    // Kick off character image generation in background (non-blocking)
    this.generateCharacters(id).catch((err) => {
      // safe log; character generation failures shouldn't block the episode
      console.warn('Character generation failed:', err?.message || err);
    });

    return { episodeId: id, outline };
  }

  async getPageById(pageId: string): Promise<Page | undefined> {
    if (this.prisma.enabled) {
      const p = await this.prisma.client.page.findUnique({ where: { id: pageId } });
      if (!p) return undefined;
      return {
        id: p.id,
        episodeId: p.episodeId,
        pageNumber: p.pageNumber,
        status: p.status as any,
        imageUrl: p.imageUrl ?? undefined,
        seed: p.seed ?? undefined,
        version: p.version ?? undefined,
        error: p.error ?? undefined,
        overlays: (p as any).overlays ?? undefined,
      };
    }
    return this.pages.get(pageId);
  }

  async setPageOverlays(pageId: string, overlays: any): Promise<void> {
    const page = await this.getPageById(pageId);
    if (!page) throw new Error('Page not found');
    page.overlays = overlays;
    if (this.prisma.enabled) {
      await this.prisma.client.page.update({ where: { id: pageId }, data: { overlays } as any });
    } else {
      this.pages.set(pageId, page);
    }
  }

  async regeneratePage(pageId: string, prompt: string, styleRefUrls: string[] = []): Promise<Page> {
    const page = await this.getPageById(pageId);
    if (!page) throw new Error('Page not found');
    const ep = await this.getEpisode(page.episodeId);
    if (!ep || !ep.outline) throw new Error('Episode or outline not found');
    const outline = ep.outline.pages.find(p => p.page_number === page.pageNumber);
    if (!outline) throw new Error('Page outline not found');

    // mark in progress
    page.status = 'in_progress';
    if (this.prisma.enabled) {
      await this.prisma.client.page.update({ where: { id: pageId }, data: { status: 'in_progress' } });
    }
    this.events.emit(ep.id, { type: 'page_progress', episodeId: ep.id, page: page.pageNumber, pct: 10 });

    const visualStyle = ep.outline.pages[0]?.visual_style || 'manga style';
    const characterAssets = (await this.getEpisode(ep.id))?.characters?.filter(c => !!c.imageUrl) || [];

    const MAX_ATTEMPTS = 2;
    let result: { imageUrl: string; seed: number } | null = null;
    let lastErr: any = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        result = await this.renderer.generatePage({
          pageNumber: page.pageNumber,
          outline,
          episodeTitle: ep.seedInput.title,
          visualStyle,
          characterAssets,
          baseImageUrl: page.imageUrl,
          editPrompt: prompt,
          styleRefUrls,
        });
        break;
      } catch (e) {
        lastErr = e;
        await this.sleep(400 * attempt);
      }
    }
    if (!result) {
      const emsg = lastErr instanceof Error ? lastErr.message : String(lastErr);
      page.status = 'failed';
      page.error = emsg;
      if (this.prisma.enabled) {
        await this.prisma.client.page.update({ where: { id: page.id }, data: { status: 'failed', error: emsg } });
      }
      this.events.emit(ep.id, { type: 'page_failed', episodeId: ep.id, page: page.pageNumber, error: emsg });
      throw new Error(emsg);
    }

    page.status = 'done';
    page.imageUrl = result.imageUrl;
    page.seed = result.seed;
    page.version = (page.version || 0) + 1;
    ep.updatedAt = Date.now();

    if (this.prisma.enabled) {
      await this.prisma.client.page.update({
        where: { id: page.id },
        data: { status: 'done', imageUrl: result.imageUrl, seed: result.seed, version: page.version },
      });
    } else {
      this.pages.set(page.id, page);
    }

    this.events.emit(ep.id, { type: 'page_done', episodeId: ep.id, page: page.pageNumber, imageUrl: result.imageUrl, seed: result.seed, version: page.version! });
    return page;
  }

  async retryPage(pageId: string) {
    const page = await this.getPageById(pageId);
    if (!page) throw new Error('Page not found');
    const ep = await this.getEpisode(page.episodeId);
    if (!ep || !ep.outline) throw new Error('Episode or outline not found');
    page.status = 'queued';
    if (this.prisma.enabled) {
      await this.prisma.client.page.update({ where: { id: pageId }, data: { status: 'queued', error: null } });
    }
    await this.simulatePageGeneration(ep, page);
    return page;
  }

  async getEpisode(episodeId: string): Promise<Episode | undefined> {
    if (this.prisma.enabled) {
      const e = await this.prisma.client.episode.findUnique({
        where: { id: episodeId },
        include: { pages: { orderBy: { pageNumber: 'asc' } }, characters: true } as any,
      });
      if (!e) return undefined;
      return {
        id: e.id,
        seedInput: e.seedInput as any,
        outline: (e.outline as any) ?? undefined,
        pages: e.pages.map((p) => ({
          id: p.id,
          episodeId: p.episodeId,
          pageNumber: p.pageNumber,
          status: p.status as any,
          imageUrl: p.imageUrl ?? undefined,
          seed: p.seed ?? undefined,
          version: p.version ?? undefined,
          error: p.error ?? undefined,
          overlays: (p as any).overlays ?? undefined,
        })),
        createdAt: new Date(e.createdAt).getTime(),
        updatedAt: new Date(e.updatedAt).getTime(),
        rendererModel: e.rendererModel ?? undefined,
        characters: (e as any).characters?.map((c: any) => ({
          id: c.id,
          episodeId: c.episodeId,
          name: c.name,
          description: c.description ?? undefined,
          assetFilename: c.assetFilename,
          imageUrl: c.imageUrl ?? undefined,
        })),
      };
    }
    const ep = this.episodes.get(episodeId);
    if (!ep) return undefined;
    return { ...ep, characters: this.characters.get(episodeId) };
  }

  async startGeneration(episodeId: string): Promise<void> {
    const ep = await this.getEpisode(episodeId);
    if (!ep || !ep.outline) {
      throw new Error('Episode or outline not found');
    }

    // Ensure characters are generated first
    await this.ensureCharacters(episodeId);

    for (let i = 1; i <= 10; i++) {
      const page = ep.pages.find((p) => p.pageNumber === i)!;
      await this.simulatePageGeneration(ep, page);
    }
  }

  private sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  private async simulatePageGeneration(ep: Episode, page: Page) {
    // progress start
    if (this.prisma.enabled) {
      await this.prisma.client.page.update({ where: { id: page.id }, data: { status: 'in_progress' } });
    }
    page.status = 'in_progress';
    this.events.emit(ep.id, { type: 'page_progress', episodeId: ep.id, page: page.pageNumber, pct: 5 });
    
    const MAX_ATTEMPTS = 3;
    const pageOutline = ep.outline?.pages.find(p => p.page_number === page.pageNumber);
    if (!pageOutline) throw new Error(`No outline found for page ${page.pageNumber}`);
    let lastErr: any = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        await this.sleep(150 + Math.random() * 250);
        this.events.emit(ep.id, { type: 'page_progress', episodeId: ep.id, page: page.pageNumber, pct: Math.min(25 * attempt, 70) });

        // Use real renderer (with character consistency and optional style refs)
        const visualStyle = ep.outline?.pages[0]?.visual_style || 'manga style';
        const characterAssets = (await this.getEpisode(ep.id))?.characters?.filter(c => !!c.imageUrl) || [];
        const styleRefUrls = (await this.listStyleRefs(ep.id)).refs;
        const result = await this.renderer.generatePage({
          pageNumber: page.pageNumber,
          outline: pageOutline,
          episodeTitle: ep.seedInput.title,
          visualStyle,
          seed: page.seed,
          characterAssets,
          styleRefUrls,
        });

        page.status = 'done';
        page.imageUrl = result.imageUrl;
        page.seed = result.seed;
        page.version = (page.version || 0) + 1;
        ep.updatedAt = Date.now();

        if (this.prisma.enabled) {
          await this.prisma.client.page.update({ where: { id: page.id }, data: { status: 'done', imageUrl: result.imageUrl, seed: result.seed, version: page.version } });
        }

        this.events.emit(ep.id, { type: 'page_done', episodeId: ep.id, page: page.pageNumber, imageUrl: result.imageUrl, seed: result.seed, version: page.version! });
        return;
      } catch (error) {
        lastErr = error;
        await this.sleep(300 * attempt);
      }
    }
    const errorMessage = lastErr instanceof Error ? lastErr.message : String(lastErr);
    page.status = 'failed';
    page.error = errorMessage;
    if (this.prisma.enabled) {
      await this.prisma.client.page.update({ where: { id: page.id }, data: { status: 'failed', error: errorMessage } });
    }
    this.events.emit(ep.id, { type: 'page_failed', episodeId: ep.id, page: page.pageNumber, error: errorMessage });
  }

  private stubOutline(seed: EpisodeSeed): PlannerOutput {
    const pages: PlannerOutlinePage[] = [];
    for (let i = 1; i <= 10; i++) {
      const panelCount = Math.min(6, Math.max(3, 3 + Math.floor(Math.random() * 4)));
      const dialogues = [];
      
      // Generate sample dialogues for each panel
      for (let p = 1; p <= panelCount; p++) {
        if (i === 1) {
          if (p === 1) dialogues.push({ panel_number: p, character: null, text: `The city never sleeps...`, type: 'narration' as const });
          else if (p === 2) dialogues.push({ panel_number: p, character: seed.cast[0]?.name || 'Aoi', text: `Something's not right here.`, type: 'dialogue' as const });
          else dialogues.push({ panel_number: p, character: seed.cast[1]?.name || 'Kenji', text: `We should be careful.`, type: 'dialogue' as const });
        } else {
          dialogues.push({ 
            panel_number: p, 
            character: p % 2 === 0 ? seed.cast[0]?.name || 'Aoi' : seed.cast[1]?.name || 'Kenji', 
            text: `Page ${i}, panel ${p} dialogue.`, 
            type: 'dialogue' as const 
          });
        }
      }
      
      pages.push({
        page_number: i,
        beat:
          i === 1
            ? `Establish style and cast in ${seed.setting}.`
            : `Continue the action established prior; escalate tension (page ${i}).`,
        setting: i === 1 ? seed.setting : `${seed.setting} (varied)`,
        key_actions: i === 1 ? ['establishing shot', 'close-ups of cast'] : ['dynamic action moment'],
        layout_hints: { panels: panelCount, notes: 'cinematic angles' },
        visual_style:
          i === 1 ? 'high-contrast manga B/W; crisp screentones; dynamic speedlines; cinematic angles' : undefined,
        introduce_new_character: i === 2,
        new_characters: i === 2 ? [{ name: 'Mysterious Rival', traits: 'enigmatic', silhouette: 'tall', outfit: 'cloak', notable_prop: 'mask' }] : [],
        dialogues,
        prompt: i === 1 ? '<aoi.png> and <kenji.png> appear in the city skyline establishing shot.' : undefined,
      });
    }
    const characters: PlannerCharacter[] = [
      { name: seed.cast[0]?.name || 'Aoi', description: 'protagonist; short dark hair; determined eyes; school uniform with jacket; athletic silhouette', asset_filename: 'aoi.png' },
      { name: seed.cast[1]?.name || 'Kenji', description: 'supporting; messy hair; energetic; casual streetwear; scarf', asset_filename: 'kenji.png' },
    ];
    return { pages, characters };
  }

  // --- Character pipeline helpers ---
  private deriveCharacters(seed: EpisodeSeed, outline: PlannerOutput): PlannerCharacter[] {
    const set = new Map<string, PlannerCharacter>();
    // from planner
    for (const c of outline.characters || []) {
      set.set(c.name.toLowerCase(), c);
    }
    // from seed cast
    for (const c of seed.cast) {
      const filename = this.sanitizeFilename(`${c.name}.png`);
      if (!set.has(c.name.toLowerCase())) {
        set.set(c.name.toLowerCase(), {
          name: c.name,
          description: c.traits || 'main cast member',
          asset_filename: filename,
        });
      }
    }
    // from any newly introduced characters across pages
    for (const p of outline.pages) {
      for (const nc of p.new_characters || []) {
        const filename = this.sanitizeFilename(`${nc.name}.png`);
        if (!set.has(nc.name.toLowerCase())) {
          set.set(nc.name.toLowerCase(), {
            name: nc.name,
            description: nc.traits || 'new character',
            asset_filename: filename,
          });
        }
      }
    }
    return Array.from(set.values());
  }

  private sanitizeFilename(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .concat('.png')
      .replace(/_+\.png$/, '.png');
  }

  private async ensureCharacters(episodeId: string) {
    // If Prisma: check DB if they have imageUrl
    if (this.prisma.enabled) {
      const existing = await (this.prisma.client as any).character.findMany({ where: { episodeId: episodeId } });
      const needImages = existing.filter((c: any) => !c.imageUrl);
      if (needImages.length === 0 && existing.length > 0) return;
    } else {
      const arr = this.characters.get(episodeId) || [];
      if (arr.length > 0 && arr.every((c) => !!c.imageUrl)) return;
    }
    await this.generateCharacters(episodeId);
  }

  private async generateCharacters(episodeId: string) {
    const ep = await this.getEpisode(episodeId);
    if (!ep || !ep.outline) return;
    const plannedCharacters = this.deriveCharacters(ep.seedInput, ep.outline);

    for (const c of plannedCharacters) {
      // skip if already have image
      if (this.prisma.enabled) {
        const existing = await (this.prisma.client as any).character.findFirst({
          where: { episodeId, assetFilename: c.asset_filename },
        });
        if (existing?.imageUrl) continue;
      } else {
        const arr = this.characters.get(episodeId) || [];
        const match = arr.find((x) => x.assetFilename === c.asset_filename);
        if (match?.imageUrl) continue;
      }

      try {
        const { imageUrl } = await this.renderer.generateCharacter({
          episodeTitle: ep.seedInput.title,
          name: c.name,
          description: c.description,
          assetFilename: c.asset_filename,
          visualStyle: ep.outline.pages[0]?.visual_style || 'manga style',
        });
        if (this.prisma.enabled) {
          await (this.prisma.client as any).character.upsert({
            where: { episodeId_assetFilename: { episodeId, assetFilename: c.asset_filename } },
            update: { imageUrl, name: c.name, description: c.description },
            create: {
              episodeId,
              name: c.name,
              description: c.description,
              assetFilename: c.asset_filename,
              imageUrl,
            },
          });
        } else {
          const arr = this.characters.get(episodeId) || [];
          const existing = arr.find((x) => x.assetFilename === c.asset_filename);
          if (existing) {
            existing.imageUrl = imageUrl;
          } else {
            arr.push({ id: randomUUID(), episodeId, name: c.name, description: c.description, assetFilename: c.asset_filename, imageUrl });
          }
          this.characters.set(episodeId, arr);
        }
      } catch (e) {
        console.warn('Character gen failed for', c.name, e);
      }
    }
  }

  // --- Style reference helpers ---
  async listStyleRefs(episodeId: string): Promise<{ refs: string[] }> {
    const ep = await this.getEpisode(episodeId);
    if (!ep) return { refs: [] };
    const titleDir = ep.seedInput.title.replace(/[^a-zA-Z0-9]/g, '_');
    const prefix = `episodes/${titleDir}/style_refs`;
    if (this.prisma.enabled && ((this.renderer as any).storage?.enabled)) {
      try {
        const urls = await (this.renderer as any).storage.listPublicUrls(prefix);
        return { refs: urls };
      } catch {
        // fallback to memory cache
      }
    }
    return { refs: this.styleRefs.get(episodeId) || [] };
  }

  async uploadStyleRef(episodeId: string, file: any): Promise<{ url: string }> {
    const ep = await this.getEpisode(episodeId);
    if (!ep) throw new Error('Episode not found');
    const titleDir = ep.seedInput.title.replace(/[^a-zA-Z0-9]/g, '_');
    const ext = (file.originalname.match(/\.(png|jpg|jpeg|webp)$/i) || ['.png'])[0];
    const filename = `episodes/${titleDir}/style_refs/${Date.now()}_${Math.random().toString(36).slice(2)}${ext.startsWith('.')? ext : '.png'}`;
    const contentType = file.mimetype || 'image/png';
    let url: string;
    if ((this.renderer as any).storage?.enabled) {
      // Prefer using storage service directly via renderer dependency
      const storageService: any = (this.renderer as any).storage;
      url = await storageService.uploadImage(file.buffer, filename, contentType);
    } else {
      // Placeholder
      url = `https://placehold.co/768x1024/111/EEE?text=Style+Ref`;
    }
    const arr = this.styleRefs.get(episodeId) || [];
    arr.push(url);
    this.styleRefs.set(episodeId, arr);
    return { url };
  }

  async getPageDialogue(pageId: string) {
    const page = await this.getPageById(pageId);
    if (!page) throw new Error('Page not found');
    const ep = await this.getEpisode(page.episodeId);
    if (!ep || !ep.outline) throw new Error('Episode or outline not found');
    const outline = ep.outline.pages.find(p => p.page_number === page.pageNumber);
    return (outline as any)?.dialogues || [];
  }
}
