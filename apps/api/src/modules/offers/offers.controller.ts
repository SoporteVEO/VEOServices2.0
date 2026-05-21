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
import { AllowLimited, CurrentUser } from '../auth/decorators.js';
import { AttachOfferPdfDto } from './dto/attach-offer-pdf.dto.js';
import { CreateOfferDto } from './dto/create-offer.dto.js';
import { OffersService } from './offers.service.js';

interface AuthUser {
  id: string;
}

@AllowLimited()
@Controller('offers')
export class OffersController {
  constructor(private readonly service: OffersService) {}

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

  @Get(':id/download-url')
  async getDownloadUrl(@Param('id') id: string) {
    return this.service.getDownloadUrl(id);
  }

  @Post()
  async create(@Body() dto: CreateOfferDto, @CurrentUser() user: AuthUser) {
    const created = await this.service.create(dto, user.id);
    return { data: created };
  }

  @Patch(':id/pdf')
  async attachPdf(
    @Param('id') id: string,
    @Body() dto: AttachOfferPdfDto,
  ) {
    const updated = await this.service.attachPdf(id, dto.pdfBase64);
    return { data: updated };
  }
}
