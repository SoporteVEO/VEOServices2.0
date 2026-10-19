"use client";

import { useState } from "react";
import { PenLine, TriangleAlert, X } from "lucide-react";
import { useFeatureRequest } from "@/api/feature-requests/feature-requests.get";
import type { FeatureRequestDetail } from "@/api/feature-requests/feature-requests.types";
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
import {
  FeatureRequestPriorityBadge,
  FeatureRequestStatusBadge,
} from "./feature-request-badges";
import { FeatureRequestFileCard } from "./feature-request-file-card";
import { FeatureRequestParticipants } from "./feature-request-participants";
import { FeatureRequestProblemDialog } from "./feature-request-problem-dialog";
import { FeatureRequestSignDialog } from "./feature-request-sign-dialog";
import { FeatureRequestSignatures } from "./feature-request-signatures";
import { FeatureRequestStatusForm } from "./feature-request-status-form";
import { FeatureRequestTimeline } from "./feature-request-timeline";
import { formatDateTime, userName } from "./const";

type Props = {
  requestId: string | null;
  onClose: () => void;
};

export function FeatureRequestDrawer({ requestId, onClose }: Props) {
  return (
    <Drawer
      open={!!requestId}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      direction="right"
      handleOnly
    >
      <DrawerContent className="flex flex-col data-[vaul-drawer-direction=right]:h-screen data-[vaul-drawer-direction=right]:w-[96vw] data-[vaul-drawer-direction=right]:sm:max-w-[760px]">
        {requestId ? (
          <DrawerBody key={requestId} requestId={requestId} onClose={onClose} />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function DrawerBody({
  requestId,
  onClose,
}: {
  requestId: string;
  onClose: () => void;
}) {
  const { data: request, isLoading, isError } = useFeatureRequest(requestId);

  if (isLoading) return <DetailPanelSkeleton sections={3} />;

  if (isError || !request) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          No pudimos cargar esta solicitud.
        </p>
      </div>
    );
  }

  return <RequestContent request={request} onClose={onClose} />;
}

function RequestContent({
  request,
  onClose,
}: {
  request: FeatureRequestDetail;
  onClose: () => void;
}) {
  const { permissions } = request;
  const hasFooter =
    permissions.canSign ||
    permissions.canReportProblem ||
    permissions.canChangeStatus;

  return (
    <>
      <DrawerHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <DrawerTitle className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm">{request.ticket}</span>
              <FeatureRequestStatusBadge status={request.status} />
              <FeatureRequestPriorityBadge priority={request.priority} />
            </DrawerTitle>
            <p className="text-sm font-medium">{request.title}</p>
            <DrawerDescription className="truncate">
              {userName(request.requester)} ·{" "}
              {formatDateTime(request.createdAt)}
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
      </DrawerHeader>

      <Tabs
        defaultValue="resumen"
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <TabsList className="mx-4 mt-3 self-start">
          <TabsTrigger value="resumen" className="px-4">
            Resumen
          </TabsTrigger>
          <TabsTrigger value="actividad" className="px-4">
            Actividad
            <span className="ml-1.5 text-[11px] text-muted-foreground tabular-nums">
              {request.events.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="firmas" className="px-4">
            Firmas
            <span className="ml-1.5 text-[11px] text-muted-foreground tabular-nums">
              {request.signatures.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <RequestTab value="resumen">
          <div className="flex flex-col gap-6">
            <Section title="Descripción">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {request.summary}
              </p>
            </Section>
            <Section title="Formato de la solicitud">
              <FeatureRequestFileCard
                requestId={request.id}
                attachment={request.attachment}
              />
            </Section>
            <Section
              title="Participantes"
              hint={
                request.status === "COMPLETED"
                  ? `${request.signatureProgress.signed} de ${request.signatureProgress.required} firmas`
                  : undefined
              }
            >
              <FeatureRequestParticipants request={request} />
            </Section>
          </div>
        </RequestTab>
        <RequestTab value="actividad">
          <FeatureRequestTimeline events={request.events} />
        </RequestTab>
        <RequestTab value="firmas">
          <FeatureRequestSignatures
            signatures={request.signatures}
            currentRound={request.completionRound}
          />
        </RequestTab>
      </Tabs>

      {hasFooter ? (
        <DrawerFooter className="gap-4 border-t">
          {permissions.canSign ? <SignaturePrompt request={request} /> : null}
          {permissions.canChangeStatus ? (
            <FeatureRequestStatusForm request={request} />
          ) : null}
        </DrawerFooter>
      ) : null}
    </>
  );
}

function SignaturePrompt({ request }: { request: FeatureRequestDetail }) {
  const [signOpen, setSignOpen] = useState(false);
  const [problemOpen, setProblemOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 border border-teal-500/40 bg-teal-500/5 p-3">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold">
          Desarrollo completó esta funcionalidad
        </p>
        <p className="text-sm text-muted-foreground">
          Pruébala. Si funciona como esperabas, firma tu aprobación; si no,
          repórtalo y volverá a desarrollo.
        </p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          icon={TriangleAlert}
          onClick={() => setProblemOpen(true)}
        >
          Reportar problema
        </Button>
        <Button icon={PenLine} onClick={() => setSignOpen(true)}>
          Firmar aprobación
        </Button>
      </div>
      <FeatureRequestSignDialog
        request={request}
        open={signOpen}
        onOpenChange={setSignOpen}
      />
      <FeatureRequestProblemDialog
        request={request}
        open={problemOpen}
        onOpenChange={setProblemOpen}
      />
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {title}
        </h3>
        {hint ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function RequestTab({
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
