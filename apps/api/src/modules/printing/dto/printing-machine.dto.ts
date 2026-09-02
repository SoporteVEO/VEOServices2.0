import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

const MAX_PHASE_MINUTES = 8 * 60;
/** A press faster than this is a data-entry slip, not a machine. */
const MAX_PRINT_SPEED_M2_PER_HOUR = 5_000;
const MAX_DAILY_CAPACITY_M2 = 100_000;

export class CreatePrintingMachineDto {
  @IsString()
  @Length(1, 60)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PHASE_MINUTES)
  setupMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PHASE_MINUTES)
  cooldownMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(MAX_PRINT_SPEED_M2_PER_HOUR)
  printSpeedM2PerHour?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(MAX_DAILY_CAPACITY_M2)
  dailyCapacityM2?: number;
}

export class UpdatePrintingMachineDto {
  @IsOptional()
  @IsString()
  @Length(1, 60)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PHASE_MINUTES)
  setupMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PHASE_MINUTES)
  cooldownMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(MAX_PRINT_SPEED_M2_PER_HOUR)
  printSpeedM2PerHour?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(MAX_DAILY_CAPACITY_M2)
  dailyCapacityM2?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
