import { IsEnum } from 'class-validator';

enum AbsenceStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class UpdateAbsenceStatusDto {
  @IsEnum(AbsenceStatus)
  status!: AbsenceStatus;
}
