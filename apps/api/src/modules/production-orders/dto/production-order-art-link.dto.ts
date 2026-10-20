import { IsString, IsUrl, MaxLength } from 'class-validator';

export class SetProductionOrderArtLinkDto {
  @IsString()
  @MaxLength(2000)
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'El enlace debe ser una URL válida (http o https)' },
  )
  url!: string;
}
