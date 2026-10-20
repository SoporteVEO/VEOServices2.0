import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, RequiredSubRoles } from '../auth/decorators.js';
import { IngestOrderDto } from './dto/pantallas.dto.js';
import {
  ReturnDigitalOrderDto,
  SaveDigitalOrderDto,
} from './dto/pantallas-orders.dto.js';
import type { PantallasActor } from './pantallas-log.js';
import { PantallasOrdersService } from './pantallas-orders.service.js';

const PRODUCCION = 'PANTALLAS_PRODUCCION';
const COMERCIAL = 'PANTALLAS_COMERCIAL';

interface AuthUser {
  id: string;
  name?: string | null;
}

function actorOf(user: AuthUser): PantallasActor {
  return { id: user.id, name: user.name ?? null };
}

/**
 * OP queue: Soporte Comercial creates and corrects them, Producción ingests
 * them into the playlists or returns them with a reason.
 */
@Controller('pantallas/ops')
@RequiredSubRoles(PRODUCCION, COMERCIAL)
export class PantallasOrdersController {
  constructor(private readonly service: PantallasOrdersService) {}

  @Get()
  async list() {
    const data = await this.service.list();
    return { data };
  }

  @Post()
  @RequiredSubRoles(COMERCIAL)
  async create(
    @Body() dto: SaveDigitalOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.create(dto, actorOf(user));
    return { data };
  }

  @Patch(':id')
  @RequiredSubRoles(COMERCIAL)
  async update(
    @Param('id') id: string,
    @Body() dto: SaveDigitalOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.update(id, dto, actorOf(user));
    return { data };
  }

  @Post(':id/ingest')
  @RequiredSubRoles(PRODUCCION)
  async ingest(
    @Param('id') id: string,
    @Body() dto: IngestOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.ingest(id, dto, actorOf(user));
    return { data };
  }

  @Post(':id/return')
  @RequiredSubRoles(PRODUCCION)
  async returnOrder(
    @Param('id') id: string,
    @Body() dto: ReturnDigitalOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.returnOrder(id, dto, actorOf(user));
    return { data };
  }
}
