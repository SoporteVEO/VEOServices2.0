import { IsEnum } from 'class-validator';

enum UserNotificationStatus {
  PENDING = 'PENDING',
  VIEWED = 'VIEWED',
  DELETED = 'DELETED',
}

export class UpdateNotificationStatusDto {
  @IsEnum(UserNotificationStatus)
  status!: UserNotificationStatus;
}
