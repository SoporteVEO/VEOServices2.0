"use client";

import { useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { S3Image } from "@/api/s3-images/s3-images.get";
import { useDeleteS3Image } from "@/api/s3-images/s3-images.post";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { ImageCard } from "./image-card";
import { ImagePreviewDialog } from "./image-preview-dialog";

interface ImagesGridProps {
  images: S3Image[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
}

const SKELETON_COUNT = 10;
const PRIORITY_COUNT = 4;
const GRID_CLASS =
  "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";

function GridSkeleton({ count = SKELETON_COUNT }: { count?: number }) {
  return (
    <div className={GRID_CLASS}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border bg-card shadow-sm"
        >
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-1.5 px-3.5 py-2.5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ImagesGrid({
  images,
  isLoading = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  onLoadMore,
  emptyMessage = "No hay imágenes que coincidan con los filtros.",
}: ImagesGridProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<S3Image | null>(null);

  const deleteMutation = useDeleteS3Image({
    onSuccess: () => {
      toast.success("Imagen eliminada.");
      setDeletingId(null);
    },
    onError: (error) => {
      toast.error(error.message || "No se pudo eliminar la imagen.");
      setDeletingId(null);
    },
  });

  function handleDelete(image: S3Image) {
    if (!confirm("¿Seguro que deseas eliminar esta imagen?")) return;
    setDeletingId(image.id);
    deleteMutation.mutate(image.id);
  }

  const sentinelRef = useIntersectionObserver<HTMLDivElement>(
    () => {
      if (hasNextPage && !isFetchingNextPage) {
        onLoadMore?.();
      }
    },
    {
      enabled: Boolean(onLoadMore) && hasNextPage && !isFetchingNextPage,
      rootMargin: "400px",
    },
  );

  if (isLoading) {
    return <GridSkeleton />;
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 py-20 text-center">
        <div className="rounded-full bg-background p-3 text-muted-foreground ring-1 ring-foreground/10">
          <ImagePlus className="size-6" aria-hidden />
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className={GRID_CLASS}>
        {images.map((image, index) => (
          <ImageCard
            key={image.id}
            image={image}
            onPreview={setPreviewImage}
            onDelete={handleDelete}
            isDeleting={deletingId === image.id}
            priority={index < PRIORITY_COUNT}
          />
        ))}
      </div>

      {hasNextPage ? (
        <div
          ref={sentinelRef}
          className="flex items-center justify-center py-6 text-sm text-muted-foreground"
        >
          {isFetchingNextPage ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Cargando más imágenes…
            </span>
          ) : (
            <span className="opacity-0">cargar más</span>
          )}
        </div>
      ) : images.length > 0 ? null : null}

      <ImagePreviewDialog
        image={previewImage}
        onOpenChange={(open) => {
          if (!open) setPreviewImage(null);
        }}
      />
    </>
  );
}
