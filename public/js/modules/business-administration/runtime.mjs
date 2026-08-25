// Devil n Dove Build 347 — Business & Administration passive umbrella runtime.
// Build 348 enables explicit read-only Accounting page coverage only.
// This runtime creates no network transport, performs no reads itself and owns no mutations.

const BUILD = 347;
const ACTIVATION_BUILD = 348;
const MODULE_ID = 'business-administration';
const SUPPORTED_DOMAINS = Object.freeze(['accounting']);
const ACCOUNTING_RUNTIME_PAGES = Object.freeze(['/admin/accounting/']);

const STARTUP_REQUIRED_SERVICES = Object.freeze([
  'accounting-profit-loss-read',
  'accounting-item-costing-read',
  'accounting-journal-read',
  'accounting-overhead-product-allocations-read',
  'accounting-general-ledger-read',
  'accounting-expenses-read',
  'accounting-overhead-allocations-read',
  'accounting-writeoffs-read',
  'accounting-product-costs-read',
  'accounting-gifi-notes-read',
  'accounting-gifi-summary-read',
  'accounting-period-locks-read',
  'platform-db-sanity-read',
  'accounting-vendors-read',
  'accounting-recurring-expense-rules-read',
  'accounting-attachments-read',
  'accounting-reconciliation-read',
  'accounting-year-end-close-read',
  'accounting-statement-imports-read',
  'accounting-reconciliation-exceptions-read',
  'accounting-sales-tax-filing-read',
  'accounting-fixed-assets-read',
  'accounting-vendor-statements-read',
  'accounting-statement-provider-profiles-read',
  'accounting-close-workflow-read',
  'accounting-evidence-check-read',
]);

const INTERACTIVE_READ_SERVICES = Object.freeze([
  'accounting-monthly-summary-export-read',
  'accounting-period-summary-export-read',
]);

