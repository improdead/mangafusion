import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { BuilderService } from './builder.service';

@Controller('builder')
export class BuilderController {
  constructor(private readonly builderService: BuilderService) {}

  @Post('refine')
  async refine(@Body() body: { prompt: string }) {
    if (!body.prompt) {
      throw new BadRequestException('Prompt is required');
    }
    return this.builderService.refinePrompt(body.prompt);
  }
}


