"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, Clock } from "lucide-react";
import { useAcademyIndex } from "@/api/academy/academy.get";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/primitives/ui/hover-card";
import { academyArticlePath } from "./academy-links";

export function AcademyArticleLink({
  slug,
  anchor,
  children,
}: {
  slug: string;
  anchor?: string;
  children: ReactNode;
}) {
  const { data: index } = useAcademyIndex();
  const category = index?.categories.find((c) =>
    c.articles.some((article) => article.slug === slug),
  );
  const article = category?.articles.find((a) => a.slug === slug);

  return (
    <HoverCard openDelay={250} closeDelay={80}>
      <HoverCardTrigger asChild>
        <Link
          href={academyArticlePath(slug, anchor)}
          className="font-medium text-info underline decoration-info/40 underline-offset-2 transition-colors hover:decoration-info"
        >
          {children}
        </Link>
      </HoverCardTrigger>
      {article ? (
        <HoverCardContent align="start" className="w-72 space-y-1.5">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <BookOpen className="size-3" />
            {category?.title}
          </p>
          <p className="font-semibold leading-snug">{article.title}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {article.summary}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="size-3" />
            {article.minutes} min de lectura
          </p>
        </HoverCardContent>
      ) : null}
    </HoverCard>
  );
}
