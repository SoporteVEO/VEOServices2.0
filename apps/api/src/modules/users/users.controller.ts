import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequiredSubRoles } from '../auth/decorators.js';

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
