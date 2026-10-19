import { FeatureRequestPriority, FeatureRequestStatus } from '@prisma/client';
import {
  ArrayMaxSize,
  Equals,
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  FEATURE_REQUEST_FILE_KEY_REGEX,
  MAX_COLLABORATORS,
} from '../feature-requests.constants.js';

const POSITIVE_INT = /^[1-9]\d*$/;

export const DEV_SETTABLE_STATUSES = [
  FeatureRequestStatus.IN_REVIEW,
  FeatureRequestStatus.IN_PROGRESS,
  FeatureRequestStatus.COMPLETED,
  FeatureRequestStatus.REJECTED,
] as const;

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
