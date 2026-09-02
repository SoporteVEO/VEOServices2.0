"use client";

import { useState } from "react";
import Image from "next/image";
import {
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  PlayCircle,
  Ruler,
} from "lucide-react";
import { toast } from "sonner";
import { useMyMaintenanceJob } from "@/api/maintenance/maintenance.get";
import {
  useCompleteMaintenanceJob,
  useStartMaintenanceJob,
  useUploadMaintenancePhoto,
} from "@/api/maintenance/maintenance.mutations";
import type { MaintenanceJob } from "@/api/maintenance/maintenance.types";
import { MaintenanceCategoryBadge } from "@/components/pages/maintenance/maintenance-category-badge";
import { MaintenanceStatusBadge } from "@/components/pages/maintenance/maintenance-status-badge";
import { Button } from "@/components/primitives/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatBriloShortDate, formatDimensions } from "@/lib/format";
import { googleMapsUrl, openStreetMapEmbedUrl } from "@/lib/installer-portal";
import { MAINTENANCE_PORTAL_BASE } from "@/lib/maintenance-portal";
import { MaintenancePhotoUploader } from "./maintenance-photo-uploader";
import { MaintenancePortalShell } from "./maintenance-portal-shell";

export function MaintenanceJobDetail({ jobId }: { jobId: string }) {
  const { data: job, isLoading, isError } = useMyMaintenanceJob(jobId);

  if (isLoading) {
    return (
      <MaintenancePortalShell title="Cargando orden…">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" aria-hidden />
        </div>
      </MaintenancePortalShell>
    );
  }

  if (isError || !job) {
    return (
      <MaintenancePortalShell
        title="Orden no encontrada"
        backHref={MAINTENANCE_PORTAL_BASE}
      >
        <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          No pudimos cargar esta orden. Verifica que siga asignada a tu cuenta.
        </p>
      </MaintenancePortalShell>
    );
  }

  return <JobView job={job} />;
}

function JobView({ job }: { job: MaintenanceJob }) {
  const startJob = useStartMaintenanceJob();
  const completeJob = useCompleteMaintenanceJob();
  const uploadPhoto = useUploadMaintenancePhoto();
  const [notes, setNotes] = useState("");

  const location = [job.address, job.cityName, job.departmentName]
    .filter(Boolean)
    .join(", ");
  const mapsUrl = googleMapsUrl(job.latitude, job.longitude, location);
  const isClosed = job.status === "COMPLETED" || job.status === "CANCELLED";

  return (
    <MaintenancePortalShell
      title={job.billboardCode ?? job.code}
      subtitle={`${job.code} · ${formatBriloShortDate(job.scheduledAt)}`}
      backHref={MAINTENANCE_PORTAL_BASE}
    >
      <div className="flex flex-col gap-4">
        <section className="rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <MaintenanceStatusBadge status={job.status} />
            <MaintenanceCategoryBadge category={job.category} />
            {job.isOverdue ? (
              <span className="text-xs font-medium text-red-600 dark:text-red-400">
                Fuera de fecha
              </span>
            ) : null}
          </div>

          <h2 className="pt-3 text-xs font-medium text-muted-foreground">
            Problema reportado
          </h2>
          <p className="whitespace-pre-wrap pt-0.5 text-sm">
            {job.description}
          </p>

          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailRow
              icon={CalendarClock}
              label="Fecha programada"
              value={formatBriloShortDate(job.scheduledAt)}
            />
            <DetailRow
              icon={Ruler}
              label="Medidas"
              value={`${formatDimensions(job.width, job.height)} m`}
            />
          </dl>
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold leading-tight">
            <MapPin className="size-4 text-muted-foreground" aria-hidden />
            Ubicación
          </h2>
          <p className="pt-1 text-sm">{location || "Sin dirección"}</p>
          {job.reference ? (
            <p className="pt-0.5 text-xs text-muted-foreground">
              Referencia: {job.reference}
            </p>
          ) : null}

          {job.latitude != null && job.longitude != null ? (
            <div className="mt-3 overflow-hidden rounded-lg border">
              <iframe
                title="Mapa de la valla"
                src={openStreetMapEmbedUrl(job.latitude, job.longitude)}
                className="h-48 w-full"
                loading="lazy"
              />
            </div>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              No hay coordenadas registradas para esta valla.
            </p>
          )}

          {mapsUrl ? (
            <Button
              className="mt-3 h-11 w-full"
              variant="outline"
              onClick={() => window.open(mapsUrl, "_blank", "noopener")}
            >
              <ExternalLink aria-hidden />
              Abrir en Google Maps
            </Button>
          ) : null}
        </section>

        {job.status === "PENDING" ? (
          <Button
            className="h-12"
            disabled={startJob.isPending}
            onClick={() =>
              startJob.mutate(
                { id: job.id },
                {
                  onSuccess: () => toast.success("Trabajo iniciado."),
                  onError: (error) =>
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "No se pudo iniciar el trabajo.",
                    ),
                },
              )
            }
          >
            {startJob.isPending ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <PlayCircle aria-hidden />
            )}
            Iniciar trabajo
          </Button>
        ) : null}

        {isClosed ? null : (
          <MaintenancePhotoUploader
            isBusy={uploadPhoto.isPending}
            onUpload={(imageBase64) =>
              uploadPhoto.mutateAsync({ id: job.id, imageBase64 })
            }
          />
        )}

        {job.photos.length > 0 ? (
          <section className="rounded-xl border bg-card p-4">
            <h2 className="text-sm font-semibold leading-tight">
              Evidencia cargada ({job.photos.length})
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {job.photos.map((photo) => (
                <figure key={photo.id} className="space-y-1">
                  <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                    <Image
                      src={photo.url}
                      alt="Evidencia de mantenimiento"
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="(max-width: 672px) 50vw, 336px"
                    />
                  </div>
                  <figcaption className="text-[11px] text-muted-foreground">
                    {formatBriloShortDate(photo.createdAt)}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {job.status === "IN_PROGRESS" ? (
          <section className="rounded-xl border bg-card p-4">
            <h2 className="text-sm font-semibold leading-tight">
              Finalizar trabajo
            </h2>
            <p className="pt-0.5 text-xs text-muted-foreground">
              Agrega una nota si hubo algo relevante y marca la orden como
              finalizada.
            </p>
            <div className="pt-3">
              <Textarea
                rows={3}
                placeholder="Notas de cierre (opcional)"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <Button
              className="mt-3 h-12 w-full"
              disabled={completeJob.isPending}
              onClick={() =>
                completeJob.mutate(
                  { id: job.id, completionNotes: notes.trim() || undefined },
                  {
                    onSuccess: () => toast.success("Trabajo finalizado."),
                    onError: (error) =>
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "No se pudo finalizar el trabajo.",
                      ),
                  },
                )
              }
            >
              {completeJob.isPending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <CheckCircle2 aria-hidden />
              )}
              Marcar como finalizada
            </Button>
          </section>
        ) : null}

        {job.status === "COMPLETED" ? (
          <section className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-4" aria-hidden />
              Trabajo finalizado el {formatBriloShortDate(job.completedAt)}
            </p>
            {job.completionNotes ? (
              <p className="pt-1 text-xs text-muted-foreground">
                {job.completionNotes}
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    </MaintenancePortalShell>
  );
}

function DetailRow({
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
        <dd className="truncate text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}
