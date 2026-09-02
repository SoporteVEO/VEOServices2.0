import { Module } from '@nestjs/common';
import { PrintJobsService } from './print-jobs.service.js';
import { PrintingController } from './printing.controller.js';
import { PrintingMachinesService } from './printing-machines.service.js';

@Module({
  controllers: [PrintingController],
  providers: [PrintingMachinesService, PrintJobsService],
  exports: [PrintingMachinesService, PrintJobsService],
})
export class PrintingModule {}
