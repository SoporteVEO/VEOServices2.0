import { Module } from '@nestjs/common';
import { DigitalBillboardsModule } from '../digital-billboards/digital-billboards.module.js';
import { ShopService } from './shop.service.js';
import { ShopController } from './shop.controller.js';

@Module({
  imports: [DigitalBillboardsModule],
  controllers: [ShopController],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopModule {}
