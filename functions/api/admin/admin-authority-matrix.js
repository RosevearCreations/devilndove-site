// Release 467 Build 64 — fail-closed root administrator authority matrix.
// Read-only recovery/proof surface: no request-time DDL, no D1 mutation, no R2/provider action.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { CURRENT_RELEASE, evaluateModuleAccess, readModuleConfig } from '../_lib/appModules.js';
import { MODULE_KEYS, SHARED_SERVICE_CONTRACTS } from '../_lib/appModuleRoutes.js';

export const ADMIN_AUTHORITY_MATRIX_VERSION = 'R467B64_V1';
export const EXPECTED_SHARED_SERVICE_COUNT = 7;
const EXPECTED_MODULE_KEYS = Object.freeze(Object.values(MODULE_KEYS).sort());
const BUSINESS_MODULE_KEYS = Object.freeze(EXPECTED_MODULE_KEYS.filter((key) => key !== MODULE_KEYS.IT_PLATFORM));

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

function level(value) {
  return normalizeText(value).toLowerCase() || 'none';
}

function roleAccessFor(config, moduleKey, roleCode) {
  return (config?.role_access || []).find((row) =>
    normalizeText(row?.module_key).toLowerCase() === moduleKey &&
    normalizeText(row?.role_code).toLowerCase() === roleCode
  ) || null;
}

function moduleByKey(config, moduleKey) {
  return (config?.modules || []).find((row) => normalizeText(row?.module_key).toLowerCase() === moduleKey) || null;
}

function moduleMatrixRow(config, rootAdmin, moduleKey) {
  const module = moduleByKey(config, moduleKey);
  const enabled = Number(module?.is_enabled || 0) === 1;
  const access = module ? evaluateModuleAccess(config, moduleKey, rootAdmin) : null;
  const fullManage = !enabled || Boolean(access?.allowed && level(access?.access_level) === 'manage');
  return {
    module_key: moduleKey,
    present: Boolean(module),
    enabled,
    required: enabled,
    allowed: Boolean(access?.allowed),
    access_level: level(access?.access_level),
    source: access?.reason || (module ? 'module_disabled' : 'unknown_module'),
    full_manage: fullManage,
  };
}

function sharedServiceMatrixRow(config, rootAdmin, contract) {
  const consumers = Array.isArray(contract?.consumer_module_keys) ? contract.consumer_module_keys : [];
  const mutation = Boolean(contract?.mutation);
  const consumerAccess = consumers.map((moduleKey) => {
    const module = moduleByKey(config, moduleKey);
    const moduleEnabled = Number(module?.is_enabled || 0) === 1;
    const access = module ? evaluateModuleAccess(config, moduleKey, rootAdmin) : null;
    const qualifies = Boolean(
      moduleEnabled && access?.allowed && (!mutation || level(access?.access_level) === 'manage')
    );
    return {
      module_key: moduleKey,
      module_enabled: moduleEnabled,
      allowed: Boolean(access?.allowed),
      access_level: level(access?.access_level),
      source: access?.reason || (module ? 'module_disabled' : 'unknown_module'),
      qualifies,
    };
  });
  const required = consumerAccess.some((row) => row.module_enabled);
  const qualifying = consumerAccess.filter((row) => row.qualifies);
  return {
    path: contract?.path || '',
    owner_module_key: contract?.owner_module_key || '',
    mutation,
    required,
    allowed: !required || qualifying.length > 0,
    qualifying_consumer_module_keys: qualifying.map((row) => row.module_key),
    consumer_access: consumerAccess,
  };
}

