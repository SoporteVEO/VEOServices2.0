"use client";

import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/primitives/ui/button";
import { blobToBase64, compressImage } from "@/lib/compress-image";

const MAX_IMAGE_SIZE = 25 * 1024 * 1024;

type Props = {
  /** Receives the compressed, raw base64 payload (no data URL prefix). */
  onUpload: (imageBase64: string) => Promise<unknown>;
  isBusy?: boolean;
  disabled?: boolean;
};

/**
 * Multi-shot evidence capture. Photos are uploaded one at a time so a partial
 * failure still keeps the ones that made it, and progress stays visible on a
 * slow mobile connection.
 */
export function MaintenancePhotoUploader({
  onUpload,
  isBusy = false,
  disabled = false,
}: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );

  async function handleFilesSelected(fileList: FileList | null) {
    const files = [...(fileList ?? [])].filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" no es una imagen válida.`);
        return false;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`"${file.name}" supera los 25MB permitidos.`);
        return false;
      }
      return true;
    });
    if (files.length === 0) return;

    setProgress({ done: 0, total: files.length });
    let uploaded = 0;

    for (const file of files) {
      try {
        const compressed = await compressImage(file);
        const imageBase64 = await blobToBase64(compressed.blob);
        await onUpload(imageBase64);
        uploaded += 1;
        setProgress({ done: uploaded, total: files.length });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : `No se pudo subir "${file.name}".`,
        );
      }
    }

    setProgress(null);
    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";

    if (uploaded > 0) {
      toast.success(
        uploaded === 1
          ? "Evidencia cargada."
          : `${uploaded} evidencias cargadas.`,
      );
    }
  }

  const busy = isBusy || progress !== null;

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ImagePlus className="size-4.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold leading-tight">
            Evidencia del trabajo
          </h2>
          <p className="pt-0.5 text-xs text-muted-foreground">
            Toma varias fotos del antes y después. Puedes subir todas las que
            necesites.
          </p>
        </div>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          void handleFilesSelected(event.target.files);
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          void handleFilesSelected(event.target.files);
        }}
      />

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="h-11 flex-1"
          disabled={busy || disabled}
          onClick={() => cameraRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Camera aria-hidden />
          )}
          Tomar foto
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1"
          disabled={busy || disabled}
          onClick={() => galleryRef.current?.click()}
        >
          <ImagePlus aria-hidden />
          Elegir de galería
        </Button>
      </div>

      {progress ? (
        <p className="pt-2 text-center text-xs text-muted-foreground">
          Subiendo {progress.done + 1} de {progress.total}…
        </p>
      ) : null}
    </section>
  );
}
