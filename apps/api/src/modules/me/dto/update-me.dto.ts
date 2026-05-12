import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateMeDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;
}
