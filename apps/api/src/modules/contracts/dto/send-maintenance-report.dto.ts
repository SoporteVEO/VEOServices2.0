import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export type ContractReportType = 'monthly' | 'installation' | 'maintenance';

export const CONTRACT_REPORT_TYPES: ContractReportType[] = [
  'monthly',
  'installation',
  'maintenance',
];

export const REPORT_UPLOAD_FOLDER = 'reports/contracts';

const REPORT_FILE_KEY_REGEX = new RegExp(
  `^${REPORT_UPLOAD_FOLDER}/[A-Za-z0-9._-]+\\.pptx$`,
);

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
  @Matches(REPORT_FILE_KEY_REGEX, {
    message: 'fileKey debe ser una clave de reporte válida',
  })
  fileKey: string;

  @IsIn(CONTRACT_REPORT_TYPES)
  @IsOptional()
  reportType?: ContractReportType;
}
