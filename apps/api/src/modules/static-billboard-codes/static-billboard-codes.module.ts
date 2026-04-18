import { Module } from '@nestjs/common';
import { StaticBillboardCodesController } from './static-billboard-codes.controller.js';
import { StaticBillboardCodesService } from './static-billboard-codes.service.js';

@Module({
  controllers: [StaticBillboardCodesController],
  providers: [StaticBillboardCodesService],
  exports: [StaticBillboardCodesService],
})
export class StaticBillboardCodesModule {}
