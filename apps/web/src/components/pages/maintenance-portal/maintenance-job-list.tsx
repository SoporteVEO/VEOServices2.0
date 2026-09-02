"use client";

import { AlertTriangle, CalendarClock, ChevronRight, Camera, Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import { useMyMaintenanceJobs } from "@/api/maintenance/maintenance.get";
import type { MaintenanceJobListItem } from "@/api/maintenance/maintenance.types";
import { Badge } from "@/components/primitives/ui/badge";
import { MaintenanceCategoryBadge } from "@/components/pages/maintenance/maintenance-category-badge";
import { MaintenanceStatusBadge } from "@/components/pages/maintenance/maintenance-status-badge";
import { formatBriloShortDate } from "@/lib/format";
import { maintenancePortalPath } from "@/lib/maintenance-portal";
import { MaintenancePortalShell } from "./maintenance-portal-shell";

export function MaintenanceJobList() {
  const { data: jobs, isLoading, isError } = useMyMaintenanceJobs();

  const open = (jobs ?? []).filter(
    (job) => job.status === "PENDING" || job.status === "IN_PROGRESS",
  );
  const done = (jobs ?? []).filter((job) => job.status === "COMPLETED");

  return (
    <MaintenancePortalShell
      title="Mis mantenimientos"
      subtitle="Órdenes asignadas a tu cuenta"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" aria-hidden />
        </div>
      ) : isError ? (
        <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          No pudimos cargar tus órdenes. Intenta de nuevo más tarde.
        </p>
      ) : (jobs ?? []).length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm font-medium">No tienes órdenes asignadas</p>
          <p className="pt-1 text-xs text-muted-foreground">
            Cuando el equipo te asigne un mantenimiento aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <section>
            <h2 className="pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pendientes ({open.length})
            </h2>
            {open.length === 0 ? (
              <p className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">
                Todo al día. No tienes trabajos pendientes.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {open.map((job) => (
                  <li key={job.id}>
                    <JobCard job={job} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {done.length > 0 ? (
            <section>
              <h2 className="pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Finalizadas ({done.length})
              </h2>
              <ul className="flex flex-col gap-2">
                {done.map((job) => (
                  <li key={job.id}>
                    <JobCard job={job} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </MaintenancePortalShell>
  );
}

function JobCard({ job }: { job: MaintenanceJobListItem }) {
  const location =
    [job.address, job.cityName, job.departmentName].filter(Boolean).join(", ") ||
    "Sin dirección";
  return (
    <Link
      href={maintenancePortalPath(job.id)}
      className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors active:bg-accent/50"
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="font-mono">
            {job.billboardCode ?? job.code}
          </Badge>
          <MaintenanceStatusBadge status={job.status} />
          <MaintenanceCategoryBadge category={job.category} />
        </div>

        <p className="line-clamp-2 text-sm font-medium">{job.description}</p>

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden />
          <span className="line-clamp-2">{location}</span>
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            {job.isOverdue ? (
              <AlertTriangle
                className="size-3 shrink-0 text-red-600 dark:text-red-400"
                aria-hidden
              />
            ) : (
              <CalendarClock className="size-3 shrink-0" aria-hidden />
            )}
            <span
              className={job.isOverdue ? "text-red-600 dark:text-red-400" : ""}
            >
              {formatBriloShortDate(job.scheduledAt)}
            </span>
          </span>
          {job.photoCount > 0 ? (
            <span className="flex items-center gap-1.5">
              <Camera className="size-3 shrink-0" aria-hidden />
              {job.photoCount}
            </span>
          ) : null}
        </div>
      </div>

      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </Link>
  );
}
