import {
  IsEmail,
  IsInt,
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

  @IsEmail()
  businessEmail!: string;

  @IsString()
  position!: string;

  @IsNumber()
  @Min(0)
  salary!: number;

  @IsInt()
  @Min(0)
  vacations!: number;

  @IsInt()
  @Min(0)
  usedVacations!: number;
}
