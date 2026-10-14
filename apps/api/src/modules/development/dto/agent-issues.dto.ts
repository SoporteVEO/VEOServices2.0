import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { AgentIssueSeverity, AgentIssueStatus } from '@prisma/client';

const POSITIVE_INT = /^[1-9]\d*$/;

export class ListAgentIssuesQueryDto {
  @IsOptional()
  @IsEnum(AgentIssueStatus)
  status?: AgentIssueStatus;

  @IsOptional()
  @IsEnum(AgentIssueSeverity)
  severity?: AgentIssueSeverity;

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

export class UpdateAgentIssueDto {
  @IsOptional()
  @IsEnum(AgentIssueStatus)
  status?: AgentIssueStatus;

  @IsOptional()
  @IsEnum(AgentIssueSeverity)
  severity?: AgentIssueSeverity;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(4000)
  resolutionNotes?: string | null;
}
