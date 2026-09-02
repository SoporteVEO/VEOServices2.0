import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser, RequiredSubRoles } from '../auth/decorators.js';
import {
  AdvancePrintJobDto,
  CreatePrintJobDto,
  ListPrintJobsQueryDto,
  UpdatePrintJobDto,
} from './dto/print-job.dto.js';
import {
  CreatePrintingMachineDto,
  UpdatePrintingMachineDto,
} from './dto/printing-machine.dto.js';
import { PrintJobsService } from './print-jobs.service.js';
import { PrintingMachinesService } from './printing-machines.service.js';

interface AuthUser {
  id: string;
}

const MAX_RANGE_DAYS = 120;

@Controller('printing')
@RequiredSubRoles('PRODUCTION')
export class PrintingController {
  constructor(
    private readonly machines: PrintingMachinesService,
    private readonly jobs: PrintJobsService,
  ) {}

  @Get('machines')
  async listMachines() {
    const data = await this.machines.listMachines();
    return { data };
  }

  @Post('machines')
  async createMachine(@Body() dto: CreatePrintingMachineDto) {
    const data = await this.machines.createMachine(dto);
    return { data };
  }

  @Patch('machines/:id')
  async updateMachine(
    @Param('id') id: string,
    @Body() dto: UpdatePrintingMachineDto,
  ) {
    const data = await this.machines.updateMachine(id, dto);
    return { data };
  }

  @Delete('machines/:id')
  async deleteMachine(@Param('id') id: string) {
    await this.machines.deleteMachine(id);
    return { data: { id } };
  }

  @Get('jobs')
  async listJobs(@Query() query: ListPrintJobsQueryDto) {
    const { from, to } = parseInstantRange(query.from, query.to);
    const data = await this.jobs.listJobs({
      from,
      to,
      machineId: query.machineId,
    });
    return { data };
  }

  @Get('backlog')
  async listBacklog(@Query('search') search?: string) {
    const data = await this.jobs.listBacklog({
      search: search?.trim() || undefined,
    });
    return { data };
  }

  @Post('jobs')
  async createJob(
    @Body() dto: CreatePrintJobDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.jobs.schedule(dto, user.id);
    return { data };
  }

  @Patch('jobs/:id')
  async updateJob(@Param('id') id: string, @Body() dto: UpdatePrintJobDto) {
    const data = await this.jobs.update(id, dto);
    return { data };
  }

  @Patch('jobs/:id/advance')
  async advanceJob(@Param('id') id: string, @Body() dto: AdvancePrintJobDto) {
    const data = await this.jobs.advance(id, dto.action);
    return { data };
  }

  @Patch('jobs/:id/cancel')
  async cancelJob(@Param('id') id: string) {
    const data = await this.jobs.cancel(id);
    return { data };
  }

  @Delete('jobs/:id')
  async deleteJob(@Param('id') id: string) {
    await this.jobs.remove(id);
    return { data: { id } };
  }
}

function parseInstantRange(
  fromRaw: string,
  toRaw: string,
): { from: Date; to: Date } {
  const from = new Date(fromRaw);
  const to = new Date(toRaw);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new BadRequestException('Rango de fechas inválido');
  }
  if (from >= to) {
    throw new BadRequestException('from debe ser anterior a to');
  }
  const days = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
  if (days > MAX_RANGE_DAYS) {
    throw new BadRequestException(
      `El rango no puede exceder ${MAX_RANGE_DAYS} días`,
    );
  }
  return { from, to };
}
