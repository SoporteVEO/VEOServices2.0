"use client";

import { useState } from "react";
import { ExternalLink, FileDown, Pencil, Undo2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { DigitalOrder, PantallasBoard } from "@/api/pantallas/pantallas.types";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/primitives/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ART_FORMAT_LABELS,
  DEAL_BADGE_CLASS,
  DEAL_SHORT_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONE,
  TONE_BORDER_CLASS,
} from "../pantallas/pantallas-const";
import {
  formatCount,
  formatIso,
  formatMoney,
  formatSpotMoney,
  formatTimestamp,
} from "../pantallas/pantallas-format";
import { describePlan, planPlacement } from "../pantallas/pantallas-logic";
import { ToneBadge } from "../pantallas/tone-badge";
import { downloadOrderPdf } from "./download-order-pdf";
import { agencyLabel, orderTotals, shortLink } from "./pantallas-orders-logic";

function PlanHint({
  order,
  screenId,
  spotsPerDay,
  board,
  refDate,
}: {
  order: DigitalOrder;
  screenId: string | null;
  spotsPerDay: number;
  board: PantallasBoard;
  refDate: string;
}) {
  const screen = board.screens.find((s) => s.id === screenId);
  if (!screen) return null;
  const plan = planPlacement(
    screen,
    {
      client: order.client,
      campaign: order.campaign,
      startDate: order.startDate,
      endDate: order.endDate,
      spotsPerDay,
    },
    board.settings,
    refDate,
  );
  return (
    <span
      className={cn(
        "block text-xs font-normal text-muted-foreground",
        plan.type === "new" && "text-amber-600 dark:text-amber-400",
        plan.type === "duplicate" && "text-red-600 dark:text-red-400",
      )}
    >
      {describePlan(plan, true)}
    </span>
  );
}

export function OrderCard({
  order,
  board,
  refDate,
  canEdit,
  canRequest,
  onIngest,
  onReturn,
  onCorrect,
}: {
  order: DigitalOrder;
  board: PantallasBoard;
  refDate: string;
  canEdit: boolean;
  canRequest: boolean;
  onIngest: (order: DigitalOrder) => void;
  onReturn: (order: DigitalOrder) => void;
  onCorrect: (order: DigitalOrder) => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const { days, spots } = orderTotals(order);
  const pending = order.status === "PENDING";
  const tone = ORDER_STATUS_TONE[order.status];

  async function handlePdf() {
    setDownloading(true);
    try {
      await downloadOrderPdf(order);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo generar el PDF");
    } finally {
      setDownloading(false);
    }
  }

  const footerText =
    order.status === "INGESTED" && order.ingestedAt
      ? `Ingresada ${formatTimestamp(order.ingestedAt)}${order.ingestedBy ? ` por ${order.ingestedBy}` : ""}`
      : `${order.revision > 1 ? "Corregida" : "Creada"} ${formatTimestamp(order.updatedAt)}${order.createdByName ? ` por ${order.createdByName}` : ""}`;

  return (
    <article
      className={cn(
        "flex flex-col gap-3 border border-l-4 border-border/80 bg-card px-4 py-4",
        TONE_BORDER_CLASS[tone],
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-mono text-xs text-muted-foreground">
            {order.code}
            {order.revision > 1 ? ` · corrección ${order.revision}` : ""}
          </span>
          <p className="text-sm font-semibold">
            {order.client}
            {order.campaign ? (
              <span className="font-normal text-muted-foreground"> · {order.campaign}</span>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatIso(order.startDate)} a {formatIso(order.endDate)} · {days} días · arte{" "}
            {ART_FORMAT_LABELS[order.artFormat].toLowerCase()} · {order.executive} ·{" "}
            {order.hasAgency ? agencyLabel(order) : "directo"}
          </p>
        </div>
        <ToneBadge tone={tone}>{ORDER_STATUS_LABELS[order.status]}</ToneBadge>
      </header>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pantalla</TableHead>
              <TableHead className="text-right">Spots/día</TableHead>
              <TableHead className="text-right">Spots vigencia</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Costo x spot</TableHead>
              <TableHead>Modalidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.screens.map((screen) => (
              <TableRow key={screen.screenId ?? screen.screenName}>
                <TableCell className="font-medium">
                  {screen.screenName}
                  {pending ? (
                    <PlanHint
                      order={order}
                      screenId={screen.screenId}
                      spotsPerDay={screen.spotsPerDay}
                      board={board}
                      refDate={refDate}
                    />
                  ) : null}
                </TableCell>
                <TableCell className="text-right">{formatCount(screen.spotsPerDay)}</TableCell>
                <TableCell className="text-right">
                  {formatCount(screen.spotsPerDay * days)}
                </TableCell>
                <TableCell className="text-right">{formatMoney(screen.monthlyValue)}</TableCell>
                <TableCell className="text-right">{formatSpotMoney(screen.spotValue)}</TableCell>
                <TableCell>
                  <ToneBadge tone="muted" className={DEAL_BADGE_CLASS[screen.deal]}>
                    {DEAL_SHORT_LABELS[screen.deal]}
                  </ToneBadge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell />
              <TableCell className="text-right font-semibold">{formatCount(spots)}</TableCell>
              <TableCell className="text-right font-semibold">
                {formatMoney(order.totalValue)}
              </TableCell>
              <TableCell />
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {order.links.length ? (
        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">
            Enlace{order.links.length === 1 ? "" : "s"} de descarga
          </p>
          {order.links.map((link, index) => (
            <a
              key={link}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              title={link}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="size-3" />
              Arte {index + 1} · {shortLink(link, 72)}
            </a>
          ))}
        </div>
      ) : null}

      {order.instructions ? (
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <p className="text-xs font-medium text-muted-foreground">Indicaciones especiales</p>
          {order.instructions}
        </div>
      ) : null}

      {order.status === "RETURNED" && order.returnReason ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          <b>Devuelta:</b> {order.returnReason}
        </div>
      ) : null}

      <footer className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {footerText} · valor mensual {formatMoney(order.monthlyValue)}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            sizeVariant="sm"
            icon={FileDown}
            disabled={downloading}
            onClick={handlePdf}
          >
            {downloading ? "Generando…" : "Ver PDF"}
          </Button>
          {canRequest && order.status !== "INGESTED" ? (
            <Button variant="outline" sizeVariant="sm" icon={Pencil} onClick={() => onCorrect(order)}>
              Corregir y reenviar
            </Button>
          ) : null}
          {canEdit && pending ? (
            <>
              <Button variant="outline" sizeVariant="sm" icon={Undo2} onClick={() => onReturn(order)}>
                Devolver a Soporte
              </Button>
              <Button sizeVariant="sm" icon={Upload} onClick={() => onIngest(order)}>
                Ingresar a las listas
              </Button>
            </>
          ) : null}
        </div>
      </footer>
    </article>
  );
}
