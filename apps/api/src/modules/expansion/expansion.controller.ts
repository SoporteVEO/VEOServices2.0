import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser, RequiredSubRoles } from '../auth/decorators.js';
import {
  AddExpansionCommentDto,
  AttachExpansionDocumentDto,
  CreateExpansionDocumentUploadDto,
  CreateExpansionSiteDto,
  ExpansionNexoInsightDto,
  ExpansionPeriodQueryDto,
  LocationContextQueryDto,
  UpdateBillboardCostDto,
  UpdateExpansionSiteDto,
} from './dto/expansion.dto.js';
import { ExpansionBillboardsService } from './expansion-billboards.service.js';
import { ExpansionLocationService } from './expansion-location.service.js';
import { ExpansionNexoService } from './expansion-nexo.service.js';
import { ExpansionSitesService } from './expansion-sites.service.js';
import { EXPANSION_SUB_ROLE } from './expansion.constants.js';

interface AuthUser {
  id: string;
}

/**
 * Expansión · Sitios: the billboard network rated by rentabilidad, plus the
 * planned locations the team is evaluating for new billboards.
 */
@Controller('expansion')
@RequiredSubRoles(EXPANSION_SUB_ROLE)
export class ExpansionController {
  constructor(
    private readonly billboards: ExpansionBillboardsService,
    private readonly sites: ExpansionSitesService,
    private readonly location: ExpansionLocationService,
    private readonly nexo: ExpansionNexoService,
  ) {}

  @Get('billboards')
  async listBillboards(@Query() query: ExpansionPeriodQueryDto) {
    return { data: await this.billboards.list(query.year) };
  }

  @Get('billboards/:billboardId')
  async getBillboard(
    @Param('billboardId', ParseIntPipe) billboardId: number,
    @Query() query: ExpansionPeriodQueryDto,
  ) {
    return { data: await this.billboards.detail(billboardId, query.year) };
  }

  @Put('billboards/:billboardId/cost')
  async updateBillboardCost(
    @Param('billboardId', ParseIntPipe) billboardId: number,
    @Body() dto: UpdateBillboardCostDto,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      data: await this.billboards.updateCost(billboardId, dto, user.id),
    };
  }

  @Get('location-context')
  async getLocationContext(@Query() query: LocationContextQueryDto) {
    return {
      data: await this.location.tryGetContext(
        Number(query.latitude),
        Number(query.longitude),
      ),
    };
  }

  @Post('nexo-insight')
  async nexoInsight(
    @Body() dto: ExpansionNexoInsightDto,
    @CurrentUser() user: AuthUser,
  ) {
    return { data: await this.nexo.insight(user.id, dto) };
  }

  @Post('sites/:id/context')
  async refreshSiteContext(@Param('id', ParseUUIDPipe) id: string) {
    return { data: await this.sites.refreshContext(id) };
  }

  @Get('sites')
  async listSites() {
    return { data: await this.sites.list() };
  }

  @Get('sites/:id')
  async getSite(@Param('id', ParseUUIDPipe) id: string) {
    return { data: await this.sites.detail(id) };
  }

  @Post('sites')
  async createSite(
    @Body() dto: CreateExpansionSiteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return { data: await this.sites.create(dto, user.id) };
  }

  @Patch('sites/:id')
  async updateSite(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpansionSiteDto,
  ) {
    return { data: await this.sites.update(id, dto) };
  }

  @Delete('sites/:id')
  async removeSite(@Param('id', ParseUUIDPipe) id: string) {
    return this.sites.remove(id);
  }

  @Post('sites/:id/comments')
  async addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddExpansionCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return { data: await this.sites.addComment(id, user.id, dto.body) };
  }

  @Post('sites/:id/documents/upload-url')
  async createDocumentUploadUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateExpansionDocumentUploadDto,
  ) {
    return { data: await this.sites.createDocumentUploadUrl(id, dto) };
  }

  @Post('sites/:id/documents')
  async attachDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AttachExpansionDocumentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return { data: await this.sites.attachDocument(id, user.id, dto) };
  }

  @Get('documents/:documentId/url')
  getDocumentUrl(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Query('download') download?: string,
  ) {
    return this.sites.getDocumentUrl(documentId, download === 'true');
  }

  @Delete('documents/:documentId')
  async removeDocument(@Param('documentId', ParseUUIDPipe) documentId: string) {
    return { data: await this.sites.removeDocument(documentId) };
  }
}
