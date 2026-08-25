// Devil n Dove Build 353 — Creative & Production passive umbrella runtime.
// Build 354 extends explicit coverage from the proven Packaging Studio to Creative Process.
// This top-level runtime performs no reads/writes itself and does not move domain mutation authority.

import { ensureCreativeProcessReadService } from './creative-process-read-service.mjs?v=353';

const BUILD = 353;
const ACTIVATION_BUILD = 354;
const MODULE_ID = 'creative-production';
const SUPPORTED_DOMAINS = Object.freeze(['packaging', 'creative']);
const PACKAGING_RUNTIME_PAGES = Object.freeze(['/admin/packaging-studio/']);
const CREATIVE_PROCESS_RUNTIME_PAGES = Object.freeze(['/admin/creative-process/']);
const PACKAGING_REQUIRED_SERVICES = Object.freeze(['inventory-read', 'catalog-read', 'content-media']);
const CREATIVE_REQUIRED_SERVICES = Object.freeze(['creative-process-read', 'inventory-read', 'inventory-post', 'inventory-reverse']);
const CREATIVE_PROCESS_READ_CONTRACT = '/api/admin/contracts/creative-process-read';
const CREATIVE_PROCESS_READ_CONTRACT_BUILD = 352;

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
  const domain = normalizeDomain(domainId);
  const path = normalizePathname(pathname);
  if (domain === 'packaging') return PACKAGING_RUNTIME_PAGES.includes(path);
  if (domain === 'creative') return CREATIVE_PROCESS_RUNTIME_PAGES.includes(path);
  return false;
}
function requiredServicesForDomain(domainId) {
  return normalizeDomain(domainId) === 'creative'
    ? CREATIVE_REQUIRED_SERVICES
    : PACKAGING_REQUIRED_SERVICES;
}
function ensureDomainServices(registry, domainId) {
  if (normalizeDomain(domainId) === 'creative') ensureCreativeProcessReadService(registry);
  const required = requiredServicesForDomain(domainId);
  const missing = required.filter((serviceId) => !registry?.service?.(serviceId));
  if (missing.length) {
    throw new Error(`Creative & Production ${normalizeDomain(domainId)} boundary is missing required services: ${missing.join(', ')}`);
  }
  activeRequiredServices = Object.freeze([...required]);
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
    creativeProcessRuntimePages: CREATIVE_PROCESS_RUNTIME_PAGES,
    packagingRequiredServices: PACKAGING_REQUIRED_SERVICES,
    creativeRequiredServices: CREATIVE_REQUIRED_SERVICES,
    creativeProcessReadContract: CREATIVE_PROCESS_READ_CONTRACT,
    creativeProcessReadContractBuild: CREATIVE_PROCESS_READ_CONTRACT_BUILD,
    createsNetworkTransport: false,
    packagingMutationOwnership: false,
    creativeMutationOwnership: false,
    supportedPathForDomain,
    requiredServicesForDomain,
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
  creativeProcessRuntimePages: CREATIVE_PROCESS_RUNTIME_PAGES,
  packagingRequiredServices: PACKAGING_REQUIRED_SERVICES,
  creativeRequiredServices: CREATIVE_REQUIRED_SERVICES,
  creativeProcessReadContract: CREATIVE_PROCESS_READ_CONTRACT,
  creativeProcessReadContractBuild: CREATIVE_PROCESS_READ_CONTRACT_BUILD,
  behaviorMode: 'packaging-plus-creative-process-explicit-page-coverage',
  createsNetworkTransport: false,
  ownsPackagingMutations: false,
  ownsCreativeMutations: false,
  packagingBaselineBuild: 301,
});

export async function onLoad({ registry, applicationModule, domainDefinition, pathname } = {}) {
  if (applicationModule?.id !== MODULE_ID) throw new Error('Creative & Production runtime loaded with the wrong application-module definition.');
  if (!supportedDomain(domainDefinition?.id)) throw new Error(`Creative & Production Build ${BUILD} cannot load for domain: ${domainDefinition?.id || 'unknown'}`);
  if (!supportedPathForDomain(domainDefinition?.id, pathname)) {
    throw new Error(`Creative & Production Build ${BUILD} has no proven runtime coverage for: ${normalizePathname(pathname)}`);
  }
  ensureDomainServices(registry, domainDefinition.id);
  state = 'loaded';
  installFacade();
  emit('dd:creative-production-loaded', {
    state,
    domainId: normalizeDomain(domainDefinition.id),
    pathname: normalizePathname(pathname),
    servicesReady,
    activeRequiredServices,
    packagingBaselineBuild: 301,
    creativeProcessReadContractBuild: CREATIVE_PROCESS_READ_CONTRACT_BUILD,
  });
}

export async function onActivate({ registry, applicationModule, domainDefinition, user, pathname } = {}) {
  if (applicationModule?.id !== MODULE_ID) throw new Error('Creative & Production runtime activated with the wrong application-module definition.');
  if (!authenticatedAdmin(user)) throw new Error('Creative & Production runtime activation requires an administrator.');
  if (!supportedDomain(domainDefinition?.id)) throw new Error(`Creative & Production Build ${BUILD} cannot activate for domain: ${domainDefinition?.id || 'unknown'}`);
  if (!supportedPathForDomain(domainDefinition?.id, pathname)) {
    throw new Error(`Creative & Production Build ${BUILD} has no proven runtime coverage for: ${normalizePathname(pathname)}`);
  }
  ensureDomainServices(registry, domainDefinition.id);
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
    creativeMutationOwnership: false,
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
  const currentRequired = currentDomain ? requiredServicesForDomain(currentDomain) : Object.freeze([]);
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
    creativeProcessRuntimePages: CREATIVE_PROCESS_RUNTIME_PAGES,
    packagingRequiredServices: PACKAGING_REQUIRED_SERVICES,
    creativeRequiredServices: CREATIVE_REQUIRED_SERVICES,
    requiredServices: currentRequired,
    activeRequiredServices,
    servicesReady,
    createsNetworkTransport: false,
    packagingMutationOwnership: false,
    creativeMutationOwnership: false,
    ownsPackagingMutations: false,
    ownsCreativeMutations: false,
    creativeProcessReadContract: CREATIVE_PROCESS_READ_CONTRACT,
    creativeProcessReadContractBuild: CREATIVE_PROCESS_READ_CONTRACT_BUILD,
    packagingBaselineBuild: 301,
    packagingRuntimeActive: state === 'active' && currentDomain === 'packaging',
    creativeProcessRuntimeActive: state === 'active' && currentDomain === 'creative',
    currentPackagingPageProven: state === 'active' && currentDomain === 'packaging' && PACKAGING_RUNTIME_PAGES.includes(lastPathname),
    currentCreativeProcessPageProven: state === 'active' && currentDomain === 'creative' && CREATIVE_PROCESS_RUNTIME_PAGES.includes(lastPathname),
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
