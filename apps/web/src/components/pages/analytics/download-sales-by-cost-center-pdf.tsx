"use client";

import { pdf } from "@react-pdf/renderer";
import type { SalesByCostCenterReport } from "@/api/analytics/analytics.types";
import { SalesByCostCenterPdfDocument } from "./sales-by-cost-center-pdf-document";

export async function downloadSalesByCostCenterPdf(
  report: SalesByCostCenterReport,
) {
  const blob = await pdf(
    <SalesByCostCenterPdfDocument report={report} />,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ventas-centro-costo_${report.range.from}_${report.range.to}.pdf`;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}
