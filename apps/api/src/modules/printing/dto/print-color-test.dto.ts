import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreatePrintColorTestDto {
  @IsString()
  productionOrderItemId!: string;

  @IsInt()
  @Min(1)
  @Max(24 * 60)
  durationMinutes!: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @Length(0, 500)
  notes?: string | null;
}
