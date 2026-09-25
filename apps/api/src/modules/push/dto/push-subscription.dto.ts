import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class PushSubscriptionKeysDto {
  @IsString()
  @MaxLength(255)
  p256dh!: string;

  @IsString()
  @MaxLength(255)
  auth!: string;
}

export class SavePushSubscriptionDto {
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  endpoint!: string;

  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys!: PushSubscriptionKeysDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  userAgent?: string;
}

export class RemovePushSubscriptionDto {
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  endpoint!: string;
}
