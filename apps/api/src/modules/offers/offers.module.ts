import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module.js';
import { S3ImagesModule } from '../s3-images/s3-images.module.js';
import { OffersController } from './offers.controller.js';
import { OffersService } from './offers.service.js';

@Module({
  imports: [S3ImagesModule, ClientsModule],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