const ALL_REQUIRED_SERVICES = Object.freeze([
  ...STARTUP_REQUIRED_SERVICES,
  ...INTERACTIVE_READ_SERVICES,
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
  return normalizeDomain(domainId) === 'accounting' && ACCOUNTING_RUNTIME_PAGES.includes(normalizePathname(pathname));
}
function verifyServices(registry) {
  const missing = ALL_REQUIRED_SERVICES.filter((serviceId) => !registry?.service?.(serviceId));
  if (missing.length) {
    throw new Error(`Business & Administration Accounting boundary is missing required services: ${missing.join(', ')}`);
  }
  activeRequiredServices = Object.freeze([...ALL_REQUIRED_SERVICES]);
  servicesReady = true;
  return true;
}
function emit(name, detail = {}) {
  if (typeof document === 'undefined' || typeof CustomEvent === 'undefined') return;
  document.dispatchEvent(new CustomEvent(name, {
    detail: Object.freeze({ applicationModuleId: MODULE_ID, build: BUILD, activationBuild: ACTIVATION_BUILD, ...detail }),
  }));
}
function installFacade() {
  if (typeof window === 'undefined') return;
  window.DDBusinessAdministration = Object.freeze({
    build: BUILD,
    activationBuild: ACTIVATION_BUILD,
    moduleId: MODULE_ID,
    supportedDomains: SUPPORTED_DOMAINS,
    accountingRuntimePages: ACCOUNTING_RUNTIME_PAGES,
    startupRequiredServices: STARTUP_REQUIRED_SERVICES,
    interactiveReadServices: INTERACTIVE_READ_SERVICES,
    allRequiredServices: ALL_REQUIRED_SERVICES,
    accountingMutationOwnership: false,
    createsNetworkTransport: false,
    supportedPathForDomain,
    getStatus,
  });
}

export const metadata = Object.freeze({
  id: MODULE_ID,
  build: BUILD,
  activationBuild: ACTIVATION_BUILD,
  kind: 'application-module-runtime',
  supportedDomains: SUPPORTED_DOMAINS,
  accountingRuntimePages: ACCOUNTING_RUNTIME_PAGES,
  startupRequiredServices: STARTUP_REQUIRED_SERVICES,
  interactiveReadServices: INTERACTIVE_READ_SERVICES,
  allRequiredServices: ALL_REQUIRED_SERVICES,
  behaviorMode: 'accounting-read-only-explicit-single-page-coverage',
  createsNetworkTransport: false,
  ownsAccountingMutations: false,
  schemaParityRequiredForActivation: false,
});

export async function onLoad({ registry, applicationModule, domainDefinition, pathname } = {}) {
  if (applicationModule?.id !== MODULE_ID) throw new Error('Business & Administration runtime loaded with the wrong application-module definition.');
  if (!supportedDomain(domainDefinition?.id)) throw new Error(`Business & Administration Build ${BUILD} cannot load for domain: ${domainDefinition?.id || 'unknown'}`);
  if (!supportedPathForDomain(domainDefinition?.id, pathname)) {
    throw new Error(`Business & Administration Build ${BUILD} has no proven Accounting runtime coverage for: ${normalizePathname(pathname)}`);
  }
  verifyServices(registry);
  state = 'loaded';
  installFacade();
  emit('dd:business-administration-loaded', {
    state,
    domainId: normalizeDomain(domainDefinition.id),
    pathname: normalizePathname(pathname),
    servicesReady,
    activeRequiredServices,
  });
}

export async function onActivate({ registry, applicationModule, domainDefinition, user, pathname } = {}) {
  if (applicationModule?.id !== MODULE_ID) throw new Error('Business & Administration runtime activated with the wrong application-module definition.');
  if (!authenticatedAdmin(user)) throw new Error('Business & Administration runtime activation requires an administrator.');
  if (!supportedDomain(domainDefinition?.id)) throw new Error(`Business & Administration Build ${BUILD} cannot activate for domain: ${domainDefinition?.id || 'unknown'}`);
  if (!supportedPathForDomain(domainDefinition?.id, pathname)) {
    throw new Error(`Business & Administration Build ${BUILD} has no proven Accounting runtime coverage for: ${normalizePathname(pathname)}`);
  }
  verifyServices(registry);
  activationCount += 1;
  currentDomain = normalizeDomain(domainDefinition.id);
  lastPathname = normalizePathname(pathname);
  state = 'active';
  installFacade();
  emit('dd:business-administration-active', {
    state,
    domainId: currentDomain,
    pathname: lastPathname,
    activationCount,
    servicesReady,
    activeRequiredServices,
    accountingMutationOwnership: false,
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
  emit('dd:business-administration-inactive', { state, previousDomain, reason: String(reason) });
}

export function getStatus() {
  return Object.freeze({
    build: BUILD,
    activationBuild: ACTIVATION_BUILD,
    moduleId: MODULE_ID,
    state,
    activationCount,
    currentDomain,
    lastPathname,
    supportedDomains: SUPPORTED_DOMAINS,
    accountingRuntimePages: ACCOUNTING_RUNTIME_PAGES,
    startupRequiredServices: STARTUP_REQUIRED_SERVICES,
    interactiveReadServices: INTERACTIVE_READ_SERVICES,
    allRequiredServices: ALL_REQUIRED_SERVICES,
    activeRequiredServices,
    servicesReady,
    createsNetworkTransport: false,
    accountingMutationOwnership: false,
    ownsAccountingMutations: false,
    schemaParityRequiredForActivation: false,
    accountingRuntimeActive: state === 'active' && currentDomain === 'accounting',
    accountingRuntimeBoundaryActive: state === 'active' && currentDomain === 'accounting',
    currentAccountingPageProven: state === 'active' && currentDomain === 'accounting' && ACCOUNTING_RUNTIME_PAGES.includes(lastPathname),
  });
}

installFacade();
