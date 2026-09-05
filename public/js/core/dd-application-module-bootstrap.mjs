// Devil n Dove Release 467 Build 61 authoritative application-module bootstrap.
// One bounded read, no polling/timers. Server middleware remains the security boundary.
// Build 61 converges legacy domain-group classification onto the canonical five-module API.

import { createModuleRegistry } from './dd-module-registry.mjs';
import { DD_MODULE_DEFINITIONS } from './dd-module-definitions.mjs';
import { getApplicationModule } from './dd-application-module-groups.mjs';

export const BUILD = 61;

const registry = createModuleRegistry(DD_MODULE_DEFINITIONS);
const CLASSIFICATION_USER = Object.freeze({ role: 'admin' });
const FALLBACK_MODULES = Object.freeze([
  Object.freeze({ module_key: 'storefront', display_name: 'Storefront', is_enabled: 1, available: true, background_activity_enabled: 0, background_allowed: false }),
  Object.freeze({ module_key: 'creators', display_name: 'Creators', is_enabled: 1, available: true, background_activity_enabled: 0, background_allowed: false }),
  Object.freeze({ module_key: 'socials', display_name: 'Socials', is_enabled: 1, available: true, background_activity_enabled: 0, background_allowed: false }),
  Object.freeze({ module_key: 'financials', display_name: 'Financials', is_enabled: 1, available: true, background_activity_enabled: 0, background_allowed: false }),
  Object.freeze({ module_key: 'it-platform', display_name: 'I.T.', is_enabled: 1, available: true, background_activity_enabled: 0, background_allowed: false }),
]);

const CANONICAL_MODULE_BY_DOMAIN = Object.freeze({
  public: 'storefront',
  catalog: 'storefront',
  inventory: 'storefront',
  operations: 'storefront',
  creative: 'creators',
  packaging: 'creators',
  content: 'creators',
  caip: 'socials',
  marketing: 'socials',
  accounting: 'financials',
  platform: 'it-platform',
  admin: 'it-platform',
});

let snapshot = Object.freeze({
  build: BUILD,
  schema_ready: false,
  source: 'client_fallback',
  user: null,
  modules: FALLBACK_MODULES,
});

