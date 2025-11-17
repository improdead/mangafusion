/**
 * Refinement Service
 * Handles AI sketch-to-manga refinement using ControlNet
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

interface RefinementRequest {
  pageId: string;
  canvasId: string;
  sketchImageUrl: string;
  style?: string;
  strength?: number;
  controlnetType?: 'scribble' | 'canny' | 'depth' | 'hed';
  promptDescription?: string;
  aiProvider?: 'segmind' | 'replicate' | 'gemini';
}

@Injectable()
export class RefinementService {
  private readonly logger = new Logger(RefinementService.name);
  private supabase: any;

  constructor() {
    // Initialize Supabase client
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
    }
  }

  /**
   * Refine sketch to manga using AI
   */
  async refineSketchToManga(request: RefinementRequest) {
    const startTime = Date.now();
    this.logger.log(`Starting refinement for page ${request.pageId}`);

    const provider = request.aiProvider || 'segmind';
    let refinedImageUrl: string;

    try {
      switch (provider) {
        case 'segmind':
          refinedImageUrl = await this.refineWithSegmind(request);
          break;
        case 'replicate':
          refinedImageUrl = await this.refineWithReplicate(request);
          break;
        case 'gemini':
          refinedImageUrl = await this.refineWithGemini(request);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }

      const processingTime = Date.now() - startTime;

      // Save refinement version to database
      const refinementVersion = await prisma.refinementVersion.create({
        data: {
          canvasId: request.canvasId,
          pageId: request.pageId,
          originalSketchUrl: request.sketchImageUrl,
          refinedImageUrl,
          promptDescription: request.promptDescription,
          style: request.style || 'manga',
          strength: request.strength || 0.7,
          controlnetType: request.controlnetType || 'scribble',
          aiProvider: provider,
          processingTimeMs: processingTime,
          userAccepted: false,
          isCurrentVersion: true,
        },
      });

      // Mark other versions as not current
      await prisma.refinementVersion.updateMany({
        where: {
          canvasId: request.canvasId,
          id: { not: refinementVersion.id },
        },
        data: {
          isCurrentVersion: false,
        },
      });

      this.logger.log(
        `Refinement completed in ${processingTime}ms for page ${request.pageId}`
      );

      return refinementVersion;
    } catch (error) {
      this.logger.error(`Refinement failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refine using Segmind ControlNet SDXL
   */
  private async refineWithSegmind(
    request: RefinementRequest
  ): Promise<string> {
    this.logger.log('Using Segmind ControlNet SDXL for refinement');

    const apiKey = process.env.SEGMIND_API_KEY;
    if (!apiKey) {
      throw new Error('SEGMIND_API_KEY not configured');
    }

    const prompt = request.promptDescription || 'manga style, black and white, high quality, detailed linework';
    const negativePrompt = 'blurry, low quality, watermark, text, signature';

    const response = await axios.post(
      'https://api.segmind.com/v1/sdxl-controlnet',
      {
        image: request.sketchImageUrl,
        prompt,
        negative_prompt: negativePrompt,
        controlnet_type: request.controlnetType || 'scribble',
        controlnet_conditioning_scale: request.strength || 0.7,
        samples: 1,
        scheduler: 'DDIM',
        num_inference_steps: 30,
        guidance_scale: 7.5,
        seed: Math.floor(Math.random() * 1000000),
      },
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    // Upload result to Supabase
    const imageBuffer = Buffer.from(response.data);
    return await this.uploadRefinedImage(request.pageId, imageBuffer);
  }

  /**
   * Refine using Replicate ControlNet
   */
  private async refineWithReplicate(
    request: RefinementRequest
  ): Promise<string> {
    this.logger.log('Using Replicate ControlNet for refinement');

    // Placeholder - implement Replicate API integration
    throw new Error('Replicate integration not yet implemented');
  }

  /**
   * Refine using Gemini image generation
   */
  private async refineWithGemini(
    request: RefinementRequest
  ): Promise<string> {
    this.logger.log('Using Gemini for refinement');

    // Placeholder - implement Gemini API integration
    throw new Error('Gemini integration not yet implemented');
  }

  /**
   * Upload refined image to Supabase
   */
  private async uploadRefinedImage(
    pageId: string,
    imageBuffer: Buffer
  ): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const bucket = process.env.SUPABASE_BUCKET || 'manga-images';
    const filename = `refined/${pageId}_${Date.now()}.png`;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(filename, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (error) {
      this.logger.error(`Failed to upload refined image: ${error.message}`);
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filename);

    return urlData.publicUrl;
  }

  /**
   * Accept a refinement version
   */
  async acceptRefinement(refinementId: string) {
    this.logger.log(`Accepting refinement ${refinementId}`);

    return await prisma.refinementVersion.update({
      where: { id: refinementId },
      data: { userAccepted: true },
    });
  }

  /**
   * Get refinement history for a page
   */
  async getRefinementHistory(pageId: string) {
    this.logger.log(`Fetching refinement history for page ${pageId}`);

    return await prisma.refinementVersion.findMany({
      where: { pageId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
