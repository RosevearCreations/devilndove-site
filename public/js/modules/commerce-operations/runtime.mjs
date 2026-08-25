// Devil n Dove Build 386 Commerce & Operations umbrella runtime.
// Build 386 adds explicit Gift Cards coverage. Existing Operations pages retain their
// proven prerequisites; Membership, Today Tasks, Custom Requests, and Gift Cards use page-specific passive reads.

import {
  BUILD as INVENTORY_WRITE_BOUNDARY_BUILD,
  getInventoryWriteBoundaryStatus,
} from './inventory-write-boundary.mjs?v=310';
import { ensureOperationsMembershipReadService } from './operations-membership-read-service.mjs?v=363';
import { ensureOperationsTodayTasksReadService } from './operations-today-tasks-read-service.mjs?v=367';
import { ensureOperationsCustomRequestsReadService } from './operations-custom-requests-read-service.mjs?v=371';
import { ensureOperationsGiftCardsReadService } from './operations-gift-cards-read-service.mjs?v=386';

const BUILD = 386;
const ACTIVATION_BUILD = 386;
const MODULE_ID = 'commerce-operations';
const SUPPORTED_DOMAINS = Object.freeze(['catalog', 'inventory', 'operations']);
const MEMBERSHIP_RUNTIME_PAGE = '/admin/membership/';
const TODAY_TASKS_RUNTIME_PAGE = '/admin/today-tasks/';
const CUSTOM_REQUESTS_RUNTIME_PAGE = '/admin/custom-request/';
const GIFT_CARDS_RUNTIME_PAGE = '/admin/gift-cards/';
const OPERATIONS_RUNTIME_PAGES = Object.freeze([
  '/admin/operations/',
  '/admin/customer-documents/',
  '/admin/orders/',
  MEMBERSHIP_RUNTIME_PAGE,
  TODAY_TASKS_RUNTIME_PAGE,
  CUSTOM_REQUESTS_RUNTIME_PAGE,
  GIFT_CARDS_RUNTIME_PAGE,
]);
const CATALOG_REQUIRED_SERVICES = Object.freeze(['catalog-read', 'inventory-cost']);
const INVENTORY_REQUIRED_SERVICES = Object.freeze(['inventory-read']);
const LEGACY_OPERATIONS_REQUIRED_SERVICES = Object.freeze(['catalog-read', 'inventory-read', 'accounting-read']);
const MEMBERSHIP_REQUIRED_SERVICES = Object.freeze(['operations-membership-read']);
const TODAY_TASKS_REQUIRED_SERVICES = Object.freeze(['operations-today-tasks-read']);
const CUSTOM_REQUESTS_REQUIRED_SERVICES = Object.freeze(['operations-custom-requests-read']);
const GIFT_CARDS_REQUIRED_SERVICES = Object.freeze(['operations-gift-cards-read']);
const ALL_REQUIRED_SERVICES = Object.freeze([
  'catalog-read',
  'inventory-read',
  'inventory-cost',
  'accounting-read',
  'operations-membership-read',
  'operations-today-tasks-read',
  'operations-custom-requests-read',
  'operations-gift-cards-read',
]);
const MEMBERSHIP_READ_CONTRACT = '/api/admin/contracts/operations-membership-read';
const MEMBERSHIP_READ_CONTRACT_BUILD = 362;
const TODAY_TASKS_READ_CONTRACT = '/api/admin/contracts/operations-today-tasks-read';
const TODAY_TASKS_READ_CONTRACT_BUILD = 366;
const TODAY_TASKS_ACTION_AUTHORITY = '/api/admin/today-task-actions';
const CUSTOM_REQUESTS_READ_CONTRACT = '/api/admin/contracts/operations-custom-requests-read';
const CUSTOM_REQUESTS_READ_CONTRACT_BUILD = 370;
const CUSTOM_REQUESTS_COMPATIBILITY_AUTHORITY = '/api/admin/custom-requests';
const GIFT_CARDS_READ_CONTRACT = '/api/admin/contracts/operations-gift-cards-read';
const GIFT_CARDS_READ_CONTRACT_BUILD = 385;
const GIFT_CARDS_MUTATION_AUTHORITIES = Object.freeze([
  '/api/admin/gift-card-actions',
  '/api/admin/gift-card-delivery-templates',
  '/api/admin/gift-card-delivery-send',
  '/api/admin/gift-card-abuse',
]);

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
  if (!supportedDomain(domain)) return false;
  if (domain !== 'operations') return true;
  return OPERATIONS_RUNTIME_PAGES.includes(normalizePathname(pathname));
}
function requiredServicesForDomain(domainId, pathname = '') {
  const domain = normalizeDomain(domainId);
  const path = normalizePathname(pathname);
  if (domain === 'catalog') return CATALOG_REQUIRED_SERVICES;
  if (domain === 'inventory') return INVENTORY_REQUIRED_SERVICES;
  if (domain === 'operations') {
    if (path === MEMBERSHIP_RUNTIME_PAGE) return MEMBERSHIP_REQUIRED_SERVICES;
    if (path === TODAY_TASKS_RUNTIME_PAGE) return TODAY_TASKS_REQUIRED_SERVICES;
    if (path === CUSTOM_REQUESTS_RUNTIME_PAGE) return CUSTOM_REQUESTS_REQUIRED_SERVICES;
    if (path === GIFT_CARDS_RUNTIME_PAGE) return GIFT_CARDS_REQUIRED_SERVICES;
    return LEGACY_OPERATIONS_REQUIRED_SERVICES;
  }
  return Object.freeze([]);
}
function verifyServices(registry, domainId, pathname) {
  const domain = normalizeDomain(domainId);
  const path = normalizePathname(pathname);
  if (domain === 'operations' && path === MEMBERSHIP_RUNTIME_PAGE) ensureOperationsMembershipReadService(registry);
  if (domain === 'operations' && path === TODAY_TASKS_RUNTIME_PAGE) ensureOperationsTodayTasksReadService(registry);
  if (domain === 'operations' && path === CUSTOM_REQUESTS_RUNTIME_PAGE) ensureOperationsCustomRequestsReadService(registry);
  if (domain === 'operations' && path === GIFT_CARDS_RUNTIME_PAGE) ensureOperationsGiftCardsReadService(registry);
  const required = requiredServicesForDomain(domain, path);
  const missing = required.filter((serviceId) => !registry?.service?.(serviceId));
  if (missing.length) throw new Error(`Commerce & Operations ${domain || 'unknown'} boundary is missing required services: ${missing.join(', ')}`);
  activeRequiredServices = Object.freeze([...required]);
  servicesReady = true;
  return true;
}
function inventoryWriteBoundaryStatus() { return getInventoryWriteBoundaryStatus(); }
function emit(name, detail = {}) {
  if (typeof document === 'undefined' || typeof CustomEvent === 'undefined') return;
  document.dispatchEvent(new CustomEvent(name, {
    detail: Object.freeze({ applicationModuleId: MODULE_ID, build: BUILD, activationBuild: ACTIVATION_BUILD, ...detail }),
  }));
}
function installFacade() {
  if (typeof window === 'undefined') return;
  window.DDCommerceOperations = Object.freeze({
    build: BUILD,
    activationBuild: ACTIVATION_BUILD,
    moduleId: MODULE_ID,
    supportedDomains: SUPPORTED_DOMAINS,
    operationsRuntimePages: OPERATIONS_RUNTIME_PAGES,
    membershipRuntimePage: MEMBERSHIP_RUNTIME_PAGE,
    todayTasksRuntimePage: TODAY_TASKS_RUNTIME_PAGE,
    customRequestsRuntimePage: CUSTOM_REQUESTS_RUNTIME_PAGE,
    giftCardsRuntimePage: GIFT_CARDS_RUNTIME_PAGE,
    catalogRequiredServices: CATALOG_REQUIRED_SERVICES,
    inventoryRequiredServices: INVENTORY_REQUIRED_SERVICES,
    legacyOperationsRequiredServices: LEGACY_OPERATIONS_REQUIRED_SERVICES,
    membershipRequiredServices: MEMBERSHIP_REQUIRED_SERVICES,
    todayTasksRequiredServices: TODAY_TASKS_REQUIRED_SERVICES,
    customRequestsRequiredServices: CUSTOM_REQUESTS_REQUIRED_SERVICES,
    giftCardsRequiredServices: GIFT_CARDS_REQUIRED_SERVICES,
    allRequiredServices: ALL_REQUIRED_SERVICES,
    membershipReadContract: MEMBERSHIP_READ_CONTRACT,
    membershipReadContractBuild: MEMBERSHIP_READ_CONTRACT_BUILD,
    todayTasksReadContract: TODAY_TASKS_READ_CONTRACT,
    todayTasksReadContractBuild: TODAY_TASKS_READ_CONTRACT_BUILD,
    todayTasksActionAuthority: TODAY_TASKS_ACTION_AUTHORITY,
    customRequestsReadContract: CUSTOM_REQUESTS_READ_CONTRACT,
    customRequestsReadContractBuild: CUSTOM_REQUESTS_READ_CONTRACT_BUILD,
    customRequestsCompatibilityAuthority: CUSTOM_REQUESTS_COMPATIBILITY_AUTHORITY,
    giftCardsReadContract: GIFT_CARDS_READ_CONTRACT,
    giftCardsReadContractBuild: GIFT_CARDS_READ_CONTRACT_BUILD,
    giftCardsMutationAuthorities: GIFT_CARDS_MUTATION_AUTHORITIES,
    inventoryWriteBoundaryBuild: INVENTORY_WRITE_BOUNDARY_BUILD,
    inventoryCostContractBuild: 311,
    accountingReadContractBuild: 312,
    operationsRuntimeBuild: BUILD,
    operationsRuntimeCoverageBuild: ACTIVATION_BUILD,
    operationsMutationOwnership: false,
    membershipMutationOwnership: false,
    todayTasksMutationOwnership: false,
    customRequestsMutationOwnership: false,
    giftCardsMutationOwnership: false,
    createsNetworkTransport: false,
    supportedPathForDomain,
    requiredServicesForDomain,
    getInventoryWriteBoundaryStatus: inventoryWriteBoundaryStatus,
    getStatus,
  });
}

