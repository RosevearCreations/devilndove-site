// Devil n Dove canonical application-module route catalog.
// Historical module keys are translated only as a temporary D1 compatibility bridge.

export const MODULE_KEYS = Object.freeze({
  STOREFRONT: 'storefront',
  CREATORS: 'creators',
  SOCIALS: 'socials',
  FINANCIALS: 'financials',
  IT_PLATFORM: 'it-platform',
});

export const LEGACY_MODULE_KEYS = Object.freeze({
  'commerce-operations': MODULE_KEYS.STOREFRONT,
  'creative-production': MODULE_KEYS.CREATORS,
  'business-administration': MODULE_KEYS.FINANCIALS,
});

export function canonicalModuleKey(value) {
  const key = String(value || '').trim().toLowerCase();
  return LEGACY_MODULE_KEYS[key] || key;
}

const CORE_EXEMPT = Object.freeze([
  '/admin/application-modules',
  '/api/admin/app-modules',
]);

export const SHARED_SERVICE_CONTRACTS = Object.freeze([
  Object.freeze({
    path: '/api/admin/contracts/catalog-read',
    owner_module_key: MODULE_KEYS.STOREFRONT,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.STOREFRONT,
      MODULE_KEYS.CREATORS,
      MODULE_KEYS.SOCIALS,
      MODULE_KEYS.FINANCIALS,
    ]),
    mutation: false,
  }),
  Object.freeze({
    path: '/api/admin/contracts/inventory-read',
    owner_module_key: MODULE_KEYS.STOREFRONT,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.STOREFRONT,
      MODULE_KEYS.CREATORS,
      MODULE_KEYS.FINANCIALS,
    ]),
    mutation: false,
  }),
  Object.freeze({
    path: '/api/admin/contracts/inventory-cost',
    owner_module_key: MODULE_KEYS.STOREFRONT,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.STOREFRONT,
      MODULE_KEYS.FINANCIALS,
    ]),
    mutation: false,
  }),
  Object.freeze({
    path: '/api/admin/contracts/inventory-post',
    owner_module_key: MODULE_KEYS.STOREFRONT,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.STOREFRONT,
      MODULE_KEYS.CREATORS,
    ]),
    mutation: true,
  }),
  Object.freeze({
    path: '/api/admin/contracts/inventory-reverse',
    owner_module_key: MODULE_KEYS.STOREFRONT,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.STOREFRONT,
      MODULE_KEYS.CREATORS,
    ]),
    mutation: true,
  }),
  Object.freeze({
    path: '/api/admin/contracts/accounting-read',
    owner_module_key: MODULE_KEYS.FINANCIALS,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.FINANCIALS,
      MODULE_KEYS.STOREFRONT,
    ]),
    mutation: false,
  }),
  Object.freeze({
    path: '/api/admin/contracts/content-media',
    owner_module_key: MODULE_KEYS.CREATORS,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.CREATORS,
      MODULE_KEYS.STOREFRONT,
      MODULE_KEYS.SOCIALS,
    ]),
    mutation: false,
  }),
]);

const STOREFRONT_ADMIN_PAGES = Object.freeze([
  '/admin/catalog',
  '/admin/catalog-media',
  '/admin/create-product',
  '/admin/products',
  '/admin/movies',
  '/admin/mobile-product',
  '/admin/mobile-inventory',
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
  '/admin/home-carousel',
  '/admin/marketplace-exports',
  '/admin/marketplace-mapping',
  '/admin/public-display-order',
]);

const CREATOR_ADMIN_PAGES = Object.freeze([
  '/admin/creative-project',
  '/admin/creative-process',
  '/admin/creative-automation',
  '/admin/creative-assets',
  '/admin/caip',
  '/admin/packaging-studio',
  '/admin/packaging',
  '/admin/media-content-studio',
  '/admin/content-studio',
  '/admin/visual-enrichment-studio',
  '/admin/image-manifest',
  '/admin/stage-photo-moderation',
]);

const SOCIAL_ADMIN_PAGES = Object.freeze([
  '/admin/social-publishing',
  '/admin/content-publications',
]);

const FINANCIAL_ADMIN_PAGES = Object.freeze([
  '/admin/accounting',
]);

const IT_ADMIN_PAGES = Object.freeze([
  '/admin/it-platform',
  '/admin/application-sanity',
  '/admin/deploy-readiness',
  '/admin/deployment-preflight',
  '/admin/go-live-execution',
  '/admin/live-ops-followthrough',
  '/admin/markdown-sanity',
  '/admin/operational-continuity',
  '/admin/post-deploy-smoke-tests',
  '/admin/prelaunch',
  '/admin/promotion-control',
  '/admin/readiness',
  '/admin/release-control',
  '/admin/release-notes',
  '/admin/release-preflight',
  '/admin/safe-deploy-package',
  '/admin/startup-readiness',
  '/admin/users',
]);

const STOREFRONT_ADMIN_APIS = Object.freeze([
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
  '/api/admin/customer-documents',
  '/api/admin/custom-request',
  '/api/admin/today-task',
  '/api/admin/home-carousel',
  '/api/admin/marketplace',
  '/api/admin/contracts/operations-',
  '/api/admin/contracts/catalog-',
  '/api/admin/contracts/inventory-',
]);

