"use client";

import { pdf } from "@react-pdf/renderer";
import type { UserAppUsageReport } from "@/api/analytics/analytics.types";
import { UserAppUsagePdfDocument } from "./user-app-usage-pdf-document";

export async function downloadUserAppUsagePdf(report: UserAppUsageReport) {
  const blob = await pdf(<UserAppUsagePdfDocument report={report} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `uso-app-${report.range.from}_${report.range.to}.pdf`;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}
