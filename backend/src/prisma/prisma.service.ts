import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService {
  private readonly logger = new Logger(PrismaService.name);
  private clientInstance?: PrismaClient;

  constructor() {
    if (process.env.DATABASE_URL) {
      this.clientInstance = new PrismaClient();
      this.logger.log('Prisma enabled (DATABASE_URL detected)');
    } else {
      this.logger.log('Prisma disabled (no DATABASE_URL)');
    }
  }

  get enabled() {
    return !!this.clientInstance;
  }

  get client() {
    if (!this.clientInstance) throw new Error('Prisma is not enabled');
    return this.clientInstance;
  }
}

