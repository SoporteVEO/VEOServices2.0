import { Module } from '@nestjs/common';
import { BriloWebapiModule } from '../brilo-webapi/brilo-webapi.module.js';
import { AccountingController } from './accounting.controller.js';
import { AccountingService } from './accounting.service.js';
import { BanksController } from './banks.controller.js';
import { BanksService } from './banks.service.js';
import { InvoicingController } from './invoicing.controller.js';
import { InvoicingService } from './invoicing.service.js';
import { ReceivablesController } from './receivables.controller.js';
import { ReceivablesService } from './receivables.service.js';

@Module({
  imports: [BriloWebapiModule],
  controllers: [
    AccountingController,
    BanksController,
    ReceivablesController,
    InvoicingController,
  ],
  providers: [
    AccountingService,
    BanksService,
    ReceivablesService,
    InvoicingService,
  ],
})
export class FinanceModule {}
