// Devil n Dove Build 438 server route-to-application-module catalog.
// Mirrors the existing Build 302+ client domain grouping without importing browser code.
// Explicit cross-module service contracts are resolved separately from direct module routes.

export const MODULE_KEYS = Object.freeze({
  COMMERCE_OPERATIONS: 'commerce-operations',
  CREATIVE_PRODUCTION: 'creative-production',
  BUSINESS_ADMINISTRATION: 'business-administration',
});

const CORE_EXEMPT = Object.freeze([
  '/admin/application-modules',
  '/api/admin/app-modules',
]);

// These are narrow, reviewed service contracts that one top-level module may consume
// from another. Disabling the owner module blocks its direct UI/legacy API surface,
// but Application Core may still permit one of these contracts when at least one
// enabled consumer module has access. This keeps module switches independent without
// reopening broad owner-module endpoints.
export const SHARED_SERVICE_CONTRACTS = Object.freeze([
  Object.freeze({
    path: '/api/admin/contracts/catalog-read',
    owner_module_key: MODULE_KEYS.COMMERCE_OPERATIONS,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.COMMERCE_OPERATIONS,
      MODULE_KEYS.CREATIVE_PRODUCTION,
      MODULE_KEYS.BUSINESS_ADMINISTRATION,
    ]),
    mutation: false,
  }),
  Object.freeze({
    path: '/api/admin/contracts/inventory-read',
    owner_module_key: MODULE_KEYS.COMMERCE_OPERATIONS,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.COMMERCE_OPERATIONS,
      MODULE_KEYS.CREATIVE_PRODUCTION,
    ]),
    mutation: false,
  }),
  Object.freeze({
    path: '/api/admin/contracts/inventory-cost',
    owner_module_key: MODULE_KEYS.COMMERCE_OPERATIONS,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.COMMERCE_OPERATIONS,
      MODULE_KEYS.BUSINESS_ADMINISTRATION,
    ]),
    mutation: false,
  }),
  Object.freeze({
    path: '/api/admin/contracts/inventory-post',
    owner_module_key: MODULE_KEYS.COMMERCE_OPERATIONS,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.COMMERCE_OPERATIONS,
      MODULE_KEYS.CREATIVE_PRODUCTION,
    ]),
    mutation: true,
  }),
  Object.freeze({
    path: '/api/admin/contracts/inventory-reverse',
    owner_module_key: MODULE_KEYS.COMMERCE_OPERATIONS,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.COMMERCE_OPERATIONS,
      MODULE_KEYS.CREATIVE_PRODUCTION,
    ]),
    mutation: true,
  }),
  Object.freeze({
    path: '/api/admin/contracts/accounting-read',
    owner_module_key: MODULE_KEYS.BUSINESS_ADMINISTRATION,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.BUSINESS_ADMINISTRATION,
      MODULE_KEYS.COMMERCE_OPERATIONS,
    ]),
    mutation: false,
  }),
  Object.freeze({
    path: '/api/admin/contracts/content-media',
    owner_module_key: MODULE_KEYS.CREATIVE_PRODUCTION,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.CREATIVE_PRODUCTION,
      MODULE_KEYS.COMMERCE_OPERATIONS,
    ]),
    mutation: false,
  }),
]);

const COMMERCE_ADMIN_PAGES = Object.freeze([
  '/admin/catalog',
  '/admin/catalog-media',
  '/admin/create-product',
  '/admin/products',
  '/admin/movies',
  '/admin/mobile-product',
  '/admin/release-preflight',
  '/admin/site-item-inventory',
  '/admin/inventory',
  '/admin/inventory-operations',
  '/admin/operations',
  '/admin/orders',
  '/admin/customer-documents',
  '/admin/gift-cards',
  '/admin/members',
  '/admin/membership',
  '/admin/custom-request',
  '/admin/today-tasks',
]);

const CREATIVE_ADMIN_PAGES = Object.freeze([
  '/admin/creative-project',
  '/admin/creative-process',
  '/admin/creative-automation',
  '/admin/creative-assets',
  '/admin/caip',
  '/admin/packaging-studio',
  '/admin/media-content-studio',
  '/admin/content-studio',
  '/admin/visual-enrichment-studio',
  '/admin/image-manifest',
  '/admin/stage-photo-moderation',
  '/admin/content-publications',
]);

