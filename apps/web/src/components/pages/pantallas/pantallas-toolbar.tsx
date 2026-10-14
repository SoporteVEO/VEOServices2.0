"use client";

import { useState } from "react";
import { FileDown, FileText, MonitorPlay, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { exportPantallasExcel } from "./export-pantallas-excel";
import { usePantallas } from "./pantallas-context";
import { formatCount, localIsoDate, parseIso, todayIso } from "./pantallas-format";
import { boardTotals } from "./pantallas-logic";

export function PantallasToolbar({
  refDate,
  onRefDateChange,
}: {
  refDate: string;
  onRefDateChange: (iso: string) => void;
}) {
  const { board, logs, canEdit, openDialog } = usePantallas();
  const [exporting, setExporting] = useState(false);
  const totals = boardTotals(board, refDate);

  async function handleExport() {
    setExporting(true);
    try {
      await exportPantallasExcel(board, logs, refDate);
      toast.success("Excel descargado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo generar el Excel");
    } finally {
      setExporting(false);
    }
  }

  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MonitorPlay className="size-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold leading-tight">Pantallas</h1>
          <p className="text-xs text-muted-foreground">
            {board.screens.length} pantallas · {formatCount(totals.campaigns)} campañas
            {canEdit ? "" : " · solo lectura"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <DatePicker
          className="w-44"
          label="Fecha de referencia"
          value={parseIso(refDate)}
          onChange={(date) => onRefDateChange(date ? localIsoDate(date) : todayIso())}
        />
        {canEdit ? (
          <Button icon={Upload} onClick={() => openDialog({ type: "order" })}>
            Ingresar OP
          </Button>
        ) : null}
        <Button variant="outline" icon={FileText} onClick={() => openDialog({ type: "report" })}>
          Reporte OP
        </Button>
        <Button variant="outline" icon={FileDown} disabled={exporting} onClick={handleExport}>
          {exporting ? "Generando…" : "Exportar Excel"}
        </Button>
        {canEdit ? (
          <Button
            variant="outline"
            icon={Plus}
            onClick={() => openDialog({ type: "screen", screenId: null })}
          >
            Nueva pantalla
          </Button>
        ) : null}
      </div>
    </header>
  );
}
