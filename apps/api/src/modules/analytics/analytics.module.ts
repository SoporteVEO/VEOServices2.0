import { Module } from '@nestjs/common';
import { UserMetricsModule } from '../user-metrics/user-metrics.module.js';
import { AnalyticsController } from './analytics.controller.js';
import { SalesByCostCenterService } from './services/sales-by-cost-center.service.js';

@Module({
  imports: [UserMetricsModule],
  controllers: [AnalyticsController],
  providers: [SalesByCostCenterService],
})
export class AnalyticsModule {}
