"use client";

import { toast } from "sonner";
import { useUpdateProductionOrderItemStatus } from "@/api/production-orders/production-orders.patch";
import type { ProductionOrderStatus } from "@/api/production-orders/production-orders.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRODUCTION_STATUS_LABELS } from "@/components/pages/production-orders-shared/production-order-status-badge";

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
      <SelectTrigger className="w-full min-w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((value) => (
          <SelectItem key={value} value={value}>
            {PRODUCTION_STATUS_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
