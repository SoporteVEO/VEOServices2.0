import { IsNumberString, IsOptional, Matches } from 'class-validator';

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const ISO_DATE_MESSAGE = 'La fecha debe tener el formato YYYY-MM-DD';

export class PageQueryDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  pageSize?: string;
}

export class DateRangePageQueryDto extends PageQueryDto {
  @IsOptional()
  @Matches(ISO_DATE_RE, { message: ISO_DATE_MESSAGE })
  from?: string;

  @IsOptional()
  @Matches(ISO_DATE_RE, { message: ISO_DATE_MESSAGE })
  to?: string;
}
