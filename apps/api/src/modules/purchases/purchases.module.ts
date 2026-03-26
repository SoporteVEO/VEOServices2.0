import { Module } from '@nestjs/common';
import { PurchasesService } from './purchases.service.js';
import { PurchasesController } from './purchases.controller.js';
import { ShopModule } from '../shop/shop.module.js';

@Module({
  imports: [ShopModule],
  controllers: [PurchasesController],
  providers: [PurchasesService],
})
export class PurchasesModule {}
