import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { RequiredSubRoles } from '../auth/decorators.js';
import {
  ListInvoicesQueryDto,
  ListOrdersQueryDto,
  SendOrderEmailDto,
} from './dto/invoicing.dto.js';
import { INVOICING_SUB_ROLE } from './finance.constants.js';
import { InvoicingService } from './invoicing.service.js';

/** Finanzas → Facturación: sales invoices and billing orders (ODF) in Brilo. */
@Controller('finance/invoicing')
@RequiredSubRoles(INVOICING_SUB_ROLE)
export class InvoicingController {
  constructor(private readonly invoicing: InvoicingService) {}

  @Get('invoices')
  listInvoices(@Query() query: ListInvoicesQueryDto) {
    return this.invoicing.listInvoices(query);
  }

  @Get('invoices/:mfaId')
  async getInvoice(@Param('mfaId', ParseIntPipe) mfaId: number) {
    const data = await this.invoicing.getInvoice(mfaId);
    return { data };
  }

  @Get('orders')
  listOrders(@Query() query: ListOrdersQueryDto) {
    return this.invoicing.listOrders(query);
  }

  @Get('orders/:mfaId')
  async getOrder(@Param('mfaId', ParseIntPipe) mfaId: number) {
    const data = await this.invoicing.getOrder(mfaId);
    return { data };
  }

  @Get('orders/:mfaId/pdf')
  async getOrderPdf(
    @Param('mfaId', ParseIntPipe) mfaId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.invoicing.getOrderPdf(mfaId);
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `inline; filename="${file.fileName ?? `ODF-${mfaId}.pdf`}"`,
    });
    return new StreamableFile(file.buffer);
  }

  @Put('orders/:mfaId/finalize')
  async finalizeOrder(@Param('mfaId', ParseIntPipe) mfaId: number) {
    const data = await this.invoicing.finalizeOrder(mfaId);
    return { data };
  }

  @Get('orders/:mfaId/emails')
  async getOrderEmails(@Param('mfaId', ParseIntPipe) mfaId: number) {
    const data = await this.invoicing.getOrderEmails(mfaId);
    return { data };
  }

  @Post('orders/:mfaId/emails')
  async sendOrderEmail(
    @Param('mfaId', ParseIntPipe) mfaId: number,
    @Body() dto: SendOrderEmailDto,
  ) {
    const data = await this.invoicing.sendOrderEmail(mfaId, dto);
    return { data };
  }
}
