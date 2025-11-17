/**
 * Canvas Service
 * Handles canvas data persistence and retrieval
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

interface CreateCanvasDto {
  pageId: string;
  canvasData: any;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

interface UpdateCanvasDto {
  canvasData?: any;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

@Injectable()
export class CanvasService {
  private readonly logger = new Logger(CanvasService.name);
  private supabase: any;

  constructor() {
    // Initialize Supabase client if credentials are available
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
    }
  }

  /**
   * Create or update canvas for a page
   */
  async upsertCanvas(data: CreateCanvasDto) {
    this.logger.log(`Upserting canvas for page ${data.pageId}`);

    // Check if page exists
    const page = await prisma.page.findUnique({
      where: { id: data.pageId },
    });

    if (!page) {
      throw new NotFoundException(`Page with ID ${data.pageId} not found`);
    }

    // Check if canvas already exists
    const existing = await prisma.canvas.findUnique({
      where: { pageId: data.pageId },
    });

    if (existing) {
      // Update existing canvas
      return await prisma.canvas.update({
        where: { pageId: data.pageId },
        data: {
          canvasData: data.canvasData,
          thumbnailUrl: data.thumbnailUrl,
          width: data.width || existing.width,
          height: data.height || existing.height,
          version: existing.version + 1,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new canvas
      return await prisma.canvas.create({
        data: {
          pageId: data.pageId,
          canvasData: data.canvasData,
          thumbnailUrl: data.thumbnailUrl,
          width: data.width || 1024,
          height: data.height || 1024,
          version: 1,
        },
      });
    }
  }

  /**
   * Get canvas by page ID
   */
  async getCanvas(pageId: string) {
    this.logger.log(`Fetching canvas for page ${pageId}`);

    const canvas = await prisma.canvas.findUnique({
      where: { pageId },
      include: {
        refinementVersions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!canvas) {
      throw new NotFoundException(`Canvas for page ${pageId} not found`);
    }

    return canvas;
  }

  /**
   * Delete canvas
   */
  async deleteCanvas(pageId: string) {
    this.logger.log(`Deleting canvas for page ${pageId}`);

    const canvas = await prisma.canvas.findUnique({
      where: { pageId },
    });

    if (!canvas) {
      throw new NotFoundException(`Canvas for page ${pageId} not found`);
    }

    await prisma.canvas.delete({
      where: { pageId },
    });

    return { success: true };
  }

  /**
   * Upload sketch image to Supabase
   */
  async uploadSketchImage(pageId: string, imageBuffer: Buffer): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const bucket = process.env.SUPABASE_BUCKET || 'manga-images';
    const filename = `sketches/${pageId}_${Date.now()}.png`;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(filename, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (error) {
      this.logger.error(`Failed to upload sketch: ${error.message}`);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filename);

    return urlData.publicUrl;
  }

  /**
   * Get canvas statistics
   */
  async getStatistics() {
    const totalCanvases = await prisma.canvas.count();
    const totalRefinements = await prisma.refinementVersion.count();
    const acceptedRefinements = await prisma.refinementVersion.count({
      where: { userAccepted: true },
    });

    return {
      totalCanvases,
      totalRefinements,
      acceptedRefinements,
      acceptanceRate:
        totalRefinements > 0
          ? (acceptedRefinements / totalRefinements) * 100
          : 0,
    };
  }
}
