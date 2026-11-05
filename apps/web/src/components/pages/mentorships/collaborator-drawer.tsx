"use client";

import { useState } from "react";
import { Archive, ChevronRight, Plus, X } from "lucide-react";
import { useMentorshipCollaborator } from "@/api/mentorships/mentorships.get";
import type {
  MentorshipCollaboratorProfile,
  MentorshipSession,
} from "@/api/mentorships/mentorships.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { DetailPanelSkeleton } from "@/components/ui/skeletons";
import { formatDay, quarterLabel } from "./const";
import {
  AcknowledgementBadge,
  MentorshipStatusBadge,
  StartOutcomeBadge,
} from "./mentorship-badges";
import { PdfDownloadButton } from "./pdf-download-button";
import { Section } from "./session-detail";
import { CreateSessionDialog } from "./session-form-dialogs";

type Props = {
  userId: string | null;
  onClose: () => void;
  onOpenSession: (sessionId: string) => void;
};

export function CollaboratorDrawer({ userId, onClose, onOpenSession }: Props) {
  return (
    <Drawer
      open={!!userId}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      direction="right"
      handleOnly
    >
      <DrawerContent className="flex flex-col data-[vaul-drawer-direction=right]:h-screen data-[vaul-drawer-direction=right]:w-[96vw] data-[vaul-drawer-direction=right]:sm:max-w-[640px]">
        {userId ? (
          <DrawerBody
            key={userId}
            userId={userId}
            onClose={onClose}
            onOpenSession={onOpenSession}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function DrawerBody({
  userId,
  onClose,
  onOpenSession,
}: {
  userId: string;
  onClose: () => void;
  onOpenSession: (sessionId: string) => void;
}) {
  const { data, isLoading, isError } = useMentorshipCollaborator(userId);

  if (isLoading) {
    return (
      <>
        <DrawerTitle className="sr-only">Cargando colaborador</DrawerTitle>
        <DetailPanelSkeleton sections={2} />
      </>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <DrawerTitle className="sr-only">Colaborador</DrawerTitle>
        <p className="text-sm text-muted-foreground">
          No pudimos cargar este colaborador o no tienes acceso a su historial.
        </p>
        <Button variant="outline" sizeVariant="sm" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    );
  }

  return (
    <CollaboratorContent
      profile={data}
      onClose={onClose}
      onOpenSession={onOpenSession}
    />
  );
}

function CollaboratorContent({
  profile,
  onClose,
  onOpenSession,
}: {
  profile: MentorshipCollaboratorProfile;
  onClose: () => void;
  onOpenSession: (sessionId: string) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const { collaborator, sessions, quarter, quarterStatus, draft } = profile;
  const subtitle = [collaborator.position, collaborator.department?.name]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <DrawerHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <DrawerTitle className="flex flex-wrap items-center gap-2">
              {collaborator.name}
              {collaborator.archived ? (
                <Badge variant="outline" className="text-[10px]">
                  <Archive className="mr-1 size-3" />
                  Archivado
                </Badge>
              ) : null}
            </DrawerTitle>
            <DrawerDescription className="truncate">
              {subtitle || "Sin cargo asignado"}
            </DrawerDescription>
            <p className="text-xs text-muted-foreground">
              Jefe directo: {collaborator.boss?.name ?? "Sin asignar"}
            </p>
          </div>
          <PrimitiveButton
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </PrimitiveButton>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {draft ? (
            <Button sizeVariant="sm" icon={Plus} onClick={() => setCreateOpen(true)}>
              Registrar mentoría
            </Button>
          ) : null}
          <PdfDownloadButton sessions={sessions} label="Descargar historial" />
        </div>
      </DrawerHeader>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-6 p-4">
          {quarterStatus ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border border-border bg-muted/30 p-3 text-sm">
              <span>
                {quarter.label} · fecha límite {formatDay(quarter.deadline)}
              </span>
              <MentorshipStatusBadge status={quarterStatus} />
            </div>
          ) : null}

          <Section
            title="Historial de mentorías"
            hint={`${sessions.length} ${sessions.length === 1 ? "sesión" : "sesiones"}`}
          >
            {sessions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aún no hay mentorías registradas.
              </p>
            ) : (
              <ol className="flex flex-col gap-2">
                {sessions.map((session) => (
                  <SessionHistoryItem
                    key={session.id}
                    session={session}
                    onOpen={() => onOpenSession(session.id)}
                  />
                ))}
              </ol>
            )}
          </Section>
        </div>
      </ScrollArea>

      {draft ? (
        <CreateSessionDialog
          profile={profile}
          draft={draft}
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={onOpenSession}
        />
      ) : null}
    </>
  );
}

function SessionHistoryItem({
  session,
  onOpen,
}: {
  session: MentorshipSession;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-start gap-3 border border-border bg-card p-3 text-left transition-colors hover:border-border-strong hover:bg-muted/30"
      >
        <span className="flex size-9 shrink-0 items-center justify-center border border-border bg-muted font-heading text-sm font-semibold tabular-nums">
          {session.sessionNumber}
        </span>
        <span className="min-w-0 flex-1 space-y-1">
          <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {formatDay(session.sessionDate)}
            <span className="text-xs font-normal text-muted-foreground">
              {quarterLabel(session.quarter)} · {session.mentor.name}
            </span>
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            Start: {session.start.what}
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <AcknowledgementBadge acknowledgedAt={session.acknowledgedAt} />
            {session.previousStart?.outcome ? (
              <StartOutcomeBadge outcome={session.previousStart.outcome} />
            ) : null}
          </span>
        </span>
        <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </button>
    </li>
  );
}
