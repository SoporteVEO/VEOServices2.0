/**
 * Brilo is inconsistent about wrapping payloads in an array or a `data`
 * envelope and about key casing, and v2 list endpoints answer an empty result
 * with `200 { code: "NO_RECORDS" }`. These helpers normalize every shape to
 * camelCase objects.
 */
function camelizeKeys(value: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    normalized[key.charAt(0).toLowerCase() + key.slice(1)] = val;
  }
  return normalized;
}

function unwrapEnvelope(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const envelope = raw as Record<string, unknown>;
    return envelope.data ?? envelope.Data ?? raw;
  }
  return raw;
}

function isNoRecords(raw: unknown): boolean {
  if (typeof raw === 'string') return /no records/i.test(raw);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  const code = (raw as Record<string, unknown>).code;
  return code === 'NO_RECORDS';
}

export function unwrapSingle<T>(raw: unknown): T {
  let value = unwrapEnvelope(raw);
  if (Array.isArray(value)) value = value[0];
  if (!value || typeof value !== 'object') return {} as T;
  return camelizeKeys(value as Record<string, unknown>) as T;
}

export function unwrapList<T>(raw: unknown): T[] {
  if (isNoRecords(raw)) return [];
  const value = unwrapEnvelope(raw);
  if (!Array.isArray(value)) {
    return value && typeof value === 'object'
      ? [camelizeKeys(value as Record<string, unknown>) as T]
      : [];
  }
  return value
    .filter((item): item is Record<string, unknown> =>
      Boolean(item && typeof item === 'object'),
    )
    .map((item) => camelizeKeys(item) as T);
}
