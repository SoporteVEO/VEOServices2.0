import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { CurrentUser, RequiredSubRoles } from '../auth/decorators.js';
import {
  ListFeatureRequestsQueryDto,
  UpdateFeatureRequestStatusDto,
} from './dto/feature-requests.dto.js';
import { DEVELOPER_SUB_ROLE } from './feature-requests.constants.js';
import { FeatureRequestsDevService } from './feature-requests-dev.service.js';

interface AuthUser {
  id: string;
}

@Controller('development/feature-requests')
@RequiredSubRoles(DEVELOPER_SUB_ROLE)
export class FeatureRequestsDevController {
  constructor(private readonly service: FeatureRequestsDevService) {}

  @Get()
  list(
    @Query() query: ListFeatureRequestsQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.list(query, user.id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeatureRequestStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.updateStatus(id, dto, {
      id: user.id,
      isDeveloper: true,
    });
    return { data };
  }
}
