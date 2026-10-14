"use client";

import { pdf } from "@react-pdf/renderer";
import type {
  AgentExcelInput,
  AgentPdfInput,
  AgentTableData,
  AgentTableInput,
} from "@/api/agent/agent.types";
import { isNumericFormat, toNumber } from "@/lib/agent-format";
import { downloadBlob, safeFileName } from "@/lib/pdf-download";
import { AgentPdfDocument } from "./agent-pdf-document";

function baseName(fileName: string) {
  return safeFileName(
    fileName.replace(/\.(xlsx|xls|pdf)$/i, "").trim() || "archivo",
  );
}

function toSheetRows(table: AgentTableData) {
  return table.rows.map((row) =>
    Object.fromEntries(
      table.columns.map((column) => {
        const value = row[column.key];
        return [
          column.label,
          isNumericFormat(column.format) && value !== null && value !== ""
            ? toNumber(value)
            : (value ?? ""),
        ];
      }),
    ),
  );
}

export async function downloadAgentExcel(spec: AgentExcelInput) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  spec.sheets.forEach((sheet, index) => {
    const worksheet = XLSX.utils.json_to_sheet(toSheetRows(sheet), {
      header: sheet.columns.map((column) => column.label),
    });
    worksheet["!cols"] = sheet.columns.map((column) => ({
      wch: Math.min(Math.max(column.label.length + 4, 12), 40),
    }));
    const name = (sheet.name || `Hoja ${index + 1}`).slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  });
  XLSX.writeFile(workbook, `${baseName(spec.fileName)}.xlsx`);
}

export async function downloadAgentPdf(spec: AgentPdfInput) {
  const blob = await pdf(<AgentPdfDocument spec={spec} />).toBlob();
  downloadBlob(blob, `${baseName(spec.fileName)}.pdf`);
}

export function tableToExcel(table: AgentTableInput): AgentExcelInput {
  return {
    fileName: table.title,
    sheets: [
      {
        name: table.title.slice(0, 31),
        columns: table.columns,
        rows: table.rows,
      },
    ],
  };
}

export function tableToPdf(table: AgentTableInput): AgentPdfInput {
  return {
    fileName: table.title,
    title: table.title,
    subtitle: table.description,
    orientation: table.columns.length > 5 ? "landscape" : "portrait",
    sections: [{ table: { columns: table.columns, rows: table.rows } }],
  };
}
