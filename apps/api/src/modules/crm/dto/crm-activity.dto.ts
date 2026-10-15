import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const LOGGABLE_ACTIVITY_TYPES = ['NOTE', 'CALL', 'MEETING'] as const;
export type LoggableActivityType = (typeof LOGGABLE_ACTIVITY_TYPES)[number];

export class CreateActivityDto {
  @IsIn(LOGGABLE_ACTIVITY_TYPES)
  type!: LoggableActivityType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  body?: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  durationMinutes?: number;

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

export class ListActivitiesQueryDto {
  @IsOptional()
  @IsUUID()
  dealId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
