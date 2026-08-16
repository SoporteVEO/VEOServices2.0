"use client";

import { Loader2, QrCode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ProductionOrderItem } from "@/api/production-orders/production-orders.types";
import { Button } from "@/components/ui/button";
import { installerPortalUrl } from "@/lib/installer-portal";
import { downloadQrCard } from "@/lib/qr-card";

type Props = {
  item: ProductionOrderItem;
  campaignLabel: string;
};

/**
 * Produces one QR per static billboard. Scanning it opens the installer
 * portal for that exact billboard, so a four-billboard order yields four
 * distinct codes.
 */
export function ProductionOrderQrButton({ item, campaignLabel }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const code = item.billboardCode ?? "Sin código";

  async function handleDownload() {
    setIsGenerating(true);
    try {
      await downloadQrCard({
        url: installerPortalUrl(item.id),
        title: code,
        subtitle: campaignLabel,
        footer: [item.address, item.cityName, item.departmentName]
          .filter(Boolean)
          .join(", "),
        fileName: `QR-${code.replace(/\s+/g, "-")}`,
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo generar el código QR.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5"
      disabled={isGenerating}
      onClick={() => void handleDownload()}
    >
      {isGenerating ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <QrCode className="size-3.5" aria-hidden />
      )}
      Descargar QR
    </Button>
  );
}
