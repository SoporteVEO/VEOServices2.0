import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DateRangePageQueryDto,
  ISO_DATE_MESSAGE,
  ISO_DATE_RE,
} from './finance-query.dto.js';

export class ListBankMovementsQueryDto extends DateRangePageQueryDto {
  @IsOptional()
  @IsString()
  number?: string;
}

class BankMovementDto {
  @IsString()
  @MaxLength(50)
  bankAccountNumber!: string;

  @IsString()
  @MaxLength(10)
  typeCode!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  number?: string;

  @IsOptional()
  @Matches(ISO_DATE_RE, { message: ISO_DATE_MESSAGE })
  date?: string;

  @IsOptional()
  @Matches(ISO_DATE_RE, { message: ISO_DATE_MESSAGE })
  bankDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @IsOptional()
  @IsString()
  costCenterCode?: string;

  @IsOptional()
  @IsString()
  currencyCode?: string;
}

export class CreateBankDepositDto extends BankMovementDto {}

export class CreateBankChargeDto extends BankMovementDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  creditor?: string;

  @IsOptional()
  @IsBoolean()
  chequeDelivered?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(25)
  supplierCode?: string;
}
