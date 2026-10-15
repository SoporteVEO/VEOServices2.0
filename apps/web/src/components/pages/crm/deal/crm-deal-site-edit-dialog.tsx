"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useUpdateCrmDealSite } from "@/api/crm/crm-ooh.mutations";
import type { CrmDealSite } from "@/api/crm/crm-ooh.types";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";
import { calendarDate, errorMessage } from "../crm-format";
import { isoDay, prorate } from "../crm-ooh-format";

interface Props {
  dealId: string;
  site: CrmDealSite | null;
  onOpenChange: (open: boolean) => void;
}

export function CrmDealSiteEditDialog({ dealId, site, onOpenChange }: Props) {
  return (
    <Dialog open={site !== null} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        {site ? (
          <EditBody key={site.id} dealId={dealId} site={site} onDone={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditBody({
  dealId,
  site,
  onDone,
}: {
  dealId: string;
  site: CrmDealSite;
  onDone: () => void;
}) {
  const update = useUpdateCrmDealSite();
  const [startDate, setStartDate] = useState<Date | null>(calendarDate(site.startDate));
  const [endDate, setEndDate] = useState<Date | null>(calendarDate(site.endDate));
  const [rate, setRate] = useState(String(site.rate));
  const [spots, setSpots] = useState(site.spotsPerDay != null ? String(site.spotsPerDay) : "");

  const rateValue = Number(rate);
  const preview =
    startDate && endDate && Number.isFinite(rateValue) && endDate >= startDate
      ? prorate(rateValue, startDate, endDate)
      : null;

  function handleSave() {
    if (!startDate || !endDate || endDate < startDate) {
      toast.error("Revisa las fechas de exhibición.");
      return;
    }
    if (!Number.isFinite(rateValue) || rateValue < 0) {
      toast.error("La tarifa debe ser un número positivo.");
      return;
    }
    const spotsValue = spots.trim() === "" ? null : Number(spots);
    if (site.kind === "DIGITAL" && (!spotsValue || spotsValue < 1)) {
      toast.error("Indica los spots por día.");
      return;
    }
    update.mutate(
      {
        dealId,
        siteId: site.id,
        startDate: isoDay(startDate),
        endDate: isoDay(endDate),
        rate: rateValue,
        ...(site.kind === "DIGITAL" ? { spotsPerDay: spotsValue } : {}),
      },
      {
        onSuccess: () => {
          toast.success("Sitio actualizado");
          onDone();
        },
        onError: (error) => toast.error(errorMessage(error, "No se pudo actualizar el sitio.")),
      },
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {site.code} · {site.label}
        </DialogTitle>
        <DialogDescription>
          Cambiar las fechas vuelve a validar la disponibilidad al reservar.
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <DatePicker
            label="Inicio"
            value={startDate}
            onChange={(date) => setStartDate(date ?? null)}
          />
          <DatePicker
            label="Fin"
            value={endDate}
            minDate={startDate ?? undefined}
            onChange={(date) => setEndDate(date ?? null)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Tarifa mensual (USD)"
            type="number"
            min={0}
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
          {site.kind === "DIGITAL" ? (
            <Input
              label="Spots por día"
              type="number"
              min={1}
              value={spots}
              onChange={(e) => setSpots(e.target.value)}
            />
          ) : null}
        </div>
        {preview != null ? (
          <p className="text-xs text-muted-foreground">
            Total del periodo:{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {formatMoney(preview)}
            </span>
          </p>
        ) : null}
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button loading={update.isPending} onClick={handleSave}>
          Guardar
        </Button>
      </DialogFooter>
    </>
  );
}
