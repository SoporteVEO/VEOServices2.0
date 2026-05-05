"use client";

import { useMemo } from "react";
import { CircleCheck, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/primitives/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatHumanDate, formatMoney } from "@/lib/format";
import type { BillboardContractHistoryItem } from "@/api/billboards/billboards.get";
import {
  calculateContractDurationDays,
  parseContractDate,
} from "./billboard-detail-utils";

const DAY_MS = 86_400_000;
const MIN_TIMELINE_BAR_PERCENT = 0.4;

interface BillboardContractsTimelineProps {
  contracts: BillboardContractHistoryItem[];
}

type TimelineSegment = {
  type: "contract" | "available" | "today";
  start: Date;
  end: Date;
  contract?: BillboardContractHistoryItem;
};

export function BillboardContractsTimeline({
  contracts,
}: BillboardContractsTimelineProps) {
  const timeline = useMemo(() => buildTimeline(contracts), [contracts]);

  if (!timeline) {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">Línea de tiempo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Sin contratos registrados aún. La valla está disponible para nuevas
            ventas.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { segments, rangeStart, rangeEnd, today } = timeline;
  const totalSpan = rangeEnd.getTime() - rangeStart.getTime();
  const todayPercent =
    ((today.getTime() - rangeStart.getTime()) / totalSpan) * 100;

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">Línea de tiempo</CardTitle>
            <CardDescription className="text-xs">
              Historial y disponibilidad: {formatHumanDate(rangeStart)} —{" "}
              {formatHumanDate(rangeEnd)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-12 w-full overflow-hidden rounded-md bg-accent/40">
          {segments.map((seg, idx) => {
            const startPct =
              ((seg.start.getTime() - rangeStart.getTime()) / totalSpan) * 100;
            const widthPct = Math.max(
              ((seg.end.getTime() - seg.start.getTime()) / totalSpan) * 100,
              MIN_TIMELINE_BAR_PERCENT,
            );
            return (
              <Tooltip key={`${seg.type}-${idx}`}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "absolute inset-y-0 transition-all",
                      seg.type === "contract" &&
                        "bg-primary/80 hover:bg-primary",
                      seg.type === "available" &&
                        "border-y-2 border-dashed border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20",
                    )}
                    style={{
                      insetInlineStart: `${startPct}%`,
                      width: `${widthPct}%`,
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent side="top">
                  {seg.type === "contract" && seg.contract ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">
                        Contrato {seg.contract.contractNumber ?? "—"}
                      </span>
                      <span className="text-[11px] opacity-90">
                        {formatHumanDate(seg.start)} →{" "}
                        {formatHumanDate(seg.end)}
                      </span>
                      {seg.contract.customerName && (
                        <span className="text-[11px] opacity-90">
                          Cliente: {seg.contract.customerName}
                        </span>
                      )}
                      {seg.contract.price != null && (
                        <span className="text-[11px] opacity-90">
                          Precio: {formatMoney(seg.contract.price)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">Disponible</span>
                      <span className="text-[11px] opacity-90">
                        {formatHumanDate(seg.start)} →{" "}
                        {formatHumanDate(seg.end)}
                      </span>
                      <span className="text-[11px] opacity-90">
                        {calculateContractDurationDays(seg.start, seg.end)} días
                        libres
                      </span>
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}

          {todayPercent >= 0 && todayPercent <= 100 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="absolute inset-y-0 z-10 w-px bg-yellow-500"
                  style={{ insetInlineStart: `${todayPercent}%` }}
                >
                  <span className="absolute -top-1 -translate-x-1/2 rtl:translate-x-1/2 size-2 rounded-full bg-yellow-500" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <span className="text-[11px]">
                  Hoy · {formatHumanDate(today)}
                </span>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{formatHumanDate(rangeStart)}</span>
          <span>{formatHumanDate(rangeEnd)}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary/80" />
            Contrato
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm border-2 border-dashed border-emerald-500/40 bg-emerald-500/10" />
            Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-yellow-500" />
            Hoy
          </span>
        </div>

        <NextAvailability segments={segments} today={today} />
      </CardContent>
    </Card>
  );
}

function NextAvailability({
  segments,
  today,
}: {
  segments: TimelineSegment[];
  today: Date;
}) {
  const currentContract = segments.find(
    (s) => s.type === "contract" && s.start <= today && s.end >= today,
  );
  const nextAvailability = segments.find(
    (s) => s.type === "available" && s.end >= today,
  );

  if (!currentContract && !nextAvailability) return null;

  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {currentContract && (
        <div className="flex items-start gap-2 rounded-md border border-rose-500/20 bg-rose-500/5 p-2.5">
          <Clock className="mt-0.5 size-4 shrink-0 text-rose-500" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
              Ocupada hasta
            </span>
            <span className="text-sm font-semibold">
              {formatHumanDate(currentContract.end)}
            </span>
            {currentContract.contract?.customerName && (
              <span className="text-[11px] text-muted-foreground truncate">
                {currentContract.contract.customerName}
              </span>
            )}
          </div>
        </div>
      )}

      {nextAvailability && (
        <div className="flex items-start gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2.5">
          <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {nextAvailability.start <= today
                ? "Disponible ahora"
                : "Próxima disponibilidad"}
            </span>
            <span className="text-sm font-semibold">
              {nextAvailability.start <= today
                ? `Hasta ${formatHumanDate(nextAvailability.end)}`
                : `${formatHumanDate(nextAvailability.start)}`}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {calculateContractDurationDays(
                nextAvailability.start <= today
                  ? today
                  : nextAvailability.start,
                nextAvailability.end,
              )}{" "}
              días libres
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

type Timeline = {
  segments: TimelineSegment[];
  rangeStart: Date;
  rangeEnd: Date;
  today: Date;
};

function buildTimeline(
  contracts: BillboardContractHistoryItem[],
): Timeline | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedContracts = [...contracts]
    .filter((c) => {
      const s = parseContractDate(c.startDate);
      const e = parseContractDate(c.endDate);
      return !isNaN(s.getTime()) && !isNaN(e.getTime());
    })
    .sort(
      (a, b) =>
        parseContractDate(a.startDate).getTime() -
        parseContractDate(b.startDate).getTime(),
    );

  if (sortedContracts.length === 0) return null;

  const earliestStart = parseContractDate(sortedContracts[0]!.startDate);
  const latestEnd = sortedContracts.reduce((max, c) => {
    const e = parseContractDate(c.endDate);
    return e > max ? e : max;
  }, parseContractDate(sortedContracts[0]!.endDate));

  const rangeStart = earliestStart < today ? earliestStart : today;
  const rangeEndCandidate = latestEnd > today ? latestEnd : today;
  const oneYearFromNow = new Date(today);
  oneYearFromNow.setFullYear(today.getFullYear() + 1);
  const rangeEnd =
    rangeEndCandidate > oneYearFromNow ? rangeEndCandidate : oneYearFromNow;

  const segments: TimelineSegment[] = [];
  let cursor = rangeStart;

  for (const contract of sortedContracts) {
    const start = parseContractDate(contract.startDate);
    const end = parseContractDate(contract.endDate);

    if (start.getTime() > cursor.getTime()) {
      segments.push({
        type: "available",
        start: new Date(cursor),
        end: new Date(start.getTime() - DAY_MS),
      });
    }

    segments.push({ type: "contract", start, end, contract });

    const nextCursor = new Date(end.getTime() + DAY_MS);
    if (nextCursor > cursor) cursor = nextCursor;
  }

  if (cursor < rangeEnd) {
    segments.push({ type: "available", start: cursor, end: rangeEnd });
  }

  return { segments, rangeStart, rangeEnd, today };
}
