import {
  IsIn,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import type { PrintJobAction } from '../print-jobs.service.js';

const MAX_PHASE_MINUTES = 24 * 60;

const PRINT_JOB_ACTIONS: PrintJobAction[] = [
  'START_SETUP',
  'START_PRINT',
  'START_COOLDOWN',
  'COMPLETE',
];

export class CreatePrintJobDto {
  @IsString()
  productionOrderItemId!: string;

  @IsString()
  machineId!: string;

  @IsISO8601()
  scheduledStartAt!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PHASE_MINUTES)
  setupMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_PHASE_MINUTES)
  printMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PHASE_MINUTES)
  cooldownMinutes?: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @Length(0, 500)
  notes?: string | null;
}

export class UpdatePrintJobDto {
  @IsOptional()
  @IsString()
  machineId?: string;

  @IsOptional()
  @IsISO8601()
  scheduledStartAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PHASE_MINUTES)
  setupMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_PHASE_MINUTES)
  printMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PHASE_MINUTES)
  cooldownMinutes?: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @Length(0, 500)
  notes?: string | null;
}

export class AdvancePrintJobDto {
  @IsIn(PRINT_JOB_ACTIONS)
  action!: PrintJobAction;
}

/**
 * The calendar renders local-time day columns, so the window is sent as full
 * instants rather than plain dates to keep the client timezone authoritative.
 */
export class ListPrintJobsQueryDto {
  @IsISO8601()
  from!: string;

  @IsISO8601()
  to!: string;

  @IsOptional()
  @IsString()
  machineId?: string;
}
