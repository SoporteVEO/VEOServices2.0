"use client";

import type { ProductionOrderItem } from "@/api/production-orders/production-orders.types";
import { ProductionOrderDocumentPreviewButton } from "./production-order-document-preview";

/** Older orders may still carry the deprecated production/design PDFs. */
export function ProductionOrderLegacyDocuments({
  item,
}: {
  item: ProductionOrderItem;
}) {
  if (!item.hasProductionDocument && !item.hasDesignDocument) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
      <span>Documentos anteriores:</span>
      {item.hasProductionDocument ? (
        <ProductionOrderDocumentPreviewButton
          itemId={item.id}
          kind="PRODUCTION"
          variant="ghost"
          label="Orden de producción"
        />
      ) : null}
      {item.hasDesignDocument ? (
        <ProductionOrderDocumentPreviewButton
          itemId={item.id}
          kind="DESIGN"
          variant="ghost"
          label="Orden de diseño"
        />
      ) : null}
    </div>
  );
}
