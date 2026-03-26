import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service.js';
import { Public } from '../auth/decorators.js';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  async findAll() {
    const purchases = await this.purchasesService.findAll();
    return { data: purchases };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const purchase = await this.purchasesService.findOne(id);
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }

  @Public()
  @Post()
  async create(
    @Body()
    body: {
      paypalOrderId: string;
      email: string;
      items: any[];
    },
  ) {
    return this.purchasesService.createPurchase(body);
  }
}
