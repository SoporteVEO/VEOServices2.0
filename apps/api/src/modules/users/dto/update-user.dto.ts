import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
  LIMITED = 'LIMITED',
}

enum SubRole {
  HR = 'HR',
  USERS_MANAGEMENT = 'USERS_MANAGEMENT',
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsArray()
  @IsEnum(SubRole, { each: true })
  @ArrayUnique()
  @IsOptional()
  subRoles?: SubRole[];
}
