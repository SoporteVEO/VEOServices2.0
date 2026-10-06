"use client";

import { MonitorPlay, Plus } from "lucide-react";
import ImageViewerMotion from "@/components/commerce-ui/image-viewer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/primitives/ui/badge";
import { useCartStore } from "@/lib/cart-store";
import { formatMoney } from "@/lib/format";
import { computeDigitalLinePrice } from "@/lib/digital-spots";
import { cn } from "@/lib/utils";

interface AvailableDigitalBillboard {
  id: string;
  code: string;
  name: string;
  address: string;
  price: number;
  maxSpots: number;
  spotsRemaining: number;
  imageUrl: string | null;
  departmentName: string | null;
}

export function InventoryCardDigital({
  billboard: b,
  from,
  to,
  spotCount,
}: {
  billboard: AvailableDigitalBillboard;
  from: string;
  to: string;
  spotCount: number;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);

  const linePrice = computeDigitalLinePrice(b.price, b.maxSpots, spotCount);
  const isAdded = items.some(
    (i) => i.kind === "digital" && i.digitalBillboardId === b.id,
  );

  function handleAdd() {
    if (isAdded) return;
    addItem({
      kind: "digital",
      digitalBillboardId: b.id,
      spotCount,
      billboardCode: b.code,
      reference: b.name,
      departmentName: b.departmentName,
      cityName: null,
      address: b.address,
      price: linePrice,
      imageUrl: b.imageUrl,
      from,
      to,
    });
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card transition-all hover:shadow-xl hover:border-border/80">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {b.imageUrl ? (
          <ImageViewerMotion
            imageUrl={b.imageUrl}
            imageTitle={b.name}
            className="block size-full min-h-0"
            classNameThumbnailViewer="size-full object-cover transition-transform duration-500 group-hover:scale-105 rounded-none"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-900">
            <MonitorPlay className="size-10 text-zinc-300 dark:text-zinc-700" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-background/90 text-foreground backdrop-blur-sm hover:bg-background/90 border-transparent shadow-sm">
            {b.code}
          </Badge>
          <Badge
            variant="secondary"
            className="bg-purple-500/90 text-white hover:bg-purple-500/90 border-transparent backdrop-blur-sm shadow-sm"
          >
            Digital
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-semibold leading-tight tracking-tight text-foreground line-clamp-2">
            {b.name}
          </h3>

          <div className="flex flex-col gap-1.5 mt-2">
            <p className="text-sm text-muted-foreground line-clamp-1">
              {b.address}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className="text-[10px] font-medium text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/30"
              >
                {b.spotsRemaining} spots libres
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">
                Paquete: {spotCount}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between border-t border-border/40 pt-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Inversión
            </span>
            <span className="text-xl font-bold tabular-nums text-foreground">
              {formatMoney(linePrice)}
            </span>
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
