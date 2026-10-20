"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { useCreateDigitalOrder, useUpdateDigitalOrder } from "@/api/pantallas/pantallas.mutations";
import type {
  DigitalOrder,
  OrderArtFormat,
  PantallasBoard,
  SaveOrderInput,
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
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { orderIntakeInitial } from "../pantallas/order-intake-initial";
import { EMPTY_ORDER_ROW, type OrderRowState } from "../pantallas/order-intake-row";
import { OptionButtonGroup } from "../pantallas/option-button-group";
import { ART_FORMAT_LABELS, ART_FORMAT_OPTIONS } from "../pantallas/pantallas-const";
import { localIsoDate, parseAmount, parseIso, todayIso } from "../pantallas/pantallas-format";
import { clientNames, exactSpotValue } from "../pantallas/pantallas-logic";
import { OrderLinksField } from "./order-links-field";
import { OrderSaveScreens } from "./order-save-screens";
import { draftTotals, normalizeLink, orderLabel } from "./pantallas-orders-logic";

type AgencyChoice = "NO" | "YES";

function SaveForm({
  order,
  orders,
  board,
  refDate,
  onDone,
}: {
  order: DigitalOrder | null;
  orders: DigitalOrder[];
  board: PantallasBoard;
  refDate: string;
  onDone: () => void;
}) {
  const { data: session } = authClient.useSession();
  const createOrder = useCreateDigitalOrder();
  const updateOrder = useUpdateDigitalOrder();
  const listsId = useId();
  const [executive, setExecutive] = useState(order?.executive ?? session?.user?.name ?? "");
  const [entryDate, setEntryDate] = useState<string | null>(order?.entryDate ?? todayIso());
  const [agency, setAgency] = useState<AgencyChoice>(order?.hasAgency ? "YES" : "NO");
  const [agencyName, setAgencyName] = useState(order?.agencyName ?? "");
  const [client, setClient] = useState(order?.client ?? "");
  const [campaign, setCampaign] = useState(order?.campaign ?? "");
  const [artFormat, setArtFormat] = useState<OrderArtFormat>(order?.artFormat ?? "ANIMATED");
  const [startDate, setStartDate] = useState<string | null>(order?.startDate ?? null);
  const [endDate, setEndDate] = useState<string | null>(order?.endDate ?? null);
  const [rows, setRows] = useState<Record<string, OrderRowState>>(() =>
    order ? orderIntakeInitial(order).rows : {},
  );
  const [monthlyOverride, setMonthlyOverride] = useState(() =>
    order && Math.abs(order.monthlyValue - order.totalValue) > 0.004
      ? String(order.monthlyValue)
      : "",
  );
  const [links, setLinks] = useState(() => (order?.links.length ? order.links : [""]));
  const [instructions, setInstructions] = useState(order?.instructions ?? "");
  const isPending = createOrder.isPending || updateOrder.isPending;

  const totals = draftTotals(board.screens, rows, startDate, endDate);
  const base = { client: client.trim(), campaign: campaign.trim(), startDate, endDate };
  const executives = [...new Set(orders.map((o) => o.executive).filter(Boolean))];
  const agencies = [...new Set(orders.map((o) => o.agencyName).filter(Boolean))] as string[];

  const patchRow = (id: string, patch: Partial<OrderRowState>) =>
    setRows((prev) => ({ ...prev, [id]: { ...(prev[id] ?? EMPTY_ORDER_ROW), ...patch } }));
  const applyToAll = (spots: number) =>
    setRows((prev) =>
      Object.fromEntries(
        board.screens.map((s) => [s.id, { ...(prev[s.id] ?? EMPTY_ORDER_ROW), spots }]),
      ),
    );

  function submit() {
    const fail = (message: string) => toast.error(message);
    if (!executive.trim()) return fail("Falta el nombre del ejecutivo/a");
    if (!client.trim()) return fail("Falta la marca");
    if (!startDate || !endDate) return fail("Faltan las fechas de la vigencia");
    if (startDate > endDate) return fail("La fecha de inicio va después de la final");
    if (agency === "YES" && !agencyName.trim()) return fail("Falta el nombre de la agencia");
    if (!totals.active.length) return fail("Elige al menos una pantalla con sus spots por día");

    const withoutValue = totals.active.filter(
      (s) => parseAmount(rows[s.id].monthly) === null && rows[s.id].deal === "COMMERCIAL",
    );
    if (withoutValue.length) {
      return fail(
        `Falta el valor de: ${withoutValue.map((s) => s.name).join(", ")}. Si no se cobra, elige su modalidad.`,
      );
    }

    const normalizedLinks: string[] = [];
    for (const link of links) {
      const url = normalizeLink(link);
      if (url === null) return fail(`Ese enlace no se ve bien: "${link.trim()}". Pega la dirección completa.`);
      if (url) normalizedLinks.push(url);
    }

    const input: SaveOrderInput = {
      executive: executive.trim(),
      entryDate: entryDate ?? todayIso(),
      hasAgency: agency === "YES",
      agencyName: agencyName.trim(),
      client: client.trim(),
      campaign: campaign.trim(),
      artFormat,
      startDate,
      endDate,
      links: normalizedLinks,
      instructions: instructions.trim(),
      monthlyValue: parseAmount(monthlyOverride),
      screens: totals.active.map((s) => {
        const row = rows[s.id];
        return {
          screenId: s.id,
          spotsPerDay: row.spots,
          monthlyValue: parseAmount(row.monthly),
          spotValue: row.spotTouched
            ? parseAmount(row.spotInput)
            : exactSpotValue(parseAmount(row.monthly), row.spots, startDate, endDate),
          spotValueManual: row.spotTouched,
          deal: row.deal,
        };
      }),
    };

    const callbacks = {
      onSuccess: (saved: DigitalOrder) => {
        onDone();
        toast.success(
          order
            ? `OP ${saved.code} reenviada a Producción`
            : `OP ${saved.code} creada · ya le aparece a Producción`,
        );
      },
      onError: (err: Error) => toast.error(err.message),
    };
    if (order) updateOrder.mutate({ id: order.id, ...input }, callbacks);
    else createOrder.mutate(input, callbacks);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{order ? "Corregir y reenviar OP" : "Crear nueva OP"}</DialogTitle>
        <DialogDescription>
          {order
            ? `${orderLabel(order)} · se reenvía con los cambios`
            : "Con los mismos campos de la plantilla de comercial. Producción la revisa y la ingresa a las listas."}
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <datalist id={`${listsId}-executives`}>
          {executives.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <datalist id={`${listsId}-agencies`}>
          {agencies.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <datalist id={`${listsId}-clients`}>
          {clientNames(board).map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Datos comerciales
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Ejecutivo/a"
            required
            list={`${listsId}-executives`}
            autoComplete="off"
            value={executive}
            onChange={(e) => setExecutive(e.target.value)}
          />
          <DatePicker
            label="Fecha de ingreso"
            value={parseIso(entryDate)}
            onChange={(d) => setEntryDate(d ? localIsoDate(d) : null)}
          />
          <OptionButtonGroup<AgencyChoice>
            label="Agencia"
            options={[
              { value: "NO", label: "No" },
              { value: "YES", label: "Sí" },
            ]}
            value={agency}
            onChange={setAgency}
          />
          <Input
            label="Nombre de agencia"
            list={`${listsId}-agencies`}
            autoComplete="off"
            placeholder="Ej. PHD NETWORK DE APEX"
            disabled={agency !== "YES"}
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
          />
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Campaña
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Marca"
            required
            list={`${listsId}-clients`}
            autoComplete="off"
            placeholder="Ej. SUPER SELECTOS"
            value={client}
            onChange={(e) => setClient(e.target.value)}
          />
          <Input
            label="Campaña"
            autoComplete="off"
            placeholder="Ej. ANIVERSARIO 75"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
          />
          <OptionButtonGroup
            label="Formato de arte"
            options={ART_FORMAT_OPTIONS.map((value) => ({ value, label: ART_FORMAT_LABELS[value] }))}
            value={artFormat}
            onChange={setArtFormat}
          />
          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Vigencia · inicio"
              value={parseIso(startDate)}
              onChange={(d) => setStartDate(d ? localIsoDate(d) : null)}
            />
            <DatePicker
              label="Vigencia · fin"
              value={parseIso(endDate)}
              onChange={(d) => setEndDate(d ? localIsoDate(d) : null)}
            />
          </div>
        </div>

        <OrderSaveScreens
          board={board}
          refDate={refDate}
          rows={rows}
          base={base}
          startDate={startDate}
          endDate={endDate}
          totals={totals}
          monthlyOverride={monthlyOverride}
          onMonthlyOverrideChange={setMonthlyOverride}
          onPatchRow={patchRow}
          onApplyToAll={applyToAll}
        />

        <OrderLinksField links={links} onChange={setLinks} />
        <Textarea
          label="Indicaciones especiales"
          rows={3}
          maxLength={900}
          placeholder="Opcional"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={isPending}>
          Cancelar
        </Button>
        <Button onClick={submit} disabled={isPending}>
          {isPending ? "Guardando…" : order ? "Reenviar OP" : "Crear OP"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function OrderSaveDialog({
  open,
  order,
  orders,
  board,
  refDate,
  onClose,
}: {
  open: boolean;
  order: DigitalOrder | null;
  orders: DigitalOrder[];
  board: PantallasBoard;
  refDate: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="xl">
        <SaveForm
          key={order?.id ?? "new"}
          order={order}
          orders={orders}
          board={board}
          refDate={refDate}
          onDone={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
