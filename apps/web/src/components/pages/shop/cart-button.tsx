"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  ArrowRight,
  ImageIcon,
  MonitorPlay,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/primitives/ui/badge";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { Separator } from "@/components/primitives/ui/separator";
import { useCartStore } from "@/lib/cart-store";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CartButton() {
  const [open, setOpen] = useState(false);
  const items = useCartStore((s) => s.items);
  const removeLine = useCartStore((s) => s.removeLine);
  const count = items.length;
  const total = items.reduce((sum, item) => sum + (item.price ?? 0), 0);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Button
        variant="outline"
        asChild
        className="relative h-10 rounded-full border-border/40 bg-background/50 px-4 shadow-sm backdrop-blur-sm transition-all hover:bg-accent/50"
      >
        <Link href="/shop/cart">
          <ShoppingBag className="mr-2 size-4" />
          <span className="font-medium">Carrito</span>
          {count > 0 && (
            <Badge className="absolute -right-1.5 -top-1.5 flex size-5.5 items-center justify-center rounded-full border-2 border-background p-0 text-[10px] font-bold shadow-sm">
              {count}
            </Badge>
          )}
        </Link>
      </Button>

      {open && count > 0 && (
        <div
          className="absolute right-0 top-full z-50 pt-1.5"
          role="region"
          aria-label="Vista previa del carrito"
        >
          <div
            className={cn(
              "w-[min(100vw-2rem,20rem)] overflow-hidden rounded-xl border border-border/50 bg-popover/95 text-popover-foreground shadow-xl ring-1 ring-foreground/10 backdrop-blur-md",
              "animate-in fade-in-0 zoom-in-95 duration-150",
            )}
          >
            <div className="border-b border-border/40 px-3 py-2.5 gap-1 flex flex-row items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider">
                En tu carrito
              </p>
              <Badge
                variant="outline"
                className="text-[11px] font-semibold uppercase tracking-wider border-border/40 bg-muted p-2 rounded-lg"
              >
                {count} {count === 1 ? "ubicación" : "ubicaciones"}
              </Badge>
            </div>

            <ScrollArea className="max-h-[min(50vh,280px)]">
              <ul className="space-y-2 p-2">
                {items.map((item) => {
                  const isDigital = item.kind === "digital";
                  return (
                    <li
                      key={item.lineId}
                      className="flex gap-3 rounded-lg border border-border/40 bg-card/50 p-2"
                    >
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={
                              item.reference ??
                              item.billboardCode ??
                              "Valla publicitaria"
                            }
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-muted">
                            {isDigital ? (
                              <MonitorPlay className="size-5 text-muted-foreground" />
                            ) : (
                              <ImageIcon className="size-5 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {item.billboardCode ?? item.reference ?? "—"}
                        </p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {item.reference ?? item.address ?? "—"}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                          {formatMoney(item.price)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeLine(item.lineId);
                        }}
                        aria-label="Eliminar"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>

            <Separator className="bg-border/50" />

            <div className="bg-card/30 p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total estimado</span>
              <span className="text-base font-bold tabular-nums text-foreground tracking-tight">
                {formatMoney(total)}
              </span>
            </div>

            <Separator className="bg-border/50" />

            <div className="p-2">
              <Button
                asChild
                variant="default"
                size="sm"
                className="h-9 w-full rounded-lg font-medium"
              >
                <Link href="/shop/cart">
                  Ir al carrito
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
