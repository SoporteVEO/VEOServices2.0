"use client";

import { useMemo } from "react";
import {
  Building2,
  CheckCircle2,
  Copy,
  ExternalLink,
  History,
  MapPin,
  Ruler,
  TrendingUp,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/primitives/ui/button";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Separator } from "@/components/primitives/ui/separator";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { getMapsUrl } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import {
  type AvailableBillboardListing,
  useBillboardContractHistory,
} from "@/api/billboards/billboards.get";
import { BillboardOccupancyChart } from "./billboard-occupancy-chart";
import { BillboardContractsTimeline } from "./billboard-contracts-timeline";
import { BillboardContractsList } from "./billboard-contracts-list";
import { BillboardTopCustomers } from "./billboard-top-customers";
import { BillboardImages } from "./billboard-images";
import { summarizeContracts } from "./billboard-detail-utils";

interface BillboardDetailDrawerProps {
  billboard: AvailableBillboardListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BillboardDetailDrawer({
  billboard,
  open,
  onOpenChange,
}: BillboardDetailDrawerProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      handleOnly
    >
      <DrawerContent className="data-[vaul-drawer-direction=right]:h-screen data-[vaul-drawer-direction=right]:w-[92vw] data-[vaul-drawer-direction=right]:sm:max-w-[1200px]">
        {billboard ? (
          <BillboardDetailDrawerContent billboard={billboard} />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function BillboardDetailDrawerContent({
  billboard,
}: {
  billboard: AvailableBillboardListing;
}) {
  const contractsQuery = useBillboardContractHistory({
    billboardId: billboard.billboardId,
  });

  const contracts = useMemo(
    () => contractsQuery.data ?? [],
    [contractsQuery.data],
  );
  const summary = useMemo(() => summarizeContracts(contracts), [contracts]);

  const location = [billboard.cityName, billboard.departmentName]
    .filter(Boolean)
    .join(", ");

  const mapsUrl = getMapsUrl(billboard.latitude, billboard.longitude);

  function handleCopyCode() {
    if (!billboard.billboardCode) return;
    void navigator.clipboard.writeText(billboard.billboardCode);
    toast.success("Código copiado al portapapeles");
  }

  return (
    <>
      <DrawerHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              <DrawerTitle className="font-semibold text-base">
                {billboard.billboardCode ?? "Sin código"}
              </DrawerTitle>
              <BillboardStatusBadge isAvailable={billboard.isAvailable} />
              {billboard.availableDiscount != null &&
                billboard.availableDiscount > 0 && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent">
                    -{billboard.availableDiscount}%
                  </Badge>
                )}
            </div>
            <DrawerDescription className="flex items-center gap-1.5 text-xs">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">
                {[location, billboard.address].filter(Boolean).join(" · ") ||
                  "Sin ubicación"}
              </span>
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon-sm">
              <X />
              <span className="sr-only">Cerrar</span>
            </Button>
          </DrawerClose>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {billboard.billboardCode && (
            <Button variant="outline" size="xs" onClick={handleCopyCode}>
              <Copy />
              Copiar código
            </Button>
          )}
          {mapsUrl && (
            <Button variant="outline" size="xs" asChild>
              <a href={mapsUrl} target="_blank" rel="noreferrer">
                <ExternalLink />
                Ver en mapa
              </a>
            </Button>
          )}
          {billboard.reference && (
            <Badge variant="outline" className="font-normal">
              {billboard.reference}
            </Badge>
          )}
        </div>
      </DrawerHeader>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-4">
          <KeyMetricsRow
            billboard={billboard}
            contractsCount={summary.totalContracts}
            totalRevenue={summary.totalRevenue}
            uniqueCustomers={summary.uniqueCustomers}
          />

          <Separator />

          {contractsQuery.isLoading ? (
            <DetailSkeletons />
          ) : (
            <>
              <BillboardOccupancyChart contracts={contracts} />
              <BillboardContractsTimeline contracts={contracts} />
              <div className="grid gap-4 lg:grid-cols-2">
                <BillboardContractsList contracts={contracts} />
                <BillboardTopCustomers contracts={contracts} />
              </div>
            </>
          )}

          <BillboardImages
            billboardId={billboard.billboardId}
            billboardCode={billboard.billboardCode}
          />
        </div>
      </ScrollArea>
    </>
  );
}

function BillboardStatusBadge({ isAvailable }: { isAvailable: boolean }) {
  if (isAvailable) {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent">
        <CheckCircle2 className="size-3" />
        Disponible
      </Badge>
    );
  }
  return (
    <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-transparent">
      <XCircle className="size-3" />
      Ocupada
    </Badge>
  );
}

interface KeyMetricsRowProps {
  billboard: AvailableBillboardListing;
  contractsCount: number;
  totalRevenue: number;
  uniqueCustomers: number;
}

function KeyMetricsRow({
  billboard,
  contractsCount,
  totalRevenue,
  uniqueCustomers,
}: KeyMetricsRowProps) {
  const dimensions =
    billboard.width == null && billboard.height == null
      ? null
      : `${billboard.width ?? "—"} × ${billboard.height ?? "—"}`;

  const items = [
    {
      icon: Wallet,
      label: "Precio",
      value: formatMoney(billboard.price),
      detail:
        billboard.totalPrice != null && billboard.totalPrice !== billboard.price
          ? `Con descuento: ${formatMoney(billboard.totalPrice)}`
          : undefined,
    },
    {
      icon: Ruler,
      label: "Dimensiones",
      value: dimensions ?? "—",
      detail:
        billboard.width != null && billboard.height != null
          ? `${(billboard.width * billboard.height).toFixed(2)} m²`
          : undefined,
    },
    {
      icon: History,
      label: "Contratos totales",
      value: contractsCount.toString(),
      detail:
        uniqueCustomers > 0
          ? `${uniqueCustomers} cliente${uniqueCustomers === 1 ? "" : "s"} únicos`
          : undefined,
    },
    {
      icon: TrendingUp,
      label: "Ingresos históricos",
      value: totalRevenue > 0 ? formatMoney(totalRevenue) : "—",
      detail:
        billboard.monthsWithoutPurchase != null
          ? `${billboard.monthsWithoutPurchase} mes${billboard.monthsWithoutPurchase === 1 ? "" : "es"} sin compra`
          : undefined,
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col gap-1 rounded-md border bg-accent/10 p-2.5"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <item.icon className="size-3" />
            {item.label}
          </div>
          <span className="text-sm font-semibold tabular-nums truncate">
            {item.value}
          </span>
          {item.detail && (
            <span className="text-[11px] text-muted-foreground truncate">
              {item.detail}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function DetailSkeletons() {
  return (
    <>
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-48 w-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </>
  );
}
