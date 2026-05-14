import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTeamMemberCommentDto {
  @IsString()
  @MinLength(1)
  comment!: string;

  @IsBoolean()
  @IsOptional()
  showToUser?: boolean;
}
