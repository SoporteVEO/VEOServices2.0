import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RequiredSubRoles } from '../auth/decorators.js';
import { BanksService } from './banks.service.js';
import {
  CreateBankChargeDto,
  CreateBankDepositDto,
  ListBankMovementsQueryDto,
} from './dto/banks.dto.js';
import { FINANCE_SUB_ROLE } from './finance.constants.js';

/** Finanzas → Bancos: bank accounts and their deposits (abonos) and charges (cargos). */
@Controller('finance/banks')
@RequiredSubRoles(FINANCE_SUB_ROLE)
export class BanksController {
  constructor(private readonly banks: BanksService) {}

  @Get('catalogs')
  async getCatalogs() {
    const data = await this.banks.getCatalogs();
    return { data };
  }

  @Get('deposits')
  listDeposits(@Query() query: ListBankMovementsQueryDto) {
    return this.banks.listDeposits(query);
  }

  @Post('deposits')
  async createDeposit(@Body() dto: CreateBankDepositDto) {
    const data = await this.banks.createDeposit(dto);
    return { data };
  }

  @Delete('deposits/:abnId')
  deleteDeposit(@Param('abnId', ParseIntPipe) abnId: number) {
    return this.banks.deleteDeposit(abnId);
  }

  @Get('charges')
  listCharges(@Query() query: ListBankMovementsQueryDto) {
    return this.banks.listCharges(query);
  }

  @Post('charges')
  async createCharge(@Body() dto: CreateBankChargeDto) {
    const data = await this.banks.createCharge(dto);
    return { data };
  }

  @Delete('charges/:crgId')
  deleteCharge(@Param('crgId', ParseIntPipe) crgId: number) {
    return this.banks.deleteCharge(crgId);
  }
}
