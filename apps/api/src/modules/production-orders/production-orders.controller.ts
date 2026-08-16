import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ProductionOrderStatus } from '@prisma/client';
import { CurrentUser, RequiredSubRoles } from '../auth/decorators.js';
import { resolveTargetUserId } from '../auth/view-as.helper.js';
import { UpdateProductionOrderItemAssignmentDto } from './dto/update-production-order-item-assignment.dto.js';
import { UpdateProductionOrderItemStatusDto } from './dto/update-production-order-item-status.dto.js';
import { UploadProductionOrderDocumentDto } from './dto/upload-production-order-document.dto.js';
import {
  ProductionDocumentKind,
  ProductionOrdersService,
} from './production-orders.service.js';

interface AuthUser {
  id: string;
  role?: string | null;
  subRoles?: string[] | null;
}

function parseStatusOrThrow(
  raw: string | undefined,
): ProductionOrderStatus | undefined {
  if (!raw) return undefined;
  if (!(raw in ProductionOrderStatus)) {
    throw new BadRequestException('status inválido');
  }
  return raw as ProductionOrderStatus;
}

function hasProductionSubRole(user: AuthUser): boolean {
  return (user.subRoles ?? []).includes('PRODUCTION');
}

@Controller('production-orders')
export class ProductionOrdersController {
  constructor(private readonly service: ProductionOrdersService) {}

  @Get('mine')
  async listMine(
    @CurrentUser() user: AuthUser,
    @Query('search') search?: string,
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string,
    @Query('status') statusStr?: string,
    @Query('viewAsUserId') viewAsUserId?: string,
  ) {
    const page = pageStr ? Number(pageStr) : undefined;
    const pageSize = pageSizeStr ? Number(pageSizeStr) : undefined;
    if (pageStr != null && (!Number.isFinite(page) || (page ?? 0) < 1)) {
      throw new BadRequestException('page debe ser un entero positivo');
    }
    if (
      pageSizeStr != null &&
      (!Number.isFinite(pageSize) || (pageSize ?? 0) < 1)
    ) {
      throw new BadRequestException('pageSize debe ser un entero positivo');
    }

    const targetUserId = resolveTargetUserId(user, viewAsUserId);
    return this.service.listMine(targetUserId, {
      search: search?.trim() || undefined,
      page,
      pageSize,
      status: parseStatusOrThrow(statusStr),
    });
  }

  @Get('installers')
  @RequiredSubRoles('PRODUCTION')
  async listInstallers() {
    const data = await this.service.listAssignableInstallers();
    return { data };
  }

  @Get()
  @RequiredSubRoles('PRODUCTION')
  async list(
    @Query('search') search?: string,
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string,
    @Query('status') statusStr?: string,
  ) {
    const page = pageStr ? Number(pageStr) : undefined;
    const pageSize = pageSizeStr ? Number(pageSizeStr) : undefined;
    if (pageStr != null && (!Number.isFinite(page) || (page ?? 0) < 1)) {
      throw new BadRequestException('page debe ser un entero positivo');
    }
    if (
      pageSizeStr != null &&
      (!Number.isFinite(pageSize) || (pageSize ?? 0) < 1)
    ) {
      throw new BadRequestException('pageSize debe ser un entero positivo');
    }

    return this.service.list({
      search: search?.trim() || undefined,
      page,
      pageSize,
      status: parseStatusOrThrow(statusStr),
    });
  }

  @Get(':id')
  async getOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Query('viewAsUserId') viewAsUserId?: string,
  ) {
    if (hasProductionSubRole(user)) {
      const data = await this.service.getById(id);
      return { data };
    }
    const targetUserId = resolveTargetUserId(user, viewAsUserId);
    const data = await this.service.getMineById(targetUserId, id);
    return { data };
  }

  @Patch('items/:itemId/production-document')
  async uploadProductionDocument(
    @Param('itemId') itemId: string,
    @Body() dto: UploadProductionOrderDocumentDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.uploadDocument(
      user.id,
      itemId,
      'PRODUCTION',
      dto.pdfBase64,
    );
    return { data };
  }

  @Delete('items/:itemId/production-document')
  async deleteProductionDocument(
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.deleteDocument(
      user.id,
      itemId,
      'PRODUCTION',
    );
    return { data };
  }

  @Patch('items/:itemId/design-document')
  async uploadDesignDocument(
    @Param('itemId') itemId: string,
    @Body() dto: UploadProductionOrderDocumentDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.uploadDocument(
      user.id,
      itemId,
      'DESIGN',
      dto.pdfBase64,
    );
    return { data };
  }

  @Delete('items/:itemId/design-document')
  async deleteDesignDocument(
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.deleteDocument(user.id, itemId, 'DESIGN');
    return { data };
  }

  @Get('items/:itemId/production-document/download-url')
  async getProductionDocumentUrl(
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.getDocumentUrl(itemId, user, 'PRODUCTION');
  }

  @Get('items/:itemId/design-document/download-url')
  async getDesignDocumentUrl(
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.getDocumentUrl(itemId, user, 'DESIGN');
  }

  @Patch('items/:itemId/status')
  @RequiredSubRoles('PRODUCTION')
  async updateItemStatus(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateProductionOrderItemStatusDto,
  ) {
    const data = await this.service.updateItemStatus(itemId, dto.status);
    return { data };
  }

  @Patch('items/:itemId/assignment')
  @RequiredSubRoles('PRODUCTION')
  async updateItemAssignment(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateProductionOrderItemAssignmentDto,
  ) {
    const data = await this.service.updateItemAssignment(itemId, dto);
    return { data };
  }

  private getDocumentUrl(
    itemId: string,
    user: AuthUser,
    kind: ProductionDocumentKind,
  ) {
    // Production users can preview any document; everyone else must own it.
    if (hasProductionSubRole(user)) {
      return this.service.getDocumentDownloadUrl(itemId, kind, {
        requireOwnership: false,
      });
    }
    return this.service.getDocumentDownloadUrl(itemId, kind, {
      userId: user.id,
      requireOwnership: true,
    });
  }
}
