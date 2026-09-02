import { Module } from '@nestjs/common';
import { UserMetricsModule } from '../user-metrics/user-metrics.module.js';
import { AnalyticsController } from './analytics.controller.js';
import { OffersAnalyticsService } from './services/offers-analytics.service.js';
import { PrintingAnalyticsService } from './services/printing-analytics.service.js';
import { ReportsAnalyticsService } from './services/reports-analytics.service.js';
import { SalesByCostCenterService } from './services/sales-by-cost-center.service.js';

@Module({
  imports: [UserMetricsModule],
  controllers: [AnalyticsController],
  providers: [
    SalesByCostCenterService,
    OffersAnalyticsService,
    ReportsAnalyticsService,
    PrintingAnalyticsService,
  ],
})
export class AnalyticsModule {}
