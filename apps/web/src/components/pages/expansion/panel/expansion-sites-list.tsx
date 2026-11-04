"use client";

import { useState } from "react";
import { FileText, MapPinPlus, MessageSquare } from "lucide-react";
import type { ExpansionSite, ExpansionSiteStatus } from "@/api/expansion/expansion.types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListSkeleton } from "@/components/ui/skeletons";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SITE_PRIORITY_LABELS, SITE_STATUSES, SITE_STATUS_META } from "../expansion-const";
import type { MappedBillboard } from "../expansion-analysis";
import { analyzeLocation } from "../expansion-location-score";
import { SiteStatusBadge, VerdictBadge } from "../expansion-badges";

const ALL = "ALL";

export function ExpansionSitesList({
  sites,
  billboards,
  periodMonths,
  isLoading,
  isError,
  activeId,
  onSelect,
}: {
  sites: ExpansionSite[];
  billboards: MappedBillboard[];
  periodMonths: number;
  isLoading: boolean;
  isError: boolean;
  activeId: string | null;
  onSelect: (site: ExpansionSite) => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ExpansionSiteStatus | typeof ALL>(ALL);

  const term = search.trim().toLowerCase();
  const filtered = sites.filter(
    (site) =>
      (status === ALL || site.status === status) &&
      (!term ||
        [site.code, site.name, site.address, site.departmentName]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(term))),
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex gap-2 px-3">
        <Input
          placeholder="Buscar ubicación..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          isSearch
        />
        <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {SITE_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {SITE_STATUS_META[value].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {isLoading ? (
          <ListSkeleton rows={4} variant="card" />
        ) : isError ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No pudimos cargar las ubicaciones planificadas.
          </p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <MapPinPlus className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              {sites.length === 0 ? "Aún no hay ubicaciones planificadas" : "Sin resultados"}
            </p>
            <p className="max-w-60 text-xs text-muted-foreground">
              {sites.length === 0
                ? "Usa “Nueva ubicación” o haz clic derecho sobre el mapa para proponer un sitio."
                : "Prueba con otro término o estado."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((site) => {
              const analysis = analyzeLocation(
                site,
                billboards,
                periodMonths,
                2,
                site.locationContext,
              );
              return (
                <li key={site.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(site)}
                    className={cn(
                      "flex w-full cursor-pointer flex-col gap-2 rounded-lg border bg-card p-3 text-left transition-colors hover:border-border-strong",
                      site.id === activeId && "border-primary ring-1 ring-primary",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-col">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {site.code}
                        </span>
                        <span className="truncate text-sm font-medium">{site.name}</span>
                      </div>
                      <SiteStatusBadge status={site.status} />
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {[site.address, site.departmentName].filter(Boolean).join(" · ") ||
                        `${site.latitude.toFixed(5)}, ${site.longitude.toFixed(5)}`}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <VerdictBadge verdict={analysis.verdict} />
                      <span className="font-semibold tabular-nums">{analysis.score}/100</span>
                      <span className="text-muted-foreground">
                        Prioridad {SITE_PRIORITY_LABELS[site.priority].toLowerCase()}
                      </span>
                      {analysis.estimatedMonthlyRevenue != null ? (
                        <span className="tabular-nums">
                          ~{formatMoney(analysis.estimatedMonthlyRevenue)}/mes
                        </span>
                      ) : null}
                      <span className="ml-auto flex items-center gap-2 text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <MessageSquare className="size-3" />
                          {site.commentsCount}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <FileText className="size-3" />
                          {site.documentsCount}
                        </span>
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
