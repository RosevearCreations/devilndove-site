// Release 460 — declarative OAuth provider contracts and server-side exchange/refresh/revoke helpers.
// Contract URLs are provider OAuth endpoints only; credential/token values are supplied at runtime and never returned by diagnostics.

const CONTRACTS = {
  etsy: {
    key: 'etsy', label: 'Etsy', clientIdEnv: 'ETSY_API_KEYSTRING', clientSecretEnv: 'ETSY_SHARED_SECRET', redirectEnv: 'ETSY_REDIRECT_URI',
    authorizationEndpoint: 'https://www.etsy.com/oauth/connect', tokenEndpoint: 'https://api.etsy.com/v3/public/oauth/token', revokeEndpoint: null,
    pkce: 'required', scopes: ['shops_r','listings_r','listings_w','transactions_r'], authClientParam: 'client_id', tokenClientParam: 'client_id', tokenAuth: 'body_id_only'
  },
  pinterest: {
    key: 'pinterest', label: 'Pinterest', clientIdEnv: 'PINTEREST_APP_ID', clientSecretEnv: 'PINTEREST_APP_SECRET', redirectEnv: 'PINTEREST_REDIRECT_URI',
    authorizationEndpoint: 'https://www.pinterest.com/oauth/', tokenEndpoint: 'https://api.pinterest.com/v5/oauth/token', revokeEndpoint: null,
    pkce: 'not_documented', scopes: ['boards:read','boards:write','pins:read','pins:write'], authClientParam: 'client_id', tokenClientParam: 'client_id', tokenAuth: 'basic'
  },
  meta: {
    key: 'meta', label: 'Meta / Facebook / Instagram', aliases: ['facebook','instagram'], clientIdEnv: 'META_APP_ID', clientSecretEnv: 'META_APP_SECRET', redirectEnv: 'META_REDIRECT_URI',
    authorizationEndpoint: 'https://www.facebook.com/dialog/oauth', tokenEndpoint: 'https://graph.facebook.com/oauth/access_token', revokeEndpoint: null,
    pkce: 'not_enabled_by_contract', scopes: [], authClientParam: 'client_id', tokenClientParam: 'client_id', tokenAuth: 'body_secret', remoteDisconnect: 'provider_permission_delete_requires_subject'
  },
  x: {
    key: 'x', label: 'X', clientIdEnv: 'X_CLIENT_ID', clientSecretEnv: 'X_CLIENT_SECRET', redirectEnv: 'X_REDIRECT_URI',
    authorizationEndpoint: 'https://x.com/i/oauth2/authorize', tokenEndpoint: 'https://api.x.com/2/oauth2/token', revokeEndpoint: 'https://api.x.com/2/oauth2/revoke',
    pkce: 'required', scopes: ['tweet.read','tweet.write','users.read','offline.access'], authClientParam: 'client_id', tokenClientParam: 'client_id', tokenAuth: 'basic_if_secret'
  },
  tiktok: {
    key: 'tiktok', label: 'TikTok', clientIdEnv: 'TIKTOK_CLIENT_KEY', clientSecretEnv: 'TIKTOK_CLIENT_SECRET', redirectEnv: 'TIKTOK_REDIRECT_URI',
    authorizationEndpoint: 'https://www.tiktok.com/v2/auth/authorize/', tokenEndpoint: 'https://open.tiktokapis.com/v2/oauth/token/', revokeEndpoint: 'https://open.tiktokapis.com/v2/oauth/revoke/',
    pkce: 'not_documented', scopes: ['user.info.basic','video.publish','video.upload'], authClientParam: 'client_key', tokenClientParam: 'client_key', tokenSecretParam: 'client_secret', tokenAuth: 'body_secret'
  },
  youtube: {
    key: 'youtube', label: 'YouTube', clientIdEnv: 'YOUTUBE_CLIENT_ID', clientSecretEnv: 'YOUTUBE_CLIENT_SECRET', redirectEnv: 'YOUTUBE_REDIRECT_URI',
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth', tokenEndpoint: 'https://oauth2.googleapis.com/token', revokeEndpoint: 'https://oauth2.googleapis.com/revoke',
    pkce: 'supported', scopes: ['https://www.googleapis.com/auth/youtube.upload'], authClientParam: 'client_id', tokenClientParam: 'client_id', tokenAuth: 'body_secret', authorizationExtras: { access_type: 'offline', include_granted_scopes: 'true', prompt: 'consent' }
  }
};

function text(value) { return String(value == null ? '' : value).trim(); }
function formBody(values) {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(values || {})) if (value != null && value !== '') form.set(key, String(value));
  return form;
}
function basicHeader(id, secret) { return `Basic ${btoa(`${id}:${secret}`)}`; }

export function getOAuthContract(providerKey) {
  const requested = text(providerKey).toLowerCase();
  for (const contract of Object.values(CONTRACTS)) {
    if (contract.key === requested || (contract.aliases || []).includes(requested)) return contract;
  }
  return null;
}