const COMMERCE_ADMIN_APIS = Object.freeze([
  '/api/admin/catalog',
  '/api/admin/product',
  '/api/admin/create-product',
  '/api/admin/update-product',
  '/api/admin/delete-product',
  '/api/admin/archive-product',
  '/api/admin/inventory',
  '/api/admin/site-item',
  '/api/admin/order',
  '/api/admin/member',
  '/api/admin/membership',
  '/api/admin/gift-card',
  '/api/admin/customer-document',
  '/api/admin/custom-request',
  '/api/admin/today-task',
  '/api/admin/contracts/operations-',
  '/api/admin/contracts/catalog-',
  '/api/admin/contracts/inventory-',
]);

const CREATIVE_ADMIN_APIS = Object.freeze([
  '/api/admin/creative',
  '/api/admin/caip',
  '/api/admin/packaging',
  '/api/admin/content-studio',
  '/api/admin/media-content-studio',
  '/api/admin/content-publication',
  '/api/admin/image-manifest',
  '/api/admin/visual-enrichment',
  '/api/admin/stage-photo',
  '/api/admin/contracts/creative-',
  '/api/admin/contracts/caip-',
  '/api/admin/contracts/packaging-',
  '/api/admin/contracts/content-',
]);

const COMMERCE_PUBLIC_PAGES = Object.freeze([
  '/shop',
  '/cart',
  '/checkout',
  '/product',
  '/products',
  '/custom-request',
  '/members',
]);

const COMMERCE_PUBLIC_APIS = Object.freeze([
  '/api/member',
  '/api/cart',
  '/api/checkout',
  '/api/product',
  '/api/products',
  '/api/custom-request',
]);

function cleanPath(pathname) {
  const raw = String(pathname || '/').split(/[?#]/, 1)[0] || '/';
  if (raw === '/') return '/';
  return `/${raw.replace(/^\/+|\/+$/g, '')}`;
}

function matches(path, prefix) {
  if (path === prefix || path.startsWith(`${prefix}/`)) return true;
  // Pages Functions frequently encode a related API family as product-detail,
  // gift-card-actions, creative-assets, etc. Treat a hyphen suffix as part of
  // the same reviewed API stem. Contract stems may already end in '-'.
  if (prefix.startsWith('/api/')) {
    return prefix.endsWith('-') ? path.startsWith(prefix) : path.startsWith(`${prefix}-`);
  }
  return false;
}

function matchesAny(path, prefixes) {
  return prefixes.some((prefix) => matches(path, prefix));
}

export function sharedServiceContractForPath(pathname) {
  const path = cleanPath(pathname);
  return SHARED_SERVICE_CONTRACTS.find((contract) => path === contract.path || path.startsWith(`${contract.path}/`)) || null;
}

export function moduleKeyForPath(pathname) {
  const path = cleanPath(pathname);
  if (matchesAny(path, CORE_EXEMPT)) return null;
  if (sharedServiceContractForPath(path)) return null;

  if (matchesAny(path, CREATIVE_ADMIN_PAGES) || matchesAny(path, CREATIVE_ADMIN_APIS)) {
    return MODULE_KEYS.CREATIVE_PRODUCTION;
  }
  if (matchesAny(path, COMMERCE_ADMIN_PAGES) || matchesAny(path, COMMERCE_ADMIN_APIS)) {
    return MODULE_KEYS.COMMERCE_OPERATIONS;
  }
  if (path === '/admin' || path.startsWith('/admin/') || path.startsWith('/api/admin/')) {
    return MODULE_KEYS.BUSINESS_ADMINISTRATION;
  }
  if (matchesAny(path, COMMERCE_PUBLIC_PAGES) || matchesAny(path, COMMERCE_PUBLIC_APIS)) {
    return MODULE_KEYS.COMMERCE_OPERATIONS;
  }
  return null;
}

export function snapshotRouteOwnership() {
  return Object.freeze({
    build: 438,
    coreExempt: CORE_EXEMPT,
    sharedServiceContracts: SHARED_SERVICE_CONTRACTS,
    commerceAdminPages: COMMERCE_ADMIN_PAGES,
    creativeAdminPages: CREATIVE_ADMIN_PAGES,
    commerceAdminApis: COMMERCE_ADMIN_APIS,
    creativeAdminApis: CREATIVE_ADMIN_APIS,
    commercePublicPages: COMMERCE_PUBLIC_PAGES,
    commercePublicApis: COMMERCE_PUBLIC_APIS,
    defaultAdminModule: MODULE_KEYS.BUSINESS_ADMINISTRATION,
  });
}
