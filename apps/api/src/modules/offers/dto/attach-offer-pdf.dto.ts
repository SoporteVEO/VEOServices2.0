import { IsString, MinLength } from 'class-validator';

export class AttachOfferPdfDto {
  @IsString()
  @MinLength(1)
  pdfBase64!: string;
}
