import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  AgentFeedbackRating,
  AgentFeedbackReview,
  AgentLearningStatus,
} from '@prisma/client';

const POSITIVE_INT = /^[1-9]\d*$/;

export class ListAgentLearningsQueryDto {
  @IsOptional()
  @IsEnum(AgentLearningStatus)
  status?: AgentLearningStatus;

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

export class CreateAgentLearningDto {
  @IsString()
  @MinLength(10)
  @MaxLength(600)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  example?: string;
}

export class UpdateAgentLearningDto {
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(600)
  content?: string;

  @IsOptional()
  @IsEnum(AgentLearningStatus)
  status?: AgentLearningStatus;
}

export class ListAgentFeedbackQueryDto {
  @IsOptional()
  @IsEnum(AgentFeedbackRating)
  rating?: AgentFeedbackRating;

  @IsOptional()
  @IsEnum(AgentFeedbackReview)
  review?: AgentFeedbackReview;

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

export class ReviewAgentFeedbackDto {
  @IsEnum(AgentFeedbackReview)
  review!: AgentFeedbackReview;
}
