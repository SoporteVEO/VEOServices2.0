import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

function secret(): string {
  const value =
    process.env.CRM_TOKEN_ENCRYPTION_KEY ?? process.env.BETTER_AUTH_SECRET;
  if (!value) {
    throw new Error(
      'CRM_TOKEN_ENCRYPTION_KEY (o BETTER_AUTH_SECRET) no está configurado',
    );
  }
  return value;
}

function key(): Buffer {
  return createHash('sha256').update(secret()).digest();
}

/** AES-256-GCM, serialized as `iv.tag.ciphertext` in base64url. */
export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((b) => b.toString('base64url')).join('.');
}

export function decryptToken(serialized: string): string {
  const [iv, tag, data] = serialized
    .split('.')
    .map((part) => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    'utf8',
  );
}

const STATE_MAX_AGE_MS = 10 * 60 * 1000;

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

/** Short-lived signed value carried through the OAuth round trip. */
export function createOAuthState(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      u: userId,
      t: Date.now(),
      n: randomBytes(8).toString('hex'),
    }),
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyOAuthState(state: string): string | null {
  const [payload, signature] = state.split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as { u?: string; t?: number };
    if (!parsed.u || !parsed.t) return null;
    if (Date.now() - parsed.t > STATE_MAX_AGE_MS) return null;
    return parsed.u;
  } catch {
    return null;
  }
}
