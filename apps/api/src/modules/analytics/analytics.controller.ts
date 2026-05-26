import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { CurrentUser, RequiredRoles } from '../auth/decorators.js';
import { UserMetricsService } from '../user-metrics/user-metrics.service.js';
import { SalesByCostCenterQueryDto } from './dto/sales-by-cost-center-query.dto.js';
import { UserAppUsageQueryDto } from './dto/user-app-usage-query.dto.js';
import { SalesByCostCenterService } from './services/sales-by-cost-center.service.js';

interface AuthUser {
  id: string;
}

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly userMetricsService: UserMetricsService,
    private readonly salesByCostCenterService: SalesByCostCenterService,
  ) {}

  @RequiredRoles('ADMIN')
  @Get('user-app-usage')
  async userAppUsage(@Query() query: UserAppUsageQueryDto) {
    const from = new Date(`${query.from}T00:00:00.000Z`);
    const to = new Date(`${query.to}T00:00:00.000Z`);
    if (from.getTime() > to.getTime()) {
      throw new BadRequestException(
        'El rango de fechas es inválido (from > to).',
      );
    }
    const data = await this.userMetricsService.getAdminUserAppUsageReport(
      from,
      to,
    );
    return { data };
  }

  @RequiredRoles('ADMIN')
  @Get('sales-by-cost-center')
  async salesByCostCenter(@Query() query: SalesByCostCenterQueryDto) {
    const { from, to } = parseDateRange(query);
    const data = await this.salesByCostCenterService.getReport(from, to);
    return { data };
  }

  @Get('sales-by-cost-center/mine')
  async mySalesByCostCenter(
    @CurrentUser() user: AuthUser,
    @Query() query: SalesByCostCenterQueryDto,
  ) {
    const { from, to } = parseDateRange(query);
    const data = await this.salesByCostCenterService.getMyReport(
      user.id,
      from,
      to,
    );
    return { data };
  }
}

function parseDateRange(query: SalesByCostCenterQueryDto): {
  from: Date;
  to: Date;
} {
  const from = new Date(`${query.from}T00:00:00.000Z`);
  const to = new Date(`${query.to}T00:00:00.000Z`);
  if (from.getTime() > to.getTime()) {
    throw new BadRequestException(
      'El rango de fechas es inválido (from > to).',
    );
  }
  return { from, to };
}
