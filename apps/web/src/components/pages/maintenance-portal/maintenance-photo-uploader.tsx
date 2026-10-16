"use client";

import Image from "next/image";
import { Camera, ImagePlus, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/primitives/ui/button";
import { PendingBar } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { blobToBase64, compressImage } from "@/lib/compress-image";

const MAX_IMAGE_SIZE = 25 * 1024 * 1024;

type Props = {
  /** Receives the compressed, raw base64 payload (no data URL prefix). */
  onUpload: (imageBase64: string, note?: string) => Promise<unknown>;
  isBusy?: boolean;
  disabled?: boolean;
};

interface QueuedPhoto {
  id: string;
  file: File;
  previewUrl: string;
  note: string;
}

/**
 * Multi-shot evidence capture. Picked photos wait in a queue so each one can
 * carry its own comment, then upload one at a time so a partial failure still
 * keeps the ones that made it and progress stays visible on a slow connection.
 */
export function MaintenancePhotoUploader({
  onUpload,
  isBusy = false,
  disabled = false,
}: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueuedPhoto[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );

  function handleFilesSelected(fileList: FileList | null) {
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

    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
    if (files.length === 0) return;

    setQueue((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        note: "",
      })),
    ]);
  }

  function removeFromQueue(photo: QueuedPhoto) {
    URL.revokeObjectURL(photo.previewUrl);
    setQueue((prev) => prev.filter((item) => item.id !== photo.id));
  }

  function updateNote(id: string, note: string) {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, note } : item)),
    );
  }

  async function handleUploadQueue() {
    const items = queue;
    if (items.length === 0) return;

    setProgress({ done: 0, total: items.length });
    let uploaded = 0;

    for (const item of items) {
      try {
        const compressed = await compressImage(item.file);
        const imageBase64 = await blobToBase64(compressed.blob);
        await onUpload(imageBase64, item.note.trim() || undefined);
        uploaded += 1;
        setProgress({ done: uploaded, total: items.length });
        removeFromQueue(item);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : `No se pudo subir "${item.file.name}".`,
        );
      }
    }

    setProgress(null);

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
            Toma varias fotos del antes y después. Puedes agregar un comentario
            a cada foto antes de subirla.
          </p>
        </div>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => handleFilesSelected(event.target.files)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => handleFilesSelected(event.target.files)}
      />

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="h-11 flex-1"
          variant={queue.length > 0 ? "outline" : "default"}
          disabled={busy || disabled}
          onClick={() => cameraRef.current?.click()}
        >
          <Camera aria-hidden />
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

      {queue.length > 0 ? (
        <div className="mt-3 flex flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {queue.map((item) => (
              <li
                key={item.id}
                className="flex gap-3 rounded-lg border bg-muted/30 p-2"
              >
                <div className="relative size-20 shrink-0 overflow-hidden rounded-md border bg-muted">
                  <Image
                    src={item.previewUrl}
                    alt={item.file.name}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Textarea
                    rows={2}
                    maxLength={1000}
                    placeholder="Comentario de la foto (opcional)"
                    value={item.note}
                    disabled={busy}
                    onChange={(event) => updateNote(item.id, event.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label="Quitar foto"
                  disabled={busy}
                  onClick={() => removeFromQueue(item)}
                >
                  <X aria-hidden />
                </Button>
              </li>
            ))}
          </ul>

          <Button
            type="button"
            className="h-11"
            disabled={busy || disabled}
            aria-busy={busy || undefined}
            onClick={() => void handleUploadQueue()}
          >
            <Upload aria-hidden />
            {queue.length === 1 ? "Subir foto" : `Subir ${queue.length} fotos`}
            {busy ? <PendingBar /> : null}
          </Button>
        </div>
      ) : null}

      {progress ? (
        <p className="pt-2 text-center text-xs text-muted-foreground">
          Subiendo {Math.min(progress.done + 1, progress.total)} de{" "}
          {progress.total}…
        </p>
      ) : null}
    </section>
  );
}
