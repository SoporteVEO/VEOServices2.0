"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getProductionOrderDocumentUrl } from "@/api/production-orders/production-orders.get";
import type { ProductionDocumentKind } from "@/api/production-orders/production-orders.types";
import { Button } from "@/components/ui/button";

type Props = {
  itemId: string;
  kind: ProductionDocumentKind;
  disabled?: boolean;
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "md";
  label?: string;
};

export function ProductionOrderDocumentPreviewButton({
  itemId,
  kind,
  disabled,
  variant = "outline",
  size = "sm",
  label = "Ver",
}: Props) {
  const [isLoading, setLoading] = useState(false);

  async function handlePreview() {
    if (disabled) return;
    setLoading(true);
    try {
      const url = await getProductionOrderDocumentUrl(itemId, kind);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo abrir el documento.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size === "sm" ? "sm" : undefined}
      className="gap-1.5"
      disabled={disabled || isLoading}
      onClick={(event) => {
        event.stopPropagation();
        void handlePreview();
      }}
    >
      {isLoading ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <ExternalLink className="size-3.5" aria-hidden />
      )}
      {label}
    </Button>
  );
}
