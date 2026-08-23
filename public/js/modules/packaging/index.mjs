// Devil n Dove Build 284 Packaging module lifecycle + contract consumer boundary.
// Existing Packaging UI/API/D1 logic remains intact; these reads are lazy and
// available only while the verified Packaging module is active.

const PACKAGING_ROUTE_PREFIX = '/admin/packaging-studio';
const REQUIRED_CONTRACTS = Object.freeze(['inventory-read', 'catalog-read', 'content-media']);

let state = 'registered';
let activationCount = 0;
let lastContext = null;
let services = null;

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
    build: 284,
    contractId: serviceId,
    count: Number(result?.count || 0),
  });
  return result;
}

export const metadata = Object.freeze({
  id: 'packaging',
  build: 284,
  routePrefix: PACKAGING_ROUTE_PREFIX,
  requiredContracts: REQUIRED_CONTRACTS,
  behaviorMode: 'contract-integration-bridge',
});

export async function readCatalog(options = {}) { return read('catalog-read', options); }
export async function readInventory(options = {}) { return read('inventory-read', options); }
export async function readContentMedia(options = {}) { return read('content-media', options); }

function installBrowserFacade() {
  if (typeof window === 'undefined') return;
  window.DDPackagingContracts = Object.freeze({
    build: 284,
    requiredContracts: REQUIRED_CONTRACTS,
    readCatalog,
    readInventory,
    readContentMedia,
    getStatus,
  });
}

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
    build: 284,
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
  emit('dd:module-active', {
    moduleId: 'packaging',
    build: 284,
    pathname,
    activationCount,
    contracts: REQUIRED_CONTRACTS,
    servicesReady: true,
  });
}

export async function onDeactivate(context = {}) {
  const previous = state;
  state = 'inactive';
  setDomState('inactive');
  emit('dd:module-inactive', {
    moduleId: 'packaging',
    build: 284,
    previousState: previous,
    reason: String(context.reason || 'route-lifecycle'),
  });
  lastContext = null;
}

export function getStatus() {
  return Object.freeze({
    moduleId: 'packaging',
    build: 284,
    state,
    activationCount,
    lastContext,
    servicesReady: Boolean(services && REQUIRED_CONTRACTS.every((id) => services[id])),
    requiredContracts: REQUIRED_CONTRACTS,
  });
}
