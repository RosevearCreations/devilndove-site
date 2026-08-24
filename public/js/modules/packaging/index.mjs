// Devil n Dove Build 286 Packaging module lifecycle + API boundary cleanup.
// Build 296 adds an explicit callable bootstrap transport handle without changing
// the proven Build 286 read implementation or Packaging-owned endpoint.
// Active Packaging GET bootstrap requests use the narrow Packaging-owned endpoint first.
// Catalog, Inventory and Content collections come from owner contracts. Legacy broad GET
// remains rollback-only; Packaging POST/write requests continue to the existing endpoint.

const PACKAGING_ROUTE_PREFIX = '/admin/packaging-studio';
const LEGACY_PACKAGING_BOOTSTRAP_PATH = '/api/admin/packaging-studio';
const NARROW_PACKAGING_BOOTSTRAP_PATH = '/api/admin/packaging-bootstrap';
const REQUIRED_CONTRACTS = Object.freeze(['inventory-read', 'catalog-read', 'content-media']);
const CLIENT_TRANSPORT_BUILD = 296;

let state = 'registered';
let activationCount = 0;
let lastContext = null;
let services = null;
let originalApiFetch = null;
let bridgedApiFetch = null;
let bridgeAuthOwner = null;
let refreshObserver = null;
let refreshScheduled = false;
let refreshTriggered = false;
let availableContentMedia = Object.freeze([]);

const contractCache = {
  catalog: { ready: false, rows: Object.freeze([]) },
  inventory: { ready: false, rows: Object.freeze([]) },
  contentMedia: { ready: false, rows: Object.freeze([]) },
};

let bootstrapStatus = Object.freeze({
  build: 286,
  contractized: false,
  catalogSource: 'not-read',
  inventorySource: 'not-read',
  contentMediaSource: 'not-read',
  catalogCount: 0,
  inventoryCount: 0,
  contentMediaCount: 0,
  serverBootstrapSource: 'not-read',
  bootstrapPath: NARROW_PACKAGING_BOOTSTRAP_PATH,
  legacyEndpointBypassed: false,
  fallbackReasons: Object.freeze([]),
});

function isAdmin(user) {
  return String(user?.role || '').trim().toLowerCase() === 'admin';
}

function isPackagingPath(pathname) {
  const path = String(pathname || '');
  return path === PACKAGING_ROUTE_PREFIX || path.startsWith(`${PACKAGING_ROUTE_PREFIX}/`);
}

function setDomState(value) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.ddPackagingModuleState = value;
  if (document.body) document.body.dataset.ddPackagingModuleState = value;
}

function emit(name, detail = {}) {
  if (typeof document === 'undefined' || typeof CustomEvent === 'undefined') return;
  document.dispatchEvent(new CustomEvent(name, { detail: Object.freeze({ ...detail }) }));
}

function bindServices(registry) {
  const resolved = Object.fromEntries(REQUIRED_CONTRACTS.map((id) => [id, registry?.service?.(id) || null]));
  const missing = REQUIRED_CONTRACTS.filter((id) => !resolved[id]);
  if (missing.length) throw new Error(`Packaging module is missing required services: ${missing.join(', ')}`);
  services = Object.freeze(resolved);
  return services;
}

function assertActive() {
  if (state !== 'active') throw new Error('Packaging contract reads require the active Packaging module.');
  if (!services) throw new Error('Packaging contract services are unavailable.');
}

async function read(serviceId, options = {}) {
  assertActive();
  const service = services[serviceId];
  if (!service || typeof service.list !== 'function') throw new Error(`Packaging service unavailable: ${serviceId}`);
  const result = await service.list(options);
  emit('dd:packaging-contract-read', {
    moduleId: 'packaging',
    build: 286,
    contractId: serviceId,
    count: Number(result?.count || 0),
  });
  return result;
}

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

