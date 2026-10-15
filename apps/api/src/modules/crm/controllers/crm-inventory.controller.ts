import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser, RequiredSubRoles } from '../../auth/decorators.js';
import { CrmDealExecutionService } from '../crm-deal-execution.service.js';
import { CrmDealSitesService } from '../crm-deal-sites.service.js';
import { CrmInventoryService } from '../crm-inventory.service.js';
import { CRM_SUB_ROLE, type CrmAuthUser } from '../crm.constants.js';
import {
  AddDealSitesDto,
  DealSitesActionDto,
  InventoryQueryDto,
  UpdateDealSiteDto,
} from '../dto/crm-inventory.dto.js';

@Controller('crm')
@RequiredSubRoles(CRM_SUB_ROLE)
export class CrmInventoryController {
  constructor(
    private readonly inventory: CrmInventoryService,
    private readonly sites: CrmDealSitesService,
    private readonly execution: CrmDealExecutionService,
  ) {}

  @Get('inventory')
  async search(@Query() query: InventoryQueryDto) {
    const data = await this.inventory.search(query);
    return { data };
  }

  @Get('deals/:id/sites')
  async list(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.sites.list(id);
    return { data };
  }

  @Post('deals/:id/sites')
  async add(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddDealSitesDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.sites.add(id, dto, user);
    return { data };
  }

  @Post('deals/:id/sites/actions')
  async action(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DealSitesActionDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.sites.action(id, dto, user);
    return { data };
  }

  @Patch('deals/:id/sites/:siteId')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: UpdateDealSiteDto,
  ) {
    const data = await this.sites.update(id, siteId, dto);
    return { data };
  }

  @Get('deals/:id/execution')
  async getExecution(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.execution.get(id);
    return { data };
  }
}
