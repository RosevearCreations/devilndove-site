// Devil n Dove Build 309 Commerce & Operations umbrella runtime.
// Catalog and Inventory remain the proven runtime domains. Build 309 adds an Inventory-owned
// reviewed-material posting service while keeping Creative post migration disabled.

import {
  BUILD as INVENTORY_WRITE_BOUNDARY_BUILD,
  getInventoryWriteBoundaryStatus,
} from './inventory-write-boundary.mjs?v=309';

const BUILD = 309;
const MODULE_ID = 'commerce-operations';
const SUPPORTED_DOMAINS = Object.freeze(['catalog', 'inventory']);
const REQUIRED_SERVICES_BY_DOMAIN = Object.freeze({
  catalog: Object.freeze(['catalog-read']),
  inventory: Object.freeze(['inventory-read']),
});
const ALL_REQUIRED_SERVICES = Object.freeze(['catalog-read', 'inventory-read']);

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

function supportedDomain(domainId) {
  return SUPPORTED_DOMAINS.includes(normalizeDomain(domainId));
}

function requiredServicesForDomain(domainId) {
  return REQUIRED_SERVICES_BY_DOMAIN[normalizeDomain(domainId)] || Object.freeze([]);
}

function verifyServices(registry, domainId) {
  const required = requiredServicesForDomain(domainId);
  const missing = required.filter((serviceId) => !registry?.service?.(serviceId));
  if (missing.length) {
    throw new Error(`Commerce & Operations ${normalizeDomain(domainId) || 'unknown'} boundary is missing required services: ${missing.join(', ')}`);
  }
  activeRequiredServices = Object.freeze([...required]);
  servicesReady = true;
  return true;
}

function inventoryWriteBoundaryStatus() {
  return getInventoryWriteBoundaryStatus();
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
    requiredServicesByDomain: REQUIRED_SERVICES_BY_DOMAIN,
    allRequiredServices: ALL_REQUIRED_SERVICES,
    inventoryWriteBoundaryBuild: INVENTORY_WRITE_BOUNDARY_BUILD,
    requiredServicesForDomain,
    getInventoryWriteBoundaryStatus: inventoryWriteBoundaryStatus,
    getStatus,
  });
}

export const metadata = Object.freeze({
  id: MODULE_ID,
  build: BUILD,
  kind: 'application-module-runtime',
  supportedDomains: SUPPORTED_DOMAINS,
  requiredServicesByDomain: REQUIRED_SERVICES_BY_DOMAIN,
  allRequiredServices: ALL_REQUIRED_SERVICES,
  behaviorMode: 'catalog-inventory-post-and-reversal-authorities',
  createsNetworkTransport: false,
  ownsInventoryMutations: false,
  inventoryWriteBoundaryBuild: INVENTORY_WRITE_BOUNDARY_BUILD,
  consumerMutationReady: false,
});

export async function onLoad({ registry, applicationModule, domainDefinition } = {}) {
  if (applicationModule?.id !== MODULE_ID) {
    throw new Error('Commerce & Operations runtime loaded with the wrong application-module definition.');
  }
  if (!supportedDomain(domainDefinition?.id)) {
    throw new Error(`Commerce & Operations Build 309 cannot load for domain: ${domainDefinition?.id || 'unknown'}`);
  }
  verifyServices(registry, domainDefinition.id);
  state = 'loaded';
  installFacade();
  emit('dd:commerce-operations-loaded', {
    state,
    domainId: normalizeDomain(domainDefinition.id),
    servicesReady,
    supportedDomains: SUPPORTED_DOMAINS,
    activeRequiredServices,
    inventoryWriteBoundary: inventoryWriteBoundaryStatus(),
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
    throw new Error(`Commerce & Operations Build 309 cannot activate for domain: ${domainDefinition?.id || 'unknown'}`);
  }
  verifyServices(registry, domainDefinition.id);

  activationCount += 1;
  currentDomain = normalizeDomain(domainDefinition.id);
  lastPathname = String(pathname || '');
  state = 'active';
  installFacade();
  emit('dd:commerce-operations-active', {
    state,
    domainId: currentDomain,
    pathname: lastPathname,
    activationCount,
    servicesReady,
    activeRequiredServices,
    inventoryWriteBoundary: inventoryWriteBoundaryStatus(),
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
  emit('dd:commerce-operations-inactive', {
    state,
    previousDomain,
    reason: String(reason),
  });
}

export function getStatus() {
  const writeBoundary = inventoryWriteBoundaryStatus();
  return Object.freeze({
    build: BUILD,
    moduleId: MODULE_ID,
    state,
    activationCount,
    currentDomain,
    lastPathname,
    supportedDomains: SUPPORTED_DOMAINS,
    requiredServicesByDomain: REQUIRED_SERVICES_BY_DOMAIN,
    activeRequiredServices,
    servicesReady,
    createsNetworkTransport: false,
    ownsInventoryMutations: false,
    inventoryWriteBoundaryBuild: writeBoundary.build,
    inventoryPostImplementationState: writeBoundary.post.implementationState,
    inventoryPostRoute: writeBoundary.post.authorityRoute,
    inventoryPostConsumerReady: writeBoundary.post.consumerWritesReady,
    inventoryPostAtomicReviewPosting: writeBoundary.post.atomicReviewPosting,
    inventoryReverseImplementationState: writeBoundary.reverse.implementationState,
    inventoryReverseRoute: writeBoundary.reverse.authorityRoute,
    inventoryReverseConsumerReady: writeBoundary.reverse.consumerWritesReady,
    inventoryReverseRequiresOriginalMovementId: writeBoundary.reverse.requiresOriginalMovementId,
    inventoryReverseRequiresCreativePostingId: writeBoundary.reverse.requiresCreativePostingId,
    inventoryReverseConfirmationText: writeBoundary.reverse.confirmationText,
    inventoryDirectStockAddBackAllowed: writeBoundary.reverse.directStockAddBackAllowed,
    inventoryConsumerMutationReady: writeBoundary.consumerMutationReady,
    catalogRuntimeBoundaryActive: state === 'active' && currentDomain === 'catalog',
    inventoryRuntimeBoundaryActive: state === 'active' && currentDomain === 'inventory',
  });
}

installFacade();
