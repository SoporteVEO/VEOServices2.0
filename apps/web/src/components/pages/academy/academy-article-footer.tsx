import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { AcademyArticle } from "@/api/academy/academy.types";
import { AcademyAskNexo } from "./academy-ask-nexo";

export function AcademyArticleFooter({ article }: { article: AcademyArticle }) {
  return (
    <footer className="mt-10 space-y-6 border-t border-border pt-6">
      {article.related.length > 0 ? (
        <section>
          <h2 className="mb-3 font-heading text-base font-semibold">
            Guías relacionadas
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {article.related.map((related) => (
              <Link
                key={related.slug}
                href={related.url}
                className="rounded-md border border-border p-3 transition-colors hover:border-veo-lime hover:bg-veo-lime/5"
              >
                <p className="text-sm font-medium">{related.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {related.summary}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <AcademyAskNexo article={article} />

      <div className="grid gap-2 sm:grid-cols-2">
        {article.previous ? (
          <Link
            href={article.previous.url}
            className="group rounded-md border border-border p-3 transition-colors hover:bg-muted/60"
          >
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowLeft className="size-3" />
              Anterior
            </span>
            <span className="mt-0.5 block text-sm font-medium">
              {article.previous.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {article.next ? (
          <Link
            href={article.next.url}
            className="group rounded-md border border-border p-3 text-right transition-colors hover:bg-muted/60"
          >
            <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              Siguiente
              <ArrowRight className="size-3" />
            </span>
            <span className="mt-0.5 block text-sm font-medium">
              {article.next.title}
            </span>
          </Link>
        ) : null}
      </div>
    </footer>
  );
}
