"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { useClearPantallasLogs } from "@/api/pantallas/pantallas.mutations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/primitives/ui/table";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ALERT_DAYS } from "./pantallas-const";
import { usePantallas } from "./pantallas-context";
import {
  formatCount,
  formatIso,
  formatMoney,
  formatMoneyRange,
  localIsoDate,
  parseIso,
  plural,
} from "./pantallas-format";
import {
  activePreset,
  describeReportRow,
  onAirCounts,
  presetRange,
  REPORT_INCLUDE,
  REPORT_PRESETS,
  reportBlocks,
  type ReportInclude,
  type ReportRow,
} from "./order-report-logic";
import { downloadOrderReportCsv, downloadOrderReportPdf } from "./download-order-report";
import { OptionButtonGroup } from "./option-button-group";
import { ToneBadge } from "./tone-badge";

const EMPTY_MESSAGES: Record<ReportInclude, string> = {
  all: "No hubo movimientos en el periodo elegido y no hay campañas en las listas.",
  new: "No entraron OP nuevas en el periodo elegido.",
  expiring: `No hay campañas que terminen dentro de ${ALERT_DAYS} días.`,
  expired: "No hay campañas vencidas en las listas.",
};

function Chip({ dot, children }: { dot?: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
      {dot ? <span className={cn("size-1.5 rounded-full", dot)} /> : null}
      {children}
    </span>
  );
}

