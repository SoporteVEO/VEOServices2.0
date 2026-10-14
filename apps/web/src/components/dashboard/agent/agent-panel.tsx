"use client";

import { useRef, useState, type PointerEvent } from "react";
import { History, MessageSquare, SquarePen, X } from "lucide-react";
import { AGENT_FEATURE_NAME } from "@/lib/agent-brand";
import { cn } from "@/lib/utils";
import { AgentConversation } from "./agent-conversation";
import { AgentIconButton } from "./agent-icon-button";
import { useAgentPanel } from "./agent-panel-context";
import { NexoAvatar } from "./nexo-avatar";
import { AgentThreadList } from "./agent-thread-list";

const WIDTH_STORAGE_KEY = "veo-agent-panel-width";
const DEFAULT_WIDTH = 440;
const MIN_WIDTH = 360;
const MAX_WIDTH = 900;

function clampWidth(width: number) {
  const viewportMax =
    typeof window !== "undefined"
      ? Math.floor(window.innerWidth * 0.65)
      : MAX_WIDTH;
  return Math.round(
    Math.min(Math.max(width, MIN_WIDTH), Math.min(MAX_WIDTH, viewportMax)),
  );
}

function readStoredWidth() {
  if (typeof window === "undefined") return DEFAULT_WIDTH;
  const stored = Number(localStorage.getItem(WIDTH_STORAGE_KEY));
  return Number.isFinite(stored) && stored > 0
    ? clampWidth(stored)
    : DEFAULT_WIDTH;
}

export function AgentPanel() {
  const { open, setOpen, session, startNewChat, selectThread, handleDeleted } =
    useAgentPanel();
  const [view, setView] = useState<"chat" | "history">("chat");
  const [width, setWidth] = useState(readStoredWidth);
  const [resizing, setResizing] = useState(false);
  const dragStart = useRef<{ x: number; width: number } | null>(null);

  if (!open) return null;

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX, width };
    setResizing(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    setWidth(
      clampWidth(dragStart.current.width + dragStart.current.x - event.clientX),
    );
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStart.current = null;
    setResizing(false);
    localStorage.setItem(WIDTH_STORAGE_KEY, String(width));
  }

  return (
    <aside
      aria-label={AGENT_FEATURE_NAME}
      style={{ "--agent-panel-width": `${width}px` } as React.CSSProperties}
      className={cn(
        "flex flex-col bg-background",
        "max-md:fixed max-md:inset-0 max-md:z-50",
        "md:sticky md:top-0 md:h-svh md:w-(--agent-panel-width) md:shrink-0 md:border-l md:border-border",
        resizing && "select-none",
      )}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={`Redimensionar ${AGENT_FEATURE_NAME}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={() => {
          setWidth(DEFAULT_WIDTH);
          localStorage.setItem(WIDTH_STORAGE_KEY, String(DEFAULT_WIDTH));
        }}
        className={cn(
          "absolute inset-y-0 -left-1 z-10 hidden w-2 cursor-col-resize md:block",
          "after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:transition-colors",
          "hover:after:bg-primary/60",
          resizing && "after:bg-primary",
        )}
      />

      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-zinc-950 ring-1 ring-primary/30">
          <NexoAvatar size={28} priority />
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">
          {AGENT_FEATURE_NAME}
        </p>
        {view === "chat" ? (
          <AgentIconButton
            side="bottom"
            label="Historial"
            icon={History}
            onClick={() => setView("history")}
          />
        ) : (
          <AgentIconButton
            side="bottom"
            label="Volver al chat"
            icon={MessageSquare}
            onClick={() => setView("chat")}
          />
        )}
        <AgentIconButton
          side="bottom"
          label="Nueva conversación"
          icon={SquarePen}
          onClick={() => {
            startNewChat();
            setView("chat");
          }}
        />
        <AgentIconButton
          side="bottom"
          label="Cerrar"
          icon={X}
          onClick={() => setOpen(false)}
        />
      </div>

      {view === "history" ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AgentThreadList
            activeId={session.id}
            onSelect={(id) => {
              selectThread(id);
              setView("chat");
            }}
            onDeleted={handleDeleted}
          />
        </div>
      ) : (
        <AgentConversation key={session.id} session={session} />
      )}
    </aside>
  );
}
