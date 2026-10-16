"use client";

import { useMemo } from "react";
import { ImageIcon, Wallet, type LucideIcon } from "lucide-react";
import type { OfferDetail } from "@/api/offers/offers.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Separator } from "@/components/primitives/ui/separator";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  formatDiscountPercent,
  offerDetailPricedLines,
  summarizeDiscounts,
  type PriceDiscount,
} from "./quotation/offer-discounts";

type MyOfferTotalsSummaryProps = {
  offer: OfferDetail;
};

export function MyOfferTotalsSummary({ offer }: MyOfferTotalsSummaryProps) {
  const grandSubtotal = offer.subtotalRental + offer.subtotalImpression;
  const grandIva = offer.ivaRental + offer.ivaImpression;
  const grandTotal = offer.totalRental + offer.totalImpression;
  const discounts = useMemo(
    () => summarizeDiscounts(offerDetailPricedLines(offer.items)),
    [offer.items],
  );

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
        {discounts.total ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <Badge variant="destructive" className="tabular-nums">
              -{formatDiscountPercent(discounts.total.percent)}
            </Badge>
            <span className="text-muted-foreground">
              Descuento de{" "}
              <span className="font-medium tabular-nums text-foreground">
                {formatMoney(discounts.total.amount)}
              </span>{" "}
              sobre el precio recomendado de{" "}
              <span className="tabular-nums">
                {formatMoney(discounts.total.list)}
              </span>{" "}
              (antes de IVA)
            </span>
          </div>
        ) : null}
      </div>

      <Separator />

      <div className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <TotalsBreakdown
          icon={Wallet}
          label="Arrendamiento"
          subtotal={offer.subtotalRental}
          iva={offer.ivaRental}
          total={offer.totalRental}
          discount={discounts.rental}
        />
        <TotalsBreakdown
          icon={ImageIcon}
          label="Impresión"
          subtotal={offer.subtotalImpression}
          iva={offer.ivaImpression}
          total={offer.totalImpression}
          discount={discounts.impression}
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
  discount,
}: {
  icon: LucideIcon;
  label: string;
  subtotal: number;
  iva: number;
  total: number;
  discount: PriceDiscount | null;
}) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-3.5" />
          </div>
          <span className="text-sm font-semibold text-foreground">{label}</span>
        </div>
        {discount ? (
          <Badge variant="destructive" className="tabular-nums">
            -{formatDiscountPercent(discount.percent)}
          </Badge>
        ) : null}
      </div>

      <dl className="flex flex-col gap-1.5 text-sm">
        {discount ? (
          <TotalsRow
            label={`Descuento ${formatDiscountPercent(discount.percent)} sobre ${formatMoney(discount.list)}`}
            value={-discount.amount}
            tone="discount"
          />
        ) : null}
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
  tone,
}: {
  label: string;
  value: number;
  muted?: boolean;
  emphasis?: boolean;
  tone?: "discount";
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
          tone === "discount"
            ? "text-sm font-medium text-destructive"
            : emphasis
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
