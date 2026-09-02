"use client";

import { CalendarClock, ChevronRight, Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import { useMyInstallationTasks } from "@/api/installations/installations.get";
import type { InstallationTaskListItem } from "@/api/installations/installations.types";
import { Badge } from "@/components/primitives/ui/badge";
import { ProductionOrderStatusBadge } from "@/components/pages/production-orders-shared/production-order-status-badge";
import { formatBriloShortDate } from "@/lib/format";
import { installerPortalPath } from "@/lib/installer-portal";
import { InstallerPortalShell } from "./installer-portal-shell";
import { usePortalSession } from "./use-portal-session";

export function InstallationTaskList() {
  const { capabilities } = usePortalSession();
  const { data: tasks, isLoading, isError } = useMyInstallationTasks();

  const isVulcanizadoOnly =
    capabilities.canUploadVulcanizado && !capabilities.canUploadInstallation;

  return (
    <InstallerPortalShell
      title={isVulcanizadoOnly ? "Mis vulcanizados" : "Mis instalaciones"}
      subtitle="Vallas asignadas a tu cuenta"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" aria-hidden />
        </div>
      ) : isError ? (
        <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          No pudimos cargar tus instalaciones. Intenta de nuevo más tarde.
        </p>
      ) : !tasks || tasks.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm font-medium">
            {isVulcanizadoOnly
              ? "No tienes vallas asignadas"
              : "No tienes instalaciones asignadas"}
          </p>
          <p className="pt-1 text-xs text-muted-foreground">
            Escanea el código QR de una valla para abrir su ficha.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} showLocation={capabilities.canSeeLocation} />
            </li>
          ))}
        </ul>
      )}
    </InstallerPortalShell>
  );
}

function TaskCard({
  task,
  showLocation,
}: {
  task: InstallationTaskListItem;
  showLocation: boolean;
}) {
  const location =
    [task.address, task.cityName, task.departmentName]
      .filter(Boolean)
      .join(", ") || "Sin dirección";

  return (
    <Link
      href={installerPortalPath(task.id)}
      className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors active:bg-accent/50"
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="font-mono">
            {task.billboardCode ?? "—"}
          </Badge>
          <ProductionOrderStatusBadge status={task.status} />
        </div>

        <p className="truncate text-sm font-medium">
          {task.customerCompany ?? task.customerName}
        </p>

        {showLocation ? (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden />
            <span className="line-clamp-2">{location}</span>
          </p>
        ) : null}

        {task.scheduledInstallationAt ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="size-3 shrink-0" aria-hidden />
            Programada: {formatBriloShortDate(task.scheduledInstallationAt)}
          </p>
        ) : null}
      </div>

      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}
