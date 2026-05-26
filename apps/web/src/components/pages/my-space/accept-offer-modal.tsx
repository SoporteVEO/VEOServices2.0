"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAcceptOffer } from "@/api/offers/offers.patch";
import type {
  BriloContractOption,
  OfferListItem,
} from "@/api/offers/offers.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BriloContractCombobox } from "./brilo-contract-combobox";

type AcceptOfferModalProps = {
  offer: OfferListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AcceptOfferModal({
  offer,
  open,
  onOpenChange,
}: AcceptOfferModalProps) {
  const [selectedContract, setSelectedContract] =
    useState<BriloContractOption | null>(null);
  const acceptMutation = useAcceptOffer();

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSelectedContract(null);
    }
    onOpenChange(next);
  }

  function handleSubmit() {
    if (!offer) return;
    if (!selectedContract) {
      toast.error(
        "Selecciona el contrato de Brilo que corresponde a esta cotización.",
      );
      return;
    }

    acceptMutation.mutate(
      { id: offer.id, briloMconId: selectedContract.mconId },
      {
        onSuccess: () => {
          toast.success("Cotización marcada como aceptada.");
          handleOpenChange(false);
        },
        onError: (err) =>
          toast.error(err.message || "No se pudo aceptar la cotización."),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        size="md"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Aceptar cotización</DialogTitle>
          <DialogDescription>
            {offer
              ? `Vincula ${offer.offerNumber} con el contrato creado en Brilo. Este paso es obligatorio para registrar la aceptación del cliente.`
              : null}
          </DialogDescription>
        </DialogHeader>
        <div className="mb-4 px-8">
          <BriloContractCombobox
            value={selectedContract?.mconId ?? null}
            onChange={setSelectedContract}
            defaultSelectedContract={selectedContract}
            required
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={acceptMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={acceptMutation.isPending || !selectedContract}
          >
            {acceptMutation.isPending ? "Guardando…" : "Confirmar aceptación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
