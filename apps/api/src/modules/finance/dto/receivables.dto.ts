import {
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
  PageQueryDto,
} from './finance-query.dto.js';

export class ListBalancesQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  clientCode?: string;
}

export class ListCreditLimitsQueryDto extends ListBalancesQueryDto {}

export class ListInvoicePaymentsQueryDto extends DateRangePageQueryDto {
  @IsOptional()
  @IsString()
  clientCode?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;
}

class PaymentBaseDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  paymentTypeCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentDocNumber?: string;

  @IsOptional()
  @IsString()
  bankCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateInvoicePaymentDto extends PaymentBaseDto {
  @Matches(ISO_DATE_RE, { message: ISO_DATE_MESSAGE })
  date!: string;

  @IsString()
  invoiceType!: string;

  @IsString()
  invoiceNumber!: string;
}

export class CreateClientPaymentDto extends PaymentBaseDto {
  @Matches(ISO_DATE_RE, { message: ISO_DATE_MESSAGE })
  date!: string;

  @IsString()
  clientCode!: string;

  /** Advance type used by Brilo for any amount left over after FIFO. */
  @IsOptional()
  @IsString()
  advanceTypeCode?: string;
}

export class CreateAdvanceDto extends PaymentBaseDto {
  @IsString()
  clientCode!: string;

  @IsString()
  advanceTypeCode!: string;

  @IsOptional()
  @IsString()
  saleDocNumber?: string;
}
