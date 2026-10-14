"use client";

import { useState } from "react";
import { CornerDownRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/primitives/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePantallas } from "./pantallas-context";
import { clientKey, formatCount, formatIso } from "./pantallas-format";
import { allLocations, campaignStatus, occupiesAir } from "./pantallas-logic";
import { StatusLegend } from "./status-legend";
import { CampaignStatusBadge } from "./tone-badge";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

export function PantallasSearch() {
  const { board, refDate, canEdit, openDialog, goToScreen } = usePantallas();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const hits = allLocations(board)
    .filter(({ campaign: c }) =>
      !q || `${c.client} ${c.campaign} ${c.notes ?? ""}`.toLowerCase().includes(q),
    )
    .map((location) => ({ ...location, status: campaignStatus(location.campaign, refDate) }))
    .sort(
      (a, b) =>
        a.campaign.client.localeCompare(b.campaign.client) ||
        a.screen.name.localeCompare(b.screen.name),
    );

  const clients = new Set(hits.map((h) => clientKey(h.campaign.client))).size;
  const onAir = hits
    .filter((h) => occupiesAir(h.status))
    .reduce((sum, h) => sum + h.campaign.spotsPerDay, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full max-w-md">
          <Input
            isSearch
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente, campaña o nota… (ej. MINED, saba, curacao)"
            autoComplete="off"
          />
        </div>
        <Chip>{hits.length} registros</Chip>
        <Chip>{clients} clientes</Chip>
        <Chip>{formatCount(onAir)} spots al aire</Chip>
      </div>

      {!hits.length ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Sin resultados para “{query}”.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Campaña</TableHead>
                <TableHead>Pantalla</TableHead>
                <TableHead>Sublista</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead className="text-right">Spots</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {hits.map((hit, index) => {
                const firstOfClient =
                  index === 0 ||
                  clientKey(hits[index - 1].campaign.client) !== clientKey(hit.campaign.client);
                return (
                  <TableRow key={hit.campaign.id}>
                    <TableCell>
                      {firstOfClient ? (
                        <b>{hit.campaign.client}</b>
                      ) : (
                        <CornerDownRight className="size-3.5 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {hit.campaign.campaign || "—"}
                    </TableCell>
                    <TableCell>{hit.screen.name}</TableCell>
                    <TableCell className="text-muted-foreground">{hit.sublist.name}</TableCell>
                    <TableCell className="tabular-nums">{formatIso(hit.campaign.startDate)}</TableCell>
                    <TableCell className="tabular-nums">{formatIso(hit.campaign.endDate)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCount(hit.campaign.spotsPerDay)}
                    </TableCell>
                    <TableCell>
                      <CampaignStatusBadge status={hit.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit ? (
                        <Button
                          variant="ghost"
                          sizeVariant="sm"
                          className="border-0 shadow-none"
                          onClick={() =>
                            openDialog({
                              type: "campaign",
                              sublistId: hit.sublist.id,
                              campaignId: hit.campaign.id,
                            })
                          }
                        >
                          Editar
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          sizeVariant="sm"
                          className="border-0 shadow-none"
                          onClick={() => goToScreen(hit.screen.id)}
                        >
                          Ver
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <StatusLegend />
    </div>
  );
}
