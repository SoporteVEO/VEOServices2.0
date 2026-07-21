import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class RecuperacionRowDto {
  @IsString()
  @MinLength(1)
  rowKey!: string;

  @IsISO8601()
  fechaAbono!: string;

  @IsNumber()
  @Min(0.000001)
  monto!: number;

  @IsString()
  @MinLength(1)
  tipoAbono!: string;

  @IsString()
  @MinLength(1)
  tipoFactura!: string;

  @IsString()
  @MinLength(1)
  numFactura!: string;

  @IsOptional()
  @IsString()
  bancoCodigo?: string | null;

  @IsOptional()
  @IsString()
  numDocAbono?: string | null;

  @IsOptional()
  @IsString()
  observaciones?: string | null;
}

export class ProcessRecuperacionesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecuperacionRowDto)
  rows!: RecuperacionRowDto[];
}
