import { Module } from '@nestjs/common';
import { BillboardsModule } from '../billboards/billboards.module.js';
import { S3ImagesModule } from '../s3-images/s3-images.module.js';
import { InstallationTasksController } from './installation-tasks.controller.js';
import { InstallationTasksService } from './installation-tasks.service.js';
import { ProductionOrdersController } from './production-orders.controller.js';
import { ProductionOrdersService } from './production-orders.service.js';

@Module({
  imports: [S3ImagesModule, BillboardsModule],
  controllers: [ProductionOrdersController, InstallationTasksController],
  providers: [ProductionOrdersService, InstallationTasksService],
  exports: [ProductionOrdersService],
})
export class ProductionOrdersModule {}
