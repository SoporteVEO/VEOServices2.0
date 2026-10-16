import { BadRequestException } from '@nestjs/common';
import { unwrapList } from '../brilo-webapi/brilo-response.js';
import type {
  BriloQuery,
  BriloWebapiService,
} from '../brilo-webapi/brilo-webapi.service.js';
import type { PageQueryDto } from './dto/finance-query.dto.js';

export interface Paging {
  page: number;
  pageSize: number;
}

export interface FinancePage<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

const MAX_PAGE_SIZE = 200;

function toInt(value: string | undefined, fallback: number): number {
  const parsed = value ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parsePaging(query: PageQueryDto, defaultSize = 25): Paging {
  return {
    page: toInt(query.page, 1),
    pageSize: Math.min(toInt(query.pageSize, defaultSize), MAX_PAGE_SIZE),
  };
}

export function toPage<T>(
  data: T[],
  paging: Paging,
  total: number | null,
): FinancePage<T> {
  const hasMore =
    total != null
      ? paging.page * paging.pageSize < total
      : data.length === paging.pageSize;
  // Most Brilo endpoints do not report a total; counting one row past the
  // current page keeps the "next page" control enabled while more may exist.
  const resolvedTotal =
    total ??
    (paging.page - 1) * paging.pageSize + data.length + (hasMore ? 1 : 0);
  return { ...paging, data, total: resolvedTotal, hasMore };
}

export async function fetchBriloPage<T>(
  brilo: BriloWebapiService,
  path: string,
  paging: Paging,
  query: BriloQuery = {},
): Promise<FinancePage<T>> {
  const { data, total } = await brilo.send('GET', path, {
    query: { ...query, page: paging.page, per_page: paging.pageSize },
  });
  return toPage(unwrapList<T>(data), paging, total);
}

export async function fetchBriloList<T>(
  brilo: BriloWebapiService,
  path: string,
  query: BriloQuery = {},
): Promise<T[]> {
  const { data } = await brilo.send('GET', path, { query });
  return unwrapList<T>(data);
}

/** Brilo rejects a date range with only one bound. */
export function dateRange(
  from: string | undefined,
  to: string | undefined,
): { fecha_desde?: string; fecha_hasta?: string } {
  if (Boolean(from) !== Boolean(to)) {
    throw new BadRequestException(
      'Indica ambas fechas del rango (desde y hasta).',
    );
  }
  return from && to ? { fecha_desde: from, fecha_hasta: to } : {};
}
