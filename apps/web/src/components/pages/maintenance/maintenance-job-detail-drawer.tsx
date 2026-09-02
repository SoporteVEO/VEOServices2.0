"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Pencil,
  Ruler,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useMaintenanceJob } from "@/api/maintenance/maintenance.get";
import {
  useCancelMaintenanceJob,
  useDeleteMaintenancePhoto,
  useReopenMaintenanceJob,
} from "@/api/maintenance/maintenance.mutations";
import type { MaintenanceJob } from "@/api/maintenance/maintenance.types";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBriloShortDate, formatDimensions } from "@/lib/format";
import { googleMapsUrl } from "@/lib/installer-portal";
import { MaintenanceCategoryBadge } from "./maintenance-category-badge";
import { personName } from "./maintenance-const";
import { MaintenanceJobFormDialog } from "./maintenance-job-form-dialog";
import { MaintenanceJobHistory } from "./maintenance-job-history";
import { MaintenancePhotoPreviewDialog } from "./maintenance-photo-preview-dialog";
import { MaintenanceStatusBadge } from "./maintenance-status-badge";

type Props = {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MaintenanceJobDetailDrawer({
  jobId,
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
        {jobId ? (
          <DrawerBody
            key={jobId}
            jobId={jobId}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function DrawerBody({
  jobId,
  onClose,
}: {
  jobId: string;
  onClose: () => void;
}) {
  const { data: job, isLoading, isError } = useMaintenanceJob(jobId);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" aria-hidden />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          No pudimos cargar esta orden de mantenimiento.
        </p>
      </div>
    );
  }

  return (
    <>
      <DrawerHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <DrawerTitle className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm">{job.code}</span>
              <MaintenanceStatusBadge status={job.status} />
              <MaintenanceCategoryBadge category={job.category} />
            </DrawerTitle>
            <DrawerDescription className="truncate">
              {job.billboardCode ?? "Valla sin código"} ·{" "}
              {formatBriloShortDate(job.scheduledAt)}
            </DrawerDescription>
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

      <Tabs
        defaultValue="detalle"
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <TabsList className="mx-4 mt-3 self-start">
          <TabsTrigger value="detalle">Detalle</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent
          value="detalle"
          className="min-h-0 flex-1 data-[state=inactive]:hidden"
        >
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-5 p-4">
              <DetailSection job={job} />
              <PhotosSection job={job} />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent
          value="historial"
          className="min-h-0 flex-1 data-[state=inactive]:hidden"
        >
          <ScrollArea className="h-full">
            <div className="p-4">
              <MaintenanceJobHistory job={job} />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <DrawerFooter className="border-t">
        <JobActions job={job} onEdit={() => setEditOpen(true)} />
      </DrawerFooter>

      <MaintenanceJobFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        job={job}
      />
    </>
  );
}

function DetailSection({ job }: { job: MaintenanceJob }) {
  const location = [job.address, job.cityName, job.departmentName]
    .filter(Boolean)
    .join(", ");
  const mapsUrl = googleMapsUrl(job.latitude, job.longitude, location);

  return (
    <section className="flex flex-col gap-3">
      <div className="rounded-lg border bg-card p-3">
        <h4 className="text-xs font-semibold text-muted-foreground">
          Problema reportado
        </h4>
        <p className="whitespace-pre-wrap pt-1 text-sm">{job.description}</p>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoRow
          icon={UserIcon}
          label="Asignada a"
          value={personName(job.assignedUser)}
        />
        <InfoRow
          icon={Ruler}
          label="Medidas"
          value={`${formatDimensions(job.width, job.height)} m`}
        />
        <InfoRow
          icon={MapPin}
          label="Ubicación"
          value={location || "Sin dirección"}
        />
        <InfoRow
          icon={UserIcon}
          label="Creada por"
          value={job.createdBy ? personName(job.createdBy) : "—"}
        />
      </dl>

      {job.reference ? (
        <p className="text-xs text-muted-foreground">
          Referencia: {job.reference}
        </p>
      ) : null}

      {mapsUrl ? (
        <Button
          variant="outline"
          sizeVariant="sm"
          icon={ExternalLink}
          className="self-start"
          onClick={() => window.open(mapsUrl, "_blank", "noopener")}
        >
          Ver en Google Maps
        </Button>
      ) : null}
    </section>
  );
}

function PhotosSection({ job }: { job: MaintenanceJob }) {
  const deletePhoto = useDeleteMaintenancePhoto();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const preview = job.photos.find((photo) => photo.id === previewId) ?? null;

  return (
    <section>
      <h4 className="pb-2 text-sm font-semibold">
        Evidencia fotográfica{" "}
        <span className="text-xs font-normal text-muted-foreground">
          ({job.photos.length})
        </span>
      </h4>

      {job.photos.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          El usuario de mantenimiento aún no ha subido fotos.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {job.photos.map((photo) => (
            <figure key={photo.id} className="group space-y-1">
              <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                <button
                  type="button"
                  onClick={() => setPreviewId(photo.id)}
                  aria-label="Ver evidencia en grande"
                  className="absolute inset-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Image
                    src={photo.url}
                    alt={photo.note ?? "Evidencia de mantenimiento"}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 720px) 50vw, 240px"
                  />
                </button>

                {photo.publishedImageId ? (
                  <Badge
                    className="pointer-events-none absolute left-1 top-1 gap-1 border-transparent bg-emerald-600 px-1.5 text-[10px] text-white"
                    title="Esta foto ya está en el módulo Imágenes"
                  >
                    <ImageIcon className="size-3" aria-hidden />
                    En Imágenes
                  </Badge>
                ) : null}

                <PrimitiveButton
                  variant="destructive"
                  size="icon"
                  className="absolute right-1 top-1 size-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  aria-label="Eliminar evidencia"
                  disabled={deletePhoto.isPending}
                  onClick={() =>
                    deletePhoto.mutate(
                      { photoId: photo.id },
                      {
                        onSuccess: () => toast.success("Evidencia eliminada."),
                        onError: (error) =>
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "No se pudo eliminar la evidencia.",
                          ),
                      },
                    )
                  }
                >
                  <Trash2 className="size-3.5" />
                </PrimitiveButton>
              </div>
              <figcaption className="text-[11px] text-muted-foreground">
                {formatBriloShortDate(photo.createdAt)}
                {photo.note ? ` · ${photo.note}` : ""}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <MaintenancePhotoPreviewDialog
        photo={preview}
        jobCode={job.code}
        billboardCode={job.billboardCode}
        onOpenChange={(open) => {
          if (!open) setPreviewId(null);
        }}
      />
    </section>
  );
}

function JobActions({
  job,
  onEdit,
}: {
  job: MaintenanceJob;
  onEdit: () => void;
}) {
  const cancelJob = useCancelMaintenanceJob();
  const reopenJob = useReopenMaintenanceJob();
  const isClosed = job.status === "COMPLETED" || job.status === "CANCELLED";
  const isBusy = cancelJob.isPending || reopenJob.isPending;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary" className="mr-auto">
        Creada {formatBriloShortDate(job.createdAt)}
      </Badge>

      {isClosed ? (
        <Button
          variant="outline"
          sizeVariant="sm"
          disabled={isBusy}
          onClick={() =>
            reopenJob.mutate(
              { id: job.id },
              {
                onSuccess: () => toast.success("Orden reabierta."),
                onError: (error) =>
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "No se pudo reabrir la orden.",
                  ),
              },
            )
          }
        >
          Reabrir
        </Button>
      ) : (
        <Button
          variant="outline"
          sizeVariant="sm"
          disabled={isBusy}
          onClick={() =>
            cancelJob.mutate(
              { id: job.id },
              {
                onSuccess: () => toast.success("Orden cancelada."),
                onError: (error) =>
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "No se pudo cancelar la orden.",
                  ),
              },
            )
          }
        >
          Cancelar orden
        </Button>
      )}

      <Button sizeVariant="sm" icon={Pencil} onClick={onEdit}>
        Editar
      </Button>
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
