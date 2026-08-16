import { IsISO8601, IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateProductionOrderItemAssignmentDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  assignedInstallerId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsISO8601()
  scheduledInstallationAt?: string | null;
}
