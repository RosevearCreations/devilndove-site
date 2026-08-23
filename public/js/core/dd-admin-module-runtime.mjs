// Devil n Dove Build 288 Admin module runtime bridge.
// Packaging remains the only actively loadable module. Its Build 288 runtime retires
// the legacy broad GET from the active path while preserving narrow contract reads,
// the Build 287 artwork picker and the mature Packaging POST/write path.

import { MODULE_STATES, createModuleRegistry } from './dd-module-registry.mjs';
import { DD_MODULE_DEFINITIONS } from './dd-module-definitions.mjs';
import { validateModuleContracts } from './dd-module-contracts.mjs';
import { registerDefaultModuleServices } from './dd-module-service-adapters.mjs';

const registry = createModuleRegistry(DD_MODULE_DEFINITIONS);
const contractValidation = validateModuleContracts(DD_MODULE_DEFINITIONS);
const serviceRegistration = registerDefaultModuleServices(registry);
const CLASSIFICATION_USER = Object.freeze({ role: 'admin' });

let currentResolution = null;
let activeModuleId = null;
let verifiedAdmin = null;

function classifyPath(pathname) {
  return registry.resolve(pathname, CLASSIFICATION_USER);
}

function authenticatedAdmin(user) {
  return Boolean(user && String(user.role || '').toLowerCase() === 'admin');
}

function missingRuntimeServices(definition) {
  return (definition?.consumes || []).filter((contractId) => !registry.service(contractId));
}

function annotateAdminLinks(root = document) {
  if (!root?.querySelectorAll) return;
  for (const link of root.querySelectorAll('a[href^="/admin"]')) {
    try {
      const url = new URL(link.getAttribute('href'), window.location.origin);
      const definition = classifyPath(url.pathname);
      link.dataset.ddModuleTarget = definition?.id || 'legacy-review';
      link.dataset.ddModuleActivation = definition?.entry ? 'runtime' : 'shadow';
    } catch {
      link.dataset.ddModuleTarget = 'legacy-review';
      link.dataset.ddModuleActivation = 'shadow';
    }
  }
}

function setResolution(definition, mode) {
  currentResolution = definition || null;
  document.documentElement.dataset.ddModule = definition?.id || 'legacy-review';
  document.documentElement.dataset.ddModuleMode = mode;
}

function dispatchResolution(definition, mode, extra = {}) {
  document.dispatchEvent(new CustomEvent('dd:module-resolved', {
    detail: Object.freeze({
      mode,
      moduleId: definition?.id || null,
      moduleLabel: definition?.label || null,
      pathname: window.location.pathname,
      contractsOk: contractValidation.ok,
      servicesOk: serviceRegistration.ok,
      runtimeEntry: definition?.entry || null,
      state: definition ? registry.state(definition.id) : null,
      ...extra,
    }),
  }));
}

async function deactivateActive(reason = 'route-lifecycle') {
  if (!activeModuleId) return false;
  const id = activeModuleId;
  activeModuleId = null;
  try {
    return await registry.deactivate(id, { reason, pathname: window.location.pathname, user: verifiedAdmin });
  } catch (error) {
    console.warn(`[DD modules] failed to deactivate ${id}`, error);
    return false;
  }
}

async function resolveVerifiedAdmin(user) {
  if (!authenticatedAdmin(user)) return null;
  verifiedAdmin = user;
  annotateAdminLinks(document);

  const definition = registry.resolve(window.location.pathname, user);
  if (!definition) {
    await deactivateActive('unresolved-route');
    setResolution(null, 'shadow');
    dispatchResolution(null, 'shadow');
    return null;
  }

  if (activeModuleId && activeModuleId !== definition.id) {
    await deactivateActive('module-change');
  }

  if (!definition.entry) {
    setResolution(definition, 'shadow');
    dispatchResolution(definition, 'shadow');
    return definition;
  }

  if (!contractValidation.ok) {
    setResolution(definition, 'activation-blocked-contracts');
    dispatchResolution(definition, 'activation-blocked-contracts');
    return definition;
  }

  const missingServices = missingRuntimeServices(definition);
  if (missingServices.length) {
    setResolution(definition, 'activation-blocked-services');
    dispatchResolution(definition, 'activation-blocked-services', { missingServices: Object.freeze([...missingServices]) });
    return definition;
  }

  if (activeModuleId !== definition.id || registry.state(definition.id) !== MODULE_STATES.ACTIVE) {
    await registry.activate(definition.id, {
      user,
      pathname: window.location.pathname,
      mode: 'runtime',
      verified: true,
    });
    activeModuleId = definition.id;
  }

  setResolution(definition, 'active');
  dispatchResolution(definition, 'active');
  return definition;
}

function bootstrap() {
  annotateAdminLinks(document);
  const definition = classifyPath(window.location.pathname);
  setResolution(definition, definition?.entry ? 'activation-pending' : 'shadow-unverified');
  dispatchResolution(definition, document.documentElement.dataset.ddModuleMode);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}

document.addEventListener('dd:admin-ready', (event) => {
  const detail = event?.detail || {};
  if (!detail.ok || !authenticatedAdmin(detail.user)) return;

  if (detail.verified === true) {
    void resolveVerifiedAdmin(detail.user).catch((error) => {
      console.warn('[DD modules] verified module activation failed', error);
      document.documentElement.dataset.ddModuleMode = 'activation-failed';
    });
    return;
  }

  // Cached/degraded identity may classify the route but cannot start a module.
  if (!activeModuleId) {
    const definition = registry.resolve(window.location.pathname, detail.user);
    setResolution(definition, detail.degraded ? 'shadow-degraded' : 'activation-pending');
    dispatchResolution(definition, document.documentElement.dataset.ddModuleMode);
  } else if (detail.degraded) {
    document.documentElement.dataset.ddModuleMode = 'active-degraded';
  }
});

document.addEventListener('dd:auth-rejected', () => {
  verifiedAdmin = null;
  void deactivateActive('auth-rejected').finally(() => {
    currentResolution = null;
    document.documentElement.dataset.ddModule = 'unverified';
    document.documentElement.dataset.ddModuleMode = 'shadow-unverified';
  });
});

window.addEventListener('pagehide', () => {
  void deactivateActive('pagehide');
}, { once: true });

if (!contractValidation.ok) {
  console.warn('[DD modules] contract catalog validation failed', [...contractValidation.errors]);
}
if (!serviceRegistration.ok) {
  console.warn('[DD modules] default module service registration failed', [...serviceRegistration.missing]);
}

const runtimeApi = Object.freeze({
  mode: 'runtime',
  build: 288,
  registry,
  definitions: registry.list(),
  contractValidation,
  serviceRegistration,
  classifyPath,
  resolveForUser: (pathname, user) => registry.resolve(pathname, user),
  getCurrent: () => currentResolution,
  getActiveModuleId: () => activeModuleId,
  getModuleState: (moduleId) => registry.state(moduleId),
  service: (name) => registry.service(name),
  getServiceIds: () => Object.freeze([...serviceRegistration.available]),
  annotateAdminLinks: () => annotateAdminLinks(document),
});

window.DDModuleRuntime = runtimeApi;
window.DDModuleShadow = runtimeApi;
