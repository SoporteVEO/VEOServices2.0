import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  company?: string | null;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  contact?: string | null;
}
