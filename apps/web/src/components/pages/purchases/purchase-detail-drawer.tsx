"use client";

import type { PurchaseRow } from "@/api/purchases/purchases.types";
import { Badge } from "@/components/primitives/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatDate, formatDateRange, formatMoney } from "@/lib/format";
import { purchaseTotal } from "./const";

export function PurchaseDetailDrawer({
  purchase,
  onOpenChange,
}: {
  purchase: PurchaseRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Drawer open={!!purchase} onOpenChange={onOpenChange}>
      <DrawerContent size="lg" className="flex max-h-[90vh] flex-col">
        <DrawerHeader>
          <DrawerTitle>Detalle de compra</DrawerTitle>
          {purchase ? (
            <DrawerDescription>
              {purchase.customerEmail} · {formatDate(purchase.createdAt)}
            </DrawerDescription>
          ) : null}
        </DrawerHeader>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-6">
          {purchase?.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="font-medium">
                  {item.digitalBillboardId
                    ? (item.billboardCode ?? "Valla digital")
                    : (item.billboardCode ?? `Valla ${item.billboardId}`)}
                </p>
                {item.digitalBillboardId && item.spotCount != null && (
                  <Badge variant="secondary">{item.spotCount} spots</Badge>
                )}
                <p className="truncate text-sm text-muted-foreground">
                  {item.reference ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[item.cityName, item.departmentName]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateRange(item.from, item.to)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums">
                {formatMoney(item.price)}
              </p>
            </div>
          ))}
          {purchase && (
            <div className="flex items-center justify-between border-t pt-3 text-sm">
              <span className="font-medium">Total</span>
              <span className="font-semibold tabular-nums">
                {formatMoney(purchaseTotal(purchase))}
              </span>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
