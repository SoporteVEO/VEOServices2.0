import { IsString, MinLength } from 'class-validator';

export class UploadProductionOrderDocumentDto {
  @IsString()
  @MinLength(1)
  pdfBase64!: string;
}
