import { Module } from '@nestjs/common';
import { BillboardsService } from './billboards.service.js';
import { BillboardsController } from './billboards.controller.js';
import { DashboardAnalyticsService } from './services/dashboard-analytics.service.js';

@Module({
  controllers: [BillboardsController],
  providers: [BillboardsService, DashboardAnalyticsService],
  exports: [BillboardsService, DashboardAnalyticsService],
})
export class BillboardsModule {}
