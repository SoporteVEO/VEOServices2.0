import { Module } from '@nestjs/common';
import { BillboardsModule } from '../billboards/billboards.module.js';
import { S3ImagesModule } from '../s3-images/s3-images.module.js';
import { MaintenanceCategoriesService } from './maintenance-categories.service.js';
import { MaintenanceController } from './maintenance.controller.js';
import { MaintenanceJobsService } from './maintenance-jobs.service.js';
import { MaintenancePortalController } from './maintenance-portal.controller.js';
import { MaintenanceStatsService } from './maintenance-stats.service.js';

@Module({
  imports: [S3ImagesModule, BillboardsModule],
  controllers: [MaintenanceController, MaintenancePortalController],
  providers: [
    MaintenanceJobsService,
    MaintenanceCategoriesService,
    MaintenanceStatsService,
  ],
  exports: [MaintenanceJobsService],
})
export class MaintenanceModule {}
