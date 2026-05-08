import { S3ImageType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateS3ImageDto {
  @IsString()
  @IsOptional()
  staticBillboardCodeId?: string | null;

  @IsEnum(S3ImageType)
  @IsOptional()
  type?: S3ImageType;
}
