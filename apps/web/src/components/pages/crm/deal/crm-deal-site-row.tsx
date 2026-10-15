"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangle,
  ExternalLink,
  Lock,
  MoreHorizontal,
  Pencil,
  Trash2,
  Undo2,
  Unlock,
} from "lucide-react";
import type { CrmDealSite, DealSitesAction } from "@/api/crm/crm-ooh.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { Checkbox } from "@/components/primitives/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/primitives/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { timeAgo } from "../crm-format";
import {
  HOLD_DAY_OPTIONS,
  SITE_KIND_ICONS,
  SITE_STATUS_LABELS,
  SITE_STATUS_STYLES,
} from "../crm-ooh-const";
import { flightLabel, mapsLink, sizeLabel } from "../crm-ooh-format";

interface Props {
  site: CrmDealSite;
  selected: boolean;
  editable: boolean;
  onSelect: (selected: boolean) => void;
  onAction: (action: DealSitesAction, holdDays?: number) => void;
  onEdit: () => void;
}

export function CrmDealSiteRow({ site, selected, editable, onSelect, onAction, onEdit }: Props) {
  const Icon = SITE_KIND_ICONS[site.kind];
  const released = site.status === "RELEASED";
  const maps = mapsLink(site.latitude, site.longitude);
  const location = [site.cityName, site.departmentName].filter(Boolean).join(", ");
  const size = sizeLabel(site.width, site.height);

  return (
    <li className={cn("flex items-start gap-3 p-3 text-sm", released && "opacity-60")}>
      {editable ? (
        <Checkbox
          className="mt-0.5"
          checked={selected}
          onCheckedChange={(checked) => onSelect(checked === true)}
          aria-label={`Seleccionar ${site.code}`}
        />
      ) : null}
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold tabular-nums">{site.code}</span>
          <span className="truncate text-muted-foreground">{site.label}</span>
          {maps ? (
            <a
              href={maps}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Ver en mapa"
            >
              <ExternalLink className="size-3" />
            </a>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
          <span>{flightLabel(site.startDate, site.endDate)}</span>
          {location ? <span>{location}</span> : null}
          {size ? <span>{size}</span> : null}
          {site.spotsPerDay ? <span>{site.spotsPerDay} spots/día</span> : null}
        </div>
        <SiteAlerts site={site} />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="flex items-center gap-1">
          {site.rank && site.status === "HELD" ? (
            <Badge variant={site.rank === 1 ? "info" : "warning"}>{site.rank}ª opción</Badge>
          ) : null}
          <Badge variant="outline" className={SITE_STATUS_STYLES[site.status]}>
            {SITE_STATUS_LABELS[site.status]}
          </Badge>
          {editable ? (
            <SiteMenu site={site} onAction={onAction} onEdit={onEdit} />
          ) : null}
        </div>
        <span className="text-sm font-semibold tabular-nums">{formatMoney(site.total)}</span>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {formatMoney(site.rate)}/mes
        </span>
      </div>
    </li>
  );
}

function SiteAlerts({ site }: { site: CrmDealSite }) {
  const alerts: { tone: "red" | "amber" | "violet"; text: string; detail?: string }[] = [];
  if (site.status === "HELD" && site.holdUntil) {
    if (site.holdExpired) {
      alerts.push({ tone: "red", text: `Reserva vencida ${timeAgo(site.holdUntil)}` });
    } else {
      alerts.push({
        tone: site.holdExpiringSoon ? "amber" : "violet",
        text: `Reservada hasta ${format(new Date(site.holdUntil), "d MMM, HH:mm", { locale: es })}`,
      });
    }
  }
  if (site.contracted) {
    alerts.push({ tone: "red", text: "Cara contratada en Brilo en estas fechas" });
  }
  if (site.conflicts.length > 0) {
    alerts.push({
      tone: "amber",
      text: `${site.conflicts.length} otro(s) negocio(s) sobre este sitio`,
      detail: site.conflicts
        .map(
          (c) =>
            `${c.status === "BOOKED" ? "Vendida" : `${c.rank}ª opción`}: ${c.dealTitle} (${c.ownerName})`,
        )
        .join("\n"),
    });
  }
  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] font-medium">
      {alerts.map((alert) => {
        const content = (
          <span
            className={cn(
              "flex items-center gap-1",
              alert.tone === "red" && "text-red-600 dark:text-red-400",
              alert.tone === "amber" && "text-amber-600 dark:text-amber-400",
              alert.tone === "violet" && "text-violet-700 dark:text-violet-300",
            )}
          >
            {alert.tone === "violet" ? <Lock className="size-3" /> : <AlertTriangle className="size-3" />}
            {alert.text}
          </span>
        );
        return alert.detail ? (
          <Tooltip key={alert.text}>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent className="whitespace-pre-line">{alert.detail}</TooltipContent>
          </Tooltip>
        ) : (
          <span key={alert.text}>{content}</span>
        );
      })}
    </div>
  );
}

function SiteMenu({
  site,
  onAction,
  onEdit,
}: {
  site: CrmDealSite;
  onAction: (action: DealSitesAction, holdDays?: number) => void;
  onEdit: () => void;
}) {
  const live = site.status === "HELD" && !site.holdExpired;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <PrimitiveButton variant="ghost" size="icon-xs" aria-label="Acciones del sitio">
          <MoreHorizontal />
        </PrimitiveButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {site.status !== "BOOKED" ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Lock className="size-4" />
              {live ? "Extender reserva" : "Reservar"}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {HOLD_DAY_OPTIONS.map((days) => (
                <DropdownMenuItem key={days} onSelect={() => onAction("hold", days)}>
                  {days} días
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : null}
        {site.status === "HELD" ? (
          <DropdownMenuItem onSelect={() => onAction("propose")}>
            <Undo2 className="size-4" />
            Volver a propuesta
          </DropdownMenuItem>
        ) : null}
        {site.status !== "RELEASED" ? (
          <DropdownMenuItem onSelect={() => onAction("release")}>
            <Unlock className="size-4" />
            Liberar
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil className="size-4" />
          Editar fechas y tarifa
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onAction("remove")}>
          <Trash2 className="size-4" />
          Quitar del negocio
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
