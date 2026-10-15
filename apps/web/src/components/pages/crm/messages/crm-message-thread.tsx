"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle, Check, CheckCheck, Mail, MessageCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useCrmMessages } from "@/api/crm/crm.get";
import { useSyncCrmEmail } from "@/api/crm/crm.mutations";
import type { CrmContextQuery, CrmMessage } from "@/api/crm/crm.types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MESSAGE_STATUS_LABELS } from "../crm-const";
import { errorMessage, personName } from "../crm-format";
import { EmptyList, ListSkeleton } from "../dashboard/crm-dashboard-lists";
import { MarkdownPreview } from "../templates/markdown-preview";
import { CrmEmailComposeDialog } from "./crm-email-compose-dialog";
import { CrmWhatsAppComposeDialog } from "./crm-whatsapp-compose-dialog";

export interface MessageRecipient {
  email?: string | null;
  whatsapp?: string | null;
}

interface CrmMessageThreadProps {
  context: CrmContextQuery;
  recipient: MessageRecipient;
}

export function CrmMessageThread({ context, recipient }: CrmMessageThreadProps) {
  const { data: messages = [], isLoading } = useCrmMessages(context);
  const syncEmail = useSyncCrmEmail();
  const [emailOpen, setEmailOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<CrmMessage | null>(null);
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  function handleSync() {
    syncEmail.mutate(context, {
      onSuccess: ({ imported }) =>
        toast.success(
          imported > 0
            ? `${imported} respuesta${imported === 1 ? "" : "s"} importada${imported === 1 ? "" : "s"}`
            : "No hay respuestas nuevas",
        ),
      onError: (error) =>
        toast.error(errorMessage(error, "No se pudo sincronizar el correo.")),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          sizeVariant="sm"
          icon={Mail}
          onClick={() => {
            setReplyTo(null);
            setEmailOpen(true);
          }}
        >
          Enviar correo
        </Button>
        <Button
          sizeVariant="sm"
          variant="outline"
          icon={MessageCircle}
          onClick={() => setWhatsappOpen(true)}
        >
          WhatsApp
        </Button>
        <Button
          sizeVariant="sm"
          variant="ghost"
          icon={RefreshCw}
          className="ml-auto"
          loading={syncEmail.isPending}
          onClick={handleSync}
        >
          Sincronizar respuestas
        </Button>
      </div>

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : messages.length === 0 ? (
        <EmptyList message="Aún no hay mensajes. Envía el primero." />
      ) : (
        <ol className="flex flex-col gap-3">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onReply={
                message.channel === "EMAIL" && message.threadId
                  ? () => {
                      setReplyTo(message);
                      setEmailOpen(true);
                    }
                  : undefined
              }
            />
          ))}
        </ol>
      )}

      <CrmEmailComposeDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        context={context}
        defaultTo={
          replyTo
            ? [replyTo.direction === "INBOUND" ? (replyTo.fromAddress ?? "") : replyTo.toAddress]
            : recipient.email
              ? [recipient.email]
              : []
        }
        replyTo={replyTo}
      />
      <CrmWhatsAppComposeDialog
        open={whatsappOpen}
        onOpenChange={setWhatsappOpen}
        context={context}
        defaultTo={recipient.whatsapp ?? ""}
      />
    </div>
  );
}

function StatusIcon({ message }: { message: CrmMessage }) {
  if (message.status === "FAILED") return <AlertCircle className="size-3 text-destructive" />;
  if (message.status === "READ") return <CheckCheck className="size-3 text-info" />;
  if (message.status === "DELIVERED") return <CheckCheck className="size-3" />;
  if (message.status === "SENT") return <Check className="size-3" />;
  return null;
}

function MessageBubble({
  message,
  onReply,
}: {
  message: CrmMessage;
  onReply?: () => void;
}) {
  const outbound = message.direction === "OUTBOUND";
  const ChannelIcon = message.channel === "EMAIL" ? Mail : MessageCircle;

  return (
    <li className={cn("flex", outbound ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "flex max-w-[88%] flex-col gap-1.5 border p-3",
          outbound ? "border-veo-dark/15 bg-veo-ice/50 dark:bg-veo-dark-80" : "border-border bg-card",
          message.status === "FAILED" && "border-destructive/40",
        )}
      >
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ChannelIcon className="size-3" />
          <span className="truncate">
            {outbound
              ? `${message.user ? personName(message.user) : "Tú"} → ${message.toAddress}`
              : (message.fromAddress ?? "Cliente")}
          </span>
        </div>
        {message.subject ? (
          <p className="text-sm font-semibold">{message.subject}</p>
        ) : null}
        {message.channel === "EMAIL" ? (
          <MarkdownPreview markdown={message.body} className="text-[13px]" />
        ) : (
          <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
        )}
        {message.error ? (
          <p className="text-xs text-destructive">{message.error}</p>
        ) : null}
        <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            {format(new Date(message.sentAt), "d MMM yyyy, HH:mm", { locale: es })}
            {outbound ? (
              <>
                <span>·</span>
                <StatusIcon message={message} />
                {MESSAGE_STATUS_LABELS[message.status]}
              </>
            ) : null}
            {message.template ? <span>· {message.template.name}</span> : null}
          </span>
          {onReply ? (
            <button
              type="button"
              className="cursor-pointer font-medium hover:text-foreground"
              onClick={onReply}
            >
              Responder
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
