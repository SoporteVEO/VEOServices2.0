import { MaintenanceJobStatus } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateMaintenanceJobDto {
  @IsInt()
  billboardId!: number;

  // Descriptive fields come from the picker the same way offer items do, so
  // the job keeps readable location text without a Brilo round trip.
  @IsOptional()
  @IsString()
  billboardCode?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  cityName?: string;

  @IsOptional()
  @IsString()
  departmentName?: string;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsUUID()
  assignedUserId!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  description!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class UpdateMaintenanceJobDto {
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @IsEnum(MaintenanceJobStatus)
  status?: MaintenanceJobStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  completionNotes?: string;
}

export class UploadMaintenancePhotoDto {
  @IsString()
  imageBase64!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class CompleteMaintenanceJobDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  completionNotes?: string;
}

export class ListMaintenanceJobsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(MaintenanceJobStatus)
  status?: MaintenanceJobStatus;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  pageSize?: string;

  @IsOptional()
  @IsBoolean()
  includeArchivedCategories?: boolean;
}