function ReportTableRow({ row }: { row: ReportRow }) {
  const { board } = usePantallas();
  const view = describeReportRow(row, board, formatIso);
  const daysTone =
    row.validity.state === "EXPIRED"
      ? "text-red-600"
      : row.validity.state === "EXPIRING"
        ? "text-amber-600"
        : "text-muted-foreground";

  return (
    <TableRow className="align-top">
      <TableCell className="whitespace-nowrap tabular-nums">
        {view.date ? (
          <>
            {view.date}
            <div className="text-xs text-muted-foreground">{view.time}</div>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">antes del historial</span>
        )}
      </TableCell>
      <TableCell>
        <b>{row.client}</b>
        {view.campaign ? <div className="text-xs text-muted-foreground">{view.campaign}</div> : null}
        {view.deal ? <div className="text-xs text-pink-600">{view.deal}</div> : null}
      </TableCell>
      <TableCell className="whitespace-nowrap tabular-nums">{formatIso(row.startDate)}</TableCell>
      <TableCell className="whitespace-nowrap tabular-nums">
        {formatIso(row.endDate)}
        {view.daysText ? <div className={cn("text-xs", daysTone)}>{view.daysText}</div> : null}
      </TableCell>
      <TableCell>
        <ToneBadge tone={view.tone}>{view.state}</ToneBadge>
        {view.movedLabel ? <div className="text-xs text-muted-foreground">{view.movedLabel}</div> : null}
        {view.previous ? <div className="text-xs text-muted-foreground">{view.previous}</div> : null}
      </TableCell>
      <TableCell>
        {view.locations.length ? (
          <div className="flex flex-wrap gap-1">
            {view.locations.map((l, i) => (
              <span
                key={i}
                className={cn(
                  "inline-flex items-center gap-1 rounded border bg-muted/40 px-1.5 py-0.5 text-xs",
                  l.paused && "border-violet-400/50 text-violet-700 dark:text-violet-400",
                )}
              >
                {l.screen}
                <b className="tabular-nums">{formatCount(l.spotsPerDay)}</b>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">ya no está al aire</span>
        )}
      </TableCell>
      <TableCell className="text-xs">
        {view.values.total === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-col">
            <b className="text-sm">{formatMoney(view.values.total)}</b>
            <span className="text-muted-foreground">
              mes {formatMoneyRange(view.values.monthlyMin, view.values.monthlyMax)}
            </span>
            <span className="text-muted-foreground">
              spot {formatMoneyRange(view.values.spotMin, view.values.spotMax, true)}
            </span>
            {view.values.missing ? (
              <span className="text-muted-foreground">
                {view.values.missing} {plural(view.values.missing, "pantalla")} sin valor
              </span>
            ) : null}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

function OrderReport({ onClose }: { onClose: () => void }) {
  const { board, logs, canEdit } = usePantallas();
  const clearLogs = useClearPantallasLogs();
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [include, setInclude] = useState<ReportInclude>("all");
  const [generating, setGenerating] = useState(false);

  const blocks = reportBlocks(logs, board, from, to, include);
  const rows = blocks.flatMap((b) => b.rows);
  const visibleBlocks = blocks.filter((b) => b.rows.length);
  const counts = onAirCounts(board);
  const preset = activePreset(from, to);
  const includeOption = REPORT_INCLUDE.find((o) => o.value === include)!;
  const periodLabel =
    !from && !to
      ? "todo el historial"
      : `${from ? formatIso(from) : "el inicio"} → ${to ? formatIso(to) : "hoy"}`;

  const stateCounts = new Map<string, number>();
  let spots = 0;
  for (const row of rows) {
    const view = describeReportRow(row, board, formatIso);
    stateCounts.set(view.state, (stateCounts.get(view.state) ?? 0) + 1);
    spots += view.locations.reduce((sum, l) => sum + l.spotsPerDay, 0);
  }

  async function handlePdf() {
    setGenerating(true);
    try {
      await downloadOrderReportPdf(board, blocks, periodLabel, includeOption.label);
    } catch (err) {
      toast.error(`No se pudo generar el PDF: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGenerating(false);
    }
  }

  function handleClear() {
    if (!logs.length) return;
    if (
      !confirm(
        `Se van a borrar los ${formatCount(logs.length)} movimientos del historial.\n\nEsto NO toca clientes, campañas ni pantallas: solo se pierde el historial del Reporte OP, y el reporte volverá a empezar desde cero.\n\nSi quieres conservarlo, cancela y descarga el CSV primero.\n\n¿Borrar el historial?`,
      )
    ) {
      return;
    }
    const total = logs.length;
    clearLogs.mutate(undefined, {
      onSuccess: () => toast.success(`Historial borrado · ${formatCount(total)} movimientos`),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Reporte OP</DialogTitle>
        <DialogDescription>
          {rows.length} {plural(rows.length, "cliente")} · {periodLabel}
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <DatePicker
            className="w-40"
            label="Desde"
            allowClear
            placeholder="Sin límite"
            value={parseIso(from)}
            onChange={(d) => setFrom(d ? localIsoDate(d) : null)}
          />
          <DatePicker
            className="w-40"
            label="Hasta"
            allowClear
            placeholder="Sin límite"
            value={parseIso(to)}
            onChange={(d) => setTo(d ? localIsoDate(d) : null)}
          />
          <OptionButtonGroup
            label="Periodo"
            options={REPORT_PRESETS.map((p) => ({ value: p.value, label: p.label }))}
            value={preset}
            onChange={(value) => {
              const [a, b] = presetRange(value);
              setFrom(a);
              setTo(b);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <OptionButtonGroup
            label="Qué incluir"
            options={REPORT_INCLUDE.map((o) => ({ value: o.value, label: o.label }))}
            value={include}
            onChange={setInclude}
          />
          <p className="text-xs text-muted-foreground">{includeOption.help}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Chip dot="bg-emerald-500">{counts.CURRENT + counts.EXPIRING} al aire hoy</Chip>
          <Chip dot="bg-amber-500">{counts.EXPIRING} por vencer</Chip>
          <Chip dot="bg-red-500">
            {counts.EXPIRED} {plural(counts.EXPIRED, "vencida")} en lista
          </Chip>
          {counts.SCHEDULED ? (
            <Chip dot="bg-muted-foreground/60">
              {counts.SCHEDULED} {plural(counts.SCHEDULED, "programada")}
            </Chip>
          ) : null}
        </div>
        {rows.length ? (
          <div className="flex flex-wrap gap-1.5">
            {[...stateCounts.entries()].map(([state, count]) => (
              <Chip key={state} dot="bg-sky-500">
                {state.toLowerCase()} · {count}
              </Chip>
            ))}
            <Chip>
              <b className="text-foreground">{formatCount(spots)}</b> spots al aire de estos clientes
            </Chip>
          </div>
        ) : null}

        {rows.length ? (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha de ingreso</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pantallas y frecuencia</TableHead>
                  <TableHead>Valores</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleBlocks.map((block) => (
                  <BlockRows
                    key={block.key}
                    title={block.title}
                    rows={block.rows}
                    showTitle={visibleBlocks.length > 1 || block.key === "onAir"}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {include === "all" && !logs.length
              ? "Todavía no hay movimientos registrados. Desde ahora, cada OP nueva, renovación o extensión queda anotada aquí con su fecha."
              : EMPTY_MESSAGES[include]}
          </p>
        )}
      </DialogBody>
      <DialogFooter className="flex-wrap items-center gap-2 sm:justify-between">
        <span className="text-xs text-muted-foreground">
          {logs.length
            ? `${formatCount(logs.length)} ${plural(logs.length, "movimiento")} en el historial`
            : "El historial está vacío"}
        </span>
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <Button
              variant="outline"
              className="text-red-600"
              disabled={!logs.length || clearLogs.isPending}
              onClick={handleClear}
            >
              Limpiar registros
            </Button>
          ) : null}
          <Button
            variant="outline"
            icon={FileText}
            disabled={!rows.length}
            onClick={() => downloadOrderReportCsv(board, blocks)}
          >
            Descargar CSV
          </Button>
          <Button icon={Download} disabled={!rows.length || generating} onClick={handlePdf}>
            {generating ? "Generando…" : "Guardar PDF"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

function BlockRows({
  title,
  rows,
  showTitle,
}: {
  title: string;
  rows: ReportRow[];
  showTitle: boolean;
}) {
  return (
    <>
      {showTitle ? (
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          <TableCell colSpan={7} className="text-xs">
            <b>{title}</b> · {rows.length} {plural(rows.length, "cliente")}
          </TableCell>
        </TableRow>
      ) : null}
      {rows.map((row) => (
        <ReportTableRow key={`${title}-${row.key}`} row={row} />
      ))}
    </>
  );
}

export function OrderReportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="xl" className="sm:max-w-5xl lg:max-w-6xl">
        <OrderReport onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
