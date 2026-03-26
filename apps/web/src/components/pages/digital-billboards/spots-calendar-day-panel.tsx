"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import type { DigitalBillboardSpotUsage } from "@/api/digital-billboards/digital-billboards.spots";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Stats } from "@/components/ui/stats";
import { AddSpotDialog } from "./add-spot-dialog";
import {
  filterUsagesForLocalDay,
  formatPercent,
  spotUsagePercent,
  totalSpotsOnLocalDay,
  uniqueCampaignCount,
} from "./spots-calendar-utils";

type SpotsCalendarDayPanelProps = {
  billboardId: string;
  selectedDay: Date;
  maxSpots: number;
  spotsByDay: Map<string, number>;
  usages: DigitalBillboardSpotUsage[];
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
};

export function SpotsCalendarDayPanel({
  billboardId,
  selectedDay,
  maxSpots,
  spotsByDay,
  usages,
  addOpen,
  onAddOpenChange,
}: SpotsCalendarDayPanelProps) {
  const dayUsages = useMemo(
    () => filterUsagesForLocalDay(usages, selectedDay),
    [usages, selectedDay],
  );
  const dayTotal = totalSpotsOnLocalDay(spotsByDay, selectedDay);
  const dayPct = spotUsagePercent(dayTotal, maxSpots);
  const dayCampaigns = uniqueCampaignCount(dayUsages);

  const dayStatItems = useMemo(
    () => [
      {
        label: "Spots del día",
        value: `${dayTotal.toLocaleString()} / ${maxSpots.toLocaleString()}`,
        description: "Usados / cupo diario",
      },
      {
        label: "% Uso del día",
        value: formatPercent(dayPct),
        description:
          maxSpots > 0
            ? `Sobre ${maxSpots.toLocaleString()} spots disponibles`
            : undefined,
      },
      {
        label: "Campañas (día)",
        value: dayCampaigns.toLocaleString(),
        description: "Campañas distintas registradas",
      },
    ],
    [dayCampaigns, dayPct, dayTotal, maxSpots],
  );

  const columns = useMemo<ColumnDef<DigitalBillboardSpotUsage>[]>(
    () => [
      {
        id: "campaign",
        header: "Campaña",
        cell: ({ row }) => (
          <span className="block max-w-[min(100%,280px)] truncate">
            {row.original.campaignName ?? "Sin campaña"}
          </span>
        ),
      },
      {
        accessorKey: "duration",
        header: () => <span className="block">Spots</span>,
        cell: ({ row }) => (
          <span className="block tabular-nums">{row.original.duration}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          {format(selectedDay, "EEEE d 'de' MMMM yyyy", { locale: es })}
        </h3>
        <Button size="sm" onClick={() => onAddOpenChange(true)}>
          Agregar uso
        </Button>
      </div>

      <Stats items={dayStatItems} columnsClassName="sm:grid-cols-3" />

      <div className="rounded-lg border">
        <DataTable
          columns={columns}
          data={dayUsages}
          rowSize="sm"
          skeletonRowCount={4}
        />
      </div>

      <AddSpotDialog
        open={addOpen}
        onOpenChange={onAddOpenChange}
        billboardId={billboardId}
        selectedDay={selectedDay}
        maxSpots={maxSpots}
      />
    </div>
  );
}