const CREATOR_ADMIN_APIS = Object.freeze([
  '/api/admin/creative',
  '/api/admin/caip',
  '/api/admin/packaging',
  '/api/admin/content-studio',
  '/api/admin/media-content-studio',
  '/api/admin/image-manifest',
  '/api/admin/visual-enrichment',
  '/api/admin/stage-photo',
  '/api/admin/contracts/creative-',
  '/api/admin/contracts/caip-',
  '/api/admin/contracts/packaging-',
  '/api/admin/contracts/content-',
]);

const SOCIAL_ADMIN_APIS = Object.freeze([
  '/api/admin/social',
  '/api/admin/content-publication',
]);

const FINANCIAL_ADMIN_APIS = Object.freeze([
  '/api/admin/accounting',
  '/api/admin/payment',
  '/api/payment-providers',
]);

const IT_ADMIN_APIS = Object.freeze([
  '/api/admin/infrastructure-readiness',
  '/api/admin/payment-provider-testing-blockers',
  '/api/admin/payment-provider-obstacle-probe',
  '/api/admin/post-deploy-smoke-tests',
  '/api/admin/startup-readiness',
  '/api/admin/deploy',
  '/api/admin/readiness',
  '/api/admin/release',
]);

const STOREFRONT_PUBLIC_PAGES = Object.freeze([
  '/',
  '/shop',
  '/cart',
  '/checkout',
  '/product',
  '/products',
  '/custom-request',
  '/members',
]);

const SOCIAL_PUBLIC_PAGES = Object.freeze([
  '/socials',
  '/workshop-journal',
]);

const STOREFRONT_PUBLIC_APIS = Object.freeze([
  '/api/member',
  '/api/cart',
  '/api/checkout',
  '/api/product',
  '/api/products',
  '/api/custom-request',
  '/api/home-carousel',
]);

const SOCIAL_PUBLIC_APIS = Object.freeze([
  '/api/social',
]);

function cleanPath(pathname) {
  const raw = String(pathname || '/').split(/[?#]/, 1)[0] || '/';
  if (raw === '/') return '/';
  return `/${raw.replace(/^\/+|\/+$/g, '')}`;
}

function matches(path, prefix) {
  if (path === prefix || path.startsWith(`${prefix}/`)) return true;
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

  if (matchesAny(path, IT_ADMIN_PAGES) || matchesAny(path, IT_ADMIN_APIS)) return MODULE_KEYS.IT_PLATFORM;
  if (matchesAny(path, FINANCIAL_ADMIN_PAGES) || matchesAny(path, FINANCIAL_ADMIN_APIS)) return MODULE_KEYS.FINANCIALS;
  if (matchesAny(path, SOCIAL_ADMIN_PAGES) || matchesAny(path, SOCIAL_ADMIN_APIS)) return MODULE_KEYS.SOCIALS;
  if (matchesAny(path, CREATOR_ADMIN_PAGES) || matchesAny(path, CREATOR_ADMIN_APIS)) return MODULE_KEYS.CREATORS;
  if (matchesAny(path, STOREFRONT_ADMIN_PAGES) || matchesAny(path, STOREFRONT_ADMIN_APIS)) return MODULE_KEYS.STOREFRONT;
  if (matchesAny(path, SOCIAL_PUBLIC_PAGES) || matchesAny(path, SOCIAL_PUBLIC_APIS)) return MODULE_KEYS.SOCIALS;
  if (matchesAny(path, STOREFRONT_PUBLIC_PAGES) || matchesAny(path, STOREFRONT_PUBLIC_APIS)) return MODULE_KEYS.STOREFRONT;

  // Unclassified admin surfaces remain Application Core until deliberately assigned.
  return null;
}

export function snapshotRouteOwnership() {
  return Object.freeze({
    release: 447,
    coreExempt: CORE_EXEMPT,
    sharedServiceContracts: SHARED_SERVICE_CONTRACTS,
    storefrontAdminPages: STOREFRONT_ADMIN_PAGES,
    creatorAdminPages: CREATOR_ADMIN_PAGES,
    socialAdminPages: SOCIAL_ADMIN_PAGES,
    financialAdminPages: FINANCIAL_ADMIN_PAGES,
    itAdminPages: IT_ADMIN_PAGES,
    storefrontAdminApis: STOREFRONT_ADMIN_APIS,
    creatorAdminApis: CREATOR_ADMIN_APIS,
    socialAdminApis: SOCIAL_ADMIN_APIS,
    financialAdminApis: FINANCIAL_ADMIN_APIS,
    itAdminApis: IT_ADMIN_APIS,
    storefrontPublicPages: STOREFRONT_PUBLIC_PAGES,
    socialPublicPages: SOCIAL_PUBLIC_PAGES,
    storefrontPublicApis: STOREFRONT_PUBLIC_APIS,
    socialPublicApis: SOCIAL_PUBLIC_APIS,
  });
}
