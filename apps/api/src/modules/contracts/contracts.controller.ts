import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { S3ImageType } from '@prisma/client';
import { ContractsService } from './contracts.service.js';
import { SendMaintenanceReportDto } from './dto/send-maintenance-report.dto.js';

function parseDate(value: string | undefined, field: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    throw new BadRequestException(`${field} no es una fecha válida (ISO 8601)`);
  }
  return parsed;
}

function parsePositiveInt(
  value: string | undefined,
  field: string,
): number | undefined {
  if (value == null) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new BadRequestException(`${field} debe ser un entero positivo`);
  }
  return Math.floor(parsed);
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function startOfNextMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

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

  @Get('active')
  async getActiveContracts(
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string,
    @Query('search') search?: string,
    @Query('imageType') imageTypeStr?: string,
  ) {
    const from = parseDate(fromStr, 'from') ?? startOfCurrentMonth();
    const to = parseDate(toStr, 'to') ?? startOfNextMonth();

    if (from >= to) {
      throw new BadRequestException('"from" debe ser anterior a "to"');
    }

    const page = parsePositiveInt(pageStr, 'page');
    const pageSize = parsePositiveInt(pageSizeStr, 'pageSize');

    if (imageTypeStr && !(imageTypeStr in S3ImageType)) {
      throw new BadRequestException(
        `imageType debe ser uno de: ${Object.keys(S3ImageType).join(', ')}`,
      );
    }
    const imageType = imageTypeStr as S3ImageType | undefined;

    return this.contractsService.getActiveContractsWithImages({
      from,
      to,
      page,
      pageSize,
      search,
      imageType,
    });
  }

  @Get('notified')
  async getNotifiedContracts() {
    const contracts = await this.contractsService.getNotifiedContracts();
    return { data: contracts };
  }

  @Post('send-maintenance-report')
  async sendMaintenanceReport(@Body() dto: SendMaintenanceReportDto) {
    return await this.contractsService.sendMaintenanceReport(dto);
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