export const metadata = Object.freeze({
  id: MODULE_ID,
  build: BUILD,
  activationBuild: ACTIVATION_BUILD,
  kind: 'application-module-runtime',
  supportedDomains: SUPPORTED_DOMAINS,
  operationsRuntimePages: OPERATIONS_RUNTIME_PAGES,
  membershipRuntimePage: MEMBERSHIP_RUNTIME_PAGE,
  todayTasksRuntimePage: TODAY_TASKS_RUNTIME_PAGE,
  customRequestsRuntimePage: CUSTOM_REQUESTS_RUNTIME_PAGE,
  giftCardsRuntimePage: GIFT_CARDS_RUNTIME_PAGE,
  catalogRequiredServices: CATALOG_REQUIRED_SERVICES,
  inventoryRequiredServices: INVENTORY_REQUIRED_SERVICES,
  legacyOperationsRequiredServices: LEGACY_OPERATIONS_REQUIRED_SERVICES,
  membershipRequiredServices: MEMBERSHIP_REQUIRED_SERVICES,
  todayTasksRequiredServices: TODAY_TASKS_REQUIRED_SERVICES,
  customRequestsRequiredServices: CUSTOM_REQUESTS_REQUIRED_SERVICES,
  giftCardsRequiredServices: GIFT_CARDS_REQUIRED_SERVICES,
  allRequiredServices: ALL_REQUIRED_SERVICES,
  membershipReadContract: MEMBERSHIP_READ_CONTRACT,
  membershipReadContractBuild: MEMBERSHIP_READ_CONTRACT_BUILD,
  todayTasksReadContract: TODAY_TASKS_READ_CONTRACT,
  todayTasksReadContractBuild: TODAY_TASKS_READ_CONTRACT_BUILD,
  todayTasksActionAuthority: TODAY_TASKS_ACTION_AUTHORITY,
  customRequestsReadContract: CUSTOM_REQUESTS_READ_CONTRACT,
  customRequestsReadContractBuild: CUSTOM_REQUESTS_READ_CONTRACT_BUILD,
  customRequestsCompatibilityAuthority: CUSTOM_REQUESTS_COMPATIBILITY_AUTHORITY,
  giftCardsReadContract: GIFT_CARDS_READ_CONTRACT,
  giftCardsReadContractBuild: GIFT_CARDS_READ_CONTRACT_BUILD,
  giftCardsMutationAuthorities: GIFT_CARDS_MUTATION_AUTHORITIES,
  behaviorMode: 'catalog-inventory-operations-read-only-explicit-page-specific-coverage',
  createsNetworkTransport: false,
  ownsInventoryMutations: false,
  ownsOperationsMutations: false,
  ownsMembershipMutations: false,
  ownsTodayTasksMutations: false,
  ownsCustomRequestsMutations: false,
  ownsGiftCardsMutations: false,
  inventoryWriteBoundaryBuild: INVENTORY_WRITE_BOUNDARY_BUILD,
  inventoryCostContractBuild: 311,
  accountingReadContractBuild: 312,
  operationsRuntimeBuild: BUILD,
  operationsRuntimeCoverageBuild: ACTIVATION_BUILD,
  consumerMutationReady: true,
});

