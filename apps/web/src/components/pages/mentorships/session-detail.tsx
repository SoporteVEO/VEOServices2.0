import { CalendarClock, MessageSquareQuote } from "lucide-react";
import type { MentorshipSession } from "@/api/mentorships/mentorships.types";
import { cn } from "@/lib/utils";
import {
  KSS_FIELDS,
  KSS_ORDER,
  KSS_SECTIONS,
  formatDateTime,
  formatDay,
} from "./const";
import { StartOutcomeBadge } from "./mentorship-badges";
import { PreviousStartSummary } from "./previous-start-evaluation";

export function SessionDetail({ session }: { session: MentorshipSession }) {
  const { previousStart } = session;
  return (
    <div className="flex flex-col gap-6">
      {previousStart ? (
        <Section title="Seguimiento del Start anterior">
          <PreviousStartSummary previousStart={previousStart} />
          {previousStart.outcome ? (
            <div className="flex flex-col gap-1.5">
              <StartOutcomeBadge
                outcome={previousStart.outcome}
                prefix="¿Cumplió?"
              />
              <p className="text-sm whitespace-pre-wrap">
                <span className="text-muted-foreground">Evidencia: </span>
                {previousStart.evidence}
              </p>
            </div>
          ) : null}
        </Section>
      ) : null}

      <Section title="Acuerdos">
        <div className="flex flex-col gap-3">
          {KSS_ORDER.map((kind) => (
            <div
              key={kind}
              className={cn(
                "flex flex-col gap-2 border border-l-4 border-border p-3",
                KSS_SECTIONS[kind].accent,
              )}
            >
              <p className="text-sm font-semibold">
                {KSS_SECTIONS[kind].title}
              </p>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
                {KSS_FIELDS.map((field) => (
                  <div key={field.key} className="contents">
                    <dt className="text-muted-foreground">{field.label}</dt>
                    <dd className="whitespace-pre-wrap">
                      {session[kind][field.key]}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Compromiso y seguimiento">
        <p className="text-sm whitespace-pre-wrap">{session.commitment}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarClock className="size-4" />
          Próximo seguimiento: {formatDay(session.nextFollowUpDate)}
        </p>
      </Section>

      <Section title="Confirmación del colaborador">
        {session.acknowledgedAt ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm">
              Confirmó de recibido el {formatDateTime(session.acknowledgedAt)}.
            </p>
            {session.acknowledgementComment ? (
              <p className="flex gap-2 border-l-2 border-border bg-muted/40 px-3 py-2 text-sm whitespace-pre-wrap">
                <MessageSquareQuote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                {session.acknowledgementComment}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Pendiente de confirmación de recibido.
          </p>
        )}
      </Section>
    </div>
  );
}

export function Section({
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
