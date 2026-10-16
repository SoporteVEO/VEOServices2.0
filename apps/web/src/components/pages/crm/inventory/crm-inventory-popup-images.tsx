"use client";

import { useState } from "react";
import { S3_IMAGE_TYPE_SHORT_LABELS, useBillboardS3Images } from "@/api/s3-images/s3-images.get";
import ImageViewerMotion from "@/components/commerce-ui/image-viewer-motion";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { formatHumanDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  code: string;
}

export function CrmInventoryPopupImages({ code }: Props) {
  const { data: images = [], isLoading } = useBillboardS3Images(code);
  const [activeIndex, setActiveIndex] = useState(0);

  if (isLoading) return <Skeleton className="aspect-video w-full rounded-md" />;
  if (images.length === 0) return null;

  const active = images[Math.min(activeIndex, images.length - 1)];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
        <ImageViewerMotion
          key={active.id}
          imageUrl={active.url}
          imageTitle={`Valla ${code}`}
          className="block size-full"
          classNameThumbnailViewer="size-full rounded-none object-cover"
        />
        <span className="pointer-events-none absolute bottom-1 left-1 rounded-sm bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
          {S3_IMAGE_TYPE_SHORT_LABELS[active.type]} · {formatHumanDate(active.createdAt)}
        </span>
      </div>
      {images.length > 1 ? (
        <div className="flex gap-1 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver imagen ${index + 1}`}
              className={cn(
                "size-10 shrink-0 cursor-pointer overflow-hidden rounded-sm border opacity-70 transition-opacity hover:opacity-100",
                image.id === active.id && "border-primary opacity-100 ring-1 ring-primary",
              )}
            >
              <img src={image.url} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
