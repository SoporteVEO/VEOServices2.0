import { defaultUrlTransform } from "react-markdown";

export const ACADEMY_BASE_PATH = "/dashboard/academy";

/** Must stay identical to `slugifyHeading` in the API so anchors match. */
export function slugifyHeading(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function academyArticlePath(slug: string, anchor?: string): string {
  return `${ACADEMY_BASE_PATH}/${slug}${anchor ? `#${anchor}` : ""}`;
}

export type AcademyHref =
  | { kind: "article"; slug: string; anchor?: string }
  | { kind: "section"; anchor: string }
  | { kind: "module"; path: string }
  | { kind: "external"; href: string };

export function parseAcademyHref(href: string): AcademyHref {
  if (href.startsWith("academy:")) {
    const [slug, anchor] = href.slice("academy:".length).split("#");
    return { kind: "article", slug, anchor };
  }
  if (href.startsWith("app:")) return { kind: "module", path: href.slice(4) };
  if (href.startsWith("#")) return { kind: "section", anchor: href.slice(1) };
  return { kind: "external", href };
}

export function academyUrlTransform(url: string): string {
  return url.startsWith("academy:") || url.startsWith("app:")
    ? url
    : defaultUrlTransform(url);
}
