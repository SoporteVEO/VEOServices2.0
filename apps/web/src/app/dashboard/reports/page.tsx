"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ContractsReportTable,
  ReportMonthSelector,
  startOfMonth,
} from "@/components/pages/reports";

export default function ReportsPage() {
  const [tab, setTab] = useState("mensual");
  // Shared across tabs so switching report type keeps the period in context.
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="mensual">Mensual</TabsTrigger>
          <TabsTrigger value="instalacion">Instalación</TabsTrigger>
          <TabsTrigger value="mantenimiento">Mantenimiento</TabsTrigger>
        </TabsList>

        <ReportMonthSelector value={month} onChange={setMonth} />
      </div>

      <TabsContent value="mensual">
        <ContractsReportTable reportType="monthly" month={month} />
      </TabsContent>

      <TabsContent value="instalacion">
        <ContractsReportTable reportType="installation" month={month} />
      </TabsContent>

      <TabsContent value="mantenimiento">
        <ContractsReportTable reportType="maintenance" month={month} />
      </TabsContent>
    </Tabs>
  );
}
