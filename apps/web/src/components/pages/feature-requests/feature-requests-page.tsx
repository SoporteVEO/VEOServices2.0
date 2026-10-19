"use client";

import { useState } from "react";
import { Lightbulb, PenLine, Plus } from "lucide-react";
import { useMyFeatureRequests } from "@/api/feature-requests/feature-requests.get";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/primitives/ui/alert";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeatureRequestDrawer } from "./feature-request-drawer";
import { FeatureRequestFormDialog } from "./feature-request-form-dialog";
import { MY_FEATURE_REQUESTS_COLUMNS } from "./feature-requests-columns";
import {
  CLOSED_STATUSES,
  USER_TAB_LABELS,
  USER_TABS,
  type UserTab,
} from "./const";
import { useSelectedRequest } from "./use-selected-request";

const EMPTY_MESSAGES: Record<UserTab, string> = {
  active: "No tienes solicitudes activas. Usa «Nueva solicitud» para crear una.",
  closed: "Aún no tienes solicitudes cerradas.",
  all: "Aún no has enviado ninguna solicitud.",
};

export function FeatureRequestsPage() {
  const { data, isLoading, isError } = useMyFeatureRequests();
  const { selectedId, select } = useSelectedRequest();
  const [tab, setTab] = useState<UserTab>("active");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const requests = data ?? [];
  const isClosed = (status: string) =>
    CLOSED_STATUSES.some((closed) => closed === status);
  const counts: Record<UserTab, number> = {
    active: requests.filter((r) => !isClosed(r.status)).length,
    closed: requests.filter((r) => isClosed(r.status)).length,
    all: requests.length,
  };
  const awaiting = requests.filter((r) => r.awaitingMySignature);

  const term = search.trim().toLowerCase();
  const visible = requests.filter((request) => {
    if (tab === "active" && isClosed(request.status)) return false;
    if (tab === "closed" && !isClosed(request.status)) return false;
    if (!term) return true;
    return [request.ticket, request.title, request.summary].some((text) =>
      text.toLowerCase().includes(term),
    );
  });

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Lightbulb className="size-3.5" />
            Solicitar funcionalidad
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Tus solicitudes al equipo de desarrollo
          </h1>
          <p className="text-sm text-muted-foreground">
            Pide una mejora, sigue su avance y aprueba con tu firma cuando esté
            lista.
          </p>
        </div>
        <Button icon={Plus} onClick={() => setFormOpen(true)}>
          Nueva solicitud
        </Button>
      </div>

      {awaiting.length > 0 ? (
        <Alert className="border-teal-500/40 bg-teal-500/5 pe-28">
          <PenLine />
          <AlertTitle>
            {awaiting.length === 1
              ? "Una solicitud espera tu firma"
              : `${awaiting.length} solicitudes esperan tu firma`}
          </AlertTitle>
          <AlertDescription>
            Desarrollo ya las completó. Pruébalas y firma tu aprobación.
          </AlertDescription>
          <AlertAction className="top-1/2 -translate-y-1/2">
            <Button sizeVariant="sm" onClick={() => select(awaiting[0].id)}>
              Revisar
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <Tabs value={tab} onValueChange={(value) => setTab(value as UserTab)}>
        <TabsList className="self-start">
          {USER_TABS.map((value) => (
            <TabsTrigger key={value} value={value}>
              {USER_TAB_LABELS[value]}
              <span className="ml-1.5 bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">
                {counts[value]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isError ? (
        <p className="py-10 text-center text-sm text-destructive">
          No pudimos cargar tus solicitudes.
        </p>
      ) : (
        <DataTable
          className="min-h-0 flex-1"
          columns={MY_FEATURE_REQUESTS_COLUMNS}
          data={visible}
          isLoading={isLoading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por ticket o título..."
          emptyMessage={
            term ? "No hay solicitudes con esa búsqueda." : EMPTY_MESSAGES[tab]
          }
          onRowClick={(request) => select(request.id)}
          pagination={{ pageSize: 10 }}
        />
      )}

      <FeatureRequestFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreated={(request) => select(request.id)}
      />
      <FeatureRequestDrawer requestId={selectedId} onClose={() => select(null)} />
    </section>
  );
}
