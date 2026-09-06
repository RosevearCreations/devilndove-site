// Devil n Dove Build 298 native Packaging browser client.
// Packaging-owned templates/projects load from the narrow Packaging bootstrap immediately.
// Catalog, Inventory and Content remain owner-contract enrichments and may arrive after the
// core Packaging workspace is already usable. Writes retain the modular-runtime safety gate.

const BUILD = 298;
const NATIVE_BOOTSTRAP_PATH = '/api/admin/packaging-bootstrap';
const NATIVE_WRITE_PATH = '/api/admin/packaging-write';
const CLIENT_READY_EVENT = 'dd:packaging-client-transport-active';
const AUTH_REJECTED_EVENT = 'dd:auth-rejected';
const WAIT_TIMEOUT_MS = 30000;

const contractCache = {
  catalog: { ready: false, rows: Object.freeze([]) },
  inventory: { ready: false, rows: Object.freeze([]) },
  contentMedia: { ready: false, rows: Object.freeze([]) },
};

let waitPromise = null;
let deferredContractRefreshScheduled = false;
let deferredContractRefreshTriggered = false;
let readCount = 0;
let writeCount = 0;
let lastReadStatus = 0;
let lastWriteStatus = 0;
let lastReadError = '';
let lastWriteError = '';
let lastWriteBoundary = null;
let lastReadFallbackReasons = Object.freeze([]);
let bootstrapStatus = Object.freeze({
  build: BUILD,
  contractized: false,
  serverBootstrapSource: 'not-read',
  bootstrapPath: NATIVE_BOOTSTRAP_PATH,
  legacyEndpointBypassed: true,
  catalogSource: 'not-read',
  inventorySource: 'not-read',
  contentMediaSource: 'not-read',
  catalogCount: 0,
  inventoryCount: 0,
  contentMediaCount: 0,
  ownerContractsPending: false,
  fallbackReasons: Object.freeze([]),
});

function contracts() {
  return globalThis.DDPackagingContracts || null;
}

function contractsReady() {
  try {
    const facade = contracts();
    const status = facade?.getStatus?.() || null;
    return Boolean(
      facade
      && status?.state === 'active'
      && Number(status?.clientTransportBuild || 0) >= 297
      && status?.clientTransportReady === true
      && typeof facade.readCatalog === 'function'
      && typeof facade.readInventory === 'function'
      && typeof facade.readContentMedia === 'function'
    );
  } catch {
    return false;
  }
}

function waitForContracts() {
  if (contractsReady()) return Promise.resolve(true);
  if (waitPromise) return waitPromise;

  waitPromise = new Promise((resolve) => {
    let settled = false;
    let timer = null;

    const finish = (ready) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (typeof document !== 'undefined') {
        document.removeEventListener(CLIENT_READY_EVENT, onReady);
        document.removeEventListener(AUTH_REJECTED_EVENT, onRejected);
      }
      resolve(Boolean(ready));
    };

    const onReady = () => {
      if (contractsReady()) finish(true);
    };
    const onRejected = () => finish(false);

    if (typeof document !== 'undefined') {
      document.addEventListener(CLIENT_READY_EVENT, onReady);
      document.addEventListener(AUTH_REJECTED_EVENT, onRejected);
    }

    timer = setTimeout(() => finish(contractsReady()), WAIT_TIMEOUT_MS);
    queueMicrotask(() => {
      if (contractsReady()) finish(true);
    });
  }).finally(() => {
    waitPromise = null;
  });

  return waitPromise;
}

function nativeUrl(path, projectId = 0) {
  const id = Number(projectId || 0);
  return id > 0 ? `${path}?packaging_project_id=${encodeURIComponent(id)}` : path;
}

function cacheRows(key, rows) {
  const clean = Object.freeze([...(Array.isArray(rows) ? rows : [])]);
  contractCache[key] = { ready: true, rows: clean };
  return clean;
}

function resolveContract(settled, cacheKey, label, fallbackReasons) {
  if (settled?.status === 'fulfilled' && Array.isArray(settled.value?.rows)) {
    const rows = cacheRows(cacheKey, settled.value.rows);
    return {
      rows,
      count: Number(settled.value.count ?? rows.length),
      source: 'contract',
    };
  }

  const reason = String(settled?.reason?.message || settled?.reason || `${label} contract unavailable`);
  fallbackReasons.push(`${label}: ${reason}`);

  if (contractCache[cacheKey]?.ready) {
    return {
      rows: contractCache[cacheKey].rows,
      count: contractCache[cacheKey].rows.length,
      source: 'session-cache',
    };
  }

  return {
    rows: Object.freeze([]),
    count: 0,
    source: 'contract-unavailable',
  };
}

