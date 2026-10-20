"use client";

import { useId, useRef, useState } from "react";
import { FileUp } from "lucide-react";
import { toast } from "sonner";
import { useIngestDigitalOrder, useIngestOrder } from "@/api/pantallas/pantallas.mutations";
import type {
  CampaignArt,
  CampaignDeal,
  DigitalOrder,
  IngestOrderInput,
  PantallasBoard,
  PlacementResult,
} from "@/api/pantallas/pantallas.types";
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
import { cn } from "@/lib/utils";
import { ART_LABELS, ART_OPTIONS, DEAL_LABELS, DEAL_OPTIONS, ORDER_SPOT_PRESETS } from "./pantallas-const";
import {
  formatCount,
  formatIso,
  formatMoney,
  localIsoDate,
  parseAmount,
  parseIso,
  plural,
  todayIso,
} from "./pantallas-format";
import { billingDays, clientNames, exactSpotValue, planPlacement } from "./pantallas-logic";
import { readOrderFile } from "./op-file-parser";
import { OptionButtonGroup } from "./option-button-group";
import { orderIntakeInitial } from "./order-intake-initial";
import { EMPTY_ORDER_ROW, OrderIntakeRow, type OrderRowState } from "./order-intake-row";

type FileNotice = { tone: "info" | "ok" | "bad"; text: string };

const NOTICE_CLASS: Record<FileNotice["tone"], string> = {
  info: "text-muted-foreground",
  ok: "text-emerald-700 dark:text-emerald-400",
  bad: "text-red-600",
};

