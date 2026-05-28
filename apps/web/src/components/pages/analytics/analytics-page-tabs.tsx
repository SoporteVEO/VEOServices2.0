"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { OffersAnalyticsReport } from "./offers-analytics-report";
import { ReportsAnalyticsReport } from "./reports-analytics-report";
import { SalesByCostCenterReport } from "./sales-by-cost-center-report";
import { UserAppUsageReport } from "./user-app-usage-report";

export function AnalyticsPageTabs() {
  const [tab, setTab] = useState("ventas");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="ventas">Facturación por centro de costos</TabsTrigger>
        <TabsTrigger value="cotizaciones">Resumen de cotizaciones</TabsTrigger>
        <TabsTrigger value="reportes">Resumen de reportes enviados</TabsTrigger>
        <TabsTrigger value="uso-app">Uso de la aplicación</TabsTrigger>
      </TabsList>

      <TabsContent value="ventas">
        <SalesByCostCenterReport />
      </TabsContent>

      <TabsContent value="cotizaciones">
        <OffersAnalyticsReport />
      </TabsContent>

      <TabsContent value="reportes">
        <ReportsAnalyticsReport />
      </TabsContent>

      <TabsContent value="uso-app">
        <UserAppUsageReport />
      </TabsContent>
    </Tabs>
  );
}
