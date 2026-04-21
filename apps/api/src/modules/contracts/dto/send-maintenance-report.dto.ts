import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

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
}
