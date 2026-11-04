import { Module } from '@nestjs/common';
import { BillboardsModule } from '../billboards/billboards.module.js';
import { S3ImagesModule } from '../s3-images/s3-images.module.js';
import { ExpansionBillboardsService } from './expansion-billboards.service.js';
import { ExpansionLocationService } from './expansion-location.service.js';
import { ExpansionNexoService } from './expansion-nexo.service.js';
import { ExpansionSitesService } from './expansion-sites.service.js';
import { ExpansionController } from './expansion.controller.js';

@Module({
  imports: [BillboardsModule, S3ImagesModule],
  controllers: [ExpansionController],
  providers: [
    ExpansionBillboardsService,
    ExpansionSitesService,
    ExpansionLocationService,
    ExpansionNexoService,
  ],
})
export class ExpansionModule {}