function isPackagingBootstrapRequest(input, init = {}) {
  return requestMethod(input, init) === 'GET' && requestPath(input) === LEGACY_PACKAGING_BOOTSTRAP_PATH;
}

function narrowBootstrapUrl(input) {
  const parsed = requestUrl(input);
  if (!parsed) return NARROW_PACKAGING_BOOTSTRAP_PATH;
  return `${NARROW_PACKAGING_BOOTSTRAP_PATH}${parsed.search || ''}`;
}

function cacheValue(key, rows) {
  const clean = Object.freeze([...(Array.isArray(rows) ? rows : [])]);
  contractCache[key] = { ready: true, rows: clean };
  return clean;
}

function resolvedContract(settled, cacheKey, label, legacyRows, fallbackReasons) {
  if (settled?.status === 'fulfilled' && Array.isArray(settled.value?.rows)) {
    const rows = cacheValue(cacheKey, settled.value.rows);
    return { rows, count: Number(settled.value.count ?? rows.length), source: 'contract' };
  }

  const reason = String(settled?.reason?.message || settled?.reason || `${label} contract unavailable`);
  fallbackReasons.push(`${label}: ${reason}`);

  const cached = contractCache[cacheKey];
  if (cached?.ready) {
    return { rows: cached.rows, count: cached.rows.length, source: 'session-cache' };
  }

  if (Array.isArray(legacyRows)) {
    return { rows: Object.freeze([...legacyRows]), count: legacyRows.length, source: 'legacy-endpoint-fallback' };
  }

  return { rows: Object.freeze([]), count: 0, source: 'contract-unavailable' };
}

function ensureContractStatusPanel() {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
  let panel = document.getElementById('ddPackagingContractStatus');
  if (panel) return panel;
  const anchor = document.getElementById('packagingStudioMessage') || document.getElementById('packagingStudioMain');
  if (!anchor) return null;
  panel = document.createElement('section');
  panel.id = 'ddPackagingContractStatus';
  panel.className = 'card small';
  panel.setAttribute('data-dd-packaging-contract-status', '');
  if (typeof anchor.insertAdjacentElement === 'function') anchor.insertAdjacentElement('afterend', panel);
  else if (anchor.parentNode?.insertBefore) anchor.parentNode.insertBefore(panel, anchor.nextSibling || null);
  return panel;
}

function renderContractStatus() {
  const panel = ensureContractStatusPanel();
  if (!panel) return;
  if (!bootstrapStatus.contractized) {
    panel.textContent = 'Modular data: Packaging is active; waiting for the narrow Packaging bootstrap and owner contracts.';
    return;
  }
  const fallback = bootstrapStatus.fallbackReasons.length ? ` Fallback: ${bootstrapStatus.fallbackReasons.join(' | ')}` : '';
  panel.textContent = `Modular data active — Packaging bootstrap ${bootstrapStatus.serverBootstrapSource}; Catalog ${bootstrapStatus.catalogCount} (${bootstrapStatus.catalogSource}); Inventory ${bootstrapStatus.inventoryCount} (${bootstrapStatus.inventorySource}); Content media ${bootstrapStatus.contentMediaCount} (${bootstrapStatus.contentMediaSource}).${fallback}`;
}

