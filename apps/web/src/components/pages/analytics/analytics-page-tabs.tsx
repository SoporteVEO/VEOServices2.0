"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { OffersAnalyticsReport } from "./offers-analytics-report";
import { PrintingAnalyticsReport } from "./printing-analytics-report";
import { ReportsAnalyticsReport } from "./reports-analytics-report";
import { SalesByCostCenterReport } from "./sales-by-cost-center-report";
import { UserAppUsageReport } from "./user-app-usage-report";

const ANALYTICS_TABS = [
  {
    value: "ventas",
    label: "Facturación por centro de costos",
    Report: SalesByCostCenterReport,
  },
  {
    value: "cotizaciones",
    label: "Resumen de cotizaciones",
    Report: OffersAnalyticsReport,
  },
  {
    value: "reportes",
    label: "Resumen de reportes enviados",
    Report: ReportsAnalyticsReport,
  },
  {
    value: "impresion",
    label: "Máquinas de impresión",
    Report: PrintingAnalyticsReport,
  },
  {
    value: "uso-app",
    label: "Uso de la aplicación",
    Report: UserAppUsageReport,
  },
] as const;

export function AnalyticsPageTabs() {
  const [tab, setTab] = useState<string>(ANALYTICS_TABS[0].value);

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <Select value={tab} onValueChange={setTab}>
        <SelectTrigger className="w-full @md/main:w-80 @5xl/main:hidden">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ANALYTICS_TABS.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <TabsList className="hidden @5xl/main:inline-flex">
        {ANALYTICS_TABS.map(({ value, label }) => (
          <TabsTrigger key={value} value={value}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      {ANALYTICS_TABS.map(({ value, Report }) => (
        <TabsContent key={value} value={value}>
          <Report />
        </TabsContent>
      ))}
    </Tabs>
  );
}
