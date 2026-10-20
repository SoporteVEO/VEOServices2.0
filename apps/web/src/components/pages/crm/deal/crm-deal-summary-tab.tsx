"use client";

import {
  Building2,
  CalendarDays,
  Mail,
  MessageCircle,
  Phone,
  Tag,
  User,
} from "lucide-react";
import type { CrmDealDetail } from "@/api/crm/crm.types";
import { Badge } from "@/components/primitives/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitleWithInfo,
} from "@/components/ui/card";
import { formatHumanDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PRIORITY_LABELS, PRIORITY_STYLES, SOURCE_LABELS } from "../crm-const";
import { calendarDate, personName, timeAgo, waLink } from "../crm-format";
import { MEDIA_TYPE_ICONS, MEDIA_TYPE_LABELS, MEDIA_TYPE_STYLES } from "../crm-ooh-const";
import { flightLabel } from "../crm-ooh-format";
import { CrmDealMetric as Metric } from "./crm-deal-metric";

export function CrmDealSummaryTab({ deal }: { deal: CrmDealDetail }) {
  const weighted = (deal.value * deal.stage.probability) / 100;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Valor" value={formatMoney(deal.value)} />
        <Metric
          label="Ponderado"
          value={formatMoney(weighted)}
          hint={`${deal.stage.probability}% de probabilidad`}
        />
        <Metric
          label="Cierre estimado"
          value={
            deal.expectedCloseDate
              ? formatHumanDate(calendarDate(deal.expectedCloseDate))
              : "Sin fecha"
          }
        />
        <Metric
          label="En esta etapa"
          value={timeAgo(deal.stageChangedAt).replace(/^hace /, "")}
          hint={deal.isStale ? "Sin seguimiento reciente" : undefined}
          warn={deal.isStale}
        />
      </div>

      {deal.status === "LOST" && deal.lostReason ? (
        <div className="border border-destructive/30 bg-destructive-soft p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
            Motivo de pérdida
          </p>
          <p className="mt-1">{deal.lostReason}</p>
        </div>
      ) : null}

      <CampaignBrief deal={deal} />

      <Card>
        <CardHeader>
          <CardTitleWithInfo info="Cliente y persona de contacto de este negocio.">
            Cliente y contacto
          </CardTitleWithInfo>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field icon={Building2} label="Cliente">
            {deal.client ? (
              <span>{deal.client.name}</span>
            ) : (
              <Empty>Sin cliente</Empty>
            )}
          </Field>
          <Field icon={User} label="Contacto">
            {deal.contact ? personName(deal.contact) : <Empty>Sin contacto</Empty>}
          </Field>
          {deal.contact?.email ? (
            <Field icon={Mail} label="Correo">
              <a href={`mailto:${deal.contact.email}`} className="hover:underline">
                {deal.contact.email}
              </a>
            </Field>
          ) : null}
          {deal.contact?.phone ? (
            <Field icon={Phone} label="Teléfono">
              <a href={`tel:${deal.contact.phone}`} className="hover:underline">
                {deal.contact.phone}
              </a>
            </Field>
          ) : null}
          {deal.contact?.whatsapp ? (
            <Field icon={MessageCircle} label="WhatsApp">
              <a
                href={waLink(deal.contact.whatsapp)}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                +{deal.contact.whatsapp}
              </a>
            </Field>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitleWithInfo>Detalles</CardTitleWithInfo>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Prioridad">
              <Badge variant="outline" className={PRIORITY_STYLES[deal.priority]}>
                {PRIORITY_LABELS[deal.priority]}
              </Badge>
            </Field>
            <Field label="Origen">
              {deal.source ? SOURCE_LABELS[deal.source] : <Empty>Sin origen</Empty>}
            </Field>
            <Field label="Responsable">{personName(deal.owner)}</Field>
          </div>
          <Field icon={Tag} label="Etiquetas">
            {deal.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {deal.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <Empty>Sin etiquetas</Empty>
            )}
          </Field>
          <Field label="Descripción">
            {deal.description ? (
              <p className="whitespace-pre-wrap">{deal.description}</p>
            ) : (
              <Empty>Sin descripción</Empty>
            )}
          </Field>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 rounded-md border border-border/60 bg-muted/10 p-3 text-xs sm:grid-cols-3">
        <Meta icon={CalendarDays} label="Creado" value={formatHumanDate(deal.createdAt)} />
        <Meta
          label="Creado por"
          value={deal.createdBy ? personName(deal.createdBy) : "—"}
        />
        <Meta label="Última actividad" value={timeAgo(deal.lastActivityAt)} />
      </div>
    </div>
  );
}

function CampaignBrief({ deal }: { deal: CrmDealDetail }) {
  const flight = flightLabel(deal.campaignStart, deal.campaignEnd);
  const MediaIcon = deal.mediaType ? MEDIA_TYPE_ICONS[deal.mediaType] : null;
  const commission =
    deal.agencyCommissionPct != null && deal.agencyCommissionPct > 0
      ? (deal.value * deal.agencyCommissionPct) / 100
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitleWithInfo info="Medio, marca y periodo de exhibición. El periodo se usa para revisar disponibilidad.">
          Brief de campaña
        </CardTitleWithInfo>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Medio">
          {deal.mediaType && MediaIcon ? (
            <Badge variant="outline" className={cn("gap-1", MEDIA_TYPE_STYLES[deal.mediaType])}>
              <MediaIcon className="size-3" />
              {MEDIA_TYPE_LABELS[deal.mediaType]}
            </Badge>
          ) : (
            <Empty>Sin definir</Empty>
          )}
        </Field>
        <Field label="Marca">{deal.brand ?? <Empty>Sin marca</Empty>}</Field>
        <Field label="Categoría">{deal.industry ?? <Empty>Sin categoría</Empty>}</Field>
        <Field icon={CalendarDays} label="Periodo">
          {flight ?? <Empty>Sin fechas</Empty>}
        </Field>
        <Field label="Zonas objetivo">
          {deal.targetZones.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {deal.targetZones.map((zone) => (
                <Badge key={zone} variant="secondary">
                  {zone}
                </Badge>
              ))}
            </div>
          ) : (
            <Empty>Todo el país</Empty>
          )}
        </Field>
        <Field label="Comisión agencia">
          {commission != null ? (
            <span>
              {deal.agencyCommissionPct}%{" "}
              <span className="text-muted-foreground">
                · {formatMoney(commission)} · neto {formatMoney(deal.value - commission)}
              </span>
            </span>
          ) : (
            <Empty>Sin comisión</Empty>
          )}
        </Field>
      </CardContent>
    </Card>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {Icon ? <Icon className="size-3" /> : null}
        {label}
      </span>
      <div className="min-w-0 text-sm">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>;
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {Icon ? <Icon className="size-3" /> : null}
        {label}
      </span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
