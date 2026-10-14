"use client";

import { useMemo, useState } from "react";
import { usePantallasBoard, usePantallasLogs } from "@/api/pantallas/pantallas.get";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PantallasProvider, type PantallasDialogState } from "./pantallas-context";
import { PantallasDialogs } from "./pantallas-dialogs";
import { todayIso } from "./pantallas-format";
import { PantallasSearch } from "./pantallas-search";
import { PantallasSummary } from "./pantallas-summary";
import { PantallasToolbar } from "./pantallas-toolbar";
import { ScreenView } from "./screen-view";
import { usePantallasAccess } from "./use-pantallas-access";

const SUMMARY_TAB = "summary";
const SEARCH_TAB = "search";

export function PantallasPage() {
  const { data: board, isLoading, error } = usePantallasBoard();
  const { data: logs = [] } = usePantallasLogs();
  const { canEdit } = usePantallasAccess();
  const [refDate, setRefDate] = useState(todayIso);
  const [tab, setTab] = useState(SUMMARY_TAB);
  const [dialog, setDialog] = useState<PantallasDialogState>(null);

  const context = useMemo(
    () =>
      board
        ? {
            board,
            logs,
            refDate,
            canEdit,
            openDialog: setDialog,
            goToScreen: (screenId: string) => {
              setTab(screenId);
              window.scrollTo({ top: 0 });
            },
          }
        : null,
    [board, logs, refDate, canEdit],
  );

  if (isLoading) {
    return (
      <section
        role="status"
        aria-label="Cargando pantallas…"
        className="flex min-h-0 flex-1 flex-col gap-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <Skeleton className="h-9 w-44" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <div className="flex gap-1 pb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>
        <div className="flex flex-col gap-6">
          <div className="grid gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 @[96rem]/main:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 border border-border/80 bg-accent/20 px-4 py-3"
              >
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-24" />
            <div className="grid gap-3 @xl/main:grid-cols-2 @7xl/main:grid-cols-3 @[96rem]/main:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 border border-border/80 bg-card px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-2 w-full" />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !context || !board) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        {error instanceof Error ? error.message : "No se pudieron cargar las pantallas."}
      </p>
    );
  }

  const activeTab =
    tab === SUMMARY_TAB || tab === SEARCH_TAB || board.screens.some((s) => s.id === tab)
      ? tab
      : SUMMARY_TAB;

  return (
    <PantallasProvider value={context}>
      <section className="flex min-h-0 flex-1 flex-col gap-4">
        <PantallasToolbar refDate={refDate} onRefDateChange={setRefDate} />
        <Tabs value={activeTab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
          <div className="overflow-x-auto pb-1">
            <TabsList className="w-max">
              <TabsTrigger value={SUMMARY_TAB} className="px-4">
                Resumen
              </TabsTrigger>
              {board.screens.map((screen) => (
                <TabsTrigger key={screen.id} value={screen.id} className="px-4">
                  {screen.name}
                </TabsTrigger>
              ))}
              <TabsTrigger value={SEARCH_TAB} className="px-4">
                Buscar
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={SUMMARY_TAB} className="data-[state=inactive]:hidden">
            <PantallasSummary />
          </TabsContent>
          {board.screens.map((screen) => (
            <TabsContent
              key={screen.id}
              value={screen.id}
              className="data-[state=inactive]:hidden"
            >
              <ScreenView screen={screen} />
            </TabsContent>
          ))}
          <TabsContent value={SEARCH_TAB} className="data-[state=inactive]:hidden">
            <PantallasSearch />
          </TabsContent>
        </Tabs>
      </section>
      <PantallasDialogs dialog={dialog} onClose={() => setDialog(null)} />
    </PantallasProvider>
  );
}
