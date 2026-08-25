// Devil n Dove Build 302 Core + Three Application Modules architecture catalog.
// Build 304 added the first passive umbrella runtime metadata for Catalog.
// Build 305 extended that same Commerce & Operations runtime to Inventory.
// Build 306 hardened Inventory write-side contracts; Build 307 added Inventory reversal authority;
// Build 309 added Inventory post authority; Build 310 enabled Creative consumption of both;
// Build 311 added the Inventory-owned cost read boundary; Build 312 added Accounting read;
// Build 313 activated the first read-only Operations page; Build 314 added Customer Documents coverage;
// Build 315 adds Orders loader/runtime coverage without moving order/payment mutations.
// Build 346 closes the Accounting startup-read audit; Build 347 adds the passive Business runtime;
// Build 348 activates Business & Administration for /admin/accounting/ only, read-only.
// Build 349 pins the proven Packaging compatibility baseline; Build 350 adds the passive Creative runtime;
// Build 351 activates Creative & Production for /admin/packaging-studio/ only without moving Packaging mutations.
// Build 352 formalizes the Creative Process read contract; Build 353 extends the Creative runtime;
// Build 354 activates /admin/creative-process/ without moving Creative Process POST authority.
// Build 355 removes Content Studio GET-time schema creation; Build 356 extends the Creative runtime to Content;
// Build 357 activates /admin/content-studio/ without moving Content Studio mutation authority.
// Build 358 corrects Creative Process activation dependencies without registering or moving Inventory writes.
// Importing this file creates no timers, fetches, polling, D1/R2 calls,
// route interception, or automatic module activation.

export const BUILD = 302;
export const RUNTIME_CATALOG_BUILD = 304;
export const RUNTIME_INVENTORY_BUILD = 305;
export const INVENTORY_WRITE_CONTRACT_BUILD = 310;
export const INVENTORY_COST_CONTRACT_BUILD = 311;
export const ACCOUNTING_READ_CONTRACT_BUILD = 312;
export const RUNTIME_OPERATIONS_BUILD = 315;
export const OPERATIONS_RUNTIME_COVERAGE_BUILD = 315;
export const ACCOUNTING_STARTUP_READ_AUDIT_BUILD = 346;
export const BUSINESS_ADMINISTRATION_RUNTIME_IMPLEMENTATION_BUILD = 347;
export const BUSINESS_ADMINISTRATION_RUNTIME_COVERAGE_BUILD = 348;
export const PACKAGING_TOP_LEVEL_AUDIT_BUILD = 349;
export const CREATIVE_PROCESS_READ_CONTRACT_BUILD = 352;
export const CONTENT_STUDIO_READ_CONTRACT_BUILD = 355;
export const CREATIVE_PRODUCTION_RUNTIME_IMPLEMENTATION_BUILD = 358;
export const CREATIVE_PRODUCTION_RUNTIME_COVERAGE_BUILD = 357;
export const CREATIVE_PROCESS_DEPENDENCY_GATE_FIX_BUILD = 358;
export const OPERATIONS_RUNTIME_PAGES = Object.freeze([
  '/admin/operations/',
  '/admin/customer-documents/',
  '/admin/orders/',
]);
export const BUSINESS_ADMINISTRATION_RUNTIME_PAGES = Object.freeze([
  '/admin/accounting/',
]);
export const CREATIVE_PRODUCTION_RUNTIME_PAGES = Object.freeze([
  '/admin/packaging-studio/',
  '/admin/creative-process/',
  '/admin/content-studio/',
]);

export const DD_APPLICATION_CORE = Object.freeze({
  id: 'core',
  label: 'Devil n Dove Application Core',
  kind: 'application-core',
  responsibilities: Object.freeze([
    'authentication-session-awareness',
    'current-user-and-authorization-context',
    'module-registry-and-lifecycle',
    'route-to-module-resolution',
    'shared-api-request-helpers',
    'error-handling-and-notifications',
    'environment-runtime-information',
    'shared-service-registration',
    'feature-and-module-availability',
  ]),
  forbiddenBusinessOwnership: Object.freeze([
    'catalog-business-rules',
    'inventory-business-rules',
    'creative-project-business-rules',
    'caip-evidence-business-rules',
    'packaging-business-rules',
    'content-business-rules',
    'marketing-business-rules',
    'accounting-business-rules',
  ]),
});

export const DD_APPLICATION_MODULES = Object.freeze([
  Object.freeze({
    id: 'commerce-operations',
    label: 'Commerce & Operations',
    kind: 'application-module',
    description: 'Customer/storefront, catalog, inventory, orders, memberships, fulfillment and day-to-day customer operations.',
    domains: Object.freeze(['public', 'catalog', 'inventory', 'operations']),
    extractionState: 'in-progress',
    entry: '../modules/commerce-operations/runtime.mjs?v=315',
    runtimeDomains: Object.freeze(['catalog', 'inventory', 'operations']),
  }),
  Object.freeze({
    id: 'creative-production',
    label: 'Creative & Production',
    kind: 'application-module',
    description: 'Creative projects, CAIP, Packaging & Labeling, Media/Content Studio and reviewed production workflows.',
    domains: Object.freeze(['creative', 'caip', 'packaging', 'content']),
    extractionState: 'in-progress',
    entry: '../modules/creative-production/runtime.mjs?v=358',
    runtimeDomains: Object.freeze(['packaging', 'creative', 'content']),
  }),
  Object.freeze({
    id: 'business-administration',
    label: 'Business & Administration',
    kind: 'application-module',
    description: 'Marketing, publishing, SEO, accounting, analytics, administration, command-center and platform operations.',
    domains: Object.freeze(['marketing', 'accounting', 'platform', 'admin']),
    extractionState: 'in-progress',
    entry: '../modules/business-administration/runtime.mjs?v=347',
    runtimeDomains: Object.freeze(['accounting']),
  }),
]);

