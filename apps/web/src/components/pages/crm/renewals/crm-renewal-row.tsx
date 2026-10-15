"use client";

import { ArrowUpRight, RefreshCw } from "lucide-react";
import type { CrmRenewalItem } from "@/api/crm/crm-ooh.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DEAL_STATUS_LABELS, DEAL_STATUS_STYLES } from "../crm-const";
import { SITE_KIND_ICONS, SITE_KIND_LABELS } from "../crm-ooh-const";
import { flightLabel } from "../crm-ooh-format";

interface Props {
  item: CrmRenewalItem;
  creating: boolean;
  onCreate: () => void;
  onOpenDeal: (dealId: string) => void;
}

function daysLeftBadge(daysLeft: number) {
  if (daysLeft < 0) {
    return { text: `Venció hace ${-daysLeft} d`, className: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400" };
  }
  if (daysLeft === 0) {
    return { text: "Vence hoy", className: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400" };
  }
  return {
    text: `Vence en ${daysLeft} d`,
    className:
      daysLeft <= 15
        ? "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400"
        : daysLeft <= 30
          ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : "border-border text-muted-foreground",
  };
}

export function CrmRenewalRow({ item, creating, onCreate, onOpenDeal }: Props) {
  const Icon = SITE_KIND_ICONS[item.kind];
  const due = daysLeftBadge(item.daysLeft);
  const customer = item.client?.company || item.client?.name || item.customerName;

  return (
    <li className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-start">
      <Icon className="mt-0.5 hidden size-4 shrink-0 text-muted-foreground sm:block" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate font-semibold">{customer}</span>
          {item.brand && item.brand !== customer ? (
            <span className="truncate text-muted-foreground">· {item.brand}</span>
          ) : null}
          <Badge variant="outline" className={due.className}>
            {due.text}
          </Badge>
          {!item.client ? (
            <Badge variant="outline" className="text-muted-foreground">
              Cliente no vinculado
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
          <span>
            {SITE_KIND_LABELS[item.kind]} · {item.reference}
          </span>
          <span>{flightLabel(item.startDate, item.endDate)}</span>
          <span>
            {item.siteCount} {item.kind === "STATIC" ? "caras" : "pantallas"}
            {item.spotsPerDay ? ` · ${item.spotsPerDay} spots/día` : ""}
          </span>
          {item.agencyName ? <span>Agencia: {item.agencyName}</span> : null}
          {item.executiveName ? <span>Ejecutivo: {item.executiveName}</span> : null}
        </div>
        {item.description ? (
          <p className="line-clamp-1 text-xs text-muted-foreground">{item.description}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-row items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
        {item.value != null ? (
          <span className="font-semibold tabular-nums">{formatMoney(item.value)}</span>
        ) : null}
        {item.deal ? (
          <button
            type="button"
            onClick={() => onOpenDeal(item.deal!.id)}
            className="flex items-center gap-1.5 text-xs hover:underline"
          >
            <Badge variant="outline" className={cn(DEAL_STATUS_STYLES[item.deal.status])}>
              {DEAL_STATUS_LABELS[item.deal.status]}
            </Badge>
            <span className="max-w-48 truncate text-muted-foreground">
              {item.deal.stageName} · {item.deal.ownerName}
            </span>
            <ArrowUpRight className="size-3" />
          </button>
        ) : (
          <Button sizeVariant="sm" icon={RefreshCw} loading={creating} onClick={onCreate}>
            Crear renovación
          </Button>
        )}
      </div>
    </li>
  );
}
