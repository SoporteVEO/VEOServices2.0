"use client";

import { useState } from "react";
import {
  Archive,
  CalendarClock,
  Gauge,
  Loader2,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  User as UserIcon,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useFleetVehicle } from "@/api/fleet/fleet.get";
import {
  useDeleteFleetVehicle,
  useUpdateFleetVehicle,
} from "@/api/fleet/fleet.mutations";
import type {
  FleetMaintenance,
  FleetVehicleDetail,
} from "@/api/fleet/fleet.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatBriloShortDate } from "@/lib/format";
import { personName } from "@/components/pages/maintenance/maintenance-const";
import { formatCost, formatKm, vehicleName } from "./fleet-const";
import { FleetMaintenanceFormDialog } from "./fleet-maintenance-form-dialog";
import { FleetMaintenanceHistory } from "./fleet-maintenance-history";
import { FleetVehicleFormDialog } from "./fleet-vehicle-form-dialog";
import { FleetVehiclePhoto } from "./fleet-vehicle-photo";

type Props = {
  vehicleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FleetVehicleDetailDrawer({
  vehicleId,
  open,
  onOpenChange,
}: Props) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      handleOnly
    >
      <DrawerContent className="flex flex-col data-[vaul-drawer-direction=right]:h-screen data-[vaul-drawer-direction=right]:w-[92vw] data-[vaul-drawer-direction=right]:sm:max-w-[720px]">
        {vehicleId ? (
          <DrawerBody
            key={vehicleId}
            vehicleId={vehicleId}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function DrawerBody({
  vehicleId,
  onClose,
}: {
  vehicleId: string;
  onClose: () => void;
}) {
  const { data: vehicle, isLoading, isError } = useFleetVehicle(vehicleId);
  const [editOpen, setEditOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] =
    useState<FleetMaintenance | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" aria-hidden />
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          No pudimos cargar este vehículo.
        </p>
      </div>
    );
  }

  function openNewService() {
    setEditingService(null);
    setServiceDialogOpen(true);
  }

  function openEditService(service: FleetMaintenance) {
    setEditingService(service);
    setServiceDialogOpen(true);
  }

  return (
    <>
      <DrawerHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <FleetVehiclePhoto
              url={vehicle.photoUrl}
              alt={vehicleName(vehicle)}
              className="size-14"
              sizes="56px"
            />
            <div className="min-w-0">
              <DrawerTitle className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm">{vehicle.plate}</span>
                {vehicle.archived ? (
                  <Badge variant="secondary">Archivado</Badge>
                ) : null}
              </DrawerTitle>
              <DrawerDescription className="truncate">
                {vehicleName(vehicle)}
              </DrawerDescription>
            </div>
          </div>
          <PrimitiveButton
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </PrimitiveButton>
        </div>
      </DrawerHeader>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 p-4">
          <SummarySection vehicle={vehicle} />

          <section>
            <div className="flex items-center justify-between gap-2 pb-2">
              <h4 className="text-sm font-semibold">
                Historial de mantenimientos{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({vehicle.serviceCount})
                </span>
              </h4>
              <Button sizeVariant="sm" icon={Plus} onClick={openNewService}>
                Registrar mantenimiento
              </Button>
            </div>
            <FleetMaintenanceHistory
              services={vehicle.services}
              onEdit={openEditService}
            />
          </section>
        </div>
      </ScrollArea>

      <DrawerFooter className="border-t">
        <VehicleActions
          vehicle={vehicle}
          onEdit={() => setEditOpen(true)}
          onDeleted={onClose}
        />
      </DrawerFooter>

      <FleetVehicleFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        vehicle={vehicle}
      />

      <FleetMaintenanceFormDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        vehicle={vehicle}
        service={editingService}
      />
    </>
  );
}

function SummarySection({ vehicle }: { vehicle: FleetVehicleDetail }) {
  const nextService = [
    vehicle.nextServiceKm != null ? formatKm(vehicle.nextServiceKm) : null,
    vehicle.nextServiceAt ? formatBriloShortDate(vehicle.nextServiceAt) : null,
  ]
    .filter(Boolean)
    .join(" o ");

  return (
    <section className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          icon={Gauge}
          label="Km último mantenimiento"
          value={formatKm(vehicle.lastMaintenanceKm)}
        />
        <StatCard
          icon={CalendarClock}
          label="Último mantenimiento"
          value={formatBriloShortDate(vehicle.lastMaintenanceAt)}
        />
        <StatCard
          icon={Wrench}
          label="Mantenimientos"
          value={String(vehicle.serviceCount)}
        />
        <StatCard
          icon={Wallet}
          label="Total gastado"
          value={formatCost(vehicle.totalSpent)}
        />
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoRow
          icon={CalendarClock}
          label="Próximo servicio"
          value={nextService || "Sin programar"}
        />
        <InfoRow icon={Palette} label="Color" value={vehicle.color ?? "—"} />
        <InfoRow
          icon={UserIcon}
          label="Registrado por"
          value={vehicle.createdBy ? personName(vehicle.createdBy) : "—"}
        />
      </dl>

      {vehicle.notes ? (
        <div className="rounded-lg border bg-card p-3">
          <h4 className="text-xs font-semibold text-muted-foreground">Notas</h4>
          <p className="whitespace-pre-wrap pt-1 text-sm">{vehicle.notes}</p>
        </div>
      ) : null}
    </section>
  );
}

function VehicleActions({
  vehicle,
  onEdit,
  onDeleted,
}: {
  vehicle: FleetVehicleDetail;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const updateVehicle = useUpdateFleetVehicle();
  const deleteVehicle = useDeleteFleetVehicle();
  const isBusy = updateVehicle.isPending || deleteVehicle.isPending;

  function toggleArchived() {
    updateVehicle.mutate(
      { id: vehicle.id, archived: !vehicle.archived },
      {
        onSuccess: () =>
          toast.success(
            vehicle.archived ? "Vehículo restaurado." : "Vehículo archivado.",
          ),
        onError: (error) =>
          toast.error(
            error instanceof Error
              ? error.message
              : "No se pudo actualizar el vehículo.",
          ),
      },
    );
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar el vehículo ${vehicle.plate}?`)) return;
    deleteVehicle.mutate(
      { id: vehicle.id },
      {
        onSuccess: () => {
          toast.success("Vehículo eliminado.");
          onDeleted();
        },
        onError: (error) =>
          toast.error(
            error instanceof Error
              ? error.message
              : "No se pudo eliminar el vehículo.",
          ),
      },
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary" className="mr-auto">
        Registrado {formatBriloShortDate(vehicle.createdAt)}
      </Badge>

      {vehicle.serviceCount === 0 ? (
        <Button
          variant="outline"
          sizeVariant="sm"
          icon={Trash2}
          disabled={isBusy}
          onClick={handleDelete}
        >
          Eliminar
        </Button>
      ) : null}

      <Button
        variant="outline"
        sizeVariant="sm"
        icon={vehicle.archived ? RotateCcw : Archive}
        disabled={isBusy}
        onClick={toggleArchived}
      >
        {vehicle.archived ? "Restaurar" : "Archivar"}
      </Button>

      <Button sizeVariant="sm" icon={Pencil} onClick={onEdit}>
        Editar
      </Button>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </div>
      <p className="pt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-[11px] font-medium text-muted-foreground">
          {label}
        </dt>
        <dd className="text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}
