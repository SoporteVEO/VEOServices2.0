import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  CurrentUser,
  RequiredRoles,
  RequiredSubRoles,
} from '../auth/decorators.js';

interface AuthUser {
  id: string;
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

@RequiredSubRoles('USERS_MANAGEMENT')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const created = await this.usersService.create(dto);
    return { data: created };
  }

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return { data: users };
  }

  // Lightweight lookup available to any admin so they can pick a user to
  // impersonate in flows like "view as" inside Mi Espacio, or filter admin
  // analytics dashboards. The empty RequiredSubRoles override clears the
  // class-level USERS_MANAGEMENT requirement on this method.
  @RequiredSubRoles()
  @RequiredRoles('ADMIN')
  @Get('lookup')
  async lookup(
    @CurrentUser() user: AuthUser,
    @Query('includeSelf') includeSelfRaw?: string,
  ) {
    const includeSelf = parseBoolean(includeSelfRaw);
    const users = await this.usersService.findLookup(user.id, { includeSelf });
    return { data: users };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const found = await this.usersService.findOne(id);
    return { data: found };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const updated = await this.usersService.update(id, dto);
    return { data: updated };
  }

  @Post(':id/force-logout')
  @HttpCode(200)
  async forceLogout(@Param('id') id: string) {
    const result = await this.usersService.forceLogout(id);
    return { data: result };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
