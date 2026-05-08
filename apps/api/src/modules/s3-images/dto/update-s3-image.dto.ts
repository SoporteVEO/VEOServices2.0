import { IsOptional, IsString } from 'class-validator';

export class UpdateS3ImageDto {
  @IsString()
  @IsOptional()
  staticBillboardCodeId?: string | null;
}
