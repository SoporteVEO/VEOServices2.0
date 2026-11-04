"use client";

import { useState } from "react";
import { MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLocationContext } from "@/api/expansion/expansion.get";
import {
  useCreateExpansionSite,
  useUpdateExpansionSite,
} from "@/api/expansion/expansion.mutations";
import type {
  ExpansionNexoInsightInput,
  ExpansionSite,
  ExpansionSiteDetail,
  ExpansionSiteInput,
  ExpansionSitePriority,
  ExpansionSiteStatus,
} from "@/api/expansion/expansion.types";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/format";
import {
  FORMAT_OPTIONS,
  SITE_PRIORITIES,
  SITE_PRIORITY_LABELS,
  SITE_STATUSES,
  SITE_STATUS_META,
  formatDistance,
  formatPercent,
} from "../expansion-const";
import { nearestDepartment, type MappedBillboard } from "../expansion-analysis";
import { analyzeLocation, toNexoAnalysis } from "../expansion-location-score";
import type { LatLng } from "../expansion-types";
import { ExpansionNexoInsight } from "./expansion-nexo-insight";
import { ExpansionScoreBreakdown } from "./expansion-score-breakdown";

const NONE = "__none__";
const PREVIEW_RADIUS_KM = 2;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edits this site; otherwise creates one at `point`. */
  site?: ExpansionSite | null;
  point?: LatLng | null;
  billboards: MappedBillboard[];
  departments: string[];
  periodMonths: number;
  onSaved?: (site: ExpansionSiteDetail) => void;
};

