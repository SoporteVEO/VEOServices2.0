"use client";

import { useState } from "react";
import NextImage from "next/image";
import Link from "next/link";
import {
  Calendar,
  Check,
  Download,
  ExternalLink,
  ImagePlus,
  Loader2,
  StickyNote,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { usePublishMaintenancePhoto } from "@/api/maintenance/maintenance.mutations";
import type { MaintenancePhoto } from "@/api/maintenance/maintenance.types";
import { Badge } from "@/components/primitives/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/primitives/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatBriloShortDate } from "@/lib/format";
import { personName } from "./maintenance-const";

type Props = {
  photo: MaintenancePhoto | null;
  jobCode: string;
  billboardCode: string | null;
  onOpenChange: (open: boolean) => void;
};

export function MaintenancePhotoPreviewDialog({
  photo,
  jobCode,
  billboardCode,
  onOpenChange,
}: Props) {
  return (
    <Dialog open={photo !== null} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[92dvh] w-full max-w-[min(96vw,1100px)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[min(96vw,1100px)]"
        showCloseButton
      >
        <DialogTitle className="sr-only">
          {`Evidencia de mantenimiento ${jobCode}`}
        </DialogTitle>

        {photo ? (
          <PreviewBody
            key={photo.id}
            photo={photo}
            jobCode={jobCode}
            billboardCode={billboardCode}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PreviewBody({
  photo,
  jobCode,
  billboardCode,
}: {
  photo: MaintenancePhoto;
  jobCode: string;
  billboardCode: string | null;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const publish = usePublishMaintenancePhoto();
  const isPublished = photo.publishedImageId !== null;

  async function handleDownload() {
    setIsDownloading(true);
    try {
      const response = await fetch(photo.url);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const blob = await response.blob();
      triggerBlobDownload(blob, buildFileName(photo, jobCode, blob.type));
    } catch {
      toast.error("No se pudo descargar la imagen.");
    } finally {
      setIsDownloading(false);
    }
  }

  function handlePublish() {
    publish.mutate(
      { photoId: photo.id },
      {
        onSuccess: () => toast.success("Evidencia agregada a Imágenes."),
        onError: (error) =>
          toast.error(
            error instanceof Error
              ? error.message
              : "No se pudo agregar la evidencia a Imágenes.",
          ),
      },
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-muted/40 p-2 sm:p-4">
        <div className="relative aspect-4/3 max-h-full w-full max-w-full">
          <NextImage
            src={photo.url}
            alt={photo.note ?? `Evidencia de mantenimiento ${jobCode}`}
            fill
            sizes="(min-width: 768px) 70vw, 100vw"
            unoptimized
            className="object-contain"
            priority
          />
        </div>
      </div>

      <aside className="flex max-h-[52dvh] shrink-0 flex-col gap-4 overflow-y-auto border-t p-5 md:max-h-none md:w-80 md:border-l md:border-t-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            {jobCode}
          </Badge>
          {billboardCode ? (
            <Badge variant="outline" className="font-mono">
              {billboardCode}
            </Badge>
          ) : null}
        </div>

        <ul className="space-y-2.5 text-sm">
          <li className="flex items-start gap-2.5">
            <Calendar
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span>{formatBriloShortDate(photo.createdAt)}</span>
          </li>
          {photo.uploadedBy ? (
            <li className="flex items-start gap-2.5">
              <UserIcon
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span>{personName(photo.uploadedBy)}</span>
            </li>
          ) : null}
          {photo.note ? (
            <li className="flex items-start gap-2.5">
              <StickyNote
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="whitespace-pre-wrap">{photo.note}</span>
            </li>
          ) : null}
        </ul>

        <div className="mt-auto flex flex-col gap-2 border-t pt-4">
          <Button
            variant="outline"
            sizeVariant="lg"
            icon={isDownloading ? Loader2 : Download}
            iconClassName={isDownloading ? "animate-spin" : ""}
            disabled={isDownloading}
            onClick={handleDownload}
            className="w-full justify-center"
          >
            {isDownloading ? "Descargando..." : "Descargar"}
          </Button>

          {isPublished ? (
            <>
              <div className="flex items-center justify-center gap-2 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                <Check className="size-4" aria-hidden />
                Ya está en Imágenes
              </div>
              <Button
                asChild
                variant="ghost"
                sizeVariant="lg"
                className="w-full justify-center"
              >
                <Link href="/dashboard/images" target="_blank">
                  <ExternalLink className="size-4" aria-hidden />
                  Abrir módulo Imágenes
                </Link>
              </Button>
            </>
          ) : (
            <Button
              sizeVariant="lg"
              icon={publish.isPending ? Loader2 : ImagePlus}
              iconClassName={publish.isPending ? "animate-spin" : ""}
              disabled={publish.isPending}
              onClick={handlePublish}
              className="w-full justify-center"
            >
              {publish.isPending ? "Agregando..." : "Agregar a Imágenes"}
            </Button>
          )}

          <p className="text-center text-[11px] text-muted-foreground">
            Se guarda como &ldquo;Imagen de mantenimiento de valla&rdquo; a
            nombre de quien tomó la foto.
          </p>
        </div>
      </aside>
    </div>
  );
}

function buildFileName(
  photo: MaintenancePhoto,
  jobCode: string,
  mimeType: string,
): string {
  const safeJob = jobCode.replace(/[^A-Za-z0-9_-]/g, "-");
  const datePart = photo.createdAt.slice(0, 10);
  const extension = mimeType.split("/")[1]?.split("+")[0] || "webp";
  return `${safeJob}_${datePart}_${photo.id.slice(0, 8)}.${extension}`;
}

function triggerBlobDownload(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
