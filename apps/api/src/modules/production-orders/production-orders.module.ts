import { Module } from '@nestjs/common';
import { S3ImagesModule } from '../s3-images/s3-images.module.js';
import { ProductionOrdersController } from './production-orders.controller.js';
import { ProductionOrdersService } from './production-orders.service.js';

@Module({
  imports: [S3ImagesModule],
  controllers: [ProductionOrdersController],
  providers: [ProductionOrdersService],
  exports: [ProductionOrdersService],
})
export class ProductionOrdersModule {}
