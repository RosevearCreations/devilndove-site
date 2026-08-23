// Devil n Dove Build 283 Packaging module lifecycle entry.
// This module owns activation state only in Build 283. Existing Packaging UI,
// APIs, D1 tables and business logic remain in their current files.

const PACKAGING_ROUTE_PREFIX = '/admin/packaging-studio';
const REQUIRED_CONTRACTS = Object.freeze(['inventory-read', 'catalog-read', 'content-media']);

let state = 'registered';
let activationCount = 0;
let lastContext = null;

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

export const metadata = Object.freeze({
  id: 'packaging',
  build: 283,
  routePrefix: PACKAGING_ROUTE_PREFIX,
  requiredContracts: REQUIRED_CONTRACTS,
  behaviorMode: 'compatibility-bridge',
});

export async function onLoad({ definition } = {}) {
  if (definition?.id !== 'packaging') {
    throw new Error('Packaging module loaded with the wrong module definition.');
  }
  state = 'loaded';
  setDomState('loaded');
  emit('dd:packaging-module-loaded', { moduleId: 'packaging', build: 283 });
}

export async function onActivate(context = {}) {
  const user = context.user || null;
  const pathname = context.pathname || (typeof window !== 'undefined' ? window.location?.pathname : '');
  if (!isAdmin(user)) throw new Error('Packaging module activation requires an administrator.');
  if (!isPackagingPath(pathname)) throw new Error(`Packaging module cannot activate for route: ${pathname}`);

  activationCount += 1;
  lastContext = Object.freeze({ pathname, userId: Number(user?.user_id || 0) || null });
  state = 'active';
  setDomState('active');
  emit('dd:module-active', {
    moduleId: 'packaging',
    build: 283,
    pathname,
    activationCount,
    contracts: REQUIRED_CONTRACTS,
  });
}

export async function onDeactivate(context = {}) {
  const previous = state;
  state = 'inactive';
  setDomState('inactive');
  emit('dd:module-inactive', {
    moduleId: 'packaging',
    build: 283,
    previousState: previous,
    reason: String(context.reason || 'route-lifecycle'),
  });
  lastContext = null;
}

export function getStatus() {
  return Object.freeze({
    moduleId: 'packaging',
    build: 283,
    state,
    activationCount,
    lastContext,
    requiredContracts: REQUIRED_CONTRACTS,
  });
}