export function listOAuthContracts() {
  return Object.values(CONTRACTS).map((contract) => ({
    key: contract.key,
    label: contract.label,
    aliases: contract.aliases || [],
    client_id_reference: contract.clientIdEnv,
    client_secret_reference: contract.clientSecretEnv,
    redirect_reference: contract.redirectEnv,
    pkce: contract.pkce,
    scopes: [...contract.scopes],
    refresh_supported: Boolean(contract.tokenEndpoint),
    remote_revoke_supported: Boolean(contract.revokeEndpoint),
    remote_disconnect_contract: contract.remoteDisconnect || (contract.revokeEndpoint ? 'token_revoke_endpoint' : 'local_disconnect_only')
  }));
}

export function providerConfiguration(contract, env) {
  if (!contract) throw new Error('oauth_provider_unsupported');
  const clientId = text(env?.[contract.clientIdEnv]);
  const clientSecret = text(env?.[contract.clientSecretEnv]);
  const redirectUri = text(env?.[contract.redirectEnv]);
  return { clientId, clientSecret, redirectUri, configured: Boolean(clientId && redirectUri && (contract.tokenAuth === 'body_id_only' || clientSecret)) };
}

export function buildAuthorizationUrl(contract, env, { state, challenge, scopes } = {}) {
  const cfg = providerConfiguration(contract, env);
  if (!cfg.configured) throw new Error('oauth_provider_configuration_incomplete');
  const url = new URL(contract.authorizationEndpoint);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set(contract.authClientParam || 'client_id', cfg.clientId);
  url.searchParams.set('redirect_uri', cfg.redirectUri);
  url.searchParams.set('scope', (Array.isArray(scopes) && scopes.length ? scopes : contract.scopes).join(' '));
  url.searchParams.set('state', text(state));
  if ((contract.pkce === 'required' || contract.pkce === 'supported') && challenge) {
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
  }
  for (const [key, value] of Object.entries(contract.authorizationExtras || {})) url.searchParams.set(key, value);
  return url.toString();
}

function tokenRequest(contract, env, bodyValues) {
  const cfg = providerConfiguration(contract, env);
  if (!cfg.configured) throw new Error('oauth_provider_configuration_incomplete');
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' };
  const body = { ...bodyValues };
  if (contract.tokenAuth === 'basic' || (contract.tokenAuth === 'basic_if_secret' && cfg.clientSecret)) {
    headers.Authorization = basicHeader(cfg.clientId, cfg.clientSecret);
  } else {
    body[contract.tokenClientParam || 'client_id'] = cfg.clientId;
    if (contract.tokenAuth === 'body_secret') body[contract.tokenSecretParam || 'client_secret'] = cfg.clientSecret;
  }
  if (contract.tokenAuth === 'body_id_only') body[contract.tokenClientParam || 'client_id'] = cfg.clientId;
  return { cfg, headers, body: formBody(body) };
}

async function fetchTokenJson(contract, env, bodyValues, fetchImpl = fetch) {
  const req = tokenRequest(contract, env, bodyValues);
  const response = await fetchImpl(contract.tokenEndpoint, { method: 'POST', headers: req.headers, body: req.body, redirect: 'error' });
  let payload = {};
  try { payload = await response.json(); } catch { payload = {}; }
  if (!response.ok || !text(payload?.access_token)) {
    const error = new Error('oauth_provider_token_exchange_failed');
    error.oauthStatus = response.status;
    error.oauthProviderCode = text(payload?.error || payload?.error_code || payload?.code).slice(0, 80);
    throw error;
  }
  return payload;
}

export async function exchangeAuthorizationCode(contract, env, { code, verifier } = {}, fetchImpl = fetch) {
  const cfg = providerConfiguration(contract, env);
  const body = { grant_type: 'authorization_code', code: text(code), redirect_uri: cfg.redirectUri };
  if ((contract.pkce === 'required' || contract.pkce === 'supported') && verifier) body.code_verifier = verifier;
  return fetchTokenJson(contract, env, body, fetchImpl);
}

export async function refreshOAuthToken(contract, env, refreshToken, fetchImpl = fetch) {
  if (!contract?.tokenEndpoint) throw new Error('oauth_refresh_not_supported');
  return fetchTokenJson(contract, env, { grant_type: 'refresh_token', refresh_token: text(refreshToken) }, fetchImpl);
}

export async function revokeOAuthToken(contract, env, token, fetchImpl = fetch) {
  if (!contract?.revokeEndpoint) return { supported: false, ok: false, status: 0 };
  const cfg = providerConfiguration(contract, env);
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' };
  const body = {};
  if (contract.key === 'tiktok') {
    body.client_key = cfg.clientId; body.client_secret = cfg.clientSecret; body.token = text(token);
  } else if (contract.key === 'x') {
    body.token = text(token); body.client_id = cfg.clientId;
    if (cfg.clientSecret) headers.Authorization = basicHeader(cfg.clientId, cfg.clientSecret);
  } else if (contract.key === 'youtube') {
    body.token = text(token);
  } else {
    body.token = text(token);
  }
  const response = await fetchImpl(contract.revokeEndpoint, { method: 'POST', headers, body: formBody(body), redirect: 'error' });
  return { supported: true, ok: response.ok, status: response.status };
}
