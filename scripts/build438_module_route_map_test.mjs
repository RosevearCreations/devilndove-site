#!/usr/bin/env node

import { MODULE_KEYS, moduleKeyForPath, snapshotRouteOwnership } from '../functions/api/_lib/appModuleRoutes.js';

const cases = [
  // Shared core / unowned.
  ['/admin/application-modules/', null],
  ['/api/admin/app-modules', null],
  ['/api/auth/me', null],
  ['/about/', null],

  // Commerce & Operations pages.
  ['/shop/', MODULE_KEYS.COMMERCE_OPERATIONS],
  ['/cart/', MODULE_KEYS.COMMERCE_OPERATIONS],
  ['/checkout/', MODULE_KEYS.COMMERCE_OPERATIONS],
  ['/members/', MODULE_KEYS.COMMERCE_OPERATIONS],
  ['/admin/catalog/', MODULE_KEYS.COMMERCE_OPERATIONS],
  ['/admin/catalog-media/', MODULE_KEYS.COMMERCE_OPERATIONS],
  ['/admin/products/', MODULE_KEYS.COMMERCE_OPERATIONS],
  ['/admin/inventory-operations/', MODULE_KEYS.COMMERCE_OPERATIONS],
  ['/admin/orders/', MODULE_KEYS.COMMERCE_OPERATIONS],
  ['/admin/membership/', MODULE_KEYS.COMMERCE_OPERATIONS],
  ['/admin/gift-cards/', MODULE_KEYS.COMMERCE_OPERATIONS],
  ['/admin/customer-documents/', MODULE_KEYS.COMMERCE_OPERATIONS],

  // Commerce API stems, including hyphenated families.
  ['/api/member/orders', MODULE_KEYS.COMMERCE_OPERATIONS],
  ['/api/admin/product-detail', MODULE_KEYS.COMMERCE_OPERATIONS],
  ['/api/admin/product-resources', MODULE_KEYS.COMMERCE_OPERATIONS],
  ['/api/admin/inventory-operations', MODULE_KEYS.COMMERCE_OPERATIONS],
  ['/api/admin/gift-card-actions', MODULE_KEYS.COMMERCE_OPERATIONS],
  ['/api/admin/customer-documents', MODULE_KEYS.COMMERCE_OPERATIONS],
  ['/api/admin/contracts/operations-membership-read', MODULE_KEYS.COMMERCE_OPERATIONS],

  // Creative & Production pages.
  ['/admin/packaging-studio/', MODULE_KEYS.CREATIVE_PRODUCTION],
  ['/admin/creative-process/', MODULE_KEYS.CREATIVE_PRODUCTION],
  ['/admin/creative-automation/', MODULE_KEYS.CREATIVE_PRODUCTION],
  ['/admin/creative-assets/', MODULE_KEYS.CREATIVE_PRODUCTION],
  ['/admin/content-studio/', MODULE_KEYS.CREATIVE_PRODUCTION],
  ['/admin/media-content-studio/', MODULE_KEYS.CREATIVE_PRODUCTION],
  ['/admin/visual-enrichment-studio/', MODULE_KEYS.CREATIVE_PRODUCTION],

  // Creative API stems.
  ['/api/admin/packaging-projects', MODULE_KEYS.CREATIVE_PRODUCTION],
  ['/api/admin/creative-process', MODULE_KEYS.CREATIVE_PRODUCTION],
  ['/api/admin/creative-assets', MODULE_KEYS.CREATIVE_PRODUCTION],
  ['/api/admin/caip-media-upload', MODULE_KEYS.CREATIVE_PRODUCTION],
  ['/api/admin/content-studio', MODULE_KEYS.CREATIVE_PRODUCTION],
  ['/api/admin/media-content-studio', MODULE_KEYS.CREATIVE_PRODUCTION],
  ['/api/admin/contracts/creative-project-read', MODULE_KEYS.CREATIVE_PRODUCTION],

  // Business & Administration fallback.
  ['/admin/', MODULE_KEYS.BUSINESS_ADMINISTRATION],
  ['/admin/accounting/', MODULE_KEYS.BUSINESS_ADMINISTRATION],
  ['/admin/analytics/', MODULE_KEYS.BUSINESS_ADMINISTRATION],
  ['/admin/application-sanity/', MODULE_KEYS.BUSINESS_ADMINISTRATION],
  ['/admin/prelaunch/', MODULE_KEYS.BUSINESS_ADMINISTRATION],
  ['/api/admin/accounting-profit-loss', MODULE_KEYS.BUSINESS_ADMINISTRATION],
  ['/api/admin/analytics-summary', MODULE_KEYS.BUSINESS_ADMINISTRATION],
  ['/api/admin/users', MODULE_KEYS.BUSINESS_ADMINISTRATION],
  ['/api/admin/startup-readiness', MODULE_KEYS.BUSINESS_ADMINISTRATION],
];

let failures = 0;
for (const [path, expected] of cases) {
  const actual = moduleKeyForPath(path);
  const ok = actual === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${path} -> ${actual ?? 'core/unowned'}${ok ? '' : ` (expected ${expected ?? 'core/unowned'})`}`);
  if (!ok) failures += 1;
}

const snapshot = snapshotRouteOwnership();
const moduleSet = new Set([
  MODULE_KEYS.COMMERCE_OPERATIONS,
  MODULE_KEYS.CREATIVE_PRODUCTION,
  MODULE_KEYS.BUSINESS_ADMINISTRATION,
]);
if (moduleSet.size !== 3 || snapshot.build !== 438) {
  console.error('FAIL route ownership snapshot does not describe Build 438 / three top-level modules.');
  failures += 1;
}

console.log();
if (failures) {
  console.error(`BUILD 438 MODULE ROUTE MAP TEST: FAIL (${failures} failure${failures === 1 ? '' : 's'})`);
  process.exit(1);
}
console.log(`BUILD 438 MODULE ROUTE MAP TEST: PASS (${cases.length} routes)`);
console.log('Core recovery/auth surfaces: UNOWNED / AVAILABLE');
console.log('Production mutation capability: NONE');
