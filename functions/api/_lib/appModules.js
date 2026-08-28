// Devil n Dove canonical shared application-module authority.
// Module configuration may be cached per isolate because it is not request-specific.
// Session identity and explicit per-user module grants are always resolved per request.

import { getDb, getRequestToken, normalizeText } from './adminAudit.js';
import { CURRENT_RELEASE } from './releaseAuthority.js';
import { canonicalModuleKey, MODULE_KEYS } from './appModuleRoutes.js';

export { canonicalModuleKey, MODULE_KEYS, moduleKeyForPath } from './appModuleRoutes.js';
export { CURRENT_RELEASE } from './releaseAuthority.js';

// Temporary source compatibility for code that still imports BUILD. It always resolves
// to the one current release and is not a historical release gate.
export const BUILD = CURRENT_RELEASE;
export const MODULE_CACHE_TTL_MS = 5_000;

const DEFAULT_MODULES = Object.freeze([
  Object.freeze({
    module_key: MODULE_KEYS.STOREFRONT,
    display_name: 'Storefront',
    description: 'Public storefront, catalog, products, collections, merchandising, inventory, orders, memberships and customer commerce.',
    is_enabled: 1,
    requires_login: 0,
    default_route: '/',
    load_priority: 10,
    background_activity_enabled: 0,
  }),
  Object.freeze({
    module_key: MODULE_KEYS.CREATORS,
    display_name: 'Creators',
    description: 'Creative Projects, CAIP, Packaging and Labeling, Content Studio, media evidence and reviewed maker workflows.',
    is_enabled: 1,
    requires_login: 1,
    default_route: '/admin/creative-automation/',
    load_priority: 20,
    background_activity_enabled: 0,
  }),
  Object.freeze({
    module_key: MODULE_KEYS.SOCIALS,
    display_name: 'Socials',
    description: 'Public social hub, publication packages, social-channel publishing, campaigns and publication evidence.',
    is_enabled: 1,
    requires_login: 0,
    default_route: '/socials/',
    load_priority: 30,
    background_activity_enabled: 0,
  }),
  Object.freeze({
    module_key: MODULE_KEYS.FINANCIALS,
    display_name: 'Financials',
    description: 'Accounting, costs, profitability, payment-provider operations, reconciliation, tax and financial reporting.',
    is_enabled: 1,
    requires_login: 1,
    default_route: '/admin/accounting/',
    load_priority: 40,
    background_activity_enabled: 0,
  }),
  Object.freeze({
    module_key: MODULE_KEYS.IT_PLATFORM,
    display_name: 'I.T.',
    description: 'Application modules, user access, API/provider configuration, D1/R2 readiness, diagnostics, recovery and release controls.',
    is_enabled: 1,
    requires_login: 1,
    default_route: '/admin/it-platform/',
    load_priority: 50,
    background_activity_enabled: 0,
  }),
]);

const DEFAULT_ROLE_ACCESS = Object.freeze([
  Object.freeze({ module_key: MODULE_KEYS.STOREFRONT, role_code: 'member', is_allowed: 1, access_level: 'member' }),
  Object.freeze({ module_key: MODULE_KEYS.STOREFRONT, role_code: 'admin', is_allowed: 1, access_level: 'manage' }),
  Object.freeze({ module_key: MODULE_KEYS.CREATORS, role_code: 'member', is_allowed: 0, access_level: 'none' }),
  Object.freeze({ module_key: MODULE_KEYS.CREATORS, role_code: 'admin', is_allowed: 1, access_level: 'manage' }),
  Object.freeze({ module_key: MODULE_KEYS.SOCIALS, role_code: 'member', is_allowed: 1, access_level: 'read' }),
  Object.freeze({ module_key: MODULE_KEYS.SOCIALS, role_code: 'admin', is_allowed: 1, access_level: 'manage' }),
  Object.freeze({ module_key: MODULE_KEYS.FINANCIALS, role_code: 'member', is_allowed: 0, access_level: 'none' }),
  Object.freeze({ module_key: MODULE_KEYS.FINANCIALS, role_code: 'admin', is_allowed: 1, access_level: 'manage' }),
  // I.T. is deliberately explicit-user only; role membership alone never grants access.
  Object.freeze({ module_key: MODULE_KEYS.IT_PLATFORM, role_code: 'member', is_allowed: 0, access_level: 'none' }),
  Object.freeze({ module_key: MODULE_KEYS.IT_PLATFORM, role_code: 'admin', is_allowed: 0, access_level: 'none' }),
]);

