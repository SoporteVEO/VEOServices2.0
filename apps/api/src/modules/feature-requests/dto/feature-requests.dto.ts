import { FeatureRequestPriority, FeatureRequestStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  Equals,
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  ATTACHMENT_FILE_NAME_REGEX,
  FEATURE_REQUEST_ATTACHMENT_KEY_REGEX,
  FEATURE_REQUEST_FILE_KEY_REGEX,
  MAX_ATTACHMENTS,
  MAX_COLLABORATORS,
} from '../feature-requests.constants.js';

const POSITIVE_INT = /^[1-9]\d*$/;

export const DEV_SETTABLE_STATUSES = [
  FeatureRequestStatus.IN_REVIEW,
  FeatureRequestStatus.IN_PROGRESS,
  FeatureRequestStatus.COMPLETED,
  FeatureRequestStatus.REJECTED,
] as const;

export class AttachmentUploadUrlDto {
  @IsString()
  @MaxLength(255)
  @Matches(ATTACHMENT_FILE_NAME_REGEX, {
    message: 'El archivo debe ser PDF, Excel o PowerPoint',
  })
  fileName!: string;
}

export class AttachmentDto extends AttachmentUploadUrlDto {
  @IsString()
  @Matches(FEATURE_REQUEST_ATTACHMENT_KEY_REGEX, {
    message: 'key debe ser una clave de archivo válida',
  })
  key!: string;
}

export class CreateFeatureRequestDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  summary!: string;

  @IsEnum(FeatureRequestPriority)
  priority!: FeatureRequestPriority;

  @IsString()
  @Matches(FEATURE_REQUEST_FILE_KEY_REGEX, {
    message: 'fileKey debe ser una clave de archivo válida',
  })
  fileKey!: string;

  @IsString()
  @MaxLength(255)
  @Matches(/\.pdf$/i, { message: 'El archivo debe ser un PDF' })
  fileName!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_COLLABORATORS)
  @IsString({ each: true })
  @MaxLength(128, { each: true })
  collaboratorIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ATTACHMENTS)
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

export class AddCollaboratorDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  userId!: string;
}

export class SignFeatureRequestDto {
  @IsString()
  @MaxLength(900_000)
  signatureImage!: string;

  @Equals(true, {
    message: 'Debes confirmar que la funcionalidad cumple lo solicitado',
  })
  accepted!: boolean;
}

export class ReportProblemDto {
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  message!: string;
}

export class UpdateFeatureRequestStatusDto {
  @IsIn(DEV_SETTABLE_STATUSES)
  status!: FeatureRequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}

export class UpdateFeatureRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  summary?: string;

  @IsOptional()
  @IsEnum(FeatureRequestPriority)
  priority?: FeatureRequestPriority;

  @IsOptional()
  @IsString()
  @Matches(FEATURE_REQUEST_FILE_KEY_REGEX, {
    message: 'fileKey debe ser una clave de archivo válida',
  })
  fileKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/\.pdf$/i, { message: 'El archivo debe ser un PDF' })
  fileName?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ATTACHMENTS)
  @IsUUID('all', { each: true })
  removeAttachmentIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ATTACHMENTS)
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

export class ListFeatureRequestsQueryDto {
  @IsOptional()
  @IsEnum(FeatureRequestStatus)
  status?: FeatureRequestStatus;

  @IsOptional()
  @IsEnum(FeatureRequestPriority)
  priority?: FeatureRequestPriority;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @Matches(POSITIVE_INT, { message: 'page debe ser un entero positivo' })
  page?: string;

  @IsOptional()
  @Matches(POSITIVE_INT, { message: 'pageSize debe ser un entero positivo' })
  pageSize?: string;
}
