// Release 467 Build 61 — password hash authority.
// New password writes use salted PBKDF2-HMAC-SHA256 at the maximum iteration
// count accepted by Cloudflare Workers WebCrypto. Legacy sha256$ hashes remain
// verification-only compatibility and are upgraded after a successful login.
// Existing PBKDF2 hashes retain their embedded iteration count and continue to verify.
export const PASSWORD_HASH_SCHEME = 'pbkdf2-sha256';
export const PASSWORD_HASH_ITERATIONS = 100000;
const PASSWORD_HASH_BYTES = 32;
const PASSWORD_SALT_BYTES = 16;
const te = new TextEncoder();

export function normalizeText(value) {
  return String(value || '').trim();
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(input) {
  const digest = await crypto.subtle.digest('SHA-256', te.encode(String(input || '')));
  return toHex(digest);
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function constantTimeEqual(left, right) {
  if (!(left instanceof Uint8Array) || !(right instanceof Uint8Array) || left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

async function derivePbkdf2(password, salt, iterations, outputBytes = PASSWORD_HASH_BYTES) {
  const key = await crypto.subtle.importKey('raw', te.encode(String(password || '')), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    outputBytes * 8
  );
  return new Uint8Array(bits);
}

export function getStoredPasswordHashScheme(storedHash) {
  const value = normalizeText(storedHash);
  if (value.startsWith(`${PASSWORD_HASH_SCHEME}$`)) return PASSWORD_HASH_SCHEME;
  if (value.startsWith('sha256$')) return 'sha256-legacy';
  return value ? 'unknown' : 'missing';
}

export function storedPasswordHashNeedsUpgrade(storedHash) {
  return getStoredPasswordHashScheme(storedHash) !== PASSWORD_HASH_SCHEME;
}

export async function verifyStoredPasswordHash(password, storedHash) {
  const value = normalizeText(storedHash);
  if (!value) return false;

  if (value.startsWith(`${PASSWORD_HASH_SCHEME}$`)) {
    const parts = value.split('$');
    if (parts.length !== 4) return false;
    const iterations = Number(parts[1]);
    if (!Number.isInteger(iterations) || iterations < 100000 || iterations > 2000000) return false;
    try {
      const salt = base64UrlToBytes(parts[2]);
      const expected = base64UrlToBytes(parts[3]);
      if (salt.length < 16 || expected.length < 24 || expected.length > 64) return false;
      const actual = await derivePbkdf2(password, salt, iterations, expected.length);
      return constantTimeEqual(actual, expected);
    } catch {
      return false;
    }
  }

  if (value.startsWith('sha256$')) {
    // Legacy compatibility only. No Build 61 writer may produce this format.
    return (await sha256Hex(password)) === value.slice('sha256$'.length);
  }

  return false;
}

export async function formatStoredPasswordHashFromPlaintext(password) {
  const salt = crypto.getRandomValues(new Uint8Array(PASSWORD_SALT_BYTES));
  const derived = await derivePbkdf2(password, salt, PASSWORD_HASH_ITERATIONS, PASSWORD_HASH_BYTES);
  return `${PASSWORD_HASH_SCHEME}$${PASSWORD_HASH_ITERATIONS}$${bytesToBase64Url(salt)}$${bytesToBase64Url(derived)}`;
}
