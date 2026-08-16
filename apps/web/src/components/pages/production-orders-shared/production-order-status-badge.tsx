"use client";

import { Badge } from "@/components/primitives/ui/badge";
import type { ProductionOrderStatus } from "@/api/production-orders/production-orders.types";
import { cn } from "@/lib/utils";

export const PRODUCTION_STATUS_LABELS: Record<ProductionOrderStatus, string> = {
  RECEIVED: "Recibida",
  IN_PRODUCTION: "En producción",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export const PRODUCTION_STATUS_STYLES: Record<ProductionOrderStatus, string> = {
  RECEIVED:
    "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  IN_PRODUCTION:
    "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  COMPLETED:
    "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CANCELLED:
    "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
};

type Props = {
  status: ProductionOrderStatus;
  className?: string;
};

export function ProductionOrderStatusBadge({ status, className }: Props) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap font-medium",
        PRODUCTION_STATUS_STYLES[status],
        className,
      )}
    >
      {PRODUCTION_STATUS_LABELS[status]}
    </Badge>
  );
}
