"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { UserAppUsageReport } from "./user-app-usage-report";

export function AnalyticsPageTabs() {
  const [tab, setTab] = useState("uso-app");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="uso-app">Uso de la aplicación</TabsTrigger>
      </TabsList>

      <TabsContent value="uso-app">
        <UserAppUsageReport />
      </TabsContent>
    </Tabs>
  );
}
