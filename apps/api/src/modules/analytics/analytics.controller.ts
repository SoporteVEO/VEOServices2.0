import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { CurrentUser, RequiredRoles } from '../auth/decorators.js';
import { resolveTargetUserId } from '../auth/view-as.helper.js';
import { UserMetricsService } from '../user-metrics/user-metrics.service.js';
import {
  OffersOverviewListQueryDto,
  OffersOverviewQueryDto,
} from './dto/offers-overview-query.dto.js';
import { PrintingOverviewQueryDto } from './dto/printing-overview-query.dto.js';
import { ReportsOverviewQueryDto } from './dto/reports-overview-query.dto.js';
import { SalesByCostCenterQueryDto } from './dto/sales-by-cost-center-query.dto.js';
import { UserAppUsageQueryDto } from './dto/user-app-usage-query.dto.js';
import { OffersAnalyticsService } from './services/offers-analytics.service.js';
import { PrintingAnalyticsService } from './services/printing-analytics.service.js';
import { ReportsAnalyticsService } from './services/reports-analytics.service.js';
import { SalesByCostCenterService } from './services/sales-by-cost-center.service.js';

interface AuthUser {
  id: string;
  role?: string | null;
}

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly userMetricsService: UserMetricsService,
    private readonly salesByCostCenterService: SalesByCostCenterService,
    private readonly offersAnalyticsService: OffersAnalyticsService,
    private readonly reportsAnalyticsService: ReportsAnalyticsService,
    private readonly printingAnalyticsService: PrintingAnalyticsService,
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
    @Query('viewAsUserId') viewAsUserId?: string,
  ) {
    const { from, to } = parseDateRange(query);
    const targetUserId = resolveTargetUserId(user, viewAsUserId);
    const data = await this.salesByCostCenterService.getMyReport(
      targetUserId,
      from,
      to,
    );
    return { data };
  }

  @RequiredRoles('ADMIN')
  @Get('offers-overview')
  async offersOverview(@Query() query: OffersOverviewQueryDto) {
    const { from, to } = parseExclusiveRange(query);
    const data = await this.offersAnalyticsService.getOverview({
      from,
      to,
      userId: query.userId?.trim() || null,
    });
    return { data };
  }

  @RequiredRoles('ADMIN')
  @Get('offers-overview/list')
  async offersOverviewList(@Query() query: OffersOverviewListQueryDto) {
    const { from, to } = parseExclusiveRange(query);
    const page = parsePositiveInt(query.page, 'page');
    const pageSize = parsePositiveInt(query.pageSize, 'pageSize');
    const data = await this.offersAnalyticsService.listOffers({
      from,
      to,
      userId: query.userId?.trim() || null,
      search: query.search?.trim() || null,
      page,
      pageSize,
    });
    return data;
  }

  @RequiredRoles('ADMIN')
  @Get('reports-overview')
  async reportsOverview(@Query() query: ReportsOverviewQueryDto) {
    const { from, to } = parseExclusiveRange(query);
    const data = await this.reportsAnalyticsService.getOverview({
      from,
      to,
      userId: query.userId?.trim() || null,
    });
    return { data };
  }

  @RequiredRoles('ADMIN')
  @Get('printing-overview')
  async printingOverview(@Query() query: PrintingOverviewQueryDto) {
    const tzOffsetMinutes = clampTzOffset(query.tzOffsetMinutes);
    const utcRange = parseExclusiveRange(query);
    const shiftMs = tzOffsetMinutes * 60 * 1000;
    const data = await this.printingAnalyticsService.getOverview({
      from: new Date(utcRange.from.getTime() + shiftMs),
      to: new Date(utcRange.to.getTime() + shiftMs),
      machineId: query.machineId?.trim() || null,
      tzOffsetMinutes,
    });
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

/**
 * Same as `parseDateRange` but returns a `to` shifted to the next day so the
 * service can treat it as an exclusive upper bound. This makes the public API
 * use inclusive YYYY-MM-DD ranges (matches existing analytics endpoints) while
 * letting Prisma queries use the more common `[from, to)` semantics.
 */
function parseExclusiveRange(query: { from: string; to: string }): {
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
  const exclusiveTo = new Date(to.getTime());
  exclusiveTo.setUTCDate(exclusiveTo.getUTCDate() + 1);
  return { from, to: exclusiveTo };
}

/** Guards against nonsense offsets; real zones live within ±14 hours of UTC. */
function clampTzOffset(raw: string | undefined): number {
  if (!raw) return 0;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(Math.min(Math.trunc(parsed), 14 * 60), -14 * 60);
}

function parsePositiveInt(
  value: string | undefined,
  field: string,
): number | undefined {
  if (value == null || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new BadRequestException(`${field} debe ser un entero positivo`);
  }
  return Math.floor(parsed);
}
