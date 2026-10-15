"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  FileText,
  Lock,
  MapPin,
  RefreshCw,
} from "lucide-react";
import type { CrmDeal } from "@/api/crm/crm.types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/primitives/ui/tooltip";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { calendarDate, clientLabel, timeAgo } from "../crm-format";
import { MEDIA_TYPE_ICONS, MEDIA_TYPE_LABELS, MEDIA_TYPE_STYLES } from "../crm-ooh-const";
import { flightLabel } from "../crm-ooh-format";
import { CrmUserAvatar } from "../shared/crm-user-avatar";

interface CrmDealCardProps {
  deal: CrmDeal;
  dragging: boolean;
  onOpen: (dealId: string) => void;
  onDragStart: (deal: CrmDeal) => void;
  onDragEnd: () => void;
  onDragOverCard: (deal: CrmDeal, placeAfter: boolean) => void;
}

const PRIORITY_BAR: Record<CrmDeal["priority"], string> = {
  LOW: "bg-slate-300 dark:bg-slate-600",
  MEDIUM: "bg-amber-400",
  HIGH: "bg-red-500",
};

export function CrmDealCard({
  deal,
  dragging,
  onOpen,
  onDragStart,
  onDragEnd,
  onDragOverCard,
}: CrmDealCardProps) {
  const client = clientLabel(deal.client);
  const overdueTask = deal.nextTask?.isOverdue ?? false;
  const flight = flightLabel(deal.campaignStart, deal.campaignEnd);
  const MediaIcon = deal.mediaType ? MEDIA_TYPE_ICONS[deal.mediaType] : null;

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onClick={() => onOpen(deal.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(deal.id);
        }
      }}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", deal.id);
        onDragStart(deal);
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        onDragOverCard(deal, e.clientY > rect.top + rect.height / 2);
      }}
      className={cn(
        "group relative flex cursor-grab flex-col gap-2 overflow-hidden border border-border bg-card p-3 pl-3.5 text-left shadow-xs transition-all hover:border-border-strong hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none active:cursor-grabbing",
        dragging && "opacity-40",
        deal.status === "LOST" && "opacity-70",
      )}
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1", PRIORITY_BAR[deal.priority])}
      />
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{deal.title}</p>
        {deal.isStale ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
            </TooltipTrigger>
            <TooltipContent>
              Sin actividad {timeAgo(deal.lastActivityAt)}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      {client || deal.brand ? (
        <p className="-mt-1 truncate text-xs text-muted-foreground">
          {[client, deal.brand && deal.brand !== client ? deal.brand : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}

      {deal.mediaType || flight || deal.renewalOf ? (
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          {deal.mediaType && MediaIcon ? (
            <span
              className={cn(
                "flex items-center gap-1 border px-1.5 py-0.5 font-medium",
                MEDIA_TYPE_STYLES[deal.mediaType],
              )}
            >
              <MediaIcon className="size-3" />
              {MEDIA_TYPE_LABELS[deal.mediaType]}
            </span>
          ) : null}
          {deal.renewalOf ? (
            <span className="flex items-center gap-1 border border-border px-1.5 py-0.5 font-medium text-muted-foreground">
              <RefreshCw className="size-3" />
              Renovación
            </span>
          ) : null}
          {flight ? <span className="text-muted-foreground">{flight}</span> : null}
        </div>
      ) : null}

      {deal.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {deal.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums">
          {formatMoney(deal.value)}
        </span>
        <CrmUserAvatar user={deal.owner} />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {deal.expectedCloseDate ? (
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3" />
            {format(calendarDate(deal.expectedCloseDate), "d MMM", { locale: es })}
          </span>
        ) : null}
        {deal.nextTask ? (
          <span
            className={cn(
              "flex min-w-0 items-center gap-1",
              overdueTask && "font-medium text-red-600 dark:text-red-400",
            )}
          >
            <CalendarClock className="size-3 shrink-0" />
            <span className="truncate">{deal.nextTask.title}</span>
          </span>
        ) : deal.status === "OPEN" ? (
          <span className="text-amber-600 dark:text-amber-400">Sin próxima tarea</span>
        ) : null}
        {deal.offerCount > 0 ? (
          <span className="flex items-center gap-1">
            <FileText className="size-3" />
            {deal.offerCount}
          </span>
        ) : null}
        {deal.siteCount > 0 ? (
          <span className="flex items-center gap-1">
            <MapPin className="size-3" />
            {deal.siteCount}
          </span>
        ) : null}
      </div>

      {deal.heldSiteCount > 0 && deal.nextHoldExpiry ? (
        <div
          className={cn(
            "flex items-center gap-1.5 border px-2 py-1 text-[11px] font-medium",
            deal.holdExpiringSoon
              ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400"
              : "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
          )}
        >
          <Lock className="size-3" />
          {deal.heldSiteCount} reservas · vencen {timeAgo(deal.nextHoldExpiry)}
        </div>
      ) : null}
    </div>
  );
}
