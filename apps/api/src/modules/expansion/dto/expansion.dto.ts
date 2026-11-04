import { ExpansionSitePriority, ExpansionSiteStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  EXPANSION_DOCUMENT_KEY_REGEX,
  EXPANSION_DOCUMENT_TYPES,
} from '../expansion.constants.js';

const MAX_MONEY = 10_000_000;

export class ExpansionPeriodQueryDto {
  @IsOptional()
  @Matches(/^\d{4}$/, { message: 'El año debe tener 4 dígitos' })
  year?: string;
}

export class UpdateBillboardCostDto {
  /** `null` clears the cost and the billboard goes back to occupancy rating. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_MONEY)
  monthlyCost?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}

export class CreateExpansionSiteDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsNumber()
  @IsLatitude()
  latitude!: number;

  @IsNumber()
  @IsLongitude()
  longitude!: number;

  @IsOptional()
  @IsEnum(ExpansionSiteStatus)
  status?: ExpansionSiteStatus;

  @IsOptional()
  @IsEnum(ExpansionSitePriority)
  priority?: ExpansionSitePriority;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  departmentName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  formatCode?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  width?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  height?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_MONEY)
  estimatedMonthlyCost?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_MONEY)
  estimatedMonthlyPrice?: number | null;
}

export class UpdateExpansionSiteDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsNumber()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsEnum(ExpansionSiteStatus)
  status?: ExpansionSiteStatus;

  @IsOptional()
  @IsEnum(ExpansionSitePriority)
  priority?: ExpansionSitePriority;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  departmentName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  formatCode?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  width?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  height?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_MONEY)
  estimatedMonthlyCost?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_MONEY)
  estimatedMonthlyPrice?: number | null;
}

export class LocationContextQueryDto {
  @IsLatitude()
  latitude!: string;

  @IsLongitude()
  longitude!: string;
}

export const LOCATION_FACTOR_KEYS = [
  'demand',
  'occupancy',
  'competition',
  'exposure',
  'density',
  'financial',
] as const;

export const LOCATION_VERDICTS = [
  'RECOMMENDED',
  'CAUTION',
  'NOT_RECOMMENDED',
  'INSUFFICIENT_DATA',
] as const;

export class LocationFactorDto {
  @IsIn(LOCATION_FACTOR_KEYS)
  key!: (typeof LOCATION_FACTOR_KEYS)[number];

  @IsNumber()
  @Min(0)
  @Max(1)
  value!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  weight!: number;
}

/** The score the user sees, computed in the browser from the same billboards. */
export class LocationAnalysisSummaryDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number;

  @IsIn(LOCATION_VERDICTS)
  verdict!: (typeof LOCATION_VERDICTS)[number];

  @IsIn(['HIGH', 'MEDIUM', 'LOW'])
  confidence!: 'HIGH' | 'MEDIUM' | 'LOW';

  @IsArray()
  @ArrayMaxSize(LOCATION_FACTOR_KEYS.length)
  @ValidateNested({ each: true })
  @Type(() => LocationFactorDto)
  factors!: LocationFactorDto[];

  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  caps!: string[];

  @IsInt()
  @Min(0)
  @Max(10_000)
  within500m!: number;

  @IsInt()
  @Min(0)
  @Max(10_000)
  within1Km!: number;

  @IsIn(['UNDERSERVED', 'BALANCED', 'SATURATED'])
  saturation!: 'UNDERSERVED' | 'BALANCED' | 'SATURATED';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1_000_000)
  nearestDistanceM?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  nearestCode?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  avgOccupancy?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  avgScore?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_MONEY)
  medianPrice?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_MONEY)
  estimatedMonthlyRevenue?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  estimatedRoi?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  breakEvenOccupancy?: number | null;
}

export class ExpansionNexoInsightDto {
  @IsNumber()
  @IsLatitude()
  latitude!: number;

  @IsNumber()
  @IsLongitude()
  longitude!: number;

  @IsOptional()
  @IsUUID()
  siteId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  formatCode?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  width?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  height?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_MONEY)
  estimatedMonthlyPrice?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_MONEY)
  estimatedMonthlyCost?: number | null;

  @ValidateNested()
  @Type(() => LocationAnalysisSummaryDto)
  analysis!: LocationAnalysisSummaryDto;
}

export class AddExpansionCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}

export class CreateExpansionDocumentUploadDto {
  @IsString()
  @IsIn(Object.keys(EXPANSION_DOCUMENT_TYPES), {
    message: 'Tipo de archivo no permitido',
  })
  mimeType!: string;
}

export class AttachExpansionDocumentDto {
  @IsString()
  @Matches(EXPANSION_DOCUMENT_KEY_REGEX, { message: 'Archivo inválido' })
  fileKey!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @IsIn(Object.keys(EXPANSION_DOCUMENT_TYPES), {
    message: 'Tipo de archivo no permitido',
  })
  mimeType!: string;
}
