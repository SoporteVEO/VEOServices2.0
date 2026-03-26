import { Module } from '@nestjs/common';
import { DigitalBillboardsService } from './digital-billboards.service.js';
import { DigitalBillboardsController } from './digital-billboards.controller.js';
import { ImgbbService } from './imgbb.service.js';

@Module({
  controllers: [DigitalBillboardsController],
  providers: [DigitalBillboardsService, ImgbbService],
  exports: [DigitalBillboardsService],
})
export class DigitalBillboardsModule {}
