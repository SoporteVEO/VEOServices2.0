import type { AcademyHeading } from './academy.types.js';

export const ACADEMY_BASE_PATH = '/dashboard/academy';

/** Must stay identical to `slugifyHeading` in the web app so anchors match. */
export function slugifyHeading(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const HEADING_RE = /^(#{2,3})\s+(.+?)\s*$/;

export function extractHeadings(body: string): AcademyHeading[] {
  const headings: AcademyHeading[] = [];
  let inCode = false;
  for (const line of body.split('\n')) {
    if (line.trimStart().startsWith('```')) inCode = !inCode;
    if (inCode) continue;
    const match = HEADING_RE.exec(line);
    if (!match) continue;
    const title = plainText(match[2]);
    headings.push({
      id: slugifyHeading(title),
      title,
      level: match[1].length as 2 | 3,
    });
  }
  return headings;
}

export interface AcademySection {
  heading: AcademyHeading | null;
  text: string;
}

export function splitSections(body: string): AcademySection[] {
  const sections: AcademySection[] = [{ heading: null, text: '' }];
  let inCode = false;
  for (const line of body.split('\n')) {
    if (line.trimStart().startsWith('```')) inCode = !inCode;
    const match = inCode ? null : HEADING_RE.exec(line);
    if (match) {
      const title = plainText(match[2]);
      sections.push({
        heading: {
          id: slugifyHeading(title),
          title,
          level: match[1].length as 2 | 3,
        },
        text: '',
      });
      continue;
    }
    sections[sections.length - 1].text += `${line}\n`;
  }
  return sections;
}

/** Markdown → readable text: keeps link labels, drops syntax. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function readingMinutes(body: string): number {
  const words = plainText(body).split(' ').length;
  return Math.max(1, Math.round(words / 200));
}

export function articleUrl(slug: string, anchor?: string): string {
  return `${ACADEMY_BASE_PATH}/${slug}${anchor ? `#${anchor}` : ''}`;
}

/** Rewrites academy-only link schemes into plain app paths (for Nexo). */
export function resolveLinks(body: string, currentSlug: string): string {
  return body.replace(
    /\]\((academy:|app:|#)([^)]*)\)/g,
    (_match, scheme: string, target: string) => {
      if (scheme === 'app:') return `](${target})`;
      if (scheme === '#') return `](${articleUrl(currentSlug, target)})`;
      const [slug, anchor] = target.split('#');
      return `](${articleUrl(slug, anchor)})`;
    },
  );
}

export const ACADEMY_LINK_RE = /\]\((academy:|#)([^)]*)\)/g;
