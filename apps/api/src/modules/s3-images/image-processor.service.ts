import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

export interface ProcessedImage {
  buffer: Buffer;
  mimeType: 'image/webp';
  extension: 'webp';
  width: number;
  height: number;
  byteLength: number;
}

interface ToWebpOptions {
  maxDimension?: number;
  quality?: number;
}

const DEFAULT_MAX_DIMENSION = 1920;
const DEFAULT_QUALITY = 80;

interface ToPngOptions {
  maxDimension?: number;
}

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  /**
   * Converts an arbitrary image buffer (e.g. WebP from S3) to a PNG buffer.
   * Used to embed images in PDFs since pdfkit only supports JPG and PNG.
   */
  async toPng(
    input: Buffer,
    options: ToPngOptions = {},
  ): Promise<{ buffer: Buffer; width: number; height: number }> {
    const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;

    try {
      const { data, info } = await sharp(input, { failOn: 'truncated' })
        .rotate()
        .resize({
          width: maxDimension,
          height: maxDimension,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png({ compressionLevel: 7 })
        .toBuffer({ resolveWithObject: true });

      return {
        buffer: data,
        width: info.width,
        height: info.height,
      };
    } catch (err) {
      throw new BadRequestException(
        `No se pudo convertir la imagen a PNG: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async toWebp(
    input: Buffer,
    options: ToWebpOptions = {},
  ): Promise<ProcessedImage> {
    const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
    const quality = options.quality ?? DEFAULT_QUALITY;

    try {
      const pipeline = sharp(input, { failOn: 'truncated' })
        .rotate()
        .resize({
          width: maxDimension,
          height: maxDimension,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality, effort: 4 });

      const { data, info } = await pipeline.toBuffer({
        resolveWithObject: true,
      });

      this.logger.debug(
        `Encoded image to webp: ${info.width}x${info.height}, ${data.byteLength} bytes`,
      );

      return {
        buffer: data,
        mimeType: 'image/webp',
        extension: 'webp',
        width: info.width,
        height: info.height,
        byteLength: data.byteLength,
      };
    } catch (err) {
      throw new BadRequestException(
        `No se pudo procesar la imagen: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