const DEFAULT_BY_KEY = new Map(DEFAULT_MODULES.map((row) => [row.module_key, row]));
let moduleConfigCache = null;
let moduleConfigExpiresAt = 0;

function cloneRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({ ...row }));
}

function normalizedKey(value) {
  return canonicalModuleKey(normalizeText(value).toLowerCase());
}

function normalizeModuleRow(row) {
  const storageKey = normalizeText(row?.module_key).toLowerCase();
  return {
    module_key: normalizedKey(storageKey),
    storage_module_key: storageKey || null,
    display_name: normalizeText(row?.display_name),
    description: normalizeText(row?.description),
    is_enabled: Number(row?.is_enabled || 0) === 1 ? 1 : 0,
    requires_login: Number(row?.requires_login || 0) === 1 ? 1 : 0,
    default_route: normalizeText(row?.default_route) || '/',
    load_priority: Number(row?.load_priority || 100),
    background_activity_enabled: Number(row?.background_activity_enabled || 0) === 1 ? 1 : 0,
    created_at: row?.created_at || null,
    updated_at: row?.updated_at || null,
  };
}

function mergeModuleRows(rows) {
  const byKey = new Map();
  for (const raw of Array.isArray(rows) ? rows : []) {
    const row = normalizeModuleRow(raw);
    if (!DEFAULT_BY_KEY.has(row.module_key)) continue;
    const existing = byKey.get(row.module_key);
    const rowIsCanonicalStorage = row.storage_module_key === row.module_key;
    const existingIsCanonicalStorage = existing?.storage_module_key === existing?.module_key;
    if (!existing || rowIsCanonicalStorage || !existingIsCanonicalStorage) byKey.set(row.module_key, row);
  }
  for (const fallback of DEFAULT_MODULES) {
    if (!byKey.has(fallback.module_key)) {
      byKey.set(fallback.module_key, { ...fallback, storage_module_key: null, created_at: null, updated_at: null });
    }
  }
  return [...byKey.values()].sort((a, b) => Number(a.load_priority || 100) - Number(b.load_priority || 100));
}

function normalizeRoleRow(row) {
  return {
    module_key: normalizedKey(row?.module_key),
    role_code: normalizeText(row?.role_code).toLowerCase(),
    is_allowed: Number(row?.is_allowed || 0) === 1 ? 1 : 0,
    access_level: normalizeText(row?.access_level) || 'none',
  };
}

function mergeRoleRows(rows) {
  const byKey = new Map();
  for (const raw of Array.isArray(rows) ? rows : []) {
    const row = normalizeRoleRow(raw);
    const key = `${row.module_key}:${row.role_code}`;
    if (!row.module_key || !row.role_code) continue;
    const rawModuleKey = normalizeText(raw?.module_key).toLowerCase();
    const rowIsCanonicalStorage = rawModuleKey === row.module_key;
    const existing = byKey.get(key);
    const existingIsCanonicalStorage = existing?._canonical_storage === true;
    if (!existing || rowIsCanonicalStorage || !existingIsCanonicalStorage) {
      byKey.set(key, { ...row, _canonical_storage: rowIsCanonicalStorage });
    }
  }
  for (const fallback of DEFAULT_ROLE_ACCESS) {
    const key = `${fallback.module_key}:${fallback.role_code}`;
    if (!byKey.has(key)) byKey.set(key, { ...fallback, _canonical_storage: false });
  }
  return [...byKey.values()].map(({ _canonical_storage, ...row }) => row);
}

