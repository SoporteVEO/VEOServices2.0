"use client";

import type { ReactNode } from "react";
import { CalendarClock, Monitor, User as UserIcon, X } from "lucide-react";
import { useProductionOrder } from "@/api/production-orders/production-orders.get";
import type {
  ProductionOrder,
  ProductionOrderItem,
} from "@/api/production-orders/production-orders.types";
import { useMySpaceViewAs } from "./my-space-view-as-context";
import { Badge } from "@/components/primitives/ui/badge";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { Separator } from "@/components/primitives/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatBriloShortDate, formatDimensions } from "@/lib/format";
import { ProductionOrderDocumentSlot } from "@/components/pages/production-orders-shared/production-order-document-slot";
import { ProductionOrderStatusBadge } from "@/components/pages/production-orders-shared/production-order-status-badge";

type Props = {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly: boolean;
};

export function MyProductionOrderDetailDrawer({
  orderId,
  open,
  onOpenChange,
  readOnly,
}: Props) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      handleOnly
    >
      <DrawerContent className="flex flex-col data-[vaul-drawer-direction=right]:h-screen data-[vaul-drawer-direction=right]:w-[92vw] data-[vaul-drawer-direction=right]:sm:max-w-[900px]">
        {orderId ? (
          <DrawerBody
            key={orderId}
            orderId={orderId}
            onClose={() => onOpenChange(false)}
            readOnly={readOnly}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function DrawerBody({
  orderId,
  onClose,
  readOnly,
}: {
  orderId: string;
  onClose: () => void;
  readOnly: boolean;
}) {
  const { viewAsUserId } = useMySpaceViewAs();
  const { data, isLoading, isError } = useProductionOrder(orderId, {
    viewAsUserId,
  });

  if (isLoading || !data) {
    return (
      <>
        <DrawerHeader className="border-b">
          <DrawerTitle>Cargando orden…</DrawerTitle>
          <DrawerDescription>
            {isError
              ? "No se pudo cargar la orden de producción."
              : "Preparando los detalles."}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1" />
        <DrawerFooter className="border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DrawerFooter>
      </>
    );
  }

  return <DrawerContentInner order={data} onClose={onClose} readOnly={readOnly} />;
}

function DrawerContentInner({
  order,
  onClose,
  readOnly,
}: {
  order: ProductionOrder;
  onClose: () => void;
  readOnly: boolean;
}) {
  return (
    <>
      <DrawerHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <DrawerTitle className="truncate text-base font-semibold">
              Orden {order.offerNumber}
            </DrawerTitle>
            <DrawerDescription className="flex items-center gap-1.5 text-xs">
              <CalendarClock className="size-3 shrink-0" />
              <span className="truncate">
                Creada el {formatBriloShortDate(order.createdAt)}
              </span>
            </DrawerDescription>
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
              <ProductionOrderStatusBadge status={order.aggregateStatus} />
              <Badge variant="secondary" className="gap-1">
                <Monitor className="size-3" aria-hidden />
                {order.itemCount}
              </Badge>
            </div>
          </div>
          <PrimitiveButton
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X />
          </PrimitiveButton>
        </div>
      </DrawerHeader>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex min-w-0 flex-col gap-6 p-4">
          <section className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <InfoCard label="Cliente" value={order.customerName} />
            <InfoCard label="Empresa" value={order.customerCompany} />
            <InfoCard
              icon={UserIcon}
              label="Asesor"
              value={order.advisorFullName}
            />
          </section>

          <Separator />

          <section className="space-y-3">
            <header className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold leading-none">
                  Vallas estáticas
                </h3>
                <p className="pt-1 text-xs text-muted-foreground">
                  Carga la orden de producción y la orden de diseño para cada
                  valla. El estado lo actualiza el equipo de producción.
                </p>
              </div>
            </header>

            <div className="flex flex-col gap-3">
              {order.items.map((item) => (
                <ItemCard key={item.id} item={item} readOnly={readOnly} />
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>

      <DrawerFooter className="border-t">
        <div className="flex w-full items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DrawerFooter>
    </>
  );
}

function ItemCard({
  item,
  readOnly,
}: {
  item: ProductionOrderItem;
  readOnly: boolean;
}) {
  const location =
    [item.address, item.cityName, item.departmentName]
      .filter(Boolean)
      .join(", ") || "Sin dirección";

  return (
    <div className="flex flex-col gap-3 rounded-md border bg-card p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {item.billboardCode ?? "—"}
            </Badge>
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatDimensions(item.width, item.height)}
            </span>
          </div>
          <p className="line-clamp-2 text-xs text-foreground/90">{location}</p>
        </div>
        <ProductionOrderStatusBadge status={item.status} />
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <ProductionOrderDocumentSlot
          itemId={item.id}
          kind="PRODUCTION"
          title="Orden de producción"
          hasDocument={item.hasProductionDocument}
          readOnly={readOnly}
        />
        <ProductionOrderDocumentSlot
          itemId={item.id}
          kind="DESIGN"
          title="Orden de diseño"
          hasDocument={item.hasDesignDocument}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ComponentType<{ className?: string }>;
}): ReactNode {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-md border bg-accent/10 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        {Icon ? <Icon className="size-3 shrink-0" /> : null}
        <span className="truncate">{label}</span>
      </div>
      <span
        className="truncate text-sm font-medium text-foreground"
        title={value ?? undefined}
      >
        {value && value.trim().length > 0 ? value : "—"}
      </span>
    </div>
  );
}
