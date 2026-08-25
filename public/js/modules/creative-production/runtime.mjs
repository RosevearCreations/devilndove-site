// Devil n Dove Build 350 — Creative & Production passive umbrella runtime.
// Build 351 enables explicit Packaging Studio coverage only.
// This top-level runtime performs no reads/writes itself and does not replace the proven Packaging domain runtime.

const BUILD = 350;
const ACTIVATION_BUILD = 351;
const MODULE_ID = 'creative-production';
const SUPPORTED_DOMAINS = Object.freeze(['packaging']);
const PACKAGING_RUNTIME_PAGES = Object.freeze(['/admin/packaging-studio/']);
const REQUIRED_SERVICES = Object.freeze(['inventory-read', 'catalog-read', 'content-media']);

let state = 'registered';
let activationCount = 0;
let currentDomain = null;
let lastPathname = '';
let servicesReady = false;
let activeRequiredServices = Object.freeze([]);

function authenticatedAdmin(user) {
  return Boolean(user && String(user.role || '').trim().toLowerCase() === 'admin');
}
function normalizeDomain(domainId) {
  return String(domainId || '').trim().toLowerCase();
}
function normalizePathname(pathname) {
  const raw = String(pathname || '').trim() || '/';
  if (raw === '/') return raw;
  return raw.endsWith('/') ? raw : `${raw}/`;
}
function supportedDomain(domainId) {
  return SUPPORTED_DOMAINS.includes(normalizeDomain(domainId));
}
function supportedPathForDomain(domainId, pathname) {
  return normalizeDomain(domainId) === 'packaging' && PACKAGING_RUNTIME_PAGES.includes(normalizePathname(pathname));
}
function verifyServices(registry) {
  const missing = REQUIRED_SERVICES.filter((serviceId) => !registry?.service?.(serviceId));
  if (missing.length) {
    throw new Error(`Creative & Production Packaging boundary is missing required services: ${missing.join(', ')}`);
  }
  activeRequiredServices = Object.freeze([...REQUIRED_SERVICES]);
  servicesReady = true;
  return true;
}
function packagingDomainRuntimeStatus() {
  try { return globalThis.DDPackagingContracts?.getStatus?.() || null; }
  catch { return null; }
}
function emit(name, detail = {}) {
  if (typeof document === 'undefined' || typeof CustomEvent === 'undefined') return;
  document.dispatchEvent(new CustomEvent(name, {
    detail: Object.freeze({ applicationModuleId: MODULE_ID, build: BUILD, activationBuild: ACTIVATION_BUILD, ...detail }),
  }));
}
function installFacade() {
  if (typeof window === 'undefined') return;
  window.DDCreativeProduction = Object.freeze({
    build: BUILD,
    activationBuild: ACTIVATION_BUILD,
    moduleId: MODULE_ID,
    supportedDomains: SUPPORTED_DOMAINS,
    packagingRuntimePages: PACKAGING_RUNTIME_PAGES,
    requiredServices: REQUIRED_SERVICES,
    createsNetworkTransport: false,
    packagingMutationOwnership: false,
    creativeMutationOwnership: false,
    supportedPathForDomain,
    getPackagingDomainRuntimeStatus: packagingDomainRuntimeStatus,
    getStatus,
  });
}

export const metadata = Object.freeze({
  id: MODULE_ID,
  build: BUILD,
  activationBuild: ACTIVATION_BUILD,
  kind: 'application-module-runtime',
  supportedDomains: SUPPORTED_DOMAINS,
  packagingRuntimePages: PACKAGING_RUNTIME_PAGES,
  requiredServices: REQUIRED_SERVICES,
  behaviorMode: 'packaging-explicit-single-page-wrapper-over-proven-domain-runtime',
  createsNetworkTransport: false,
  ownsPackagingMutations: false,
  ownsCreativeMutations: false,
  packagingBaselineBuild: 301,
});

