"use client";

import Link from "next/link";
import { Clock, FileQuestion } from "lucide-react";
import { useAcademyArticle, useAcademyIndex } from "@/api/academy/academy.get";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AcademyArticleFooter } from "./academy-article-footer";
import { ACADEMY_BASE_PATH } from "./academy-links";
import { AcademyMarkdown } from "./academy-markdown";
import { AcademyModuleButton } from "./academy-module-button";
import { AcademySidebarNav } from "./academy-sidebar-nav";
import { AcademyToc } from "./academy-toc";

function scrollToHash(node: HTMLDivElement | null) {
  const id = decodeURIComponent(window.location.hash.slice(1));
  if (node && id) document.getElementById(id)?.scrollIntoView();
}

function ArticleSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function ArticleNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <FileQuestion className="size-10 text-muted-foreground" />
      <p className="font-semibold">No encontramos esta guía</p>
      <p className="text-sm text-muted-foreground">
        Puede que el enlace haya cambiado. Busca el tema desde el inicio de la
        Academy.
      </p>
      <Button asChild variant="outline" sizeVariant="sm">
        <Link href={ACADEMY_BASE_PATH}>Ir a VEO Academy</Link>
      </Button>
    </div>
  );
}

export function AcademyArticlePage({ slug }: { slug: string }) {
  const { data: article, isLoading, isError } = useAcademyArticle(slug);
  const { data: index } = useAcademyIndex();
  const category = index?.categories.find((c) => c.id === article?.category);

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 @3xl/main:grid-cols-[220px_minmax(0,1fr)] @6xl/main:grid-cols-[220px_minmax(0,1fr)_200px]">
      <aside className="sticky top-0 hidden max-h-[calc(100vh-7rem)] self-start overflow-y-auto pb-6 @3xl/main:block">
        <AcademySidebarNav activeSlug={slug} />
      </aside>

      <article className="min-w-0 max-w-3xl">
        {isLoading ? (
          <ArticleSkeleton />
        ) : isError || !article ? (
          <ArticleNotFound />
        ) : (
          <>
            <header className="mb-6 border-b border-border pb-5">
              <p className="text-xs font-medium text-muted-foreground">
                <Link href={ACADEMY_BASE_PATH} className="hover:text-foreground">
                  VEO Academy
                </Link>
                {category ? ` / ${category.title}` : null}
              </p>
              <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                {article.title}
              </h1>
              <p className="mt-2 text-muted-foreground">{article.summary}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="mr-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {article.minutes} min de lectura
                </span>
                {article.modules.map((module) => (
                  <AcademyModuleButton key={module.href} {...module} />
                ))}
              </div>
            </header>

            <div key={article.slug} ref={scrollToHash}>
              <AcademyMarkdown body={article.body} />
            </div>

            <AcademyArticleFooter article={article} />
          </>
        )}
      </article>

      <aside className="sticky top-0 hidden max-h-[calc(100vh-7rem)] self-start overflow-y-auto @6xl/main:block">
        {article ? <AcademyToc headings={article.headings} /> : null}
      </aside>
    </div>
  );
}
