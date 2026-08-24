// Devil n Dove Build 302 Core + Three Application Modules architecture catalog.
// Build 304 adds passive runtime-entry metadata for the first umbrella extraction.
// Importing this file still creates no timers, fetches, polling, D1/R2 calls,
// route interception, or automatic module activation.

export const BUILD = 302;
export const RUNTIME_CATALOG_BUILD = 304;

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
    entry: '../modules/commerce-operations/runtime.mjs?v=304',
    runtimeDomains: Object.freeze(['catalog']),
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
    core: DD_APPLICATION_CORE,
    modules: DD_APPLICATION_MODULES,
    domainMap: DD_DOMAIN_TO_APPLICATION_MODULE,
    topLevelApplicationModuleCount: DD_APPLICATION_MODULES.length,
    currentRuntimeMigrationMode: 'catalog-first-umbrella-runtime-extraction',
    firstUmbrellaRuntimeModule: 'commerce-operations',
    firstUmbrellaRuntimeDomain: 'catalog',
    packagingBaselineBuild: 301,
    packagingDomainModule: 'creative-production',
  });
}
