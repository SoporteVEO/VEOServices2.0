"use client";

import { Smile } from "lucide-react";
import { ALERT_DAYS } from "./pantallas-const";
import { usePantallas } from "./pantallas-context";
import { formatCount, formatIso, formatTimestamp, plural } from "./pantallas-format";
import { boardTotals, latestOrder, upcomingExpirations } from "./pantallas-logic";
import { KpiCard } from "./kpi-card";
import { OccupancyBar } from "./occupancy-bar";
import { useRotatingIndex } from "./use-rotating-index";

function NextExpirationCard() {
  const { board, refDate, goToScreen } = usePantallas();
  const list = upcomingExpirations(board, refDate);
  const index = useRotatingIndex(list.length, 5000);
  const item = list[index];

  if (!item) {
    return (
      <KpiCard
        label="Próxima OP a vencer"
        value={
          <span className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Smile className="size-5" />
            Ninguna
          </span>
        }
        note={`nada vence en los próximos ${ALERT_DAYS} días`}
      />
    );
  }

  const when =
    item.days <= 0 ? "vence hoy" : item.days === 1 ? "vence mañana" : `faltan ${item.days} días`;
  return (
    <KpiCard
      label={
        <span className="flex items-center justify-between gap-2">
          Próxima OP a vencer
          {list.length > 1 ? (
            <span className="tabular-nums text-muted-foreground/70">
              {index + 1}/{list.length}
            </span>
          ) : null}
        </span>
      }
      value={item.campaign.client}
      valueClassName={item.days <= 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}
      note={`${when} · ${formatIso(item.campaign.endDate)}${item.campaign.paused ? " · en pausa" : ""}`}
      title={`${item.campaign.client} · ${item.screen.name} · ${item.sublist.name} · ${formatCount(item.campaign.spotsPerDay)} spots`}
      onClick={() => goToScreen(item.screen.id)}
    />
  );
}

export function SummaryKpis() {
  const { board, logs, refDate, openDialog } = usePantallas();
  const totals = boardTotals(board, refDate);
  const order = latestOrder(logs, board);
  const { EXPIRING, PAUSED, FINISHED, SCHEDULED } = totals.byStatus;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,13.5rem),1fr))] gap-3">
      <KpiCard
        label="Última OP ingresada"
        value={order ? order.client : <span className="text-muted-foreground">—</span>}
        note={
          order ? (
            <>
              {formatTimestamp(order.createdAt)} · {order.screens}{" "}
              {plural(order.screens, "pantalla")} · {formatCount(order.spots)} spots
              {order.campaign ? <span className="block">{order.campaign}</span> : null}
            </>
          ) : (
            "aún no se ha registrado ninguna"
          )
        }
        onClick={order ? () => openDialog({ type: "report" }) : undefined}
      />
      <NextExpirationCard />
      <KpiCard
        label="Ocupación global"
        value={`${totals.pct.toFixed(1)}%`}
        note={`${formatCount(totals.used)} de ${formatCount(totals.capacity)} spots`}
        extra={<OccupancyBar pct={totals.pct} className="mt-1 h-1.5" />}
      />
      <KpiCard
        label={`Por vencer (${ALERT_DAYS} días)`}
        value={EXPIRING}
        valueClassName={EXPIRING ? "text-amber-600 dark:text-amber-400" : undefined}
        note="requieren renovación o retiro"
      />
      <KpiCard
        label="Pausadas"
        value={PAUSED}
        valueClassName={PAUSED ? "text-violet-600 dark:text-violet-400" : undefined}
        note={
          PAUSED
            ? `${formatCount(totals.pausedSpots)} spots detenidos`
            : "ninguna campaña detenida"
        }
      />
      <KpiCard
        label="Finalizadas"
        value={FINISHED}
        valueClassName={FINISHED ? "text-red-600 dark:text-red-400" : undefined}
        note="listas para liberar espacio"
      />
      <KpiCard
        label="Programadas"
        value={SCHEDULED}
        note={`inician después del ${formatIso(refDate)}`}
      />
    </div>
  );
}
