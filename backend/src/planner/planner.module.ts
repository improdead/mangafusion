import { Module } from '@nestjs/common';
import { PlannerService } from './planner.service';

@Module({
  providers: [PlannerService],
  exports: [PlannerService],
})
export class PlannerModule {}

