"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Camera, ClipboardList, Monitor, Signpost } from "lucide-react";
import { useCrmDealExecution } from "@/api/crm/crm-ooh.get";
import type {
  CrmExecutionDigitalItem,
  CrmExecutionStaticItem,
} from "@/api/crm/crm-ooh.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitleWithInfo } from "@/components/ui/card";
import { flightLabel } from "../crm-ooh-format";
import { CrmDealMetric as Metric } from "./crm-deal-metric";

const PRODUCTION_LABELS: Record<CrmExecutionStaticItem["status"], string> = {
  RECEIVED: "Recibida",
  IN_PRODUCTION: "En producción",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const PRODUCTION_VARIANTS: Record<
  CrmExecutionStaticItem["status"],
  "secondary" | "info" | "success" | "destructive"
> = {
  RECEIVED: "secondary",
  IN_PRODUCTION: "info",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

const ART_LABELS: Record<CrmExecutionDigitalItem["art"], string> = {
  RECEIVED: "Arte recibido",
  MISSING: "Falta arte",
  PENDING_APPROVAL: "Arte por aprobar",
};

function shortDate(value: string | null): string | null {
  return value ? format(new Date(value), "d MMM yy", { locale: es }) : null;
}

export function CrmDealExecutionTab({ dealId }: { dealId: string }) {
  const { data, isLoading } = useCrmDealExecution(dealId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data || (data.staticItems.length === 0 && data.digitalItems.length === 0)) {
    return (
      <div className="m-4 flex flex-col items-center gap-2 border border-dashed border-border p-8 text-center">
        <ClipboardList className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium">Sin ejecución todavía</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Cuando una cotización vinculada sea aceptada verás aquí la orden de producción, la
          instalación, las fotos testigo y el estado de las pautas digitales.
        </p>
      </div>
    );
  }

  const { summary } = data;
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric
          label="Instaladas"
          value={`${summary.installed}/${summary.staticTotal}`}
          hint={summary.pendingInstall > 0 ? `${summary.pendingInstall} pendientes` : undefined}
          warn={summary.pendingInstall > 0}
        />
        <Metric
          label="Sin foto testigo"
          value={String(summary.missingProof)}
          warn={summary.missingProof > 0}
          hint={summary.missingProof > 0 ? "Pide evidencia al instalador" : "Todo documentado"}
        />
        <Metric label="Pautas al aire" value={`${summary.live}/${summary.digitalTotal}`} />
        <Metric
          label="Arte pendiente"
          value={String(summary.artPending)}
          warn={summary.artPending > 0}
        />
      </div>

      {data.staticItems.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitleWithInfo info="Caras de las órdenes de producción generadas por las cotizaciones aceptadas.">
              Vallas
            </CardTitleWithInfo>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {data.staticItems.map((item) => (
                <li key={item.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                  <Signpost className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium">
                      {item.billboardCode ?? "Sin código"}
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · {item.address ?? item.cityName ?? ""}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {[
                        `Cotización ${item.offerNumber}`,
                        item.installedAt
                          ? `Instalada ${shortDate(item.installedAt)}`
                          : item.scheduledInstallationAt
                            ? `Programada ${shortDate(item.scheduledInstallationAt)}`
                            : "Sin programar",
                        item.installerName,
                        item.hasArt ? null : "Sin arte",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={PRODUCTION_VARIANTS[item.status]}>
                      {PRODUCTION_LABELS[item.status]}
                    </Badge>
                    <span
                      className={
                        item.installedAt && item.proofCount === 0
                          ? "flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400"
                          : "flex items-center gap-1 text-[11px] text-muted-foreground"
                      }
                    >
                      <Camera className="size-3" />
                      {item.proofCount} fotos
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {data.digitalItems.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitleWithInfo info="Campañas DOOH programadas desde las cotizaciones del negocio.">
              Pantallas
            </CardTitleWithInfo>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {data.digitalItems.map((item) => (
                <li key={item.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                  <Monitor className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium">{item.screenName}</span>
                    <span className="text-xs text-muted-foreground">
                      {[
                        `Cotización ${item.offerNumber}`,
                        flightLabel(item.startDate, item.endDate),
                        `${item.spotsPerDay} spots/día`,
                        item.paused ? `Pausada${item.pauseReason ? `: ${item.pauseReason}` : ""}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={item.isLive ? "success" : item.paused ? "warning" : "secondary"}>
                      {item.isLive ? "Al aire" : item.paused ? "Pausada" : "Programada"}
                    </Badge>
                    <Badge variant={item.art === "RECEIVED" ? "outline" : "warning"}>
                      {ART_LABELS[item.art]}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
