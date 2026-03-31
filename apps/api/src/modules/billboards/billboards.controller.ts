import {
  Controller,
  Get,
  Query,
  Param,
  Res,
  BadRequestException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { BillboardsService } from './billboards.service.js';
import { Public } from '../auth/decorators.js';

@Public()
@Controller('billboards')
export class BillboardsController {
  constructor(private readonly service: BillboardsService) {}

  @Get('available/report')
  async getAvailableBillboardsForReport(
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

    const billboards = await this.service.getAvailableBillboardsForReport(
      from,
      to,
    );
    return { data: billboards };
  }

  @Get('available')
  async getAvailableBillboardsInTimeframe(
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

    const billboards = await this.service.getAvailableBillboardsInRange(
      from,
      to,
    );
    return { data: billboards };
  }

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

  @Get('image/:imageId')
  async getBillboardImage(
    @Param('imageId') imageIdRaw: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const imageId = Number(imageIdRaw);
    if (!Number.isFinite(imageId)) {
      throw new BadRequestException('imageId inválido');
    }

    const result = await this.service.getBillboardImage(imageId);
    if (!result) {
      throw new NotFoundException('Imagen no encontrada');
    }

    res.set({
      'Content-Type': result.mime,
      'Cache-Control': 'public, max-age=86400',
    });
    return new StreamableFile(result.buffer);
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
