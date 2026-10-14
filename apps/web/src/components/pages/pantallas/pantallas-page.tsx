"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { usePantallasBoard, usePantallasLogs } from "@/api/pantallas/pantallas.get";
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
      <div className="flex flex-1 items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Cargando pantallas…
      </div>
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
