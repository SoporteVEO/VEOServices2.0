"use client";

import { useState } from "react";
import { MapPin, Plus, Percent } from "lucide-react";
import ImageViewerMotion from "@/components/commerce-ui/image-viewer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { useCartStore } from "@/lib/cart-store";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/primitives/ui/badge";
import { getBillboardImageUrl } from "@/api/billboards/billboards.get";

interface AvailableBillboard {
  billboardId: number;
  billboardCode: string | null;
  reference: string | null;
  address: string | null;
  departmentName: string | null;
  cityName: string | null;
  price: number | null;
  imageId: number | null;
  latitude: number | null;
  longitude: number | null;
  availableDiscount: number | null;
  totalPrice: number | null;
}

export function InventoryCardStatic({
  billboard: b,
  from,
  to,
}: {
  billboard: AvailableBillboard;
  from: string;
  to: string;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const [imgLoaded, setImgLoaded] = useState(false);

  const imageUrl = getBillboardImageUrl(b.imageId);

  const isAdded = items.some(
    (i) => i.kind === "static" && i.billboardId === b.billboardId,
  );

  function handleAdd() {
    if (isAdded) return;
    addItem({
      kind: "static",
      billboardId: b.billboardId,
      billboardCode: b.billboardCode,
      reference: b.reference,
      departmentName: b.departmentName,
      cityName: b.cityName,
      address: b.address,
      price: b.price ?? 0,
      totalPrice: b.totalPrice ?? b.price ?? 0,
      imageUrl,
      from,
      to,
    });
  }

  const locationStr = [b.cityName, b.departmentName].filter(Boolean).join(", ");

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card transition-all hover:shadow-xl hover:border-border/80">
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
        <div className="absolute top-3 left-3 flex gap-2 z-20">
          <Badge className="bg-background/90 text-foreground backdrop-blur-sm hover:bg-background/90 border-transparent shadow-sm">
            {b.billboardCode ?? "Sin Código"}
          </Badge>
          <Badge
            variant="secondary"
            className="bg-blue-500/90 text-white hover:bg-blue-500/90 border-transparent backdrop-blur-sm shadow-sm"
          >
            Estática
          </Badge>
        </div>
        {b.availableDiscount != null && b.availableDiscount > 0 && (
          <div className="absolute top-2.5 right-3 z-20">
            <Badge className="bg-red-500/90 text-white hover:bg-red-500/90 border-transparent backdrop-blur-sm shadow-sm gap-1">
              <Percent className="size-3" />-{b.availableDiscount}%
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold leading-tight tracking-tight text-foreground line-clamp-2">
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

        <div className="mt-5 flex items-end justify-between border-t border-border/40 pt-4">
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
                <span className="text-sm tabular-nums line-through text-red-500">
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
            size="sm"
            onClick={handleAdd}
            disabled={isAdded}
            className={cn(
              "h-10 rounded-xl px-4 font-medium transition-all shadow-sm",
              isAdded
                ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                : "",
            )}
            variant={isAdded ? "secondary" : "default"}
          >
            {isAdded ? (
              "Agregado"
            ) : (
              <>
                <Plus className="mr-1.5 size-4" />
                Agregar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
