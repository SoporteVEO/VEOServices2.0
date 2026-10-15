import { CrmPriority, CrmTaskType } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsEnum(CrmTaskType)
  type?: CrmTaskType;

  @IsOptional()
  @IsEnum(CrmPriority)
  priority?: CrmPriority;

  @IsDateString()
  dueAt!: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsUUID()
  dealId?: string | null;

  @IsOptional()
  @IsUUID()
  clientId?: string | null;

  @IsOptional()
  @IsUUID()
  contactId?: string | null;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsEnum(CrmTaskType)
  type?: CrmTaskType;

  @IsOptional()
  @IsEnum(CrmPriority)
  priority?: CrmPriority;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export const TASK_BUCKETS = [
  'overdue',
  'today',
  'upcoming',
  'completed',
  'open',
] as const;
export type TaskBucket = (typeof TASK_BUCKETS)[number];

export class ListTasksQueryDto {
  /** A user id, `me` (default) or `all`. */
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsIn(TASK_BUCKETS)
  bucket?: TaskBucket;

  @IsOptional()
  @IsUUID()
  dealId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  contactId?: string;
}
