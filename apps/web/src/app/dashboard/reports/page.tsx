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
    <ContractsReportTable
      month={month}
      sideButtons={<ReportMonthSelector value={month} onChange={setMonth} />}
    />
  );
}
