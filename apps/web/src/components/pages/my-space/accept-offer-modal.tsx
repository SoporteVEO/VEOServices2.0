"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useBriloAcceptContext } from "@/api/offers/offers.get";
import { useAcceptOffer } from "@/api/offers/offers.patch";
import type {
  AcceptOfferInput,
  BriloClientOption,
  BriloContractOption,
  OfferListItem,
} from "@/api/offers/offers.types";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AcceptOfferBriloSection } from "./accept-offer-brilo-section";
import { BriloContractCombobox } from "./brilo-contract-combobox";
import { downloadOfferContract } from "./contract/download-offer-contract";

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
  const contextQuery = useBriloAcceptContext(offer?.id ?? null, open);
  const context = contextQuery.data;
  const [selectedContract, setSelectedContract] =
    useState<BriloContractOption | null>(null);
  const [clientOverride, setClientOverride] =
    useState<BriloClientOption | null>(null);
  const [executiveOverride, setExecutiveOverride] = useState<number | null>(
    null,
  );
  const acceptMutation = useAcceptOffer();

  const requiresBrilo = context?.requiresBriloDocuments ?? false;
  const suggestedClient =
    context?.clientMatches.length === 1 ? context.clientMatches[0] : null;
  const suggestedExecutiveId =
    context?.executiveMatchIds.length === 1
      ? context.executiveMatchIds[0]
      : null;
  const client = clientOverride ?? suggestedClient;
  const executiveId = executiveOverride ?? suggestedExecutiveId;

  const canSubmit = requiresBrilo
    ? Boolean(client && executiveId)
    : Boolean(selectedContract);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSelectedContract(null);
      setClientOverride(null);
      setExecutiveOverride(null);
    }
    onOpenChange(next);
  }

  function buildInput(): AcceptOfferInput | null {
    if (requiresBrilo) {
      if (!client || !executiveId) return null;
      return { briloCliId: client.cliId, briloEjecId: executiveId };
    }
    if (!selectedContract) return null;
    return { briloMconId: selectedContract.mconId };
  }

  function handleAccepted(updated: OfferListItem) {
    handleOpenChange(false);
    if (requiresBrilo && !updated.briloMconId) {
      toast.error(
        `La cotización se aceptó, pero no se pudo crear el contrato en Brilo${
          updated.briloSyncError ? `: ${updated.briloSyncError}` : "."
        } Usa «Reintentar Brilo».`,
      );
      return;
    }
    toast.success(
      requiresBrilo
        ? "Cotización aceptada. Se crearon la cotización y el contrato en Brilo."
        : "Cotización marcada como aceptada.",
    );
    // The acceptance is already committed, so a contract that fails to
    // render is reported on its own and stays available from the
    // "Contrato" button rather than reversing the acceptance.
    void downloadOfferContract(updated.id).catch((err: unknown) =>
      toast.error(
        `La cotización se aceptó, pero no se pudo generar el PDF del contrato${
          err instanceof Error && err.message ? `: ${err.message}` : "."
        } Descárgalo desde el botón «Contrato».`,
      ),
    );
  }

  function handleSubmit() {
    if (!offer) return;
    const input = buildInput();
    if (!input) {
      toast.error(
        requiresBrilo
          ? "Selecciona el cliente y el ejecutivo de Brilo."
          : "Selecciona el contrato de Brilo que corresponde a esta cotización.",
      );
      return;
    }

    acceptMutation.mutate(
      { id: offer.id, input },
      {
        onSuccess: handleAccepted,
        onError: (err) =>
          toast.error(err.message || "No se pudo aceptar la cotización."),
      },
    );
  }

  function renderBody() {
    if (contextQuery.isLoading) {
      return (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      );
    }
    if (contextQuery.isError || !context) {
      return (
        <p className="text-sm text-destructive">
          No se pudo consultar Brilo. Cierra el diálogo e inténtalo de nuevo.
        </p>
      );
    }
    if (context.requiresBriloDocuments) {
      return (
        <AcceptOfferBriloSection
          context={context}
          client={client}
          onClientChange={setClientOverride}
          executiveId={executiveId}
          onExecutiveChange={setExecutiveOverride}
        />
      );
    }
    return (
      <BriloContractCombobox
        value={selectedContract?.mconId ?? null}
        onChange={setSelectedContract}
        defaultSelectedContract={selectedContract}
        required
      />
    );
  }

  const description = !offer
    ? null
    : requiresBrilo
      ? `Confirma el cliente y el ejecutivo de Brilo para ${offer.offerNumber}. El contrato creado quedará vinculado automáticamente.`
      : `Vincula ${offer.offerNumber} con el contrato creado en Brilo. Este paso es obligatorio para registrar la aceptación del cliente.`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        size="md"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Aceptar cotización</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="mb-4 px-8">{renderBody()}</div>

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
            disabled={acceptMutation.isPending || !canSubmit}
          >
            {acceptMutation.isPending
              ? requiresBrilo
                ? "Creando en Brilo…"
                : "Guardando…"
              : "Confirmar aceptación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
