"use client";

import { Loader2 } from "lucide-react";
import { useMyInstallationTasks } from "@/api/installations/installations.get";
import { useMyMaintenanceJobs } from "@/api/maintenance/maintenance.get";
import { InstallationTaskCard } from "@/components/pages/installer-portal/installation-task-card";
import { usePortalSession } from "@/components/pages/installer-portal/use-portal-session";
import { MaintenanceJobCard } from "@/components/pages/maintenance-portal/maintenance-job-card";
import {
  canAccessInstallerPortal,
  canAccessMaintenancePortal,
  FIELD_PORTAL_LABEL,
} from "@/lib/portal-access";
import { FieldPortalShell } from "./field-portal-shell";
import { groupFieldOrders, type FieldOrder } from "./field-orders";

export function FieldOrderList() {
  const { role, subRoles, capabilities } = usePortalSession();
  const showInstallations = canAccessInstallerPortal(role, subRoles);
  const showMaintenance = canAccessMaintenancePortal(role, subRoles);

  const installations = useMyInstallationTasks({ enabled: showInstallations });
  const maintenance = useMyMaintenanceJobs({ enabled: showMaintenance });

  const isLoading =
    (showInstallations && installations.isPending) ||
    (showMaintenance && maintenance.isPending);
  const isError =
    (showInstallations && installations.isError) ||
    (showMaintenance && maintenance.isError);

  const isVulcanizadoOnly =
    capabilities.canUploadVulcanizado && !capabilities.canUploadInstallation;
  const { pending, done } = groupFieldOrders(
    showInstallations ? (installations.data ?? []) : [],
    showMaintenance ? (maintenance.data ?? []) : [],
    isVulcanizadoOnly,
  );

  return (
    <FieldPortalShell
      title={FIELD_PORTAL_LABEL}
      subtitle="Trabajos asignados a tu cuenta"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" aria-hidden />
        </div>
      ) : isError ? (
        <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          No pudimos cargar tus órdenes. Intenta de nuevo más tarde.
        </p>
      ) : pending.length === 0 && done.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm font-medium">No tienes órdenes asignadas</p>
          <p className="pt-1 text-xs text-muted-foreground">
            Cuando se te asigne una instalación o un mantenimiento aparecerá
            aquí.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <OrderSection
            title={`Pendientes (${pending.length})`}
            orders={pending}
            showLocation={capabilities.canSeeLocation}
            emptyMessage="Todo al día. No tienes trabajos pendientes."
          />
          {done.length > 0 ? (
            <OrderSection
              title={`Finalizadas (${done.length})`}
              orders={done}
              showLocation={capabilities.canSeeLocation}
            />
          ) : null}
        </div>
      )}
    </FieldPortalShell>
  );
}

function OrderSection({
  title,
  orders,
  showLocation,
  emptyMessage,
}: {
  title: string;
  orders: FieldOrder[];
  showLocation: boolean;
  emptyMessage?: string;
}) {
  return (
    <section>
      <h2 className="pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {orders.length === 0 ? (
        <p className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {orders.map((order) => (
            <li key={`${order.kind}-${order.id}`}>
              {order.kind === "installation" ? (
                <InstallationTaskCard
                  task={order.task}
                  showLocation={showLocation}
                />
              ) : (
                <MaintenanceJobCard job={order.job} />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
