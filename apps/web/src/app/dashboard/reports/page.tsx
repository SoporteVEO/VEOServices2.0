"use client";

import { useState } from "react";
import {
  ContractsReportTable,
  ReportMonthSelector,
  startOfMonth,
} from "@/components/pages/reports";

export default function ReportsPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <ReportMonthSelector value={month} onChange={setMonth} />
      </div>

      <ContractsReportTable month={month} />
    </div>
  );
}
