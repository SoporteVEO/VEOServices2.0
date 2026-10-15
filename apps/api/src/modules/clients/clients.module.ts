import { Module } from '@nestjs/common';
import { ClientContractsService } from './client-contracts.service.js';
import { ClientsController } from './clients.controller.js';
import { ClientsService } from './clients.service.js';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, ClientContractsService],
  exports: [ClientsService],
})
export class ClientsModule {}
