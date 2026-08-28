// Devil n Dove Application Modules control API.
// Shared-core recovery surface: intentionally exempt from module gating itself.
// No request-time DDL. Canonical registry changes are applied through the normal D1 migration process.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { CURRENT_RELEASE, MODULE_KEYS, clearModuleConfigCache, readModuleConfig } from '../_lib/appModules.js';
import { snapshotRouteOwnership } from '../_lib/appModuleRoutes.js';

const ALLOWED_MODULES = new Set(Object.values(MODULE_KEYS));
const ALLOWED_ROLES = new Set(['member', 'admin']);
const ALLOWED_ACCESS_LEVELS = new Set(['none', 'read', 'member', 'manage']);
const EXPECTED_MODULE_KEYS = Object.freeze([...ALLOWED_MODULES].sort());
const EXPECTED_ROLE_KEYS = Object.freeze(EXPECTED_MODULE_KEYS.flatMap((moduleKey) => ['admin', 'member'].map((role) => `${moduleKey}:${role}`)).sort());

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

function boolInt(value) {
  if (value === true || value === 1 || value === '1') return 1;
  if (value === false || value === 0 || value === '0') return 0;
  return null;
}

function diagnosticsFor(config) {
  const modules = Array.isArray(config?.modules) ? config.modules : [];
  const roleAccess = Array.isArray(config?.role_access) ? config.role_access : [];
  const moduleKeys = modules.map((row) => normalizeText(row?.module_key).toLowerCase()).filter(Boolean).sort();
  const roleKeys = roleAccess.map((row) => `${normalizeText(row?.module_key).toLowerCase()}:${normalizeText(row?.role_code).toLowerCase()}`).sort();
  const missingModules = EXPECTED_MODULE_KEYS.filter((key) => !moduleKeys.includes(key));
  const unexpectedModules = moduleKeys.filter((key) => !EXPECTED_MODULE_KEYS.includes(key));
  const missingRoleRows = EXPECTED_ROLE_KEYS.filter((key) => !roleKeys.includes(key));
  const unexpectedRoleRows = roleKeys.filter((key) => !EXPECTED_ROLE_KEYS.includes(key));
  const invalidRoleRows = roleAccess.filter((row) => {
    const allowed = Number(row?.is_allowed || 0) === 1;
    const level = normalizeText(row?.access_level).toLowerCase() || 'none';
    return (allowed && level === 'none') || (!allowed && level !== 'none') || !ALLOWED_ACCESS_LEVELS.has(level);
  });
  const disabledWithBackground = modules.filter((row) => Number(row?.is_enabled || 0) !== 1 && Number(row?.background_activity_enabled || 0) === 1);
  const roleRecoveryModules = EXPECTED_MODULE_KEYS.filter((key) => key !== MODULE_KEYS.IT_PLATFORM);
  const adminRecoveryRisks = roleRecoveryModules.filter((moduleKey) => {
    const row = roleAccess.find((entry) => normalizeText(entry?.module_key).toLowerCase() === moduleKey && normalizeText(entry?.role_code).toLowerCase() === 'admin');
    return !row || Number(row.is_allowed || 0) !== 1 || normalizeText(row.access_level).toLowerCase() === 'none';
  });
  const routeSnapshot = snapshotRouteOwnership();

  const healthy = Boolean(
    config?.schema_ready && !config?.migration_required &&
    modules.length === EXPECTED_MODULE_KEYS.length &&
    roleAccess.length === EXPECTED_ROLE_KEYS.length &&
    missingModules.length === 0 && unexpectedModules.length === 0 &&
    missingRoleRows.length === 0 && unexpectedRoleRows.length === 0 &&
    invalidRoleRows.length === 0 && disabledWithBackground.length === 0 &&
    adminRecoveryRisks.length === 0 && routeSnapshot.sharedServiceContracts?.length === 7
  );

  return {
    healthy,
    migration_required: Boolean(config?.migration_required),
    module_count: modules.length,
    expected_module_count: EXPECTED_MODULE_KEYS.length,
    role_access_count: roleAccess.length,
    expected_role_access_count: EXPECTED_ROLE_KEYS.length,
    enabled_module_count: modules.filter((row) => Number(row?.is_enabled || 0) === 1).length,
    background_enabled_count: modules.filter((row) => Number(row?.background_activity_enabled || 0) === 1).length,
    shared_service_contract_count: Number(routeSnapshot.sharedServiceContracts?.length || 0),
    missing_modules: missingModules,
    unexpected_modules: unexpectedModules,
    missing_role_rows: missingRoleRows,
    unexpected_role_rows: unexpectedRoleRows,
    invalid_role_rows: invalidRoleRows.map((row) => `${row.module_key}:${row.role_code}`),
    disabled_with_background: disabledWithBackground.map((row) => row.module_key),
    admin_recovery_risks: adminRecoveryRisks,
    it_access_model: 'explicit-user-grant',
  };
}

