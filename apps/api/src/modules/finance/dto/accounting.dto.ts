import {
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  DateRangePageQueryDto,
  ISO_DATE_MESSAGE,
  ISO_DATE_RE,
  PageQueryDto,
} from './finance-query.dto.js';

export class ListAccountsQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  parentCode?: string;
}

export class ListCostCentersQueryDto extends ListAccountsQueryDto {}

export class ListEntriesQueryDto extends DateRangePageQueryDto {
  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  typeCode?: string;
}

export class CreateEntryDto {
  @Matches(ISO_DATE_RE, { message: ISO_DATE_MESSAGE })
  date!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  description!: string;

  @IsString()
  typeCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  number?: string;
}

export class UpsertEntryLineDto {
  @IsString()
  accountCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsNumber()
  @Min(0)
  debit!: number;

  @IsNumber()
  @Min(0)
  credit!: number;

  @IsOptional()
  @Matches(ISO_DATE_RE, { message: ISO_DATE_MESSAGE })
  documentDate?: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  costCenterCode?: string;

  @IsOptional()
  @IsString()
  costCenterSubCode?: string;

  @IsOptional()
  @IsString()
  reference?: string;
}
