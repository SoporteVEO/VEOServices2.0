import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateAbsenceDto {
  @IsDateString()
  fromDate!: string;

  @IsDateString()
  toDate!: string;

  @IsString()
  @MinLength(1)
  reason!: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  images?: string[];
}
