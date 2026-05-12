import { Injectable, Logger } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface S3UploadResult {
  key: string;
}

export interface UploadBufferInput {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  folder?: string;
}

const DEFAULT_SIGNED_URL_EXPIRES = 60 * 60 * 24 * 7;

@Injectable()
export class S3StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const region = process.env.S3_REGION;
    const endpoint = process.env.S3_ENDPOINT;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    const bucket = process.env.S3_BUCKET;

    if (!region || !endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        'S3 storage is not configured: missing S3_REGION, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY or S3_BUCKET',
      );
    }

    this.bucket = bucket;
    this.client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }

  async uploadBuffer(input: UploadBufferInput): Promise<S3UploadResult> {
    const folder = input.folder ?? 'uploads';
    const key = `${folder}/${crypto.randomUUID()}.${input.extension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimeType,
      }),
    );

    return { key };
  }

  async getSignedUrl(
    key: string,
    expiresIn: number = DEFAULT_SIGNED_URL_EXPIRES,
  ): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }

  async getObjectBuffer(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!response.Body) {
      throw new Error(`S3 object ${key} returned no body`);
    }
    const stream = response.Body as NodeJS.ReadableStream;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async deleteByKey(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (err) {
      this.logger.warn(`Failed to delete S3 object ${key}: ${String(err)}`);
    }
  }
}
