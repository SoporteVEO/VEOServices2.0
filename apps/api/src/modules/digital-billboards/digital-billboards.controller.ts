import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { DigitalBillboardsService } from './digital-billboards.service.js';

@Controller('digital-billboards')
export class DigitalBillboardsController {
  constructor(private readonly service: DigitalBillboardsService) {}

  @Get()
  async list() {
    const items = await this.service.list();
    return { data: items };
  }

  @Post()
  async create(
    @Body()
    body: {
      code: string;
      name: string;
      address: string;
      latitude: number;
      longitude: number;
      price: number;
      maxSpots?: number;
      imageBase64?: string | null;
    },
  ) {
    const created = await this.service.create(body);
    return { data: created };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/spots')
  async listSpots(
    @Param('id') id: string,
    @Query('from') fromRaw?: string,
    @Query('to') toRaw?: string,
  ) {
    if (!fromRaw || !toRaw) {
      throw new BadRequestException(
        'Se requieren los parámetros from y to (ISO 8601)',
      );
    }
    const from = new Date(fromRaw);
    const to = new Date(toRaw);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new BadRequestException('from o to no son fechas válidas');
    }
    const usages = await this.service.listUsagesInRange(id, from, to);
    return { data: usages };
  }

  @Post(':id/spots')
  async createSpot(
    @Param('id') id: string,
    @Body()
    body: {
      timestamp: string;
      duration: number;
      campaignName?: string | null;
      campaignDescription?: string | null;
    },
  ) {
    const timestamp = body.timestamp ? new Date(body.timestamp) : null;
    if (!timestamp || isNaN(timestamp.getTime())) {
      throw new BadRequestException(
        'timestamp es obligatorio y debe ser una fecha válida',
      );
    }

    const created = await this.service.createUsage({
      digitalBillboardId: id,
      timestamp,
      duration: body.duration,
      campaignName: body.campaignName,
      campaignDescription: body.campaignDescription,
    });
    return { data: created };
  }
}