export function ExpansionSiteFormDialog({ open, onOpenChange, site, ...rest }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        {open ? (
          <SiteForm site={site ?? null} onClose={() => onOpenChange(false)} {...rest} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface FormState {
  name: string;
  status: ExpansionSiteStatus;
  priority: ExpansionSitePriority;
  formatCode: string;
  address: string;
  departmentName: string;
  width: string;
  height: string;
  estimatedMonthlyPrice: string;
  estimatedMonthlyCost: string;
  description: string;
}

function toText(value: number | null | undefined): string {
  return value == null ? "" : String(value);
}

function toNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function SiteForm({
  site,
  point,
  billboards,
  departments,
  periodMonths,
  onSaved,
  onClose,
}: Omit<Props, "open" | "onOpenChange" | "site"> & {
  site: ExpansionSite | null;
  onClose: () => void;
}) {
  const location: LatLng = site ?? point ?? { latitude: 0, longitude: 0 };
  const [form, setForm] = useState<FormState>(() => ({
    name: site?.name ?? "",
    status: site?.status ?? "PROPOSED",
    priority: site?.priority ?? "MEDIUM",
    formatCode: site?.formatCode ?? NONE,
    address: site?.address ?? "",
    departmentName: site?.departmentName ?? nearestDepartment(location, billboards) ?? NONE,
    width: toText(site?.width),
    height: toText(site?.height),
    estimatedMonthlyPrice: toText(site?.estimatedMonthlyPrice),
    estimatedMonthlyCost: toText(site?.estimatedMonthlyCost),
    description: site?.description ?? "",
  }));
  const [submitted, setSubmitted] = useState(false);

  const createMutation = useCreateExpansionSite();
  const updateMutation = useUpdateExpansionSite();
  const isBusy = createMutation.isPending || updateMutation.isPending;

  const numbers = {
    width: toNumber(form.width),
    height: toNumber(form.height),
    estimatedMonthlyPrice: toNumber(form.estimatedMonthlyPrice),
    estimatedMonthlyCost: toNumber(form.estimatedMonthlyCost),
  };
  const invalidNumber = Object.entries(numbers).find(
    ([, value]) => value != null && (Number.isNaN(value) || value < 0),
  );
  const nameError =
    form.name.trim().length < 2 ? "Escribe un nombre de al menos 2 caracteres." : null;

  const liveContext = useLocationContext(site?.locationContext ? null : location);
  const context = site?.locationContext ?? liveContext.data ?? null;
  const validNumber = (value: number | null) => (value == null || Number.isNaN(value) ? null : value);
  const estimatedMonthlyPrice = validNumber(numbers.estimatedMonthlyPrice);
  const estimatedMonthlyCost = validNumber(numbers.estimatedMonthlyCost);

  const analysis = analyzeLocation(
    { ...location, estimatedMonthlyPrice, estimatedMonthlyCost },
    billboards,
    periodMonths,
    PREVIEW_RADIUS_KM,
    context,
  );
  const nexoRequest: ExpansionNexoInsightInput = {
    latitude: location.latitude,
    longitude: location.longitude,
    siteId: site?.id,
    name: form.name.trim() || null,
    formatCode: form.formatCode === NONE ? null : form.formatCode,
    width: validNumber(numbers.width),
    height: validNumber(numbers.height),
    estimatedMonthlyPrice,
    estimatedMonthlyCost,
    analysis: toNexoAnalysis(analysis),
  };

  function patch(next: Partial<FormState>) {
    setForm((current) => ({ ...current, ...next }));
  }

  async function handleSubmit() {
    setSubmitted(true);
    if (nameError || invalidNumber) return;
    const input: ExpansionSiteInput = {
      name: form.name.trim(),
      latitude: location.latitude,
      longitude: location.longitude,
      status: form.status,
      priority: form.priority,
      formatCode: form.formatCode === NONE ? null : form.formatCode,
      address: form.address.trim() || null,
      departmentName: form.departmentName === NONE ? null : form.departmentName,
      description: form.description.trim() || null,
      ...numbers,
    };
    try {
      const saved = site
        ? await updateMutation.mutateAsync({ id: site.id, ...input })
        : await createMutation.mutateAsync(input);
      toast.success(site ? "Ubicación actualizada." : `Ubicación ${saved.code} creada.`);
      onSaved?.(saved);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la ubicación.");
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{site ? `Editar ${site.code}` : "Nueva ubicación planificada"}</DialogTitle>
        <DialogDescription className="flex items-center gap-1.5">
          <MapPin className="size-3.5" />
          {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          {site ? " · arrastra el pin en el mapa para moverla" : null}
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Input
            label="Nombre"
            required
            autoFocus
            maxLength={120}
            placeholder="Ej. Redondel Masferrer, salida a Santa Tecla"
            value={form.name}
            onChange={(event) => patch({ name: event.target.value })}
          />
          {submitted && nameError ? <p className="text-xs text-destructive">{nameError}</p> : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            label="Estado"
            value={form.status}
            onValueChange={(value) => patch({ status: value as ExpansionSiteStatus })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SITE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {SITE_STATUS_META[status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            label="Prioridad"
            value={form.priority}
            onValueChange={(value) => patch({ priority: value as ExpansionSitePriority })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SITE_PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {SITE_PRIORITY_LABELS[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            label="Formato"
            value={form.formatCode}
            onValueChange={(value) => patch({ formatCode: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sin definir</SelectItem>
              {FORMAT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
          <Input
            label="Dirección o referencia"
            maxLength={300}
            value={form.address}
            onChange={(event) => patch({ address: event.target.value })}
          />
          <Select
            label="Departamento"
            value={form.departmentName}
            onValueChange={(value) => patch({ departmentName: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sin definir</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department} value={department}>
                  {department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Input
            label="Ancho (m)"
            type="number"
            min={0}
            step="0.1"
            value={form.width}
            onChange={(event) => patch({ width: event.target.value })}
          />
          <Input
            label="Alto (m)"
            type="number"
            min={0}
            step="0.1"
            value={form.height}
            onChange={(event) => patch({ height: event.target.value })}
          />
          <Input
            label="Precio mensual (USD)"
            type="number"
            min={0}
            placeholder={analysis.medianPrice != null ? String(Math.round(analysis.medianPrice)) : ""}
            value={form.estimatedMonthlyPrice}
            onChange={(event) => patch({ estimatedMonthlyPrice: event.target.value })}
          />
          <Input
            label="Costo mensual (USD)"
            type="number"
            min={0}
            value={form.estimatedMonthlyCost}
            onChange={(event) => patch({ estimatedMonthlyCost: event.target.value })}
          />
        </div>
        {submitted && invalidNumber ? (
          <p className="-mt-2 text-xs text-destructive">
            Las medidas, el precio y el costo deben ser números positivos.
          </p>
        ) : null}

        <Textarea
          label="Descripción"
          rows={3}
          maxLength={4000}
          placeholder="Por qué es una buena ubicación, flujo vehicular, competencia, permisos..."
          value={form.description}
          onChange={(event) => patch({ description: event.target.value })}
        />

        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="size-4 text-violet-600" />
            Estimación según vallas similares y el entorno
          </span>
          <ExpansionScoreBreakdown analysis={analysis} contextLoading={liveContext.isFetching} />
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <PreviewStat label="Ocupación esperada" value={formatPercent(analysis.avgOccupancy)} />
            <PreviewStat label="Precio de la zona" value={formatMoney(analysis.medianPrice)} />
            <PreviewStat
              label="Ingreso estimado"
              value={
                analysis.estimatedMonthlyRevenue != null
                  ? `${formatMoney(analysis.estimatedMonthlyRevenue)}/mes`
                  : "-"
              }
            />
            <PreviewStat
              label="Valla más cercana"
              value={
                analysis.nearest
                  ? `${analysis.nearest.billboard.code} · ${formatDistance(analysis.nearest.distanceKm)}`
                  : "-"
              }
            />
          </div>
          {analysis.medianPrice != null && !form.estimatedMonthlyPrice ? (
            <Button
              variant="ghost"
              sizeVariant="sm"
              className="self-start"
              onClick={() => patch({ estimatedMonthlyPrice: String(Math.round(analysis.medianPrice!)) })}
            >
              Usar precio de la zona
            </Button>
          ) : null}
          <ExpansionNexoInsight
            key={`${location.latitude},${location.longitude}`}
            request={nexoRequest}
            waiting={liveContext.isFetching}
          />
        </div>
      </DialogBody>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isBusy}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} loading={isBusy}>
          {site ? "Guardar cambios" : "Crear ubicación"}
        </Button>
      </DialogFooter>
    </>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="truncate font-medium tabular-nums">{value}</span>
    </div>
  );
}
