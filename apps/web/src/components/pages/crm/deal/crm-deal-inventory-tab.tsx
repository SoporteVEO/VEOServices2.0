"use client";

import { useState } from "react";
import { Calculator, Lock, MapPinned, Plus, Trash2, Unlock } from "lucide-react";
import { toast } from "sonner";
import { useUpdateCrmDeal } from "@/api/crm/crm.mutations";
import type { CrmDealDetail } from "@/api/crm/crm.types";
import { useCrmDealSites } from "@/api/crm/crm-ooh.get";
import { useCrmDealSitesAction } from "@/api/crm/crm-ooh.mutations";
import type { CrmDealSite, DealSitesAction } from "@/api/crm/crm-ooh.types";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMoney } from "@/lib/format";
import { errorMessage } from "../crm-format";
import { HOLD_DAY_OPTIONS } from "../crm-ooh-const";
import { CrmInventoryPickerDialog } from "../inventory/crm-inventory-picker-dialog";
import { CrmDealMetric as Metric } from "./crm-deal-metric";
import { CrmDealSiteEditDialog } from "./crm-deal-site-edit-dialog";
import { CrmDealSiteRow } from "./crm-deal-site-row";

const ACTION_SUCCESS: Record<DealSitesAction, string> = {
  hold: "Reserva actualizada",
  release: "Sitios liberados",
  propose: "Sitios devueltos a propuesta",
  remove: "Sitios quitados del negocio",
};

export function CrmDealInventoryTab({ deal }: { deal: CrmDealDetail }) {
  const { data, isLoading } = useCrmDealSites(deal.id);
  const sitesAction = useCrmDealSitesAction();
  const updateDeal = useUpdateCrmDeal();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState<CrmDealSite | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [removeIds, setRemoveIds] = useState<string[] | null>(null);

  const editable = deal.status === "OPEN";
  const sites = data?.sites ?? [];
  const active = sites.filter((site) => site.status !== "RELEASED");
  const released = sites.filter((site) => site.status === "RELEASED");
  const summary = data?.summary;
  const liveSelection = selected.filter((id) => sites.some((site) => site.id === id));

  function runAction(siteIds: string[], action: DealSitesAction, holdDays?: number) {
    if (action === "remove") {
      setRemoveIds(siteIds);
      return;
    }
    sitesAction.mutate(
      { dealId: deal.id, siteIds, action, holdDays },
      {
        onSuccess: () => {
          setSelected([]);
          toast.success(ACTION_SUCCESS[action]);
        },
        onError: (error) => toast.error(errorMessage(error, "No se pudo actualizar los sitios.")),
      },
    );
  }

  function confirmRemove() {
    if (!removeIds) return;
    sitesAction.mutate(
      { dealId: deal.id, siteIds: removeIds, action: "remove" },
      {
        onSuccess: () => {
          setSelected([]);
          setRemoveIds(null);
          toast.success(ACTION_SUCCESS.remove);
        },
        onError: (error) => toast.error(errorMessage(error, "No se pudo quitar los sitios.")),
      },
    );
  }

  function applyTotalAsValue() {
    if (!summary) return;
    updateDeal.mutate(
      { id: deal.id, value: summary.totalValue },
      {
        onSuccess: () => toast.success("Valor del negocio actualizado"),
        onError: (error) => toast.error(errorMessage(error, "No se pudo actualizar el valor.")),
      },
    );
  }

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {summary ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric
            label="Sitios"
            value={String(summary.activeCount)}
            hint={`${summary.staticCount} vallas · ${summary.digitalCount} pantallas`}
          />
          <Metric
            label="Reservados"
            value={String(summary.heldCount)}
            hint={
              summary.expiringCount > 0
                ? `${summary.expiringCount} por vencer`
                : `${summary.bookedCount} vendidos`
            }
            warn={summary.expiringCount > 0}
          />
          <Metric
            label="Valor del periodo"
            value={formatMoney(summary.totalValue)}
            hint={
              summary.totalValue !== deal.value
                ? `Negocio: ${formatMoney(deal.value)}`
                : "Coincide con el negocio"
            }
          />
          <Metric
            label="Spots/día"
            value={String(summary.spotsPerDay)}
            hint={
              summary.conflictCount > 0
                ? `${summary.conflictCount} con conflicto`
                : "Pantallas digitales"
            }
            warn={summary.conflictCount > 0}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {editable ? (
            <Button sizeVariant="sm" icon={Plus} onClick={() => setPickerOpen(true)}>
              Agregar sitios
            </Button>
          ) : null}
          {editable && liveSelection.length > 0 ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button sizeVariant="sm" variant="outline" icon={Lock}>
                    Reservar ({liveSelection.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {HOLD_DAY_OPTIONS.map((days) => (
                    <DropdownMenuItem
                      key={days}
                      onSelect={() => runAction(liveSelection, "hold", days)}
                    >
                      {days} días
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                sizeVariant="sm"
                variant="outline"
                icon={Unlock}
                disabled={sitesAction.isPending}
                onClick={() => runAction(liveSelection, "release")}
              >
                Liberar
              </Button>
              <Button
                sizeVariant="sm"
                variant="outline"
                icon={Trash2}
                disabled={sitesAction.isPending}
                onClick={() => runAction(liveSelection, "remove")}
              >
                Quitar
              </Button>
            </>
          ) : null}
        </div>
        {summary && summary.totalValue > 0 && summary.totalValue !== deal.value ? (
          <Button
            sizeVariant="sm"
            variant="ghost"
            icon={Calculator}
            loading={updateDeal.isPending}
            onClick={applyTotalAsValue}
          >
            Usar total como valor
          </Button>
        ) : null}
      </div>

      {active.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border border-dashed border-border p-8 text-center">
          <MapPinned className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">Sin sitios en este negocio</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Busca vallas y pantallas disponibles para el periodo de la campaña y resérvalas
            mientras el cliente decide.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border">
          {active.map((site) => (
            <CrmDealSiteRow
              key={site.id}
              site={site}
              editable={editable}
              selected={liveSelection.includes(site.id)}
              onSelect={(checked) => toggle(site.id, checked)}
              onAction={(action, holdDays) => runAction([site.id], action, holdDays)}
              onEdit={() => setEditing(site)}
            />
          ))}
        </ul>
      )}

      {released.length > 0 ? (
        <details className="group">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
            Liberados ({released.length})
          </summary>
          <ul className="mt-2 divide-y divide-border border border-border">
            {released.map((site) => (
              <CrmDealSiteRow
                key={site.id}
                site={site}
                editable={editable}
                selected={liveSelection.includes(site.id)}
                onSelect={(checked) => toggle(site.id, checked)}
                onAction={(action, holdDays) => runAction([site.id], action, holdDays)}
                onEdit={() => setEditing(site)}
              />
            ))}
          </ul>
        </details>
      ) : null}

      <CrmInventoryPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} deal={deal} />
      <CrmDealSiteEditDialog
        dealId={deal.id}
        site={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
      <ConfirmDialog
        open={removeIds !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveIds(null);
        }}
        title="Quitar sitios"
        description={`Se quitarán ${removeIds?.length ?? 0} sitio(s) del negocio y se liberarán sus reservas.`}
        confirmLabel="Quitar"
        pending={sitesAction.isPending}
        onConfirm={confirmRemove}
      />
    </div>
  );
}