import { Module } from '@nestjs/common';
import { PlannerService } from './planner.service';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
  imports: [ObservabilityModule],
  providers: [PlannerService],
  exports: [PlannerService],
})
export class PlannerModule {}

