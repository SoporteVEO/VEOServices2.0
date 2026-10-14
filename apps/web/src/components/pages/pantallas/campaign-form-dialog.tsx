"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { useCreateCampaign, useUpdateCampaign } from "@/api/pantallas/pantallas.mutations";
import type {
  Campaign,
  CampaignArt,
  CampaignDeal,
  CampaignInput,
  PlacementResult,
  Screen,
  Sublist,
} from "@/api/pantallas/pantallas.types";
import { Checkbox } from "@/components/primitives/ui/checkbox";
import { Label } from "@/components/primitives/ui/label";
import { Switch } from "@/components/primitives/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ART_LABELS,
  ART_OPTIONS,
  CAMPAIGN_SPOT_PRESETS,
  DEAL_LABELS,
  DEAL_OPTIONS,
} from "./pantallas-const";
import { usePantallas } from "./pantallas-context";
import {
  formatCount,
  formatMoney,
  formatSpotMoney,
  localIsoDate,
  parseAmount,
  parseIso,
  plural,
  todayIso,
} from "./pantallas-format";
import {
  billingDays,
  campaignStatus,
  clientNames,
  describePlan,
  exactSpotValue,
  findLocation,
  occupiesAir,
  planPlacement,
  sublistStats,
} from "./pantallas-logic";
import { clientValues } from "./order-report-logic";
import { CampaignVersionsEditor, type VersionRow } from "./campaign-versions-editor";
import { OptionButtonGroup } from "./option-button-group";

interface FormState {
  client: string;
  campaign: string;
  startDate: string | null;
  endDate: string | null;
  sublistId: string;
  spots: string;
  paused: boolean;
  pauseReason: string;
  alsoScreenIds: string[];
  art: CampaignArt;
  deal: CampaignDeal;
  monthly: string;
  spotInput: string;
  spotTouched: boolean;
  versions: VersionRow[];
  notes: string;
}

function initialState(sublist: Sublist, campaign: Campaign | null, today: string): FormState {
  return {
    client: campaign?.client ?? "",
    campaign: campaign?.campaign ?? "",
    startDate: campaign ? campaign.startDate : today,
    endDate: campaign?.endDate ?? null,
    sublistId: sublist.id,
    spots: String(campaign?.spotsPerDay ?? 300),
    paused: campaign?.paused ?? false,
    pauseReason: campaign?.pauseReason ?? "",
    alsoScreenIds: [],
    art: campaign?.art ?? "RECEIVED",
    deal: campaign?.deal ?? "COMMERCIAL",
    monthly: campaign?.monthlyValue != null ? String(campaign.monthlyValue) : "",
    spotInput: campaign?.spotValue != null ? String(campaign.spotValue) : "",
    spotTouched: campaign?.spotValue != null,
    versions: (campaign?.versions ?? []).map((v) => ({
      key: v.id ?? crypto.randomUUID(),
      title: v.title,
      startDate: v.startDate,
      endDate: v.endDate,
    })),
    notes: campaign?.notes ?? "",
  };
}

function placementToast(client: string, copies: PlacementResult[], isEdit: boolean) {
  const placed = copies.filter((c) => c.placed);
  if (!placed.length) {
    toast.success(isEdit ? "Campaña actualizada" : "Campaña agregada");
    return;
  }
  const created = placed.filter((c) => c.newSublist);
  let message = `${client} en ${placed.length + 1} pantallas`;
  if (created.length) {
    message += ` · ${created.length} ${plural(created.length, "sublista nueva", "sublistas nuevas")}`;
  }
  toast.success(message);
  const expand = placed.filter((c) => c.needsMoreHours).map((c) => c.screenName);
  if (expand.length) {
    toast.warning("Se crearon sublistas nuevas y estas pantallas se quedaron sin horas suficientes", {
      description: `${expand.join(", ")}. Abre cada una y aplica la sugerencia de horario para ampliar la operación.`,
      duration: Infinity,
      closeButton: true,
    });
  }
}

