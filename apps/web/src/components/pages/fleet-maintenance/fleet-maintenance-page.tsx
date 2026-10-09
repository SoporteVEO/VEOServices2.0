"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { useFleetVehicles } from "@/api/fleet/fleet.get";
import type { FleetVehicle } from "@/api/fleet/fleet.types";
import { Label } from "@/components/primitives/ui/label";
import { Switch } from "@/components/primitives/ui/switch";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { FleetVehicleDetailDrawer } from "./fleet-vehicle-detail-drawer";
import { FleetVehicleFormDialog } from "./fleet-vehicle-form-dialog";
import { FLEET_VEHICLES_COLUMNS } from "./fleet-vehicles-columns";

export function FleetMaintenancePage() {
  const archivedSwitchId = useId();
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const { data: vehicles = [], isLoading } = useFleetVehicles({
    search: debouncedSearch || undefined,
    includeArchived,
  });

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <DataTable
        columns={FLEET_VEHICLES_COLUMNS}
        data={vehicles}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por placa, marca o modelo..."
        onRowClick={(vehicle: FleetVehicle) => setSelectedId(vehicle.id)}
        emptyMessage="No hay vehículos registrados."
        pagination
        sideButtons={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id={archivedSwitchId}
                checked={includeArchived}
                onCheckedChange={setIncludeArchived}
              />
              <Label
                htmlFor={archivedSwitchId}
                className="text-xs text-muted-foreground"
              >
                Mostrar archivados
              </Label>
            </div>
            <Button icon={Plus} onClick={() => setCreateOpen(true)}>
              Nuevo vehículo
            </Button>
          </div>
        }
      />

      <FleetVehicleDetailDrawer
        vehicleId={selectedId}
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />

      <FleetVehicleFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(vehicle) => setSelectedId(vehicle.id)}
      />
    </section>
  );
}
