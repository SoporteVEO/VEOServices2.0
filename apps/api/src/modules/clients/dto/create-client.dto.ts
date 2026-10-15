import { ClientType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
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

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEmail()
  billingEmail?: string | null;

  @IsOptional()
  @IsString()
  contact?: string | null;
}
