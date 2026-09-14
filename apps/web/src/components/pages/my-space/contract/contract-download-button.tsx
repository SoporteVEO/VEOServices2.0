"use client";

import { useState } from "react";
import { FileSignature, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMySpaceViewAs } from "../my-space-view-as-context";
import { downloadOfferContract } from "./download-offer-contract";

type ContractDownloadButtonProps = {
  offerId: string;
};

/**
 * Re-downloads the contract of an accepted offer. Renders it fresh rather than
 * serving the archived copy, matching how quotations are downloaded.
 */
export function ContractDownloadButton({
  offerId,
}: ContractDownloadButtonProps) {
  const { viewAsUserId } = useMySpaceViewAs();
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadOfferContract(offerId, { viewAsUserId });
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "No se pudo descargar el contrato.",
      );
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
        <FileSignature className="size-3.5" aria-hidden />
      )}
      Contrato
    </Button>
  );
}
