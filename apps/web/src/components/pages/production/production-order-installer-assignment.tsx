"use client";

import { Flame, HardHat } from "lucide-react";
import { toast } from "sonner";
import { useAssignableInstallers } from "@/api/production-orders/production-orders.get";
import {
  type UpdateProductionOrderItemAssignmentInput,
  useUpdateProductionOrderItemAssignment,
} from "@/api/production-orders/production-orders.patch";
import type {
  InstallerSummary,
  ProductionOrderItem,
} from "@/api/production-orders/production-orders.types";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";

const UNASSIGNED = "__unassigned__";

const ROLE_LABELS: Record<InstallerSummary["role"], string> = {
  INSTALLER: "Instalador",
  INSTALLER_MANTENIMIENTO: "Instalador y mantenimiento",
  WORKER: "Vulcanizador",
};

function fullName(person: {
  firstName: string;
  lastName: string | null;
}): string {
  return [person.firstName, person.lastName].filter(Boolean).join(" ");
}

function toOptions(people: InstallerSummary[]) {
  return [
    { value: UNASSIGNED, label: "Sin asignar" },
    ...people.map((person) => ({
      value: person.id,
      label: `${fullName(person)} · ${ROLE_LABELS[person.role]}`,
      filterValue: `${fullName(person)} ${person.email}`,
    })),
  ];
}

function toAssigneeId(value: string | number | null | undefined) {
  return !value || value === UNASSIGNED ? null : String(value);
}

type Props = {
  item: ProductionOrderItem;
};

/**
 * Lets the production team pick who installs a billboard, who vulcanises its
 * material, and when it goes up. All of it is surfaced through the QR portal.
 */
export function ProductionOrderInstallerAssignment({ item }: Props) {
  const { data: assignable = [], isLoading } = useAssignableInstallers();
  const mutation = useUpdateProductionOrderItemAssignment();

  const installerOptions = toOptions(
    assignable.filter((person) => person.role !== "WORKER"),
  );
  const vulcanizadorOptions = toOptions(
    assignable.filter((person) => person.role === "WORKER"),
  );

  function save(
    input: Omit<UpdateProductionOrderItemAssignmentInput, "itemId">,
    successMessage: string,
  ) {
    mutation.mutate(
      { itemId: item.id, ...input },
      {
        onSuccess: () => toast.success(successMessage),
        onError: (err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : "No se pudo guardar la asignación.",
          ),
      },
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <Combobox
        label="Instalador asignado"
        options={installerOptions}
        value={item.assignedInstaller?.id ?? UNASSIGNED}
        isLoading={isLoading}
        disabled={mutation.isPending}
        leadingIcon={<HardHat className="size-3.5" aria-hidden />}
        emptyLabel="No hay instaladores registrados"
        onChange={(value) =>
          save(
            { assignedInstallerId: toAssigneeId(value) },
            "Instalador actualizado.",
          )
        }
      />

      <Combobox
        label="Vulcanizador asignado"
        options={vulcanizadorOptions}
        value={item.assignedVulcanizador?.id ?? UNASSIGNED}
        isLoading={isLoading}
        disabled={mutation.isPending}
        leadingIcon={<Flame className="size-3.5" aria-hidden />}
        emptyLabel="No hay vulcanizadores registrados"
        onChange={(value) =>
          save(
            { assignedVulcanizadorId: toAssigneeId(value) },
            "Vulcanizador actualizado.",
          )
        }
      />

      <DatePicker
        label="Fecha programada"
        value={
          item.scheduledInstallationAt
            ? new Date(item.scheduledInstallationAt)
            : null
        }
        allowClear
        disabled={mutation.isPending}
        placeholder="Sin programar"
        onChange={(date) =>
          save(
            { scheduledInstallationAt: date ? date.toISOString() : null },
            date ? "Fecha programada." : "Fecha eliminada.",
          )
        }
      />
    </div>
  );
}