export async function onLoad({ registry, applicationModule, domainDefinition, pathname } = {}) {
  if (applicationModule?.id !== MODULE_ID) throw new Error('Creative & Production runtime loaded with the wrong application-module definition.');
  if (!supportedDomain(domainDefinition?.id)) throw new Error(`Creative & Production Build ${BUILD} cannot load for domain: ${domainDefinition?.id || 'unknown'}`);
  if (!supportedPathForDomain(domainDefinition?.id, pathname)) {
    throw new Error(`Creative & Production Build ${BUILD} has no proven Packaging runtime coverage for: ${normalizePathname(pathname)}`);
  }
  verifyServices(registry);
  state = 'loaded';
  installFacade();
  emit('dd:creative-production-loaded', {
    state,
    domainId: normalizeDomain(domainDefinition.id),
    pathname: normalizePathname(pathname),
    servicesReady,
    activeRequiredServices,
    packagingBaselineBuild: 301,
  });
}

export async function onActivate({ registry, applicationModule, domainDefinition, user, pathname } = {}) {
  if (applicationModule?.id !== MODULE_ID) throw new Error('Creative & Production runtime activated with the wrong application-module definition.');
  if (!authenticatedAdmin(user)) throw new Error('Creative & Production runtime activation requires an administrator.');
  if (!supportedDomain(domainDefinition?.id)) throw new Error(`Creative & Production Build ${BUILD} cannot activate for domain: ${domainDefinition?.id || 'unknown'}`);
  if (!supportedPathForDomain(domainDefinition?.id, pathname)) {
    throw new Error(`Creative & Production Build ${BUILD} has no proven Packaging runtime coverage for: ${normalizePathname(pathname)}`);
  }
  verifyServices(registry);
  activationCount += 1;
  currentDomain = normalizeDomain(domainDefinition.id);
  lastPathname = normalizePathname(pathname);
  state = 'active';
  installFacade();
  emit('dd:creative-production-active', {
    state,
    domainId: currentDomain,
    pathname: lastPathname,
    activationCount,
    servicesReady,
    activeRequiredServices,
    packagingMutationOwnership: false,
  });
}

export async function onDeactivate({ reason = 'route-lifecycle' } = {}) {
  const previousDomain = currentDomain;
  state = 'inactive';
  currentDomain = null;
  lastPathname = '';
  servicesReady = false;
  activeRequiredServices = Object.freeze([]);
  installFacade();
  emit('dd:creative-production-inactive', { state, previousDomain, reason: String(reason) });
}

export function getStatus() {
  const packaging = packagingDomainRuntimeStatus();
  return Object.freeze({
    build: BUILD,
    activationBuild: ACTIVATION_BUILD,
    moduleId: MODULE_ID,
    state,
    activationCount,
    currentDomain,
    lastPathname,
    supportedDomains: SUPPORTED_DOMAINS,
    packagingRuntimePages: PACKAGING_RUNTIME_PAGES,
    requiredServices: REQUIRED_SERVICES,
    activeRequiredServices,
    servicesReady,
    createsNetworkTransport: false,
    packagingMutationOwnership: false,
    creativeMutationOwnership: false,
    ownsPackagingMutations: false,
    ownsCreativeMutations: false,
    packagingBaselineBuild: 301,
    packagingRuntimeActive: state === 'active' && currentDomain === 'packaging',
    packagingRuntimeBoundaryActive: state === 'active' && currentDomain === 'packaging',
    currentPackagingPageProven: state === 'active' && currentDomain === 'packaging' && PACKAGING_RUNTIME_PAGES.includes(lastPathname),
    packagingDomainRuntimePresent: Boolean(packaging),
    packagingDomainRuntimeState: packaging?.state || null,
    packagingDomainRuntimeBuild: Number(packaging?.build || 0) || null,
    packagingClientTransportBuild: Number(packaging?.clientTransportBuild || 0) || null,
    packagingClientTransportReady: packaging?.clientTransportReady === true,
    packagingLegacyGetFallbackRemoved: packaging?.legacyGetFallbackRemoved === true,
    packagingLegacyServerGetReachable: packaging?.legacyServerGetReachable === true,
    packagingWriteResponseBridgeArmed: packaging?.writeResponseBridgeArmed === true,
  });
}

installFacade();
