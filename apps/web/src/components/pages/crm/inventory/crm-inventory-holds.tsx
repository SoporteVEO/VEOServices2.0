import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { InventoryHold } from "@/api/crm/crm-ooh.types";
import { calendarDate } from "../crm-format";

export function CrmInventoryHolds({ holds }: { holds: InventoryHold[] }) {
  return (
    <div className="flex flex-col gap-0.5 text-[11px]">
      {holds.slice(0, 3).map((hold) => (
        <span key={hold.siteId} className="truncate text-violet-700 dark:text-violet-300">
          {hold.status === "BOOKED" ? "Vendida" : `${hold.rank}ª opción`} · {hold.dealTitle} (
          {hold.ownerName})
          {hold.holdUntil && hold.status === "HELD"
            ? ` · hasta ${format(new Date(hold.holdUntil), "d MMM", { locale: es })}`
            : ""}
          {hold.spotsPerDay ? ` · ${hold.spotsPerDay} spots` : ""}
          {` · ${format(calendarDate(hold.startDate), "d MMM", { locale: es })}–${format(calendarDate(hold.endDate), "d MMM", { locale: es })}`}
        </span>
      ))}
      {holds.length > 3 ? (
        <span className="text-muted-foreground">+{holds.length - 3} más</span>
      ) : null}
    </div>
  );
}
