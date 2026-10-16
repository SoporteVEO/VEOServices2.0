export type AcademyCategoryId =
  | 'primeros-pasos'
  | 'proceso-de-venta'
  | 'reportes'
  | 'operacion'
  | 'finanzas'
  | 'crm'
  | 'referencia';

export interface AcademyCategory {
  id: AcademyCategoryId;
  title: string;
  description: string;
  icon: string;
}

export interface AcademyModuleLink {
  label: string;
  href: string;
}

/**
 * `body` is Markdown. Besides normal links it understands:
 * - `academy:slug` / `academy:slug#section` → another academy article
 * - `#section` → a section of the same article
 * - `app:/dashboard/...` → a button that opens that module
 */
export interface AcademyArticleSource {
  slug: string;
  title: string;
  category: AcademyCategoryId;
  summary: string;
  tags: string[];
  modules?: AcademyModuleLink[];
  related?: string[];
  body: string;
}

export interface AcademyHeading {
  id: string;
  title: string;
  level: 2 | 3;
}

export interface AcademyArticleMeta {
  slug: string;
  title: string;
  category: AcademyCategoryId;
  summary: string;
  tags: string[];
  minutes: number;
  url: string;
}

export interface AcademyIndex {
  categories: (AcademyCategory & { articles: AcademyArticleMeta[] })[];
}

export interface AcademyArticle extends AcademyArticleMeta {
  body: string;
  headings: AcademyHeading[];
  modules: AcademyModuleLink[];
  related: AcademyArticleMeta[];
  previous: AcademyArticleMeta | null;
  next: AcademyArticleMeta | null;
}

export interface AcademySearchResult extends AcademyArticleMeta {
  section: { id: string; title: string; url: string } | null;
  snippet: string;
  score: number;
}
