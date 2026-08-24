// Devil n Dove Build 304 Commerce & Operations umbrella runtime.
// First extraction scope: Catalog routes only. This runtime creates no network request
// by itself and preserves existing Catalog page/business logic while Core gains a real
// top-level application-module lifecycle boundary.

const BUILD = 304;
const MODULE_ID = 'commerce-operations';
const SUPPORTED_DOMAINS = Object.freeze(['catalog']);
const REQUIRED_SERVICES = Object.freeze(['catalog-read']);

let state = 'registered';
let activationCount = 0;
let currentDomain = null;
let lastPathname = '';
let servicesReady = false;

function authenticatedAdmin(user) {
  return Boolean(user && String(user.role || '').trim().toLowerCase() === 'admin');
}

function supportedDomain(domainId) {
  return SUPPORTED_DOMAINS.includes(String(domainId || '').trim().toLowerCase());
}

function verifyServices(registry) {
  const missing = REQUIRED_SERVICES.filter((serviceId) => !registry?.service?.(serviceId));
  if (missing.length) throw new Error(`Commerce & Operations is missing required services: ${missing.join(', ')}`);
  servicesReady = true;
  return true;
}

function emit(name, detail = {}) {
  if (typeof document === 'undefined' || typeof CustomEvent === 'undefined') return;
  document.dispatchEvent(new CustomEvent(name, {
    detail: Object.freeze({
      applicationModuleId: MODULE_ID,
      build: BUILD,
      ...detail,
    }),
  }));
}

function installFacade() {
  if (typeof window === 'undefined') return;
  window.DDCommerceOperations = Object.freeze({
    build: BUILD,
    moduleId: MODULE_ID,
    supportedDomains: SUPPORTED_DOMAINS,
    requiredServices: REQUIRED_SERVICES,
    getStatus,
  });
}

export const metadata = Object.freeze({
  id: MODULE_ID,
  build: BUILD,
  kind: 'application-module-runtime',
  supportedDomains: SUPPORTED_DOMAINS,
  requiredServices: REQUIRED_SERVICES,
  behaviorMode: 'catalog-first-umbrella-runtime-boundary',
  createsNetworkTransport: false,
});

export async function onLoad({ registry, applicationModule } = {}) {
  if (applicationModule?.id !== MODULE_ID) {
    throw new Error('Commerce & Operations runtime loaded with the wrong application-module definition.');
  }
  verifyServices(registry);
  state = 'loaded';
  installFacade();
  emit('dd:commerce-operations-loaded', {
    state,
    servicesReady,
    supportedDomains: SUPPORTED_DOMAINS,
  });
}

export async function onActivate({ registry, applicationModule, domainDefinition, user, pathname } = {}) {
  if (applicationModule?.id !== MODULE_ID) {
    throw new Error('Commerce & Operations runtime activated with the wrong application-module definition.');
  }
  if (!authenticatedAdmin(user)) {
    throw new Error('Commerce & Operations runtime activation requires an administrator.');
  }
  if (!supportedDomain(domainDefinition?.id)) {
    throw new Error(`Commerce & Operations Build 304 cannot activate for domain: ${domainDefinition?.id || 'unknown'}`);
  }
  verifyServices(registry);

  activationCount += 1;
  currentDomain = String(domainDefinition.id);
  lastPathname = String(pathname || '');
  state = 'active';
  installFacade();
  emit('dd:commerce-operations-active', {
    state,
    domainId: currentDomain,
    pathname: lastPathname,
    activationCount,
    servicesReady,
  });
}

export async function onDeactivate({ reason = 'route-lifecycle' } = {}) {
  const previousDomain = currentDomain;
  state = 'inactive';
  currentDomain = null;
  lastPathname = '';
  installFacade();
  emit('dd:commerce-operations-inactive', {
    state,
    previousDomain,
    reason: String(reason),
  });
}

export function getStatus() {
  return Object.freeze({
    build: BUILD,
    moduleId: MODULE_ID,
    state,
    activationCount,
    currentDomain,
    lastPathname,
    supportedDomains: SUPPORTED_DOMAINS,
    requiredServices: REQUIRED_SERVICES,
    servicesReady,
    createsNetworkTransport: false,
    catalogRuntimeBoundaryActive: state === 'active' && currentDomain === 'catalog',
  });
}

installFacade();
