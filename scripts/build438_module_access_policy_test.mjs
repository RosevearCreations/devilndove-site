#!/usr/bin/env node

import {
  clearModuleConfigCache,
  evaluateModuleAccess,
  readModuleConfig,
  sharedServiceAccessForRequest,
} from '../functions/api/_lib/appModules.js';
import {
  MODULE_KEYS,
  sharedServiceContractForPath,
} from '../functions/api/_lib/appModuleRoutes.js';

const ADMIN = Object.freeze({ user_id: 1, role: 'admin', is_active: 1 });
const MEMBER = Object.freeze({ user_id: 2, role: 'member', is_active: 1 });
const REQUEST = new Request('https://dev.example.test/api/admin/contracts/inventory-post', { method: 'POST' });

const baseModules = Object.freeze([
  Object.freeze({ module_key: MODULE_KEYS.COMMERCE_OPERATIONS, display_name: 'Commerce & Operations', description: '', is_enabled: 1, requires_login: 0, default_route: '/', load_priority: 10, background_activity_enabled: 0 }),
  Object.freeze({ module_key: MODULE_KEYS.CREATIVE_PRODUCTION, display_name: 'Creative & Production', description: '', is_enabled: 1, requires_login: 1, default_route: '/admin/creative-automation/', load_priority: 20, background_activity_enabled: 0 }),
  Object.freeze({ module_key: MODULE_KEYS.BUSINESS_ADMINISTRATION, display_name: 'Business & Administration', description: '', is_enabled: 1, requires_login: 1, default_route: '/admin/', load_priority: 30, background_activity_enabled: 0 }),
]);

const baseRoles = Object.freeze([
  Object.freeze({ module_key: MODULE_KEYS.COMMERCE_OPERATIONS, role_code: 'member', is_allowed: 1, access_level: 'member' }),
  Object.freeze({ module_key: MODULE_KEYS.COMMERCE_OPERATIONS, role_code: 'admin', is_allowed: 1, access_level: 'manage' }),
  Object.freeze({ module_key: MODULE_KEYS.CREATIVE_PRODUCTION, role_code: 'member', is_allowed: 0, access_level: 'none' }),
  Object.freeze({ module_key: MODULE_KEYS.CREATIVE_PRODUCTION, role_code: 'admin', is_allowed: 1, access_level: 'manage' }),
  Object.freeze({ module_key: MODULE_KEYS.BUSINESS_ADMINISTRATION, role_code: 'member', is_allowed: 0, access_level: 'none' }),
  Object.freeze({ module_key: MODULE_KEYS.BUSINESS_ADMINISTRATION, role_code: 'admin', is_allowed: 1, access_level: 'manage' }),
]);

function modulesWith(overrides = {}) {
  return baseModules.map((row) => Object.freeze({ ...row, ...(overrides[row.module_key] || {}) }));
}

function rolesWith(overrides = {}) {
  return baseRoles.map((row) => {
    const key = `${row.module_key}:${row.role_code}`;
    return Object.freeze({ ...row, ...(overrides[key] || {}) });
  });
}

function makeEnv(modules, roles, { throwReads = false } = {}) {
  return {
    DB: {
      prepare(sql) {
        const text = String(sql || '');
        return {
          async all() {
            if (throwReads) throw new Error('simulated D1 read interruption');
            if (text.includes('FROM app_modules')) return { results: modules.map((row) => ({ ...row })) };
            if (text.includes('FROM app_module_role_access')) return { results: roles.map((row) => ({ ...row })) };
            throw new Error(`Unexpected test SQL: ${text}`);
          },
        };
      },
    },
  };
}

let checks = 0;
let failures = 0;
function check(condition, label, detail = '') {
  checks += 1;
  const ok = Boolean(condition);
  console.log(`${String(checks).padStart(2, '0')}. ${ok ? 'PASS' : 'FAIL'} — ${label}${detail ? ` (${detail})` : ''}`);
  if (!ok) failures += 1;
}

async function sharedAccess(path, modules, roles, user = ADMIN) {
  clearModuleConfigCache();
  const contract = sharedServiceContractForPath(path);
  if (!contract) throw new Error(`Missing shared contract definition for ${path}`);
  return sharedServiceAccessForRequest(REQUEST, makeEnv(modules, roles), contract, { user, force: true });
}

console.log('BUILD 438 MODULE ACCESS POLICY TEST');
console.log('Cloudflare/D1/provider access: NONE');
console.log();