export async function onLoad({ registry, applicationModule, domainDefinition, pathname } = {}) {
  if (applicationModule?.id !== MODULE_ID) throw new Error('Commerce & Operations runtime loaded with the wrong application-module definition.');
  if (!supportedDomain(domainDefinition?.id)) throw new Error(`Commerce & Operations Build ${BUILD} cannot load for domain: ${domainDefinition?.id || 'unknown'}`);
  if (!supportedPathForDomain(domainDefinition?.id, pathname)) throw new Error(`Commerce & Operations Build ${BUILD} has no proven Operations runtime coverage for: ${normalizePathname(pathname)}`);
  verifyServices(registry, domainDefinition.id, pathname);
  state = 'loaded';
  installFacade();
  emit('dd:commerce-operations-loaded', {
    state,
    domainId: normalizeDomain(domainDefinition.id),
    pathname: normalizePathname(pathname),
    servicesReady,
    supportedDomains: SUPPORTED_DOMAINS,
    operationsRuntimePages: OPERATIONS_RUNTIME_PAGES,
    activeRequiredServices,
    membershipReadContractBuild: MEMBERSHIP_READ_CONTRACT_BUILD,
    todayTasksReadContractBuild: TODAY_TASKS_READ_CONTRACT_BUILD,
    customRequestsReadContractBuild: CUSTOM_REQUESTS_READ_CONTRACT_BUILD,
    giftCardsReadContractBuild: GIFT_CARDS_READ_CONTRACT_BUILD,
    inventoryWriteBoundary: inventoryWriteBoundaryStatus(),
  });
}

