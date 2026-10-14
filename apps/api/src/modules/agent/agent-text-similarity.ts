const STOPWORDS = new Set(
  `para por con sin del las los una uno unos unas que como cual cuales cuanto cuanta cuantos cuantas
  donde cuando quien este esta estos estas ese esa esos esas aquel sus mis tus nos les fue son ser
  hay han has hemos esta estan dame dime muestrame quiero quisiera necesito puedes podrias favor
  porfa solo solamente tambien pero mas menos muy todo toda todos todas cada entre sobre hasta desde
  the and for with from what which`
    .split(/\s+/)
    .filter(Boolean),
);

export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const STEM_LENGTH = 6;

/** Crude prefix stem so "compras", "comprado" and "compró" all match. */
function stem(token: string): string {
  if (/^\d+$/.test(token)) return token;
  const singular =
    token.length > 4 && token.endsWith('s') ? token.slice(0, -1) : token;
  return singular.slice(0, STEM_LENGTH);
}

export function tokenize(text: string): Set<string> {
  return new Set(
    normalizeText(text)
      .split(' ')
      .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
      .map(stem),
  );
}

export interface Ranked<T> {
  item: T;
  score: number;
}

/**
 * IDF-weighted cosine similarity over word sets, so frequent words such as
 * "ventas" count less than distinctive ones such as a client name.
 */
export function rankBySimilarity<T>(
  query: string,
  items: T[],
  textOf: (item: T) => string,
  { limit, minScore }: { limit: number; minScore: number },
): Ranked<T>[] {
  const queryTokens = tokenize(query);
  if (queryTokens.size === 0 || items.length === 0) return [];

  const docs = items.map((item) => tokenize(textOf(item)));
  const df = new Map<string, number>();
  for (const doc of docs) {
    for (const token of doc) df.set(token, (df.get(token) ?? 0) + 1);
  }
  const weight = (token: string) =>
    Math.log(1 + (docs.length + 1) / ((df.get(token) ?? 0) + 1));
  const norm = (tokens: Set<string>) =>
    Math.sqrt([...tokens].reduce((sum, t) => sum + weight(t) ** 2, 0));

  const queryNorm = norm(queryTokens);
  return docs
    .map((doc, index) => {
      let dot = 0;
      for (const token of doc)
        if (queryTokens.has(token)) dot += weight(token) ** 2;
      const denominator = queryNorm * norm(doc);
      return { item: items[index], score: denominator ? dot / denominator : 0 };
    })
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
