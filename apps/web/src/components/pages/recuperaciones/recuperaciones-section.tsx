"use client";

import { useMemo, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useBriloCatalogos } from "@/api/brilo-webapi/brilo-webapi.get";
import { processRecuperaciones } from "@/api/brilo-webapi/brilo-webapi.post";
import type { RecuperacionRowPayload } from "@/api/brilo-webapi/brilo-webapi.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import {
  buildInitialRowState,
  buildRowPayload,
} from "./recuperaciones-row-state";
import type { ParsedRecuperacionWorkbook } from "./parse-recuperaciones-excel";
import { RecuperacionesFileInput } from "./recuperaciones-file-input";
import { RecuperacionesPreviewTable } from "./recuperaciones-preview-table";
import type {
  RecuperacionRowState,
  RecuperacionRowStatus,
} from "./recuperaciones-types";

interface WorkbookState {
  fileName: string;
  parsed: ParsedRecuperacionWorkbook;
}

export function RecuperacionesSection() {
  const catalogosQuery = useBriloCatalogos();
  const bancos = useMemo(
    () => catalogosQuery.data?.bancos ?? [],
    [catalogosQuery.data?.bancos],
  );
  const tiposAbono = useMemo(
    () => catalogosQuery.data?.tiposAbono ?? [],
    [catalogosQuery.data?.tiposAbono],
  );

  const [workbook, setWorkbook] = useState<WorkbookState | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [rowsBySheet, setRowsBySheet] = useState<
    Record<string, RecuperacionRowState[]>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleWorkbookParsed(
    parsed: ParsedRecuperacionWorkbook,
    file: File,
  ) {
    if (!catalogosQuery.data) {
      toast.error(
        "Aún se están cargando los catálogos de Brilo. Intenta nuevamente en unos segundos.",
      );
      return;
    }

    const nextRowsBySheet: Record<string, RecuperacionRowState[]> = {};
    for (const sheet of parsed.sheets) {
      nextRowsBySheet[sheet.sheetName] = sheet.rows.map((row) =>
        buildInitialRowState(row, bancos, tiposAbono),
      );
    }

    setWorkbook({ fileName: file.name, parsed });
    setRowsBySheet(nextRowsBySheet);
    setSelectedSheet(parsed.sheets[0]?.sheetName ?? "");
  }

  function handleReset() {
    setWorkbook(null);
    setRowsBySheet({});
    setSelectedSheet("");
  }

  function handleUpdateRow(
    rowKey: string,
    patch: Partial<RecuperacionRowState>,
  ) {
    if (!selectedSheet) return;
    setRowsBySheet((prev) => {
      const sheetRows = prev[selectedSheet];
      if (!sheetRows) return prev;
      const updated = sheetRows.map((r) =>
        r.parsed.rowKey === rowKey ? { ...r, ...patch } : r,
      );
      return { ...prev, [selectedSheet]: updated };
    });
  }

  function handleToggleRow(rowKey: string, include: boolean) {
    handleUpdateRow(rowKey, {
      includeInUpload: include,
      status: include ? "pending" : "skipped",
      errorMessage: undefined,
    });
  }

  function handleToggleAll(include: boolean) {
    if (!selectedSheet) return;
    setRowsBySheet((prev) => {
      const sheetRows = prev[selectedSheet];
      if (!sheetRows) return prev;
      const updated: RecuperacionRowState[] = sheetRows.map((r) => {
        const nextStatus: RecuperacionRowStatus = include
          ? r.status === "success"
            ? "success"
            : "pending"
          : "skipped";
        return {
          ...r,
          includeInUpload: include,
          status: nextStatus,
          errorMessage: include ? undefined : r.errorMessage,
        };
      });
      return { ...prev, [selectedSheet]: updated };
    });
  }

  const currentRows = useMemo(
    () => rowsBySheet[selectedSheet] ?? [],
    [rowsBySheet, selectedSheet],
  );

  const summary = useMemo(() => {
    const included = currentRows.filter((r) => r.includeInUpload);
    const totalAmount = included.reduce((sum, r) => sum + r.monto, 0);
    const successCount = currentRows.filter(
      (r) => r.status === "success",
    ).length;
    const errorCount = currentRows.filter((r) => r.status === "error").length;
    return {
      total: currentRows.length,
      included: included.length,
      totalAmount,
      successCount,
      errorCount,
    };
  }, [currentRows]);

  async function handleSubmit() {
    if (!selectedSheet) return;
    const sheetRows = rowsBySheet[selectedSheet];
    if (!sheetRows) return;

    const payloads: RecuperacionRowPayload[] = [];
    const validationErrors: { rowKey: string; message: string }[] = [];
    const rowsToSubmitKeys = new Set<string>();

    for (const row of sheetRows) {
      if (!row.includeInUpload) continue;
      if (row.status === "success") continue;
      const { payload, validationError } = buildRowPayload(row);
      if (validationError) {
        validationErrors.push({
          rowKey: row.parsed.rowKey,
          message: validationError,
        });
        continue;
      }
      payloads.push(payload);
      rowsToSubmitKeys.add(row.parsed.rowKey);
    }

    if (validationErrors.length > 0) {
      setRowsBySheet((prev) => {
        const rows = prev[selectedSheet];
        if (!rows) return prev;
        const errMap = new Map(
          validationErrors.map((e) => [e.rowKey, e.message]),
        );
        return {
          ...prev,
          [selectedSheet]: rows.map((r) =>
            errMap.has(r.parsed.rowKey)
              ? {
                  ...r,
                  status: "error",
                  errorMessage: errMap.get(r.parsed.rowKey),
                }
              : r,
          ),
        };
      });
    }

    if (payloads.length === 0) {
      toast.warning(
        validationErrors.length > 0
          ? "Algunas filas tienen errores de validación. Corrígelas antes de continuar."
          : "No hay filas válidas para enviar.",
      );
      return;
    }

    setIsSubmitting(true);
    setRowsBySheet((prev) => {
      const rows = prev[selectedSheet];
      if (!rows) return prev;
      return {
        ...prev,
        [selectedSheet]: rows.map((r) =>
          rowsToSubmitKeys.has(r.parsed.rowKey)
            ? { ...r, status: "submitting", errorMessage: undefined }
            : r,
        ),
      };
    });

    try {
      const result = await processRecuperaciones(payloads);
      const byKey = new Map(result.results.map((r) => [r.rowKey, r]));

      setRowsBySheet((prev) => {
        const rows = prev[selectedSheet];
        if (!rows) return prev;
        return {
          ...prev,
          [selectedSheet]: rows.map((r) => {
            const res = byKey.get(r.parsed.rowKey);
            if (!res) return r;
            if (res.ok) {
              return {
                ...r,
                status: "success",
                errorMessage: undefined,
                response: res.response,
              };
            }
            return {
              ...r,
              status: "error",
              errorMessage: res.error ?? "Error desconocido.",
            };
          }),
        };
      });

      if (result.errorCount === 0) {
        toast.success(`Se subieron ${result.successCount} abonos a Brilo.`);
      } else {
        toast.warning(
          `${result.successCount} exitosos, ${result.errorCount} con error.`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || "Falló el envío a Brilo.");
      setRowsBySheet((prev) => {
        const rows = prev[selectedSheet];
        if (!rows) return prev;
        return {
          ...prev,
          [selectedSheet]: rows.map((r) =>
            rowsToSubmitKeys.has(r.parsed.rowKey)
              ? { ...r, status: "error", errorMessage: message }
              : r,
          ),
        };
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (catalogosQuery.isLoading) {
    return (
      <section className="flex flex-1 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando catálogos de Brilo...
        </div>
      </section>
    );
  }

  if (catalogosQuery.isError) {
    return (
      <section className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="text-base font-semibold">
          No se pudo cargar la integración con Brilo
        </h2>
        <p className="text-sm text-muted-foreground">
          {catalogosQuery.error instanceof Error
            ? catalogosQuery.error.message
            : "Error desconocido."}
        </p>
        <Button onClick={() => catalogosQuery.refetch()}>Reintentar</Button>
      </section>
    );
  }

  return (
    <section className="flex h-[calc(100vh-6rem)] min-h-0 flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Cuentas por cobrar → Brilo</CardTitle>
          <CardDescription>
            Sube el archivo de Excel con el detalle de CxC. Se identifica
            automáticamente la información para crear abonos en Brilo. Revisa
            cada fila antes de subir.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end justify-between gap-3">
          <RecuperacionesFileInput
            fileName={workbook?.fileName ?? null}
            onWorkbookParsed={handleWorkbookParsed}
            onReset={handleReset}
          />
          {workbook ? (
            <div className="flex items-center gap-3">
              <Select
                value={selectedSheet}
                onValueChange={setSelectedSheet}
                disabled={isSubmitting}
              >
                <SelectTrigger sizeVariant="md" className="min-w-[180px]">
                  <SelectValue placeholder="Selecciona una hoja" />
                </SelectTrigger>
                <SelectContent>
                  {workbook.parsed.sheets.map((s) => (
                    <SelectItem key={s.sheetName} value={s.sheetName}>
                      {s.sheetName} ({s.rows.length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => void handleSubmit()}
                disabled={isSubmitting || summary.included === 0}
                icon={isSubmitting ? Loader2 : Send}
                iconClassName={isSubmitting ? "animate-spin" : undefined}
              >
                Subir {summary.included} a Brilo
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {workbook && selectedSheet ? (
        <>
          <SummaryStrip summary={summary} />

          {workbook.parsed.unsupportedSheetNames.length > 0 ? (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              Hojas ignoradas (formato no compatible):{" "}
              {workbook.parsed.unsupportedSheetNames.join(", ")}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border">
            <RecuperacionesPreviewTable
              rows={currentRows}
              bancos={bancos}
              tiposAbono={tiposAbono}
              onUpdateRow={handleUpdateRow}
              onToggleRow={handleToggleRow}
              onToggleAll={handleToggleAll}
            />
          </div>
        </>
      ) : null}
    </section>
  );
}

interface SummaryProps {
  summary: {
    total: number;
    included: number;
    totalAmount: number;
    successCount: number;
    errorCount: number;
  };
}

function SummaryStrip({ summary }: SummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
      <SummaryCard label="Filas leídas" value={String(summary.total)} />
      <SummaryCard
        label="Incluidas"
        value={`${summary.included}/${summary.total}`}
      />
      <SummaryCard
        label="Total a subir"
        value={formatMoney(summary.totalAmount)}
      />
      <SummaryCard
        label="Exitosos"
        value={String(summary.successCount)}
        accent="text-green-600 dark:text-green-400"
      />
      <SummaryCard
        label="Con error"
        value={String(summary.errorCount)}
        accent={
          summary.errorCount > 0 ? "text-destructive" : "text-muted-foreground"
        }
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border border-border bg-card px-3 py-2">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={`text-sm font-semibold tabular-nums ${accent ?? "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}
