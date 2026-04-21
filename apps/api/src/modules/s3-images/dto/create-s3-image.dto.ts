import { S3ImageType } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateS3ImageDto {
  @IsString()
  @MinLength(1)
  imageBase64!: string;

  @IsEnum(S3ImageType)
  type!: S3ImageType;

  @IsString()
  @IsOptional()
  staticBillboardCodeId?: string | null;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