const allConfig = { modules: modulesWith(), role_access: rolesWith() };
check(evaluateModuleAccess(allConfig, MODULE_KEYS.COMMERCE_OPERATIONS, ADMIN).allowed, 'Admin can access enabled Commerce & Operations');
check(evaluateModuleAccess(allConfig, MODULE_KEYS.COMMERCE_OPERATIONS, MEMBER).access_level === 'member', 'Member receives explicit Commerce member access');
check(!evaluateModuleAccess(allConfig, MODULE_KEYS.CREATIVE_PRODUCTION, MEMBER).allowed, 'Member is denied Creative & Production by current role policy');

const commerceOff = modulesWith({ [MODULE_KEYS.COMMERCE_OPERATIONS]: { is_enabled: 0 } });
check(evaluateModuleAccess({ modules: commerceOff, role_access: rolesWith() }, MODULE_KEYS.COMMERCE_OPERATIONS, ADMIN).reason === 'module_disabled', 'Direct access fails when owner module is disabled');

let access = await sharedAccess('/api/admin/contracts/inventory-post', commerceOff, rolesWith());
check(access.allowed && access.qualifying_consumer?.module_key === MODULE_KEYS.CREATIVE_PRODUCTION, 'Creative can consume Inventory post while Commerce UI is disabled');

access = await sharedAccess('/api/admin/contracts/inventory-reverse', commerceOff, rolesWith());
check(access.allowed && access.qualifying_consumer?.module_key === MODULE_KEYS.CREATIVE_PRODUCTION, 'Creative can consume Inventory reversal while Commerce UI is disabled');

const creativeReadOnlyRoles = rolesWith({
  [`${MODULE_KEYS.CREATIVE_PRODUCTION}:admin`]: { is_allowed: 1, access_level: 'read' },
});
access = await sharedAccess('/api/admin/contracts/inventory-post', commerceOff, creativeReadOnlyRoles);
check(!access.allowed && access.reason === 'no_manage_consumer', 'Read-only Creative access cannot consume Inventory mutation contract');

const commerceAndCreativeOff = modulesWith({
  [MODULE_KEYS.COMMERCE_OPERATIONS]: { is_enabled: 0 },
  [MODULE_KEYS.CREATIVE_PRODUCTION]: { is_enabled: 0 },
});
access = await sharedAccess('/api/admin/contracts/inventory-read', commerceAndCreativeOff, rolesWith());
check(!access.allowed && access.reason === 'no_enabled_consumer', 'Inventory read closes when Commerce and Creative consumers are both disabled');

access = await sharedAccess('/api/admin/contracts/catalog-read', commerceAndCreativeOff, rolesWith());
check(access.allowed && access.qualifying_consumer?.module_key === MODULE_KEYS.BUSINESS_ADMINISTRATION, 'Business Administration can retain Catalog read while Commerce and Creative are disabled');

const creativeOff = modulesWith({ [MODULE_KEYS.CREATIVE_PRODUCTION]: { is_enabled: 0 } });
access = await sharedAccess('/api/admin/contracts/content-media', creativeOff, rolesWith());
check(access.allowed && access.qualifying_consumer?.module_key === MODULE_KEYS.COMMERCE_OPERATIONS, 'Commerce can retain Content media read while Creative UI is disabled');

const businessOff = modulesWith({ [MODULE_KEYS.BUSINESS_ADMINISTRATION]: { is_enabled: 0 } });
access = await sharedAccess('/api/admin/contracts/accounting-read', businessOff, rolesWith());
check(access.allowed && access.qualifying_consumer?.module_key === MODULE_KEYS.COMMERCE_OPERATIONS, 'Commerce Operations can retain Accounting read while Business Admin UI is disabled');

clearModuleConfigCache();
const failedConfig = await readModuleConfig(makeEnv([], [], { throwReads: true }), { force: true });
check(failedConfig.source === 'fail_closed' && failedConfig.modules.every((row) => Number(row.is_enabled || 0) === 0), 'Cold module-authority read failure fails all modules closed');

console.log();
if (failures) {
  console.error(`BUILD 438 MODULE ACCESS POLICY TEST: FAIL (${failures}/${checks} failed)`);
  process.exit(1);
}
console.log(`BUILD 438 MODULE ACCESS POLICY TEST: PASS (${checks}/${checks})`);
console.log('Disabled owner UI + enabled explicit consumer contract: PROVEN');
console.log('Shared mutation requires manage-level consumer: PROVEN');
console.log('Cold authority read failure: FAIL CLOSED');
console.log('Production mutation capability: NONE');
