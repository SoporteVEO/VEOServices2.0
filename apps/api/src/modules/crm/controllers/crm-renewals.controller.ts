import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser, RequiredSubRoles } from '../../auth/decorators.js';
import { CrmRenewalsService } from '../crm-renewals.service.js';
import { CRM_SUB_ROLE, type CrmAuthUser } from '../crm.constants.js';
import {
  CreateRenewalDealDto,
  ListRenewalsQueryDto,
} from '../dto/crm-renewal.dto.js';

@Controller('crm/renewals')
@RequiredSubRoles(CRM_SUB_ROLE)
export class CrmRenewalsController {
  constructor(private readonly renewals: CrmRenewalsService) {}

  @Get()
  async list(
    @Query() query: ListRenewalsQueryDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.renewals.list(query, user);
    return { data };
  }

  @Post('deals')
  async createDeal(
    @Body() dto: CreateRenewalDealDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.renewals.createDeal(dto, user);
    return { data };
  }
}
