import type {
  AcademyArticle,
  AcademyArticleMeta,
  AcademyArticleSource,
  AcademyHeading,
  AcademyIndex,
} from './academy.types.js';
import {
  ACADEMY_LINK_RE,
  articleUrl,
  extractHeadings,
  readingMinutes,
} from './academy-text.js';
import { ACADEMY_CATEGORIES } from './content/categories.js';
import { CRM } from './content/crm.js';
import { FINANZAS } from './content/finanzas.js';
import { OPERACION } from './content/operacion.js';
import { PRIMEROS_PASOS } from './content/primeros-pasos.js';
import { PROCESO_DE_VENTA } from './content/proceso-de-venta.js';
import { REFERENCIA } from './content/referencia.js';
import { REPORTES } from './content/reportes.js';

export interface AcademyEntry {
  source: AcademyArticleSource;
  meta: AcademyArticleMeta;
  headings: AcademyHeading[];
}

const ORDERED_SOURCES: AcademyArticleSource[] = ACADEMY_CATEGORIES.flatMap(
  (category) =>
    [
      ...PRIMEROS_PASOS,
      ...PROCESO_DE_VENTA,
      ...REPORTES,
      ...OPERACION,
      ...FINANZAS,
      ...CRM,
      ...REFERENCIA,
    ].filter((article) => article.category === category.id),
);

export const ACADEMY_ENTRIES: AcademyEntry[] = ORDERED_SOURCES.map(
  (source) => ({
    source,
    headings: extractHeadings(source.body),
    meta: {
      slug: source.slug,
      title: source.title,
      category: source.category,
      summary: source.summary,
      tags: source.tags,
      minutes: readingMinutes(source.body),
      url: articleUrl(source.slug),
    },
  }),
);

const BY_SLUG = new Map(
  ACADEMY_ENTRIES.map((entry) => [entry.source.slug, entry]),
);

export function findAcademyEntry(slug: string): AcademyEntry | undefined {
  return BY_SLUG.get(slug);
}

export function buildAcademyIndex(): AcademyIndex {
  return {
    categories: ACADEMY_CATEGORIES.map((category) => ({
      ...category,
      articles: ACADEMY_ENTRIES.filter(
        (entry) => entry.meta.category === category.id,
      ).map((entry) => entry.meta),
    })),
  };
}

export function buildAcademyArticle(slug: string): AcademyArticle | null {
  const index = ACADEMY_ENTRIES.findIndex(
    (entry) => entry.source.slug === slug,
  );
  if (index === -1) return null;
  const { source, meta, headings } = ACADEMY_ENTRIES[index];
  return {
    ...meta,
    body: source.body,
    headings,
    modules: source.modules ?? [],
    related: (source.related ?? [])
      .map((relatedSlug) => BY_SLUG.get(relatedSlug)?.meta)
      .filter((related): related is AcademyArticleMeta => Boolean(related)),
    previous: ACADEMY_ENTRIES[index - 1]?.meta ?? null,
    next: ACADEMY_ENTRIES[index + 1]?.meta ?? null,
  };
}

/** Lists `academy:` / `#` links pointing to missing articles or sections. */
export function findBrokenAcademyLinks(): string[] {
  const broken: string[] = [];
  for (const { source, headings } of ACADEMY_ENTRIES) {
    for (const related of source.related ?? []) {
      if (!BY_SLUG.has(related))
        broken.push(`${source.slug} → related:${related}`);
    }
    for (const match of source.body.matchAll(ACADEMY_LINK_RE)) {
      const [scheme, target] = [match[1], match[2]];
      const [slug, anchor] =
        scheme === '#' ? [source.slug, target] : target.split('#');
      const entry = slug === source.slug ? { headings } : BY_SLUG.get(slug);
      if (!entry) {
        broken.push(`${source.slug} → ${slug}`);
        continue;
      }
      if (anchor && !entry.headings.some((heading) => heading.id === anchor)) {
        broken.push(`${source.slug} → ${slug}#${anchor}`);
      }
    }
  }
  return broken;
}
