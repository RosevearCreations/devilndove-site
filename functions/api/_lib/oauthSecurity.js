// Release 460 — secure OAuth cryptographic authority.
// Raw state, PKCE verifiers and provider tokens must never be persisted or logged.

const te = new TextEncoder();
const td = new TextDecoder();
const SENSITIVE_KEY = /(access[_-]?token|refresh[_-]?token|id[_-]?token|authorization|client[_-]?secret|shared[_-]?secret|code[_-]?verifier|(^|_)state($|_)|(^|_)code($|_)|password|private[_-]?key|secret|token)/i;

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

export function randomBase64Url(byteLength = 32) {
  if (!Number.isInteger(byteLength) || byteLength < 16 || byteLength > 96) throw new Error('oauth_random_length_invalid');
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest('SHA-256', te.encode(String(value || '')));
  return bytesToBase64Url(new Uint8Array(digest));
}

export async function createStateAndPkce() {
  const state = randomBase64Url(32);
  const verifier = randomBase64Url(48);
  const challenge = await sha256Base64Url(verifier);
  return { state, stateHash: await sha256Base64Url(state), verifier, challenge, challengeMethod: 'S256' };
}

async function encryptionKey(env) {
  const encoded = String(env?.OAUTH_TOKEN_ENCRYPTION_KEY_V1 || '').trim();
  if (!encoded) throw new Error('oauth_encryption_key_missing');
  let raw;
  try { raw = base64UrlToBytes(encoded); } catch { throw new Error('oauth_encryption_key_invalid'); }
  if (raw.byteLength !== 32) throw new Error('oauth_encryption_key_invalid');
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export function encryptionKeyConfigured(env) {
  const encoded = String(env?.OAUTH_TOKEN_ENCRYPTION_KEY_V1 || '').trim();
  if (!encoded) return false;
  try { return base64UrlToBytes(encoded).byteLength === 32; } catch { return false; }
}

export async function encryptOAuthSecret(env, plaintext, aad) {
  if (plaintext == null || plaintext === '') return null;
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const key = await encryptionKey(env);
  const additionalData = te.encode(String(aad || 'oauth'));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData, tagLength: 128 }, key, te.encode(String(plaintext)));
  return `v1.${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(encrypted))}`;
}

export async function decryptOAuthSecret(env, envelope, aad) {
  if (!envelope) return null;
  const [version, ivPart, dataPart, extra] = String(envelope).split('.');
  if (version !== 'v1' || !ivPart || !dataPart || extra) throw new Error('oauth_ciphertext_invalid');
  const key = await encryptionKey(env);
  try {
    const decrypted = await crypto.subtle.decrypt({
      name: 'AES-GCM', iv: base64UrlToBytes(ivPart), additionalData: te.encode(String(aad || 'oauth')), tagLength: 128
    }, key, base64UrlToBytes(dataPart));
    return td.decode(decrypted);
  } catch {
    throw new Error('oauth_ciphertext_authentication_failed');
  }
}

export function redactSensitive(value, depth = 0) {
  if (depth > 8) return '[REDACTED_DEPTH]';
  if (Array.isArray(value)) return value.map((item) => redactSensitive(item, depth + 1));
  if (!value || typeof value !== 'object') return value;
  const output = {};
  for (const [key, item] of Object.entries(value)) {
    output[key] = SENSITIVE_KEY.test(key) ? '[REDACTED]' : redactSensitive(item, depth + 1);
  }
  return output;
}

export function safeDiagnosticCode(value, fallback = 'oauth_error') {
  const normalized = String(value || '').toLowerCase().replace(/[^a-z0-9._-]+/g, '_').slice(0, 80);
  return normalized || fallback;
}

export function isDevelopmentOAuthHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return host === 'devilndove-site-dev.pages.dev' || host.endsWith('.devilndove-site-dev.pages.dev');
}

export function oauthRemoteAuthorizationOpen(env, requestUrl) {
  const mode = String(env?.OAUTH_PROVIDER_AUTHORIZATION_MODE || '').trim().toLowerCase();
  let host = '';
  try { host = new URL(String(requestUrl || '')).hostname; } catch { return false; }
  return mode === 'development-explicit' && isDevelopmentOAuthHost(host);
}

export function safeReturnPath(value, fallback = '/admin/it-integrations/') {
  const path = String(value || '').trim();
  if (!path.startsWith('/') || path.startsWith('//') || /[\r\n]/.test(path)) return fallback;
  return path.slice(0, 300);
}
