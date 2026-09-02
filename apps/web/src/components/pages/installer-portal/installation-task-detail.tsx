"use client";

import {
  CalendarCheck,
  CalendarClock,
  HardHat,
  Loader2,
  Ruler,
  Tag,
} from "lucide-react";
import Image from "next/image";
import { useInstallationTask } from "@/api/installations/installations.get";
import {
  useDeleteVulcanizadoImage,
  useUploadInstallationImage,
  useUploadVulcanizadoImage,
} from "@/api/installations/installations.post";
import type { InstallationTask } from "@/api/installations/installations.types";
import { Badge } from "@/components/primitives/ui/badge";
import { ProductionOrderStatusBadge } from "@/components/pages/production-orders-shared/production-order-status-badge";
import { formatBriloShortDate, formatDimensions } from "@/lib/format";
import { INSTALLER_PORTAL_BASE } from "@/lib/installer-portal";
import { InstallationLocationCard } from "./installation-location-card";
import { InstallationPhotoUploader } from "./installation-photo-uploader";
import { InstallerPortalShell } from "./installer-portal-shell";
import { usePortalSession } from "./use-portal-session";

export function InstallationTaskDetail({ itemId }: { itemId: string }) {
  const { data: task, isLoading, isError } = useInstallationTask(itemId);

  if (isLoading) {
    return (
      <InstallerPortalShell title="Cargando instalación…">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" aria-hidden />
        </div>
      </InstallerPortalShell>
    );
  }

  if (isError || !task) {
    return (
      <InstallerPortalShell
        title="Instalación no encontrada"
        backHref={INSTALLER_PORTAL_BASE}
      >
        <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          No pudimos cargar esta instalación. Verifica el código QR o comunícate
          con el equipo de producción.
        </p>
      </InstallerPortalShell>
    );
  }

  return <TaskView task={task} />;
}

function TaskView({ task }: { task: InstallationTask }) {
  const { capabilities } = usePortalSession();
  const uploadVulcanizado = useUploadVulcanizadoImage();
  const deleteVulcanizado = useDeleteVulcanizadoImage();
  const uploadInstallation = useUploadInstallationImage();

  const campaign = task.customerCompany ?? task.customerName;
  const installer = task.assignedInstaller
    ? [task.assignedInstaller.firstName, task.assignedInstaller.lastName]
        .filter(Boolean)
        .join(" ")
    : null;

  return (
    <InstallerPortalShell
      title={task.billboardCode ?? "Valla sin código"}
      subtitle={`${task.offerNumber} · ${campaign}`}
      backHref={INSTALLER_PORTAL_BASE}
    >
      <div className="flex flex-col gap-4">
        <section className="rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <ProductionOrderStatusBadge status={task.status} />
            <Badge variant="secondary" className="gap-1 font-mono">
              <Tag className="size-3" aria-hidden />
              {task.billboardCode ?? "—"}
            </Badge>
          </div>

          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailRow
              icon={Ruler}
              label="Medidas"
              value={`${formatDimensions(task.width, task.height)} m`}
            />
            {capabilities.canSeeInstallationDetails ? (
              <>
                <DetailRow
                  icon={HardHat}
                  label="Instalador asignado"
                  value={installer ?? "Sin asignar"}
                />
                <DetailRow
                  icon={CalendarClock}
                  label="Fecha programada"
                  value={formatBriloShortDate(task.scheduledInstallationAt)}
                />
                <DetailRow
                  icon={CalendarCheck}
                  label="Fecha de instalación"
                  value={
                    task.installedAt
                      ? formatBriloShortDate(task.installedAt)
                      : "Pendiente"
                  }
                />
              </>
            ) : null}
          </dl>

          {capabilities.canSeeInstallationDetails && task.advisorFullName ? (
            <p className="pt-3 text-xs text-muted-foreground">
              Asesor responsable: {task.advisorFullName}
            </p>
          ) : null}
        </section>

        {capabilities.canSeeLocation ? (
          <InstallationLocationCard task={task} />
        ) : null}

        {capabilities.canUploadVulcanizado ? (
          <InstallationPhotoUploader
            title="Imagen de vulcanizado"
            description="Foto del material vulcanizado antes de montarlo en la valla."
            buttonLabel={
              task.vulcanizadoImageUrl
                ? "Reemplazar imagen de vulcanizado"
                : "Subir imagen de Vulcanizado"
            }
            previewUrl={task.vulcanizadoImageUrl}
            isBusy={uploadVulcanizado.isPending || deleteVulcanizado.isPending}
            onUpload={(imageBase64) =>
              uploadVulcanizado.mutateAsync({ itemId: task.id, imageBase64 })
            }
            onDelete={() => deleteVulcanizado.mutateAsync({ itemId: task.id })}
          />
        ) : null}

        {capabilities.canUploadInstallation ? (
          <InstallationPhotoUploader
            title="Imagen de instalación"
            description="Foto de la valla ya instalada. Se registra junto al código de valla."
            buttonLabel="Subir imagen de instalación"
            isBusy={uploadInstallation.isPending}
            onUpload={(imageBase64) =>
              uploadInstallation.mutateAsync({ itemId: task.id, imageBase64 })
            }
          />
        ) : null}

        {capabilities.canUploadInstallation &&
        task.installationImages.length > 0 ? (
          <section className="rounded-xl border bg-card p-4">
            <h2 className="text-sm font-semibold leading-tight">
              Imágenes de instalación cargadas
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {task.installationImages.map((image) => (
                <figure key={image.id} className="space-y-1">
                  <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                    <Image
                      src={image.url}
                      alt="Imagen de instalación"
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="(max-width: 672px) 50vw, 336px"
                    />
                  </div>
                  <figcaption className="text-[11px] text-muted-foreground">
                    {formatBriloShortDate(image.createdAt)}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </InstallerPortalShell>
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
