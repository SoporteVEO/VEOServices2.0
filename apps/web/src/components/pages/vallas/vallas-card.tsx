"use client";

import { useState } from "react";
import { MapPin, Percent } from "lucide-react";
import ImageViewerMotion from "@/components/commerce-ui/image-viewer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Badge } from "@/components/primitives/ui/badge";
import { formatMoney } from "@/lib/format";
import { getBillboardImageUrl } from "@/api/billboards/billboards.get";
import type { AvailableBillboard } from "@/api/billboards/billboards.types";

const WHATSAPP_NUMBER = "50378099688";

function buildWhatsAppUrl(code: string) {
  const message = `Hola, me gustaria obtener mas informacion acerca de la valla ${code}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function VallasCard({ billboard: b }: { billboard: AvailableBillboard }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  const imageUrl = b.s3ImageUrl ?? getBillboardImageUrl(b.imageId);
  const code = b.billboardCode ?? "";
  const whatsappUrl = buildWhatsAppUrl(code);

  const locationStr = [b.cityName, b.departmentName].filter(Boolean).join(", ");

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card transition-all hover:border-border/80 hover:shadow-xl">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {imageUrl ? (
          <>
            {!imgLoaded && (
              <Skeleton className="absolute inset-0 z-10 rounded-none" />
            )}
            <ImageViewerMotion
              imageUrl={imageUrl}
              imageTitle={b.billboardCode ?? b.reference ?? "Valla"}
              className="block size-full min-h-0"
              classNameThumbnailViewer="size-full object-cover transition-transform duration-500 group-hover:scale-105 rounded-none"
              onThumbnailLoad={() => setImgLoaded(true)}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-900">
            <MapPin className="size-10 text-zinc-300 dark:text-zinc-700" />
          </div>
        )}
        <div className="absolute left-3 top-3 z-20 flex gap-2">
          <Badge className="border-transparent bg-background/90 text-foreground shadow-sm backdrop-blur-sm hover:bg-background/90">
            {b.billboardCode ?? "Sin Código"}
          </Badge>
          <Badge
            variant="secondary"
            className="border-transparent bg-blue-500/90 text-white shadow-sm backdrop-blur-sm hover:bg-blue-500/90"
          >
            Estática
          </Badge>
        </div>
        {b.availableDiscount != null && b.availableDiscount > 0 && (
          <div className="absolute right-3 top-2.5 z-20">
            <Badge className="gap-1 border-transparent bg-red-500/90 text-white shadow-sm backdrop-blur-sm hover:bg-red-500/90">
              <Percent className="size-3" />-{b.availableDiscount}%
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h3 className="line-clamp-2 text-lg font-semibold leading-tight tracking-tight text-foreground">
              {b.reference ?? b.address ?? "Sin referencia"}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">
              {locationStr || "Ubicación no especificada"}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 border-t border-border/40 pt-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Inversión
            </span>
            {b.availableDiscount != null &&
            b.availableDiscount > 0 &&
            b.price != null ? (
              <div className="flex items-baseline gap-2 pr-1">
                <span className="text-xl font-bold tabular-nums text-foreground">
                  {formatMoney(b.totalPrice)}
                </span>
                <span className="text-sm tabular-nums text-red-500 line-through">
                  {formatMoney(b.price)}
                </span>
              </div>
            ) : (
              <span className="text-xl font-bold tabular-nums text-foreground">
                {formatMoney(b.totalPrice ?? b.price)}
              </span>
            )}
          </div>

          <Button
            asChild
            size="lg"
            className="w-full rounded-xl bg-[#25D366] font-medium text-white shadow-sm hover:bg-[#1ebe57]"
          >
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Contactar por WhatsApp por la valla ${code}`}
            >
              <WhatsAppIcon className="mr-2 size-5" />
              Contactar por WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
