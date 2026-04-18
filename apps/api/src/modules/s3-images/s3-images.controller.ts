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
import { CurrentUser } from '../auth/decorators.js';
import { CreateS3ImageDto } from './dto/create-s3-image.dto.js';
import { S3ImagesService } from './s3-images.service.js';

interface AuthUser {
  id: string;
}

@Controller('s3-images')
export class S3ImagesController {
  constructor(private readonly service: S3ImagesService) {}

  @Get()
  async list(
    @Query('type') type?: string,
    @Query('staticBillboardCodeId') staticBillboardCodeId?: string,
  ) {
    if (type && !(type in S3ImageType)) {
      throw new BadRequestException(
        `type debe ser uno de: ${Object.keys(S3ImageType).join(', ')}`,
      );
    }

    const items = await this.service.list({
      type: type as S3ImageType | undefined,
      staticBillboardCodeId,
    });
    return { data: items };
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
