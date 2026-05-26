"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useDeclineOffer } from "@/api/offers/offers.patch";
import type { OfferListItem } from "@/api/offers/offers.types";
import { Button } from "@/components/ui/button";
import { AcceptOfferModal } from "./accept-offer-modal";
import { MyOfferDownloadButton } from "./my-offer-download-button";

type MyOfferActionsProps = {
  offer: OfferListItem;
};

export function MyOfferActions({ offer }: MyOfferActionsProps) {
  const [acceptOpen, setAcceptOpen] = useState(false);
  const declineMutation = useDeclineOffer();
  const isPending = offer.status === "PENDING";

  function handleDecline() {
    declineMutation.mutate(offer.id, {
      onSuccess: () => toast.success("Cotización marcada como rechazada."),
      onError: (err) =>
        toast.error(err.message || "No se pudo rechazar la cotización."),
    });
  }

  return (
    <>
      <div
        className="flex flex-wrap items-center justify-end gap-1.5"
        onClick={(event) => event.stopPropagation()}
      >
        {isPending ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={declineMutation.isPending}
              onClick={handleDecline}
            >
              <X className="size-3.5" aria-hidden />
              Rechazada
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => setAcceptOpen(true)}
            >
              <Check className="size-3.5" aria-hidden />
              Aceptada
            </Button>
          </>
        ) : null}
        <MyOfferDownloadButton offer={offer} />
      </div>

      <AcceptOfferModal
        offer={offer}
        open={acceptOpen}
        onOpenChange={setAcceptOpen}
      />
    </>
  );
}
