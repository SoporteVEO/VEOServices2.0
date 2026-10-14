import { cn } from "@/lib/utils";
import { ALERT_DAYS, TONE_DOT_CLASS, type StatusTone } from "./pantallas-const";

const ITEMS: { tone: StatusTone; label: string }[] = [
  { tone: "good", label: "Activa" },
  { tone: "warning", label: `Por vencer (≤${ALERT_DAYS} días)` },
  { tone: "critical", label: "Finalizada" },
  { tone: "paused", label: "Pausada" },
  { tone: "accent", label: "Programada" },
  { tone: "muted", label: "Sin fechas" },
];

export function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground">
      {ITEMS.map((item) => (
        <span key={item.tone} className="inline-flex items-center gap-1.5">
          <span className={cn("size-2", TONE_DOT_CLASS[item.tone])} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
