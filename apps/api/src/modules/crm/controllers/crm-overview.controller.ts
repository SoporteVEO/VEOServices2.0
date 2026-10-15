import { Controller, Get, Param, Query } from '@nestjs/common';
import { CurrentUser, RequiredSubRoles } from '../../auth/decorators.js';
import { CrmClientsService } from '../crm-clients.service.js';
import { CrmDashboardService } from '../crm-dashboard.service.js';
import { CRM_SUB_ROLE, type CrmAuthUser } from '../crm.constants.js';

@Controller('crm')
@RequiredSubRoles(CRM_SUB_ROLE)
export class CrmOverviewController {
  constructor(
    private readonly dashboard: CrmDashboardService,
    private readonly clients: CrmClientsService,
  ) {}

  @Get('dashboard')
  async overview(
    @CurrentUser() user: CrmAuthUser,
    @Query('scope') scope?: string,
    @Query('pipelineId') pipelineId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const data = await this.dashboard.overview(user.id, {
      scope,
      pipelineId,
      from,
      to,
    });
    return { data };
  }

  @Get('team')
  async team() {
    const data = await this.dashboard.team();
    return { data };
  }

  @Get('clients')
  async listClients(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('withOpenDeals') withOpenDeals?: string,
  ) {
    return this.clients.list({ search, page, pageSize, withOpenDeals });
  }

  @Get('clients/:id/summary')
  async clientSummary(@Param('id') id: string) {
    const data = await this.clients.summary(id);
    return { data };
  }
}
