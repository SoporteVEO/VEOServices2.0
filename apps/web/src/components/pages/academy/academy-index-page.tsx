"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { useAcademyIndex } from "@/api/academy/academy.get";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { AcademyAskNexo } from "./academy-ask-nexo";
import { academyCategoryIcon } from "./academy-icons";
import { AcademySearch } from "./academy-search";
import { AcademySalesRoute } from "./academy-sales-route";

export function AcademyIndexPage() {
  const { data: index, isLoading } = useAcademyIndex();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-md border border-border bg-card px-5 py-8 sm:px-8">
        <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-veo-lime" />
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <BookOpen className="size-3.5" />
          VEO Academy
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Aprende a sacarle provecho a VEO Services
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Guías cortas y paso a paso para cotizar, cerrar ventas, enviar
          reportes a clientes y trabajar en el CRM. Haz clic en las palabras
          resaltadas para saltar entre temas.
        </p>
        <AcademySearch className="mt-5 max-w-2xl" />
      </section>

      <AcademySalesRoute />

      {isLoading || !index ? (
        <div className="grid gap-4 @2xl/main:grid-cols-2 @5xl/main:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 @2xl/main:grid-cols-2 @5xl/main:grid-cols-3">
          {index.categories.map((category) => {
            const Icon = academyCategoryIcon(category.icon);
            return (
              <Card key={category.id} className="gap-3">
                <CardHeader className="gap-1.5">
                  <span className="flex size-9 items-center justify-center rounded-md bg-veo-lime/15 text-foreground">
                    <Icon className="size-4.5" />
                  </span>
                  <h2 className="mt-1 font-heading text-lg font-semibold">
                    {category.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="-mx-2 space-y-0.5">
                    {category.articles.map((article) => (
                      <li key={article.slug}>
                        <Link
                          href={article.url}
                          className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {article.title}
                          </span>
                          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {article.minutes} min
                          </span>
                          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AcademyAskNexo />
    </div>
  );
}
