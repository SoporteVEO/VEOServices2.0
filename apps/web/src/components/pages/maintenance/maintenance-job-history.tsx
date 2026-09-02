"use client";

import {
  AlarmClock,
  CalendarClock,
  Camera,
  CheckCircle2,
  Clock,
  Timer,
} from "lucide-react";
import type { MaintenanceJob } from "@/api/maintenance/maintenance.types";
import { cn } from "@/lib/utils";
import { formatBriloShortDate } from "@/lib/format";
import {
  formatMinutes,
  MAINTENANCE_EVENT_DOT,
  MAINTENANCE_EVENT_LABELS,
  personName,
} from "./maintenance-const";

/**
 * The "Historial" tab: derived stats on top, then the append-only event trail
 * the API records for every state change.
 */
export function MaintenanceJobHistory({ job }: { job: MaintenanceJob }) {
  const startDelay = job.minutesToStart;

  return (
    <div className="flex flex-col gap-5">
      <section className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        <StatCard
          icon={CalendarClock}
          label="Programada"
          value={formatBriloShortDate(job.scheduledAt)}
          hint={job.isOverdue ? "Fuera de fecha" : undefined}
          hintTone="danger"
        />
        <StatCard
          icon={Clock}
          label="Inicio real"
          value={
            job.startedAt ? formatBriloShortDate(job.startedAt) : "Sin iniciar"
          }
        />
        <StatCard
          icon={CheckCircle2}
          label="Finalización"
          value={
            job.completedAt
              ? formatBriloShortDate(job.completedAt)
              : "Pendiente"
          }
        />
        <StatCard
          icon={AlarmClock}
          label="Desfase de inicio"
          value={formatMinutes(startDelay)}
          hint={
            startDelay != null && startDelay > 0
              ? "después de lo programado"
              : undefined
          }
        />
        <StatCard
          icon={Timer}
          label="Tiempo de trabajo"
          value={formatMinutes(job.minutesWorked)}
        />
        <StatCard
          icon={Camera}
          label="Evidencias"
          value={String(job.photos.length)}
        />
      </section>

      {job.completionNotes ? (
        <section className="rounded-lg border bg-muted/40 p-3">
          <h4 className="text-xs font-semibold text-muted-foreground">
            Notas de cierre
          </h4>
          <p className="pt-1 text-sm">{job.completionNotes}</p>
        </section>
      ) : null}

      <section>
        <h4 className="pb-3 text-sm font-semibold">Línea de tiempo</h4>
        {job.events.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aún no hay actividad registrada.
          </p>
        ) : (
          <ol className="relative flex flex-col gap-4 border-l pl-5">
            {job.events.map((event) => (
              <li key={event.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[26px] top-1 size-2.5 rounded-full ring-2 ring-background",
                    MAINTENANCE_EVENT_DOT[event.type],
                  )}
                  aria-hidden
                />
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-sm font-medium">
                    {MAINTENANCE_EVENT_LABELS[event.type]}
                  </p>
                  <time className="text-[11px] text-muted-foreground">
                    {formatBriloShortDate(event.createdAt)}
                  </time>
                </div>
                {event.message ? (
                  <p className="pt-0.5 text-xs text-muted-foreground">
                    {event.message}
                  </p>
                ) : null}
                {event.actor ? (
                  <p className="pt-0.5 text-[11px] text-muted-foreground">
                    por {personName(event.actor)}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  hintTone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  hintTone?: "danger";
}) {
  return (
    <div className="min-w-0 rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        <span className="truncate text-[11px] font-medium">{label}</span>
      </div>
      <p className="truncate pt-1 text-sm font-semibold">{value}</p>
      {hint ? (
        <p
          className={cn(
            "truncate text-[11px]",
            hintTone === "danger"
              ? "text-red-600 dark:text-red-400"
              : "text-muted-foreground",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
