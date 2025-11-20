import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService {
  private readonly logger = new Logger(PrismaService.name);
  private clientInstance?: PrismaClient;
  private isConnected = false;

  constructor() {
    const databaseDisabled = process.env.DATABASE_DISABLED === 'true';
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseDisabled) {
      this.logger.log('Prisma disabled (DATABASE_DISABLED=true)');
      return;
    }

    if (!databaseUrl) {
      this.logger.log('Prisma disabled (no DATABASE_URL)');
      return;
    }

    try {
      this.clientInstance = new PrismaClient();
      this.logger.log('Prisma detected (attempting connection...)');

      this.clientInstance.$connect()
        .then(() => {
          this.isConnected = true;
          this.logger.log('Prisma connected successfully');
        })
        .catch((error) => {
          this.isConnected = false;
          this.clientInstance = undefined;
          this.logger.error(
            'Prisma connection failed, falling back to in-memory mode',
            error instanceof Error ? error.stack : undefined,
          );
        });
    } catch (error) {
      this.clientInstance = undefined;
      this.logger.error(
        'Failed to initialize Prisma client, falling back to in-memory mode',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  get enabled() {
    return this.isConnected && !!this.clientInstance;
  }

  get client() {
    if (!this.enabled || !this.clientInstance) {
      throw new Error('Prisma is not enabled');
    }
    return this.clientInstance;
  }
}

