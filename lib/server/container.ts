import 'reflect-metadata';
import { EventsService } from "../../backend/src/events/events.service";
import { PlannerService } from "../../backend/src/planner/planner.service";
import { RendererService } from "../../backend/src/renderer/renderer.service";
import { StorageService } from "../../backend/src/storage/storage.service";
import { PrismaService } from "../../backend/src/prisma/prisma.service";
import { EpisodesService } from "../../backend/src/episodes/episodes.service";
import { TTSService } from "../../backend/src/tts/tts.service";

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
};

declare global {
  // eslint-disable-next-line no-var
  var __mangaServices: Services | undefined;
}

export function getServices(): Services {
  if (globalThis.__mangaServices) return globalThis.__mangaServices;

  const events = new EventsService();
  const planner = new PlannerService();
  const storage = new StorageService();
  const prisma = new PrismaService();
  const renderer = new RendererService(storage);
  const episodes = new EpisodesService(events, planner, renderer, prisma);
  const tts = new TTSService(storage);

  globalThis.__mangaServices = { events, planner, storage, prisma, renderer, episodes, tts };
  return globalThis.__mangaServices;
}
