import { IsInt, Min } from 'class-validator';

export class AcceptOfferDto {
  @IsInt()
  @Min(1)
  briloMconId!: number;
}
