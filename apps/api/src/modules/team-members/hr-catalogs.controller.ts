import { Body, Controller, Get, Post } from '@nestjs/common';
import { RequiredSubRoles } from '../auth/decorators.js';
import { CreateHrCatalogEntryDto } from './dto/create-hr-catalog-entry.dto.js';
import { HrCatalogsService } from './hr-catalogs.service.js';

@RequiredSubRoles('HR')
@Controller('hr-catalogs')
export class HrCatalogsController {
  constructor(private readonly catalogs: HrCatalogsService) {}

  @Get('departments')
  async listDepartments() {
    return { data: await this.catalogs.list('departments') };
  }

  @Post('departments')
  async createDepartment(@Body() dto: CreateHrCatalogEntryDto) {
    return { data: await this.catalogs.create('departments', dto.name) };
  }

  @Get('positions')
  async listPositions() {
    return { data: await this.catalogs.list('positions') };
  }

  @Post('positions')
  async createPosition(@Body() dto: CreateHrCatalogEntryDto) {
    return { data: await this.catalogs.create('positions', dto.name) };
  }
}
