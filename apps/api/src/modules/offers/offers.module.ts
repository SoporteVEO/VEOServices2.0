import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module.js';
import { DigitalBillboardsModule } from '../digital-billboards/digital-billboards.module.js';
import { ProductionOrdersModule } from '../production-orders/production-orders.module.js';
import { S3ImagesModule } from '../s3-images/s3-images.module.js';
import { OffersController } from './offers.controller.js';
import { OffersService } from './offers.service.js';

@Module({
  imports: [
    S3ImagesModule,
    ClientsModule,
    ProductionOrdersModule,
    DigitalBillboardsModule,
  ],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
