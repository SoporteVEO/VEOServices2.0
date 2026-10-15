"use client";

import { useState, type ReactNode } from "react";
import NextImage from "next/image";
import { Download, Eye, FileImage, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  getProductionOrderArtUrl,
  useProductionOrderArtUrl,
} from "@/api/production-orders/production-orders.get";
import type { ProductionOrderArt } from "@/api/production-orders/production-orders.types";
import { Badge } from "@/components/primitives/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/primitives/ui/dialog";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatBriloShortDate } from "@/lib/format";
import { artFormatLabel, isPreviewableArt } from "./production-order-art-file";

type Props = {
  itemId: string;
  billboardCode: string | null;
  art: ProductionOrderArt;
  actions?: ReactNode;
};

export function ProductionOrderArtPreview({
  itemId,
  billboardCode,
  art,
  actions,
}: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const isImage = isPreviewableArt(art.mimeType);
  const canPreview = isImage || art.mimeType === "application/pdf";
  const { data: url, isError } = useProductionOrderArtUrl(
    itemId,
    art.uploadedAt,
  );

  async function handleDownload() {
    setIsDownloading(true);
    try {
      const downloadUrl = await getProductionOrderArtUrl(itemId, {
        download: true,
      });
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo descargar el arte.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        disabled={!canPreview || !url}
        onClick={() => setPreviewOpen(true)}
        className="relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40 enabled:cursor-zoom-in sm:w-44"
        aria-label="Ver arte"
      >
        {isImage && url ? (
          <NextImage
            src={url}
            alt={`Arte ${billboardCode ?? ""}`.trim()}
            fill
            sizes="176px"
            unoptimized
            className="object-contain"
          />
        ) : isImage && !isError ? (
          <Skeleton className="size-full" />
        ) : (
          <ArtFileIcon mimeType={art.mimeType} />
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-xs font-medium" title={art.fileName}>
            {art.fileName}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              {artFormatLabel(art.mimeType)}
            </Badge>
            <span>Cargado el {formatBriloShortDate(art.uploadedAt)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {canPreview ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!url}
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="size-3.5" aria-hidden />
              Ver
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            loading={isDownloading}
            onClick={() => void handleDownload()}
          >
            <Download className="size-3.5" aria-hidden />
            Descargar
          </Button>
          {actions}
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex h-[88dvh] w-full max-w-[min(96vw,1200px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,1200px)]">
          <div className="flex items-center gap-2 border-b px-4 py-3 pe-12">
            <DialogTitle className="min-w-0 flex-1 truncate text-sm font-semibold">
              Arte {billboardCode ? `· ${billboardCode}` : ""}
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              loading={isDownloading}
              onClick={() => void handleDownload()}
            >
              <Download className="size-3.5" aria-hidden />
              Descargar
            </Button>
          </div>
          <div className="relative min-h-0 flex-1 bg-muted/40">
            {url && isImage ? (
              <NextImage
                src={url}
                alt={`Arte ${billboardCode ?? ""}`.trim()}
                fill
                sizes="96vw"
                unoptimized
                className="object-contain p-2"
                priority
              />
            ) : url ? (
              <iframe
                src={url}
                title={art.fileName}
                className="size-full border-0"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ArtFileIcon({ mimeType }: { mimeType: string }) {
  const Icon = mimeType === "application/pdf" ? FileText : FileImage;
  return (
    <span className="flex flex-col items-center gap-1 text-muted-foreground">
      <Icon className="size-7" aria-hidden />
      <span className="text-[10px] font-semibold">
        {artFormatLabel(mimeType)}
      </span>
    </span>
  );
}
