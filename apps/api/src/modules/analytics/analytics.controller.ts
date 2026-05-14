import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { RequiredRoles } from '../auth/decorators.js';
import { UserMetricsService } from '../user-metrics/user-metrics.service.js';
import { UserAppUsageQueryDto } from './dto/user-app-usage-query.dto.js';

@RequiredRoles('ADMIN')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly userMetricsService: UserMetricsService) {}

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
}
