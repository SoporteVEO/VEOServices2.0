import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  BadgeCheck,
  MessageSquare,
  PenLine,
  Send,
  TriangleAlert,
  UserMinus,
  UserPlus,
} from "lucide-react";
import type {
  FeatureRequestEvent,
  FeatureRequestEventType,
} from "@/api/feature-requests/feature-requests.types";
import { formatDateTime, STATUS_LABELS, userName } from "./const";

const EVENT_ICONS: Record<FeatureRequestEventType, LucideIcon> = {
  CREATED: Send,
  STATUS_CHANGED: ArrowRightLeft,
  COMMENT: MessageSquare,
  COLLABORATOR_ADDED: UserPlus,
  COLLABORATOR_REMOVED: UserMinus,
  SIGNED: PenLine,
  PROBLEM_REPORTED: TriangleAlert,
  APPROVED: BadgeCheck,
};

function describeEvent(event: FeatureRequestEvent): string {
  const actor = userName(event.actor);
  switch (event.type) {
    case "CREATED":
      return `${actor} envió la solicitud`;
    case "STATUS_CHANGED":
      return `${actor} cambió el estado: ${statusLabel(event.fromStatus)} → ${statusLabel(event.toStatus)}`;
    case "COMMENT":
      return `${actor} dejó una nota`;
    case "COLLABORATOR_ADDED":
      return `${event.message ?? "Una persona"} se agregó como colaborador`;
    case "COLLABORATOR_REMOVED":
      return `${event.message ?? "Una persona"} fue quitada de la solicitud`;
    case "SIGNED":
      return `${event.message ?? actor} firmó la aprobación`;
    case "PROBLEM_REPORTED":
      return `${actor} reportó un problema y la solicitud volvió a desarrollo`;
    case "APPROVED":
      return "Todos los participantes firmaron: solicitud aprobada";
  }
}

function statusLabel(status: FeatureRequestEvent["fromStatus"]): string {
  return status ? STATUS_LABELS[status] : "—";
}

/** Events whose `message` is a person's name, not text worth quoting. */
const NAME_MESSAGE_TYPES: FeatureRequestEventType[] = [
  "COLLABORATOR_ADDED",
  "COLLABORATOR_REMOVED",
  "SIGNED",
];

export function FeatureRequestTimeline({
  events,
}: {
  events: FeatureRequestEvent[];
}) {
  return (
    <ol className="flex flex-col">
      {events.map((event, index) => {
        const Icon = EVENT_ICONS[event.type];
        const showNote =
          event.message && !NAME_MESSAGE_TYPES.includes(event.type);
        return (
          <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
            {index < events.length - 1 ? (
              <span
                aria-hidden
                className="absolute top-8 bottom-0 left-4 w-px -translate-x-1/2 bg-border"
              />
            ) : null}
            <div className="relative z-10 flex size-8 shrink-0 items-center justify-center border border-border bg-card text-muted-foreground">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm">{describeEvent(event)}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatDateTime(event.createdAt)}
              </p>
              {showNote ? (
                <p className="mt-1.5 whitespace-pre-wrap border-l-2 border-border bg-muted/40 px-3 py-2 text-sm">
                  {event.message}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
