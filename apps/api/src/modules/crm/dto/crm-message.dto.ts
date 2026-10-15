import { CrmChannel } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

class MessageContextDto {
  @IsOptional()
  @IsUUID()
  dealId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  contactId?: string;
}

export class SendEmailDto extends MessageContextDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsEmail({}, { each: true })
  to!: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsEmail({}, { each: true })
  cc?: string[];

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  body!: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  /** Gmail thread to reply into. */
  @IsOptional()
  @IsString()
  threadId?: string;
}

export class WhatsAppTemplateDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(2)
  language!: string;

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  parameters!: string[];
}

export const WHATSAPP_SEND_MODES = ['API', 'MANUAL'] as const;
export type WhatsAppSendMode = (typeof WHATSAPP_SEND_MODES)[number];

export class SendWhatsAppDto extends MessageContextDto {
  @IsString()
  @MinLength(8)
  @MaxLength(30)
  to!: string;

  @IsIn(WHATSAPP_SEND_MODES)
  mode!: WhatsAppSendMode;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  body?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppTemplateDto)
  template?: WhatsAppTemplateDto;
}

export class ListMessagesQueryDto extends MessageContextDto {
  @IsOptional()
  @IsEnum(CrmChannel)
  channel?: CrmChannel;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class SyncEmailDto extends MessageContextDto {}
