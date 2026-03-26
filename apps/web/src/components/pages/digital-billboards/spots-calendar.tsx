"use client";

import { useMemo, useState } from "react";
import { startOfMonth, endOfMonth } from "date-fns";
import { useDigitalBillboardSpots } from "@/api/digital-billboards/digital-billboards.spots";
import { Stats } from "@/components/ui/stats";
import { SpotsCalendarDayPanel } from "./spots-calendar-day-panel";
import { SpotsCalendarGrid } from "./spots-calendar-grid";
import {
  aggregateSpotsByLocalDay,
  formatPercent,
  monthSpotsCapacity,
  spotUsagePercent,
  sumSpotDurations,
  uniqueCampaignCount,
} from "./spots-calendar-utils";

export function SpotsCalendar({
  billboardId,
  maxSpots,
}: {
  billboardId: string;
  maxSpots: number;
}) {
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const from = startOfMonth(month).toISOString();
  const to = endOfMonth(month).toISOString();

  const { data: usages = [] } = useDigitalBillboardSpots({
    billboardId,
    from,
    to,
  });

  const spotsByDay = useMemo(
    () => aggregateSpotsByLocalDay(usages),
    [usages],
  );

  const monthStats = useMemo(() => {
    const used = sumSpotDurations(usages);
    const capacity = monthSpotsCapacity(maxSpots, month);
    const pct = spotUsagePercent(used, capacity);
    const campaigns = uniqueCampaignCount(usages);
    return { used, capacity, pct, campaigns };
  }, [usages, maxSpots, month]);

  const monthStatItems = useMemo(
    () => [
      {
        label: "% Uso vs cupo del mes",
        value: formatPercent(monthStats.pct),
        description:
          monthStats.capacity > 0
            ? `${monthStats.used.toLocaleString()} / ${monthStats.capacity.toLocaleString()} spots disponibles`
            : undefined,
      },
      {
        label: "Campañas únicas",
        value: monthStats.campaigns.toLocaleString(),
        description: "En el mes visible",
      },
      {
        label: "Spots usados (mes)",
        value: monthStats.used.toLocaleString(),
        description: "Suma de duraciones registradas",
      },
    ],
    [monthStats],
  );

  return (
    <section className="flex flex-col gap-6">
      <Stats items={monthStatItems} />

      <div className="flex flex-row gap-6">
        <SpotsCalendarGrid
          month={month}
          onMonthChange={setMonth}
          spotsByDay={spotsByDay}
          maxSpots={maxSpots}
          onDaySelect={setSelectedDay}
        />

        <div className="min-w-0 flex-1">
          {selectedDay ? (
            <SpotsCalendarDayPanel
              billboardId={billboardId}
              selectedDay={selectedDay}
              maxSpots={maxSpots}
              spotsByDay={spotsByDay}
              usages={usages}
              addOpen={addOpen}
              onAddOpenChange={setAddOpen}
            />
          ) : (
            <p className="text-muted-foreground">
              Selecciona un día del calendario para ver los usos.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
