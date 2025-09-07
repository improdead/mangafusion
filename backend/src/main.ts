import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from parent directory (root of project)
config({ path: resolve(__dirname, '../../.env') });
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as net from 'net';

async function findOpenPort(start: number, maxAttempts = 10): Promise<number> {
  const tryPort = (port: number) =>
    new Promise<boolean>((resolve) => {
      const srv = net.createServer();
      srv.unref();
      srv.on('error', () => resolve(false));
      srv.listen({ port }, () => {
        srv.close(() => resolve(true));
      });
    });
  let p = start;
  for (let i = 0; i < maxAttempts; i++, p++) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await tryPort(p);
    if (ok) return p;
  }
  // fallback to ephemeral
  return 0;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  // Set global API prefix
  app.setGlobalPrefix('api');

  const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : ['http://localhost:3000'];
  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  });

  const desired = process.env.PORT ? parseInt(process.env.PORT) : 4000;
  const port = await findOpenPort(desired, 20);
  await app.listen(port);
  if (port !== desired) {
    Logger.warn(`Desired port ${desired} was busy. Using ${port} instead.`);
  }
  Logger.log(`Backend listening on http://localhost:${port}`);
}
bootstrap();
