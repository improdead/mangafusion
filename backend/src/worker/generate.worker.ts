import 'dotenv/config';
import { Worker, QueueEvents, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error('REDIS_URL not set. Exiting worker.');
  process.exit(1);
}

const prisma = process.env.DATABASE_URL ? new PrismaClient() : undefined;

const imageModel = process.env.RENDERER_IMAGE_MODEL || 'gemini-2.5-flash-image-preview';

async function processJob(job: Job) {
  const { episodeId, page } = job.data as { episodeId: string; page: number };
  console.log(`[worker] generate_page episode=${episodeId} page=${page} model=${imageModel}`);
  // Simulate some work
  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1500));
  const padded = String(page).padStart(4, '0');
  const imageUrl = `https://placehold.co/1024x1536?text=Page%20${padded}`;
  if (prisma) {
    const p = await prisma.page.findFirst({ where: { episodeId, pageNumber: page } });
    if (p) {
      await prisma.page.update({ where: { id: p.id }, data: { status: 'done', imageUrl } });
    }
  }
  return { imageUrl, model: imageModel };
}

const worker = new Worker('generate_page', processJob, { connection: { url: REDIS_URL } });
const events = new QueueEvents('generate_page', { connection: { url: REDIS_URL } });

worker.on('ready', () => console.log('[worker] ready'));
worker.on('failed', (job, err) => console.error('[worker] failed', job?.id, err));
worker.on('completed', (job) => console.log('[worker] completed', job.id));

process.on('SIGINT', async () => {
  await worker.close();
  await events.close();
  if (prisma) await prisma.$disconnect();
  process.exit(0);
});