function canonicalMigrationRequired(moduleRows, roleRows) {
  const rawModuleKeys = new Set((moduleRows || []).map((row) => normalizeText(row?.module_key).toLowerCase()).filter(Boolean));
  const rawRoleKeys = new Set((roleRows || []).map((row) => normalizeText(row?.module_key).toLowerCase()).filter(Boolean));
  const canonicalKeys = Object.values(MODULE_KEYS);
  const missingCanonical = canonicalKeys.some((key) => !rawModuleKeys.has(key) || !rawRoleKeys.has(key));
  const legacyPresent = [...rawModuleKeys, ...rawRoleKeys].some((key) => normalizedKey(key) !== key);
  return missingCanonical || legacyPresent;
}

function compatibilityConfig(reason = 'schema_not_ready') {
  return {
    schema_ready: false,
    migration_required: true,
    source: 'platform_defaults',
    reason,
    modules: cloneRows(DEFAULT_MODULES).map((row) => ({ ...row, storage_module_key: null })),
    role_access: cloneRows(DEFAULT_ROLE_ACCESS),
  };
}

function failClosedConfig(reason = 'module_config_read_failed') {
  return {
    schema_ready: false,
    migration_required: true,
    source: 'fail_closed',
    reason,
    modules: cloneRows(DEFAULT_MODULES).map((module) => ({ ...module, storage_module_key: null, is_enabled: 0, background_activity_enabled: 0 })),
    role_access: cloneRows(DEFAULT_ROLE_ACCESS),
  };
}

export function clearModuleConfigCache() {
  moduleConfigCache = null;
  moduleConfigExpiresAt = 0;
}

export async function readModuleConfig(env, { force = false } = {}) {
  if (!force && moduleConfigCache && Date.now() < moduleConfigExpiresAt) return moduleConfigCache;

  const db = getDb(env);
  if (!db) {
    const config = failClosedConfig('database_binding_missing');
    moduleConfigCache = config;
    moduleConfigExpiresAt = Date.now() + MODULE_CACHE_TTL_MS;
    return config;
  }

  const priorConfig = moduleConfigCache;
  try {
    const [moduleResult, roleResult] = await Promise.all([
      db.prepare(`
        SELECT module_key, display_name, description, is_enabled, requires_login,
               default_route, load_priority, background_activity_enabled,
               created_at, updated_at
        FROM app_modules
        ORDER BY load_priority ASC, module_key ASC
      `).all(),
      db.prepare(`
        SELECT module_key, role_code, is_allowed, access_level
        FROM app_module_role_access
        ORDER BY module_key ASC, role_code ASC
      `).all(),
    ]);

    const rawModules = moduleResult?.results || [];
    const rawRoles = roleResult?.results || [];
    if (!rawModules.length) throw new Error('app_modules is empty');
    const migrationRequired = canonicalMigrationRequired(rawModules, rawRoles);
    const config = {
      schema_ready: true,
      migration_required: migrationRequired,
      source: migrationRequired ? 'd1_compatibility' : 'd1',
      reason: migrationRequired ? 'canonical_module_registry_migration_required' : null,
      modules: mergeModuleRows(rawModules),
      role_access: mergeRoleRows(rawRoles),
    };
    moduleConfigCache = config;
    moduleConfigExpiresAt = Date.now() + MODULE_CACHE_TTL_MS;
    return config;
  } catch (error) {
    const message = normalizeText(error?.message).toLowerCase();
    const missingSchema = message.includes('no such table') || message.includes('app_modules') || message.includes('app_module_role_access');
    if (missingSchema) {
      const config = compatibilityConfig('schema_not_ready');
      moduleConfigCache = config;
      moduleConfigExpiresAt = Date.now() + MODULE_CACHE_TTL_MS;
      return config;
    }
    if (priorConfig?.modules?.length) {
      const stale = { ...priorConfig, source: `${priorConfig.source || 'd1'}_stale`, reason: 'module_config_read_failed_using_last_known' };
      moduleConfigCache = stale;
      moduleConfigExpiresAt = Date.now() + MODULE_CACHE_TTL_MS;
      return stale;
    }
    const config = failClosedConfig('module_config_read_failed');
    moduleConfigCache = config;
    moduleConfigExpiresAt = Date.now() + MODULE_CACHE_TTL_MS;
    return config;
  }
}

