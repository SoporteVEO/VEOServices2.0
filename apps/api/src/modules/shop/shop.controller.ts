import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ShopService } from './shop.service.js';
import { isDigitalSpotOption, type DigitalSpotOption } from './digital-spots.js';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('digital-departments')
  async getDigitalDepartments() {
    const departments = await this.shopService.listDigitalShopDepartments();
    return { data: departments };
  }

  @Get('digital-billboards')
  async getAvailableDigitalBillboards(
    @Query('departmentId') departmentIdRaw?: string,
    @Query('from') fromRaw?: string,
    @Query('to') toRaw?: string,
    @Query('spots') spotsRaw?: string,
  ) {
    const departmentId =
      departmentIdRaw != null ? Number(departmentIdRaw) : null;
    const from = fromRaw ? new Date(fromRaw) : new Date();
    const to = toRaw
      ? new Date(toRaw)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const spotsNum = spotsRaw ? Number(spotsRaw) : 300;
    if (!isDigitalSpotOption(spotsNum)) {
      throw new BadRequestException('spots inválido (300, 450, o 900)');
    }

    const billboards =
      await this.shopService.getAvailableDigitalBillboards(
        departmentId,
        from,
        to,
        spotsNum as DigitalSpotOption,
      );
    return { data: billboards };
  }
}
