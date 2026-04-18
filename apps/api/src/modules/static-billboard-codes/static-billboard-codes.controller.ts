import { Body, Controller, Get, Post } from '@nestjs/common';
import { StaticBillboardCodesService } from './static-billboard-codes.service.js';
import { CreateStaticBillboardCodeDto } from './dto/create-static-billboard-code.dto.js';

@Controller('static-billboard-codes')
export class StaticBillboardCodesController {
  constructor(private readonly service: StaticBillboardCodesService) {}

  @Get()
  async list() {
    const items = await this.service.list();
    return { data: items };
  }

  @Post()
  async create(@Body() dto: CreateStaticBillboardCodeDto) {
    const created = await this.service.create(dto);
    return { data: created };
  }
}
