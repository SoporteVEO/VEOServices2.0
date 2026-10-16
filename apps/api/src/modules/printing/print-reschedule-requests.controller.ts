import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, RequiredSubRoles } from '../auth/decorators.js';
import {
  CreatePrintRescheduleRequestDto,
  ResolvePrintRescheduleRequestDto,
} from './dto/print-reschedule-request.dto.js';
import { PrintRescheduleRequestsService } from './print-reschedule-requests.service.js';

interface AuthUser {
  id: string;
}

@Controller('print-reschedule-requests')
export class PrintRescheduleRequestsController {
  constructor(private readonly service: PrintRescheduleRequestsService) {}

  @Get()
  @RequiredSubRoles('PRODUCTION')
  async listPending() {
    const data = await this.service.listPending();
    return { data };
  }

  @Post()
  async create(
    @Body() dto: CreatePrintRescheduleRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.create(user.id, dto);
    return { data };
  }

  @Patch(':id/cancel')
  async cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.service.cancel(user.id, id);
    return { data };
  }

  @Patch(':id/resolve')
  @RequiredSubRoles('PRODUCTION')
  async resolve(
    @Param('id') id: string,
    @Body() dto: ResolvePrintRescheduleRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.resolve(user.id, id, dto);
    return { data };
  }
}
