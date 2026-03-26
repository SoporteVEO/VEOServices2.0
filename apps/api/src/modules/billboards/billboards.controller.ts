import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { BillboardsService } from './billboards.service.js';
import { Public } from '../auth/decorators.js';

@Public()
@Controller('billboards')
export class BillboardsController {
  constructor(private readonly service: BillboardsService) {}

  @Get('states')
  async getAvailableStates(
    @Query('from') fromRaw?: string,
    @Query('to') toRaw?: string,
  ) {
    const from = fromRaw ? new Date(fromRaw) : new Date();
    const to = toRaw
      ? new Date(toRaw)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }

    const states = await this.service.getAvailableStates(from, to);
    return { data: states };
  }

  @Get()
  async getAvailableBillboards(
    @Query('departmentId') departmentIdRaw: string,
    @Query('from') fromRaw?: string,
    @Query('to') toRaw?: string,
  ) {
    const departmentId = Number(departmentIdRaw);
    if (!Number.isFinite(departmentId)) {
      throw new BadRequestException('departmentId inválido');
    }

    const from = fromRaw ? new Date(fromRaw) : new Date();
    const to = toRaw
      ? new Date(toRaw)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const billboards = await this.service.getAvailableBillboardsByState(
      departmentId,
      from,
      to,
    );
    return { data: billboards };
  }
}
