"use client";

import { useMemo } from "react";
import NextImage from "next/image";
import { ImageOff, Layers } from "lucide-react";
import {
  S3_IMAGE_TYPE_BADGE_CLASSES,
  S3_IMAGE_TYPE_SHORT_LABELS,
  type S3Image,
  useS3Images,
} from "@/api/s3-images/s3-images.get";
import { Badge } from "@/components/primitives/ui/badge";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface RelatedImagesScrollerProps {
  staticBillboardCodeId: string;
  currentImageId: string;
  onSelectImage: (image: S3Image) => void;
}

const SKELETON_COUNT = 4;

export function RelatedImagesScroller({
  staticBillboardCodeId,
  currentImageId,
  onSelectImage,
}: RelatedImagesScrollerProps) {
  const query = useS3Images({
    staticBillboardCodeId,
    sortOrder: "desc",
    limit: 30,
  });

  const relatedImages = useMemo(() => {
    const all = query.data?.pages.flatMap((page) => page.data) ?? [];
    return all.filter((img) => img.id !== currentImageId);
  }, [query.data, currentImageId]);

  return (
    <div className="flex flex-col gap-2 md:min-h-0 md:flex-1">
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Layers className="size-3.5" aria-hidden />
          Imágenes relacionadas
        </p>
      </div>

      <div className="-mx-1 px-1 md:min-h-0 md:flex-1 md:overflow-y-auto">
        {query.isLoading ? (
          <RelatedImagesSkeleton />
        ) : relatedImages.length === 0 ? (
          <RelatedImagesEmpty />
        ) : (
          <ul className="flex flex-col gap-2 pb-1">
            {relatedImages.map((img) => (
              <RelatedImageItem
                key={img.id}
                image={img}
                onSelect={onSelectImage}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface RelatedImageItemProps {
  image: S3Image;
  onSelect: (image: S3Image) => void;
}

function RelatedImageItem({ image, onSelect }: RelatedImageItemProps) {
  const typeLabel = S3_IMAGE_TYPE_SHORT_LABELS[image.type];
  const typeBadgeClass = S3_IMAGE_TYPE_BADGE_CLASSES[image.type];
  const dateLabel = formatShortDate(new Date(image.createdAt));

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(image)}
        className={cn(
          "group/related flex w-full items-stretch gap-2.5 overflow-hidden rounded-lg border bg-card p-1.5 text-left transition-all",
          "hover:border-foreground/20 hover:shadow-md hover:ring-1 hover:ring-foreground/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 cursor-pointer",
        )}
        aria-label={`Ver imagen ${typeLabel} del ${dateLabel}`}
      >
        <div className="relative aspect-square h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
          {image.url ? (
            <NextImage
              src={image.url}
              alt={`Imagen ${typeLabel}`}
              fill
              sizes="64px"
              unoptimized
              className="object-cover transition-transform duration-300"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-4" aria-hidden />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <Badge
            className={cn(
              "w-fit border-transparent text-[10px] font-medium tracking-wide",
              typeBadgeClass,
            )}
          >
            {typeLabel}
          </Badge>
          <p className="truncate text-xs text-muted-foreground">{dateLabel}</p>
        </div>
      </button>
    </li>
  );
}

function RelatedImagesSkeleton() {
  return (
    <ul className="flex flex-col gap-2 pb-1">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <li key={i} className="flex items-stretch gap-2.5 rounded-lg p-1.5">
          <Skeleton className="size-16 shrink-0 rounded-md" />
          <div className="flex flex-1 flex-col justify-between py-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function RelatedImagesEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 p-4 text-center">
      <Layers className="size-5 text-muted-foreground" aria-hidden />
      <p className="text-xs text-muted-foreground">
        No hay otras imágenes con este código.
      </p>
    </div>
  );
}
