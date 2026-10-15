import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ConnectWhatsAppDto {
  @IsString()
  @Matches(/^\d{6,30}$/, { message: 'El Phone Number ID debe ser numérico' })
  phoneNumberId!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(1000)
  accessToken!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{6,30}$/, {
    message: 'El WhatsApp Business Account ID debe ser numérico',
  })
  businessAccountId?: string;
}

export class UpdateEmailSignatureDto {
  @IsString()
  @MaxLength(4000)
  signature!: string;
}
