import { DigitalBillboardLogType, Prisma } from '@prisma/client';
import { fromIsoDate } from './pantallas-rules.js';

export interface PantallasActor {
  id: string;
  name?: string | null;
}

export interface PantallasLogEntry {
  type: DigitalBillboardLogType;
  client: string;
  campaign?: string | null;
  screenName: string;
  sublistName?: string | null;
  spotsPerDay?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  previousEndDate?: string | null;
  previousSpotsPerDay?: number | null;
  detail?: string | null;
  orderGroupId?: string | null;
  newSublist?: boolean;
}

export type ScreenChangeAction =
  | 'agregada'
  | 'modificada'
  | 'movida'
  | 'pausada'
  | 'reanudada'
  | 'eliminada';

/** Log types that make up the Reporte OP; the rest are kept as audit trail. */
export const REPORT_LOG_TYPES: DigitalBillboardLogType[] = [
  DigitalBillboardLogType.NEW,
  DigitalBillboardLogType.RENEWED,
  DigitalBillboardLogType.EXTENDED,
  DigitalBillboardLogType.SHORTENED,
];

export async function writeLogs(
  tx: Prisma.TransactionClient,
  entries: PantallasLogEntry[],
  actor?: PantallasActor | null,
) {
  if (entries.length === 0) return;
  await tx.digitalBillboardLog.createMany({
    data: entries.map((e) => ({
      type: e.type,
      client: e.client,
      campaign: e.campaign || null,
      screenName: e.screenName,
      sublistName: e.sublistName ?? null,
      spotsPerDay: e.spotsPerDay ?? null,
      startDate: fromIsoDate(e.startDate),
      endDate: fromIsoDate(e.endDate),
      previousEndDate: fromIsoDate(e.previousEndDate),
      previousSpotsPerDay: e.previousSpotsPerDay ?? null,
      detail: e.detail || null,
      orderGroupId: e.orderGroupId ?? null,
      newSublist: e.newSublist ?? false,
      actorUserId: actor?.id ?? null,
      actorName: actor?.name ?? null,
    })),
  });
}

export async function touchScreen(
  tx: Prisma.TransactionClient,
  screenId: string,
  client: string,
  action: ScreenChangeAction,
) {
  await tx.digitalBillboard.update({
    where: { id: screenId },
    data: {
      lastChangeClient: client,
      lastChangeAction: action,
      lastChangeAt: new Date(),
    },
  });
}
