import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOfferItemDto {
  @IsOptional()
  @IsInt()
  billboardId?: number | null;

  @IsOptional()
  @IsString()
  billboardCode?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  cityName?: string | null;

  @IsOptional()
  @IsString()
  departmentName?: string | null;

  @IsOptional()
  @IsNumber()
  width?: number | null;

  @IsOptional()
  @IsNumber()
  height?: number | null;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  impressionPrice!: number;

  @IsNumber()
  @Min(0)
  rentalPrice!: number;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;
}

export class CreateOfferDto {
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
  @IsString()
  customerContact?: string | null;

  /**
   * Existing client id. When provided, no client upsert is performed.
   * Otherwise, if `customerEmail` is present, the offer service upserts a
   * client by email.
   */
  @IsOptional()
  @IsString()
  clientId?: string | null;

  @IsDateString()
  validUntil!: string;

  @IsOptional()
  @IsString()
  specialConditions?: string | null;

  /**
   * Optional. The PDF is attached separately via `PATCH /offers/:id/pdf`
   * once the client has the real offer number returned by this endpoint.
   */
  @IsOptional()
  @IsString()
  @MinLength(1)
  pdfBase64?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOfferItemDto)
  items!: CreateOfferItemDto[];
}
