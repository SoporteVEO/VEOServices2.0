"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useCrmConnections } from "@/api/crm/crm.get";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { CrmGmailCard } from "./crm-gmail-card";
import { CrmPipelinesCard } from "./crm-pipelines-card";
import { CrmWhatsAppCard } from "./crm-whatsapp-card";

interface Props {
  gmailResult?: "connected" | "error";
  gmailReason?: string;
}

export function CrmSettingsPage({ gmailResult, gmailReason }: Props) {
  const { data: connections, isLoading } = useCrmConnections();

  return (
    <div className="flex flex-col gap-4">
      {gmailResult === "connected" ? (
        <div className="flex items-center gap-2 border border-success/40 bg-success-soft p-3 text-sm">
          <CheckCircle2 className="size-4 text-success" />
          Tu cuenta de Gmail quedó conectada. Ya puedes enviar correos desde el CRM.
        </div>
      ) : gmailResult === "error" ? (
        <div className="flex items-start gap-2 border border-destructive/40 bg-destructive-soft p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium">No se pudo conectar Gmail.</p>
            {gmailReason ? <p className="text-xs">{gmailReason}</p> : null}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {isLoading || !connections ? (
          <>
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </>
        ) : (
          <>
            <CrmGmailCard gmail={connections.gmail} />
            <CrmWhatsAppCard whatsapp={connections.whatsapp} />
          </>
        )}
      </div>

      <CrmPipelinesCard />
    </div>
  );
}
