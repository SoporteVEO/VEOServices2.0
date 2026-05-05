"use client";

import { useMemo, useState } from "react";
import { Calendar, ChevronDown, ChevronUp, Mail, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/primitives/ui/button";
import { cn } from "@/lib/utils";
import { formatHumanDate, formatMoney } from "@/lib/format";
import type { BillboardContractHistoryItem } from "@/api/billboards/billboards.get";
import {
  calculateContractDurationDays,
  parseContractDate,
} from "./billboard-detail-utils";

const COLLAPSED_COUNT = 5;

interface BillboardContractsListProps {
  contracts: BillboardContractHistoryItem[];
}

export function BillboardContractsList({
  contracts,
}: BillboardContractsListProps) {
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(
    () =>
      [...contracts].sort(
        (a, b) =>
          parseContractDate(b.startDate).getTime() -
          parseContractDate(a.startDate).getTime(),
      ),
    [contracts],
  );

  const visible = showAll ? sorted : sorted.slice(0, COLLAPSED_COUNT);
  const hasMore = sorted.length > COLLAPSED_COUNT;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">
              Historial de contratos ({sorted.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Ordenados del más reciente al más antiguo
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No hay contratos registrados para esta valla.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visible.map((c) => (
              <ContractListItem key={c.contractDetailSourceId} contract={c} today={today} />
            ))}
          </ul>
        )}

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setShowAll((s) => !s)}
          >
            {showAll ? <ChevronUp /> : <ChevronDown />}
            {showAll
              ? "Mostrar menos"
              : `Ver ${sorted.length - COLLAPSED_COUNT} más`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ContractListItem({
  contract,
  today,
}: {
  contract: BillboardContractHistoryItem;
  today: Date;
}) {
  const start = parseContractDate(contract.startDate);
  const end = parseContractDate(contract.endDate);
  const durationDays = calculateContractDurationDays(start, end);

  const status: "past" | "active" | "future" =
    end < today ? "past" : start > today ? "future" : "active";

  return (
    <li className="flex flex-col gap-2 rounded-md border bg-accent/10 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold tabular-nums">
              {contract.contractNumber ?? "—"}
            </span>
            <ContractStatusBadge status={status} />
          </div>
          {contract.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {contract.description}
            </p>
          )}
        </div>
        {contract.price != null && (
          <span className="shrink-0 text-sm font-semibold tabular-nums">
            {formatMoney(contract.price)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="size-3" />
          {formatHumanDate(start)} → {formatHumanDate(end)}
        </span>
        <span className="tabular-nums">
          {durationDays} {durationDays === 1 ? "día" : "días"}
        </span>
      </div>

      {(contract.customerName || contract.customerEmail) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {contract.customerName && (
            <span className="flex items-center gap-1 text-foreground">
              <User className="size-3 text-muted-foreground" />
              <span className="truncate max-w-[180px]">
                {contract.customerName}
              </span>
            </span>
          )}
          {contract.customerEmail && (
            <a
              href={`mailto:${contract.customerEmail}`}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="size-3" />
              <span className="truncate max-w-[180px]">
                {contract.customerEmail}
              </span>
            </a>
          )}
        </div>
      )}
    </li>
  );
}

function ContractStatusBadge({
  status,
}: {
  status: "past" | "active" | "future";
}) {
  const map = {
    past: {
      label: "Finalizado",
      className: "bg-muted text-muted-foreground border-transparent",
    },
    active: {
      label: "Activo",
      className:
        "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-transparent",
    },
    future: {
      label: "Próximo",
      className:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent",
    },
  } as const;
  const item = map[status];
  return <Badge className={cn(item.className, "h-4 text-[10px]")}>{item.label}</Badge>;
}