function CampaignForm({
  screen,
  sublist,
  campaign,
  onDone,
}: {
  screen: Screen;
  sublist: Sublist;
  campaign: Campaign | null;
  onDone: () => void;
}) {
  const { board, refDate } = usePantallas();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const [form, setForm] = useState(() => initialState(sublist, campaign, todayIso()));
  const clientsListId = useId();
  const isBusy = createCampaign.isPending || updateCampaign.isPending;
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const spots = Number(form.spots) || 0;
  const currentAir = campaign && occupiesAir(campaignStatus(campaign, refDate)) ? campaign.spotsPerDay : 0;
  const freeIn = (target: Sublist) =>
    sublistStats(target, refDate).free + (target.id === sublist.id ? currentAir : 0);
  const targetSublist = screen.sublists.find((s) => s.id === form.sublistId) ?? sublist;
  const free = freeIn(targetSublist);
  const remaining = free - spots;

  const monthly = parseAmount(form.monthly);
  const days = billingDays(form.startDate, form.endDate);
  const autoSpot = exactSpotValue(monthly, spots, form.startDate, form.endDate);
  const spotDisplay = form.spotTouched ? form.spotInput : autoSpot !== null ? String(autoSpot) : "";

  const values = clientValues(board, form.client.trim(), form.campaign.trim());
  const valueRows = values.rows.filter((r) => r.screen !== screen.name);
  if (monthly !== null || spots) valueRows.push({ screen: screen.name, monthly, spot: null, spotsPerDay: spots });
  const withValue = valueRows.filter((r) => r.monthly !== null);
  const valuesTotal = withValue.reduce((sum, r) => sum + (r.monthly ?? 0), 0);

  const placementInput = {
    client: form.client.trim(),
    campaign: form.campaign.trim(),
    startDate: form.startDate,
    endDate: form.endDate,
    spotsPerDay: spots,
  };
  const otherScreens = board.screens
    .filter((s) => s.id !== screen.id)
    .map((s) => ({ screen: s, plan: planPlacement(s, placementInput, board.settings, refDate) }));

  function submit() {
    const client = form.client.trim();
    if (!client) {
      toast.error("Falta el nombre del cliente");
      return;
    }
    const selectedCopies = form.alsoScreenIds.filter(
      (id) => otherScreens.find((o) => o.screen.id === id)?.plan.type !== "duplicate",
    );
    const input: CampaignInput = {
      client,
      campaign: form.campaign.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      spotsPerDay: spots,
      notes: form.notes.trim(),
      paused: form.paused,
      pauseReason: form.paused ? form.pauseReason.trim() : "",
      art: form.art,
      deal: form.deal,
      monthlyValue: monthly,
      spotValue: form.spotTouched ? parseAmount(form.spotInput) : autoSpot,
      totalValue: campaign?.totalValue ?? null,
      versions: form.versions
        .map((v) => ({ title: v.title.trim(), startDate: v.startDate, endDate: v.endDate }))
        .filter((v) => v.title || v.startDate || v.endDate),
      alsoScreenIds: selectedCopies,
      refDate,
    };
    const callbacks = {
      onSuccess: (result: { copies: PlacementResult[] }) => {
        onDone();
        placementToast(client, result.copies, Boolean(campaign));
      },
      onError: (err: Error) => toast.error(err.message),
    };
    if (campaign) {
      updateCampaign.mutate({ id: campaign.id, sublistId: form.sublistId, ...input }, callbacks);
    } else {
      createCampaign.mutate({ sublistId: sublist.id, ...input }, callbacks);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{campaign ? "Editar campaña" : "Nueva campaña"}</DialogTitle>
        <DialogDescription>
          {screen.name} · {sublist.name}
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <Input
          label="Cliente"
          required
          list={clientsListId}
          placeholder="Ej. LA CURACAO"
          autoComplete="off"
          value={form.client}
          onChange={(e) => set("client", e.target.value)}
        />
        <datalist id={clientsListId}>
          {clientNames(board).map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <Input
          label="Campaña"
          placeholder="Ej. regreso a clases"
          autoComplete="off"
          value={form.campaign}
          onChange={(e) => set("campaign", e.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <DatePicker
            label="Fecha de inicio"
            allowClear
            value={parseIso(form.startDate)}
            onChange={(d) => set("startDate", d ? localIsoDate(d) : null)}
          />
          <DatePicker
            label="Fecha final"
            allowClear
            value={parseIso(form.endDate)}
            onChange={(d) => set("endDate", d ? localIsoDate(d) : null)}
          />
        </div>

        {campaign ? (
          <div className="flex flex-col gap-1">
            <Select
              label="Sublista"
              value={form.sublistId}
              onValueChange={(value) => set("sublistId", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {screen.sublists.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {formatCount(freeIn(s))} libres
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              También puedes arrastrar la tarjeta de una sublista a otra.
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Input
            label="Spots por día (frecuencia)"
            type="number"
            min={0}
            step={50}
            value={form.spots}
            onChange={(e) => set("spots", e.target.value)}
          />
          <OptionButtonGroup
            options={CAMPAIGN_SPOT_PRESETS}
            value={spots}
            onChange={(value) => set("spots", String(value))}
          />
          <p className={cn("text-xs text-muted-foreground", remaining < 0 && "text-red-600")}>
            {remaining < 0
              ? `Excede la sublista por ${formatCount(-remaining)} spots (disponibles: ${formatCount(free)} de ${formatCount(targetSublist.capacity)}).`
              : `Quedarían ${formatCount(remaining)} spots libres en esta sublista de ${formatCount(targetSublist.capacity)}.`}
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border p-3">
          <div className="flex items-start gap-3">
            <Switch
              id="campaign-paused"
              checked={form.paused}
              onCheckedChange={(checked) => set("paused", checked)}
            />
            <Label htmlFor="campaign-paused" className="flex flex-col items-start gap-0.5">
              <span className="text-sm font-medium">Campaña pausada</span>
              <span className="text-xs font-normal text-muted-foreground">
                El cliente detuvo la pauta. Deja de contar como spots al aire, pero conserva su
                lugar en la sublista.
              </span>
            </Label>
          </div>
          {form.paused ? (
            <Input
              label="Motivo de la pausa"
              placeholder="Ej. pendiente de material nuevo"
              value={form.pauseReason}
              onChange={(e) => set("pauseReason", e.target.value)}
            />
          ) : null}
        </div>

        {otherScreens.length ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {campaign ? "Copiar también a otras pantallas" : "La misma campaña en otras pantallas"}
            </p>
            <div className="flex flex-col divide-y rounded-lg border">
              {otherScreens.map(({ screen: other, plan }) => {
                const disabled = plan.type === "duplicate";
                const checked = !disabled && form.alsoScreenIds.includes(other.id);
                return (
                  <label
                    key={other.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-3 py-2 text-sm",
                      disabled && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={(value) =>
                        set(
                          "alsoScreenIds",
                          value
                            ? [...form.alsoScreenIds, other.id]
                            : form.alsoScreenIds.filter((id) => id !== other.id),
                        )
                      }
                    />
                    <span className="font-medium">{other.name}</span>
                    <span
                      className={cn(
                        "ml-auto text-right text-xs text-muted-foreground",
                        plan.type === "new" && "text-amber-600",
                      )}
                    >
                      {describePlan(plan)}
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Se coloca sola en la sublista con el hueco más ajustado. Si ninguna alcanza, se crea una
              sublista nueva.
            </p>
          </div>
        ) : null}

        <OptionButtonGroup
          label="Estado del arte"
          options={ART_OPTIONS.map((value) => ({ value, label: ART_LABELS[value] }))}
          value={form.art}
          onChange={(value) => set("art", value)}
        />

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Valores en {screen.name}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Valor mensual de esta pantalla"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={form.monthly}
              onChange={(e) => set("monthly", e.target.value)}
            />
            <Input
              label="Valor por spot"
              type="number"
              min={0}
              step={0.0001}
              placeholder="0.0000"
              value={spotDisplay}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  spotInput: e.target.value,
                  spotTouched: e.target.value !== "",
                }))
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {monthly !== null && spots > 0
              ? `${formatMoney(monthly)} en ${screen.name} · ${formatCount(spots)} spots/día × ${formatCount(days)} días = ${formatCount(spots * days)} spots → ${formatSpotMoney(monthly / (spots * days))} por spot`
              : "Opcional. Cada pantalla tiene su propio valor; al escribirlo se calcula solo el valor por spot."}
          </p>
          {valueRows.length ? (
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs">
              <div className="flex justify-between">
                <span>Valor total de la campaña</span>
                <b>{withValue.length ? formatMoney(valuesTotal) : "—"}</b>
              </div>
              <p className="text-muted-foreground">
                {valueRows
                  .map((r) => `${r.screen} ${r.monthly === null ? "sin valor" : formatMoney(r.monthly)}`)
                  .join("  ·  ")}
              </p>
            </div>
          ) : null}
        </div>

        <OptionButtonGroup
          label={`Donación o canje · solo en ${screen.name}`}
          options={DEAL_OPTIONS.map((value) => ({ value, label: DEAL_LABELS[value] }))}
          value={form.deal}
          onChange={(value) => set("deal", value)}
        />

        <CampaignVersionsEditor
          rows={form.versions}
          onChange={(rows) => set("versions", rows)}
          defaultStartDate={form.startDate}
        />

        <Input
          label="Notas"
          placeholder="Opcional"
          autoComplete="off"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={isBusy}>
          Cancelar
        </Button>
        <Button onClick={submit} disabled={isBusy}>
          {isBusy ? "Guardando…" : campaign ? "Guardar cambios" : "Agregar"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function CampaignFormDialog({
  open,
  sublistId,
  campaignId,
  onClose,
}: {
  open: boolean;
  sublistId: string | null;
  campaignId: string | null;
  onClose: () => void;
}) {
  const { board } = usePantallas();
  const location = campaignId ? findLocation(board, campaignId) : null;
  const screen =
    location?.screen ?? board.screens.find((s) => s.sublists.some((x) => x.id === sublistId));
  const sublist = location?.sublist ?? screen?.sublists.find((s) => s.id === sublistId);

  return (
    <Dialog open={open && Boolean(screen && sublist)} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="xl">
        {screen && sublist ? (
          <CampaignForm
            key={`${sublist.id}:${campaignId ?? "new"}`}
            screen={screen}
            sublist={sublist}
            campaign={location?.campaign ?? null}
            onDone={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