async function requireAdmin(request, env) {
  const admin = await getAdminUserFromRequest(request, env);
  if (!admin) return { error: json({ ok: false, error: 'Administrator authorization required.' }, 401) };
  return { admin };
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  const config = await readModuleConfig(env, { force: true });
  return json({
    ok: true,
    release: CURRENT_RELEASE,
    schema_ready: Boolean(config.schema_ready),
    migration_required: Boolean(config.migration_required),
    source: config.source,
    reason: config.reason || null,
    modules: config.modules,
    role_access: config.role_access,
    diagnostics: diagnosticsFor(config),
    recovery_surface: true,
    notes: config.migration_required
      ? 'Canonical five-module registry migration is required before module-control writes are enabled.'
      : 'Module changes are audited and never delete module business data.',
  });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const config = await readModuleConfig(env, { force: true });
  if (!config.schema_ready || config.migration_required) {
    return json({
      ok: false,
      error: 'Canonical five-module registry is not ready. Apply database_platform_convergence.sql before changing module state.',
      code: 'app_module_registry_migration_required',
      source: config.source || 'unknown',
      reason: config.reason || null,
      release: CURRENT_RELEASE,
    }, 409);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const action = normalizeText(body?.action).toLowerCase();
  const moduleKey = normalizeText(body?.module_key).toLowerCase();
  if (!ALLOWED_MODULES.has(moduleKey)) return json({ ok: false, error: 'Unknown application module.' }, 400);

  if (action === 'set_module_state') {
    const isEnabled = boolInt(body?.is_enabled);
    if (isEnabled == null) return json({ ok: false, error: 'is_enabled must be true/false or 1/0.' }, 400);
    const before = await db.prepare('SELECT module_key,is_enabled,background_activity_enabled FROM app_modules WHERE module_key=? LIMIT 1').bind(moduleKey).first();
    if (!before) return json({ ok: false, error: 'Application module record was not found.' }, 404);
    await db.prepare(`
      UPDATE app_modules
      SET is_enabled=?, background_activity_enabled=CASE WHEN ?=0 THEN 0 ELSE background_activity_enabled END, updated_at=CURRENT_TIMESTAMP
      WHERE module_key=?
    `).bind(isEnabled, isEnabled, moduleKey).run();
    clearModuleConfigCache();
    const afterBackground = isEnabled ? Number(before.background_activity_enabled || 0) : 0;
    await auditAdminAction(env, request, auth.admin, {
      action_type: 'application_module_state_changed',
      target_type: 'app_module',
      target_key: moduleKey,
      details: {
        before_is_enabled: Number(before.is_enabled || 0),
        after_is_enabled: isEnabled,
        before_background_activity_enabled: Number(before.background_activity_enabled || 0),
        after_background_activity_enabled: afterBackground,
        background_cleared_by_disable: isEnabled === 0 && Number(before.background_activity_enabled || 0) === 1,
      },
    });
    return json({ ok: true, release: CURRENT_RELEASE, module_key: moduleKey, is_enabled: isEnabled, background_activity_enabled: afterBackground });
  }

  if (action === 'set_background_activity') {
    const enabled = boolInt(body?.background_activity_enabled);
    if (enabled == null) return json({ ok: false, error: 'background_activity_enabled must be true/false or 1/0.' }, 400);
    const before = await db.prepare('SELECT module_key,is_enabled,background_activity_enabled FROM app_modules WHERE module_key=? LIMIT 1').bind(moduleKey).first();
    if (!before) return json({ ok: false, error: 'Application module record was not found.' }, 404);
    if (enabled === 1 && Number(before.is_enabled || 0) !== 1) {
      return json({ ok: false, error: 'Enable the module before allowing module-owned background activity.', code: 'inactive_module_background_forbidden' }, 409);
    }
    await db.prepare('UPDATE app_modules SET background_activity_enabled=?, updated_at=CURRENT_TIMESTAMP WHERE module_key=?').bind(enabled, moduleKey).run();
    clearModuleConfigCache();
    await auditAdminAction(env, request, auth.admin, {
      action_type: 'application_module_background_changed',
      target_type: 'app_module',
      target_key: moduleKey,
      details: { before_background_activity_enabled: Number(before.background_activity_enabled || 0), after_background_activity_enabled: enabled },
    });
    return json({ ok: true, release: CURRENT_RELEASE, module_key: moduleKey, background_activity_enabled: enabled });
  }

  if (action === 'set_role_access') {
    const roleCode = normalizeText(body?.role_code).toLowerCase();
    const isAllowed = boolInt(body?.is_allowed);
    let accessLevel = normalizeText(body?.access_level).toLowerCase() || (isAllowed ? 'read' : 'none');
    if (!ALLOWED_ROLES.has(roleCode)) return json({ ok: false, error: 'role_code must be member or admin.' }, 400);
    if (isAllowed == null) return json({ ok: false, error: 'is_allowed must be true/false or 1/0.' }, 400);
    if (!ALLOWED_ACCESS_LEVELS.has(accessLevel)) return json({ ok: false, error: 'Unsupported access_level.' }, 400);
    if (moduleKey === MODULE_KEYS.IT_PLATFORM && isAllowed === 1) {
      return json({ ok: false, error: 'I.T. access is explicit-user only; role membership cannot grant I.T. access.', code: 'it_explicit_user_access_required' }, 409);
    }
    if (isAllowed === 0) accessLevel = 'none';
    if (isAllowed === 1 && accessLevel === 'none') return json({ ok: false, error: 'An allowed role must have a non-none access_level.' }, 400);

    const before = await db.prepare(`
      SELECT module_key,role_code,is_allowed,access_level FROM app_module_role_access
      WHERE module_key=? AND role_code=? LIMIT 1
    `).bind(moduleKey, roleCode).first();
    await db.prepare(`
      INSERT INTO app_module_role_access (module_key, role_code, is_allowed, access_level, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(module_key, role_code) DO UPDATE SET
        is_allowed=excluded.is_allowed, access_level=excluded.access_level, updated_at=CURRENT_TIMESTAMP
    `).bind(moduleKey, roleCode, isAllowed, accessLevel).run();
    clearModuleConfigCache();
    await auditAdminAction(env, request, auth.admin, {
      action_type: 'application_module_role_access_changed',
      target_type: 'app_module_role_access',
      target_key: `${moduleKey}:${roleCode}`,
      details: { before: before || null, after: { module_key: moduleKey, role_code: roleCode, is_allowed: isAllowed, access_level: accessLevel } },
    });
    return json({ ok: true, release: CURRENT_RELEASE, module_key: moduleKey, role_code: roleCode, is_allowed: isAllowed, access_level: accessLevel });
  }

  return json({ ok: false, error: 'Unsupported module-control action.' }, 400);
}
