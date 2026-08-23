// Devil n Dove Build 288 Packaging legacy-GET retirement guard.
// The active Packaging runtime still uses the proven Build 286 bridge for narrow
// bootstrap contractization, but any attempt to fall back to the old broad GET
// is blocked before the network request can reach /api/admin/packaging-studio.

const BUILD = 288;
const LEGACY_PACKAGING_PATH = '/api/admin/packaging-studio';

function rawRequestUrl(input) {
  return typeof input === 'string' ? input : String(input?.url || '');
}

function requestUrl(input) {
  const raw = rawRequestUrl(input);
  if (!raw) return null;
  try {
    return new URL(raw, globalThis.location?.origin || 'https://devilndove.invalid');
  } catch {
    return null;
  }
}

function requestPath(input) {
  return requestUrl(input)?.pathname || rawRequestUrl(input).split(/[?#]/, 1)[0] || '';
}

function requestMethod(input, init = {}) {
  return String(init?.method || input?.method || 'GET').toUpperCase();
}

function isRetiredLegacyGet(input, init = {}) {
  return requestMethod(input, init) === 'GET' && requestPath(input) === LEGACY_PACKAGING_PATH;
}

function retiredResponse() {
  if (typeof Response === 'undefined') {
    return { ok: false, status: 410, json: async () => ({ ok: false, build: BUILD, error_code: 'packaging_legacy_get_retired' }) };
  }
  return new Response(JSON.stringify({
    ok: false,
    build: BUILD,
    error: 'Legacy Packaging GET is retired for the active modular runtime. Use the narrow Packaging bootstrap.',
    error_code: 'packaging_legacy_get_retired',
    legacy_get_retired: true,
    broad_legacy_get_reachable_from_active_runtime: false,
  }), {
    status: 410,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export function createPackagingLegacyGetRetirementGuard({ onBlocked = null } = {}) {
  let state = 'registered';
  let authOwner = null;
  let previousApiFetch = null;
  let guardedApiFetch = null;
  let blockedLegacyGetCount = 0;
  let lastBlockedPath = '';

  function arm() {
    if (state === 'armed') return true;
    const auth = globalThis.DDAuth;
    if (!auth || typeof auth.apiFetch !== 'function') throw new Error('Packaging legacy-GET retirement requires DDAuth.apiFetch.');

    authOwner = auth;
    previousApiFetch = auth.apiFetch;
    guardedApiFetch = async function ddPackagingRetiredLegacyGet(input, init) {
      if (!isRetiredLegacyGet(input, init)) {
        return previousApiFetch.call(authOwner, input, init);
      }

      blockedLegacyGetCount += 1;
      lastBlockedPath = requestPath(input);
      onBlocked?.(Object.freeze({
        build: BUILD,
        path: lastBlockedPath,
        blockedLegacyGetCount,
      }));
      return retiredResponse();
    };

    auth.apiFetch = guardedApiFetch;
    state = 'armed';
    return true;
  }

  function disarm() {
    if (authOwner && guardedApiFetch && authOwner.apiFetch === guardedApiFetch && previousApiFetch) {
      authOwner.apiFetch = previousApiFetch;
    }
    guardedApiFetch = null;
    previousApiFetch = null;
    authOwner = null;
    state = 'inactive';
    return true;
  }

  function getStatus() {
    return Object.freeze({
      build: BUILD,
      state,
      armed: state === 'armed',
      legacyGetRetired: true,
      activeRuntimeBroadLegacyGetReachable: false,
      blockedLegacyGetCount,
      lastBlockedPath,
    });
  }

  return Object.freeze({ arm, disarm, getStatus });
}

export const metadata = Object.freeze({
  build: BUILD,
  legacyPath: LEGACY_PACKAGING_PATH,
  behaviorMode: 'active-runtime-legacy-get-retirement',
});
