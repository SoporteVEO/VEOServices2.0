import { ContractType, TeamMemberStatus } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTeamMemberDto {
  @IsString()
  userId!: string;

  @IsString()
  firstName!: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  secondLastName?: string;

  @IsString()
  @IsOptional()
  dui?: string;

  @IsString()
  @IsOptional()
  inss?: string;

  @IsString()
  @IsOptional()
  afpNumber?: string;

  @IsString()
  @IsOptional()
  afpEntity?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  bankAccount?: string;

  @IsOptional()
  @IsDateString()
  bornDate?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @IsOptional()
  @IsEnum(TeamMemberStatus)
  status?: TeamMemberStatus;

  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  emergencyContactPhone?: string;

  @IsString()
  @IsOptional()
  emergencyContactRelationship?: string;

  @IsOptional()
  @IsString()
  directBossId?: string | null;

  @IsEmail()
  businessEmail!: string;

  @IsString()
  position!: string;

  @IsNumber()
  @Min(0)
  salary!: number;
}
