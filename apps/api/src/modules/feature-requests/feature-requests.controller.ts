import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  AllowFieldRoles,
  AllowLimited,
  CurrentUser,
} from '../auth/decorators.js';
import { IMAGES_MODULE_ROLES } from '../auth/field-roles.js';
import {
  AddCollaboratorDto,
  CreateFeatureRequestDto,
  ReportProblemDto,
  SignFeatureRequestDto,
} from './dto/feature-requests.dto.js';
import { FeatureRequestSignaturesService } from './feature-request-signatures.service.js';
import type { FeatureRequestViewer } from './feature-request.selects.js';
import { DEVELOPER_SUB_ROLE } from './feature-requests.constants.js';
import { FeatureRequestsService } from './feature-requests.service.js';

interface AuthUser {
  id: string;
  subRoles?: string[] | null;
}

function toViewer(user: AuthUser): FeatureRequestViewer {
  return {
    id: user.id,
    isDeveloper: (user.subRoles ?? []).includes(DEVELOPER_SUB_ROLE),
  };
}

function clientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
    ?.split(',')[0]
    ?.trim();
  return first || req.ip;
}

@AllowLimited()
@AllowFieldRoles(...IMAGES_MODULE_ROLES)
@Controller('feature-requests')
export class FeatureRequestsController {
  constructor(
    private readonly service: FeatureRequestsService,
    private readonly signatures: FeatureRequestSignaturesService,
  ) {}

  @Get()
  async listMine(@CurrentUser() user: AuthUser) {
    return { data: await this.service.listMine(user.id) };
  }

  @Get('collaborator-options')
  async collaboratorOptions(@CurrentUser() user: AuthUser) {
    return { data: await this.service.listCollaboratorOptions(user.id) };
  }

  @Post('upload-url')
  async createUploadUrl() {
    return { data: await this.service.createUploadUrl() };
  }

  @Post()
  async create(
    @Body() dto: CreateFeatureRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return { data: await this.service.create(toViewer(user), dto) };
  }

  @Get(':id')
  async getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return { data: await this.service.getDetail(id, toViewer(user)) };
  }

  @Get(':id/attachment-url')
  getAttachmentUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Query('download') download?: string,
  ) {
    return this.service.getAttachmentUrl(
      id,
      toViewer(user),
      download === 'true',
    );
  }

  @Post(':id/collaborators')
  async addCollaborator(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCollaboratorDto,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      data: await this.service.addCollaborator(id, toViewer(user), dto.userId),
    };
  }

  @Delete(':id/collaborators/:userId')
  async removeCollaborator(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      data: await this.service.removeCollaborator(id, toViewer(user), userId),
    };
  }

  @Post(':id/signature')
  async sign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SignFeatureRequestDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Headers('user-agent') userAgent?: string,
  ) {
    return {
      data: await this.signatures.sign(id, toViewer(user), dto, {
        ipAddress: clientIp(req),
        userAgent,
      }),
    };
  }

  @Post(':id/report-problem')
  async reportProblem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReportProblemDto,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      data: await this.signatures.reportProblem(id, toViewer(user), dto),
    };
  }
}
