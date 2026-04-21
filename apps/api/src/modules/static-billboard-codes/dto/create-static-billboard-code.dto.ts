import { IsString, MinLength } from 'class-validator';

export class CreateStaticBillboardCodeDto {
  @IsString()
  @MinLength(1)
  code!: string;
}
