// Devil n Dove Build 285 Packaging module lifecycle + real contract consumption.
// Existing Packaging UI and write APIs remain intact. While Packaging is active,
// the legacy GET bootstrap response is contractized so Catalog and Inventory data
// come from their owner services, with the legacy response retained only as fallback.

const PACKAGING_ROUTE_PREFIX = '/admin/packaging-studio';
const PACKAGING_BOOTSTRAP_PATH = '/api/admin/packaging-studio';
const REQUIRED_CONTRACTS = Object.freeze(['inventory-read', 'catalog-read', 'content-media']);

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
let bootstrapStatus = Object.freeze({
  build: 285,
  contractized: false,
  catalogSource: 'not-read',
  inventorySource: 'not-read',
  contentMediaSource: 'not-read',
  catalogCount: 0,
  inventoryCount: 0,
  contentMediaCount: 0,
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
    build: 285,
    contractId: serviceId,
    count: Number(result?.count || 0),
  });
  return result;
}

function requestPath(input) {
  const raw = typeof input === 'string' ? input : String(input?.url || '');
  if (!raw) return '';
  try {
    return new URL(raw, globalThis.location?.origin || 'https://devilndove.invalid').pathname;
  } catch {
    return raw.split(/[?#]/, 1)[0] || '';
  }
}

function isPackagingBootstrapRequest(input, init = {}) {
  const method = String(init?.method || input?.method || 'GET').toUpperCase();
  return method === 'GET' && requestPath(input) === PACKAGING_BOOTSTRAP_PATH;
}

function resultValue(settled, legacyRows, label, fallbackReasons) {
  if (settled?.status === 'fulfilled' && Array.isArray(settled.value?.rows)) {
    return { rows: settled.value.rows, count: Number(settled.value.count || settled.value.rows.length || 0), source: 'contract' };
  }
  const reason = String(settled?.reason?.message || settled?.reason || `${label} contract unavailable`);
  fallbackReasons.push(`${label}: ${reason}`);
  const rows = Array.isArray(legacyRows) ? legacyRows : [];
  return { rows, count: rows.length, source: 'legacy-fallback' };
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
    panel.textContent = 'Modular data: Packaging is active; waiting for Catalog, Inventory and Content contract reads.';
    return;
  }
  const fallback = bootstrapStatus.fallbackReasons.length ? ` Fallback: ${bootstrapStatus.fallbackReasons.join(' | ')}` : '';
  panel.textContent = `Modular data active — Catalog ${bootstrapStatus.catalogCount} (${bootstrapStatus.catalogSource}); Inventory ${bootstrapStatus.inventoryCount} (${bootstrapStatus.inventorySource}); Content media ${bootstrapStatus.contentMediaCount} (${bootstrapStatus.contentMediaSource}).${fallback}`;
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

async function contractizeBootstrapResponse(response) {
  if (!response?.ok) return response;
  let legacy;
  try {
    legacy = await response.clone().json();
  } catch {
    return response;
  }
  if (!legacy?.ok) return response;

  const [catalogResult, inventoryResult, mediaResult] = await Promise.allSettled([
    readCatalog({ limit: 500 }),
    readInventory({ limit: 1000 }),
    readContentMedia({ mediaType: 'artwork', limit: 72 }),
  ]);

  const fallbackReasons = [];
  const catalog = resultValue(catalogResult, legacy.products, 'Catalog', fallbackReasons);
  const inventory = resultValue(inventoryResult, legacy.inventory, 'Inventory', fallbackReasons);
  const contentMedia = resultValue(mediaResult, legacy.content_media, 'Content media', fallbackReasons);
  availableContentMedia = Object.freeze([...(contentMedia.rows || [])]);

  bootstrapStatus = Object.freeze({
    build: 285,
    contractized: true,
    catalogSource: catalog.source,
    inventorySource: inventory.source,
    contentMediaSource: contentMedia.source,
    catalogCount: catalog.count,
    inventoryCount: inventory.count,
    contentMediaCount: contentMedia.count,
    fallbackReasons: Object.freeze([...fallbackReasons]),
  });
  renderContractStatus();

  const payload = {
    ...legacy,
    products: catalog.rows,
    inventory: inventory.rows,
    content_media: contentMedia.rows,
    module_contracts: {
      build: 285,
      catalog_read: catalog.source,
      inventory_read: inventory.source,
      content_media: contentMedia.source,
      fallback_reasons: [...fallbackReasons],
    },
  };

  emit('dd:packaging-contract-bootstrap', {
    moduleId: 'packaging',
    build: 285,
    catalogSource: catalog.source,
    inventorySource: inventory.source,
    contentMediaSource: contentMedia.source,
    catalogCount: catalog.count,
    inventoryCount: inventory.count,
    contentMediaCount: contentMedia.count,
    fallbackCount: fallbackReasons.length,
  });

  return syntheticJsonResponse(response, payload);
}

function installBootstrapBridge() {
  if (bridgedApiFetch) return true;
  const auth = globalThis.DDAuth;
  if (!auth || typeof auth.apiFetch !== 'function') return false;
  bridgeAuthOwner = auth;
  originalApiFetch = auth.apiFetch;
  bridgedApiFetch = async function ddPackagingContractApiFetch(input, init) {
    const response = await originalApiFetch.call(bridgeAuthOwner, input, init);
    if (state !== 'active' || !isPackagingBootstrapRequest(input, init)) return response;
    try {
      return await contractizeBootstrapResponse(response);
    } catch (error) {
      console.warn('[DD Packaging] contractized bootstrap failed; legacy response retained', error);
      return response;
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
    build: 285,
    requiredContracts: REQUIRED_CONTRACTS,
    readCatalog,
    readInventory,
    readContentMedia,
    getAvailableContentMedia: () => availableContentMedia,
    getBootstrapStatus: () => bootstrapStatus,
    getStatus,
  });
}

export const metadata = Object.freeze({
  id: 'packaging',
  build: 285,
  routePrefix: PACKAGING_ROUTE_PREFIX,
  requiredContracts: REQUIRED_CONTRACTS,
  behaviorMode: 'contract-consumer-bridge',
});

export async function readCatalog(options = {}) { return read('catalog-read', options); }
export async function readInventory(options = {}) { return read('inventory-read', options); }
export async function readContentMedia(options = {}) { return read('content-media', options); }

export async function onLoad({ registry, definition } = {}) {
  if (definition?.id !== 'packaging') {
    throw new Error('Packaging module loaded with the wrong module definition.');
  }
  bindServices(registry);
  state = 'loaded';
  setDomState('loaded');
  installBrowserFacade();
  emit('dd:packaging-module-loaded', {
    moduleId: 'packaging',
    build: 285,
    contracts: REQUIRED_CONTRACTS,
    servicesReady: true,
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
    build: 285,
    pathname,
    activationCount,
    contracts: REQUIRED_CONTRACTS,
    servicesReady: true,
    contractConsumerBridge: true,
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
    build: 285,
    previousState: previous,
    reason: String(context.reason || 'route-lifecycle'),
  });
  lastContext = null;
}

export function getStatus() {
  return Object.freeze({
    moduleId: 'packaging',
    build: 285,
    state,
    activationCount,
    lastContext,
    servicesReady: Boolean(services && REQUIRED_CONTRACTS.every((id) => services[id])),
    bridgeInstalled: Boolean(bridgedApiFetch),
    bootstrapContractized: Boolean(bootstrapStatus.contractized),
    requiredContracts: REQUIRED_CONTRACTS,
  });
}
