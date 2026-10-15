import { CrmSiteKind } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HOLD_MAX_DAYS } from '../crm-ooh.constants.js';

export class InventoryQueryDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;

  @IsOptional()
  @IsEnum(CrmSiteKind)
  kind?: CrmSiteKind;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  @IsOptional()
  @IsUUID()
  dealId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  industry?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  onlyAvailable?: 'true' | 'false';
}

export class DealSiteInputDto {
  @IsEnum(CrmSiteKind)
  kind!: CrmSiteKind;

  @IsOptional()
  @IsInt()
  billboardId?: number;

  @IsOptional()
  @IsUUID()
  digitalBillboardId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20000)
  spotsPerDay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;
}

export class AddDealSitesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => DealSiteInputDto)
  sites!: DealSiteInputDto[];

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsBoolean()
  hold?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(HOLD_MAX_DAYS)
  holdDays?: number;
}

export class UpdateDealSiteDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20000)
  spotsPerDay?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;
}

export class DealSitesActionDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('all', { each: true })
  siteIds!: string[];

  @IsIn(['hold', 'release', 'remove', 'propose'])
  action!: 'hold' | 'release' | 'remove' | 'propose';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(HOLD_MAX_DAYS)
  holdDays?: number;
}
