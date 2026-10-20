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

export class CreateClientDto {
  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  company?: string | null;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsEmail()
  billingEmail?: string | null;

  @IsOptional()
  @IsString()
  contact?: string | null;

  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsInt()
  @Min(1)
  briloCliId?: number | null;
}
