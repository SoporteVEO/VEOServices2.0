import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { AllowLimited } from '../auth/decorators.js';
import { StaticBillboardCodesService } from './static-billboard-codes.service.js';
import { CreateStaticBillboardCodeDto } from './dto/create-static-billboard-code.dto.js';

@AllowLimited()
@Controller('static-billboard-codes')
export class StaticBillboardCodesController {
  constructor(private readonly service: StaticBillboardCodesService) {}

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

  @Post()
  async create(@Body() dto: CreateStaticBillboardCodeDto) {
    const created = await this.service.create(dto);
    return { data: created };
  }
}
