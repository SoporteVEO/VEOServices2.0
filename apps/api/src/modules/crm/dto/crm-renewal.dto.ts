import { CrmSiteKind } from '@prisma/client';
import {
  IsEnum,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class ListRenewalsQueryDto {
  @IsOptional()
  @IsNumberString()
  days?: string;

  /** Also include contracts that ended this many days ago. */
  @IsOptional()
  @IsNumberString()
  pastDays?: string;

  @IsOptional()
  @IsIn(['mine', 'team'])
  scope?: 'mine' | 'team';

  @IsOptional()
  @IsEnum(CrmSiteKind)
  kind?: CrmSiteKind;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;
}

export class CreateRenewalDealDto {
  @Matches(/^(STATIC|DIGITAL):[\w-]+$/)
  key!: string;

  @IsOptional()
  @IsUUID()
  pipelineId?: string;
}
