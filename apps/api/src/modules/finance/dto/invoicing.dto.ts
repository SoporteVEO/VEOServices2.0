import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DateRangePageQueryDto } from './finance-query.dto.js';

export class ListInvoicesQueryDto extends DateRangePageQueryDto {
  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  clientCode?: string;
}

export const ORDER_STATUSES = ['O', 'F', 'P'] as const;
export const ORDER_SCOPES = ['propia', 'todos', 'vndHijos'] as const;
export const ORDER_DOC_TYPES = ['OFS', 'COT'] as const;

export class ListOrdersQueryDto extends DateRangePageQueryDto {
  @IsOptional()
  @IsIn(ORDER_DOC_TYPES)
  docType?: (typeof ORDER_DOC_TYPES)[number];

  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: (typeof ORDER_STATUSES)[number];

  @IsOptional()
  @IsIn(ORDER_SCOPES)
  scope?: (typeof ORDER_SCOPES)[number];

  @IsOptional()
  @IsString()
  search?: string;
}

export const EMAIL_SEND_TYPES = ['TO', 'CC', 'CCO'] as const;

class EmailRecipientDto {
  @IsEmail()
  email!: string;

  @IsIn(EMAIL_SEND_TYPES)
  sendType!: (typeof EMAIL_SEND_TYPES)[number];
}

export class SendOrderEmailDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  recipients!: EmailRecipientDto[];

  @IsOptional()
  @IsBoolean()
  includeSeller?: boolean;

  @IsOptional()
  @IsBoolean()
  includeMe?: boolean;

  @IsOptional()
  @IsEmail()
  replyTo?: string;
}
