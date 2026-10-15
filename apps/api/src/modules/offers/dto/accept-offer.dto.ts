import { IsInt, IsOptional, Min } from 'class-validator';

/**
 * Offers with static billboards send the Brilo client and executive so VEO
 * creates the cotización and contrato; any other offer links an existing
 * Brilo contract by `briloMconId`.
 */
export class AcceptOfferDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  briloMconId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  briloCliId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  briloEjecId?: number;
}
