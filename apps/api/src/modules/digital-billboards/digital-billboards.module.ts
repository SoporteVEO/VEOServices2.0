import { Module } from '@nestjs/common';
import { DigitalBillboardsService } from './digital-billboards.service.js';
import { DigitalBillboardsController } from './digital-billboards.controller.js';
import { ImgbbService } from './imgbb.service.js';
import { PantallasCapacityService } from './pantallas-capacity.service.js';
import { PantallasController } from './pantallas.controller.js';
import { PantallasOrdersController } from './pantallas-orders.controller.js';
import { PantallasOrdersService } from './pantallas-orders.service.js';
import { PantallasPlacementService } from './pantallas-placement.service.js';
import { PantallasService } from './pantallas.service.js';

@Module({
  controllers: [
    DigitalBillboardsController,
    PantallasController,
    PantallasOrdersController,
  ],
  providers: [
    DigitalBillboardsService,
    ImgbbService,
    PantallasService,
    PantallasOrdersService,
    PantallasPlacementService,
    PantallasCapacityService,
  ],
  exports: [
    DigitalBillboardsService,
    PantallasPlacementService,
    PantallasCapacityService,
  ],
})
export class DigitalBillboardsModule {}
