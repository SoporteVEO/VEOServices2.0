"use client";

import {
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { FileUIPart } from "ai";
import { ArrowUp, Paperclip, Square } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  AGENT_ATTACHMENT_ACCEPT,
  MAX_AGENT_ATTACHMENTS,
  isSupportedAttachment,
  toAgentFilePart,
} from "@/lib/agent-attachments";
import { AGENT_NAME } from "@/lib/agent-brand";
import { cn } from "@/lib/utils";
import { AgentAttachmentList } from "./agent-attachment-list";
import { AgentIconButton } from "./agent-icon-button";

interface AgentComposerProps {
  isBusy: boolean;
  disabled?: boolean;
  initialText?: string;
  onSend: (text: string, files: FileUIPart[]) => void;
  onStop: () => void;
}

export function AgentComposer({
  isBusy,
  disabled,
  initialText = "",
  onSend,
  onStop,
}: AgentComposerProps) {
  const [text, setText] = useState(initialText);
  const [files, setFiles] = useState<FileUIPart[]>([]);
  const [reading, setReading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasContent = text.trim().length > 0 || files.length > 0;
  const canSend = hasContent && !isBusy && !disabled && reading === 0;

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!canSend) return;
    onSend(text.trim(), files);
    setText("");
    setFiles([]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit();
    }
  }

  async function addFiles(list: File[]) {
    const accepted = list.filter(isSupportedAttachment);
    if (accepted.length < list.length) {
      toast.error("Solo puedes adjuntar imágenes, PDF, Excel, CSV o texto.");
    }
    const room = MAX_AGENT_ATTACHMENTS - files.length;
    if (accepted.length > room) {
      toast.error(
        `Puedes adjuntar hasta ${MAX_AGENT_ATTACHMENTS} archivos por mensaje.`,
      );
    }
    const batch = accepted.slice(0, Math.max(room, 0));
    if (batch.length === 0) return;

    setReading((count) => count + batch.length);
    const results = await Promise.allSettled(batch.map(toAgentFilePart));
    setReading((count) => count - batch.length);

    const parts: FileUIPart[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") parts.push(result.value);
      else
        toast.error(
          result.reason instanceof Error
            ? result.reason.message
            : "No se pudo leer el archivo.",
        );
    }
    setFiles((current) =>
      [...current, ...parts].slice(0, MAX_AGENT_ATTACHMENTS),
    );
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const pasted = Array.from(event.clipboardData.files);
    if (pasted.length === 0) return;
    event.preventDefault();
    void addFiles(pasted);
  }

  function handleDrop(event: DragEvent<HTMLFormElement>) {
    event.preventDefault();
    setDragging(false);
    void addFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <form
      onSubmit={submit}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setDragging(false);
        }
      }}
      onDrop={handleDrop}
      className={cn(
        "relative border-t border-border bg-card p-3",
        dragging && "outline-2 -outline-offset-4 outline-dashed outline-veo-lime",
      )}
    >
      <AgentAttachmentList
        files={files}
        onRemove={(index) =>
          setFiles((current) => current.filter((_, i) => i !== index))
        }
        className="mb-2"
      />
      <div className="relative">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={`Pregúntale algo a ${AGENT_NAME}…`}
          rows={2}
          maxLength={4000}
          disabled={disabled}
          className="max-h-40 min-h-16 resize-none pr-12"
          aria-label={`Mensaje para ${AGENT_NAME}`}
        />
        <div className="absolute bottom-2 right-2 flex">
          {isBusy ? (
            <AgentIconButton
              type="button"
              variant="secondary"
              label="Detener respuesta"
              icon={Square}
              iconClassName="size-3.5 fill-current"
              onClick={onStop}
            />
          ) : (
            <AgentIconButton
              type="submit"
              variant="default"
              label="Enviar (Enter)"
              icon={ArrowUp}
              disabled={!canSend}
            />
          )}
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <AgentIconButton
          type="button"
          label="Adjuntar archivos (imágenes, PDF, Excel, CSV)"
          icon={Paperclip}
          loading={reading > 0}
          disabled={disabled || files.length >= MAX_AGENT_ATTACHMENTS}
          onClick={() => inputRef.current?.click()}
          className="size-6"
        />
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept={AGENT_ATTACHMENT_ACCEPT}
          onChange={(event) => {
            void addFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
        <p className="text-[11px] text-muted-foreground">
          Enter para enviar · Shift + Enter para nueva línea · Arrastra o pega
          archivos
        </p>
      </div>
    </form>
  );
}
