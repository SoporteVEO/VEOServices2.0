"use client";

import { useState } from "react";
import NextImage from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
} from "lucide-react";
import { S3_IMAGE_TYPE_SHORT_LABELS } from "@/api/s3-images/s3-images.get";
import type { AgentImage } from "@/api/agent/agent.types";
import { Badge } from "@/components/primitives/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/primitives/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/lib/format";
import { downloadBlob, safeFileName } from "@/lib/pdf-download";

interface AgentImageDialogProps {
  images: AgentImage[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
}

function fileNameFor(image: AgentImage) {
  const extension = new URL(image.url).pathname.split(".").pop() ?? "jpg";
  const date = image.createdAt.slice(0, 10);
  return safeFileName(
    `${image.code ?? "imagen"}_${date}_${image.id.slice(0, 6)}.${extension}`,
  );
}

export function AgentImageDialog({
  images,
  index,
  onIndexChange,
}: AgentImageDialogProps) {
  const [downloading, setDownloading] = useState(false);
  const image = index !== null ? images[index] : undefined;

  async function handleDownload() {
    if (!image) return;
    setDownloading(true);
    try {
      const response = await fetch(image.url);
      if (!response.ok) throw new Error(String(response.status));
      downloadBlob(await response.blob(), fileNameFor(image));
    } catch {
      window.open(image.url, "_blank", "noopener");
    } finally {
      setDownloading(false);
    }
  }

  function step(delta: number) {
    if (index === null) return;
    onIndexChange((index + delta + images.length) % images.length);
  }

  return (
    <Dialog
      open={image !== undefined}
      onOpenChange={(open) => !open && onIndexChange(null)}
    >
      <DialogContent
        className="flex max-h-[92dvh] w-full max-w-[min(96vw,1200px)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[min(96vw,1200px)]"
        showCloseButton
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") step(1);
          if (event.key === "ArrowLeft") step(-1);
        }}
      >
        <DialogTitle className="sr-only">
          {`Imagen ${image?.code ?? ""}`}
        </DialogTitle>
        {image ? (
          <>
            <div className="relative flex min-h-0 flex-1 items-center justify-center bg-muted/40 p-2 sm:p-4">
              <div className="relative aspect-4/3 max-h-[75dvh] w-full">
                <NextImage
                  key={image.id}
                  src={image.url}
                  alt={`Imagen ${image.code ?? ""}`}
                  fill
                  sizes="96vw"
                  unoptimized
                  className="object-contain"
                  priority
                />
              </div>
              {images.length > 1 ? (
                <>
                  <Button
                    variant="secondary"
                    className="absolute left-3 top-1/2 size-9 -translate-y-1/2 p-0"
                    icon={ChevronLeft}
                    onClick={() => step(-1)}
                    aria-label="Imagen anterior"
                  />
                  <Button
                    variant="secondary"
                    className="absolute right-3 top-1/2 size-9 -translate-y-1/2 p-0"
                    icon={ChevronRight}
                    onClick={() => step(1)}
                    aria-label="Imagen siguiente"
                  />
                </>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary" className="font-mono">
                  {image.code ?? "Sin código"}
                </Badge>
                <Badge variant="outline">
                  {S3_IMAGE_TYPE_SHORT_LABELS[image.type]}
                </Badge>
                <span className="text-muted-foreground">
                  {formatShortDate(new Date(image.createdAt))} ·{" "}
                  {image.uploadedBy}
                </span>
                <span className="text-xs text-muted-foreground">
                  {(index ?? 0) + 1}/{images.length}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <a href={image.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                    Abrir
                  </a>
                </Button>
                <Button
                  icon={Download}
                  loading={downloading}
                  disabled={downloading}
                  onClick={handleDownload}
                >
                  Descargar
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
