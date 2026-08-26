// Devil n Dove Build 438 lightweight public/member module visibility.
// Presentation-only: server middleware remains the access boundary.

export const BUILD = 438;

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

function moduleForHref(href) {
  try {
    const path = new URL(href, window.location.origin).pathname.replace(/\/+$/, '') || '/';
    const match = PREFIX_TO_MODULE.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`));
    return match?.[1] || null;
  } catch {
    return null;
  }
}

async function loadModules() {
  const response = await fetch('/api/modules', { method: 'GET', credentials: 'same-origin', cache: 'no-store' });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok || !Array.isArray(data.modules)) throw new Error(data?.error || `Module bootstrap failed (${response.status}).`);
  return data;
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
  document.dispatchEvent(new CustomEvent('dd:public-module-visibility-ready', { detail: data }));
}

try {
  apply(await loadModules());
} catch (error) {
  // Presentation must fail open. Server middleware still enforces disabled modules.
  console.warn('[DD modules] public module visibility unavailable', error);
}
