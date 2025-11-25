import './suppress-worker-errors';
import 'reflect-metadata';
import { EventsService } from "../../backend/src/events/events.service";
import { PlannerService } from "../../backend/src/planner/planner.service";
import { RendererService } from "../../backend/src/renderer/renderer.service";
import { StorageService } from "../../backend/src/storage/storage.service";
import { PrismaService } from "../../backend/src/prisma/prisma.service";
import { EpisodesService } from "../../backend/src/episodes/episodes.service";
import { TTSService } from "../../backend/src/tts/tts.service";
import { BuilderService } from "../../backend/src/builder/builder.service";
import { QueueService } from "../../backend/src/queue/queue.service";

// Singleton services container shared across API routes.
// Uses globalThis to persist during dev and across serverless reuses.

export type Services = {
  events: EventsService;
  planner: PlannerService;
  storage: StorageService;
  prisma: PrismaService;
  renderer: RendererService;
  episodes: EpisodesService;
  tts: TTSService;
  builder: BuilderService;
};

declare global {
  // eslint-disable-next-line no-var
  var __mangaServices: Services | undefined;
}

export function getServices(): Services {
  if (globalThis.__mangaServices) return globalThis.__mangaServices;

  console.log('[Container] Initializing services...');
  try {
    const events = new EventsService();
    console.log('[Container] EventsService initialized');
    const planner = new PlannerService();
    console.log('[Container] PlannerService initialized');
    const storage = new StorageService();
    console.log('[Container] StorageService initialized');
    const prisma = new PrismaService();
    console.log('[Container] PrismaService initialized');
    const renderer = new RendererService(storage);
    console.log('[Container] RendererService initialized');
    const queue = new QueueService();
    console.log('[Container] QueueService initialized');
    const episodes = new EpisodesService(events, planner, renderer, prisma, queue);
    console.log('[Container] EpisodesService initialized');
    const tts = new TTSService(storage);
    console.log('[Container] TTSService initialized');
    const builder = new BuilderService();
    console.log('[Container] BuilderService initialized');

    globalThis.__mangaServices = { events, planner, storage, prisma, renderer, episodes, tts, builder };
    console.log('[Container] All services initialized successfully');
    return globalThis.__mangaServices;
  } catch (e) {
    console.error('[Container] Failed to initialize services:', e);
    throw e;
  }
}
