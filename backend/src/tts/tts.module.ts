import { Module } from '@nestjs/common';
import { TTSService } from './tts.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  providers: [TTSService],
  exports: [TTSService],
})
export class TTSModule {}