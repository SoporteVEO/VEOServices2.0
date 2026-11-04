"use client";

import { Crosshair, ExternalLink, Footprints, ImageOff, X } from "lucide-react";
import { getBillboardImageUrl } from "@/api/billboards/billboards.get";
import { useExpansionBillboard } from "@/api/expansion/expansion.get";
import type { ExpansionBillboard, ExpansionBillboardDetail } from "@/api/expansion/expansion.types";
import { formatLabel } from "@/components/pages/crm/inventory/inventory-format";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import type { ChartConfig } from "@/components/primitives/ui/chart";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { BarChart } from "@/components/ui/bar-chart";
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
import { formatBriloShortDate, formatDimensions, formatMoney } from "@/lib/format";
import { googleMapsUrl } from "@/lib/installer-portal";
import { cn } from "@/lib/utils";
import { TIER_META, formatPercent, streetViewUrl } from "../expansion-const";
import { BasisHint, ScoreBar, TierBadge } from "../expansion-badges";
import { ExpansionBillboardCostForm } from "./expansion-billboard-cost-form";

const MONTH_FORMAT = new Intl.DateTimeFormat("es", { month: "short", year: "2-digit", timeZone: "UTC" });

const CHART_CONFIG = {
  occupancy: { label: "Ocupación", color: "var(--chart-2)" },
} satisfies ChartConfig;

type Props = {
  billboardId: number | null;
  year: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocate: (billboard: ExpansionBillboard) => void;
};

export function ExpansionBillboardDrawer({ billboardId, year, open, onOpenChange, onLocate }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right" handleOnly>
      <DrawerContent className="flex flex-col data-[vaul-drawer-direction=right]:h-screen data-[vaul-drawer-direction=right]:w-[92vw] data-[vaul-drawer-direction=right]:sm:max-w-[640px]">
        {billboardId != null ? (
          <DrawerBody
            key={billboardId}
            billboardId={billboardId}
            year={year}
            onClose={() => onOpenChange(false)}
            onLocate={onLocate}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function DrawerBody({
  billboardId,
  year,
  onClose,
  onLocate,
}: {
  billboardId: number;
  year: number | null;
  onClose: () => void;
  onLocate: (billboard: ExpansionBillboard) => void;
}) {
  const { data, isLoading, isError } = useExpansionBillboard(billboardId, year);

  if (isLoading) return <DetailPanelSkeleton sections={3} />;

  if (isError || !data) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">No pudimos cargar esta valla.</p>
      </div>
    );
  }

  const { billboard } = data;
  const mapsUrl = googleMapsUrl(billboard.latitude, billboard.longitude, billboard.address);

  return (
    <>
      <DrawerHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <DrawerTitle className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm">{billboard.code}</span>
              <TierBadge tier={billboard.tier} score={billboard.score} />
            </DrawerTitle>
            <DrawerDescription className="truncate">
              {formatLabel({ kind: "STATIC", ...billboard })} ·{" "}
              {formatDimensions(billboard.width, billboard.height)} m
              {billboard.cityName ? ` · ${billboard.cityName}` : ""}
            </DrawerDescription>
          </div>
          <PrimitiveButton variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="size-4" />
          </PrimitiveButton>
        </div>
      </DrawerHeader>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 p-4">
          <Photo imageId={data.photoImageId} alt={billboard.code} />
          {billboard.address ? <p className="text-sm">{billboard.address}</p> : null}

          <ProfitabilitySummary detail={data} />
          <ExpansionBillboardCostForm
            key={`${billboard.billboardId}-${billboard.monthlyCost}-${billboard.costNotes}`}
            billboard={billboard}
          />
          <OccupancyChart detail={data} />
          <ContractsList detail={data} />
        </div>
      </ScrollArea>

      <DrawerFooter className="flex-row flex-wrap justify-end border-t">
        {mapsUrl ? (
          <Button variant="outline" icon={ExternalLink} onClick={() => window.open(mapsUrl, "_blank", "noopener")}>
            Google Maps
          </Button>
        ) : null}
        {billboard.latitude != null && billboard.longitude != null ? (
          <Button
            variant="outline"
            icon={Footprints}
            onClick={() =>
              window.open(streetViewUrl(billboard.latitude!, billboard.longitude!), "_blank", "noopener")
            }
          >
            Street View
          </Button>
        ) : null}
        <Button icon={Crosshair} onClick={() => onLocate(billboard)}>
          Ver en mapa
        </Button>
      </DrawerFooter>
    </>
  );
}

function Photo({ imageId, alt }: { imageId: number | null; alt: string }) {
  const src = getBillboardImageUrl(imageId);
  if (!src) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground">
        <ImageOff className="size-6" />
        <span className="text-xs">Sin fotografía en Brilo</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="aspect-video w-full rounded-lg border object-cover" />
  );
}

