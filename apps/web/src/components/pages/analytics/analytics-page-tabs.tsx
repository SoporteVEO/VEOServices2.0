"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SalesByCostCenterReport } from "./sales-by-cost-center-report";
import { UserAppUsageReport } from "./user-app-usage-report";

export function AnalyticsPageTabs() {
  const [tab, setTab] = useState("ventas");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="ventas">Ventas por centro de costo</TabsTrigger>
        <TabsTrigger value="uso-app">Uso de la aplicación</TabsTrigger>
      </TabsList>

      <TabsContent value="ventas">
        <SalesByCostCenterReport />
      </TabsContent>

      <TabsContent value="uso-app">
        <UserAppUsageReport />
      </TabsContent>
    </Tabs>
  );
}
