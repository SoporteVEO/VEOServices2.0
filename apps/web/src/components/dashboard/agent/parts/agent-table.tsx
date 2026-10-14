"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Table2 } from "lucide-react";
import { toast } from "sonner";
import type { AgentTableInput } from "@/api/agent/agent.types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/primitives/ui/table";
import { Button } from "@/components/ui/button";
import { formatAgentValue, isNumericFormat } from "@/lib/agent-format";
import { cn } from "@/lib/utils";
import {
  downloadAgentExcel,
  downloadAgentPdf,
  tableToExcel,
  tableToPdf,
} from "../files/download-agent-files";
import { AgentIconButton } from "../agent-icon-button";
import { AgentPartFrame } from "./agent-part-frame";

const COLLAPSED_ROWS = 10;

export function AgentTable({ table }: { table: AgentTableInput }) {
  const [expanded, setExpanded] = useState(false);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  const visibleRows = expanded
    ? table.rows
    : table.rows.slice(0, COLLAPSED_ROWS);
  const hiddenCount = table.rows.length - visibleRows.length;

  async function handleExport(kind: "excel" | "pdf") {
    setExporting(kind);
    try {
      if (kind === "excel") await downloadAgentExcel(tableToExcel(table));
      else await downloadAgentPdf(tableToPdf(table));
    } catch {
      toast.error("No se pudo generar el archivo.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <AgentPartFrame
      icon={Table2}
      title={table.title}
      description={table.description ?? `${table.rows.length} filas`}
      actions={
        <>
          <AgentIconButton
            label={
              exporting === "excel" ? "Generando Excel…" : "Exportar a Excel"
            }
            icon={FileSpreadsheet}
            iconClassName="text-emerald-600"
            loading={exporting === "excel"}
            disabled={exporting !== null}
            onClick={() => handleExport("excel")}
          />
          <AgentIconButton
            label={exporting === "pdf" ? "Generando PDF…" : "Exportar a PDF"}
            icon={FileText}
            iconClassName="text-red-600"
            loading={exporting === "pdf"}
            disabled={exporting !== null}
            onClick={() => handleExport("pdf")}
          />
        </>
      }
    >
      <div className="max-h-96 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              {table.columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "h-8 text-xs",
                    isNumericFormat(column.format) && "text-right",
                  )}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row, index) => (
              <TableRow key={index}>
                {table.columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(
                      "py-1.5 text-xs",
                      isNumericFormat(column.format) &&
                        "text-right tabular-nums",
                    )}
                  >
                    {formatAgentValue(row[column.key], column.format)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {table.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={table.columns.length}
                  className="py-6 text-center text-xs text-muted-foreground"
                >
                  Sin resultados
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
      {table.rows.length > COLLAPSED_ROWS ? (
        <div className="border-t px-3 py-1.5">
          <Button
            variant="ghost"
            sizeVariant="sm"
            className="w-full justify-center border-0 shadow-none"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Mostrar menos" : `Mostrar ${hiddenCount} filas más`}
          </Button>
        </div>
      ) : null}
    </AgentPartFrame>
  );
}