export const DD_DOMAIN_TO_APPLICATION_MODULE = Object.freeze(
  Object.fromEntries(
    DD_APPLICATION_MODULES.flatMap((moduleDefinition) =>
      moduleDefinition.domains.map((domainId) => [domainId, moduleDefinition.id])
    )
  )
);

export function applicationModuleForDomain(domainId) {
  const key = String(domainId || '').trim().toLowerCase();
  return DD_DOMAIN_TO_APPLICATION_MODULE[key] || null;
}

export function getApplicationModule(moduleId) {
  const key = String(moduleId || '').trim().toLowerCase();
  return DD_APPLICATION_MODULES.find((definition) => definition.id === key) || null;
}

export function applicationModuleRuntimeForDomain(domainId) {
  const moduleId = applicationModuleForDomain(domainId);
  const definition = moduleId ? getApplicationModule(moduleId) : null;
  if (!definition?.entry) return null;
  return definition.runtimeDomains.includes(String(domainId || '').trim().toLowerCase())
    ? definition
    : null;
}

export function snapshotApplicationArchitecture() {
  return Object.freeze({
    build: BUILD,
    runtimeCatalogBuild: RUNTIME_CATALOG_BUILD,
    runtimeInventoryBuild: RUNTIME_INVENTORY_BUILD,
    inventoryWriteContractBuild: INVENTORY_WRITE_CONTRACT_BUILD,
    inventoryCostContractBuild: INVENTORY_COST_CONTRACT_BUILD,
    accountingReadContractBuild: ACCOUNTING_READ_CONTRACT_BUILD,
    runtimeOperationsBuild: RUNTIME_OPERATIONS_BUILD,
    operationsRuntimeCoverageBuild: OPERATIONS_RUNTIME_COVERAGE_BUILD,
    operationsRuntimePages: OPERATIONS_RUNTIME_PAGES,
    accountingStartupReadAuditBuild: ACCOUNTING_STARTUP_READ_AUDIT_BUILD,
    businessAdministrationRuntimeImplementationBuild: BUSINESS_ADMINISTRATION_RUNTIME_IMPLEMENTATION_BUILD,
    businessAdministrationRuntimeCoverageBuild: BUSINESS_ADMINISTRATION_RUNTIME_COVERAGE_BUILD,
    businessAdministrationRuntimePages: BUSINESS_ADMINISTRATION_RUNTIME_PAGES,
    packagingTopLevelAuditBuild: PACKAGING_TOP_LEVEL_AUDIT_BUILD,
    creativeProcessReadContractBuild: CREATIVE_PROCESS_READ_CONTRACT_BUILD,
    contentStudioReadContractBuild: CONTENT_STUDIO_READ_CONTRACT_BUILD,
    creativeProductionRuntimeImplementationBuild: CREATIVE_PRODUCTION_RUNTIME_IMPLEMENTATION_BUILD,
    creativeProductionRuntimeCoverageBuild: CREATIVE_PRODUCTION_RUNTIME_COVERAGE_BUILD,
    creativeProcessDependencyGateFixBuild: CREATIVE_PROCESS_DEPENDENCY_GATE_FIX_BUILD,
    creativeProductionRuntimePages: CREATIVE_PRODUCTION_RUNTIME_PAGES,
    core: DD_APPLICATION_CORE,
    modules: DD_APPLICATION_MODULES,
    domainMap: DD_DOMAIN_TO_APPLICATION_MODULE,
    topLevelApplicationModuleCount: DD_APPLICATION_MODULES.length,
    currentRuntimeMigrationMode: 'commerce-operations-plus-business-accounting-plus-creative-packaging-process-content-explicit-page-coverage',
    firstUmbrellaRuntimeModule: 'commerce-operations',
    firstUmbrellaRuntimeDomain: 'catalog',
    secondUmbrellaRuntimeDomain: 'inventory',
    thirdUmbrellaRuntimeDomain: 'operations',
    secondUmbrellaRuntimeModule: 'business-administration',
    firstBusinessAdministrationRuntimeDomain: 'accounting',
    thirdUmbrellaRuntimeModule: 'creative-production',
    firstCreativeProductionRuntimeDomain: 'packaging',
    secondCreativeProductionRuntimeDomain: 'creative',
    thirdCreativeProductionRuntimeDomain: 'content',
    operationsRuntimeDomainActive: true,
    operationsRuntimeActivationMode: 'read-only-explicit-three-page-coverage',
    businessAdministrationRuntimeDomainActive: true,
    businessAdministrationRuntimeActivationMode: 'accounting-read-only-explicit-single-page-coverage',
    creativeProductionRuntimeDomainActive: true,
    creativeProductionRuntimeActivationMode: 'packaging-wrapper-plus-creative-process-plus-content-studio-explicit-three-page-coverage',
    accountingMutationOwnership: false,
    creativeProductionMutationOwnership: false,
    packagingMutationOwnershipMovedByTopLevelRuntime: false,
    creativeProcessMutationOwnershipMovedByTopLevelRuntime: false,
    contentStudioMutationOwnershipMovedByTopLevelRuntime: false,
    creativeMutationAuthoritiesRequiredAsActivationServices: false,
    packagingBaselineBuild: 301,
    packagingDomainModule: 'creative-production',
  });
}
