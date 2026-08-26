#!/usr/bin/env node

import {
  MODULE_KEYS,
  moduleKeyForPath,
  sharedServiceContractForPath,
  snapshotRouteOwnership,
} from '../functions/api/_lib/appModuleRoutes.js';

const cases = [
  // Shared core / unowned.
  ['/admin/application-modules/', null],
  ['/api/admin/app-modules', null],
  ['/api/auth/me', null],
  ['/about/', null],

  // Explicit cross-module contracts resolve through Application Core rather than
  // inheriting the owner module's direct-route switch.
  ['/api/admin/contracts/catalog-read', null],
  ['/api/admin/contracts/inventory-read', null],
  ['/api/admin/contracts/inventory-cost', null],
  ['/api/admin/contracts/inventory-post', null],
  ['/api/admin/contracts/inventory-reverse', null],
  ['/api/admin/contracts/accounting-read', null],
  ['/api/admin/contracts/content-media', null],

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

const sharedCases = [
  ['/api/admin/contracts/catalog-read', MODULE_KEYS.COMMERCE_OPERATIONS, [MODULE_KEYS.CREATIVE_PRODUCTION, MODULE_KEYS.BUSINESS_ADMINISTRATION], false],
  ['/api/admin/contracts/inventory-read', MODULE_KEYS.COMMERCE_OPERATIONS, [MODULE_KEYS.CREATIVE_PRODUCTION], false],
  ['/api/admin/contracts/inventory-cost', MODULE_KEYS.COMMERCE_OPERATIONS, [MODULE_KEYS.BUSINESS_ADMINISTRATION], false],
  ['/api/admin/contracts/inventory-post', MODULE_KEYS.COMMERCE_OPERATIONS, [MODULE_KEYS.CREATIVE_PRODUCTION], true],
  ['/api/admin/contracts/inventory-reverse', MODULE_KEYS.COMMERCE_OPERATIONS, [MODULE_KEYS.CREATIVE_PRODUCTION], true],
  ['/api/admin/contracts/accounting-read', MODULE_KEYS.BUSINESS_ADMINISTRATION, [MODULE_KEYS.COMMERCE_OPERATIONS], false],
  ['/api/admin/contracts/content-media', MODULE_KEYS.CREATIVE_PRODUCTION, [MODULE_KEYS.COMMERCE_OPERATIONS], false],
];

for (const [path, expectedOwner, expectedExternalConsumers, expectedMutation] of sharedCases) {
  const contract = sharedServiceContractForPath(path);
  const externalConsumers = (contract?.consumer_module_keys || []).filter((key) => key !== expectedOwner);
  const ok = Boolean(
    contract &&
    contract.owner_module_key === expectedOwner &&
    contract.mutation === expectedMutation &&
    expectedExternalConsumers.every((key) => externalConsumers.includes(key))
  );
  console.log(`${ok ? 'PASS' : 'FAIL'} shared ${path} -> owner=${contract?.owner_module_key || 'missing'} consumers=${(contract?.consumer_module_keys || []).join(',')}`);
  if (!ok) failures += 1;
}

const snapshot = snapshotRouteOwnership();
const moduleSet = new Set([
  MODULE_KEYS.COMMERCE_OPERATIONS,
  MODULE_KEYS.CREATIVE_PRODUCTION,
  MODULE_KEYS.BUSINESS_ADMINISTRATION,
]);
if (moduleSet.size !== 3 || snapshot.build !== 438 || snapshot.sharedServiceContracts?.length !== 7) {
  console.error('FAIL route ownership snapshot does not describe Build 438 / three top-level modules / seven shared contracts.');
  failures += 1;
}

console.log();
if (failures) {
  console.error(`BUILD 438 MODULE ROUTE MAP TEST: FAIL (${failures} failure${failures === 1 ? '' : 's'})`);
  process.exit(1);
}
console.log(`BUILD 438 MODULE ROUTE MAP TEST: PASS (${cases.length} routes + ${sharedCases.length} shared contracts)`);
console.log('Core recovery/auth surfaces: UNOWNED / AVAILABLE');
console.log('Cross-module service contracts: EXPLICIT / CONSUMER-GATED');
console.log('Production mutation capability: NONE');
