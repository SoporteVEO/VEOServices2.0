"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";
import { getOffer } from "@/api/offers/offers.get";
import type { OfferListItem } from "@/api/offers/offers.types";
import { Button } from "@/components/ui/button";
import { offerDetailToPdfData } from "./quotation/offer-detail-to-pdf-data";
import { OfferPdfDocument } from "./quotation/offer-pdf-document";
import { useMySpaceViewAs } from "./my-space-view-as-context";

const VEO_LOGO_SRC = "/VEO_LOGO_COT.png";

type MyOfferDownloadButtonProps = {
  offer: OfferListItem;
};

/**
 * Renders the PDF on demand from the stored offer rather than serving the copy
 * archived in S3, so older quotations download with the current design.
 */
export function MyOfferDownloadButton({ offer }: MyOfferDownloadButtonProps) {
  const { viewAsUserId } = useMySpaceViewAs();
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      const detail = await getOffer(offer.id, { viewAsUserId });
      const blob = await pdf(
        <OfferPdfDocument
          data={offerDetailToPdfData(detail)}
          logoSrc={VEO_LOGO_SRC}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${offer.offerNumber.replace(/[\\/:*?"<>|]/g, "-")}.pdf`;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
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
      disabled={isDownloading}
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
