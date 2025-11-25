/**
 * Refinement Controller
 * REST API endpoints for AI sketch-to-manga refinement
 */

import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RefinementService } from './refinement.service';

@Controller('refinement')
export class RefinementController {
  private readonly logger = new Logger(RefinementController.name);

  constructor(private readonly refinementService: RefinementService) {}

  /**
   * Refine sketch to manga
   * POST /api/refinement/refine
   */
  @Post('refine')
  @HttpCode(HttpStatus.OK)
  async refineSketch(@Body() body: any) {
    this.logger.log(`Refine sketch request for page ${body.pageId}`);
    return await this.refinementService.refineSketchToManga(body);
  }

  /**
   * Accept a refinement version
   * PUT /api/refinement/:refinementId/accept
   */
  @Put(':refinementId/accept')
  @HttpCode(HttpStatus.OK)
  async acceptRefinement(@Param('refinementId') refinementId: string) {
    this.logger.log(`Accept refinement request for ${refinementId}`);
    return await this.refinementService.acceptRefinement(refinementId);
  }

  /**
   * Get refinement history
   * GET /api/refinement/history/:pageId
   */
  @Get('history/:pageId')
  async getRefinementHistory(@Param('pageId') pageId: string) {
    this.logger.log(`Get refinement history for page ${pageId}`);
    return await this.refinementService.getRefinementHistory(pageId);
  }
}
