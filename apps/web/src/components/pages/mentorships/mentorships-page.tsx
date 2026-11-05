"use client";

import { useMentorshipOverview } from "@/api/mentorships/mentorships.get";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollaboratorDrawer } from "./collaborator-drawer";
import { formatDay } from "./const";
import { HrPanelTab } from "./hr-panel-tab";
import { MyMentorshipsTab } from "./my-mentorships-tab";
import { SessionDrawer } from "./session-drawer";
import { TeamTab } from "./team-tab";
import { type MentorshipTab, useMentorshipParams } from "./use-mentorship-params";

const TAB_LABELS: Record<MentorshipTab, string> = {
  equipo: "Mi equipo",
  mias: "Mis mentorías",
  panel: "Panel Talento Humano",
};

export function MentorshipsPage() {
  const { data: overview, isLoading, isError } = useMentorshipOverview();
  const params = useMentorshipParams();

  const tabs: MentorshipTab[] = overview
    ? [
        ...(overview.teamCount > 0 ? (["equipo"] as const) : []),
        "mias",
        ...(overview.isHr ? (["panel"] as const) : []),
      ]
    : [];
  const activeTab =
    params.tab && tabs.includes(params.tab) ? params.tab : (tabs[0] ?? "mias");

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Retroalimentación trimestral
        </h1>
        <p className="text-sm text-muted-foreground">
          {overview
            ? `${overview.quarter.label}: la mentoría de cada colaborador vence el ${formatDay(overview.quarter.deadline)}.`
            : "Cada trimestre, el jefe directo acuerda con su colaborador qué mantener, qué dejar y qué empezar."}
        </p>
      </div>

      {isError ? (
        <p className="py-10 text-center text-sm text-destructive">
          No pudimos cargar tus mentorías.
        </p>
      ) : isLoading || !overview ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(value) => params.setTab(value as MentorshipTab)}
        >
          <TabsList className="self-start">
            {tabs.map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {TAB_LABELS[tab]}
                {tab === "equipo" ? (
                  <Counter value={overview.teamCount} />
                ) : null}
                {tab === "mias" && overview.pendingAcknowledgements > 0 ? (
                  <Counter value={overview.pendingAcknowledgements} highlight />
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.includes("equipo") ? (
            <TabsContent value="equipo">
              <TeamTab onOpenCollaborator={params.openCollaborator} />
            </TabsContent>
          ) : null}
          <TabsContent value="mias">
            <MyMentorshipsTab onOpenSession={params.openSession} />
          </TabsContent>
          {overview.isHr ? (
            <TabsContent value="panel">
              <HrPanelTab onOpenCollaborator={params.openCollaborator} />
            </TabsContent>
          ) : null}
        </Tabs>
      )}

      <SessionDrawer
        sessionId={params.sessionId}
        onClose={() => params.openSession(null)}
        onOpenCollaborator={params.openCollaborator}
      />
      <CollaboratorDrawer
        userId={params.collaboratorId}
        onClose={() => params.openCollaborator(null)}
        onOpenSession={params.openSession}
      />
    </section>
  );
}

function Counter({ value, highlight }: { value: number; highlight?: boolean }) {
  return (
    <span
      className={
        highlight
          ? "ml-1.5 bg-teal-500/15 px-1.5 text-[11px] font-semibold tabular-nums text-teal-700 dark:text-teal-400"
          : "ml-1.5 bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground"
      }
    >
      {value}
    </span>
  );
}