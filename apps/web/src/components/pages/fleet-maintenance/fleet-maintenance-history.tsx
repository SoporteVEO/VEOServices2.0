"use client";

import { Gauge, Pencil, Receipt, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { useDeleteFleetMaintenance } from "@/api/fleet/fleet.mutations";
import type { FleetMaintenance } from "@/api/fleet/fleet.types";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { formatBriloShortDate } from "@/lib/format";
import { formatCost, formatKm } from "./fleet-const";
import { FleetServiceTypeBadge } from "./fleet-service-type-badge";

type Props = {
  services: FleetMaintenance[];
  onEdit: (service: FleetMaintenance) => void;
};

export function FleetMaintenanceHistory({ services, onEdit }: Props) {
  if (services.length === 0) {
    return (
      <p className="rounded-lg border bg-card p-4 text-xs text-muted-foreground">
        Aún no hay mantenimientos registrados para este vehículo.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {services.map((service) => (
        <ServiceRow key={service.id} service={service} onEdit={onEdit} />
      ))}
    </ol>
  );
}

function ServiceRow({
  service,
  onEdit,
}: {
  service: FleetMaintenance;
  onEdit: (service: FleetMaintenance) => void;
}) {
  const deleteService = useDeleteFleetMaintenance();

  function handleDelete() {
    if (!confirm("¿Eliminar este registro de mantenimiento?")) return;
    deleteService.mutate(
      { id: service.id },
      {
        onSuccess: () => toast.success("Mantenimiento eliminado."),
        onError: (error) =>
          toast.error(
            error instanceof Error
              ? error.message
              : "No se pudo eliminar el mantenimiento.",
          ),
      },
    );
  }

  return (
    <li className="rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <FleetServiceTypeBadge type={service.type} />
        <span className="text-sm font-medium">
          {formatBriloShortDate(service.performedAt)}
        </span>
        <span className="ml-auto text-sm font-semibold tabular-nums">
          {formatCost(service.cost)}
        </span>
        <div className="flex items-center">
          <PrimitiveButton
            variant="ghost"
            size="icon"
            aria-label="Editar mantenimiento"
            disabled={deleteService.isPending}
            onClick={() => onEdit(service)}
          >
            <Pencil className="size-4" />
          </PrimitiveButton>
          <PrimitiveButton
            variant="ghost"
            size="icon"
            aria-label="Eliminar mantenimiento"
            disabled={deleteService.isPending}
            onClick={handleDelete}
          >
            <Trash2 className="size-4 text-destructive" />
          </PrimitiveButton>
        </div>
      </div>

      <p className="whitespace-pre-wrap pt-2 text-sm">{service.description}</p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Gauge className="size-3.5" aria-hidden />
          {formatKm(service.mileageKm)}
        </span>
        {service.workshop ? (
          <span className="flex items-center gap-1">
            <Wrench className="size-3.5" aria-hidden />
            {service.workshop}
          </span>
        ) : null}
        {service.invoiceNumber ? (
          <span className="flex items-center gap-1">
            <Receipt className="size-3.5" aria-hidden />
            Factura {service.invoiceNumber}
          </span>
        ) : null}
        {service.nextServiceKm != null || service.nextServiceAt ? (
          <span>
            Próximo:{" "}
            {[
              service.nextServiceKm != null
                ? formatKm(service.nextServiceKm)
                : null,
              service.nextServiceAt
                ? formatBriloShortDate(service.nextServiceAt)
                : null,
            ]
              .filter(Boolean)
              .join(" o ")}
          </span>
        ) : null}
      </div>
    </li>
  );
}
