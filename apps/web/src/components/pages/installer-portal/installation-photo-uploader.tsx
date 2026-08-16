"use client";

import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/primitives/ui/button";
import { blobToBase64, compressImage } from "@/lib/compress-image";

const MAX_IMAGE_SIZE = 25 * 1024 * 1024;

type Props = {
  title: string;
  description: string;
  buttonLabel: string;
  /** Receives the compressed, raw base64 payload (no data URL prefix). */
  onUpload: (imageBase64: string) => Promise<unknown>;
  onDelete?: () => Promise<unknown>;
  previewUrl?: string | null;
  isBusy?: boolean;
};

/**
 * Big-target camera capture tuned for phones: `capture="environment"` opens
 * the rear camera directly, and the photo is downscaled in the browser so the
 * JSON payload stays small on a mobile connection.
 */
export function InstallationPhotoUploader({
  title,
  description,
  buttonLabel,
  onUpload,
  onDelete,
  previewUrl,
  isBusy = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleFileSelected(file: File | null | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen válida.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("La imagen supera el tamaño máximo permitido (25MB).");
      return;
    }

    setIsProcessing(true);
    try {
      const compressed = await compressImage(file);
      const imageBase64 = await blobToBase64(compressed.blob);
      await onUpload(imageBase64);
      toast.success("Imagen cargada correctamente.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo cargar la imagen.",
      );
    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm(`¿Eliminar "${title}"?`)) return;
    try {
      await onDelete();
      toast.success("Imagen eliminada.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo eliminar la imagen.",
      );
    }
  }

  const busy = isBusy || isProcessing;

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ImagePlus className="size-4.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold leading-tight">{title}</h2>
          <p className="pt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {previewUrl ? (
        <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-lg border bg-muted">
          <Image
            src={previewUrl}
            alt={title}
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 672px) 100vw, 672px"
          />
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          void handleFileSelected(event.target.files?.[0]);
        }}
      />

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="h-11 flex-1"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Camera aria-hidden />
          )}
          {buttonLabel}
        </Button>

        {previewUrl && onDelete ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 text-destructive hover:text-destructive"
            disabled={busy}
            onClick={() => void handleDelete()}
          >
            <Trash2 aria-hidden />
            Eliminar
          </Button>
        ) : null}
      </div>
    </section>
  );
}
