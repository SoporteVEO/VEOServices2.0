import { Module } from '@nestjs/common';
import { BillboardsService } from './billboards.service.js';
import { BillboardsController } from './billboards.controller.js';
import { DashboardAnalyticsService } from './services/dashboard-analytics.service.js';
import { S3ImagesModule } from '../s3-images/s3-images.module.js';

@Module({
  imports: [S3ImagesModule],
  controllers: [BillboardsController],
  providers: [BillboardsService, DashboardAnalyticsService],
  exports: [BillboardsService, DashboardAnalyticsService],
})
export class BillboardsModule {}
