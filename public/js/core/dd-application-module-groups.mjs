// Devil n Dove Build 302 Core + Three Application Modules architecture catalog.
// Build 304 added the first passive umbrella runtime metadata for Catalog.
// Build 305 extended that same Commerce & Operations runtime to Inventory.
// Build 306 hardened Inventory write-side contracts; Build 307 added Inventory reversal authority;
// Build 309 added Inventory post authority; Build 310 enabled Creative consumption of both;
// Build 311 added the Inventory-owned cost read boundary; Build 312 added Accounting read;
// Build 313 activates the first read-only Operations runtime page under Commerce & Operations.
// Importing this file creates no timers, fetches, polling, D1/R2 calls,
// route interception, or automatic module activation.

export const BUILD = 302;
export const RUNTIME_CATALOG_BUILD = 304;
export const RUNTIME_INVENTORY_BUILD = 305;
export const INVENTORY_WRITE_CONTRACT_BUILD = 310;
export const INVENTORY_COST_CONTRACT_BUILD = 311;
export const ACCOUNTING_READ_CONTRACT_BUILD = 312;
export const RUNTIME_OPERATIONS_BUILD = 313;

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
    entry: '../modules/commerce-operations/runtime.mjs?v=313',
    runtimeDomains: Object.freeze(['catalog', 'inventory', 'operations']),
  }),
  Object.freeze({
    id: 'creative-production',
    label: 'Creative & Production',
    kind: 'application-module',
    description: 'Creative projects, CAIP, Packaging & Labeling, Media/Content Studio and reviewed production workflows.',
    domains: Object.freeze(['creative', 'caip', 'packaging', 'content']),
    extractionState: 'in-progress',
    entry: null,
    runtimeDomains: Object.freeze([]),
  }),
  Object.freeze({
    id: 'business-administration',
    label: 'Business & Administration',
    kind: 'application-module',
    description: 'Marketing, publishing, SEO, accounting, analytics, administration, command-center and platform operations.',
    domains: Object.freeze(['marketing', 'accounting', 'platform', 'admin']),
    extractionState: 'planned',
    entry: null,
    runtimeDomains: Object.freeze([]),
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
    core: DD_APPLICATION_CORE,
    modules: DD_APPLICATION_MODULES,
    domainMap: DD_DOMAIN_TO_APPLICATION_MODULE,
    topLevelApplicationModuleCount: DD_APPLICATION_MODULES.length,
    currentRuntimeMigrationMode: 'catalog-inventory-operations-read-only-runtime',
    firstUmbrellaRuntimeModule: 'commerce-operations',
    firstUmbrellaRuntimeDomain: 'catalog',
    secondUmbrellaRuntimeDomain: 'inventory',
    thirdUmbrellaRuntimeDomain: 'operations',
    operationsRuntimeDomainActive: true,
    operationsRuntimeActivationMode: 'read-only-first-page',
    packagingBaselineBuild: 301,
    packagingDomainModule: 'creative-production',
  });
}
