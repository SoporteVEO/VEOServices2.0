import {
  DigitalCampaignArt,
  DigitalCampaignDeal,
  Prisma,
} from '@prisma/client';
import type { CampaignInputDto } from './dto/pantallas.dto.js';
import { fromIsoDate, toIsoDate } from './pantallas-rules.js';

export interface CampaignVersionData {
  title: string;
  startDate: string | null;
  endDate: string | null;
}

export interface CampaignData {
  client: string;
  campaign: string;
  startDate: string | null;
  endDate: string | null;
  spotsPerDay: number;
  notes: string | null;
  paused: boolean;
  pauseReason: string | null;
  art: DigitalCampaignArt;
  deal: DigitalCampaignDeal;
  monthlyValue: number | null;
  spotValue: number | null;
  totalValue: number | null;
  versions: CampaignVersionData[];
}

export function campaignDataFromDto(dto: CampaignInputDto): CampaignData {
  const paused = dto.paused ?? false;
  return {
    client: dto.client.trim(),
    campaign: dto.campaign?.trim() ?? '',
    startDate: dto.startDate ?? null,
    endDate: dto.endDate ?? null,
    spotsPerDay: dto.spotsPerDay,
    notes: dto.notes?.trim() || null,
    paused,
    pauseReason: paused ? dto.pauseReason?.trim() || null : null,
    art: dto.art ?? DigitalCampaignArt.RECEIVED,
    deal: dto.deal ?? DigitalCampaignDeal.COMMERCIAL,
    monthlyValue: dto.monthlyValue ?? null,
    spotValue: dto.spotValue ?? null,
    totalValue: dto.totalValue ?? null,
    versions: (dto.versions ?? [])
      .map((v) => ({
        title: v.title?.trim() ?? '',
        startDate: v.startDate ?? null,
        endDate: v.endDate ?? null,
      }))
      .filter((v) => v.title || v.startDate || v.endDate),
  };
}

export function campaignWriteData(data: CampaignData) {
  return {
    client: data.client,
    campaign: data.campaign,
    startDate: fromIsoDate(data.startDate),
    endDate: fromIsoDate(data.endDate),
    spotsPerDay: data.spotsPerDay,
    notes: data.notes,
    paused: data.paused,
    pauseReason: data.pauseReason,
    art: data.art,
    deal: data.deal,
    monthlyValue: data.monthlyValue,
    spotValue: data.spotValue,
    totalValue: data.totalValue,
  };
}

export function versionsCreateData(
  versions: CampaignVersionData[],
): Prisma.DigitalBillboardCampaignVersionCreateWithoutCampaignInput[] {
  return versions.map((v, position) => ({
    title: v.title,
    startDate: fromIsoDate(v.startDate),
    endDate: fromIsoDate(v.endDate),
    position,
  }));
}

export const campaignInclude = {
  versions: { orderBy: { position: 'asc' } },
} satisfies Prisma.DigitalBillboardCampaignInclude;

type CampaignRow = Prisma.DigitalBillboardCampaignGetPayload<{
  include: typeof campaignInclude;
}>;

export function mapCampaign(row: CampaignRow) {
  return {
    id: row.id,
    sublistId: row.sublistId,
    client: row.client,
    campaign: row.campaign,
    startDate: toIsoDate(row.startDate),
    endDate: toIsoDate(row.endDate),
    spotsPerDay: row.spotsPerDay,
    notes: row.notes,
    paused: row.paused,
    pauseReason: row.pauseReason,
    art: row.art,
    deal: row.deal,
    monthlyValue: row.monthlyValue,
    spotValue: row.spotValue,
    totalValue: row.totalValue,
    orderGroupId: row.orderGroupId,
    offerItemId: row.offerItemId,
    versions: row.versions.map((v) => ({
      id: v.id,
      title: v.title,
      startDate: toIsoDate(v.startDate),
      endDate: toIsoDate(v.endDate),
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function campaignDataFromRow(row: CampaignRow): CampaignData {
  return {
    client: row.client,
    campaign: row.campaign,
    startDate: toIsoDate(row.startDate),
    endDate: toIsoDate(row.endDate),
    spotsPerDay: row.spotsPerDay,
    notes: row.notes,
    paused: row.paused,
    pauseReason: row.pauseReason,
    art: row.art,
    deal: row.deal,
    monthlyValue: row.monthlyValue,
    spotValue: row.spotValue,
    totalValue: row.totalValue,
    versions: row.versions.map((v) => ({
      title: v.title,
      startDate: toIsoDate(v.startDate),
      endDate: toIsoDate(v.endDate),
    })),
  };
}