function pendingContract(cacheKey, label, fallbackReasons) {
  if (contractCache[cacheKey]?.ready) {
    return {
      rows: contractCache[cacheKey].rows,
      count: contractCache[cacheKey].rows.length,
      source: 'session-cache',
    };
  }
  fallbackReasons.push(`${label}: owner contract pending; core Packaging data loaded without blocking`);
  return {
    rows: Object.freeze([]),
    count: 0,
    source: 'contract-pending',
  };
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

function clientUnavailableResponse(message, code = 'packaging_native_client_not_ready') {
  return new Response(JSON.stringify({
    ok: false,
    build: BUILD,
    error: message,
    error_code: code,
    bootstrap_path: NATIVE_BOOTSTRAP_PATH,
    write_path: NATIVE_WRITE_PATH,
    legacy_server_route_contacted: false,
  }), {
    status: 503,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function emitBootstrap(detail) {
  if (typeof document === 'undefined' || typeof CustomEvent === 'undefined') return;
  document.dispatchEvent(new CustomEvent('dd:packaging-contract-bootstrap', {
    detail: Object.freeze({ moduleId: 'packaging', build: BUILD, nativeClient: true, ...detail }),
  }));
}

function scheduleDeferredContractRefresh() {
  if (deferredContractRefreshScheduled || deferredContractRefreshTriggered || contractsReady()) return;
  deferredContractRefreshScheduled = true;

  void waitForContracts().then((ready) => {
    deferredContractRefreshScheduled = false;
    if (!ready || deferredContractRefreshTriggered) return;

    deferredContractRefreshTriggered = true;
    if (typeof document !== 'undefined' && typeof CustomEvent !== 'undefined') {
      document.dispatchEvent(new CustomEvent('dd:packaging-owner-contracts-ready', {
        detail: Object.freeze({
          moduleId: 'packaging',
          build: BUILD,
          reason: 'refresh-core-packaging-with-owner-contract-enrichment',
        }),
      }));
    }

    const refresh = typeof document !== 'undefined'
      ? document.getElementById('refreshPackagingStudio')
      : null;
    if (refresh && typeof refresh.click === 'function') refresh.click();
  }).catch((error) => {
    deferredContractRefreshScheduled = false;
    console.warn('[DD Packaging] delayed owner-contract enrichment unavailable', error);
  });
}

function composeBootstrap(response, payload, catalog, inventory, contentMedia, fallbackReasons, ownerContractsPending) {
  lastReadFallbackReasons = Object.freeze([...fallbackReasons]);
  lastReadError = '';

  bootstrapStatus = Object.freeze({
    build: BUILD,
    contractized: !ownerContractsPending,
    serverBootstrapSource: 'packaging-bootstrap',
    bootstrapPath: NATIVE_BOOTSTRAP_PATH,
    legacyEndpointBypassed: true,
    catalogSource: catalog.source,
    inventorySource: inventory.source,
    contentMediaSource: contentMedia.source,
    catalogCount: catalog.count,
    inventoryCount: inventory.count,
    contentMediaCount: contentMedia.count,
    ownerContractsPending: Boolean(ownerContractsPending),
    fallbackReasons: Object.freeze([...fallbackReasons]),
  });

  const composed = {
    ...payload,
    products: catalog.rows,
    inventory: inventory.rows,
    content_media: contentMedia.rows,
    module_contracts: {
      ...(payload?.module_contracts || {}),
      client_build: BUILD,
      catalog_read: catalog.source,
      inventory_read: inventory.source,
      content_media: contentMedia.source,
      packaging_bootstrap: 'packaging-bootstrap',
      legacy_endpoint_bypassed: true,
      native_client: true,
      owner_contracts_pending: Boolean(ownerContractsPending),
      fallback_reasons: [...fallbackReasons],
    },
  };

  emitBootstrap({
    serverBootstrapSource: 'packaging-bootstrap',
    legacyEndpointBypassed: true,
    catalogSource: catalog.source,
    inventorySource: inventory.source,
    contentMediaSource: contentMedia.source,
    catalogCount: catalog.count,
    inventoryCount: inventory.count,
    contentMediaCount: contentMedia.count,
    ownerContractsPending: Boolean(ownerContractsPending),
    fallbackCount: fallbackReasons.length,
  });

  return syntheticJsonResponse(response, composed);
}

async function readPackaging(projectId = 0) {
  // Core Packaging data is owned by Packaging and must not be held hostage by
  // Catalog/Inventory/Content contract activation.
  const auth = globalThis.DDAuth;
  if (!auth || typeof auth.apiFetch !== 'function') {
    lastReadStatus = 503;
    lastReadError = 'Packaging authentication transport is unavailable.';
    return clientUnavailableResponse(lastReadError, 'packaging_auth_transport_unavailable');
  }

  readCount += 1;
  const url = nativeUrl(NATIVE_BOOTSTRAP_PATH, projectId);
  let response = null;
  let payload = null;

  try {
    response = await auth.apiFetch(url);
    lastReadStatus = Number(response?.status || 0);
    payload = response?.ok ? await readJson(response) : null;
    if (!response?.ok || !payload?.ok) {
      lastReadError = payload?.error || `Native Packaging bootstrap HTTP ${lastReadStatus || 0}`;
      return response || clientUnavailableResponse(lastReadError, 'packaging_native_bootstrap_unavailable');
    }
  } catch (error) {
    lastReadStatus = 503;
    lastReadError = String(error?.message || error || 'Native Packaging bootstrap failed.');
    return clientUnavailableResponse(lastReadError, 'packaging_native_bootstrap_unavailable');
  }

  const fallbackReasons = [];

  if (!contractsReady()) {
    const catalog = pendingContract('catalog', 'Catalog', fallbackReasons);
    const inventory = pendingContract('inventory', 'Inventory', fallbackReasons);
    const contentMedia = pendingContract('contentMedia', 'Content media', fallbackReasons);

    // Render templates/projects now. Enrich owner-controlled dropdowns once the
    // verified modular runtime is ready, without reintroducing the retired broad GET.
    scheduleDeferredContractRefresh();
    return composeBootstrap(
      response,
      payload,
      catalog,
      inventory,
      contentMedia,
      fallbackReasons,
      true,
    );
  }

  const facade = contracts();
  const [catalogResult, inventoryResult, mediaResult] = await Promise.allSettled([
    facade.readCatalog({ limit: 500 }),
    facade.readInventory({ limit: 1000 }),
    facade.readContentMedia({ mediaType: 'artwork', limit: 72 }),
  ]);

  const catalog = resolveContract(catalogResult, 'catalog', 'Catalog', fallbackReasons);
  const inventory = resolveContract(inventoryResult, 'inventory', 'Inventory', fallbackReasons);
  const contentMedia = resolveContract(mediaResult, 'contentMedia', 'Content media', fallbackReasons);

  return composeBootstrap(
    response,
    payload,
    catalog,
    inventory,
    contentMedia,
    fallbackReasons,
    false,
  );
}

async function writePackaging(body, projectId = 0) {
  const ready = await waitForContracts();
  if (!ready) {
    lastWriteStatus = 503;
    lastWriteError = 'Packaging modular runtime did not become ready.';
    return clientUnavailableResponse(lastWriteError);
  }

  const auth = globalThis.DDAuth;
  if (!auth || typeof auth.apiFetch !== 'function') {
    lastWriteStatus = 503;
    lastWriteError = 'Packaging authentication transport is unavailable.';
    return clientUnavailableResponse(lastWriteError, 'packaging_auth_transport_unavailable');
  }

  writeCount += 1;
  const url = nativeUrl(NATIVE_WRITE_PATH, projectId);
  let response = null;

  try {
    response = await auth.apiFetch(url, {
      method: 'POST',
      body: JSON.stringify(body || {}),
    });
    lastWriteStatus = Number(response?.status || 0);
    const payload = await readJson(response);
    lastWriteBoundary = payload?.write_boundary && typeof payload.write_boundary === 'object'
      ? Object.freeze({ ...payload.write_boundary })
      : null;
    lastWriteError = response?.ok && payload?.ok
      ? ''
      : String(payload?.error || `Native Packaging write HTTP ${lastWriteStatus || 0}`);

    if (typeof document !== 'undefined' && typeof CustomEvent !== 'undefined') {
      document.dispatchEvent(new CustomEvent('dd:packaging-native-client-write', {
        detail: Object.freeze({
          moduleId: 'packaging',
          build: BUILD,
          count: writeCount,
          status: lastWriteStatus,
          boundary: lastWriteBoundary,
        }),
      }));
    }
    return response;
  } catch (error) {
    lastWriteStatus = 503;
    lastWriteError = String(error?.message || error || 'Native Packaging write failed.');
    return clientUnavailableResponse(lastWriteError, 'packaging_native_write_unavailable');
  }
}

export async function request(body = null, projectId = 0) {
  return body ? writePackaging(body, projectId) : readPackaging(projectId);
}

export function getStatus() {
  const coreReady = lastReadStatus === 200 && bootstrapStatus.serverBootstrapSource === 'packaging-bootstrap';
  return Object.freeze({
    build: BUILD,
    state: contractsReady()
      ? 'ready'
      : (coreReady ? 'core-ready-owner-contracts-pending' : 'waiting-for-packaging-runtime'),
    nativeClient: true,
    nativeBootstrapPath: NATIVE_BOOTSTRAP_PATH,
    nativeWritePath: NATIVE_WRITE_PATH,
    legacyRouteNamedByClient: false,
    ownerContractsReady: contractsReady(),
    ownerContractsPending: Boolean(bootstrapStatus.ownerContractsPending),
    deferredContractRefreshScheduled,
    deferredContractRefreshTriggered,
    readCount,
    writeCount,
    lastReadStatus,
    lastWriteStatus,
    lastReadError,
    lastWriteError,
    lastReadFallbackReasons,
    lastWriteBoundary,
    bootstrap: bootstrapStatus,
  });
}

export function getBootstrapStatus() {
  return bootstrapStatus;
}

export const metadata = Object.freeze({
  build: BUILD,
  nativeBootstrapPath: NATIVE_BOOTSTRAP_PATH,
  nativeWritePath: NATIVE_WRITE_PATH,
  legacyRouteNamedByClient: false,
  behaviorMode: 'core-packaging-first-delayed-owner-contract-enrichment',
});

if (typeof globalThis !== 'undefined') {
  globalThis.DDPackagingNativeClientRuntime = Object.freeze({
    build: BUILD,
    request,
    getStatus,
    getBootstrapStatus,
  });
}
