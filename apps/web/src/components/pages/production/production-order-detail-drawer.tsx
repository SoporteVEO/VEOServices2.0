"use client";

import { CalendarClock, Monitor, User as UserIcon, X } from "lucide-react";
import { useProductionOrder } from "@/api/production-orders/production-orders.get";
import type {
  ProductionOrder,
  ProductionOrderItem,
} from "@/api/production-orders/production-orders.types";
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
import { DetailPanelSkeleton } from "@/components/ui/skeletons";
import { formatBriloShortDate, formatDimensions } from "@/lib/format";
import { ProductionOrderArtSlot } from "@/components/pages/production-orders-shared/production-order-art-slot";
import { ProductionOrderPrintScheduleCard } from "@/components/pages/production-orders-shared/production-order-print-schedule-card";
import { ProductionOrderLegacyDocuments } from "@/components/pages/production-orders-shared/production-order-legacy-documents";
import { ProductionOrderStatusBadge } from "@/components/pages/production-orders-shared/production-order-status-badge";
import {
  formatCreatorName,
  sortProductionOrderItems,
} from "@/components/pages/production-orders-shared/production-order-utils";
import { ProductionOrderInstallerAssignment } from "./production-order-installer-assignment";
import { ProductionOrderItemStatusSelect } from "./production-order-item-status-select";
import { ProductionOrderQrButton } from "./production-order-qr-button";

type Props = {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductionOrderDetailDrawer({
  orderId,
  open,
  onOpenChange,
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
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function DrawerBody({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useProductionOrder(orderId);

  if (isLoading || !data) {
    return (
      <>
        <DrawerHeader className={isError ? "border-b" : "sr-only"}>
          <DrawerTitle className="sr-only">Cargando orden…</DrawerTitle>
          <DrawerDescription>
            {isError
              ? "No se pudo cargar la orden de producción."
              : "Preparando los detalles."}
          </DrawerDescription>
        </DrawerHeader>
        {isError ? (
          <div className="flex-1" />
        ) : (
          <DetailPanelSkeleton sections={2} withFooter={false} />
        )}
        <DrawerFooter className="border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DrawerFooter>
      </>
    );
  }

  return <DrawerContentInner order={data} onClose={onClose} />;
}

function DrawerContentInner({
  order,
  onClose,
}: {
  order: ProductionOrder;
  onClose: () => void;
}) {
  const campaignLabel = `${order.orderNumber} · ${order.customerCompany ?? order.customerName}`;

  return (
    <>
      <DrawerHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <DrawerTitle className="truncate text-base font-semibold">
              {order.customerCompany ?? order.customerName}
            </DrawerTitle>
            <DrawerDescription className="flex items-center gap-1.5 text-xs">
              <CalendarClock className="size-3 shrink-0" />
              <span className="truncate">
                {order.orderNumber} · Creada el{" "}
                {formatBriloShortDate(order.createdAt)}
              </span>
            </DrawerDescription>
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
              <ProductionOrderStatusBadge status={order.aggregateStatus} />
              <Badge variant="secondary" className="gap-1">
                <Monitor className="size-3" aria-hidden />
                {order.itemCount}
              </Badge>
              {order.isManual ? <Badge variant="outline">Manual</Badge> : null}
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
            {order.isManual ? (
              <InfoCard
                icon={UserIcon}
                label="Creada por"
                value={formatCreatorName(order)}
              />
            ) : (
              <InfoCard
                icon={UserIcon}
                label="Asesor"
                value={order.advisorFullName}
              />
            )}
          </section>

          {order.notes ? (
            <section className="rounded-md border bg-accent/10 p-3">
              <p className="text-[11px] font-medium text-muted-foreground">
                Notas
              </p>
              <p className="whitespace-pre-line pt-1 text-sm">{order.notes}</p>
            </section>
          ) : null}

          <Separator />

          <section className="space-y-3">
            <header>
              <h3 className="text-sm font-semibold leading-none">
                Vallas estáticas
              </h3>
              <p className="pt-1 text-xs text-muted-foreground">
                {order.isManual
                  ? "Actualiza el estado por valla y carga su arte."
                  : "Actualiza el estado por valla y consulta el arte cargado por el vendedor."}
              </p>
            </header>

            <div className="flex flex-col gap-3">
              {sortProductionOrderItems(order.items).map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  campaignLabel={campaignLabel}
                  canEditArt={order.isManual}
                />
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
  campaignLabel,
  canEditArt,
}: {
  item: ProductionOrderItem;
  campaignLabel: string;
  canEditArt: boolean;
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
        <div className="min-w-45">
          <ProductionOrderItemStatusSelect
            itemId={item.id}
            status={item.status}
          />
        </div>
      </div>

      <ProductionOrderPrintScheduleCard item={item} readOnly />
      <ProductionOrderArtSlot
        item={item}
        readOnly={!canEditArt}
        emptyReadOnlyHint="Aún no ha sido cargado por el vendedor."
      />
      <ProductionOrderLegacyDocuments item={item} />

      <Separator />

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            Instalación en sitio
          </p>
          <ProductionOrderQrButton item={item} campaignLabel={campaignLabel} />
        </div>

        <ProductionOrderInstallerAssignment item={item} />

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <Badge
            variant="outline"
            className={
              item.hasVulcanizadoImage
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : undefined
            }
          >
            Vulcanizado {item.hasVulcanizadoImage ? "cargado" : "pendiente"}
          </Badge>
          <Badge
            variant="outline"
            className={
              item.installationImageCount > 0
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : undefined
            }
          >
            {item.installationImageCount} imagen
            {item.installationImageCount === 1 ? "" : "es"} de instalación
          </Badge>
          {item.installedAt ? (
            <span>Instalada el {formatBriloShortDate(item.installedAt)}</span>
          ) : null}
        </div>
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
}) {
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
