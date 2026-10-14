import { Injectable, NotFoundException } from '@nestjs/common';
import { DigitalBillboardLogType, Prisma } from '@prisma/client';
import {
  campaignWriteData,
  versionsCreateData,
  type CampaignData,
} from './pantallas-mappers.js';
import {
  touchScreen,
  writeLogs,
  type PantallasActor,
} from './pantallas-log.js';
import {
  DEFAULT_MIN_HOURS,
  DEFAULT_SPOTS_PER_HOUR,
  FULL_SUBLIST_SPOTS,
  HALF_SUBLIST_SPOTS,
  campaignStatus,
  occupiesAir,
  sameText,
  screenCapacity,
  toIsoDate,
} from './pantallas-rules.js';

export interface PantallasSettings {
  spotsPerHour: number;
  minHours: number;
}

export interface PlacementResult {
  placed: boolean;
  screenId: string;
  screenName: string;
  sublistName: string;
  newSublist: boolean;
  needsMoreHours: boolean;
  campaignId: string | null;
}

interface PlaceInput {
  screenId: string;
  data: CampaignData;
  refIso: string;
  orderGroupId?: string | null;
  offerItemId?: string | null;
}

const placementScreenSelect = {
  id: true,
  code: true,
  name: true,
  turnOnAt: true,
  turnOffAt: true,
  sublists: {
    orderBy: { position: 'asc' },
    select: {
      id: true,
      name: true,
      capacity: true,
      position: true,
      campaigns: {
        select: {
          client: true,
          campaign: true,
          startDate: true,
          endDate: true,
          spotsPerDay: true,
          paused: true,
        },
      },
    },
  },
} satisfies Prisma.DigitalBillboardSelect;

type PlacementScreen = Prisma.DigitalBillboardGetPayload<{
  select: typeof placementScreenSelect;
}>;

type Plan =
  | { type: 'duplicate'; sublistName: string }
  | { type: 'fit'; sublistId: string; sublistName: string }
  | { type: 'new'; capacity: number; needsMoreHours: boolean };

@Injectable()
export class PantallasPlacementService {
  async loadSettings(tx: Prisma.TransactionClient): Promise<PantallasSettings> {
    const row = await tx.digitalBillboardSettings.findUnique({
      where: { id: 1 },
    });
    return {
      spotsPerHour: row?.spotsPerHour ?? DEFAULT_SPOTS_PER_HOUR,
      minHours: row?.minHours ?? DEFAULT_MIN_HOURS,
    };
  }

  /**
   * Puts a campaign in the sublist with the tightest gap that still fits it,
   * or opens an extra sublist when none does. A campaign already present
   * (same client, campaign and dates) is skipped.
   */
  async place(
    tx: Prisma.TransactionClient,
    input: PlaceInput,
    settings: PantallasSettings,
    actor?: PantallasActor | null,
  ): Promise<PlacementResult> {
    const screen = await tx.digitalBillboard.findUnique({
      where: { id: input.screenId },
      select: placementScreenSelect,
    });
    if (!screen) throw new NotFoundException('Pantalla no encontrada');

    const plan = planPlacement(screen, input.data, input.refIso, settings);
    if (plan.type === 'duplicate') {
      return {
        placed: false,
        screenId: screen.id,
        screenName: screen.name,
        sublistName: plan.sublistName,
        newSublist: false,
        needsMoreHours: false,
        campaignId: null,
      };
    }

    let sublistId: string;
    let sublistName: string;
    if (plan.type === 'fit') {
      sublistId = plan.sublistId;
      sublistName = plan.sublistName;
    } else {
      const created = await tx.digitalBillboardSublist.create({
        data: {
          digitalBillboardId: screen.id,
          name: extraSublistName(screen, plan.capacity),
          capacity: plan.capacity,
          position: nextPosition(screen),
        },
      });
      sublistId = created.id;
      sublistName = created.name;
    }

    const campaign = await tx.digitalBillboardCampaign.create({
      data: {
        ...campaignWriteData(input.data),
        sublistId,
        orderGroupId: input.orderGroupId ?? null,
        offerItemId: input.offerItemId ?? null,
        versions: { create: versionsCreateData(input.data.versions) },
      },
    });

    await touchScreen(tx, screen.id, input.data.client, 'agregada');
    await writeLogs(
      tx,
      [
        {
          type: DigitalBillboardLogType.NEW,
          client: input.data.client,
          campaign: input.data.campaign,
          screenName: screen.name,
          sublistName,
          spotsPerDay: input.data.spotsPerDay,
          startDate: input.data.startDate,
          endDate: input.data.endDate,
          orderGroupId: input.orderGroupId,
          newSublist: plan.type === 'new',
        },
      ],
      actor,
    );

    return {
      placed: true,
      screenId: screen.id,
      screenName: screen.name,
      sublistName,
      newSublist: plan.type === 'new',
      needsMoreHours: plan.type === 'new' && plan.needsMoreHours,
      campaignId: campaign.id,
    };
  }
}

function planPlacement(
  screen: PlacementScreen,
  data: CampaignData,
  refIso: string,
  settings: PantallasSettings,
): Plan {
  for (const sublist of screen.sublists) {
    const duplicate = sublist.campaigns.some(
      (c) =>
        sameText(c.client, data.client) &&
        sameText(c.campaign, data.campaign) &&
        toIsoDate(c.startDate) === data.startDate &&
        toIsoDate(c.endDate) === data.endDate,
    );
    if (duplicate) return { type: 'duplicate', sublistName: sublist.name };
  }

  let best: { id: string; name: string; free: number } | null = null;
  for (const sublist of screen.sublists) {
    const used = sublist.campaigns.reduce((sum, c) => {
      const status = campaignStatus(
        {
          startDate: toIsoDate(c.startDate),
          endDate: toIsoDate(c.endDate),
          paused: c.paused,
        },
        refIso,
      );
      return occupiesAir(status) ? sum + c.spotsPerDay : sum;
    }, 0);
    const free = sublist.capacity - used;
    if (free >= data.spotsPerDay && (!best || free < best.free)) {
      best = { id: sublist.id, name: sublist.name, free };
    }
  }
  if (best) return { type: 'fit', sublistId: best.id, sublistName: best.name };

  const capacity =
    data.spotsPerDay <= HALF_SUBLIST_SPOTS
      ? HALF_SUBLIST_SPOTS
      : FULL_SUBLIST_SPOTS;
  const listsCapacity = screen.sublists.reduce((sum, s) => sum + s.capacity, 0);
  return {
    type: 'new',
    capacity,
    needsMoreHours:
      listsCapacity + capacity > screenCapacity(screen, settings.spotsPerHour),
  };
}

export function screenCodeOf(screen: { code: string; name: string }) {
  return (
    screen.code ||
    screen.name
      .replace(/[^A-Za-zÁÉÍÓÚÑ]/g, '')
      .slice(0, 6)
      .toUpperCase()
  );
}

export function extraSublistName(
  screen: { code: string; name: string; sublists: unknown[] },
  capacity: number,
) {
  return `${screenCodeOf(screen)} EXTRA ${screen.sublists.length + 1}_${capacity}`;
}

function nextPosition(screen: PlacementScreen) {
  return screen.sublists.reduce((max, s) => Math.max(max, s.position + 1), 0);
}
