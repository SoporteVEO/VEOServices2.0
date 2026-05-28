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
import { resolveTargetUserId } from '../auth/view-as.helper.js';
import { AcceptOfferDto } from './dto/accept-offer.dto.js';
import { AttachOfferPdfDto } from './dto/attach-offer-pdf.dto.js';
import { CreateOfferDto } from './dto/create-offer.dto.js';
import { UpdateOfferDto } from './dto/update-offer.dto.js';
import { OffersService } from './offers.service.js';

interface AuthUser {
  id: string;
  role?: string | null;
}

function parseDateOrThrow(
  value: string | undefined,
  field: string,
): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${field} no es una fecha válida (ISO 8601)`);
  }
  return parsed;
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

  @Get('mine')
  async listMine(
    @CurrentUser() user: AuthUser,
    @Query('search') search?: string,
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string,
    @Query('viewAsUserId') viewAsUserId?: string,
  ) {
    const page = pageStr ? Number(pageStr) : undefined;
    const pageSize = pageSizeStr ? Number(pageSizeStr) : undefined;
    if (pageStr != null && (!Number.isFinite(page) || (page ?? 0) < 1)) {
      throw new BadRequestException('page debe ser un entero positivo');
    }
    if (
      pageSizeStr != null &&
      (!Number.isFinite(pageSize) || (pageSize ?? 0) < 1)
    ) {
      throw new BadRequestException('pageSize debe ser un entero positivo');
    }

    const targetUserId = resolveTargetUserId(user, viewAsUserId);
    return this.service.listMine(targetUserId, {
      search: search?.trim() || undefined,
      page,
      pageSize,
    });
  }

  @Get('mine/summary')
  async myOffersSummary(
    @CurrentUser() user: AuthUser,
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
    @Query('viewAsUserId') viewAsUserId?: string,
  ) {
    const from = parseDateOrThrow(fromStr, 'from');
    const to = parseDateOrThrow(toStr, 'to');

    if (!from || !to) {
      throw new BadRequestException('"from" y "to" son requeridos');
    }
    if (from >= to) {
      throw new BadRequestException('"from" debe ser anterior a "to"');
    }

    const targetUserId = resolveTargetUserId(user, viewAsUserId);
    const data = await this.service.getMyOffersSummary(targetUserId, {
      from,
      to,
    });
    return { data };
  }

  @Get('brilo-contracts')
  async listBriloContracts(
    @Query('search') search?: string,
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string,
  ) {
    const page = pageStr ? Number(pageStr) : undefined;
    const pageSize = pageSizeStr ? Number(pageSizeStr) : undefined;
    if (pageStr != null && (!Number.isFinite(page) || (page ?? 0) < 1)) {
      throw new BadRequestException('page debe ser un entero positivo');
    }
    if (
      pageSizeStr != null &&
      (!Number.isFinite(pageSize) || (pageSize ?? 0) < 1)
    ) {
      throw new BadRequestException('pageSize debe ser un entero positivo');
    }

    return this.service.listBriloContracts({
      search: search?.trim() || undefined,
      page,
      pageSize,
    });
  }

  @Get(':id/download-url')
  async getDownloadUrl(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Query('viewAsUserId') viewAsUserId?: string,
  ) {
    const targetUserId = resolveTargetUserId(user, viewAsUserId);
    return this.service.getDownloadUrl(id, targetUserId);
  }

  @Get(':id')
  async getOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Query('viewAsUserId') viewAsUserId?: string,
  ) {
    const targetUserId = resolveTargetUserId(user, viewAsUserId);
    const data = await this.service.getOfferById(id, targetUserId);
    return { data };
  }

  @Post()
  async create(@Body() dto: CreateOfferDto, @CurrentUser() user: AuthUser) {
    const created = await this.service.create(dto, user.id);
    return { data: created };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOfferDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.updateOffer(id, user.id, dto);
    return { data };
  }

  @Patch(':id/pdf')
  async attachPdf(
    @Param('id') id: string,
    @Body() dto: AttachOfferPdfDto,
  ) {
    const updated = await this.service.attachPdf(id, dto.pdfBase64);
    return { data: updated };
  }

  @Patch(':id/decline')
  async decline(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const updated = await this.service.declineOffer(id, user.id);
    return { data: updated };
  }

  @Patch(':id/accept')
  async accept(
    @Param('id') id: string,
    @Body() dto: AcceptOfferDto,
    @CurrentUser() user: AuthUser,
  ) {
    const updated = await this.service.acceptOffer(id, user.id, dto.briloMconId);
    return { data: updated };
  }
}
