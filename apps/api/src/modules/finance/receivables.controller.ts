import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RequiredSubRoles } from '../auth/decorators.js';
import {
  CreateAdvanceDto,
  CreateClientPaymentDto,
  CreateInvoicePaymentDto,
  ListBalancesQueryDto,
  ListCreditLimitsQueryDto,
  ListInvoicePaymentsQueryDto,
} from './dto/receivables.dto.js';
import { FINANCE_SUB_ROLE } from './finance.constants.js';
import { ReceivablesService } from './receivables.service.js';

/** Finanzas → Cuentas por cobrar: client balances, collections and advances. */
@Controller('finance/receivables')
@RequiredSubRoles(FINANCE_SUB_ROLE)
export class ReceivablesController {
  constructor(private readonly receivables: ReceivablesService) {}

  @Get('catalogs')
  async getCatalogs() {
    const data = await this.receivables.getCatalogs();
    return { data };
  }

  @Get('balances')
  listBalances(@Query() query: ListBalancesQueryDto) {
    return this.receivables.listBalances(query);
  }

  @Get('credit-limits')
  listCreditLimits(@Query() query: ListCreditLimitsQueryDto) {
    return this.receivables.listCreditLimits(query);
  }

  @Get('payments')
  listInvoicePayments(@Query() query: ListInvoicePaymentsQueryDto) {
    return this.receivables.listInvoicePayments(query);
  }

  @Post('invoice-payments')
  async createInvoicePayment(@Body() dto: CreateInvoicePaymentDto) {
    const data = await this.receivables.createInvoicePayment(dto);
    return { data };
  }

  @Post('client-payments')
  async createClientPayment(@Body() dto: CreateClientPaymentDto) {
    const data = await this.receivables.createClientPayment(dto);
    return { data };
  }

  @Post('advances')
  async createAdvance(@Body() dto: CreateAdvanceDto) {
    const data = await this.receivables.createAdvance(dto);
    return { data };
  }
}
