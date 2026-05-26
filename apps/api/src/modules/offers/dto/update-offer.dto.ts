import { OfferStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateOfferDto {
  @IsEnum(OfferStatus)
  status!: OfferStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  briloMconId?: number;
}
