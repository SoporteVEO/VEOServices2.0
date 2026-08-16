"use client";

import { HardHat } from "lucide-react";
import { toast } from "sonner";
import { useAssignableInstallers } from "@/api/production-orders/production-orders.get";
import { useUpdateProductionOrderItemAssignment } from "@/api/production-orders/production-orders.patch";
import type {
  InstallerSummary,
  ProductionOrderItem,
} from "@/api/production-orders/production-orders.types";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";

const UNASSIGNED = "__unassigned__";

const ROLE_LABELS: Record<InstallerSummary["role"], string> = {
  INSTALLER: "Instalador",
  WORKER: "Operario",
};

function fullName(person: {
  firstName: string;
  lastName: string | null;
}): string {
  return [person.firstName, person.lastName].filter(Boolean).join(" ");
}

type Props = {
  item: ProductionOrderItem;
};

/**
 * Lets the production team pick who installs a billboard and when. Both
 * values are surfaced to the installer through the QR portal.
 */
export function ProductionOrderInstallerAssignment({ item }: Props) {
  const { data: installers = [], isLoading } = useAssignableInstallers();
  const mutation = useUpdateProductionOrderItemAssignment();

  const options = [
    { value: UNASSIGNED, label: "Sin asignar" },
    ...installers.map((installer) => ({
      value: installer.id,
      label: `${fullName(installer)} · ${ROLE_LABELS[installer.role]}`,
      filterValue: `${fullName(installer)} ${installer.email}`,
    })),
  ];

  function save(
    input: Partial<{
      assignedInstallerId: string | null;
      scheduledInstallationAt: string | null;
    }>,
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
        options={options}
        value={item.assignedInstaller?.id ?? UNASSIGNED}
        isLoading={isLoading}
        disabled={mutation.isPending}
        leadingIcon={<HardHat className="size-3.5" aria-hidden />}
        emptyLabel="No hay instaladores registrados"
        onChange={(value) =>
          save(
            {
              assignedInstallerId:
                !value || value === UNASSIGNED ? null : String(value),
            },
            "Instalador actualizado.",
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
