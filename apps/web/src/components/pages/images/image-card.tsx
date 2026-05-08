"use client";

import NextImage from "next/image";
import { Eye, ImageOff, MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  S3_IMAGE_TYPE_BADGE_CLASSES,
  S3_IMAGE_TYPE_SHORT_LABELS,
  type S3Image,
} from "@/api/s3-images/s3-images.get";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ImageCardProps {
  image: S3Image;
  onPreview?: (image: S3Image) => void;
  onEdit?: (image: S3Image) => void;
  onDelete?: (image: S3Image) => void;
  isDeleting?: boolean;
  priority?: boolean;
}

export function ImageCard({
  image,
  onPreview,
  onEdit,
  onDelete,
  isDeleting = false,
  priority = false,
}: ImageCardProps) {
  const codeLabel = image.staticBillboardCode?.code ?? "Sin código";
  const typeLabel = S3_IMAGE_TYPE_SHORT_LABELS[image.type];
  const typeBadgeClass = S3_IMAGE_TYPE_BADGE_CLASSES[image.type];
  const dateLabel = formatShortDate(new Date(image.createdAt));
  const userName = [image.uploadedUser.firstName, image.uploadedUser.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const hasMenu = Boolean(onEdit || onDelete);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300",
        " hover:shadow-lg hover:ring-1 hover:ring-foreground/15",
        isDeleting && "pointer-events-none opacity-50",
      )}
    >
      <button
        type="button"
        onClick={() => onPreview?.(image)}
        aria-label={`Ver imagen ${codeLabel}`}
        className="relative block aspect-4/3 w-full overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        {image.url ? (
          <NextImage
            src={image.url}
            alt={`Imagen ${codeLabel}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, (max-width: 1536px) 25vw, 20vw"
            unoptimized
            priority={priority}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" aria-hidden />
          </div>
        )}

        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-row items-start gap-1.5">
          <Badge className="border-transparent bg-black/65 font-mono text-[11px] tracking-wide text-white shadow-md backdrop-blur-sm">
            {codeLabel}
          </Badge>
          <Badge
            className={cn(
              "border-transparent text-[11px] font-medium tracking-wide shadow-md backdrop-blur-sm",
              typeBadgeClass,
            )}
          >
            {typeLabel}
          </Badge>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-end bg-gradient-to-t from-black/75 via-black/25 to-transparent p-3 pt-10 opacity-0 duration-initial group-hover:opacity-100 cursor-pointer">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm backdrop-blur-sm ring-1 ring-white/20 cursor-pointer">
            <Eye className="size-3.5" aria-hidden />
            Ver imagen
          </span>
        </div>
      </button>

      {hasMenu ? (
        <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                sizeVariant="sm"
                className="size-8 rounded-full p-0 shadow-md"
                disabled={isDeleting}
                aria-label="Acciones de la imagen"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit ? (
                <DropdownMenuItem onSelect={() => onEdit(image)}>
                  <Pencil className="mr-2 size-3.5" />
                  Editar
                </DropdownMenuItem>
              ) : null}
              {onDelete ? (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onDelete(image)}
                >
                  <Trash2 className="mr-2 size-3.5" />
                  Eliminar
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-tight">
            {userName || "Sistema"}
          </p>
          <p className="truncate text-xs text-muted-foreground">{dateLabel}</p>
        </div>
      </div>
    </div>
  );
}
