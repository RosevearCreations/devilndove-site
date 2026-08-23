// Devil n Dove Build 282 Admin module resolver in compatibility/shadow mode.
// It classifies routes and annotates links only. It never loads or activates a
// business module, performs no fetch, starts no timer, and changes no navigation.

import { createModuleRegistry } from './dd-module-registry.mjs';
import { DD_MODULE_DEFINITIONS } from './dd-module-definitions.mjs';
import { validateModuleContracts } from './dd-module-contracts.mjs';

const registry = createModuleRegistry(DD_MODULE_DEFINITIONS);
const contractValidation = validateModuleContracts(DD_MODULE_DEFINITIONS);
const CLASSIFICATION_USER = Object.freeze({ role: 'admin' });
let currentResolution = null;

function classifyPath(pathname) {
  return registry.resolve(pathname, CLASSIFICATION_USER);
}

function authenticatedAdmin(user) {
  return Boolean(user && String(user.role || '').toLowerCase() === 'admin');
}

function annotateAdminLinks(root = document) {
  if (!root?.querySelectorAll) return;
  for (const link of root.querySelectorAll('a[href^="/admin"]')) {
    try {
      const url = new URL(link.getAttribute('href'), window.location.origin);
      const definition = classifyPath(url.pathname);
      link.dataset.ddModuleTarget = definition?.id || 'legacy-review';
    } catch {
      link.dataset.ddModuleTarget = 'legacy-review';
    }
  }
}

function publishResolution(user) {
  if (!authenticatedAdmin(user)) return null;
  const definition = registry.resolve(window.location.pathname, user);
  currentResolution = definition || null;
  document.documentElement.dataset.ddModule = definition?.id || 'legacy-review';
  document.documentElement.dataset.ddModuleMode = 'shadow';
  annotateAdminLinks(document);
  document.dispatchEvent(new CustomEvent('dd:module-resolved', {
    detail: Object.freeze({
      mode: 'shadow',
      moduleId: definition?.id || null,
      moduleLabel: definition?.label || null,
      pathname: window.location.pathname,
      contractsOk: contractValidation.ok,
    }),
  }));
  return definition;
}

function bootstrap() {
  annotateAdminLinks(document);
  const cached = window.DDAuth?.getStoredUser?.();
  if (authenticatedAdmin(cached) && window.DDAuth?.isLoggedIn?.()) {
    publishResolution(cached);
  } else {
    document.documentElement.dataset.ddModuleMode = 'shadow-unverified';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}

document.addEventListener('dd:admin-ready', (event) => {
  const detail = event?.detail || {};
  if (detail.ok && authenticatedAdmin(detail.user)) publishResolution(detail.user);
});

document.addEventListener('dd:auth-rejected', () => {
  currentResolution = null;
  document.documentElement.dataset.ddModule = 'unverified';
  document.documentElement.dataset.ddModuleMode = 'shadow-unverified';
});

if (!contractValidation.ok) {
  console.warn('[DD modules] contract catalog validation failed', [...contractValidation.errors]);
}

window.DDModuleShadow = Object.freeze({
  mode: 'shadow',
  registry,
  definitions: registry.list(),
  contractValidation,
  classifyPath,
  resolveForUser: (pathname, user) => registry.resolve(pathname, user),
  getCurrent: () => currentResolution,
  annotateAdminLinks: () => annotateAdminLinks(document),
});
