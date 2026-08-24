// Devil n Dove Build 289 Packaging write-response bridge.
// Active Packaging POSTs keep their legacy UI path but are transported through the
// Build 289 gateway, which delegates the mature write logic without broad response
// enumeration. GET handling remains owned by the Build 286/288 read stack.

const BUILD = 289;
const LEGACY_PACKAGING_PATH = '/api/admin/packaging-studio';
const WRITE_GATEWAY_PATH = '/api/admin/packaging-write';

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

function isPackagingWrite(input, init = {}) {
  return requestMethod(input, init) === 'POST' && requestPath(input) === LEGACY_PACKAGING_PATH;
}

function gatewayUrl(input) {
  const parsed = requestUrl(input);
  return `${WRITE_GATEWAY_PATH}${parsed?.search || ''}`;
}

async function responsePayload(response) {
  try { return await response?.clone?.().json(); }
  catch { return null; }
}

export function createPackagingWriteResponseBridge({ onWrite = null } = {}) {
  let state = 'registered';
  let authOwner = null;
  let previousApiFetch = null;
  let bridgedApiFetch = null;
  let interceptedWriteCount = 0;
  let lastStatus = 0;
  let lastBoundary = null;

  function arm() {
    if (state === 'armed') return true;
    const auth = globalThis.DDAuth;
    if (!auth || typeof auth.apiFetch !== 'function') throw new Error('Packaging write-response bridge requires DDAuth.apiFetch.');

    authOwner = auth;
    previousApiFetch = auth.apiFetch;
    bridgedApiFetch = async function ddPackagingWriteResponseBridge(input, init) {
      if (!isPackagingWrite(input, init)) {
        return previousApiFetch.call(authOwner, input, init);
      }

      interceptedWriteCount += 1;
      const response = await previousApiFetch.call(authOwner, gatewayUrl(input), init);
      lastStatus = Number(response?.status || 0);
      const payload = await responsePayload(response);
      lastBoundary = payload?.write_boundary && typeof payload.write_boundary === 'object'
        ? Object.freeze({ ...payload.write_boundary })
        : null;
      onWrite?.(Object.freeze({
        build: BUILD,
        count: interceptedWriteCount,
        status: lastStatus,
        boundary: lastBoundary,
      }));
      return response;
    };

    auth.apiFetch = bridgedApiFetch;
    state = 'armed';
    return true;
  }

  function disarm() {
    if (authOwner && bridgedApiFetch && authOwner.apiFetch === bridgedApiFetch && previousApiFetch) {
      authOwner.apiFetch = previousApiFetch;
    }
    bridgedApiFetch = null;
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
      writeResponseDecoupled: true,
      legacyWritePath: LEGACY_PACKAGING_PATH,
      gatewayPath: WRITE_GATEWAY_PATH,
      interceptedWriteCount,
      lastStatus,
      lastBoundary,
    });
  }

  return Object.freeze({ arm, disarm, getStatus });
}

export const metadata = Object.freeze({
  build: BUILD,
  legacyWritePath: LEGACY_PACKAGING_PATH,
  gatewayPath: WRITE_GATEWAY_PATH,
  behaviorMode: 'packaging-write-response-bridge',
});