export async function readUserModuleAccess(env, userId, { strict = false } = {}) {
  const db = getDb(env);
  if (!db || !Number(userId || 0)) return [];
  try {
    const result = await db.prepare(`
      SELECT module_key, user_id, is_allowed, access_level
      FROM app_module_user_access
      WHERE user_id=?
      ORDER BY module_key ASC
    `).bind(Number(userId)).all();
    return (result?.results || []).map((row) => ({
      module_key: normalizedKey(row?.module_key),
      user_id: Number(row?.user_id || userId),
      is_allowed: Number(row?.is_allowed || 0) === 1 ? 1 : 0,
      access_level: normalizeText(row?.access_level) || 'none',
    }));
  } catch (error) {
    const message = normalizeText(error?.message).toLowerCase();
    if (message.includes('no such table') || message.includes('app_module_user_access')) return [];
    if (strict) throw error;
    return [];
  }
}

export async function readSessionUser(request, env) {
  const db = getDb(env);
  const token = getRequestToken(request);
  if (!db || !token) return null;
  try {
    const row = await db.prepare(`
      SELECT s.session_id, s.expires_at,
             u.user_id, u.email, u.display_name, u.role, u.is_active
      FROM sessions s
      INNER JOIN users u ON u.user_id = s.user_id
      WHERE (s.session_token = ? OR s.token = ?)
        AND s.expires_at > datetime('now')
      LIMIT 1
    `).bind(token, token).first();
    if (!row || Number(row.is_active || 0) !== 1) return null;
    return {
      user_id: Number(row.user_id || 0),
      email: row.email || '',
      display_name: row.display_name || '',
      role: normalizeText(row.role).toLowerCase() || 'member',
      is_active: 1,
      session_id: Number(row.session_id || 0),
      expires_at: row.expires_at || null,
      module_access: await readUserModuleAccess(env, row.user_id),
    };
  } catch {
    return null;
  }
}

function roleAccessFor(config, moduleKey, role) {
  const key = normalizedKey(moduleKey);
  const roleCode = normalizeText(role).toLowerCase();
  return (config?.role_access || []).find((row) => row.module_key === key && row.role_code === roleCode) || null;
}

function explicitUserAccessFor(user, moduleKey) {
  const key = normalizedKey(moduleKey);
  return (user?.module_access || []).find((row) => row.module_key === key) || null;
}

export function moduleByKey(config, moduleKey) {
  const key = normalizedKey(moduleKey);
  return (config?.modules || []).find((row) => row.module_key === key) || null;
}

export function evaluateModuleAccess(config, moduleKey, user = null) {
  const module = moduleByKey(config, moduleKey);
  if (!module) return { allowed: false, reason: 'unknown_module', module: null, access_level: 'none' };
  if (Number(module.is_enabled || 0) !== 1) return { allowed: false, reason: 'module_disabled', module, access_level: 'none' };

  if (!user) {
    if (Number(module.requires_login || 0) === 1) return { allowed: false, reason: 'login_required', module, access_level: 'none' };
    return { allowed: true, reason: 'public', module, access_level: 'public' };
  }

  const explicit = explicitUserAccessFor(user, module.module_key);
  if (explicit) {
    const allowed = Number(explicit.is_allowed || 0) === 1 && normalizeText(explicit.access_level).toLowerCase() !== 'none';
    return {
      allowed,
      reason: allowed ? 'explicit_user_grant' : 'explicit_user_denial',
      module,
      access_level: allowed ? (explicit.access_level || 'read') : 'none',
    };
  }

  if (module.module_key === MODULE_KEYS.IT_PLATFORM) {
    return { allowed: false, reason: 'explicit_user_grant_required', module, access_level: 'none' };
  }

  const access = roleAccessFor(config, module.module_key, user.role);
  if (!access || Number(access.is_allowed || 0) !== 1) {
    return { allowed: false, reason: 'role_denied', module, access_level: 'none' };
  }
  return { allowed: true, reason: 'role_allowed', module, access_level: access.access_level || 'read' };
}

