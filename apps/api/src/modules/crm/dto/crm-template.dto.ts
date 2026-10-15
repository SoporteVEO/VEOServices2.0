import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string | null;

  @IsOptional()
  @IsBoolean()
  isShared?: boolean;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string | null;

  @IsOptional()
  @IsBoolean()
  isShared?: boolean;
}

export class TemplateContextQueryDto {
  @IsOptional()
  @IsUUID()
  dealId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  contactId?: string;
}

export class RenderTemplateDto {
  @IsString()
  @MaxLength(50000)
  body!: string;
}
