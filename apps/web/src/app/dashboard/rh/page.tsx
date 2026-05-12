"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HrIncapacidadesTab, PlantillaTab } from "@/components/pages/rh";

export default function RHPage() {
  const [tab, setTab] = useState("plantilla");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="plantilla">Plantilla</TabsTrigger>
        <TabsTrigger value="incapacidades">Incapacidades</TabsTrigger>
      </TabsList>

      <TabsContent value="plantilla" className="pt-4">
        <PlantillaTab />
      </TabsContent>

      <TabsContent value="incapacidades" className="pt-4">
        <HrIncapacidadesTab />
      </TabsContent>
    </Tabs>
  );
}