function syntheticJsonResponse(response, payload) {
  if (typeof Response === 'undefined' || typeof Headers === 'undefined') return response;
  const headers = new Headers(response.headers || undefined);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(payload), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function readJsonResponse(response) {
  if (!response) return null;
  try { return await response.clone().json(); }
  catch { return null; }
}

async function fetchLegacyBootstrap(input, init) {
  if (!originalApiFetch || !bridgeAuthOwner) return { response: null, payload: null };
  const response = await originalApiFetch.call(bridgeAuthOwner, input, init);
  const payload = response?.ok ? await readJsonResponse(response) : null;
  return { response, payload };
}

async function contractizeBootstrapResponse(serverResponse, serverPayload, {
  input,
  init,
  serverBootstrapSource,
  legacyEndpointBypassed,
} = {}) {
  if (!serverResponse?.ok || !serverPayload?.ok) return serverResponse;

  const [catalogResult, inventoryResult, mediaResult] = await Promise.allSettled([
    readCatalog({ limit: 500 }),
    readInventory({ limit: 1000 }),
    readContentMedia({ mediaType: 'artwork', limit: 72 }),
  ]);

  const needsLegacyData = [catalogResult, inventoryResult, mediaResult].some((settled, index) => {
    if (settled?.status === 'fulfilled' && Array.isArray(settled.value?.rows)) return false;
    const key = ['catalog', 'inventory', 'contentMedia'][index];
    return !contractCache[key]?.ready;
  });

  let legacyPayload = null;
  let usedLegacyEndpointForData = false;
  if (needsLegacyData && serverBootstrapSource !== 'legacy-endpoint-fallback') {
    try {
      const fallback = await fetchLegacyBootstrap(input, init);
      if (fallback.response?.ok && fallback.payload?.ok) {
        legacyPayload = fallback.payload;
        usedLegacyEndpointForData = true;
      }
    } catch (error) {
      console.warn('[DD Packaging] rollback GET was unavailable', error);
    }
  } else if (serverBootstrapSource === 'legacy-endpoint-fallback') {
    legacyPayload = serverPayload;
  }

  const fallbackReasons = [];
  const catalog = resolvedContract(catalogResult, 'catalog', 'Catalog', legacyPayload?.products, fallbackReasons);
  const inventory = resolvedContract(inventoryResult, 'inventory', 'Inventory', legacyPayload?.inventory, fallbackReasons);
  const contentMedia = resolvedContract(mediaResult, 'contentMedia', 'Content media', legacyPayload?.content_media, fallbackReasons);
  availableContentMedia = Object.freeze([...(contentMedia.rows || [])]);

  const effectiveServerSource = usedLegacyEndpointForData
    ? 'packaging-bootstrap-with-legacy-data-fallback'
    : serverBootstrapSource;
  const effectiveLegacyBypass = Boolean(legacyEndpointBypassed && !usedLegacyEndpointForData);

  bootstrapStatus = Object.freeze({
    build: 286,
    contractized: true,
    catalogSource: catalog.source,
    inventorySource: inventory.source,
    contentMediaSource: contentMedia.source,
    catalogCount: catalog.count,
    inventoryCount: inventory.count,
    contentMediaCount: contentMedia.count,
    serverBootstrapSource: effectiveServerSource,
    bootstrapPath: NARROW_PACKAGING_BOOTSTRAP_PATH,
    legacyEndpointBypassed: effectiveLegacyBypass,
    fallbackReasons: Object.freeze([...fallbackReasons]),
  });
  renderContractStatus();

  const payload = {
    ...serverPayload,
    products: catalog.rows,
    inventory: inventory.rows,
    content_media: contentMedia.rows,
    module_contracts: {
      build: 286,
      catalog_read: catalog.source,
      inventory_read: inventory.source,
      content_media: contentMedia.source,
      packaging_bootstrap: effectiveServerSource,
      legacy_endpoint_bypassed: effectiveLegacyBypass,
      fallback_reasons: [...fallbackReasons],
    },
  };

  emit('dd:packaging-contract-bootstrap', {
    moduleId: 'packaging',
    build: 286,
    catalogSource: catalog.source,
    inventorySource: inventory.source,
    contentMediaSource: contentMedia.source,
    catalogCount: catalog.count,
    inventoryCount: inventory.count,
    contentMediaCount: contentMedia.count,
    serverBootstrapSource: effectiveServerSource,
    legacyEndpointBypassed: effectiveLegacyBypass,
    fallbackCount: fallbackReasons.length,
  });

  return syntheticJsonResponse(serverResponse, payload);
}

function installBootstrapBridge() {
  if (bridgedApiFetch) return true;
  const auth = globalThis.DDAuth;
  if (!auth || typeof auth.apiFetch !== 'function') return false;

  bridgeAuthOwner = auth;
  originalApiFetch = auth.apiFetch;
  bridgedApiFetch = async function ddPackagingBoundaryApiFetch(input, init) {
    if (state !== 'active' || !isPackagingBootstrapRequest(input, init)) {
      return originalApiFetch.call(bridgeAuthOwner, input, init);
    }

    let serverResponse = null;
    let serverPayload = null;
    let serverBootstrapSource = 'packaging-bootstrap';
    let legacyEndpointBypassed = true;

    try {
      serverResponse = await originalApiFetch.call(bridgeAuthOwner, narrowBootstrapUrl(input), init);
      serverPayload = serverResponse?.ok ? await readJsonResponse(serverResponse) : null;
      if (!serverResponse?.ok || !serverPayload?.ok) throw new Error(serverPayload?.error || `Narrow Packaging bootstrap HTTP ${serverResponse?.status || 0}`);
    } catch (error) {
      console.warn('[DD Packaging] narrow bootstrap unavailable; using rollback GET', error);
      const fallback = await fetchLegacyBootstrap(input, init);
      serverResponse = fallback.response;
      serverPayload = fallback.payload;
      serverBootstrapSource = 'legacy-endpoint-fallback';
      legacyEndpointBypassed = false;
    }

    try {
      return await contractizeBootstrapResponse(serverResponse, serverPayload, {
        input,
        init,
        serverBootstrapSource,
        legacyEndpointBypassed,
      });
    } catch (error) {
      console.warn('[DD Packaging] contractized bootstrap failed; server response retained', error);
      return serverResponse;
    }
  };

  auth.apiFetch = bridgedApiFetch;
  return true;
}

function removeBootstrapBridge() {
  if (bridgeAuthOwner && bridgedApiFetch && bridgeAuthOwner.apiFetch === bridgedApiFetch && originalApiFetch) {
    bridgeAuthOwner.apiFetch = originalApiFetch;
  }
  bridgedApiFetch = null;
  originalApiFetch = null;
  bridgeAuthOwner = null;
}

function triggerContractRefresh() {
  if (refreshTriggered || bootstrapStatus.contractized || typeof document === 'undefined') return false;
  const button = document.getElementById('refreshPackagingStudio');
  if (!button || typeof button.click !== 'function') return false;
  refreshTriggered = true;
  button.click();
  return true;
}

function scheduleContractRefresh() {
  if (refreshScheduled || typeof document === 'undefined') return;
  refreshScheduled = true;
  const messageNode = document.getElementById('packagingStudioMessage');
  const legacyLoaded = () => /Labeling\s*&\s*Packaging\s*System loaded/i.test(String(messageNode?.textContent || ''));

  if (bootstrapStatus.contractized) return;
  if (!messageNode || legacyLoaded()) {
    triggerContractRefresh();
    return;
  }
  if (typeof MutationObserver !== 'function') {
    triggerContractRefresh();
    return;
  }

  refreshObserver = new MutationObserver(() => {
    if (bootstrapStatus.contractized) {
      refreshObserver?.disconnect();
      refreshObserver = null;
      return;
    }
    if (legacyLoaded()) {
      refreshObserver?.disconnect();
      refreshObserver = null;
      triggerContractRefresh();
    }
  });
  refreshObserver.observe(messageNode, { childList: true, subtree: true, characterData: true });
}

function installBrowserFacade() {
  if (typeof window === 'undefined') return;
  window.DDPackagingContracts = Object.freeze({
    build: 286,
    clientTransportBuild: CLIENT_TRANSPORT_BUILD,
    requiredContracts: REQUIRED_CONTRACTS,
    readCatalog,
    readInventory,
    readContentMedia,
    transportBootstrapRequest,
    getAvailableContentMedia: () => availableContentMedia,
    getBootstrapStatus: () => bootstrapStatus,
    getStatus,
  });
}

export const metadata = Object.freeze({
  id: 'packaging',
  build: 286,
  clientTransportBuild: CLIENT_TRANSPORT_BUILD,
  routePrefix: PACKAGING_ROUTE_PREFIX,
  bootstrapPath: NARROW_PACKAGING_BOOTSTRAP_PATH,
  requiredContracts: REQUIRED_CONTRACTS,
  behaviorMode: 'api-boundary-cleanup-bridge',
});

export async function readCatalog(options = {}) { return read('catalog-read', options); }
export async function readInventory(options = {}) { return read('inventory-read', options); }
export async function readContentMedia(options = {}) { return read('content-media', options); }
export async function transportBootstrapRequest(input, init) {
  if (state !== 'active') throw new Error('Packaging bootstrap transport requires the active Packaging module.');
  if (typeof bridgedApiFetch !== 'function') throw new Error('Packaging bootstrap transport is unavailable.');
  return bridgedApiFetch(input, init);
}

export async function onLoad({ registry, definition } = {}) {
  if (definition?.id !== 'packaging') throw new Error('Packaging module loaded with the wrong module definition.');
  bindServices(registry);
  state = 'loaded';
  setDomState('loaded');
  installBrowserFacade();
  emit('dd:packaging-module-loaded', {
    moduleId: 'packaging',
    build: 286,
    contracts: REQUIRED_CONTRACTS,
    servicesReady: true,
    bootstrapPath: NARROW_PACKAGING_BOOTSTRAP_PATH,
  });
}

export async function onActivate(context = {}) {
  const user = context.user || null;
  const pathname = context.pathname || (typeof window !== 'undefined' ? window.location?.pathname : '');
  if (!isAdmin(user)) throw new Error('Packaging module activation requires an administrator.');
  if (!isPackagingPath(pathname)) throw new Error(`Packaging module cannot activate for route: ${pathname}`);
  if (!services) bindServices(context.registry);

  activationCount += 1;
  lastContext = Object.freeze({ pathname, userId: Number(user?.user_id || 0) || null });
  state = 'active';
  setDomState('active');
  installBootstrapBridge();
  renderContractStatus();
  scheduleContractRefresh();
  emit('dd:module-active', {
    moduleId: 'packaging',
    build: 286,
    pathname,
    activationCount,
    contracts: REQUIRED_CONTRACTS,
    servicesReady: true,
    apiBoundaryCleanupBridge: true,
    bootstrapPath: NARROW_PACKAGING_BOOTSTRAP_PATH,
  });
}

export async function onDeactivate(context = {}) {
  const previous = state;
  state = 'inactive';
  refreshObserver?.disconnect?.();
  refreshObserver = null;
  removeBootstrapBridge();
  setDomState('inactive');
  emit('dd:module-inactive', {
    moduleId: 'packaging',
    build: 286,
    previousState: previous,
    reason: String(context.reason || 'route-lifecycle'),
  });
  lastContext = null;
}

export function getStatus() {
  return Object.freeze({
    moduleId: 'packaging',
    build: 286,
    clientTransportBuild: CLIENT_TRANSPORT_BUILD,
    state,
    activationCount,
    lastContext,
    servicesReady: Boolean(services && REQUIRED_CONTRACTS.every((id) => services[id])),
    bridgeInstalled: Boolean(bridgedApiFetch),
    transportBootstrapReady: Boolean(state === 'active' && bridgedApiFetch),
    bootstrapContractized: Boolean(bootstrapStatus.contractized),
    bootstrapPath: NARROW_PACKAGING_BOOTSTRAP_PATH,
    legacyEndpointBypassed: Boolean(bootstrapStatus.legacyEndpointBypassed),
    requiredContracts: REQUIRED_CONTRACTS,
  });
}