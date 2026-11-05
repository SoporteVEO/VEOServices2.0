import { MentorshipStartOutcome } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MENTORSHIP_TEXT_MAX_LENGTH } from '../mentorships.constants.js';

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DAY_MESSAGE = 'La fecha debe tener el formato AAAA-MM-DD';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

function RequiredText(): PropertyDecorator {
  return (target, key) => {
    Transform(trim)(target, key);
    IsString()(target, key);
    IsNotEmpty({ message: 'Este campo es obligatorio' })(target, key);
    MaxLength(MENTORSHIP_TEXT_MAX_LENGTH)(target, key);
  };
}

export class KssItemDto {
  @RequiredText()
  what!: string;

  @RequiredText()
  how!: string;

  @RequiredText()
  when!: string;

  @RequiredText()
  indicator!: string;
}

export class CreateMentorshipSessionDto {
  @IsString()
  @IsNotEmpty()
  collaboratorId!: string;

  @Matches(ISO_DAY, { message: ISO_DAY_MESSAGE })
  sessionDate!: string;

  @Matches(ISO_DAY, { message: ISO_DAY_MESSAGE })
  nextFollowUpDate!: string;

  @IsOptional()
  @IsEnum(MentorshipStartOutcome)
  previousStartOutcome?: MentorshipStartOutcome;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(MENTORSHIP_TEXT_MAX_LENGTH)
  previousStartEvidence?: string;

  @ValidateNested()
  @Type(() => KssItemDto)
  keep!: KssItemDto;

  @ValidateNested()
  @Type(() => KssItemDto)
  stop!: KssItemDto;

  @ValidateNested()
  @Type(() => KssItemDto)
  start!: KssItemDto;

  @RequiredText()
  commitment!: string;
}

export class UpdateMentorshipSessionDto {
  @IsOptional()
  @Matches(ISO_DAY, { message: ISO_DAY_MESSAGE })
  sessionDate?: string;

  @IsOptional()
  @Matches(ISO_DAY, { message: ISO_DAY_MESSAGE })
  nextFollowUpDate?: string;

  @IsOptional()
  @IsEnum(MentorshipStartOutcome)
  previousStartOutcome?: MentorshipStartOutcome;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(MENTORSHIP_TEXT_MAX_LENGTH)
  previousStartEvidence?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => KssItemDto)
  keep?: KssItemDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => KssItemDto)
  stop?: KssItemDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => KssItemDto)
  start?: KssItemDto;

  @IsOptional()
  @RequiredText()
  commitment?: string;

  /** Required when Talento Humano corrects a session already confirmed. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(MENTORSHIP_TEXT_MAX_LENGTH)
  reason?: string;
}

export class AcknowledgeMentorshipSessionDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(MENTORSHIP_TEXT_MAX_LENGTH)
  comment?: string;
}

export class MentorshipQuarterQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-Q[1-4]$/, { message: 'Trimestre inválido (AAAA-QN)' })
  quarter?: string;
}
