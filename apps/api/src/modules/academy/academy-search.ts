import type { AcademySearchResult } from './academy.types.js';
import { ACADEMY_ENTRIES } from './academy-content.js';
import {
  articleUrl,
  normalizeSearch,
  plainText,
  splitSections,
} from './academy-text.js';

const STOP_WORDS = new Set([
  'a',
  'al',
  'como',
  'con',
  'cual',
  'de',
  'del',
  'el',
  'en',
  'es',
  'esta',
  'hacer',
  'hago',
  'la',
  'las',
  'lo',
  'los',
  'me',
  'mi',
  'mis',
  'o',
  'para',
  'por',
  'puedo',
  'que',
  'se',
  'si',
  'su',
  'un',
  'una',
  'y',
  'yo',
]);

const SNIPPET_LENGTH = 220;

function words(query: string): string[] {
  return normalizeSearch(query)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

/** Crude Spanish stemming so "envío", "enviar" and "enviado" match. */
function stem(word: string): string {
  if (word.length <= 4) return word;
  if (word.length <= 6) return word.slice(0, 4);
  return word.slice(0, -2);
}

function countHits(haystack: string, tokens: string[]): number {
  return tokens.reduce(
    (hits, token) => hits + (haystack.includes(token) ? 1 : 0),
    0,
  );
}

function buildSnippet(text: string, tokens: string[]): string {
  const plain = plainText(text);
  const normalized = normalizeSearch(plain);
  const firstHit = tokens
    .map((token) => normalized.indexOf(token))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  const start = Math.max(0, (firstHit ?? 0) - 60);
  const snippet = plain.slice(start, start + SNIPPET_LENGTH).trim();
  return `${start > 0 ? '…' : ''}${snippet}${start + SNIPPET_LENGTH < plain.length ? '…' : ''}`;
}

export function searchAcademy(query: string, limit = 8): AcademySearchResult[] {
  const queryWords = words(query);
  if (queryWords.length === 0) return [];
  const tokens = queryWords.map(stem);
  const phrase = queryWords.join(' ');

  const results: AcademySearchResult[] = [];
  for (const { source, meta } of ACADEMY_ENTRIES) {
    const title = normalizeSearch(source.title);
    const tags = normalizeSearch(source.tags.join(' '));
    const summary = normalizeSearch(source.summary);

    let score =
      countHits(title, tokens) * 6 +
      countHits(tags, tokens) * 5 +
      countHits(summary, tokens) * 3;
    if (title.includes(phrase) || tags.includes(phrase)) score += 10;

    let bestSection: { id: string; title: string; text: string } | null = null;
    let bestSectionScore = 0;
    for (const section of splitSections(source.body)) {
      const heading = normalizeSearch(section.heading?.title ?? '');
      const body = normalizeSearch(section.text);
      const exactHeading =
        heading !== '' && words(heading).join(' ') === phrase;
      const sectionScore =
        countHits(heading, tokens) * 4 +
        countHits(body, tokens) * 1.5 +
        (exactHeading ? 12 : 0);
      if (sectionScore > bestSectionScore) {
        bestSectionScore = sectionScore;
        bestSection = section.heading
          ? {
              id: section.heading.id,
              title: section.heading.title,
              text: section.text,
            }
          : { id: '', title: '', text: section.text };
      }
    }
    score += bestSectionScore;
    if (score === 0) continue;

    const coverage = countHits(
      `${title} ${tags} ${summary} ${normalizeSearch(source.body)}`,
      tokens,
    );
    score *= 0.4 + (0.6 * coverage) / tokens.length;

    results.push({
      ...meta,
      section:
        bestSection && bestSection.id
          ? {
              id: bestSection.id,
              title: bestSection.title,
              url: articleUrl(source.slug, bestSection.id),
            }
          : null,
      snippet: buildSnippet(bestSection?.text || source.summary, tokens),
      score: Math.round(score * 10) / 10,
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
