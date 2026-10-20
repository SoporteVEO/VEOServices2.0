import { ClientType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateClientDto {
  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsString()
  company?: string | null;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsEmail()
  billingEmail?: string | null;

  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsString()
  contact?: string | null;

  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsInt()
  @Min(1)
  briloCliId?: number | null;
}
