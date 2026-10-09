import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateFleetVehicleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  plate!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  brand!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  model!: string;

  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  initialMileageKm?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  photoBase64?: string;
}

export class UpdateFleetVehicleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  plate?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  brand?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  model?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1950)
  @Max(2100)
  year?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(40)
  color?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  initialMileageKm?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @IsOptional()
  @IsBoolean()
  archived?: boolean;

  @IsOptional()
  @IsString()
  photoBase64?: string;

  @IsOptional()
  @IsBoolean()
  removePhoto?: boolean;
}

export class ListFleetVehiclesQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  includeArchived?: string;
}
