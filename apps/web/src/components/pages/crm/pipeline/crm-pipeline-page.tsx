"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useCrmBoard } from "@/api/crm/crm.get";
import type { CrmMediaType } from "@/api/crm/crm.types";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatMoney } from "@/lib/format";
import { MEDIA_TYPE_LABELS, MEDIA_TYPE_ORDER } from "../crm-ooh-const";
import { CrmDealDrawer } from "../deal/crm-deal-drawer";
import { CrmOwnerSelect } from "../shared/crm-owner-select";
import { CrmPipelineSelect } from "../shared/crm-pipeline-select";
import { CrmDealFormDialog } from "./crm-deal-form-dialog";
import { CrmKanbanBoard } from "./crm-kanban-board";

const OWNER_FILTERS = [
  { value: "all", label: "Todo el equipo" },
  { value: "me", label: "Mis negocios" },
];

export function CrmPipelinePage() {
  const [pipelineId, setPipelineId] = useState<string | null>(null);
  const [owner, setOwner] = useState("all");
  const [mediaType, setMediaType] = useState<CrmMediaType | "all">("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [createStageId, setCreateStageId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: board, isLoading } = useCrmBoard({
    pipelineId: pipelineId ?? undefined,
    ownerId: owner === "all" ? undefined : owner,
    mediaType: mediaType === "all" ? undefined : mediaType,
    search: debouncedSearch || undefined,
  });

  const openDeals = board?.deals.filter((deal) => deal.status === "OPEN") ?? [];
  const openValue = openDeals.reduce((sum, deal) => sum + deal.value, 0);
  const weighted = openDeals.reduce(
    (sum, deal) => sum + (deal.value * deal.stage.probability) / 100,
    0,
  );

  function openCreate(stageId: string | null) {
    setCreateStageId(stageId);
    setCreateOpen(true);
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <CrmPipelineSelect
            value={pipelineId ?? board?.pipeline.id ?? null}
            onChange={setPipelineId}
          />
          <CrmOwnerSelect
            value={owner}
            onChange={setOwner}
            className="w-48"
            extraOptions={OWNER_FILTERS}
          />
          <Select
            value={mediaType}
            onValueChange={(value) => setMediaType(value as CrmMediaType | "all")}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los medios</SelectItem>
              {MEDIA_TYPE_ORDER.map((type) => (
                <SelectItem key={type} value={type}>
                  {MEDIA_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="w-full sm:w-64">
            <Input
              isSearch
              placeholder="Buscar negocio, cliente, marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {board ? (
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>
                <span className="font-semibold text-foreground tabular-nums">
                  {openDeals.length}
                </span>{" "}
                abiertos
              </span>
              <span>
                <span className="font-semibold text-foreground tabular-nums">
                  {formatMoney(openValue)}
                </span>{" "}
                en pipeline
              </span>
              <span className="hidden sm:inline">
                <span className="font-semibold text-foreground tabular-nums">
                  {formatMoney(weighted)}
                </span>{" "}
                ponderado
              </span>
            </div>
          ) : null}
          <Button icon={Plus} onClick={() => openCreate(null)}>
            Nuevo negocio
          </Button>
        </div>
      </div>

      {isLoading || !board ? (
        <div className="flex min-h-0 flex-1 gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex w-72 shrink-0 flex-col gap-2 border border-border p-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <CrmKanbanBoard
          board={board}
          onOpenDeal={setSelectedDealId}
          onAddDeal={openCreate}
        />
      )}

      <CrmDealFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        pipelineId={board?.pipeline.id ?? pipelineId}
        defaultStageId={createStageId}
        onSaved={(deal) => setSelectedDealId(deal.id)}
      />
      <CrmDealDrawer
        dealId={selectedDealId}
        onOpenChange={(open) => {
          if (!open) setSelectedDealId(null);
        }}
      />
    </section>
  );
}
