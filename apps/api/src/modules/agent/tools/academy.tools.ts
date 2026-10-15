import { z } from 'zod';
import { defineTool } from '../agent-sdk.js';
import { toModelText } from './agent-tool-context.js';
import { buildAcademyArticle } from '../../academy/academy-content.js';
import { searchAcademy } from '../../academy/academy-search.js';
import { resolveLinks } from '../../academy/academy-text.js';

export function buildAcademyTools() {
  return {
    search_academy: defineTool({
      description:
        'Searches VEO Academy, the internal how-to guides of VEO Services (sales process, quotes, Brilo contracts, accepting quotes, sending the contract for signature, photo uploads, monthly/installation/maintenance reports, production, screens, maintenance, CRM, glossary, FAQ). Use it for any "how do I", "where is", "what does X mean" or process question about using the platform. Returns the best matching articles with the most relevant section, a snippet and its URL.',
      inputSchema: z.object({
        query: z
          .string()
          .min(2)
          .max(200)
          .describe(
            'What the user wants to do or know, in Spanish, e.g. "enviar reporte mensual".',
          ),
      }),
      execute: ({ query }) => {
        const results = searchAcademy(query, 5).map((result) => ({
          slug: result.slug,
          title: result.title,
          summary: result.summary,
          section: result.section,
          url: result.section?.url ?? result.url,
          snippet: result.snippet,
        }));
        return { results };
      },
      toModelOutput: ({ output }) => toModelText(output),
    }),
    get_academy_article: defineTool({
      description:
        'Reads a full VEO Academy article by slug (from search_academy). The body is Markdown whose links are already app paths: academy links point to /dashboard/academy/... and module links to /dashboard/... Answer from it and share the most relevant link.',
      inputSchema: z.object({
        slug: z.string().min(1).max(80),
      }),
      execute: ({ slug }) => {
        const article = buildAcademyArticle(slug);
        if (!article)
          return { ok: false as const, error: 'Artículo no encontrado' };
        return {
          ok: true as const,
          title: article.title,
          url: article.url,
          sections: article.headings.map((heading) => ({
            title: heading.title,
            url: `${article.url}#${heading.id}`,
          })),
          modules: article.modules,
          body: resolveLinks(article.body, article.slug),
        };
      },
      toModelOutput: ({ output }) => toModelText(output),
    }),
  };
}
