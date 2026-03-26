import type { PurchaseRow } from "@/api/purchases/purchases.types";

export const statusBadge: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  COMPLETED: { label: "Completada", variant: "default" },
  PENDING: { label: "Pendiente", variant: "secondary" },
  FAILED: { label: "Fallida", variant: "destructive" },
};

export function purchaseTotal(purchase: PurchaseRow) {
  return purchase.items.reduce((sum, i) => sum + (i.price ?? 0), 0);
}