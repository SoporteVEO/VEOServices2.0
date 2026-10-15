import {
  CrmDealSource,
  CrmDealStatus,
  CrmMediaType,
  CrmPriority,
} from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** OOH campaign brief, shared by create and update. */
export class DealBriefDto {
  @IsOptional()
  @IsEnum(CrmMediaType)
  mediaType?: CrmMediaType | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  industry?: string | null;

  @IsOptional()
  @IsDateString()
  campaignStart?: string | null;

  @IsOptional()
  @IsDateString()
  campaignEnd?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(14)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  targetZones?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  agencyCommissionPct?: number | null;
}

export class CreateDealDto extends DealBriefDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @IsUUID()
  pipelineId!: string;

  @IsOptional()
  @IsUUID()
  stageId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string | null;

  @IsOptional()
  @IsUUID()
  contactId?: string | null;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string | null;

  @IsOptional()
  @IsEnum(CrmPriority)
  priority?: CrmPriority;

  @IsOptional()
  @IsEnum(CrmDealSource)
  source?: CrmDealSource | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;
}

export class UpdateDealDto extends DealBriefDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string | null;

  @IsOptional()
  @IsUUID()
  contactId?: string | null;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string | null;

  @IsOptional()
  @IsEnum(CrmPriority)
  priority?: CrmPriority;

  @IsOptional()
  @IsEnum(CrmDealSource)
  source?: CrmDealSource | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;
}

export class MoveDealDto {
  @IsUUID()
  stageId!: string;

  /** Id of the card the deal is dropped above; omitted means "end of column". */
  @IsOptional()
  @IsUUID()
  beforeDealId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  lostReason?: string;
}

export class ChangeDealStatusDto {
  @IsEnum(CrmDealStatus)
  status!: CrmDealStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  lostReason?: string;
}

export class LinkOfferDto {
  @IsUUID()
  offerId!: string;
}

export class CreateDealFromOfferDto {
  @IsUUID()
  offerId!: string;

  @IsOptional()
  @IsUUID()
  pipelineId?: string;

  @IsOptional()
  @IsUUID()
  stageId?: string;
}

export class ListDealsQueryDto {
  @IsOptional()
  @IsUUID()
  pipelineId?: string;

  /** A user id, or `me`. */
  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CrmDealStatus)
  status?: CrmDealStatus;

  @IsOptional()
  @IsEnum(CrmMediaType)
  mediaType?: CrmMediaType;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  contactId?: string;
}
