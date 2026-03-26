import { Module } from '@nestjs/common';
import { BillboardsService } from './billboards.service.js';
import { BillboardsController } from './billboards.controller.js';

@Module({
  controllers: [BillboardsController],
  providers: [BillboardsService],
  exports: [BillboardsService],
})
export class BillboardsModule {}