function OrderIntakeForm({
  board,
  refDate,
  order,
  onDone,
}: {
  board: PantallasBoard;
  refDate: string;
  order: DigitalOrder | null;
  onDone: () => void;
}) {
  const ingestOrder = useIngestOrder();
  const ingestDigitalOrder = useIngestDigitalOrder();
  const fileRef = useRef<HTMLInputElement>(null);
  const clientsListId = useId();
  const [initial] = useState(() => (order ? orderIntakeInitial(order) : null));
  const [client, setClient] = useState(initial?.client ?? "");
  const [campaign, setCampaign] = useState(initial?.campaign ?? "");
  const [startDate, setStartDate] = useState<string | null>(initial?.startDate ?? todayIso());
  const [endDate, setEndDate] = useState<string | null>(initial?.endDate ?? null);
  const [art, setArt] = useState<CampaignArt>("RECEIVED");
  const [globalDeal, setGlobalDeal] = useState<CampaignDeal>("COMMERCIAL");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [rows, setRows] = useState<Record<string, OrderRowState>>(initial?.rows ?? {});
  const [reading, setReading] = useState(false);
  const [notice, setNotice] = useState<FileNotice>({
    tone: "info",
    text: "Elige el PDF o el Excel que te manda comercial y se llenan los campos solos.",
  });
  const isPending = ingestOrder.isPending || ingestDigitalOrder.isPending;

  const rowOf = (id: string) => rows[id] ?? EMPTY_ORDER_ROW;
  const patchRow = (id: string, patch: Partial<OrderRowState>) =>
    setRows((prev) => ({ ...prev, [id]: { ...(prev[id] ?? EMPTY_ORDER_ROW), ...patch } }));

  const days = billingDays(startDate, endDate);
  const base = { client: client.trim(), campaign: campaign.trim(), startDate, endDate };
  const autoSpotOf = (row: OrderRowState) =>
    exactSpotValue(parseAmount(row.monthly), row.spots, startDate, endDate);

  const activeScreens = board.screens.filter((s) => rowOf(s.id).spots > 0);
  const totalSpots = activeScreens.reduce((sum, s) => sum + rowOf(s.id).spots, 0);
  const newSublists = activeScreens.filter(
    (s) =>
      planPlacement(s, { ...base, spotsPerDay: rowOf(s.id).spots }, board.settings, refDate).type ===
      "new",
  ).length;
  const monthlyValues = activeScreens
    .map((s) => parseAmount(rowOf(s.id).monthly))
    .filter((v): v is number => v !== null);
  const totalValue = monthlyValues.reduce((a, b) => a + b, 0);
  const handTyped = activeScreens.filter((s) => rowOf(s.id).spotTouched).length;
  const withoutValue = activeScreens.length - monthlyValues.length;

  const dealGroups = new Map<CampaignDeal, string[]>();
  for (const s of activeScreens) {
    const deal = rowOf(s.id).deal;
    if (deal !== "COMMERCIAL") dealGroups.set(deal, [...(dealGroups.get(deal) ?? []), s.name]);
  }
  const withDeal = [...dealGroups.values()].reduce((sum, l) => sum + l.length, 0);
  const dealHint = !activeScreens.length
    ? ""
    : !withDeal
      ? `Las ${activeScreens.length} pantallas entran como pauta comercial.`
      : withDeal === activeScreens.length && dealGroups.size === 1
        ? `Toda la OP entra como ${DEAL_LABELS[[...dealGroups.keys()][0]]}.`
        : `${[...dealGroups.entries()].map(([d, names]) => `${DEAL_LABELS[d]} en ${names.join(", ")}`).join(" · ")} — las otras ${activeScreens.length - withDeal} entran como pauta comercial.`;

  function applyGlobalDeal(deal: CampaignDeal) {
    setGlobalDeal(deal);
    setRows((prev) =>
      Object.fromEntries(
        board.screens.map((s) => [s.id, { ...(prev[s.id] ?? EMPTY_ORDER_ROW), deal }]),
      ),
    );
  }

  function applyToAll(spots: number) {
    setRows((prev) =>
      Object.fromEntries(
        board.screens.map((s) => [s.id, { ...(prev[s.id] ?? EMPTY_ORDER_ROW), spots }]),
      ),
    );
  }

  async function handleFile(file: File) {
    setReading(true);
    setNotice({ tone: "info", text: `Leyendo ${file.name}…` });
    try {
      const order = await readOrderFile(file, board.screens);
      const nextStart = order.startDate ?? startDate;
      const nextEnd = order.endDate ?? endDate;
      if (order.client) setClient(order.client);
      if (order.campaign) setCampaign(order.campaign);
      setStartDate(nextStart);
      setEndDate(nextEnd);
      setNotes(
        [
          order.agency && `Agencia: ${order.agency}`,
          order.executive && `Ejecutivo: ${order.executive}`,
          order.artFormat && `Arte: ${order.artFormat}`,
          `OP: ${file.name}`,
        ]
          .filter(Boolean)
          .join(" · "),
      );

      const orderDays = billingDays(nextStart, nextEnd);
      const nextRows: Record<string, OrderRowState> = {};
      const conflicts: string[] = [];
      let withValues = 0;
      let sum = 0;
      for (const item of order.screens) {
        const row: OrderRowState = {
          ...EMPTY_ORDER_ROW,
          deal: globalDeal,
          spots: item.spotsPerDay,
        };
        if (item.monthlyValue !== null && item.monthlyValue >= 0) {
          row.monthly = String(Number(item.monthlyValue.toFixed(2)));
          withValues++;
          sum += item.monthlyValue;
        }
        if (item.spotValue !== null && item.monthlyValue !== null) {
          const spotsInPeriod = item.spotsPerDay * orderDays;
          const exact = spotsInPeriod > 0 ? item.monthlyValue / spotsInPeriod : null;
          if (exact === null || Math.abs(exact - item.spotValue) > 0.005) {
            row.spotInput = String(Number(item.spotValue.toFixed(4)));
            row.spotTouched = true;
            const name = board.screens.find((s) => s.id === item.screenId)?.name ?? "";
            conflicts.push(
              `${name}: la OP dice $${item.spotValue.toFixed(2)} por spot` +
                (exact !== null
                  ? `, pero ${formatMoney(item.monthlyValue)} ÷ ${formatCount(spotsInPeriod)} spots da $${exact.toFixed(4)}`
                  : ""),
            );
          }
        }
        nextRows[item.screenId] = row;
      }
      setRows(nextRows);

      const orderTotal = order.totalValue ?? order.monthlyValue;
      const warnings = [...order.warnings];
      if (withValues && orderTotal !== null && Math.abs(sum - orderTotal) > 0.01) {
        warnings.push(`las pantallas suman ${formatMoney(sum)} y la OP dice ${formatMoney(orderTotal)} de total`);
      }
      if (order.screens.length && !withValues) warnings.push("la OP no trae el valor de las pantallas");
      warnings.push(...conflicts);

      const summary = [
        order.client || "(sin marca)",
        order.campaign,
        order.startDate && `${formatIso(order.startDate)} → ${formatIso(order.endDate)}`,
        `${order.screens.length} ${plural(order.screens.length, "pantalla")}`,
        withValues ? `${formatMoney(sum)} en valores` : "",
      ]
        .filter(Boolean)
        .join(" · ");
      setNotice(
        warnings.length
          ? { tone: "bad", text: `${summary} — revisa: ${warnings.join("; ")}` }
          : { tone: "ok", text: `${summary} — revisa y guarda` },
      );
    } catch (err) {
      setNotice({
        tone: "bad",
        text: `No pude leer el archivo: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setReading(false);
    }
  }

  function submit() {
    const name = client.trim();
    if (!name) {
      toast.error("Falta el nombre del cliente");
      return;
    }
    if (!activeScreens.length) {
      toast.error("Pon los spots de al menos una pantalla");
      return;
    }
    const input: IngestOrderInput = {
      client: name,
      campaign: campaign.trim(),
      startDate,
      endDate,
      notes: notes.trim(),
      art,
      refDate,
      screens: activeScreens.map((s) => {
        const row = rowOf(s.id);
        return {
          screenId: s.id,
          spotsPerDay: row.spots,
          monthlyValue: parseAmount(row.monthly),
          spotValue: row.spotTouched ? parseAmount(row.spotInput) : autoSpotOf(row),
          deal: row.deal !== "COMMERCIAL" ? row.deal : globalDeal,
        };
      }),
    };
    const callbacks = {
      onSuccess: ({ results }: { results: PlacementResult[] }) => {
        onDone();
        const placed = results.filter((r) => r.placed);
        const repeated = results.length - placed.length;
        const created = placed.filter((r) => r.newSublist).length;
        let message = `OP de ${name} en ${placed.length} ${plural(placed.length, "pantalla")}`;
        if (created) message += ` · ${created} ${plural(created, "sublista nueva", "sublistas nuevas")}`;
        if (repeated) message += ` · ${repeated} ya la tenía`;
        toast.success(message);
        const expand = placed.filter((r) => r.needsMoreHours).map((r) => r.screenName);
        if (expand.length) {
          toast.warning("La OP entró, pero estas pantallas se quedaron sin horas suficientes", {
            description: `${expand.join(", ")}. Abre cada una y aplica la sugerencia de horario.`,
            duration: Infinity,
            closeButton: true,
          });
        }
      },
      onError: (err: Error) => toast.error(err.message),
    };
    if (order) ingestDigitalOrder.mutate({ id: order.id, ...input }, callbacks);
    else ingestOrder.mutate(input, callbacks);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{order ? `Ingresar OP ${order.code}` : "Ingresar OP"}</DialogTitle>
        <DialogDescription>
          {order
            ? "Revisa lo que cargó Soporte Comercial y confirma en qué sublistas queda cada pantalla."
            : "Un cliente repartido en varias pantallas. Se coloca solo en la sublista con el hueco más ajustado y avisa si hay que crear sublistas."}
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        {order ? null : (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed p-3">
            <Button
              type="button"
              sizeVariant="sm"
              icon={FileUp}
              disabled={reading}
              onClick={() => fileRef.current?.click()}
            >
              Cargar desde archivo de OP
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.xlsx,.xlsm"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void handleFile(file);
              }}
            />
            <p className={cn("flex-1 text-xs", NOTICE_CLASS[notice.tone])}>{notice.text}</p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Cliente o marca"
            required
            list={clientsListId}
            placeholder="Ej. SUPER SELECTOS"
            autoComplete="off"
            value={client}
            onChange={(e) => setClient(e.target.value)}
          />
          <datalist id={clientsListId}>
            {clientNames(board).map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <Input
            label="Campaña"
            placeholder="Ej. aniversario"
            autoComplete="off"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
          />
          <DatePicker
            label="Fecha de inicio"
            allowClear
            value={parseIso(startDate)}
            onChange={(d) => setStartDate(d ? localIsoDate(d) : null)}
          />
          <DatePicker
            label="Fecha final"
            allowClear
            value={parseIso(endDate)}
            onChange={(d) => setEndDate(d ? localIsoDate(d) : null)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <OptionButtonGroup
            label="Estado del arte"
            options={ART_OPTIONS.map((value) => ({ value, label: ART_LABELS[value] }))}
            value={art}
            onChange={setArt}
          />
          <p className="text-xs text-muted-foreground">
            Marca &quot;Sin arte&quot; o &quot;Arte en aprobación&quot; si la OP entra solo para
            reservar los spots.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Spots por día en cada pantalla</p>
          <div className="flex flex-col gap-2">
            {board.screens.map((screen) => {
              const row = rowOf(screen.id);
              return (
                <OrderIntakeRow
                  key={screen.id}
                  screen={screen}
                  row={row}
                  autoSpot={autoSpotOf(row)}
                  base={base}
                  settings={board.settings}
                  refDate={refDate}
                  onChange={(patch) => patchRow(screen.id, patch)}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            Aplicar a todas:
            {[...ORDER_SPOT_PRESETS, 0].map((value) => (
              <Button
                key={value}
                type="button"
                variant="outline"
                sizeVariant="sm"
                onClick={() => applyToAll(value)}
              >
                {value ? formatCount(value) : "limpiar"}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <div className="flex justify-between">
            <span>
              {activeScreens.length
                ? `${activeScreens.length} ${plural(activeScreens.length, "pantalla")}${newSublists ? ` · ${newSublists} ${plural(newSublists, "sublista")} por crear` : ""}`
                : "Sin pantallas seleccionadas"}
            </span>
            <b>{formatCount(totalSpots)} spots</b>
          </div>
          <div className="flex justify-between">
            <span>Valor total de la OP</span>
            <b>{monthlyValues.length ? formatMoney(totalValue) : "$0.00"}</b>
          </div>
          <p className="text-xs text-muted-foreground">
            {monthlyValues.length
              ? `${monthlyValues.length} ${plural(monthlyValues.length, "pantalla")} con valor${withoutValue ? ` · ${withoutValue} sin valor` : ""}${handTyped ? ` · ${handTyped} con el valor por spot escrito a mano` : ""} · el valor por spot se calcula con el precio entre los spots de la vigencia (${formatCount(days)} días)`
              : "Escribe el valor mensual de cada pantalla arriba. El valor por spot se calcula solo, y también lo puedes escribir tú."}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <OptionButtonGroup
            label="Donación o canje · aplica a todas las pantallas"
            options={DEAL_OPTIONS.map((value) => ({ value, label: DEAL_LABELS[value] }))}
            value={globalDeal}
            onChange={applyGlobalDeal}
          />
          <p className="text-xs text-muted-foreground">
            Elige aquí y se pone en todas. Si solo una pantalla va bonificada o donada, déjalo en{" "}
            <b>No aplica</b> y márcala arriba, en su propia fila.
          </p>
          {dealHint ? <p className="text-xs font-medium">{dealHint}</p> : null}
        </div>

        <Input
          label="Notas"
          placeholder="Opcional"
          autoComplete="off"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={isPending}>
          Cancelar
        </Button>
        <Button onClick={submit} disabled={isPending || reading}>
          {isPending ? "Ingresando…" : order ? "Ingresar a las listas" : "Ingresar OP"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function OrderIntakeDialog({
  open,
  onClose,
  board,
  refDate,
  order = null,
}: {
  open: boolean;
  onClose: () => void;
  board: PantallasBoard;
  refDate: string;
  order?: DigitalOrder | null;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="xl">
        <OrderIntakeForm
          key={order?.id ?? "manual"}
          board={board}
          refDate={refDate}
          order={order}
          onDone={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
