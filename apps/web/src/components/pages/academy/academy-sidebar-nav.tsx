"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useAcademyIndex } from "@/api/academy/academy.get";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { cn } from "@/lib/utils";
import { ACADEMY_BASE_PATH } from "./academy-links";

export function AcademySidebarNav({ activeSlug }: { activeSlug: string }) {
  const { data: index } = useAcademyIndex();

  return (
    <nav aria-label="Guías de VEO Academy" className="space-y-5 text-sm">
      <Link
        href={ACADEMY_BASE_PATH}
        className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Inicio de la Academy
      </Link>
      {!index
        ? Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))
        : index.categories.map((category) => (
            <div key={category.id}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {category.title}
              </p>
              <ul className="space-y-px border-l border-border">
                {category.articles.map((article) => {
                  const active = article.slug === activeSlug;
                  return (
                    <li key={article.slug}>
                      <Link
                        href={article.url}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "-ml-px block border-l-2 py-1 pr-2 pl-3 leading-snug transition-colors",
                          active
                            ? "border-veo-lime font-medium text-foreground"
                            : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                        )}
                      >
                        {article.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
    </nav>
  );
}
