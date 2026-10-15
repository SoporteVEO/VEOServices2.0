import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientType } from '@prisma/client';
import { AllowLimited } from '../auth/decorators.js';
import { ClientContractsService } from './client-contracts.service.js';
import { ClientsService } from './clients.service.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';

function parsePositiveInt(
  value: string | undefined,
  field: string,
): number | undefined {
  if (value == null || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new BadRequestException(`${field} debe ser un entero positivo`);
  }
  return Math.floor(parsed);
}

function parseClientType(value: string | undefined): ClientType | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (!Object.values(ClientType).includes(trimmed as ClientType)) {
    throw new BadRequestException(
      `type debe ser uno de: ${Object.values(ClientType).join(', ')}`,
    );
  }
  return trimmed as ClientType;
}

@AllowLimited()
@Controller('clients')
export class ClientsController {
  constructor(
    private readonly service: ClientsService,
    private readonly contractsService: ClientContractsService,
  ) {}

  @Get()
  async list(
    @Query('search') search?: string,
    @Query('type') typeRaw?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const limit = parsePositiveInt(limitRaw, 'limit');
    return this.service.list({
      search: search?.trim() || undefined,
      type: parseClientType(typeRaw),
      cursor: cursor?.trim() || undefined,
      limit,
    });
  }

  @Get('page')
  async listPage(
    @Query('search') search?: string,
    @Query('type') typeRaw?: string,
    @Query('page') pageRaw?: string,
    @Query('pageSize') pageSizeRaw?: string,
  ) {
    const page = parsePositiveInt(pageRaw, 'page');
    const pageSize = parsePositiveInt(pageSizeRaw, 'pageSize');
    return this.service.listPage({
      search: search?.trim() || undefined,
      type: parseClientType(typeRaw),
      page,
      pageSize,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const client = await this.service.findById(id);
    return { data: client };
  }

  @Get(':id/contracts')
  async listContracts(@Param('id') id: string) {
    const contracts = await this.contractsService.listByClient(id);
    return { data: contracts };
  }

  @Post()
  async create(@Body() dto: CreateClientDto) {
    const created = await this.service.create(dto);
    return { data: created };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    const updated = await this.service.update(id, dto);
    return { data: updated };
  }
}
