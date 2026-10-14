"use client";

import { Pause } from "lucide-react";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ART_BADGE_CLASS, ART_LABELS, DEAL_BADGE_CLASS, DEAL_LABELS } from "./pantallas-const";
import { usePantallas } from "./pantallas-context";
import {
  daysUntil,
  formatCount,
  formatIso,
  formatMoney,
  formatSpotMoney,
} from "./pantallas-format";
import {
  allLocations,
  campaignStatus,
  findLocation,
  validityDays,
  versionStatus,
  type CampaignLocation,
} from "./pantallas-logic";
import { clientValues } from "./order-report-logic";
import { CampaignStatusBadge, VersionStatusBadge } from "./tone-badge";
import { sameText } from "./pantallas-format";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-muted/40 px-3 py-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{children}</span>
    </div>
  );
}

function Detail({ location, onClose }: { location: CampaignLocation; onClose: () => void }) {
  const { board, refDate } = usePantallas();
  const { campaign: c, screen, sublist } = location;
  const status = campaignStatus(c, refDate);
  const days = daysUntil(refDate, c.endDate);
  const length = validityDays(c.startDate, c.endDate);
  const values = clientValues(board, c.client, c.campaign);
  const others = allLocations(board).filter(
    (l) => l.campaign.id !== c.id && sameText(l.campaign.client, c.client),
  );
  const versions = [...c.versions].sort((a, b) =>
    (a.startDate ?? "").localeCompare(b.startDate ?? ""),
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{c.client || "(sin nombre)"}</DialogTitle>
        <DialogDescription>
          {screen.name} · {sublist.name}
          {c.campaign ? ` · ${c.campaign}` : ""}
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Fact label="Estado">
            <CampaignStatusBadge status={status} />
          </Fact>
          <Fact label="Spots por día">{formatCount(c.spotsPerDay)}</Fact>
          <Fact label="Inicio">{formatIso(c.startDate)}</Fact>
          <Fact label="Fin">{formatIso(c.endDate)}</Fact>
          <Fact label="Duración">{length != null ? `${formatCount(length)} días` : "—"}</Fact>
          <Fact label="Faltan">
            {days == null ? "—" : days >= 0 ? `${days} días` : `terminó hace ${Math.abs(days)} días`}
          </Fact>
          <Fact label="Valor mensual (esta pantalla)">{formatMoney(c.monthlyValue)}</Fact>
          <Fact label="Valor por spot">{formatSpotMoney(c.spotValue)}</Fact>
          <Fact label="Valor total de la campaña">
            {formatMoney(values.total)}
            {values.override !== null &&
            values.sum !== null &&
            Math.abs(values.override - values.sum) > 0.005 ? (
              <span className="block text-[11px] font-normal text-muted-foreground">
                suma {formatMoney(values.sum)}
              </span>
            ) : null}
          </Fact>
          {c.deal !== "COMMERCIAL" ? (
            <Fact label="Modalidad">
              <Badge variant="outline" className={DEAL_BADGE_CLASS[c.deal]}>
                {DEAL_LABELS[c.deal]}
              </Badge>
            </Fact>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">Estado del arte</p>
          <Badge variant="outline" className={`w-fit ${ART_BADGE_CLASS[c.art]}`}>
            {ART_LABELS[c.art]}
          </Badge>
        </div>

        {c.paused ? (
          <p className="flex items-center gap-1.5 text-sm font-medium text-violet-600 dark:text-violet-400">
            <Pause className="size-3.5" />
            En pausa{c.pauseReason ? ` — ${c.pauseReason}` : ""}
          </p>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">Versiones del arte</p>
          {versions.length ? (
            <div className="flex flex-col divide-y rounded-lg border">
              {versions.map((v, i) => (
                <div key={v.id ?? i} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <b className="min-w-0 flex-1 truncate">{v.title || "(sin nombre)"}</b>
                  <span className="text-xs text-muted-foreground">
                    {formatIso(v.startDate)} → {formatIso(v.endDate)}
                  </span>
                  <VersionStatusBadge status={versionStatus(v, refDate)} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Esta campaña no tiene versiones cargadas.</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            El mismo cliente en otras pantallas
          </p>
          {others.length ? (
            <div className="flex flex-col divide-y rounded-lg border">
              {others.map((o) => (
                <div key={o.campaign.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <b className="min-w-0 flex-1 truncate">{o.screen.name}</b>
                  <span className="text-xs text-muted-foreground">
                    {o.sublist.name} · {formatCount(o.campaign.spotsPerDay)} spots
                  </span>
                  <CampaignStatusBadge status={campaignStatus(o.campaign, refDate)} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Solo está en esta pantalla.</p>
          )}
        </div>

        {c.notes ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">Notas</p>
            <p className="text-sm">{c.notes}</p>
          </div>
        ) : null}
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </DialogFooter>
    </>
  );
}

export function CampaignDetailDialog({
  campaignId,
  onClose,
}: {
  campaignId: string | null;
  onClose: () => void;
}) {
  const { board } = usePantallas();
  const location = campaignId ? findLocation(board, campaignId) : null;

  return (
    <Dialog open={Boolean(location)} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="lg">
        {location ? <Detail location={location} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}
