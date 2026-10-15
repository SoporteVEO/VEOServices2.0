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
import { CurrentUser, RequiredSubRoles } from '../../auth/decorators.js';
import { CrmDealsService } from '../crm-deals.service.js';
import { CRM_SUB_ROLE, type CrmAuthUser } from '../crm.constants.js';
import {
  ChangeDealStatusDto,
  CreateDealDto,
  CreateDealFromOfferDto,
  LinkOfferDto,
  ListDealsQueryDto,
  MoveDealDto,
  UpdateDealDto,
} from '../dto/crm-deal.dto.js';

@Controller('crm/deals')
@RequiredSubRoles(CRM_SUB_ROLE)
export class CrmDealsController {
  constructor(private readonly deals: CrmDealsService) {}

  @Get('board')
  async board(
    @Query() query: ListDealsQueryDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.deals.board(query, user);
    return { data };
  }

  @Get()
  async list(
    @Query() query: ListDealsQueryDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.deals.list(query, user);
    return { data };
  }

  @Post('from-offer')
  async createFromOffer(
    @Body() dto: CreateDealFromOfferDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.deals.createFromOffer(dto, user);
    return { data };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const data = await this.deals.get(id);
    return { data };
  }

  @Post()
  async create(@Body() dto: CreateDealDto, @CurrentUser() user: CrmAuthUser) {
    const data = await this.deals.create(dto, user);
    return { data };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDealDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.deals.update(id, dto, user);
    return { data };
  }

  @Patch(':id/move')
  async move(
    @Param('id') id: string,
    @Body() dto: MoveDealDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.deals.move(id, dto, user);
    return { data };
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeDealStatusDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.deals.changeStatus(id, dto, user);
    return { data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: CrmAuthUser) {
    return this.deals.remove(id, user);
  }

  @Get(':id/available-offers')
  async availableOffers(
    @Param('id') id: string,
    @Query('search') search?: string,
  ) {
    const data = await this.deals.availableOffers(id, search);
    return { data };
  }

  @Post(':id/offers')
  async linkOffer(
    @Param('id') id: string,
    @Body() dto: LinkOfferDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.deals.linkOffer(id, dto.offerId, user);
    return { data };
  }

  @Delete(':id/offers/:offerId')
  async unlinkOffer(
    @Param('id') id: string,
    @Param('offerId') offerId: string,
  ) {
    const data = await this.deals.unlinkOffer(id, offerId);
    return { data };
  }
}
