import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DigitalCampaignDeal, DigitalOrderArtFormat } from '@prisma/client';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class DigitalOrderScreenDto {
  @IsUUID()
  screenId!: string;

  @IsInt()
  @Min(1)
  @Max(20000)
  spotsPerDay!: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(0)
  monthlyValue?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(0)
  spotValue?: number | null;

  @IsOptional()
  @IsBoolean()
  spotValueManual?: boolean;

  @IsOptional()
  @IsEnum(DigitalCampaignDeal)
  deal?: DigitalCampaignDeal;
}

export class SaveDigitalOrderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  executive!: string;

  @IsOptional()
  @Matches(ISO_DATE)
  entryDate?: string;

  @IsBoolean()
  hasAgency!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  agencyName?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  client!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  campaign?: string;

  @IsEnum(DigitalOrderArtFormat)
  artFormat!: DigitalOrderArtFormat;

  @Matches(ISO_DATE)
  startDate!: string;

  @Matches(ISO_DATE)
  endDate!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(1000, { each: true })
  links?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(900)
  instructions?: string;

  /** Manual "valor mensual"; when null it is the sum of the screens. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(0)
  monthlyValue?: number | null;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => DigitalOrderScreenDto)
  screens!: DigitalOrderScreenDto[];
}

export class ReturnDigitalOrderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(600)
  reason!: string;
}
