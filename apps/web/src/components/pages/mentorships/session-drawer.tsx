"use client";

import { useState } from "react";
import { CircleCheck, History, Pencil, X } from "lucide-react";
import { useMentorshipSession } from "@/api/mentorships/mentorships.get";
import type { MentorshipSessionDetail } from "@/api/mentorships/mentorships.types";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { DetailPanelSkeleton } from "@/components/ui/skeletons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AcknowledgeDialog } from "./acknowledge-dialog";
import { formatDay, quarterLabel } from "./const";
import { AcknowledgementBadge } from "./mentorship-badges";
import { PdfDownloadButton } from "./pdf-download-button";
import { SessionDetail } from "./session-detail";
import { EditSessionDialog } from "./session-form-dialogs";
import { SessionRevisions } from "./session-revisions";

type Props = {
  sessionId: string | null;
  onClose: () => void;
  onOpenCollaborator: (userId: string) => void;
};

export function SessionDrawer({ sessionId, onClose, onOpenCollaborator }: Props) {
  return (
    <Drawer
      open={!!sessionId}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      direction="right"
      handleOnly
    >
      <DrawerContent className="flex flex-col data-[vaul-drawer-direction=right]:h-screen data-[vaul-drawer-direction=right]:w-[96vw] data-[vaul-drawer-direction=right]:sm:max-w-[720px]">
        {sessionId ? (
          <DrawerBody
            key={sessionId}
            sessionId={sessionId}
            onClose={onClose}
            onOpenCollaborator={onOpenCollaborator}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function DrawerBody({
  sessionId,
  onClose,
  onOpenCollaborator,
}: {
  sessionId: string;
  onClose: () => void;
  onOpenCollaborator: (userId: string) => void;
}) {
  const { data: session, isLoading, isError } = useMentorshipSession(sessionId);

  if (isLoading) {
    return (
      <>
        <DrawerTitle className="sr-only">Cargando mentoría</DrawerTitle>
        <DetailPanelSkeleton sections={3} />
      </>
    );
  }

  if (isError || !session) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <DrawerTitle className="sr-only">Mentoría</DrawerTitle>
        <p className="text-sm text-muted-foreground">
          No pudimos cargar esta mentoría o no tienes acceso a ella.
        </p>
        <Button variant="outline" sizeVariant="sm" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    );
  }

  return (
    <SessionContent
      session={session}
      onClose={onClose}
      onOpenCollaborator={onOpenCollaborator}
    />
  );
}

function SessionContent({
  session,
  onClose,
  onOpenCollaborator,
}: {
  session: MentorshipSessionDetail;
  onClose: () => void;
  onOpenCollaborator: (userId: string) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [ackOpen, setAckOpen] = useState(false);
  const { permissions } = session;

  return (
    <>
      <DrawerHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <DrawerTitle className="flex flex-wrap items-center gap-2">
              Mentoría N.º {session.sessionNumber}
              <span className="text-sm font-normal text-muted-foreground">
                {quarterLabel(session.quarter)}
              </span>
              <AcknowledgementBadge acknowledgedAt={session.acknowledgedAt} />
            </DrawerTitle>
            <p className="text-sm font-medium">{session.collaborator.name}</p>
            <DrawerDescription className="truncate">
              Mentor: {session.mentor.name} · {formatDay(session.sessionDate)}
            </DrawerDescription>
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
          <PdfDownloadButton sessions={[session]} />
          <Button
            variant="outline"
            sizeVariant="sm"
            icon={History}
            onClick={() => onOpenCollaborator(session.collaborator.id)}
          >
            Historial
          </Button>
          {permissions.canEdit ? (
            <Button
              variant="outline"
              sizeVariant="sm"
              icon={Pencil}
              onClick={() => setEditOpen(true)}
            >
              {permissions.editRequiresReason ? "Corregir" : "Editar"}
            </Button>
          ) : null}
        </div>
      </DrawerHeader>

      <Tabs
        defaultValue="acuerdos"
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <TabsList className="mx-4 mt-3 self-start">
          <TabsTrigger value="acuerdos" className="px-4">
            Acuerdos
          </TabsTrigger>
          <TabsTrigger value="cambios" className="px-4">
            Cambios
            <span className="ml-1.5 text-[11px] text-muted-foreground tabular-nums">
              {session.revisions.length}
            </span>
          </TabsTrigger>
        </TabsList>
        <DrawerTab value="acuerdos">
          <SessionDetail session={session} />
        </DrawerTab>
        <DrawerTab value="cambios">
          <SessionRevisions revisions={session.revisions} />
        </DrawerTab>
      </Tabs>

      {permissions.canAcknowledge ? (
        <DrawerFooter className="border-t">
          <div className="flex flex-col gap-3 border border-teal-500/40 bg-teal-500/5 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">
                Revisa los acuerdos de tu mentoría
              </p>
              <p className="text-sm text-muted-foreground">
                Confirma de recibido; puedes dejar un comentario.
              </p>
            </div>
            <Button icon={CircleCheck} onClick={() => setAckOpen(true)}>
              Confirmar de recibido
            </Button>
          </div>
        </DrawerFooter>
      ) : null}

      {permissions.canEdit ? (
        <EditSessionDialog
          session={session}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      ) : null}
      {permissions.canAcknowledge ? (
        <AcknowledgeDialog
          session={session}
          open={ackOpen}
          onOpenChange={setAckOpen}
        />
      ) : null}
    </>
  );
}

function DrawerTab({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <TabsContent
      value={value}
      className="min-h-0 flex-1 data-[state=inactive]:hidden"
    >
      <ScrollArea className="h-full">
        <div className="p-4">{children}</div>
      </ScrollArea>
    </TabsContent>
  );
}
