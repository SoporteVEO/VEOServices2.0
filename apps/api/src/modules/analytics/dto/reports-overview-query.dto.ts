import { IsOptional, IsString, Matches } from 'class-validator';

export class ReportsOverviewQueryDto {
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
  userId?: string;
}
