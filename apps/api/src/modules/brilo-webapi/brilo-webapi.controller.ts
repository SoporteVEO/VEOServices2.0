import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProcessRecuperacionesDto } from './dto/process-recuperaciones.dto.js';
import { RecuperacionesService } from './recuperaciones.service.js';

@Controller('brilo-webapi')
export class BriloWebapiController {
  constructor(private readonly recuperaciones: RecuperacionesService) {}

  @Get('catalogos')
  async getCatalogos() {
    return this.recuperaciones.getCatalogos();
  }

  @Post('recuperaciones')
  async processRecuperaciones(@Body() dto: ProcessRecuperacionesDto) {
    return this.recuperaciones.processRows(dto.rows);
  }
}
