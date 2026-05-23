"use client";

import { pdf } from "@react-pdf/renderer";
import type { SalesByCostCenterReport } from "@/api/analytics/analytics.types";
import { SalesByCostCenterExecutivePdfDocument } from "./sales-by-cost-center-executive-pdf-document";

export async function downloadSalesByCostCenterExecutivePdf(
  report: SalesByCostCenterReport,
  options?: { filterLabel?: string | null },
) {
  const blob = await pdf(
    <SalesByCostCenterExecutivePdfDocument
      report={report}
      filterLabel={options?.filterLabel}
    />,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reporte-ejecutivo-facturacion_${report.range.from}_${report.range.to}.pdf`;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}
