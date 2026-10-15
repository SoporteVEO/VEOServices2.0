"use client";

import { useState } from "react";
import { FilePlus2 } from "lucide-react";
import { toast } from "sonner";
import { useClient } from "@/api/clients/clients.get";
import { useLinkCrmOffer } from "@/api/crm/crm.mutations";
import type { CrmDealDetail } from "@/api/crm/crm.types";
import { useCrmDealSites } from "@/api/crm/crm-ooh.get";
import { GenerateOfferModal } from "@/components/pages/my-space/quotation/generate-offer-modal";
import type { OfferItem } from "@/components/pages/my-space/quotation/offer-types";
import { Button } from "@/components/ui/button";
import { errorMessage } from "../crm-format";
import { dealSitesToStaticOfferItems } from "./crm-deal-offer-items";

export function CrmDealCreateOfferButton({ deal }: { deal: CrmDealDetail }) {
  const [items, setItems] = useState<OfferItem[] | null>(null);
  const { data: sites, isLoading: sitesLoading } = useCrmDealSites(deal.id);
  const { data: client, isLoading: clientLoading } = useClient(deal.client?.id ?? null);
  const linkOffer = useLinkCrmOffer();

  const staticItems = dealSitesToStaticOfferItems(sites?.sites ?? []);

  function handleCreated(saved: { id: string; offerNumber: string }) {
    linkOffer.mutate(
      { dealId: deal.id, offerId: saved.id },
      {
        onError: (error) =>
          toast.error(
            errorMessage(error, `No se pudo vincular ${saved.offerNumber} al negocio.`),
          ),
      },
    );
  }

  return (
    <>
      <Button
        sizeVariant="sm"
        icon={FilePlus2}
        loading={sitesLoading || clientLoading}
        onClick={() => setItems(staticItems)}
      >
        {staticItems.length > 0
          ? `Cotizar ${staticItems.length} ${staticItems.length === 1 ? "valla" : "vallas"}`
          : "Nueva cotización"}
      </Button>
      {items ? (
        <GenerateOfferModal
          open
          onOpenChange={(open) => {
            if (!open) setItems(null);
          }}
          initialClient={client}
          initialItems={items}
          onSuccess={handleCreated}
        />
      ) : null}
    </>
  );
}
