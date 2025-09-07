import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { RendererService } from './renderer.service';

@Module({
  imports: [StorageModule],
  providers: [RendererService],
  exports: [RendererService],
})
export class RendererModule {}