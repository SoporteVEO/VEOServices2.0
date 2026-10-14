"use client";

import { pdf } from "@react-pdf/renderer";
import type { PantallasBoard } from "@/api/pantallas/pantallas.types";
import { downloadBlob } from "@/lib/pdf-download";
import { buildReportCsv, type ReportBlock } from "./order-report-logic";
import { OrderReportPdfDocument } from "./order-report-pdf-document";
import { fileStamp, todayIso } from "./pantallas-format";

export async function downloadOrderReportPdf(
  board: PantallasBoard,
  blocks: ReportBlock[],
  periodLabel: string,
  includeLabel: string,
) {
  const blob = await pdf(
    <OrderReportPdfDocument
      board={board}
      blocks={blocks}
      periodLabel={periodLabel}
      includeLabel={includeLabel}
    />,
  ).toBlob();
  downloadBlob(blob, `reporte_op_${fileStamp(todayIso())}.pdf`);
}

export function downloadOrderReportCsv(board: PantallasBoard, blocks: ReportBlock[]) {
  const csv = buildReportCsv(blocks, board);
  downloadBlob(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
    `reporte_op_${fileStamp(todayIso())}.csv`,
  );
}
