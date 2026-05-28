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
import { AllowLimited } from '../auth/decorators.js';
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

@AllowLimited()
@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Get()
  async list(
    @Query('search') search?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const limit = parsePositiveInt(limitRaw, 'limit');
    return this.service.list({
      search: search?.trim() || undefined,
      cursor: cursor?.trim() || undefined,
      limit,
    });
  }

  @Get('page')
  async listPage(
    @Query('search') search?: string,
    @Query('page') pageRaw?: string,
    @Query('pageSize') pageSizeRaw?: string,
  ) {
    const page = parsePositiveInt(pageRaw, 'page');
    const pageSize = parsePositiveInt(pageSizeRaw, 'pageSize');
    return this.service.listPage({
      search: search?.trim() || undefined,
      page,
      pageSize,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const client = await this.service.findById(id);
    return { data: client };
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
