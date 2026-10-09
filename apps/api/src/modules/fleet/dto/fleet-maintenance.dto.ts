import { FleetServiceType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateFleetMaintenanceDto {
  @IsEnum(FleetServiceType)
  type!: FleetServiceType;

  @IsDateString()
  performedAt!: string;

  @IsInt()
  @Min(0)
  mileageKm!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  workshop?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  invoiceNumber?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  nextServiceKm?: number;

  @IsOptional()
  @IsDateString()
  nextServiceAt?: string;
}

export class UpdateFleetMaintenanceDto {
  @IsOptional()
  @IsEnum(FleetServiceType)
  type?: FleetServiceType;

  @IsOptional()
  @IsDateString()
  performedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  mileageKm?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(120)
  workshop?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(60)
  invoiceNumber?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  nextServiceKm?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  nextServiceAt?: string | null;
}
