"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getOfferDownloadUrl } from "@/api/offers/offers.get";
import type { OfferListItem } from "@/api/offers/offers.types";
import { Button } from "@/components/ui/button";

type MyOfferDownloadButtonProps = {
  offer: OfferListItem;
};

export function MyOfferDownloadButton({ offer }: MyOfferDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    if (!offer.hasPdf) {
      toast.error("Esta cotización no tiene PDF disponible.");
      return;
    }

    setIsDownloading(true);
    try {
      const url = await getOfferDownloadUrl(offer.id);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.download = `${offer.offerNumber}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      toast.error("No se pudo descargar la cotización.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5"
      disabled={!offer.hasPdf || isDownloading}
      onClick={(event) => {
        event.stopPropagation();
        void handleDownload();
      }}
    >
      {isDownloading ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <Download className="size-3.5" aria-hidden />
      )}
      Descargar
    </Button>
  );
}
