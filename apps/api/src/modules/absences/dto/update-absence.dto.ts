import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateAbsenceDto {
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @IsDateString()
  @IsOptional()
  toDate?: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  reason?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  removedImageIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  addedImages?: string[];
}