export async function moduleAccessForRequest(request, env, moduleKey, options = {}) {
  const config = await readModuleConfig(env, options);
  const user = options.user === undefined ? await readSessionUser(request, env) : options.user;
  return { config, user, ...evaluateModuleAccess(config, moduleKey, user) };
}

export async function availableModulesForRequest(request, env, options = {}) {
  const config = await readModuleConfig(env, options);
  const user = options.user === undefined ? await readSessionUser(request, env) : options.user;
  const modules = (config.modules || []).map((module) => {
    const access = evaluateModuleAccess(config, module.module_key, user);
    return {
      ...module,
      available: access.allowed,
      availability_reason: access.reason,
      access_level: access.access_level,
      background_allowed: access.allowed && Number(module.background_activity_enabled || 0) === 1,
    };
  });
  return { config, user, modules };
}

function mutationLevelAllowed(accessLevel) {
  return normalizeText(accessLevel).toLowerCase() === 'manage';
}

export async function sharedServiceAccessForRequest(request, env, contract, options = {}) {
  const config = await readModuleConfig(env, options);
  const user = options.user === undefined ? await readSessionUser(request, env) : options.user;
  const consumers = Array.isArray(contract?.consumer_module_keys) ? contract.consumer_module_keys : [];
  const requireManage = Boolean(contract?.mutation);
  const consumerAccess = consumers.map((moduleKey) => {
    const access = evaluateModuleAccess(config, moduleKey, user);
    return {
      module_key: moduleKey,
      allowed: access.allowed,
      reason: access.reason,
      access_level: access.access_level,
      qualifies: access.allowed && (!requireManage || mutationLevelAllowed(access.access_level)),
    };
  });
  const qualifying = consumerAccess.find((row) => row.qualifies) || null;
  return {
    allowed: Boolean(qualifying),
    reason: qualifying ? 'enabled_consumer' : (requireManage ? 'no_manage_consumer' : 'no_enabled_consumer'),
    config,
    user,
    contract,
    consumer_access: consumerAccess,
    qualifying_consumer: qualifying,
  };
}

export function sharedServiceUnavailableResponse(access) {
  const contract = access?.contract || null;
  return new Response(JSON.stringify({
    ok: false,
    error: contract?.mutation
      ? 'No enabled application module with manage access is available to consume this shared service.'
      : 'No enabled application module is available to consume this shared service.',
    code: access?.reason === 'no_manage_consumer'
      ? 'shared_service_manage_consumer_required'
      : 'shared_service_no_enabled_consumer',
    contract_path: contract?.path || null,
    owner_module_key: contract?.owner_module_key || null,
    consumer_module_keys: contract?.consumer_module_keys || [],
    release: CURRENT_RELEASE,
  }), {
    status: 403,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

export function moduleUnavailableResponse(moduleAccess, { api = false } = {}) {
  const module = moduleAccess?.module || null;
  const reason = moduleAccess?.reason || 'module_unavailable';
  const status = reason === 'login_required' ? 401 : 403;
  if (api) {
    return new Response(JSON.stringify({
      ok: false,
      error: reason === 'module_disabled' ? 'This application module is currently disabled.' : 'Module access denied.',
      code: `module_${reason}`,
      module_key: module?.module_key || null,
      module_name: module?.display_name || null,
      release: CURRENT_RELEASE,
    }), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    });
  }

  const title = module?.display_name || 'Application module';
  const message = reason === 'module_disabled'
    ? `${title} is currently disabled.`
    : reason === 'login_required'
      ? `Sign in to access ${title}.`
      : `Your account does not have access to ${title}.`;
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title} unavailable — Devil n Dove</title><link rel="stylesheet" href="/css/styles.css"></head><body><main class="container"><section class="card" style="margin-top:32px"><h1>${title} unavailable</h1><p>${message}</p><p><a class="btn" href="/">Return home</a></p></section></main></body></html>`, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });
}
