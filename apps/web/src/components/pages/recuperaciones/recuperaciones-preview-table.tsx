"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import type {
  BriloBanco,
  BriloTipoAbono,
} from "@/api/brilo-webapi/brilo-webapi.types";
import { Checkbox } from "@/components/primitives/ui/checkbox";
import { Status, StatusLabel } from "@/components/primitives/ui/status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/primitives/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { RecuperacionRowState } from "./recuperaciones-types";

interface RecuperacionesPreviewTableProps {
  rows: RecuperacionRowState[];
  bancos: BriloBanco[];
  tiposAbono: BriloTipoAbono[];
  onUpdateRow: (rowKey: string, patch: Partial<RecuperacionRowState>) => void;
  onToggleRow: (rowKey: string, include: boolean) => void;
  onToggleAll: (include: boolean) => void;
}

export function RecuperacionesPreviewTable({
  rows,
  bancos,
  tiposAbono,
  onUpdateRow,
  onToggleRow,
  onToggleAll,
}: RecuperacionesPreviewTableProps) {
  const selectedCount = useMemo(
    () => rows.filter((r) => r.includeInUpload).length,
    [rows],
  );
  const allSelected = rows.length > 0 && selectedCount === rows.length;
  const someSelected = selectedCount > 0 && selectedCount < rows.length;
  const headerCheckboxState: boolean | "indeterminate" = allSelected
    ? true
    : someSelected
      ? "indeterminate"
      : false;

  return (
    <Table containerClassName="overflow-visible border-0">
      <TableHeader className="sticky top-0 z-10 bg-muted [&_th]:bg-muted [&_th]:shadow-[inset_0_-1px_0_hsl(var(--border))]">
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-10">
            <Checkbox
              checked={headerCheckboxState}
              onCheckedChange={(value) => onToggleAll(Boolean(value))}
              aria-label="Seleccionar todas"
            />
          </TableHead>
          <TableHead className="w-14">#</TableHead>
          <TableHead className="min-w-[220px]">Cliente</TableHead>
          <TableHead>Tipo Fact.</TableHead>
          <TableHead className="min-w-[260px]">Núm. Factura</TableHead>
          <TableHead className="min-w-[150px]">Fecha Abono</TableHead>
          <TableHead className="min-w-[140px]">Monto</TableHead>
          <TableHead className="min-w-[170px]">Tipo Abono</TableHead>
          <TableHead className="min-w-[180px]">Banco</TableHead>
          <TableHead className="min-w-[160px]">Núm. Cheque/Doc.</TableHead>
          <TableHead className="min-w-[120px]">Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <RecuperacionRow
            key={row.parsed.rowKey}
            row={row}
            bancos={bancos}
            tiposAbono={tiposAbono}
            onUpdateRow={onUpdateRow}
            onToggleRow={onToggleRow}
          />
        ))}
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={11}
              className="h-24 text-center text-muted-foreground"
            >
              No hay filas para mostrar.
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}

interface RecuperacionRowProps {
  row: RecuperacionRowState;
  bancos: BriloBanco[];
  tiposAbono: BriloTipoAbono[];
  onUpdateRow: (rowKey: string, patch: Partial<RecuperacionRowState>) => void;
  onToggleRow: (rowKey: string, include: boolean) => void;
}

