"use client";

import type { OfferChange, OfferDetail } from "@/api/offers/offers.types";
import { Badge } from "@/components/primitives/ui/badge";
import { formatBriloShortDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const MONEY_FIELDS = new Set([
  "subtotalImpression",
  "totalImpression",
  "subtotalRental",
  "totalRental",
  "impressionPrice",
  "rentalPrice",
]);

const TOTAL_FIELDS = new Set([
  "subtotalImpression",
  "totalImpression",
  "subtotalRental",
  "totalRental",
]);

const FIELD_LABELS: Record<string, string> = {
  customerName: "Nombre del cliente",
  customerCompany: "Empresa",
  customerEmail: "Correo",
  billingEmail: "Correo de facturación",
  customerContact: "Contacto",
  clientId: "Cliente vinculado",
  validUntil: "Vigencia",
  specialConditions: "Condiciones especiales",
  status: "Estado",
  briloMconId: "Contrato Brilo",
  briloContract: "Contrato Brilo",
  subtotalImpression: "Subtotal impresión",
  totalImpression: "Total impresión",
  subtotalRental: "Subtotal arrendamiento",
  totalRental: "Total arrendamiento",
  quantity: "Cantidad",
  impressionPrice: "Precio de impresión",
  rentalPrice: "Precio de arrendamiento",
  taxRate: "Impuesto",
  description: "Descripción",
  spotCount: "Spots",
  startDate: "Fecha de inicio",
  endDate: "Fecha de fin",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T/;
type RowKind = "changed" | "added" | "removed";

interface DiffRow {
  key: string;
  label: string;
  field: string;
  kind: RowKind;
  from: unknown;
  to: unknown;
}

interface DiffSection {
  id: string;
  title: string;
  rows: DiffRow[];
}

/** `static:ABC` → `Valla ABC`; the backend uses this signature to pair lines. */
function itemTitle(signature: string): string {
  const [type, ...rest] = signature.split(":");
  const id = rest.join(":");
  if (type === "digital") return `Pantalla ${id}`;
  if (type === "misc") return `Concepto "${id}"`;
  return `Valla ${id}`;
}

/**
 * Change keys are either a plain header/total field or
 * `item.<signature>[.<field>]`. Lines are grouped so each edited item reads
 * as its own block in both documents.
 */
function buildSections(changes: Record<string, OfferChange>): DiffSection[] {
  const general: DiffRow[] = [];
  const lineup: DiffRow[] = [];
  const totals: DiffRow[] = [];
  const editedItems = new Map<string, DiffRow[]>();

  for (const [key, change] of Object.entries(changes)) {
    if (!key.startsWith("item.")) {
      const row: DiffRow = {
        key,
        label: FIELD_LABELS[key] ?? key,
        field: key,
        kind: "changed",
        ...change,
      };
      (TOTAL_FIELDS.has(key) ? totals : general).push(row);
      continue;
    }

    const [, signature = "", field] = key.split(".");
    if (!field) {
      lineup.push({
        key,
        label: itemTitle(signature),
        field: "item",
        kind: change.from == null ? "added" : "removed",
        ...change,
      });
      continue;
    }

    const rows = editedItems.get(signature) ?? [];
    rows.push({
      key,
      label: FIELD_LABELS[field] ?? field,
      field,
      kind: "changed",
      ...change,
    });
    editedItems.set(signature, rows);
  }

  const sections: DiffSection[] = [
    { id: "general", title: "Datos generales", rows: general },
    { id: "lineup", title: "Vallas e ítems", rows: lineup },
    ...[...editedItems].map(([signature, rows]) => ({
      id: `item-${signature}`,
      title: itemTitle(signature),
      rows,
    })),
    { id: "totals", title: "Totales", rows: totals },
  ];
  return sections.filter((section) => section.rows.length > 0);
}

function formatValue(
  field: string,
  value: unknown,
  offer: OfferDetail,
): string | null {
  if (value == null || value === "") return null;
  if (field === "clientId") {
    if (value === offer.clientId) {
      return offer.customerCompany || offer.customerName || "Cliente vinculado";
    }
    return "Cliente vinculado";
  }
  if (
    field === "briloMconId" &&
    value === offer.briloMconId &&
    offer.briloMconCodigo
  ) {
    return offer.briloMconCodigo;
  }
  if (typeof value === "number") {
    return MONEY_FIELDS.has(field) ? formatMoney(value) : String(value);
  }
  if (typeof value === "string" && ISO_DATE.test(value)) {
    return formatBriloShortDate(value);
  }
  return String(value);
}

function moneyDelta(row: DiffRow): number | null {
  if (!MONEY_FIELDS.has(row.field)) return null;
  if (typeof row.from !== "number" || typeof row.to !== "number") return null;
  const delta = row.to - row.from;
  return delta === 0 ? null : delta;
}

type Side = "before" | "after";

const SIDE_TITLES: Record<Side, string> = {
  before: "Antes",
  after: "Después",
};

/**
 * Two side-by-side "documents" with the offer before and after the edit.
 * Both columns share one grid so matching rows stay aligned even when a
 * value wraps.
 */
export function OfferChangeDiff({
  changes,
  offer,
}: {
  changes: Record<string, OfferChange>;
  offer: OfferDetail;
}) {
  const sections = buildSections(changes);
  if (sections.length === 0) return null;

  return (
    <div className="mt-3 grid grid-cols-2 gap-x-3 text-xs">
      {(["before", "after"] as const).map((side) => (
        <DocumentHeader key={side} side={side} />
      ))}

      {sections.map((section, sectionIndex) => (
        <SectionBlock
          key={section.id}
          section={section}
          offer={offer}
          isLast={sectionIndex === sections.length - 1}
        />
      ))}
    </div>
  );
}

function DocumentHeader({ side }: { side: Side }) {
  return (
    <div className="flex items-center gap-2 rounded-t-md border border-b-0 bg-muted/40 px-3 py-2">
      <span
        className={cn(
          "size-2 rounded-full",
          side === "before" ? "bg-muted-foreground/50" : "bg-success",
        )}
        aria-hidden
      />
      <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {SIDE_TITLES[side]}
      </span>
    </div>
  );
}

function cellFrame(isLast: boolean) {
  return cn(
    "border-x bg-card px-3",
    isLast && "rounded-b-md border-b pb-3",
  );
}

function SectionBlock({
  section,
  offer,
  isLast,
}: {
  section: DiffSection;
  offer: OfferDetail;
  isLast: boolean;
}) {
  return (
    <>
      {(["before", "after"] as const).map((side) => (
        <div key={side} className={cn(cellFrame(false), "pt-3 pb-1")}>
          <p className="border-b border-dashed pb-1 text-[11px] font-semibold text-foreground">
            {section.title}
          </p>
        </div>
      ))}

      {section.rows.map((row, rowIndex) => {
        const lastRow = isLast && rowIndex === section.rows.length - 1;
        return (["before", "after"] as const).map((side) => (
          <div key={`${row.key}-${side}`} className={cellFrame(lastRow)}>
            <DiffCell row={row} side={side} offer={offer} />
          </div>
        ));
      })}
    </>
  );
}

function DiffCell({
  row,
  side,
  offer,
}: {
  row: DiffRow;
  side: Side;
  offer: OfferDetail;
}) {
  if (row.field === "item") return <ItemCell row={row} side={side} />;

  const raw = side === "before" ? row.from : row.to;
  const value = formatValue(row.field, raw, offer);
  const delta = side === "after" ? moneyDelta(row) : null;

  return (
    <div className="py-1.5">
      <p className="text-[11px] text-muted-foreground">{row.label}</p>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <Value field={row.field} value={value} side={side} />
        {delta != null ? (
          <span
            className={cn(
              "text-[11px] font-medium tabular-nums",
              delta > 0 ? "text-success" : "text-destructive",
            )}
          >
            {delta > 0 ? "+" : "−"}
            {formatMoney(Math.abs(delta))}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Value({
  field,
  value,
  side,
}: {
  field: string;
  value: string | null;
  side: Side;
}) {
  if (value == null) {
    return <span className="text-muted-foreground italic">Sin valor</span>;
  }

  return (
    <span
      className={cn(
        "-mx-1 rounded px-1 py-0.5 font-medium break-words whitespace-pre-wrap tabular-nums",
        side === "before"
          ? "bg-destructive-soft text-destructive"
          : "bg-success-soft text-success",
      )}
    >
      {value}
    </span>
  );
}

function ItemCell({ row, side }: { row: DiffRow; side: Side }) {
  const present =
    (side === "before" && row.kind === "removed") ||
    (side === "after" && row.kind === "added");

  if (!present) {
    return (
      <div className="py-1.5">
        <p className="text-muted-foreground/70 italic">
          {row.kind === "added" ? "No incluido" : "Eliminado"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-1.5">
      <span
        className={cn(
          "font-medium",
          row.kind === "removed" && "text-destructive line-through",
        )}
      >
        {row.label}
      </span>
      <Badge
        variant={row.kind === "added" ? "success" : "destructive"}
        className="h-5 text-[10px]"
      >
        {row.kind === "added" ? "Agregado" : "Eliminado"}
      </Badge>
    </div>
  );
}
