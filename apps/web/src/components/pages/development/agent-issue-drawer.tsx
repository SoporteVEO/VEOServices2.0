"use client";

import { ClipboardCopy, X } from "lucide-react";
import { toast } from "sonner";
import { useAgentIssue } from "@/api/development/agent-issues.get";
import type { AgentIssue } from "@/api/development/agent-issues.types";
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
import { IssueSeverityBadge, IssueStatusBadge } from "./agent-issue-badges";
import { AgentIssueContextView } from "./agent-issue-context";
import { AgentIssueConversation } from "./agent-issue-conversation";
import { AgentIssueDiagnosticsView } from "./agent-issue-diagnostics";
import { buildIssueMarkdown } from "./agent-issue-markdown";
import { AgentIssueStatusForm } from "./agent-issue-status-form";
import { AgentIssueSummary } from "./agent-issue-summary";
import { formatIssueDateTime, issueUserName } from "./const";

type Props = {
  issueId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AgentIssueDrawer({ issueId, open, onOpenChange }: Props) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      handleOnly
    >
      <DrawerContent className="flex flex-col data-[vaul-drawer-direction=right]:h-screen data-[vaul-drawer-direction=right]:w-[96vw] data-[vaul-drawer-direction=right]:sm:max-w-[820px]">
        {issueId ? (
          <DrawerBody
            key={issueId}
            issueId={issueId}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function DrawerBody({
  issueId,
  onClose,
}: {
  issueId: string;
  onClose: () => void;
}) {
  const { data: issue, isLoading, isError } = useAgentIssue(issueId);

  if (isLoading) {
    return <DetailPanelSkeleton sections={3} />;
  }

  if (isError || !issue) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          No pudimos cargar este ticket.
        </p>
      </div>
    );
  }

  return <IssueContent issue={issue} onClose={onClose} />;
}

function IssueContent({
  issue,
  onClose,
}: {
  issue: AgentIssue;
  onClose: () => void;
}) {
  const toolCount = issue.diagnostics.toolExecutions?.length ?? 0;
  const failureCount =
    (issue.diagnostics.failedToolCalls ?? 0) +
    (issue.diagnostics.apiFailures?.length ?? 0);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildIssueMarkdown(issue));
      toast.success("Reporte copiado en Markdown");
    } catch {
      toast.error("No se pudo copiar el reporte");
    }
  }

  return (
    <>
      <DrawerHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <DrawerTitle className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm">{issue.ticket}</span>
              <IssueStatusBadge status={issue.status} />
              <IssueSeverityBadge severity={issue.severity} />
            </DrawerTitle>
            <p className="text-sm font-medium">{issue.title}</p>
            <DrawerDescription className="truncate">
              {issueUserName(issue.reporter)} ·{" "}
              {formatIssueDateTime(issue.createdAt)}
            </DrawerDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="outline"
              sizeVariant="sm"
              icon={ClipboardCopy}
              onClick={handleCopy}
            >
              Copiar reporte
            </Button>
            <PrimitiveButton
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </PrimitiveButton>
          </div>
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
          <TabsTrigger value="diagnostico" className="px-4">
            Diagnóstico
            {failureCount > 0 ? (
              <span className="ml-1.5 bg-red-500/15 px-1.5 text-[11px] tabular-nums text-red-700 dark:text-red-400">
                {failureCount}
              </span>
            ) : toolCount > 0 ? (
              <span className="ml-1.5 text-[11px] text-muted-foreground tabular-nums">
                {toolCount}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="conversacion" className="px-4">
            Conversación
          </TabsTrigger>
          <TabsTrigger value="contexto" className="px-4">
            Contexto
          </TabsTrigger>
        </TabsList>

        <IssueTab value="resumen">
          <AgentIssueSummary issue={issue} />
        </IssueTab>
        <IssueTab value="diagnostico">
          <AgentIssueDiagnosticsView diagnostics={issue.diagnostics} />
        </IssueTab>
        <IssueTab value="conversacion">
          <AgentIssueConversation
            conversation={issue.diagnostics.conversation}
          />
        </IssueTab>
        <IssueTab value="contexto">
          <AgentIssueContextView issue={issue} />
        </IssueTab>
      </Tabs>

      <DrawerFooter className="border-t">
        <AgentIssueStatusForm key={issue.updatedAt} issue={issue} />
      </DrawerFooter>
    </>
  );
}

function IssueTab({
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
