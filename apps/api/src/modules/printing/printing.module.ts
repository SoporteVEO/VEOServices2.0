import { Module } from '@nestjs/common';
import { PrintColorTestsService } from './print-color-tests.service.js';
import { PrintJobsService } from './print-jobs.service.js';
import { PrintingController } from './printing.controller.js';
import { PrintingMachinesService } from './printing-machines.service.js';

@Module({
  controllers: [PrintingController],
  providers: [
    PrintingMachinesService,
    PrintJobsService,
    PrintColorTestsService,
  ],
  exports: [PrintingMachinesService, PrintJobsService],
})
export class PrintingModule {}
