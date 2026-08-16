"use client";

import { toast } from "sonner";
import { useUpdateProductionOrderItemStatus } from "@/api/production-orders/production-orders.patch";
import type { ProductionOrderStatus } from "@/api/production-orders/production-orders.types";
import {
  PRODUCTION_STATUS_LABELS,
  PRODUCTION_STATUS_STYLES,
} from "@/components/pages/production-orders-shared/production-order-status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: ProductionOrderStatus[] = [
  "RECEIVED",
  "IN_PRODUCTION",
  "COMPLETED",
  "CANCELLED",
];

type Props = {
  itemId: string;
  status: ProductionOrderStatus;
  disabled?: boolean;
};

function StatusDot({ status }: { status: ProductionOrderStatus }) {
  return (
    <span
      className={cn(
        "size-2 shrink-0 rounded-full border",
        PRODUCTION_STATUS_STYLES[status],
      )}
      aria-hidden
    />
  );
}

export function ProductionOrderItemStatusSelect({
  itemId,
  status,
  disabled,
}: Props) {
  const mutation = useUpdateProductionOrderItemStatus();

  function handleChange(next: string) {
    if (next === status) return;
    mutation.mutate(
      { itemId, status: next as ProductionOrderStatus },
      {
        onSuccess: () => toast.success("Estado actualizado."),
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "No se pudo actualizar el estado.",
          ),
      },
    );
  }

  return (
    <Select
      value={status}
      onValueChange={handleChange}
      disabled={disabled || mutation.isPending}
    >
      <SelectTrigger
        className={cn(
            "w-full min-w-45 border font-medium",
          PRODUCTION_STATUS_STYLES[status],
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <StatusDot status={status} />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((value) => (
          <SelectItem key={value} value={value}>
            <span className="flex items-center gap-2">
              <StatusDot status={value} />
              {PRODUCTION_STATUS_LABELS[value]}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
