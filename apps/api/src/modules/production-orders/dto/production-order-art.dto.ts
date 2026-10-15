import { IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import {
  PRODUCTION_ART_KEY_REGEX,
  PRODUCTION_ART_MIME_TYPES,
} from '../production-order-art.js';

const MIME_TYPE_MESSAGE =
  'Formato de arte no permitido (JPG, PNG, WEBP, TIFF o PDF)';

export class CreateProductionOrderArtUploadDto {
  @IsIn(PRODUCTION_ART_MIME_TYPES, { message: MIME_TYPE_MESSAGE })
  mimeType!: string;
}

export class AttachProductionOrderArtDto {
  @IsString()
  @Matches(PRODUCTION_ART_KEY_REGEX, {
    message: 'fileKey debe ser una clave de arte válida',
  })
  fileKey!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName!: string;

  @IsIn(PRODUCTION_ART_MIME_TYPES, { message: MIME_TYPE_MESSAGE })
  mimeType!: string;
}
