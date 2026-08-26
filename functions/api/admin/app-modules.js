// Devil n Dove Build 438 Application Modules control API.
// Shared-core recovery surface: intentionally exempt from module gating itself.
// No request-time DDL. Schema must be applied through the Build 438 migration.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import {
  BUILD,
  MODULE_KEYS,
  clearModuleConfigCache,
  readModuleConfig,
} from '../_lib/appModules.js';

const ALLOWED_MODULES = new Set(Object.values(MODULE_KEYS));
const ALLOWED_ROLES = new Set(['member', 'admin']);
const ALLOWED_ACCESS_LEVELS = new Set(['none', 'read', 'member', 'manage']);

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

function boolInt(value) {
  if (value === true || value === 1 || value === '1') return 1;
  if (value === false || value === 0 || value === '0') return 0;
  return null;
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
    build: BUILD,
    schema_ready: Boolean(config.schema_ready),
    source: config.source,
    reason: config.reason || null,
    modules: config.modules,
    role_access: config.role_access,
    recovery_surface: true,
    notes: config.schema_ready
      ? 'Module changes are audited and never delete module business data.'
      : 'Build 438 module schema is not applied yet. Current defaults remain active; writes are blocked.',
  });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const config = await readModuleConfig(env, { force: true });
  if (!config.schema_ready) {
    return json({
      ok: false,
      error: 'Build 438 application-module schema is not ready. Apply the canonical migration before changing module state.',
      code: 'app_module_schema_not_ready',
      build: BUILD,
    }, 409);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const action = normalizeText(body?.action).toLowerCase();
  const moduleKey = normalizeText(body?.module_key).toLowerCase();
  if (!ALLOWED_MODULES.has(moduleKey)) {
    return json({ ok: false, error: 'Unknown application module.' }, 400);
  }

  if (action === 'set_module_state') {
    const isEnabled = boolInt(body?.is_enabled);
    if (isEnabled == null) return json({ ok: false, error: 'is_enabled must be true/false or 1/0.' }, 400);

    const before = await db.prepare('SELECT module_key,is_enabled,background_activity_enabled FROM app_modules WHERE module_key=? LIMIT 1').bind(moduleKey).first();
    if (!before) return json({ ok: false, error: 'Application module record was not found.' }, 404);

    await db.prepare(`
      UPDATE app_modules
      SET is_enabled=?, updated_at=CURRENT_TIMESTAMP
      WHERE module_key=?
    `).bind(isEnabled, moduleKey).run();
    clearModuleConfigCache();

    await auditAdminAction(env, request, auth.admin, {
      action_type: 'application_module_state_changed',
      target_type: 'app_module',
      target_key: moduleKey,
      details: { before_is_enabled: Number(before.is_enabled || 0), after_is_enabled: isEnabled },
    });

    return json({ ok: true, build: BUILD, module_key: moduleKey, is_enabled: isEnabled });
  }

  if (action === 'set_background_activity') {
    const enabled = boolInt(body?.background_activity_enabled);
    if (enabled == null) return json({ ok: false, error: 'background_activity_enabled must be true/false or 1/0.' }, 400);

    const before = await db.prepare('SELECT module_key,is_enabled,background_activity_enabled FROM app_modules WHERE module_key=? LIMIT 1').bind(moduleKey).first();
    if (!before) return json({ ok: false, error: 'Application module record was not found.' }, 404);

    await db.prepare(`
      UPDATE app_modules
      SET background_activity_enabled=?, updated_at=CURRENT_TIMESTAMP
      WHERE module_key=?
    `).bind(enabled, moduleKey).run();
    clearModuleConfigCache();

    await auditAdminAction(env, request, auth.admin, {
      action_type: 'application_module_background_changed',
      target_type: 'app_module',
      target_key: moduleKey,
      details: { before_background_activity_enabled: Number(before.background_activity_enabled || 0), after_background_activity_enabled: enabled },
    });

    return json({ ok: true, build: BUILD, module_key: moduleKey, background_activity_enabled: enabled });
  }

  if (action === 'set_role_access') {
    const roleCode = normalizeText(body?.role_code).toLowerCase();
    const isAllowed = boolInt(body?.is_allowed);
    const accessLevel = normalizeText(body?.access_level).toLowerCase() || (isAllowed ? 'read' : 'none');
    if (!ALLOWED_ROLES.has(roleCode)) return json({ ok: false, error: 'role_code must be member or admin.' }, 400);
    if (isAllowed == null) return json({ ok: false, error: 'is_allowed must be true/false or 1/0.' }, 400);
    if (!ALLOWED_ACCESS_LEVELS.has(accessLevel)) return json({ ok: false, error: 'Unsupported access_level.' }, 400);

    const before = await db.prepare(`
      SELECT module_key,role_code,is_allowed,access_level
      FROM app_module_role_access
      WHERE module_key=? AND role_code=?
      LIMIT 1
    `).bind(moduleKey, roleCode).first();

    await db.prepare(`
      INSERT INTO app_module_role_access (
        module_key, role_code, is_allowed, access_level, created_at, updated_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(module_key, role_code) DO UPDATE SET
        is_allowed=excluded.is_allowed,
        access_level=excluded.access_level,
        updated_at=CURRENT_TIMESTAMP
    `).bind(moduleKey, roleCode, isAllowed, accessLevel).run();
    clearModuleConfigCache();

    await auditAdminAction(env, request, auth.admin, {
      action_type: 'application_module_role_access_changed',
      target_type: 'app_module_role_access',
      target_key: `${moduleKey}:${roleCode}`,
      details: {
        before: before || null,
        after: { module_key: moduleKey, role_code: roleCode, is_allowed: isAllowed, access_level: accessLevel },
      },
    });

    return json({ ok: true, build: BUILD, module_key: moduleKey, role_code: roleCode, is_allowed: isAllowed, access_level: accessLevel });
  }

  return json({ ok: false, error: 'Unsupported module-control action.' }, 400);
}
