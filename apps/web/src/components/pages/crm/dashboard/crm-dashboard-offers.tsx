"use client";

import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCreateCrmDealFromOffer } from "@/api/crm/crm.mutations";
import type { CrmDashboard } from "@/api/crm/crm.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { OFFER_STATUS_LABELS, OFFER_STATUS_STYLES } from "../crm-const";
import { errorMessage, timeAgo } from "../crm-format";
import { EmptyList, ListSkeleton } from "./crm-dashboard-lists";

interface Props {
  dashboard: CrmDashboard | undefined;
  isLoading: boolean;
  onDealCreated: (dealId: string) => void;
}

export function CrmDashboardOffers({ dashboard, isLoading, onDealCreated }: Props) {
  const createFromOffer = useCreateCrmDealFromOffer();

  function handleCreate(offerId: string) {
    createFromOffer.mutate(
      { offerId, pipelineId: dashboard?.pipeline.id },
      {
        onSuccess: (deal) => {
          toast.success("Negocio creado desde la cotización");
          onDealCreated(deal.id);
        },
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo crear el negocio.")),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cotizaciones</CardTitle>
        <CardDescription>
          Cotizaciones del período y las que aún no tienen negocio en el CRM
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading || !dashboard ? (
          <ListSkeleton rows={4} />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {dashboard.offers.byStatus.map((row) => (
                <div
                  key={row.status}
                  className="flex flex-col gap-1 border border-border p-3"
                >
                  <Badge
                    variant="outline"
                    className={OFFER_STATUS_STYLES[row.status]}
                  >
                    {OFFER_STATUS_LABELS[row.status]}
                  </Badge>
                  <span className="text-lg font-semibold tabular-nums">
                    {row.count}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {formatMoney(row.total)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Sin negocio vinculado</h4>
              <span className="text-xs text-muted-foreground">
                {dashboard.offers.unlinkedCount} en total
              </span>
            </div>

            {dashboard.offers.unlinked.length === 0 ? (
              <EmptyList message="Todas las cotizaciones tienen negocio." />
            ) : (
              <ul className="flex flex-col divide-y">
                {dashboard.offers.unlinked.map((offer) => (
                  <li key={offer.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {offer.offerNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("h-5", OFFER_STATUS_STYLES[offer.status])}
                        >
                          {OFFER_STATUS_LABELS[offer.status]}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {offer.customerCompany || offer.customerName} ·{" "}
                        {timeAgo(offer.createdAt)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatMoney(offer.total)}
                    </span>
                    <Button
                      variant="outline"
                      sizeVariant="sm"
                      icon={Plus}
                      loading={
                        createFromOffer.isPending &&
                        createFromOffer.variables?.offerId === offer.id
                      }
                      disabled={createFromOffer.isPending}
                      onClick={() => handleCreate(offer.id)}
                    >
                      Crear negocio
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
