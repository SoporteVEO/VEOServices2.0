import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

export class CreatePatchNoteDto {
  @IsString()
  @Matches(VERSION_PATTERN, {
    message: 'La versión debe tener el formato 1.2.3',
  })
  version!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(10000)
  body!: string;
}

export class UpdatePatchNoteDto {
  @IsOptional()
  @IsString()
  @Matches(VERSION_PATTERN, {
    message: 'La versión debe tener el formato 1.2.3',
  })
  version?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(10000)
  body?: string;
}
