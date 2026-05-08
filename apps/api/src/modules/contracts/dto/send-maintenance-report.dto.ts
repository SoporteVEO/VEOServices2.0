import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export type ContractReportType = 'monthly' | 'installation' | 'maintenance';

export const CONTRACT_REPORT_TYPES: ContractReportType[] = [
  'monthly',
  'installation',
  'maintenance',
];

export class SendMaintenanceReportDto {
  @IsEmail()
  email: string;

  @IsString()
  contractNumber: string;

  @IsString()
  customerName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  period: string;

  @IsString()
  @MaxLength(255)
  fileName: string;

  @IsString()
  fileBase64: string;

  @IsIn(CONTRACT_REPORT_TYPES)
  @IsOptional()
  reportType?: ContractReportType;
}
