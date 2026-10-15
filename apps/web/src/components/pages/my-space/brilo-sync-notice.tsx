"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useRetryOfferBriloSync } from "@/api/offers/offers.post";
import type { OfferListItem } from "@/api/offers/offers.types";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/primitives/ui/alert";
import { Button } from "@/components/ui/button";

export function needsBriloRetry(offer: OfferListItem): boolean {
  return (
    offer.status === "ACCEPTED" &&
    !offer.briloMconId &&
    (offer.briloSyncStatus === "FAILED" || offer.briloSyncStatus === "PENDING")
  );
}

export function useBriloRetry() {
  return useRetryOfferBriloSync({
    onSuccess: (updated) => {
      if (updated.briloSyncStatus === "SYNCED") {
        toast.success("Cotización y contrato creados en Brilo.");
        return;
      }
      toast.error(
        updated.briloSyncError
          ? `Brilo devolvió un error: ${updated.briloSyncError}`
          : "No se pudieron crear los documentos en Brilo.",
      );
    },
    onError: (err) =>
      toast.error(err.message || "No se pudo reintentar con Brilo."),
  });
}

export function BriloRetryButton({ offer }: { offer: OfferListItem }) {
  const retry = useBriloRetry();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      icon={RefreshCw}
      disabled={retry.isPending}
      onClick={() => retry.mutate(offer.id)}
    >
      {retry.isPending ? "Reintentando…" : "Reintentar Brilo"}
    </Button>
  );
}

export function BriloSyncNotice({
  offer,
  readOnly,
}: {
  offer: OfferListItem;
  readOnly: boolean;
}) {
  if (!needsBriloRetry(offer)) return null;

  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertTitle>No se pudo crear el contrato en Brilo</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <span>
          {offer.briloSyncError ??
            "La creación de la cotización y el contrato en Brilo quedó pendiente."}
        </span>
        <span>
          Reintenta la creación o vincula manualmente un contrato existente.
        </span>
        {readOnly ? null : (
          <div>
            <BriloRetryButton offer={offer} />
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
