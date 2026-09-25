"use client";

import { Trash2 } from "lucide-react";
import type { ProductionDocumentKind } from "@/api/production-orders/production-orders.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDimensions } from "@/lib/format";
import { PendingDocumentInput } from "./pending-document-input";
import type { PendingBillboard } from "./pending-billboard";

type Props = {
  entry: PendingBillboard;
  disabled?: boolean;
  onRemove: () => void;
  onDocumentChange: (kind: ProductionDocumentKind, file: File | null) => void;
};

export function PendingBillboardCard({
  entry,
  disabled,
  onRemove,
  onDocumentChange,
}: Props) {
  const { billboard } = entry;
  const location =
    [billboard.address, billboard.cityName, billboard.departmentName]
      .filter(Boolean)
      .join(", ") || "Sin dirección";

  return (
    <div className="flex flex-col gap-3 rounded-md border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {billboard.billboardCode ?? `#${billboard.billboardId}`}
            </Badge>
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatDimensions(billboard.width, billboard.height)}
            </span>
          </div>
          <p className="line-clamp-2 text-xs text-foreground/90">{location}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-destructive hover:text-destructive"
          disabled={disabled}
          onClick={onRemove}
          aria-label="Quitar valla"
        >
          <Trash2 className="size-3.5" aria-hidden />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <PendingDocumentInput
          title="Orden de producción"
          file={entry.productionDocument}
          disabled={disabled}
          onChange={(file) => onDocumentChange("PRODUCTION", file)}
        />
        <PendingDocumentInput
          title="Orden de diseño"
          file={entry.designDocument}
          disabled={disabled}
          onChange={(file) => onDocumentChange("DESIGN", file)}
        />
      </div>
    </div>
  );
}
