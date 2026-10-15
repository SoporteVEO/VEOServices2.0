"use client";

import { useState } from "react";
import { Link2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { useCrmAvailableOffers } from "@/api/crm/crm.get";
import { useLinkCrmOffer, useUnlinkCrmOffer } from "@/api/crm/crm.mutations";
import type { CrmDealDetail, CrmOfferSummary } from "@/api/crm/crm.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { OFFER_STATUS_LABELS, OFFER_STATUS_STYLES } from "../crm-const";
import { errorMessage } from "../crm-format";
import { EmptyList, ListSkeleton } from "../dashboard/crm-dashboard-lists";

export function CrmDealOffersTab({ deal }: { deal: CrmDealDetail }) {
  const [search, setSearch] = useState("");
  const [picking, setPicking] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim(), 250);
  const { data: available = [], isLoading } = useCrmAvailableOffers(
    deal.id,
    debouncedSearch,
    picking,
  );
  const linkOffer = useLinkCrmOffer();
  const unlinkOffer = useUnlinkCrmOffer();

  function handleLink(offer: CrmOfferSummary) {
    linkOffer.mutate(
      { dealId: deal.id, offerId: offer.id },
      {
        onSuccess: () => toast.success(`Cotización ${offer.offerNumber} vinculada`),
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo vincular la cotización.")),
      },
    );
  }

  function handleUnlink(offer: CrmOfferSummary) {
    unlinkOffer.mutate(
      { dealId: deal.id, offerId: offer.id },
      {
        onSuccess: () => toast.success("Cotización desvinculada"),
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo desvincular la cotización.")),
      },
    );
  }

  const linkedTotal = deal.offers.reduce((sum, offer) => sum + offer.total, 0);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">Cotizaciones vinculadas</h4>
          <p className="text-xs text-muted-foreground">
            {deal.offers.length} · {formatMoney(linkedTotal)}
          </p>
        </div>
        <Button
          sizeVariant="sm"
          variant={picking ? "secondary" : "outline"}
          icon={Link2}
          onClick={() => setPicking((prev) => !prev)}
        >
          {picking ? "Cerrar" : "Vincular cotización"}
        </Button>
      </div>

      {deal.offers.length === 0 ? (
        <EmptyList message="Este negocio aún no tiene cotizaciones." />
      ) : (
        <ul className="flex flex-col divide-y border border-border">
          {deal.offers.map((offer) => (
            <OfferRow
              key={offer.id}
              offer={offer}
              action={
                <PrimitiveButton
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Desvincular"
                  disabled={unlinkOffer.isPending}
                  onClick={() => handleUnlink(offer)}
                >
                  <Unlink />
                </PrimitiveButton>
              }
            />
          ))}
        </ul>
      )}

      {picking ? (
        <div className="flex flex-col gap-3 border border-dashed border-border p-3">
          <Input
            isSearch
            placeholder="Buscar por número, cliente o empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {isLoading ? (
            <ListSkeleton rows={3} />
          ) : available.length === 0 ? (
            <EmptyList message="No hay cotizaciones disponibles." />
          ) : (
            <ul className="flex max-h-80 flex-col divide-y overflow-y-auto">
              {available.map((offer) => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  action={
                    <Button
                      sizeVariant="sm"
                      variant="outline"
                      loading={
                        linkOffer.isPending &&
                        linkOffer.variables?.offerId === offer.id
                      }
                      disabled={linkOffer.isPending}
                      onClick={() => handleLink(offer)}
                    >
                      Vincular
                    </Button>
                  }
                />
              ))}
            </ul>
          )}
          <p className="text-[11px] text-muted-foreground">
            Si el negocio no tiene valor, se tomará el total de la primera cotización.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function OfferRow({
  offer,
  action,
}: {
  offer: CrmOfferSummary;
  action: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{offer.offerNumber}</span>
          <Badge variant="outline" className={cn("h-5", OFFER_STATUS_STYLES[offer.status])}>
            {OFFER_STATUS_LABELS[offer.status]}
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {offer.customerCompany || offer.customerName} · {formatDate(offer.createdAt)} ·{" "}
          {offer.createdByName}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums">
        {formatMoney(offer.total)}
      </span>
      {action}
    </li>
  );
}
