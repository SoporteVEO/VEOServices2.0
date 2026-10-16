export const FINANCE_STALE_TIME = 30 * 1000;
export const FINANCE_CATALOG_STALE_TIME = 10 * 60 * 1000;

export function toQueryParams(
  query: object,
): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params[key] = String(value);
  }
  return params;
}
