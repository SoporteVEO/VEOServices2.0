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

export class CreateUserDto {
  @IsString()
  firstName!: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsArray()
  @IsEnum(SubRole, { each: true })
  @ArrayUnique()
  @IsOptional()
  subRoles?: SubRole[];
}
