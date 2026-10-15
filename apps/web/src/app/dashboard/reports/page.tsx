"use client";

import { useState } from "react";
import { AskNexoButton } from "@/components/dashboard/agent/ask-nexo-button";
import {
  ContractsReportTable,
  formatMonthLabel,
  ReportMonthSelector,
  startOfMonth,
} from "@/components/pages/reports";
import { AGENT_NAME } from "@/lib/agent-brand";

export default function ReportsPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  return (
    <ContractsReportTable
      month={month}
      sideButtons={
        <>
          <ReportMonthSelector value={month} onChange={setMonth} />
          <AskNexoButton
            label={`Pídeselo a ${AGENT_NAME}`}
            scope="contracts"
            hint={`${AGENT_NAME} genera y envía el reporte mensual por ti`}
            prompt={`Hola ${AGENT_NAME}, genérame el reporte mensual de ${formatMonthLabel(month).toLowerCase()} del contrato o valla `}
            send={false}
          />
        </>
      }
    />
  );
}
