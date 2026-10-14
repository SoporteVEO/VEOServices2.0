import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser, RequiredSubRoles } from '../auth/decorators.js';
import {
  CampaignInputDto,
  CreateScreenDto,
  CreateSublistDto,
  DeleteCampaignsDto,
  IngestOrderDto,
  ListLogsQueryDto,
  MoveCampaignDto,
  SetCampaignPauseDto,
  UpdateCampaignDto,
  UpdatePantallasSettingsDto,
  UpdateScreenDto,
  UpdateSublistDto,
} from './dto/pantallas.dto.js';
import type { PantallasActor } from './pantallas-log.js';
import { PantallasService } from './pantallas.service.js';

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
 * Pantallas (DOOH). Soporte Comercial reads everything; only Producción
 * changes the playlists.
 */
@Controller('pantallas')
@RequiredSubRoles(PRODUCCION, COMERCIAL)
export class PantallasController {
  constructor(private readonly service: PantallasService) {}

  @Get('board')
  async board() {
    const data = await this.service.getBoard();
    return { data };
  }

  @Get('logs')
  async logs(@Query() query: ListLogsQueryDto) {
    const data = await this.service.listLogs(query);
    return { data };
  }

  @Delete('logs')
  @RequiredSubRoles(PRODUCCION)
  async clearLogs() {
    const data = await this.service.clearLogs();
    return { data };
  }

  @Patch('settings')
  @RequiredSubRoles(PRODUCCION)
  async updateSettings(@Body() dto: UpdatePantallasSettingsDto) {
    const data = await this.service.updateSettings(dto);
    return { data };
  }

  @Post('screens')
  @RequiredSubRoles(PRODUCCION)
  async createScreen(@Body() dto: CreateScreenDto) {
    const data = await this.service.createScreen(dto);
    return { data };
  }

  @Patch('screens/:id')
  @RequiredSubRoles(PRODUCCION)
  async updateScreen(@Param('id') id: string, @Body() dto: UpdateScreenDto) {
    const data = await this.service.updateScreen(id, dto);
    return { data };
  }

  @Post('screens/:id/sublists')
  @RequiredSubRoles(PRODUCCION)
  async createSublist(
    @Param('id') screenId: string,
    @Body() dto: CreateSublistDto,
  ) {
    const data = await this.service.createSublist(screenId, dto);
    return { data };
  }

  @Patch('sublists/:id')
  @RequiredSubRoles(PRODUCCION)
  async updateSublist(@Param('id') id: string, @Body() dto: UpdateSublistDto) {
    const data = await this.service.updateSublist(id, dto);
    return { data };
  }

  @Delete('sublists/:id')
  @RequiredSubRoles(PRODUCCION)
  async deleteSublist(@Param('id') id: string) {
    const data = await this.service.deleteSublist(id);
    return { data };
  }

  @Post('sublists/:id/campaigns')
  @RequiredSubRoles(PRODUCCION)
  async createCampaign(
    @Param('id') sublistId: string,
    @Body() dto: CampaignInputDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.createCampaign(
      sublistId,
      dto,
      actorOf(user),
    );
    return { data };
  }

  @Patch('campaigns/:id')
  @RequiredSubRoles(PRODUCCION)
  async updateCampaign(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.updateCampaign(id, dto, actorOf(user));
    return { data };
  }

  @Patch('campaigns/:id/pause')
  @RequiredSubRoles(PRODUCCION)
  async setPause(
    @Param('id') id: string,
    @Body() dto: SetCampaignPauseDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.setPause(id, dto, actorOf(user));
    return { data };
  }

  @Patch('campaigns/:id/move')
  @RequiredSubRoles(PRODUCCION)
  async moveCampaign(
    @Param('id') id: string,
    @Body() dto: MoveCampaignDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.moveCampaign(id, dto, actorOf(user));
    return { data };
  }

  @Post('campaigns/delete')
  @RequiredSubRoles(PRODUCCION)
  async deleteCampaigns(
    @Body() dto: DeleteCampaignsDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.deleteCampaigns(dto, actorOf(user));
    return { data };
  }

  @Post('orders')
  @RequiredSubRoles(PRODUCCION)
  async ingestOrder(
    @Body() dto: IngestOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.ingestOrder(dto, actorOf(user));
    return { data };
  }
}
