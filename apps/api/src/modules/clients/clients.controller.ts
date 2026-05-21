import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AllowLimited } from '../auth/decorators.js';
import { ClientsService } from './clients.service.js';
import { CreateClientDto } from './dto/create-client.dto.js';

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
    const limit = limitRaw ? Number(limitRaw) : undefined;
    if (limitRaw != null && (!Number.isFinite(limit) || (limit ?? 0) <= 0)) {
      throw new BadRequestException('limit debe ser un entero positivo');
    }
    return this.service.list({
      search: search?.trim() || undefined,
      cursor: cursor?.trim() || undefined,
      limit,
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
}