function RecuperacionRow({
  row,
  bancos,
  tiposAbono,
  onUpdateRow,
  onToggleRow,
}: RecuperacionRowProps) {
  const isExcluded = !row.includeInUpload;
  const isLocked = row.status === "submitting" || row.status === "success";
  const rowKey = row.parsed.rowKey;

  return (
    <TableRow
      className={cn(
        isExcluded && "bg-muted/40 opacity-70",
        row.status === "success" && "bg-green-500/5",
        row.status === "error" && "bg-destructive/5",
      )}
    >
      <TableCell>
        <Checkbox
          checked={row.includeInUpload}
          onCheckedChange={(value) => onToggleRow(rowKey, Boolean(value))}
          disabled={isLocked}
          aria-label="Incluir fila"
        />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground tabular-nums">
        {row.parsed.sheetName}
        <br />
        <span className="text-[10px]">Fila {row.parsed.excelRow}</span>
      </TableCell>
      <TableCell className="text-sm">
        <div
          className="max-w-[300px] truncate font-medium"
          title={row.parsed.cliente}
        >
          {row.parsed.cliente}
        </div>
        {row.parsed.categoria ? (
          <div className="text-[11px] text-muted-foreground truncate">
            {row.parsed.categoria}
          </div>
        ) : null}
      </TableCell>
      <TableCell>
        <Input
          value={row.tipoFactura}
          onChange={(e) =>
            onUpdateRow(rowKey, {
              tipoFactura: e.target.value.toUpperCase(),
            })
          }
          disabled={isLocked || isExcluded}
          className="h-8 w-20 px-2 py-1 text-sm"
        />
      </TableCell>
      <TableCell>
        <Input
          value={row.numFactura}
          onChange={(e) => onUpdateRow(rowKey, { numFactura: e.target.value })}
          disabled={isLocked || isExcluded}
          className="h-8 w-full px-2 py-1 text-xs font-mono"
        />
      </TableCell>
      <TableCell>
        <Input
          type="date"
          value={row.fechaAbono}
          onChange={(e) => onUpdateRow(rowKey, { fechaAbono: e.target.value })}
          disabled={isLocked || isExcluded}
          className="h-8 w-full px-2 py-1 text-sm"
        />
      </TableCell>
      <TableCell>
        <Input
          step="0.01"
          min="0"
          value={Number.isFinite(row.monto) ? row.monto : 0}
          onChange={(e) => {
            const v = Number(e.target.value);
            onUpdateRow(rowKey, { monto: Number.isFinite(v) ? v : 0 });
          }}
          disabled={isLocked || isExcluded}
          className="h-8 w-full px-2 py-1 text-sm text-right tabular-nums"
        />
      </TableCell>
      <TableCell>
        <Select
          value={row.tipoAbono || undefined}
          onValueChange={(value) => onUpdateRow(rowKey, { tipoAbono: value })}
          disabled={isLocked || isExcluded}
        >
          <SelectTrigger sizeVariant="sm" className="w-full">
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            {tiposAbono.map((t) => (
              <SelectItem key={t.tabId} value={t.tabCodigo}>
                {t.tabCodigo} — {t.tabNombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={row.bancoCodigo || "__none__"}
          onValueChange={(value) =>
            onUpdateRow(rowKey, {
              bancoCodigo: value === "__none__" ? "" : value,
            })
          }
          disabled={isLocked || isExcluded}
        >
          <SelectTrigger sizeVariant="sm" className="w-full">
            <SelectValue placeholder="Sin banco" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Sin banco</SelectItem>
            {bancos.map((b) => (
              <SelectItem key={b.bcoId} value={b.bcoCodigo}>
                {b.bcoNombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {row.parsed.bancoExcel && !row.bancoCodigo ? (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-3" /> Excel: {row.parsed.bancoExcel}
          </div>
        ) : null}
      </TableCell>
      <TableCell>
        <Input
          value={row.numDocAbono}
          onChange={(e) => onUpdateRow(rowKey, { numDocAbono: e.target.value })}
          disabled={isLocked || isExcluded}
          className="h-8 w-full px-2 py-1 text-sm"
        />
      </TableCell>
      <TableCell>
        <RecuperacionRowStatusBadge row={row} />
      </TableCell>
    </TableRow>
  );
}

function RecuperacionRowStatusBadge({ row }: { row: RecuperacionRowState }) {
  if (row.status === "skipped") {
    return (
      <Status variant="default">
        <StatusLabel>Omitido</StatusLabel>
      </Status>
    );
  }
  if (row.status === "submitting") {
    return (
      <Status variant="info">
        <Loader2 className="size-3 animate-spin" />
        <StatusLabel>Enviando</StatusLabel>
      </Status>
    );
  }
  if (row.status === "success") {
    return (
      <Status variant="success">
        <CheckCircle2 className="size-3" />
        <StatusLabel>Exitoso</StatusLabel>
      </Status>
    );
  }
  if (row.status === "error") {
    return (
      <div className="flex flex-col items-start gap-1">
        <Status variant="error">
          <XCircle className="size-3" />
          <StatusLabel>Error</StatusLabel>
        </Status>
        {row.errorMessage ? (
          <span
            className="max-w-[180px] truncate text-[10px] text-destructive"
            title={row.errorMessage}
          >
            {row.errorMessage}
          </span>
        ) : null}
      </div>
    );
  }
  return (
    <Status variant="warning">
      <StatusLabel>Pendiente</StatusLabel>
    </Status>
  );
}
