"use client";

import { AskNexoButton } from "@/components/dashboard/agent/ask-nexo-button";
import { NexoAvatar } from "@/components/dashboard/agent/nexo-avatar";
import { AGENT_NAME } from "@/lib/agent-brand";
import { academyArticlePath } from "./academy-links";

interface AcademyAskNexoProps {
  article?: { slug: string; title: string };
}

function askPrompt(article: AcademyAskNexoProps["article"]) {
  if (!article) {
    return `Hola ${AGENT_NAME}, quiero aprender a usar VEO Services. ¿Por dónde me recomiendas empezar según mi rol?`;
  }
  return `Hola ${AGENT_NAME}, necesito que me des más información acerca de este artículo de la Academy: [${article.title}](${academyArticlePath(article.slug)})`;
}

export function AcademyAskNexo({ article }: AcademyAskNexoProps) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/40 p-4 sm:flex-row sm:items-center">
      <span className="flex size-10 shrink-0 items-center justify-center bg-veo-dark">
        <NexoAvatar size={34} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">¿Te quedó alguna duda?</p>
        <p className="text-sm text-muted-foreground">
          {AGENT_NAME} conoce todas las guías de la Academy y te responde con
          tus propias palabras.
        </p>
      </div>
      <AskNexoButton
        sizeVariant="sm"
        variant="default"
        prompt={askPrompt(article)}
        hint={
          article
            ? `${AGENT_NAME} te explica este artículo con más detalle`
            : `${AGENT_NAME} te arma una ruta de aprendizaje`
        }
      />
    </div>
  );
}
