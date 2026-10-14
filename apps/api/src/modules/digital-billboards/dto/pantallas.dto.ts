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
import { DigitalCampaignArt, DigitalCampaignDeal } from '@prisma/client';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdatePantallasSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3600)
  spotsPerHour?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  minHours?: number;
}

export class CreateScreenDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  code!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSpots?: number;

  @IsOptional()
  @Matches(HH_MM)
  turnOnAt?: string;

  @IsOptional()
  @Matches(HH_MM)
  turnOffAt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  aliases?: string[];

  @IsOptional()
  @IsString()
  imageBase64?: string;
}

export class UpdateScreenDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSpots?: number;

  @IsOptional()
  @Matches(HH_MM)
  turnOnAt?: string;

  @IsOptional()
  @Matches(HH_MM)
  turnOffAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  aliases?: string[];

  @IsOptional()
  @IsString()
  imageBase64?: string;
}

export class CreateSublistDto {
  @IsInt()
  @Min(1)
  @Max(20000)
  capacity!: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;
}

export class UpdateSublistDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20000)
  capacity?: number;
}

export class CampaignVersionDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Matches(ISO_DATE)
  startDate?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Matches(ISO_DATE)
  endDate?: string | null;
}

export class CampaignInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  client!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  campaign?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Matches(ISO_DATE)
  startDate?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Matches(ISO_DATE)
  endDate?: string | null;

  @IsInt()
  @Min(0)
  @Max(20000)
  spotsPerDay!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  paused?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  pauseReason?: string;

  @IsOptional()
  @IsEnum(DigitalCampaignArt)
  art?: DigitalCampaignArt;

  @IsOptional()
  @IsEnum(DigitalCampaignDeal)
  deal?: DigitalCampaignDeal;

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
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(0)
  totalValue?: number | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CampaignVersionDto)
  versions?: CampaignVersionDto[];

  /** Other screens that receive a copy, placed in their best-fitting sublist. */
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  alsoScreenIds?: string[];

  /** Date the placement is evaluated against; defaults to today. */
  @IsOptional()
  @Matches(ISO_DATE)
  refDate?: string;
}

export class UpdateCampaignDto extends CampaignInputDto {
  @IsOptional()
  @IsUUID()
  sublistId?: string;
}

export class SetCampaignPauseDto {
  @IsBoolean()
  paused!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

export class MoveCampaignDto {
  @IsUUID()
  sublistId!: string;
}

export class DeleteCampaignsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsUUID('all', { each: true })
  ids!: string[];
}

export class OrderScreenDto {
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
  @IsEnum(DigitalCampaignDeal)
  deal?: DigitalCampaignDeal;
}

export class IngestOrderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  client!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  campaign?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Matches(ISO_DATE)
  startDate?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Matches(ISO_DATE)
  endDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsEnum(DigitalCampaignArt)
  art?: DigitalCampaignArt;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderScreenDto)
  screens!: OrderScreenDto[];

  @IsOptional()
  @Matches(ISO_DATE)
  refDate?: string;
}

export class ListLogsQueryDto {
  @IsOptional()
  @Matches(ISO_DATE)
  from?: string;

  @IsOptional()
  @Matches(ISO_DATE)
  to?: string;
}
