import { OfferItemType } from '@prisma/client';

/** A single before/after pair recorded in `OfferEvent.changes`. */
export interface OfferChange {
  from: unknown;
  to: unknown;
}

export type OfferChangeSet = Record<string, OfferChange>;

export interface OfferHeaderSnapshot {
  customerName: string;
  customerCompany: string | null;
  customerEmail: string | null;
  billingEmail: string | null;
  customerContact: string | null;
  clientId: string | null;
  validUntil: Date;
  specialConditions: string | null;
}

export interface OfferItemSnapshot {
  itemType: OfferItemType;
  billboardId: number | null;
  billboardCode: string | null;
  digitalBillboardId: string | null;
  quantity: number;
  impressionPrice: number;
  rentalPrice: number;
  taxRate: number;
  description: string | null;
  spotCount: number | null;
  startDate: Date | null;
  endDate: Date | null;
}

export interface OfferTotalsSnapshot {
  subtotalImpression: number;
  totalImpression: number;
  subtotalRental: number;
  totalRental: number;
}

const HEADER_LABELS: Record<keyof OfferHeaderSnapshot, string> = {
  customerName: 'Nombre del cliente',
  customerCompany: 'Empresa',
  customerEmail: 'Correo',
  billingEmail: 'Correo de facturación',
  customerContact: 'Contacto',
  clientId: 'Cliente vinculado',
  validUntil: 'Vigencia',
  specialConditions: 'Condiciones especiales',
};

const ITEM_LABELS: Partial<Record<keyof OfferItemSnapshot, string>> = {
  quantity: 'cantidad',
  impressionPrice: 'precio de impresión',
  rentalPrice: 'precio de arrendamiento',
  taxRate: 'impuesto',
  description: 'descripción',
  spotCount: 'spots',
  startDate: 'fecha de inicio',
  endDate: 'fecha de fin',
};

const TOTALS_LABELS: Record<keyof OfferTotalsSnapshot, string> = {
  subtotalImpression: 'Subtotal impresión',
  totalImpression: 'Total impresión',
  subtotalRental: 'Subtotal arrendamiento',
  totalRental: 'Total arrendamiento',
};

function normalize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
  return value ?? null;
}

function isEqual(a: unknown, b: unknown): boolean {
  return normalize(a) === normalize(b);
}

/**
 * Human-readable identity of a line, used both to pair lines across an edit
 * and to name them in the history feed.
 */
export function itemSignature(item: OfferItemSnapshot): string {
  switch (item.itemType) {
    case OfferItemType.DIGITAL_BILLBOARD:
      return `digital:${item.digitalBillboardId ?? 'sin-valla'}`;
    case OfferItemType.MISC:
      return `misc:${item.description?.trim().toLowerCase() ?? 'sin-descripcion'}`;
    default:
      return `static:${item.billboardCode ?? item.billboardId ?? 'sin-valla'}`;
  }
}

function itemLabel(item: OfferItemSnapshot): string {
  switch (item.itemType) {
    case OfferItemType.DIGITAL_BILLBOARD:
      return `Valla digital ${item.billboardCode ?? item.digitalBillboardId ?? ''}`.trim();
    case OfferItemType.MISC:
      return `Concepto "${item.description?.trim() || 'sin descripción'}"`;
    default:
      return `Valla ${item.billboardCode ?? item.billboardId ?? 'sin código'}`;
  }
}

export function diffHeader(
  before: OfferHeaderSnapshot,
  after: OfferHeaderSnapshot,
): { changes: OfferChangeSet; summary: string[] } {
  const changes: OfferChangeSet = {};
  const summary: string[] = [];

  for (const key of Object.keys(
    HEADER_LABELS,
  ) as (keyof OfferHeaderSnapshot)[]) {
    if (isEqual(before[key], after[key])) continue;
    changes[key] = { from: normalize(before[key]), to: normalize(after[key]) };
    summary.push(HEADER_LABELS[key]);
  }

  return { changes, summary };
}

export function diffTotals(
  before: OfferTotalsSnapshot,
  after: OfferTotalsSnapshot,
): OfferChangeSet {
  const changes: OfferChangeSet = {};
  for (const key of Object.keys(
    TOTALS_LABELS,
  ) as (keyof OfferTotalsSnapshot)[]) {
    if (before[key] === after[key]) continue;
    changes[key] = { from: before[key], to: after[key] };
  }
  return changes;
}

export interface ItemsDiff {
  changes: OfferChangeSet;
  /** One human-readable line per change, ready to render in the history feed. */
  summary: string[];
  hasChanges: boolean;
}

export function diffItems(
  before: OfferItemSnapshot[],
  after: OfferItemSnapshot[],
): ItemsDiff {
  const beforeBySignature = new Map(
    before.map((item) => [itemSignature(item), item]),
  );
  const afterBySignature = new Map(
    after.map((item) => [itemSignature(item), item]),
  );

  const changes: OfferChangeSet = {};
  const summary: string[] = [];

  for (const [signature, item] of afterBySignature) {
    if (beforeBySignature.has(signature)) continue;
    changes[`item.${signature}`] = { from: null, to: itemLabel(item) };
    summary.push(`Se agregó ${itemLabel(item)}`);
  }

  for (const [signature, item] of beforeBySignature) {
    if (afterBySignature.has(signature)) continue;
    changes[`item.${signature}`] = { from: itemLabel(item), to: null };
    summary.push(`Se eliminó ${itemLabel(item)}`);
  }

  for (const [signature, next] of afterBySignature) {
    const previous = beforeBySignature.get(signature);
    if (!previous) continue;

    for (const key of Object.keys(ITEM_LABELS) as (keyof OfferItemSnapshot)[]) {
      if (isEqual(previous[key], next[key])) continue;
      changes[`item.${signature}.${key}`] = {
        from: normalize(previous[key]),
        to: normalize(next[key]),
      };
      summary.push(`${itemLabel(next)}: ${ITEM_LABELS[key]} actualizado`);
    }
  }

  return { changes, summary, hasChanges: summary.length > 0 };
}

/** Condenses a change list into the one-line message shown in the feed. */
export function buildEditMessage(
  headerSummary: string[],
  itemsSummary: string[],
): string {
  const parts: string[] = [];
  if (headerSummary.length > 0) {
    parts.push(`Datos actualizados: ${headerSummary.join(', ')}`);
  }
  if (itemsSummary.length > 0) {
    parts.push(
      itemsSummary.length === 1
        ? itemsSummary[0]
        : `${itemsSummary.length} cambios en los ítems`,
    );
  }
  return parts.join(' · ') || 'Cotización actualizada';
}
