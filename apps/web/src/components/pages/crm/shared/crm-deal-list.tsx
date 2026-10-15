"use client";

import { useCrmDeals } from "@/api/crm/crm.get";
import type { CrmDealsQuery } from "@/api/crm/crm.types";
import { Badge } from "@/components/primitives/ui/badge";
import { formatMoney } from "@/lib/format";
import { DEAL_STATUS_LABELS, DEAL_STATUS_STYLES } from "../crm-const";
import { personName, timeAgo } from "../crm-format";
import { EmptyList, ListSkeleton } from "../dashboard/crm-dashboard-lists";

export function CrmDealList({
  query,
  onOpenDeal,
  emptyMessage = "No hay negocios.",
}: {
  query: CrmDealsQuery;
  onOpenDeal: (dealId: string) => void;
  emptyMessage?: string;
}) {
  const { data: deals = [], isLoading } = useCrmDeals(query);

  if (isLoading) return <ListSkeleton rows={3} />;
  if (deals.length === 0) return <EmptyList message={emptyMessage} />;

  return (
    <ul className="flex flex-col divide-y border border-border">
      {deals.map((deal) => (
        <li key={deal.id}>
          <button
            type="button"
            onClick={() => onOpenDeal(deal.id)}
            className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/40"
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: deal.stage.color ?? undefined }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{deal.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {deal.stage.name} · {personName(deal.owner)} · {timeAgo(deal.lastActivityAt)}
              </p>
            </div>
            <Badge variant="outline" className={DEAL_STATUS_STYLES[deal.status]}>
              {DEAL_STATUS_LABELS[deal.status]}
            </Badge>
            <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums">
              {formatMoney(deal.value)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
