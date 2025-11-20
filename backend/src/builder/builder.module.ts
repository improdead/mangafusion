import { Module } from '@nestjs/common';
import { BuilderService } from './builder.service';
import { BuilderController } from './builder.controller';

@Module({
  controllers: [BuilderController],
  providers: [BuilderService],
})
export class BuilderModule {}


