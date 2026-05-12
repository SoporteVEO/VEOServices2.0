import {
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateTeamMemberDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  businessEmail?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  salary?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  vacations?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  usedVacations?: number;
}
