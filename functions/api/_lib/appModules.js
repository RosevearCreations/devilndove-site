// Devil n Dove Build 438 shared application-module authority.
// Module configuration may be cached per isolate because it is not request-specific.
// Session/user identity is always resolved per request.

import { getDb, getRequestToken, normalizeText } from './adminAudit.js';

export const BUILD = 438;
export const MODULE_CACHE_TTL_MS = 30_000;

export const MODULE_KEYS = Object.freeze({
  COMMERCE_OPERATIONS: 'commerce-operations',
  CREATIVE_PRODUCTION: 'creative-production',
  BUSINESS_ADMINISTRATION: 'business-administration',
});

const DEFAULT_MODULES = Object.freeze([
  Object.freeze({
    module_key: MODULE_KEYS.COMMERCE_OPERATIONS,
    display_name: 'Commerce & Operations',
    description: 'Customer/storefront, catalog, inventory, orders, memberships, fulfillment and day-to-day customer operations.',
    is_enabled: 1,
    requires_login: 0,
    default_route: '/',
    load_priority: 10,
    background_activity_enabled: 0,
  }),
  Object.freeze({
    module_key: MODULE_KEYS.CREATIVE_PRODUCTION,
    display_name: 'Creative & Production',
    description: 'Creative Process, CAIP, Packaging & Labeling, Content Studio and reviewed production workflows.',
    is_enabled: 1,
    requires_login: 1,
    default_route: '/admin/creative-automation/',
    load_priority: 20,
    background_activity_enabled: 0,
  }),
  Object.freeze({
    module_key: MODULE_KEYS.BUSINESS_ADMINISTRATION,
    display_name: 'Business & Administration',
    description: 'Accounting, marketing, analytics, administration, platform/release tooling and business controls.',
    is_enabled: 1,
    requires_login: 1,
    default_route: '/admin/',
    load_priority: 30,
    background_activity_enabled: 0,
  }),
]);

const DEFAULT_ROLE_ACCESS = Object.freeze([
  Object.freeze({ module_key: MODULE_KEYS.COMMERCE_OPERATIONS, role_code: 'member', is_allowed: 1, access_level: 'member' }),
  Object.freeze({ module_key: MODULE_KEYS.COMMERCE_OPERATIONS, role_code: 'admin', is_allowed: 1, access_level: 'manage' }),
  Object.freeze({ module_key: MODULE_KEYS.CREATIVE_PRODUCTION, role_code: 'member', is_allowed: 0, access_level: 'none' }),
  Object.freeze({ module_key: MODULE_KEYS.CREATIVE_PRODUCTION, role_code: 'admin', is_allowed: 1, access_level: 'manage' }),
  Object.freeze({ module_key: MODULE_KEYS.BUSINESS_ADMINISTRATION, role_code: 'member', is_allowed: 0, access_level: 'none' }),
  Object.freeze({ module_key: MODULE_KEYS.BUSINESS_ADMINISTRATION, role_code: 'admin', is_allowed: 1, access_level: 'manage' }),
]);

let moduleConfigCache = null;
let moduleConfigExpiresAt = 0;

function cloneRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({ ...row }));
}

function normalizeModuleRow(row) {
  return {
    module_key: normalizeText(row?.module_key).toLowerCase(),
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

function normalizeRoleRow(row) {
  return {
    module_key: normalizeText(row?.module_key).toLowerCase(),
    role_code: normalizeText(row?.role_code).toLowerCase(),
    is_allowed: Number(row?.is_allowed || 0) === 1 ? 1 : 0,
    access_level: normalizeText(row?.access_level) || 'read',
  };
}

function fallbackConfig(reason = 'schema_not_ready') {
  return {
    schema_ready: false,
    source: 'build438_defaults',
    reason,
    modules: cloneRows(DEFAULT_MODULES),
    role_access: cloneRows(DEFAULT_ROLE_ACCESS),
  };
}

export function clearModuleConfigCache() {
  moduleConfigCache = null;
  moduleConfigExpiresAt = 0;
}

export async function readModuleConfig(env, { force = false } = {}) {
  if (!force && moduleConfigCache && Date.now() < moduleConfigExpiresAt) {
    return moduleConfigCache;
  }

  const db = getDb(env);
  if (!db) {
    const config = fallbackConfig('database_binding_missing');
    moduleConfigCache = config;
    moduleConfigExpiresAt = Date.now() + MODULE_CACHE_TTL_MS;
    return config;
  }

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

    const modules = (moduleResult?.results || []).map(normalizeModuleRow);
    const roleAccess = (roleResult?.results || []).map(normalizeRoleRow);
    if (!modules.length) throw new Error('app_modules is empty');

    const config = {
      schema_ready: true,
      source: 'd1',
      reason: null,
      modules,
      role_access: roleAccess,
    };
    moduleConfigCache = config;
    moduleConfigExpiresAt = Date.now() + MODULE_CACHE_TTL_MS;
    return config;
  } catch (error) {
    const message = normalizeText(error?.message).toLowerCase();
    const missingSchema = message.includes('no such table') || message.includes('app_modules') || message.includes('app_module_role_access');
    const config = fallbackConfig(missingSchema ? 'schema_not_ready' : 'module_config_read_failed');
    moduleConfigCache = config;
    moduleConfigExpiresAt = Date.now() + Math.min(MODULE_CACHE_TTL_MS, 10_000);
    return config;
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
    };
  } catch {
    return null;
  }
}

