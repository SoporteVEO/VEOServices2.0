import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { S3ImageType } from '@prisma/client';
import { AllowLimited, CurrentUser } from '../auth/decorators.js';
import { CreateS3ImageDto } from './dto/create-s3-image.dto.js';
import { S3ImagesService } from './s3-images.service.js';

interface AuthUser {
  id: string;
}

function parseDate(value: string | undefined, field: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    throw new BadRequestException(`${field} no es una fecha válida (ISO 8601)`);
  }
  return parsed;
}

@AllowLimited()
@Controller('s3-images')
export class S3ImagesController {
  constructor(private readonly service: S3ImagesService) {}

  @Get('uploaders')
  async listUploaders() {
    const items = await this.service.listUploaders();
    return { data: items };
  }

  @Get()
  async list(
    @Query('type') type?: string,
    @Query('staticBillboardCodeId') staticBillboardCodeId?: string,
    @Query('code') code?: string,
    @Query('uploadedUserId') uploadedUserId?: string,
    @Query('dateFrom') dateFromRaw?: string,
    @Query('dateTo') dateToRaw?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('limit') limitRaw?: string,
    @Query('cursor') cursor?: string,
  ) {
    if (type && !(type in S3ImageType)) {
      throw new BadRequestException(
        `type debe ser uno de: ${Object.keys(S3ImageType).join(', ')}`,
      );
    }

    if (sortOrder && sortOrder !== 'asc' && sortOrder !== 'desc') {
      throw new BadRequestException('sortOrder debe ser "asc" o "desc"');
    }

    const limit = limitRaw ? Number(limitRaw) : undefined;
    if (limitRaw != null && (!Number.isFinite(limit) || (limit ?? 0) <= 0)) {
      throw new BadRequestException('limit debe ser un entero positivo');
    }

    return this.service.list({
      type: type as S3ImageType | undefined,
      staticBillboardCodeId,
      code: code?.trim() || undefined,
      uploadedUserId,
      dateFrom: parseDate(dateFromRaw, 'dateFrom'),
      dateTo: parseDate(dateToRaw, 'dateTo'),
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
      limit,
      cursor: cursor || undefined,
    });
  }

  @Post()
  async create(@Body() dto: CreateS3ImageDto, @CurrentUser() user: AuthUser) {
    const created = await this.service.create(dto, user.id);
    return { data: created };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