export async function onActivate({ registry, applicationModule, domainDefinition, user, pathname } = {}) {
  if (applicationModule?.id !== MODULE_ID) throw new Error('Commerce & Operations runtime activated with the wrong application-module definition.');
  if (!authenticatedAdmin(user)) throw new Error('Commerce & Operations runtime activation requires an administrator.');
  if (!supportedDomain(domainDefinition?.id)) throw new Error(`Commerce & Operations Build ${BUILD} cannot activate for domain: ${domainDefinition?.id || 'unknown'}`);
  if (!supportedPathForDomain(domainDefinition?.id, pathname)) throw new Error(`Commerce & Operations Build ${BUILD} has no proven Operations runtime coverage for: ${normalizePathname(pathname)}`);
  verifyServices(registry, domainDefinition.id, pathname);
  activationCount += 1;
  currentDomain = normalizeDomain(domainDefinition.id);
  lastPathname = normalizePathname(pathname);
  state = 'active';
  installFacade();
  emit('dd:commerce-operations-active', {
    state,
    domainId: currentDomain,
    pathname: lastPathname,
    activationCount,
    servicesReady,
    operationsRuntimePages: OPERATIONS_RUNTIME_PAGES,
    activeRequiredServices,
    operationsMutationOwnership: false,
    membershipMutationOwnership: false,
    todayTasksMutationOwnership: false,
    customRequestsMutationOwnership: false,
    giftCardsMutationOwnership: false,
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
  emit('dd:commerce-operations-inactive', { state, previousDomain, reason: String(reason) });
}

export function getStatus() {
  const writeBoundary = inventoryWriteBoundaryStatus();
  const currentRequired = currentDomain ? requiredServicesForDomain(currentDomain, lastPathname) : Object.freeze([]);
  return Object.freeze({
    build: BUILD,
    activationBuild: ACTIVATION_BUILD,
    moduleId: MODULE_ID,
    state,
    activationCount,
    currentDomain,
    lastPathname,
    supportedDomains: SUPPORTED_DOMAINS,
    operationsRuntimePages: OPERATIONS_RUNTIME_PAGES,
    membershipRuntimePage: MEMBERSHIP_RUNTIME_PAGE,
    todayTasksRuntimePage: TODAY_TASKS_RUNTIME_PAGE,
    customRequestsRuntimePage: CUSTOM_REQUESTS_RUNTIME_PAGE,
    giftCardsRuntimePage: GIFT_CARDS_RUNTIME_PAGE,
    catalogRequiredServices: CATALOG_REQUIRED_SERVICES,
    inventoryRequiredServices: INVENTORY_REQUIRED_SERVICES,
    legacyOperationsRequiredServices: LEGACY_OPERATIONS_REQUIRED_SERVICES,
    membershipRequiredServices: MEMBERSHIP_REQUIRED_SERVICES,
    todayTasksRequiredServices: TODAY_TASKS_REQUIRED_SERVICES,
    customRequestsRequiredServices: CUSTOM_REQUESTS_REQUIRED_SERVICES,
    giftCardsRequiredServices: GIFT_CARDS_REQUIRED_SERVICES,
    requiredServices: currentRequired,
    activeRequiredServices,
    servicesReady,
    createsNetworkTransport: false,
    ownsInventoryMutations: false,
    ownsOperationsMutations: false,
    ownsMembershipMutations: false,
    ownsTodayTasksMutations: false,
    ownsCustomRequestsMutations: false,
    ownsGiftCardsMutations: false,
    operationsMutationOwnership: false,
    membershipMutationOwnership: false,
    todayTasksMutationOwnership: false,
    customRequestsMutationOwnership: false,
    giftCardsMutationOwnership: false,
    membershipReadContract: MEMBERSHIP_READ_CONTRACT,
    membershipReadContractBuild: MEMBERSHIP_READ_CONTRACT_BUILD,
    todayTasksReadContract: TODAY_TASKS_READ_CONTRACT,
    todayTasksReadContractBuild: TODAY_TASKS_READ_CONTRACT_BUILD,
    todayTasksActionAuthority: TODAY_TASKS_ACTION_AUTHORITY,
    todayTasksActionMutationOwnershipMoved: false,
    customRequestsReadContract: CUSTOM_REQUESTS_READ_CONTRACT,
    customRequestsReadContractBuild: CUSTOM_REQUESTS_READ_CONTRACT_BUILD,
    customRequestsCompatibilityAuthority: CUSTOM_REQUESTS_COMPATIBILITY_AUTHORITY,
    customRequestsMutationOwnershipMoved: false,
    customRequestsMarketplaceCsvLegacyGetOutsideContract: true,
    giftCardsReadContract: GIFT_CARDS_READ_CONTRACT,
    giftCardsReadContractBuild: GIFT_CARDS_READ_CONTRACT_BUILD,
    giftCardsMutationAuthorities: GIFT_CARDS_MUTATION_AUTHORITIES,
    giftCardsMutationOwnershipMoved: false,
    inventoryCostContractBuild: 311,
    inventoryCostServiceRequiredForCatalog: true,
    accountingReadContractBuild: 312,
    accountingReadServiceRequiredForLegacyOperations: true,
    operationsRuntimeBuild: BUILD,
    operationsRuntimeCoverageBuild: ACTIVATION_BUILD,
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
    operationsRuntimeActive: state === 'active' && currentDomain === 'operations',
    operationsRuntimeBoundaryActive: state === 'active' && currentDomain === 'operations',
    membershipRuntimeActive: state === 'active' && currentDomain === 'operations' && lastPathname === MEMBERSHIP_RUNTIME_PAGE,
    todayTasksRuntimeActive: state === 'active' && currentDomain === 'operations' && lastPathname === TODAY_TASKS_RUNTIME_PAGE,
    customRequestsRuntimeActive: state === 'active' && currentDomain === 'operations' && lastPathname === CUSTOM_REQUESTS_RUNTIME_PAGE,
    giftCardsRuntimeActive: state === 'active' && currentDomain === 'operations' && lastPathname === GIFT_CARDS_RUNTIME_PAGE,
    currentOperationsPageProven: state === 'active' && currentDomain === 'operations' && OPERATIONS_RUNTIME_PAGES.includes(lastPathname),
    currentMembershipPageProven: state === 'active' && currentDomain === 'operations' && lastPathname === MEMBERSHIP_RUNTIME_PAGE,
    currentTodayTasksPageProven: state === 'active' && currentDomain === 'operations' && lastPathname === TODAY_TASKS_RUNTIME_PAGE,
    currentCustomRequestsPageProven: state === 'active' && currentDomain === 'operations' && lastPathname === CUSTOM_REQUESTS_RUNTIME_PAGE,
    currentGiftCardsPageProven: state === 'active' && currentDomain === 'operations' && lastPathname === GIFT_CARDS_RUNTIME_PAGE,
  });
}

installFacade();
