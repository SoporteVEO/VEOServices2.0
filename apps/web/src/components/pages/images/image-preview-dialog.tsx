"use client";

import NextImage from "next/image";
import { Calendar, Download, Tag, User } from "lucide-react";
import type { S3Image } from "@/api/s3-images/s3-images.get";
import { Badge } from "@/components/primitives/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/primitives/ui/dialog";
import { formatShortDate } from "@/lib/format";

interface ImagePreviewDialogProps {
  image: S3Image | null;
  onOpenChange: (open: boolean) => void;
}

export function ImagePreviewDialog({
  image,
  onOpenChange,
}: ImagePreviewDialogProps) {
  const open = image !== null;

  const codeLabel = image?.staticBillboardCode?.code ?? "Sin código";
  const userName = image
    ? [image.uploadedUser.firstName, image.uploadedUser.lastName]
        .filter(Boolean)
        .join(" ")
        .trim()
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[92dvh] w-full max-w-[min(96vw,1400px)] flex-col gap-0 overflow-hidden rounded-2xl bg-background p-0 sm:max-w-[min(96vw,1400px)]"
        showCloseButton
      >
        <DialogTitle className="sr-only">
          {`Vista previa de imagen ${codeLabel}`}
        </DialogTitle>

        {image ? (
          <div className="flex min-h-0 flex-1 flex-col bg-black md:flex-row">
            <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black p-2 sm:p-4">
              <div className="relative aspect-[4/3] max-h-full w-full max-w-full">
                <NextImage
                  src={image.url}
                  alt={`Imagen ${codeLabel}`}
                  fill
                  sizes="(min-width: 768px) 75vw, 100vw"
                  unoptimized
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <aside className="flex shrink-0 flex-col gap-4 border-t bg-background p-5 md:w-80 md:border-l md:border-t-0">
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Código
                </p>
                <Badge
                  variant="secondary"
                  className="h-7 px-3 font-mono text-sm"
                >
                  {codeLabel}
                </Badge>
              </div>

              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5 text-muted-foreground">
                  <Calendar className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span className="text-foreground">
                    {formatShortDate(new Date(image.createdAt))}
                  </span>
                </li>
                {userName ? (
                  <li className="flex items-start gap-2.5 text-muted-foreground">
                    <User className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span className="text-foreground">{userName}</span>
                  </li>
                ) : null}
                {image.tags.length > 0 ? (
                  <li className="flex items-start gap-2.5 text-muted-foreground">
                    <Tag className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <div className="flex flex-wrap gap-1">
                      {image.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </li>
                ) : null}
              </ul>

              <a
                href={image.url}
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                <Download className="size-4" aria-hidden />
                Abrir original
              </a>
            </aside>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
