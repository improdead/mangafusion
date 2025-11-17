/**
 * Canvas Controller
 * REST API endpoints for canvas operations
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { CanvasService } from './canvas.service';

@Controller('api/canvas')
export class CanvasController {
  private readonly logger = new Logger(CanvasController.name);

  constructor(private readonly canvasService: CanvasService) {}

  /**
   * Create or update canvas
   * POST /api/canvas
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async upsertCanvas(@Body() body: any) {
    this.logger.log(`Upsert canvas request for page ${body.pageId}`);
    return await this.canvasService.upsertCanvas(body);
  }

  /**
   * Get canvas by page ID
   * GET /api/canvas/:pageId
   */
  @Get(':pageId')
  async getCanvas(@Param('pageId') pageId: string) {
    this.logger.log(`Get canvas request for page ${pageId}`);
    return await this.canvasService.getCanvas(pageId);
  }

  /**
   * Delete canvas
   * DELETE /api/canvas/:pageId
   */
  @Delete(':pageId')
  @HttpCode(HttpStatus.OK)
  async deleteCanvas(@Param('pageId') pageId: string) {
    this.logger.log(`Delete canvas request for page ${pageId}`);
    return await this.canvasService.deleteCanvas(pageId);
  }

  /**
   * Get canvas statistics
   * GET /api/canvas/stats/all
   */
  @Get('stats/all')
  async getStatistics() {
    this.logger.log('Get canvas statistics request');
    return await this.canvasService.getStatistics();
  }
}
