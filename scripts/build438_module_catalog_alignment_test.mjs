#!/usr/bin/env node

import { DD_MODULE_DEFINITIONS } from '../public/js/core/dd-module-definitions.mjs';
import { applicationModuleForDomain } from '../public/js/core/dd-application-module-groups.mjs';
import { moduleKeyForPath } from '../functions/api/_lib/appModuleRoutes.js';

let checked = 0;
let failures = 0;

for (const definition of DD_MODULE_DEFINITIONS) {
  // The public domain is an informational/static shell. Build 438 gates concrete
  // transactional Commerce surfaces (Shop/Cart/Checkout/Member/product APIs) but
  // intentionally leaves unrelated informational pages available.
  if (definition.id === 'public') continue;

  const expected = applicationModuleForDomain(definition.id);
  if (!expected) continue;

  const routes = [...(definition.exactRoutes || []), ...(definition.routePrefixes || [])];
  for (const route of routes) {
    checked += 1;
    const actual = moduleKeyForPath(route);
    const ok = actual === expected;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${definition.id.padEnd(11)} ${route} -> ${actual ?? 'core/unowned'}${ok ? '' : ` (expected ${expected})`}`);
    if (!ok) failures += 1;
  }
}

console.log();
if (failures) {
  console.error(`BUILD 438 MODULE CATALOG ALIGNMENT TEST: FAIL (${failures}/${checked} routes mismatched)`);
  process.exit(1);
}

console.log(`BUILD 438 MODULE CATALOG ALIGNMENT TEST: PASS (${checked}/${checked})`);
console.log('Existing Build 305 domain catalog -> Build 438 server top-level ownership: ALIGNED');
console.log('Public informational shell: intentionally not globally disabled by transactional Commerce switch');
console.log('Production mutation capability: NONE');
