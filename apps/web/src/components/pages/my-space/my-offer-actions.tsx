"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useDeclineOffer } from "@/api/offers/offers.patch";
import type { OfferListItem } from "@/api/offers/offers.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AcceptOfferModal } from "./accept-offer-modal";
import { MyOfferDownloadButton } from "./my-offer-download-button";
import { useMySpaceViewAs } from "./my-space-view-as-context";

type MyOfferActionsProps = {
  offer: OfferListItem;
};

export function MyOfferActions({ offer }: MyOfferActionsProps) {
  const { viewAsUserId } = useMySpaceViewAs();
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [confirmDeclineOpen, setConfirmDeclineOpen] = useState(false);
  const declineMutation = useDeclineOffer();
  const readOnly = Boolean(viewAsUserId);
  const isPending = offer.status === "PENDING";
  const isAccepted = offer.status === "ACCEPTED";

  function performDecline() {
    declineMutation.mutate(offer.id, {
      onSuccess: () => {
        toast.success("Cotización marcada como rechazada.");
        setConfirmDeclineOpen(false);
      },
      onError: (err) =>
        toast.error(err.message || "No se pudo rechazar la cotización."),
    });
  }

  function handleDeclineClick() {
    if (isAccepted) {
      setConfirmDeclineOpen(true);
      return;
    }
    performDecline();
  }

  return (
    <>
      <div
        className="flex flex-wrap items-center justify-end gap-1.5"
        onClick={(event) => event.stopPropagation()}
      >
        {!readOnly && (isPending || isAccepted) ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={declineMutation.isPending}
            onClick={handleDeclineClick}
          >
            <X className="size-3.5" aria-hidden />
            Rechazada
          </Button>
        ) : null}
        {isPending && !readOnly ? (
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => setAcceptOpen(true)}
          >
            <Check className="size-3.5" aria-hidden />
            Aceptada
          </Button>
        ) : null}
        <MyOfferDownloadButton offer={offer} />
      </div>

      <AcceptOfferModal
        offer={offer}
        open={acceptOpen}
        onOpenChange={setAcceptOpen}
      />

      <Dialog
        open={confirmDeclineOpen}
        onOpenChange={(open) => {
          if (!declineMutation.isPending) setConfirmDeclineOpen(open);
        }}
      >
        <DialogContent
          size="sm"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Rechazar cotización aceptada</DialogTitle>
            <DialogDescription>
              Esta cotización ya fue aceptada y vinculada a un contrato de
              Brilo. Si la rechazas se desvinculará el contrato y se eliminarán
              los registros de uso de vallas digitales asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeclineOpen(false)}
              disabled={declineMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={performDecline}
              disabled={declineMutation.isPending}
            >
              {declineMutation.isPending ? "Procesando…" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
