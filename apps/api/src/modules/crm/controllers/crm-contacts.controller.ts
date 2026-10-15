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
import { RequiredSubRoles } from '../../auth/decorators.js';
import { CrmContactsService } from '../crm-contacts.service.js';
import { CRM_SUB_ROLE } from '../crm.constants.js';
import {
  CreateContactDto,
  ListContactsQueryDto,
  UpdateContactDto,
} from '../dto/crm-contact.dto.js';

@Controller('crm/contacts')
@RequiredSubRoles(CRM_SUB_ROLE)
export class CrmContactsController {
  constructor(private readonly contacts: CrmContactsService) {}

  @Get()
  async list(@Query() query: ListContactsQueryDto) {
    return this.contacts.list(query);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const data = await this.contacts.get(id);
    return { data };
  }

  @Post()
  async create(@Body() dto: CreateContactDto) {
    const data = await this.contacts.create(dto);
    return { data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateContactDto) {
    const data = await this.contacts.update(id, dto);
    return { data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.contacts.remove(id);
  }
}
