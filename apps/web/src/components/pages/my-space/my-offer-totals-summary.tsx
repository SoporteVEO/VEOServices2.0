"use client";

import { ImageIcon, Wallet, type LucideIcon } from "lucide-react";
import type { OfferDetail } from "@/api/offers/offers.types";
import { Separator } from "@/components/primitives/ui/separator";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type MyOfferTotalsSummaryProps = {
  offer: OfferDetail;
};

export function MyOfferTotalsSummary({ offer }: MyOfferTotalsSummaryProps) {
  const grandSubtotal = offer.subtotalRental + offer.subtotalImpression;
  const grandIva = offer.ivaRental + offer.ivaImpression;
  const grandTotal = offer.totalRental + offer.totalImpression;

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex flex-col gap-1 bg-primary/5 px-4 py-3">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Total general
        </span>
        <span className="truncate text-2xl font-semibold tabular-nums text-foreground">
          {formatMoney(grandTotal)}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          Subtotal {formatMoney(grandSubtotal)} · IVA {formatMoney(grandIva)}
        </span>
      </div>

      <Separator />

      <div className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <TotalsBreakdown
          icon={Wallet}
          label="Arrendamiento"
          subtotal={offer.subtotalRental}
          iva={offer.ivaRental}
          total={offer.totalRental}
        />
        <TotalsBreakdown
          icon={ImageIcon}
          label="Impresión"
          subtotal={offer.subtotalImpression}
          iva={offer.ivaImpression}
          total={offer.totalImpression}
        />
      </div>
    </div>
  );
}

function TotalsBreakdown({
  icon: Icon,
  label,
  subtotal,
  iva,
  total,
}: {
  icon: LucideIcon;
  label: string;
  subtotal: number;
  iva: number;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-3.5" />
        </div>
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>

      <dl className="flex flex-col gap-1.5 text-sm">
        <TotalsRow label="Subtotal" value={subtotal} />
        <TotalsRow label="IVA" value={iva} muted />
        <Separator className="my-1" />
        <TotalsRow label="Total" value={total} emphasis />
      </dl>
    </div>
  );
}

function TotalsRow({
  label,
  value,
  muted,
  emphasis,
}: {
  label: string;
  value: number;
  muted?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt
        className={cn(
          "text-xs",
          emphasis ? "font-semibold text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "truncate tabular-nums",
          emphasis
            ? "text-base font-semibold text-foreground"
            : muted
              ? "text-xs text-muted-foreground"
              : "text-sm font-medium text-foreground",
        )}
      >
        {formatMoney(value)}
      </dd>
    </div>
  );
}
