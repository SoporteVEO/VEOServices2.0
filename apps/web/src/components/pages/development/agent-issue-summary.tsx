import type { AgentIssue } from "@/api/development/agent-issues.types";

export function AgentIssueSummary({ issue }: { issue: AgentIssue }) {
  return (
    <div className="flex flex-col gap-3">
      <Block title="Solicitud del usuario">
        <blockquote className="border-l-2 border-primary/60 pl-3 text-sm italic">
          {issue.userRequest}
        </blockquote>
      </Block>

      <Block title="Qué pasó">
        <p className="whitespace-pre-wrap text-sm">{issue.summary}</p>
      </Block>

      <Block title="Análisis técnico de Nexo">
        <p className="whitespace-pre-wrap text-sm">{issue.technicalDetails}</p>
      </Block>

      {issue.stepsToReproduce.length > 0 ? (
        <Block title="Pasos para reproducir">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {issue.stepsToReproduce.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </Block>
      ) : null}

      {issue.expectedBehavior ? (
        <Block title="Comportamiento esperado">
          <p className="whitespace-pre-wrap text-sm">
            {issue.expectedBehavior}
          </p>
        </Block>
      ) : null}
    </div>
  );
}

export function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-3">
      <h4 className="pb-1.5 text-xs font-semibold text-muted-foreground">
        {title}
      </h4>
      {children}
    </section>
  );
}
