import { Module } from '@nestjs/common';
import { PrintColorTestsService } from './print-color-tests.service.js';
import { PrintJobsService } from './print-jobs.service.js';
import { PrintRescheduleRequestsController } from './print-reschedule-requests.controller.js';
import { PrintRescheduleRequestsService } from './print-reschedule-requests.service.js';
import { PrintingController } from './printing.controller.js';
import { PrintingMachinesService } from './printing-machines.service.js';

@Module({
  controllers: [PrintingController, PrintRescheduleRequestsController],
  providers: [
    PrintingMachinesService,
    PrintJobsService,
    PrintColorTestsService,
    PrintRescheduleRequestsService,
  ],
  exports: [PrintingMachinesService, PrintJobsService],
})
export class PrintingModule {}
