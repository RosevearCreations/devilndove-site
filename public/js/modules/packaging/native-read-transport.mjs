// Devil n Dove Build 297 Packaging native read transport.
// Composes the native Packaging bootstrap with owner-side Catalog, Inventory and
// Content contracts. The retired /api/admin/packaging-studio GET is never called.

const BUILD = 297;
const LEGACY_PACKAGING_PATH = '/api/admin/packaging-studio';
const NATIVE_BOOTSTRAP_PATH = '/api/admin/packaging-bootstrap';

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

function nativeBootstrapUrl(input) {
  const parsed = requestUrl(input);
  return `${NATIVE_BOOTSTRAP_PATH}${parsed?.search || ''}`;
}

async function readJson(response) {
  try { return await response?.clone?.().json(); }
  catch { return null; }
}

function syntheticJsonResponse(response, payload) {
  if (typeof Response === 'undefined' || typeof Headers === 'undefined') return response;
  const headers = new Headers(response?.headers || undefined);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');
  return new Response(JSON.stringify(payload), {
    status: Number(response?.status || 200),
    statusText: response?.statusText || '',
    headers,
  });
}

function unavailableResponse(message, detail = '') {
  return new Response(JSON.stringify({
    ok: false,
    build: BUILD,
    error: message,
    error_detail: detail,
    error_code: 'packaging_native_bootstrap_unavailable',
    replacement_path: NATIVE_BOOTSTRAP_PATH,
    legacy_get_fallback_removed: true,
    legacy_server_route_contacted: false,
  }), {
    status: 503,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export function createPackagingNativeReadTransport({
  readCatalog,
  readInventory,
  readContentMedia,
} = {}) {
  const cache = {
    catalog: { ready: false, rows: Object.freeze([]) },
    inventory: { ready: false, rows: Object.freeze([]) },
    contentMedia: { ready: false, rows: Object.freeze([]) },
  };

  let requestCount = 0;
  let lastStatus = 0;
  let lastError = '';
  let bootstrapStatus = Object.freeze({
    build: BUILD,
    contractized: false,
    catalogSource: 'not-read',
    inventorySource: 'not-read',
    contentMediaSource: 'not-read',
    catalogCount: 0,
    inventoryCount: 0,
    contentMediaCount: 0,
    serverBootstrapSource: 'not-read',
    bootstrapPath: NATIVE_BOOTSTRAP_PATH,
    legacyEndpointBypassed: true,
    legacyGetFallbackRemoved: true,
    fallbackReasons: Object.freeze([]),
  });

  function cacheRows(key, rows) {
    const clean = Object.freeze([...(Array.isArray(rows) ? rows : [])]);
    cache[key] = { ready: true, rows: clean };
    return clean;
  }

  function resolveContract(settled, cacheKey, label, fallbackReasons) {
    if (settled?.status === 'fulfilled' && Array.isArray(settled.value?.rows)) {
      const rows = cacheRows(cacheKey, settled.value.rows);
      return { rows, count: Number(settled.value.count ?? rows.length), source: 'contract' };
    }

    const reason = String(settled?.reason?.message || settled?.reason || `${label} contract unavailable`);
    fallbackReasons.push(`${label}: ${reason}`);

    if (cache[cacheKey]?.ready) {
      return { rows: cache[cacheKey].rows, count: cache[cacheKey].rows.length, source: 'session-cache' };
    }

    return { rows: Object.freeze([]), count: 0, source: 'contract-unavailable' };
  }

  async function transport(input, init = {}) {
    if (requestMethod(input, init) !== 'GET' || requestPath(input) !== LEGACY_PACKAGING_PATH) {
      throw new Error('Build 297 native Packaging read transport accepts only the compatibility GET trigger.');
    }

    const auth = globalThis.DDAuth;
    if (!auth || typeof auth.apiFetch !== 'function') {
      lastError = 'DDAuth.apiFetch unavailable';
      lastStatus = 503;
      return unavailableResponse('Packaging authentication transport is unavailable.', lastError);
    }

    requestCount += 1;
    let response = null;
    let payload = null;
    try {
      response = await auth.apiFetch(nativeBootstrapUrl(input), init);
      lastStatus = Number(response?.status || 0);
      payload = response?.ok ? await readJson(response) : null;
      if (!response?.ok || !payload?.ok) {
        lastError = payload?.error || `Native Packaging bootstrap HTTP ${lastStatus || 0}`;
        return response || unavailableResponse('Native Packaging bootstrap failed.', lastError);
      }
    } catch (error) {
      lastError = String(error?.message || error || 'Native Packaging bootstrap failed.');
      lastStatus = 503;
      return unavailableResponse('Native Packaging bootstrap failed.', lastError);
    }

    const [catalogResult, inventoryResult, mediaResult] = await Promise.allSettled([
      typeof readCatalog === 'function' ? readCatalog({ limit: 500 }) : Promise.reject(new Error('Catalog contract unavailable')),
      typeof readInventory === 'function' ? readInventory({ limit: 1000 }) : Promise.reject(new Error('Inventory contract unavailable')),
      typeof readContentMedia === 'function' ? readContentMedia({ mediaType: 'artwork', limit: 72 }) : Promise.reject(new Error('Content media contract unavailable')),
    ]);

    const fallbackReasons = [];
    const catalog = resolveContract(catalogResult, 'catalog', 'Catalog', fallbackReasons);
    const inventory = resolveContract(inventoryResult, 'inventory', 'Inventory', fallbackReasons);
    const contentMedia = resolveContract(mediaResult, 'contentMedia', 'Content media', fallbackReasons);

    bootstrapStatus = Object.freeze({
      build: BUILD,
      contractized: true,
      catalogSource: catalog.source,
      inventorySource: inventory.source,
      contentMediaSource: contentMedia.source,
      catalogCount: catalog.count,
      inventoryCount: inventory.count,
      contentMediaCount: contentMedia.count,
      serverBootstrapSource: 'packaging-bootstrap',
      bootstrapPath: NATIVE_BOOTSTRAP_PATH,
      legacyEndpointBypassed: true,
      legacyGetFallbackRemoved: true,
      fallbackReasons: Object.freeze([...fallbackReasons]),
    });
    lastError = '';

    const composed = {
      ...payload,
      products: catalog.rows,
      inventory: inventory.rows,
      content_media: contentMedia.rows,
      module_contracts: {
        ...(payload?.module_contracts || {}),
        build: BUILD,
        catalog_read: catalog.source,
        inventory_read: inventory.source,
        content_media: contentMedia.source,
        packaging_bootstrap: 'packaging-bootstrap',
        legacy_endpoint_bypassed: true,
        legacy_get_fallback_removed: true,
        fallback_reasons: [...fallbackReasons],
      },
    };

    if (typeof document !== 'undefined' && typeof CustomEvent !== 'undefined') {
      document.dispatchEvent(new CustomEvent('dd:packaging-contract-bootstrap', {
        detail: Object.freeze({
          moduleId: 'packaging',
          build: BUILD,
          catalogSource: catalog.source,
          inventorySource: inventory.source,
          contentMediaSource: contentMedia.source,
          catalogCount: catalog.count,
          inventoryCount: inventory.count,
          contentMediaCount: contentMedia.count,
          serverBootstrapSource: 'packaging-bootstrap',
          legacyEndpointBypassed: true,
          legacyGetFallbackRemoved: true,
          fallbackCount: fallbackReasons.length,
        }),
      }));
    }

    return syntheticJsonResponse(response, composed);
  }

  function getStatus() {
    return Object.freeze({
      build: BUILD,
      transportReady: Boolean(globalThis.DDAuth && typeof globalThis.DDAuth.apiFetch === 'function'),
      requestCount,
      lastStatus,
      lastError,
      legacyGetFallbackRemoved: true,
      legacyServerRouteReachable: false,
      bootstrapPath: NATIVE_BOOTSTRAP_PATH,
      ...bootstrapStatus,
    });
  }

  return Object.freeze({
    build: BUILD,
    transport,
    getStatus,
    getBootstrapStatus: () => bootstrapStatus,
  });
}

export const metadata = Object.freeze({
  build: BUILD,
  nativeBootstrapPath: NATIVE_BOOTSTRAP_PATH,
  legacyGetFallbackRemoved: true,
  legacyServerRouteReachable: false,
  behaviorMode: 'native-bootstrap-owner-contract-composition',
});
