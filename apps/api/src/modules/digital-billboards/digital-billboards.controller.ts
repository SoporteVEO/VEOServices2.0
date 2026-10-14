import { Controller, Get, Param } from '@nestjs/common';
import { DigitalBillboardsService } from './digital-billboards.service.js';

/** Read-only catalog used by quotations and other modules; management lives in Pantallas. */
@Controller('digital-billboards')
export class DigitalBillboardsController {
  constructor(private readonly service: DigitalBillboardsService) {}

  @Get()
  async list() {
    const items = await this.service.list();
    return { data: items };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
