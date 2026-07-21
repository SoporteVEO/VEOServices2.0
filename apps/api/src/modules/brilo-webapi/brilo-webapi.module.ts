import { Module } from '@nestjs/common';
import { BriloWebapiController } from './brilo-webapi.controller.js';
import { BriloWebapiService } from './brilo-webapi.service.js';
import { RecuperacionesService } from './recuperaciones.service.js';

@Module({
  controllers: [BriloWebapiController],
  providers: [BriloWebapiService, RecuperacionesService],
  exports: [BriloWebapiService],
})
export class BriloWebapiModule {}
