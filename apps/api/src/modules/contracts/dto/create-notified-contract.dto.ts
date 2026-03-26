import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { NotificationStatus } from '@prisma/client';

export class CreateNotifiedContractDto {
  @IsInt()
  contractSourceId: number;

  @IsInt()
  contractDetailSourceId: number;

  @IsString()
  contractNumber: string;

  @IsEnum(NotificationStatus)
  status: NotificationStatus;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}