function roleAccessFor(config, moduleKey, role) {
  const key = normalizeText(moduleKey).toLowerCase();
  const roleCode = normalizeText(role).toLowerCase();
  return (config?.role_access || []).find((row) => row.module_key === key && row.role_code === roleCode) || null;
}

export function moduleByKey(config, moduleKey) {
  const key = normalizeText(moduleKey).toLowerCase();
  return (config?.modules || []).find((row) => row.module_key === key) || null;
}

export function evaluateModuleAccess(config, moduleKey, user = null) {
  const module = moduleByKey(config, moduleKey);
  if (!module) {
    return { allowed: false, reason: 'unknown_module', module: null, access_level: 'none' };
  }
  if (Number(module.is_enabled || 0) !== 1) {
    return { allowed: false, reason: 'module_disabled', module, access_level: 'none' };
  }

  if (!user) {
    if (Number(module.requires_login || 0) === 1) {
      return { allowed: false, reason: 'login_required', module, access_level: 'none' };
    }
    return { allowed: true, reason: 'public', module, access_level: 'public' };
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

const CREATIVE_ROUTE_PREFIXES = Object.freeze([
  '/admin/packaging-studio',
  '/admin/creative-project',
  '/admin/creative-process',
  '/admin/creative-automation',
  '/admin/creative-assets',
  '/admin/caip',
  '/admin/content-studio',
]);

const CORE_ADMIN_ROUTE_PREFIXES = Object.freeze([
  '/admin/application-modules',
]);

const COMMERCE_ROUTE_PREFIXES = Object.freeze([
  '/shop', '/cart', '/checkout', '/product', '/products', '/custom-request', '/members',
]);

const COMMERCE_API_PREFIXES = Object.freeze([
  '/api/member/', '/api/cart', '/api/checkout', '/api/products', '/api/product', '/api/custom-request',
]);

const CREATIVE_API_PREFIXES = Object.freeze([
  '/api/admin/packaging', '/api/admin/creative', '/api/admin/caip', '/api/admin/content-studio',
]);

export function moduleKeyForPath(pathname) {
  const path = `/${String(pathname || '').split(/[?#]/, 1)[0].replace(/^\/+/, '')}`.replace(/\/{2,}/g, '/');
  if (CORE_ADMIN_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return null;
  if (path === '/admin' || path.startsWith('/admin/')) {
    if (CREATIVE_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
      return MODULE_KEYS.CREATIVE_PRODUCTION;
    }
    return MODULE_KEYS.BUSINESS_ADMINISTRATION;
  }
  if (CREATIVE_API_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix))) {
    return MODULE_KEYS.CREATIVE_PRODUCTION;
  }
  if (path.startsWith('/api/admin/')) {
    if (path === '/api/admin/app-modules' || path.startsWith('/api/admin/app-modules/')) return null;
    return MODULE_KEYS.BUSINESS_ADMINISTRATION;
  }
  if (COMMERCE_API_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix))) {
    return MODULE_KEYS.COMMERCE_OPERATIONS;
  }
  if (COMMERCE_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return MODULE_KEYS.COMMERCE_OPERATIONS;
  }
  return null;
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
      build: BUILD,
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
