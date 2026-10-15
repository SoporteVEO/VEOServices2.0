import { Module } from '@nestjs/common';
import { BriloWebapiModule } from '../brilo-webapi/brilo-webapi.module.js';
import { ClientsModule } from '../clients/clients.module.js';
import { DigitalBillboardsModule } from '../digital-billboards/digital-billboards.module.js';
import { ProductionOrdersModule } from '../production-orders/production-orders.module.js';
import { S3ImagesModule } from '../s3-images/s3-images.module.js';
import { OfferBriloSyncService } from './offer-brilo-sync.service.js';
import { OffersController } from './offers.controller.js';
import { OffersService } from './offers.service.js';

@Module({
  imports: [
    S3ImagesModule,
    ClientsModule,
    ProductionOrdersModule,
    DigitalBillboardsModule,
    BriloWebapiModule,
  ],
  controllers: [OffersController],
  providers: [OffersService, OfferBriloSyncService],
  exports: [OffersService],
})
export class OffersModule {}
