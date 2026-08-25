// Devil n Dove Build 360 — Creative & Production passive umbrella runtime.
// Build 361 extends explicit coverage to CAIP while keeping all mutations domain-owned.
// Build 358 remains the Creative Process dependency-gate correction: Inventory-owned mutation
// authorities are declared/consumed by the retained POST path, not Core activation services.
// This top-level runtime performs no reads/writes itself and does not move domain mutation authority.

import { ensureCreativeProcessReadService } from './creative-process-read-service.mjs?v=353';
import { ensureContentStudioReadService } from './content-studio-read-service.mjs?v=356';
import { ensureCaipReadServices } from './caip-read-services.mjs?v=360';

const BUILD = 360;
const ACTIVATION_BUILD = 361;
const DEPENDENCY_GATE_FIX_BUILD = 358;
const MODULE_ID = 'creative-production';
const SUPPORTED_DOMAINS = Object.freeze(['packaging', 'creative', 'content', 'caip']);
const PACKAGING_RUNTIME_PAGES = Object.freeze(['/admin/packaging-studio/']);
const CREATIVE_PROCESS_RUNTIME_PAGES = Object.freeze(['/admin/creative-process/']);
const CONTENT_STUDIO_RUNTIME_PAGES = Object.freeze(['/admin/content-studio/']);
const CAIP_RUNTIME_PAGES = Object.freeze(['/admin/creative-assets/']);
const PACKAGING_REQUIRED_SERVICES = Object.freeze(['inventory-read', 'catalog-read', 'content-media']);
const CREATIVE_REQUIRED_SERVICES = Object.freeze(['creative-process-read', 'inventory-read']);
const CREATIVE_MUTATION_AUTHORITIES = Object.freeze(['inventory-post', 'inventory-reverse']);
const CONTENT_REQUIRED_SERVICES = Object.freeze(['content-studio-read']);
const CAIP_REQUIRED_SERVICES = Object.freeze(['caip-read', 'caip-media-intake-read']);
const CREATIVE_PROCESS_READ_CONTRACT = '/api/admin/contracts/creative-process-read';
const CREATIVE_PROCESS_READ_CONTRACT_BUILD = 352;
const CONTENT_STUDIO_READ_CONTRACT = '/api/admin/contracts/content-studio-read';
const CONTENT_STUDIO_READ_CONTRACT_BUILD = 355;
const CAIP_READ_CONTRACT = '/api/admin/contracts/caip-read';
const CAIP_MEDIA_INTAKE_READ_CONTRACT = '/api/admin/contracts/caip-media-intake-read';
const CAIP_READ_CONTRACT_BUILD = 359;
const CAIP_MEDIA_INTAKE_READ_CONTRACT_BUILD = 359;

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
  if (domain === 'content') return CONTENT_STUDIO_RUNTIME_PAGES.includes(path);
  if (domain === 'caip') return CAIP_RUNTIME_PAGES.includes(path);
  return false;
}
function requiredServicesForDomain(domainId) {
  const domain = normalizeDomain(domainId);
  if (domain === 'creative') return CREATIVE_REQUIRED_SERVICES;
  if (domain === 'content') return CONTENT_REQUIRED_SERVICES;
  if (domain === 'caip') return CAIP_REQUIRED_SERVICES;
  return PACKAGING_REQUIRED_SERVICES;
}
function ensureDomainServices(registry, domainId) {
  const domain = normalizeDomain(domainId);
  if (domain === 'creative') ensureCreativeProcessReadService(registry);
  if (domain === 'content') ensureContentStudioReadService(registry);
  if (domain === 'caip') ensureCaipReadServices(registry);
  const required = requiredServicesForDomain(domain);
  const missing = required.filter((serviceId) => !registry?.service?.(serviceId));
  if (missing.length) {
    throw new Error(`Creative & Production ${domain} boundary is missing required services: ${missing.join(', ')}`);
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
    dependencyGateFixBuild: DEPENDENCY_GATE_FIX_BUILD,
    moduleId: MODULE_ID,
    supportedDomains: SUPPORTED_DOMAINS,
    packagingRuntimePages: PACKAGING_RUNTIME_PAGES,
    creativeProcessRuntimePages: CREATIVE_PROCESS_RUNTIME_PAGES,
    contentStudioRuntimePages: CONTENT_STUDIO_RUNTIME_PAGES,
    caipRuntimePages: CAIP_RUNTIME_PAGES,
    packagingRequiredServices: PACKAGING_REQUIRED_SERVICES,
    creativeRequiredServices: CREATIVE_REQUIRED_SERVICES,
    creativeMutationAuthorities: CREATIVE_MUTATION_AUTHORITIES,
    contentRequiredServices: CONTENT_REQUIRED_SERVICES,
    caipRequiredServices: CAIP_REQUIRED_SERVICES,
    creativeProcessReadContract: CREATIVE_PROCESS_READ_CONTRACT,
    creativeProcessReadContractBuild: CREATIVE_PROCESS_READ_CONTRACT_BUILD,
    contentStudioReadContract: CONTENT_STUDIO_READ_CONTRACT,
    contentStudioReadContractBuild: CONTENT_STUDIO_READ_CONTRACT_BUILD,
    caipReadContract: CAIP_READ_CONTRACT,
    caipMediaIntakeReadContract: CAIP_MEDIA_INTAKE_READ_CONTRACT,
    caipReadContractBuild: CAIP_READ_CONTRACT_BUILD,
    caipMediaIntakeReadContractBuild: CAIP_MEDIA_INTAKE_READ_CONTRACT_BUILD,
    createsNetworkTransport: false,
    packagingMutationOwnership: false,
    creativeMutationOwnership: false,
    contentMutationOwnership: false,
    caipMutationOwnership: false,
    mutationAuthoritiesRequiredAsActivationServices: false,
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
  dependencyGateFixBuild: DEPENDENCY_GATE_FIX_BUILD,
  kind: 'application-module-runtime',
  supportedDomains: SUPPORTED_DOMAINS,
  packagingRuntimePages: PACKAGING_RUNTIME_PAGES,
  creativeProcessRuntimePages: CREATIVE_PROCESS_RUNTIME_PAGES,
  contentStudioRuntimePages: CONTENT_STUDIO_RUNTIME_PAGES,
  caipRuntimePages: CAIP_RUNTIME_PAGES,
  packagingRequiredServices: PACKAGING_REQUIRED_SERVICES,
  creativeRequiredServices: CREATIVE_REQUIRED_SERVICES,
  creativeMutationAuthorities: CREATIVE_MUTATION_AUTHORITIES,
  contentRequiredServices: CONTENT_REQUIRED_SERVICES,
  caipRequiredServices: CAIP_REQUIRED_SERVICES,
  creativeProcessReadContract: CREATIVE_PROCESS_READ_CONTRACT,
  creativeProcessReadContractBuild: CREATIVE_PROCESS_READ_CONTRACT_BUILD,
  contentStudioReadContract: CONTENT_STUDIO_READ_CONTRACT,
  contentStudioReadContractBuild: CONTENT_STUDIO_READ_CONTRACT_BUILD,
  caipReadContract: CAIP_READ_CONTRACT,
  caipMediaIntakeReadContract: CAIP_MEDIA_INTAKE_READ_CONTRACT,
  caipReadContractBuild: CAIP_READ_CONTRACT_BUILD,
  caipMediaIntakeReadContractBuild: CAIP_MEDIA_INTAKE_READ_CONTRACT_BUILD,
  behaviorMode: 'packaging-plus-creative-process-plus-content-studio-plus-caip-explicit-page-coverage',
  createsNetworkTransport: false,
  ownsPackagingMutations: false,
  ownsCreativeMutations: false,
  ownsContentMutations: false,
  ownsCaipMutations: false,
  mutationAuthoritiesRequiredAsActivationServices: false,
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
    contentStudioReadContractBuild: CONTENT_STUDIO_READ_CONTRACT_BUILD,
    caipReadContractBuild: CAIP_READ_CONTRACT_BUILD,
    caipMediaIntakeReadContractBuild: CAIP_MEDIA_INTAKE_READ_CONTRACT_BUILD,
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
    contentMutationOwnership: false,
    caipMutationOwnership: false,
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
    dependencyGateFixBuild: DEPENDENCY_GATE_FIX_BUILD,
    moduleId: MODULE_ID,
    state,
    activationCount,
    currentDomain,
    lastPathname,
    supportedDomains: SUPPORTED_DOMAINS,
    packagingRuntimePages: PACKAGING_RUNTIME_PAGES,
    creativeProcessRuntimePages: CREATIVE_PROCESS_RUNTIME_PAGES,
    contentStudioRuntimePages: CONTENT_STUDIO_RUNTIME_PAGES,
    caipRuntimePages: CAIP_RUNTIME_PAGES,
    packagingRequiredServices: PACKAGING_REQUIRED_SERVICES,
    creativeRequiredServices: CREATIVE_REQUIRED_SERVICES,
    creativeMutationAuthorities: CREATIVE_MUTATION_AUTHORITIES,
    contentRequiredServices: CONTENT_REQUIRED_SERVICES,
    caipRequiredServices: CAIP_REQUIRED_SERVICES,
    requiredServices: currentRequired,
    activeRequiredServices,
    servicesReady,
    createsNetworkTransport: false,
    packagingMutationOwnership: false,
    creativeMutationOwnership: false,
    contentMutationOwnership: false,
    caipMutationOwnership: false,
    ownsPackagingMutations: false,
    ownsCreativeMutations: false,
    ownsContentMutations: false,
    ownsCaipMutations: false,
    mutationAuthoritiesRequiredAsActivationServices: false,
    creativeProcessReadContract: CREATIVE_PROCESS_READ_CONTRACT,
    creativeProcessReadContractBuild: CREATIVE_PROCESS_READ_CONTRACT_BUILD,
    contentStudioReadContract: CONTENT_STUDIO_READ_CONTRACT,
    contentStudioReadContractBuild: CONTENT_STUDIO_READ_CONTRACT_BUILD,
    caipReadContract: CAIP_READ_CONTRACT,
    caipMediaIntakeReadContract: CAIP_MEDIA_INTAKE_READ_CONTRACT,
    caipReadContractBuild: CAIP_READ_CONTRACT_BUILD,
    caipMediaIntakeReadContractBuild: CAIP_MEDIA_INTAKE_READ_CONTRACT_BUILD,
    packagingBaselineBuild: 301,
    packagingRuntimeActive: state === 'active' && currentDomain === 'packaging',
    creativeProcessRuntimeActive: state === 'active' && currentDomain === 'creative',
    contentStudioRuntimeActive: state === 'active' && currentDomain === 'content',
    caipRuntimeActive: state === 'active' && currentDomain === 'caip',
    currentPackagingPageProven: state === 'active' && currentDomain === 'packaging' && PACKAGING_RUNTIME_PAGES.includes(lastPathname),
    currentCreativeProcessPageProven: state === 'active' && currentDomain === 'creative' && CREATIVE_PROCESS_RUNTIME_PAGES.includes(lastPathname),
    currentContentStudioPageProven: state === 'active' && currentDomain === 'content' && CONTENT_STUDIO_RUNTIME_PAGES.includes(lastPathname),
    currentCaipPageProven: state === 'active' && currentDomain === 'caip' && CAIP_RUNTIME_PAGES.includes(lastPathname),
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
