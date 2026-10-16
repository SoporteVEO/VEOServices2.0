"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";

interface Props {
  count: number;
  total: number;
  onSubmit: () => void;
  pending: boolean;
  disabled?: boolean;
  onClear: () => void;
}

export function CrmInventorySelectionBar({
  count,
  total,
  onSubmit,
  pending,
  disabled = false,
  onClear,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 text-sm">
        <span>
          <span className="font-semibold tabular-nums">{count}</span> seleccionados
        </span>
        <span className="text-muted-foreground">
          ≈ <span className="font-semibold text-foreground tabular-nums">{formatMoney(total)}</span>{" "}
          en el periodo
        </span>
        {count > 0 ? (
          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            onClick={onClear}
          >
            Limpiar
          </button>
        ) : null}
      </div>
      <Button
        icon={Plus}
        disabled={disabled || count === 0}
        loading={pending}
        onClick={onSubmit}
      >
        Agregar a propuesta
      </Button>
    </div>
  );
}
