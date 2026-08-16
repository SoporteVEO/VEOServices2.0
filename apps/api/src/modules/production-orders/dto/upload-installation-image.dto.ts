import { IsString, MinLength } from 'class-validator';

export class UploadInstallationImageDto {
  @IsString()
  @MinLength(1)
  imageBase64!: string;
}
