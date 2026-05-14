import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateMyTeamMemberDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string | null;

  @IsOptional()
  @IsString()
  secondLastName?: string | null;

  @IsOptional()
  @IsDateString()
  bornDate?: string | null;

  @IsOptional()
  @IsString()
  dui?: string | null;

  @IsOptional()
  @IsString()
  inss?: string | null;

  @IsOptional()
  @IsString()
  emergencyContactName?: string | null;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string | null;

  @IsOptional()
  @IsString()
  emergencyContactRelationship?: string | null;

  @IsOptional()
  @IsString()
  bankName?: string | null;

  @IsOptional()
  @IsString()
  bankAccount?: string | null;

  @IsOptional()
  @IsString()
  afpNumber?: string | null;

  @IsOptional()
  @IsString()
  afpEntity?: string | null;
}
