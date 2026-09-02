import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOfferItemDto } from './create-offer.dto.js';

/**
 * Full replacement of an offer's editable content. Only allowed while the
 * offer is PENDING: once it is accepted it drives production orders and
 * digital usage rows, so its content is frozen.
 */
export class EditOfferDto {
  @IsString()
  @MinLength(1)
  customerName!: string;

  @IsOptional()
  @IsString()
  customerCompany?: string | null;

  @IsOptional()
  @IsEmail()
  customerEmail?: string | null;

  @IsOptional()
  @IsEmail()
  customerBillingEmail?: string | null;

  @IsOptional()
  @IsString()
  customerContact?: string | null;

  @IsOptional()
  @IsString()
  clientId?: string | null;

  @IsDateString()
  validUntil!: string;

  @IsOptional()
  @IsString()
  specialConditions?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOfferItemDto)
  items!: CreateOfferItemDto[];
}
