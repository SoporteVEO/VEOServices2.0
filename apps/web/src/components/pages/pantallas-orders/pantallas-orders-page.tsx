"use client";

import { useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { usePantallasBoard, usePantallasOrders } from "@/api/pantallas/pantallas.get";
import type { DigitalOrder } from "@/api/pantallas/pantallas.types";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Button } from "@/components/ui/button";
import { OrderIntakeDialog } from "../pantallas/order-intake-dialog";
import { formatCount, plural, todayIso } from "../pantallas/pantallas-format";
import { usePantallasAccess } from "../pantallas/use-pantallas-access";
import { OptionButtonGroup } from "../pantallas/option-button-group";
import { OrderCard } from "./order-card";
import { OrderReturnDialog } from "./order-return-dialog";
import { OrderSaveDialog } from "./order-save-dialog";
import {
  ORDER_FILTERS,
  countOrders,
  filterOrders,
  type OrderFilter,
} from "./pantallas-orders-logic";

type DialogState =
  | { type: "save"; order: DigitalOrder | null }
  | { type: "ingest"; order: DigitalOrder }
  | { type: "return"; order: DigitalOrder }
  | null;

const EMPTY_MESSAGES: Record<OrderFilter, string> = {
  PENDING: "No hay OP por revisar. Cuando Soporte Comercial cree una, aparece aquí.",
  RETURNED: "No hay OP devueltas a Soporte Comercial.",
  INGESTED: "Todavía no se ha ingresado ninguna OP desde aquí.",
  ALL: "Todavía no hay OP creadas.",
};

function PageSkeleton() {
  return (
    <section
      role="status"
      aria-label="Cargando OP…"
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-10" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-52" />
        </div>
      </div>
      <Skeleton className="h-8 w-96 max-w-full" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 border border-border/80 bg-card px-4 py-4">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-72" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function PantallasOrdersPage() {
  const { data: board, isLoading: boardLoading, error: boardError } = usePantallasBoard();
  const { data: orders, isLoading: ordersLoading, error: ordersError } = usePantallasOrders();
  const { canEdit, canRequest } = usePantallasAccess();
  const [filter, setFilter] = useState<OrderFilter | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const refDate = todayIso();

  if (boardLoading || ordersLoading) return <PageSkeleton />;

  const error = boardError ?? ordersError;
  if (error || !board || !orders) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        {error instanceof Error ? error.message : "No se pudieron cargar las OP."}
      </p>
    );
  }

  const activeFilter = filter ?? (canEdit ? "PENDING" : "ALL");
  const visible = filterOrders(orders, activeFilter);
  const pendingCount = countOrders(orders, "PENDING");
  const close = () => setDialog(null);

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardList className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Producción Pantallas</h1>
            <p className="text-xs text-muted-foreground">
              {formatCount(orders.length)} {plural(orders.length, "OP")} creadas por Soporte
              Comercial · {formatCount(pendingCount)} por revisar
              {canEdit ? "" : " · solo lectura"}
            </p>
          </div>
        </div>
        {canRequest ? (
          <Button icon={Plus} onClick={() => setDialog({ type: "save", order: null })}>
            Crear OP
          </Button>
        ) : null}
      </header>

      <div className="flex flex-col gap-1">
        <OptionButtonGroup
          options={ORDER_FILTERS.map(({ value, label }) => ({
            value,
            label: `${label} · ${countOrders(orders, value)}`,
          }))}
          value={activeFilter}
          onChange={setFilter}
        />
        {canEdit ? (
          <p className="text-xs text-muted-foreground">
            Revisa la información y pulsa <b>Ingresar a las listas</b>: se abre la ventana de
            siempre con todo cargado, para ver en qué sublistas queda y confirmar.
          </p>
        ) : null}
      </div>

      {visible.length ? (
        <div className="flex flex-col gap-3">
          {visible.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              board={board}
              refDate={refDate}
              canEdit={canEdit}
              canRequest={canRequest}
              onIngest={(o) => setDialog({ type: "ingest", order: o })}
              onReturn={(o) => setDialog({ type: "return", order: o })}
              onCorrect={(o) => setDialog({ type: "save", order: o })}
            />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {EMPTY_MESSAGES[activeFilter]}
        </p>
      )}

      <OrderSaveDialog
        open={dialog?.type === "save"}
        order={dialog?.type === "save" ? dialog.order : null}
        orders={orders}
        board={board}
        refDate={refDate}
        onClose={close}
      />
      <OrderIntakeDialog
        open={dialog?.type === "ingest"}
        order={dialog?.type === "ingest" ? dialog.order : null}
        board={board}
        refDate={refDate}
        onClose={close}
      />
      <OrderReturnDialog
        order={dialog?.type === "return" ? dialog.order : null}
        onClose={close}
      />
    </section>
  );
}
