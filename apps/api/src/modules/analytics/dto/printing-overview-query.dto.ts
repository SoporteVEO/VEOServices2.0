import { IsOptional, IsString, Matches } from 'class-validator';

export class PrintingOverviewQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'from must be YYYY-MM-DD',
  })
  from!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'to must be YYYY-MM-DD',
  })
  to!: string;

  @IsOptional()
  @IsString()
  machineId?: string;

  /**
   * `Date.prototype.getTimezoneOffset()` from the browser. Press hours are only
   * meaningful in shop-floor local time, so day and hour buckets are shifted by
   * this amount instead of being computed in UTC.
   */
  @IsOptional()
  @Matches(/^-?\d{1,4}$/, { message: 'tzOffsetMinutes must be an integer' })
  tzOffsetMinutes?: string;
}
