import { Module } from '@nestjs/common';
import { UserMetricsModule } from '../user-metrics/user-metrics.module.js';
import { AnalyticsController } from './analytics.controller.js';

@Module({
  imports: [UserMetricsModule],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
