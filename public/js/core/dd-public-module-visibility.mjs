// Devil n Dove Build 438 lightweight public/member module visibility.
// Presentation-only: server middleware remains the access boundary.
// Uses a short per-tab cache to avoid a module bootstrap request on every public navigation.

export const BUILD = 438;
const CACHE_TTL_MS = 30_000;
const CACHE_PREFIX = 'dd_module_visibility_v438:';
const CORE_RECOVERY_PREFIX = '/admin/application-modules';

const PREFIX_TO_MODULE = Object.freeze([
  ['/shop', 'commerce-operations'],
  ['/cart', 'commerce-operations'],
  ['/checkout', 'commerce-operations'],
  ['/product', 'commerce-operations'],
  ['/products', 'commerce-operations'],
  ['/custom-request', 'commerce-operations'],
  ['/members', 'commerce-operations'],
  ['/admin', 'business-administration'],
]);

function identityKey() {
  const user = globalThis.DDAuth?.getStoredUser?.() || null;
  const role = String(user?.role || 'anon').trim().toLowerCase() || 'anon';
  const userId = Number(user?.user_id || 0);
  return `${role}:${userId}`;
}

function cacheKey() {
  return `${CACHE_PREFIX}${identityKey()}`;
}

function readCache() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(cacheKey()) || 'null');
    if (!parsed || typeof parsed !== 'object' || !parsed.data) return null;
    if (Number(parsed.expires_at || 0) < Date.now()) return null;
    if (!Array.isArray(parsed.data.modules)) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(cacheKey(), JSON.stringify({ expires_at: Date.now() + CACHE_TTL_MS, data }));
  } catch {}
}

function moduleForHref(href) {
  try {
    const path = new URL(href, window.location.origin).pathname.replace(/\/+$/, '') || '/';
    if (path === CORE_RECOVERY_PREFIX || path.startsWith(`${CORE_RECOVERY_PREFIX}/`)) return null;
    const match = PREFIX_TO_MODULE.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`));
    return match?.[1] || null;
  } catch {
    return null;
  }
}

async function loadModules({ force = false } = {}) {
  if (!force) {
    const cached = readCache();
    if (cached) return { ...cached, _visibility_cache: 'session' };
  }
  const response = await fetch('/api/modules', { method: 'GET', credentials: 'same-origin', cache: 'no-store' });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok || !Array.isArray(data.modules)) throw new Error(data?.error || `Module bootstrap failed (${response.status}).`);
  writeCache(data);
  return { ...data, _visibility_cache: 'network' };
}

function apply(data) {
  const moduleMap = new Map(data.modules.map((module) => [module.module_key, module]));
  for (const link of document.querySelectorAll('a[href]')) {
    const moduleKey = moduleForHref(link.getAttribute('href'));
    if (!moduleKey) continue;
    const module = moduleMap.get(moduleKey);
    if (!module) continue;
    link.dataset.ddApplicationModuleTarget = moduleKey;
    link.dataset.ddApplicationModuleEnabled = Number(module.is_enabled || 0) === 1 ? '1' : '0';
    link.dataset.ddApplicationModuleAvailable = module.available === true ? '1' : '0';
    if (Number(module.is_enabled || 0) !== 1 || (moduleKey === 'business-administration' && module.available !== true)) {
      link.hidden = true;
      link.setAttribute('aria-hidden', 'true');
    }
  }
  document.documentElement.dataset.ddPublicModuleVisibilityBuild = String(BUILD);
  document.documentElement.dataset.ddPublicModuleVisibilitySource = data._visibility_cache || 'unknown';
  document.dispatchEvent(new CustomEvent('dd:public-module-visibility-ready', { detail: data }));
}

try {
  apply(await loadModules());
} catch (error) {
  // Presentation must fail open. Server middleware still enforces disabled modules.
  console.warn('[DD modules] public module visibility unavailable', error);
}
