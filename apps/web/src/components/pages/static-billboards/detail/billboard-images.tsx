"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { Button } from "@/components/primitives/ui/button";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import ImageViewerMotion from "@/components/commerce-ui/image-viewer-motion";
import { formatHumanDate, toYYYYMMDD } from "@/lib/format";
import {
  type BillboardImageItem,
  getBillboardImageUrl,
  useBillboardImages,
} from "@/api/billboards/billboards.get";

const COLLAPSED_COUNT = 6;

interface BillboardImagesProps {
  billboardId: number;
  billboardCode: string | null;
}

export function BillboardImages({
  billboardId,
  billboardCode,
}: BillboardImagesProps) {
  const [showAll, setShowAll] = useState(false);

  const imagesQuery = useBillboardImages({ billboardId });

  const images = useMemo(() => imagesQuery.data ?? [], [imagesQuery.data]);

  const sorted = useMemo(
    () =>
      [...images].sort((a, b) => {
        const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime;
        return b.imageId - a.imageId;
      }),
    [images],
  );

  const visible = showAll ? sorted : sorted.slice(0, COLLAPSED_COUNT);
  const hasMore = sorted.length > COLLAPSED_COUNT;

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">
              Imágenes ({sorted.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Ordenadas de la más reciente a la más antigua
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {imagesQuery.isLoading ? (
          <BillboardImagesSkeleton />
        ) : sorted.length === 0 ? (
          <BillboardImagesEmpty />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((image) => (
                <BillboardImageCard
                  key={image.imageId}
                  image={image}
                  billboardCode={billboardCode}
                />
              ))}
            </div>

            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setShowAll((s) => !s)}
              >
                {showAll ? <ChevronUp /> : <ChevronDown />}
                {showAll
                  ? "Mostrar menos"
                  : `Ver ${sorted.length - COLLAPSED_COUNT} más`}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BillboardImageCard({
  image,
  billboardCode,
}: {
  image: BillboardImageItem;
  billboardCode: string | null;
}) {
  const [loaded, setLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const url = getBillboardImageUrl(image.imageId);

  if (!url) return null;

  const title = billboardCode
    ? `Valla ${billboardCode}`
    : `Imagen ${image.imageId}`;

  async function handleDownload(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (downloading || !url) return;
    setDownloading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const blob = await response.blob();
      const extension = mimeToExtension(blob.type);
      const filename = buildFilename({
        billboardCode,
        imageId: image.imageId,
        uploadedAt: image.uploadedAt,
        extension,
      });
      triggerBlobDownload(blob, filename);
    } catch (error) {
      console.error("Failed to download billboard image", error);
      toast.error("No se pudo descargar la imagen");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <figure className="flex flex-col gap-1.5">
      <div className="group relative aspect-4/3 w-full overflow-hidden rounded-md border bg-muted">
        {!loaded && <Skeleton className="absolute inset-0 z-10 rounded-none" />}
        <ImageViewerMotion
          imageUrl={url}
          imageTitle={title}
          className="block size-full min-h-0"
          classNameThumbnailViewer="size-full object-cover transition-transform duration-300 hover:scale-105 rounded-none"
          onThumbnailLoad={() => setLoaded(true)}
        />
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          aria-label="Descargar imagen"
          className="absolute top-1.5 right-1.5 z-20 inline-flex size-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 shadow-sm backdrop-blur-sm transition-opacity hover:bg-black/75 focus-visible:opacity-100 focus-visible:outline-none disabled:cursor-wait disabled:opacity-70 group-hover:opacity-100"
        >
          {downloading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
        </button>
      </div>
      <figcaption className="flex flex-col gap-0.5">
        <span className="truncate text-[11px] font-medium tabular-nums text-foreground">
          {formatHumanDate(image.uploadedAt)}
        </span>
        {image.notes && (
          <span
            className="truncate text-[11px] text-muted-foreground"
            title={image.notes}
          >
            {image.notes}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

function mimeToExtension(mime: string): string {
  switch (mime) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
    default:
      return "img";
  }
}

function buildFilename({
  billboardCode,
  imageId,
  uploadedAt,
  extension,
}: {
  billboardCode: string | null;
  imageId: number;
  uploadedAt: string | null;
  extension: string;
}): string {
  const safeCode = (billboardCode ?? "valla")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9_-]/g, "");
  const datePart = uploadedAt ? toYYYYMMDD(new Date(uploadedAt)) : null;
  const parts = [safeCode || "valla", datePart, String(imageId)].filter(
    Boolean,
  );
  return `${parts.join("_")}.${extension}`;
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function BillboardImagesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: COLLAPSED_COUNT }).map((_, idx) => (
        <div key={idx} className="flex flex-col gap-1.5">
          <Skeleton className="aspect-4/3 w-full rounded-md" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function BillboardImagesEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-accent/10 py-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <ImageIcon className="size-5 text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground">
        No hay imágenes registradas para esta valla.
      </p>
    </div>
  );
}