export function buildAdminAuthorityMatrix(config, rootAdmin, rootItGrant = null) {
  const modules = Array.isArray(config?.modules) ? config.modules : [];
  const actualModuleKeys = modules.map((row) => normalizeText(row?.module_key).toLowerCase()).filter(Boolean).sort();
  const missingModules = EXPECTED_MODULE_KEYS.filter((key) => !actualModuleKeys.includes(key));
  const unexpectedModules = actualModuleKeys.filter((key) => !EXPECTED_MODULE_KEYS.includes(key));
  const exactRegistry = missingModules.length === 0 && unexpectedModules.length === 0 && actualModuleKeys.length === EXPECTED_MODULE_KEYS.length;

  const rootValid = Boolean(
    Number(rootAdmin?.user_id || 0) > 0 &&
    Number(rootAdmin?.is_active || 0) === 1 &&
    level(rootAdmin?.role) === 'admin'
  );
  const runtimeRoot = rootValid ? { ...rootAdmin, role: 'admin', module_access: [] } : null;
  const moduleMatrix = EXPECTED_MODULE_KEYS.map((moduleKey) => moduleMatrixRow(config, runtimeRoot, moduleKey));
  const missingManageModules = moduleMatrix
    .filter((row) => row.required && !row.full_manage)
    .map((row) => row.module_key);

  const businessAdminRoleManage = BUSINESS_MODULE_KEYS.every((moduleKey) => {
    const row = roleAccessFor(config, moduleKey, 'admin');
    return Number(row?.is_allowed || 0) === 1 && level(row?.access_level) === 'manage';
  });
  const itRole = roleAccessFor(config, MODULE_KEYS.IT_PLATFORM, 'admin');
  const itRoleDerivedAccessDenied = Boolean(itRole && Number(itRole.is_allowed || 0) === 0 && level(itRole.access_level) === 'none');
  const rootItRecoveryGrant = Boolean(
    Number(rootItGrant?.is_allowed || 0) === 1 && level(rootItGrant?.access_level) === 'manage'
  );

  const sharedServices = SHARED_SERVICE_CONTRACTS.map((contract) => sharedServiceMatrixRow(config, runtimeRoot, contract));
  const missingSharedServiceAccess = sharedServices.filter((row) => row.required && !row.allowed).map((row) => row.path);
  const sharedServiceFullAccess = SHARED_SERVICE_CONTRACTS.length === EXPECTED_SHARED_SERVICE_COUNT && missingSharedServiceAccess.length === 0;
  const enabledModuleCount = moduleMatrix.filter((row) => row.enabled).length;
  const rootAdminFullManage = rootValid && missingManageModules.length === 0;

  const healthy = Boolean(
    config?.schema_ready === true &&
    config?.migration_required !== true &&
    exactRegistry &&
    rootAdminFullManage &&
    businessAdminRoleManage &&
    itRoleDerivedAccessDenied &&
    rootItRecoveryGrant &&
    sharedServiceFullAccess
  );

  return {
    version: ADMIN_AUTHORITY_MATRIX_VERSION,
    healthy,
    fail_closed: true,
    schema_ready: config?.schema_ready === true,
    migration_required: Boolean(config?.migration_required),
    exact_canonical_registry: exactRegistry,
    expected_module_count: EXPECTED_MODULE_KEYS.length,
    module_count: actualModuleKeys.length,
    enabled_module_count: enabledModuleCount,
    missing_modules: missingModules,
    unexpected_modules: unexpectedModules,
    root_admin: {
      user_id: Number(rootAdmin?.user_id || 0) || null,
      active: Number(rootAdmin?.is_active || 0) === 1,
      role: level(rootAdmin?.role),
      full_manage: rootAdminFullManage,
      missing_manage_modules: missingManageModules,
      runtime_authority_source: 'admin_role_full_access',
      explicit_it_recovery_manage: rootItRecoveryGrant,
    },
    storage_baseline: {
      business_admin_role_manage: businessAdminRoleManage,
      it_role_derived_access_denied: itRoleDerivedAccessDenied,
      root_it_recovery_grant: rootItRecoveryGrant,
    },
    modules: moduleMatrix,
    shared_services: {
      expected_count: EXPECTED_SHARED_SERVICE_COUNT,
      contract_count: SHARED_SERVICE_CONTRACTS.length,
      full_access: sharedServiceFullAccess,
      missing_access: missingSharedServiceAccess,
      rows: sharedServices,
    },
  };
}

async function loadRootAdmin(db) {
  return db.prepare(`
    SELECT user_id,role,is_active
    FROM users
    WHERE is_active=1 AND lower(trim(role))='admin'
    ORDER BY user_id ASC
    LIMIT 1
  `).first();
}

async function loadRootItGrant(db, rootAdminId) {
  if (!Number(rootAdminId || 0)) return null;
  return db.prepare(`
    SELECT is_allowed,access_level
    FROM app_module_user_access
    WHERE module_key='it-platform' AND user_id=?
    LIMIT 1
  `).bind(Number(rootAdminId)).first();
}

export async function onRequestGet({ request, env }) {
  const currentAdmin = await getAdminUserFromRequest(request, env);
  if (!currentAdmin) return json({ ok: false, error: 'Administrator authorization required.' }, 401);

  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.', fail_closed: true }, 503);

  try {
    const config = await readModuleConfig(env, { force: true });
    const rootAdmin = await loadRootAdmin(db);
    if (!rootAdmin) {
      return json({ ok: false, error: 'No active root administrator exists.', fail_closed: true }, 503);
    }
    const rootItGrant = await loadRootItGrant(db, rootAdmin.user_id);
    const authorityMatrix = buildAdminAuthorityMatrix(config, rootAdmin, rootItGrant);
    return json({
      ok: authorityMatrix.healthy,
      release: CURRENT_RELEASE,
      build: 64,
      read_only: true,
      automatic_repair: false,
      d1_mutation: false,
      r2_mutation: false,
      provider_execution: false,
      current_admin_is_root: Number(currentAdmin.user_id || 0) === Number(rootAdmin.user_id || 0),
      authority_matrix: authorityMatrix,
      error: authorityMatrix.healthy ? null : 'Root administrator authority matrix is not fully green.',
    }, authorityMatrix.healthy ? 200 : 503);
  } catch (error) {
    return json({
      ok: false,
      release: CURRENT_RELEASE,
      build: 64,
      read_only: true,
      fail_closed: true,
      error: 'Root administrator authority matrix could not be proven.',
      detail: normalizeText(error?.message) || 'authority_matrix_read_failed',
    }, 503);
  }
}
