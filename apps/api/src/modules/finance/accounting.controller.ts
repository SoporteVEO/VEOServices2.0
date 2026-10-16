import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RequiredSubRoles } from '../auth/decorators.js';
import { AccountingService } from './accounting.service.js';
import {
  CreateEntryDto,
  ListAccountsQueryDto,
  ListCostCentersQueryDto,
  ListEntriesQueryDto,
  UpsertEntryLineDto,
} from './dto/accounting.dto.js';
import { ACCOUNTING_SUB_ROLE, FINANCE_SUB_ROLE } from './finance.constants.js';

/** Finanzas → Contabilidad: chart of accounts and journal entries in Brilo. */
@Controller('finance/accounting')
@RequiredSubRoles(ACCOUNTING_SUB_ROLE)
export class AccountingController {
  constructor(private readonly accounting: AccountingService) {}

  @Get('accounts')
  listAccounts(@Query() query: ListAccountsQueryDto) {
    return this.accounting.listAccounts(query);
  }

  @Get('cost-centers')
  @RequiredSubRoles(ACCOUNTING_SUB_ROLE, FINANCE_SUB_ROLE)
  listCostCenters(@Query() query: ListCostCentersQueryDto) {
    return this.accounting.listCostCenters(query);
  }

  @Get('entry-types')
  async listEntryTypes() {
    const data = await this.accounting.listEntryTypes();
    return { data };
  }

  @Get('entries')
  listEntries(@Query() query: ListEntriesQueryDto) {
    return this.accounting.listEntries(query);
  }

  @Get('entries/:mpaId')
  async getEntry(@Param('mpaId', ParseIntPipe) mpaId: number) {
    const data = await this.accounting.getEntry(mpaId);
    return { data };
  }

  @Post('entries')
  async createEntry(@Body() dto: CreateEntryDto) {
    const data = await this.accounting.createEntry(dto);
    return { data };
  }

  @Post('entries/:mpaId/lines')
  async addLine(
    @Param('mpaId', ParseIntPipe) mpaId: number,
    @Body() dto: UpsertEntryLineDto,
  ) {
    const data = await this.accounting.addLine(mpaId, dto);
    return { data };
  }

  @Put('entries/:mpaId/lines/:dpaId')
  async updateLine(
    @Param('mpaId', ParseIntPipe) mpaId: number,
    @Param('dpaId', ParseIntPipe) dpaId: number,
    @Body() dto: UpsertEntryLineDto,
  ) {
    const data = await this.accounting.updateLine(mpaId, dpaId, dto);
    return { data };
  }

  @Delete('entries/:mpaId/lines/:dpaId')
  deleteLine(
    @Param('mpaId', ParseIntPipe) mpaId: number,
    @Param('dpaId', ParseIntPipe) dpaId: number,
  ) {
    return this.accounting.deleteLine(mpaId, dpaId);
  }
}
