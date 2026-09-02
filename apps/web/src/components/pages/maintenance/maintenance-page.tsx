"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaintenanceCategoriesPanel } from "./maintenance-categories-panel";
import { MaintenanceJobsTable } from "./maintenance-jobs-table";
import { MaintenanceOverviewPanel } from "./maintenance-overview-panel";

export function MaintenancePage() {
  const [tab, setTab] = useState("ordenes");

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="self-start">
          <TabsTrigger value="ordenes">Órdenes</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
        </TabsList>

        <TabsContent
          value="ordenes"
          className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
        >
          <MaintenanceJobsTable />
        </TabsContent>

        <TabsContent
          value="categorias"
          className="min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
        >
          <MaintenanceCategoriesPanel />
        </TabsContent>

        <TabsContent
          value="resumen"
          className="min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
        >
          <MaintenanceOverviewPanel />
        </TabsContent>
      </Tabs>
    </section>
  );
}
