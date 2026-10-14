"use client";

import { AttentionSection } from "./attention-section";
import { usePantallas } from "./pantallas-context";
import { ScreenSummaryCard } from "./screen-summary-card";
import { SectionHeading } from "./section-heading";
import { StatusLegend } from "./status-legend";
import { SummaryKpis } from "./summary-kpis";

export function PantallasSummary() {
  const { board, canEdit } = usePantallas();

  return (
    <div className="flex flex-col gap-6">
      <SummaryKpis />
      {canEdit ? <AttentionSection /> : null}
      <div className="flex flex-col gap-3">
        <SectionHeading title="Pantallas" />
        {board.screens.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {board.screens.map((screen) => (
              <ScreenSummaryCard key={screen.id} screen={screen} />
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Todavía no hay pantallas registradas.
          </p>
        )}
        <StatusLegend />
      </div>
    </div>
  );
}