function ProfitabilitySummary({ detail }: { detail: ExpansionBillboardDetail }) {
  const { billboard, period } = detail;
  const color = TIER_META[billboard.tier].color;

  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Rentabilidad · {period.label}</h4>
        <BasisHint basis={billboard.basis} />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-3xl font-semibold tabular-nums" style={{ color }}>
          {billboard.score}
        </span>
        <div className="flex flex-1 flex-col gap-1">
          <ScoreBar value={billboard.score} color={color} />
          <span className="text-xs text-muted-foreground">
            Ocupada {billboard.occupiedMonths.toFixed(1)} de {period.months.toFixed(1)} meses
          </span>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Ocupación" value={formatPercent(billboard.occupancyRate)} />
        <Stat label="Ingresos" value={formatMoney(billboard.revenue)} />
        <Stat label="Costo período" value={formatMoney(billboard.cost)} />
        <Stat
          label="Utilidad"
          value={formatMoney(billboard.profit)}
          tone={billboard.profit == null ? undefined : billboard.profit >= 0 ? "positive" : "negative"}
        />
        <Stat label="ROI" value={billboard.roi != null ? `${billboard.roi.toFixed(2)}x` : "-"} />
        <Stat label="Margen" value={formatPercent(billboard.margin)} />
        <Stat label="Contratos" value={String(billboard.contractsCount)} />
        <Stat label="Clientes" value={String(billboard.customersCount)} />
      </dl>
      <p className="text-xs text-muted-foreground">
        Cliente actual:{" "}
        <span className="font-medium text-foreground">
          {billboard.currentCustomer ?? "Disponible"}
        </span>{" "}
        · Precio de lista {formatMoney(billboard.listPrice)}
      </p>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "truncate text-sm font-semibold tabular-nums",
          tone === "positive" && "text-success",
          tone === "negative" && "text-destructive",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function OccupancyChart({ detail }: { detail: ExpansionBillboardDetail }) {
  const data = detail.months.map((month) => ({
    month: MONTH_FORMAT.format(new Date(`${month.month}-01T00:00:00Z`)),
    occupancy: Math.round(month.occupancy * 100),
    revenue: month.revenue,
  }));

  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-sm font-semibold">Ocupación mensual</h4>
      <BarChart
        config={CHART_CONFIG}
        data={data}
        xKey="month"
        series={[{ dataKey: "occupancy" }]}
        yTickFormatter={(value) => `${value}%`}
        tooltipValueFormatter={(value) => `${value}%`}
        className="h-48 w-full"
      />
    </section>
  );
}

function ContractsList({ detail }: { detail: ExpansionBillboardDetail }) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-sm font-semibold">
        Contratos del período{" "}
        <span className="text-xs font-normal text-muted-foreground">({detail.contracts.length})</span>
      </h4>
      {detail.contracts.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Esta valla no tuvo contratos en el período seleccionado.
        </p>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {detail.contracts.map((contract, index) => (
            <li
              key={`${contract.contractCode}-${contract.startDate}-${index}`}
              className="flex items-center gap-3 px-3 py-2"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">
                  {contract.customerName ?? "Cliente sin nombre"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {contract.contractCode ?? "-"} · {formatBriloShortDate(contract.startDate)} -{" "}
                  {formatBriloShortDate(contract.endDate)}
                </span>
              </div>
              <div className="flex flex-col items-end text-xs tabular-nums">
                <span className="font-medium">{formatMoney(contract.monthlyAmount)}/mes</span>
                <span className="text-muted-foreground">
                  {formatMoney(contract.revenueInPeriod)} en período
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