function normalizePath(pathname) {
  const raw = String(pathname || '/').split(/[?#]/, 1)[0] || '/';
  return raw === '/' ? '/' : `/${raw.replace(/^\/+|\/+$/g, '')}`;
}

function moduleByKey(moduleKey) {
  const key = String(moduleKey || '').trim().toLowerCase();
  return snapshot.modules.find((module) => module.module_key === key) || null;
}

function domainForPath(pathname) {
  return registry.resolve(normalizePath(pathname), CLASSIFICATION_USER);
}

function applicationModuleIdForPath(pathname) {
  const definition = domainForPath(pathname);
  if (!definition) return null;
  return CANONICAL_MODULE_BY_DOMAIN[String(definition.id || '').trim().toLowerCase()] || null;
}

function isEnabled(moduleKey) {
  const module = moduleByKey(moduleKey);
  return Boolean(module && Number(module.is_enabled || 0) === 1);
}

function isAvailable(moduleKey) {
  const module = moduleByKey(moduleKey);
  return Boolean(module && module.available === true);
}

function canBackground(moduleKey) {
  const module = moduleByKey(moduleKey);
  return Boolean(module && module.available === true && Number(module.background_activity_enabled || 0) === 1 && module.background_allowed === true);
}

function moduleForPath(pathname) {
  const moduleId = applicationModuleIdForPath(pathname);
  return moduleId ? moduleByKey(moduleId) : null;
}

function annotateAndFilterLinks(root = document) {
  if (!root?.querySelectorAll) return;
  for (const link of root.querySelectorAll('a[href]')) {
    let pathname = '';
    try { pathname = new URL(link.getAttribute('href'), window.location.origin).pathname; }
    catch { continue; }
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/members') && !pathname.startsWith('/shop') && !pathname.startsWith('/cart') && !pathname.startsWith('/checkout')) continue;
    if (pathname.startsWith('/admin/application-modules')) {
      link.dataset.ddApplicationModuleControl = 'core';
      continue;
    }
    const moduleId = applicationModuleIdForPath(pathname);
    if (!moduleId) continue;
    const module = moduleByKey(moduleId);
    link.dataset.ddApplicationModuleTarget = moduleId;
    link.dataset.ddApplicationModuleEnabled = module && Number(module.is_enabled || 0) === 1 ? '1' : '0';
    link.dataset.ddApplicationModuleAvailable = module?.available === true ? '1' : '0';
    if (module && Number(module.is_enabled || 0) !== 1) {
      link.hidden = true;
      link.setAttribute('aria-hidden', 'true');
    } else if (module && module.available !== true && pathname.startsWith('/admin')) {
      link.hidden = true;
      link.setAttribute('aria-hidden', 'true');
    }
  }
}

function injectAdminModuleControlCard() {
  if (window.location.pathname !== '/admin/' && window.location.pathname !== '/admin') return;
  const grid = document.querySelector('.department-grid');
  if (!grid || grid.querySelector('[data-dd-module-control-card]')) return;
  const enabled = snapshot.modules.filter((module) => Number(module.is_enabled || 0) === 1).length;
  const card = document.createElement('a');
  card.className = 'card department-card startup-highlight-card';
  card.href = '/admin/application-modules/';
  card.dataset.ddModuleControlCard = '1';
  card.innerHTML = `<h2>Application Modules</h2><p class="small">Enable or disable the five canonical application modules, review role access and control module-owned background activity. ${enabled}/${snapshot.modules.length} modules currently enabled.</p>`;
  grid.prepend(card);
}

function publish() {
  const api = Object.freeze({
    build: BUILD,
    getSnapshot: () => snapshot,
    list: () => snapshot.modules,
    get: moduleByKey,
    isEnabled,
    isAvailable,
    canBackground,
    moduleForPath,
    applicationModuleIdForPath,
    refresh: () => load({ force: true }),
    applyNavigation: () => annotateAndFilterLinks(document),
  });
  window.DDApplicationModules = api;
  document.documentElement.dataset.ddApplicationModulesBuild = String(BUILD);
  document.documentElement.dataset.ddApplicationModulesSource = snapshot.source || 'unknown';
  document.documentElement.dataset.ddApplicationModulesSchemaReady = snapshot.schema_ready ? '1' : '0';
  annotateAndFilterLinks(document);
  injectAdminModuleControlCard();
  document.dispatchEvent(new CustomEvent('dd:application-modules-ready', { detail: snapshot }));
  return api;
}

async function load({ force = false } = {}) {
  try {
    const response = await fetch(force ? '/api/modules?fresh=1' : '/api/modules', { method: 'GET', credentials: 'same-origin', cache: 'no-store' });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok || !Array.isArray(data.modules)) throw new Error(data?.error || `Module bootstrap failed (${response.status}).`);
    snapshot = Object.freeze({
      build: Number(data.build || BUILD),
      schema_ready: Boolean(data.schema_ready),
      source: String(data.source || 'server'),
      reason: data.reason || null,
      user: data.user || null,
      modules: Object.freeze(data.modules.map((module) => Object.freeze({ ...module }))),
    });
  } catch (error) {
    console.warn('[DD modules] authoritative availability bootstrap unavailable; retaining the last presentation snapshot', error);
    snapshot = Object.freeze({ ...snapshot, source: 'client_fallback' });
  }
  return publish();
}

if (document.readyState === 'loading') {
  await new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
}

await load();

// The legacy/domain runtime is imported only after authoritative canonical module
// availability has been established. Server middleware remains the direct-route gate.
const currentModuleId = applicationModuleIdForPath(window.location.pathname);
if (!currentModuleId || isAvailable(currentModuleId)) {
  await import('./dd-admin-module-runtime.mjs?v=438');
} else {
  document.documentElement.dataset.ddApplicationModule = currentModuleId;
  document.documentElement.dataset.ddApplicationModuleMode = 'disabled';
  console.warn(`[DD modules] runtime activation suppressed for unavailable module ${currentModuleId}`);
}

export function getApplicationModuleDefinition(moduleKey) {
  return getApplicationModule(moduleKey);
}
