import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ContractsService } from './contracts.service.js';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get('ending-soon')
  async getEndingSoonContracts(
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
  ) {
    const from = fromStr ? new Date(fromStr) : new Date();
    const to = toStr
      ? new Date(toStr)
      : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const contracts = await this.contractsService.getEndingSoonContracts(
      from,
      to,
    );
    return { data: contracts };
  }

  @Get('notified')
  async getNotifiedContracts() {
    const contracts = await this.contractsService.getNotifiedContracts();
    return { data: contracts };
  }

  @Post('worker/ending-soon')
  async runEndingSoonWorker() {
    const { EndingSoonContractsWorker } =
      await import('./ending-soon-contracts.worker.js');
    const worker = new EndingSoonContractsWorker(this.contractsService);
    await worker.execute();
    return { message: 'Worker executed' };
  }
}
