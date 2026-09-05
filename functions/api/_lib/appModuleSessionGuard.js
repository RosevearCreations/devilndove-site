// Devil n Dove resilient session verification for application-module routing.
// A transient D1/session read failure must not be converted into a false 401/logout.

import { getDb, getRequestToken, normalizeText } from './adminAudit.js';
import { resolveSessionUser } from './accountAuthCompat.js';
import { readUserModuleAccess } from './appModules.js';
import { CURRENT_RELEASE } from './releaseAuthority.js';

export const APP_MODULE_SESSION_UNAVAILABLE_CODE = 'module_session_verification_unavailable';

export class AppModuleSessionVerificationUnavailable extends Error {
  constructor(reason = 'session_verification_failed') {
    super(APP_MODULE_SESSION_UNAVAILABLE_CODE);
    this.name = 'AppModuleSessionVerificationUnavailable';
    this.code = APP_MODULE_SESSION_UNAVAILABLE_CODE;
    this.reason = normalizeText(reason) || 'session_verification_failed';
  }
}

export function isAppModuleSessionVerificationUnavailable(error) {
  return Boolean(error instanceof AppModuleSessionVerificationUnavailable || error?.code === APP_MODULE_SESSION_UNAVAILABLE_CODE);
}

export async function resolveAppModuleRequestUser(request, env) {
  const token = getRequestToken(request);
  if (!token) return null;
  const db = getDb(env);
  if (!db) throw new AppModuleSessionVerificationUnavailable('database_binding_missing');

  try {
    const row = await resolveSessionUser(request,db);
    if (!row || Number(row.is_active || 0) !== 1) return null;
    let moduleAccess;
    try {
      moduleAccess = await readUserModuleAccess(env, row.user_id, { strict: true });
    } catch {
      throw new AppModuleSessionVerificationUnavailable('module_user_access_query_failed');
    }

    return {
      user_id: Number(row.user_id || 0),
      email: row.email || '',
      display_name: row.display_name || '',
      role: normalizeText(row.role).toLowerCase() || 'member',
      is_active: 1,
      session_id: Number(row.session_id || 0),
      expires_at: row.expires_at || null,
      module_access: moduleAccess,
    };
  } catch (error) {
    if (isAppModuleSessionVerificationUnavailable(error)) throw error;
    throw new AppModuleSessionVerificationUnavailable('session_query_failed');
  }
}

export function appModuleSessionUnavailableResponse({ api = true } = {}) {
  const headers = {
    'Cache-Control': 'no-store',
    'Retry-After': '5',
    'X-Content-Type-Options': 'nosniff',
  };
  if (api) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'Session verification is temporarily unavailable. Retry without clearing sign-in state.',
      code: APP_MODULE_SESSION_UNAVAILABLE_CODE,
      retryable: true,
      release: CURRENT_RELEASE,
    }), {
      status: 503,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Temporarily unavailable — Devil n Dove</title><link rel="stylesheet" href="/css/styles.css"></head><body><main class="container"><section class="card" style="margin-top:32px"><h1>Temporarily unavailable</h1><p>We could not verify your current sign-in session. Your sign-in state has not been rejected. Please retry.</p><p><a class="btn" href="javascript:location.reload()">Retry</a></p></section></main></body></html>`, {
    status: 503,
    headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' },
  });
}
