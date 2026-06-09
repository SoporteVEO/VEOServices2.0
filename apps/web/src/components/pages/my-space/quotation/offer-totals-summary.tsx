"use client";

import { formatMoney } from "@/lib/format";
import type { OfferTotals } from "./offer-types";

export interface OfferTotalsSummaryProps {
  totals: OfferTotals;
}

export function OfferTotalsSummary({ totals }: OfferTotalsSummaryProps) {
  return (
    <section className="rounded-md border bg-muted/30 p-3 text-xs">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <SummaryColumn
          label="Impresión"
          subtotal={totals.subtotalImpression}
          iva={totals.ivaImpression}
          total={totals.totalImpression}
        />
        <SummaryColumn
          label="Arrendamiento"
          subtotal={totals.subtotalRental}
          iva={totals.ivaRental}
          total={totals.totalRental}
        />
        <div className="flex flex-col items-stretch justify-between rounded-md bg-background p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Total general
          </span>
          <span className="mt-1 text-base font-semibold tabular-nums">
            {formatMoney(totals.grandTotal)}
          </span>
        </div>
      </div>
    </section>
  );
}

interface SummaryColumnProps {
  label: string;
  subtotal: number;
  iva: number;
  total: number;
}

function SummaryColumn({ label, subtotal, iva, total }: SummaryColumnProps) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-background p-3">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <Row label="Sub Total" value={subtotal} />
      <Row label="Impuesto" value={iva} />
      <div className="mt-1 flex items-center justify-between border-t pt-1 text-sm">
        <span className="font-medium">Total</span>
        <span className="font-semibold tabular-nums">{formatMoney(total)}</span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{formatMoney(value)}</span>
    </div>
  );
}
