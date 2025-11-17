/**
 * Canvas Module
 * NestJS module for canvas and refinement features
 */

import { Module } from '@nestjs/common';
import { CanvasController } from './canvas.controller';
import { CanvasService } from './canvas.service';
import { RefinementController } from './refinement.controller';
import { RefinementService } from './refinement.service';

@Module({
  controllers: [CanvasController, RefinementController],
  providers: [CanvasService, RefinementService],
  exports: [CanvasService, RefinementService],
})
export class CanvasModule {}
