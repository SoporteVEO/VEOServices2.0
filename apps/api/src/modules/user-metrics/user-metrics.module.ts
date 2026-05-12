import { Module } from '@nestjs/common';
import { UserMetricsService } from './user-metrics.service.js';

@Module({
  providers: [UserMetricsService],
  exports: [UserMetricsService],
})
export class UserMetricsModule {}
