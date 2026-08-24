// Devil n Dove Build 305 Admin module runtime bridge.
// Build 304 proved the first real top-level application-module runtime for Catalog.
// Build 305 extends Commerce & Operations to Inventory while preserving the proven
// domain registry, Packaging activation, and Build 303 verified-auth reconciliation.

import { MODULE_STATES, createModuleRegistry } from './dd-module-registry.mjs';
import { DD_MODULE_DEFINITIONS } from './dd-module-definitions.mjs';
import { validateModuleContracts } from './dd-module-contracts.mjs';
import { registerDefaultModuleServices } from './dd-module-service-adapters.mjs';
import {
  BUILD as APPLICATION_ARCHITECTURE_BUILD,
  RUNTIME_CATALOG_BUILD as APPLICATION_RUNTIME_CATALOG_BUILD,
  RUNTIME_INVENTORY_BUILD as APPLICATION_RUNTIME_INVENTORY_BUILD,
  applicationModuleForDomain,
  applicationModuleRuntimeForDomain,
  getApplicationModule,
  snapshotApplicationArchitecture,
} from './dd-application-module-groups.mjs';

const registry = createModuleRegistry(DD_MODULE_DEFINITIONS);
const contractValidation = validateModuleContracts(DD_MODULE_DEFINITIONS);
const serviceRegistration = registerDefaultModuleServices(registry);
const applicationArchitecture = snapshotApplicationArchitecture();
const CLASSIFICATION_USER = Object.freeze({ role: 'admin' });

let currentResolution = null;
let currentApplicationModule = null;
let activeModuleId = null;
let activeApplicationModuleId = null;
let verifiedAdmin = null;
let verifiedResolutionPromise = null;

const applicationModuleNamespaces = new Map();
const loadedApplicationModules = new Set();

function classifyPath(pathname) {
  return registry.resolve(pathname, CLASSIFICATION_USER);
}

function authenticatedAdmin(user) {
  return Boolean(user && String(user.role || '').toLowerCase() === 'admin');
}

function missingRuntimeServices(definition) {
  return (definition?.consumes || []).filter((contractId) => !registry.service(contractId));
}

function applicationModuleFromDefinition(definition) {
  const applicationModuleId = applicationModuleForDomain(definition?.id);
  return applicationModuleId ? getApplicationModule(applicationModuleId) : null;
}

function applicationRuntimeFromDefinition(definition) {
  return applicationModuleRuntimeForDomain(definition?.id) || null;
}

function applicationModeForDefinition(definition) {
  const applicationModule = applicationModuleFromDefinition(definition);
  if (!applicationModule) return 'domain-bridge';
  if (activeApplicationModuleId === applicationModule.id) return 'active';
  return applicationRuntimeFromDefinition(definition) ? 'activation-pending' : 'domain-bridge';
}

function annotateAdminLinks(root = document) {
  if (!root?.querySelectorAll) return;
  for (const link of root.querySelectorAll('a[href^="/admin"]')) {
    try {
      const url = new URL(link.getAttribute('href'), window.location.origin);
      const definition = classifyPath(url.pathname);
      const applicationModule = applicationModuleFromDefinition(definition);
      const applicationRuntime = applicationRuntimeFromDefinition(definition);
      link.dataset.ddModuleTarget = definition?.id || 'legacy-review';
      link.dataset.ddModuleActivation = definition?.entry ? 'runtime' : 'shadow';
      link.dataset.ddApplicationModuleTarget = applicationModule?.id || 'legacy-review';
      link.dataset.ddApplicationModuleActivation = applicationRuntime ? 'runtime' : 'domain-bridge';
    } catch {
      link.dataset.ddModuleTarget = 'legacy-review';
      link.dataset.ddModuleActivation = 'shadow';
      link.dataset.ddApplicationModuleTarget = 'legacy-review';
      link.dataset.ddApplicationModuleActivation = 'domain-bridge';
    }
  }
}

function setResolution(definition, mode, applicationMode = null) {
  currentResolution = definition || null;
  currentApplicationModule = applicationModuleFromDefinition(definition);
  document.documentElement.dataset.ddModule = definition?.id || 'legacy-review';
  document.documentElement.dataset.ddModuleMode = mode;
  document.documentElement.dataset.ddApplicationModule = currentApplicationModule?.id || 'legacy-review';
  document.documentElement.dataset.ddApplicationModuleMode = applicationMode || applicationModeForDefinition(definition);
}

function resolutionDetail(definition, mode, extra = {}) {
  const applicationModule = applicationModuleFromDefinition(definition);
  const applicationRuntime = applicationRuntimeFromDefinition(definition);
  return Object.freeze({
    mode,
    moduleId: definition?.id || null,
    moduleLabel: definition?.label || null,
    applicationModuleId: applicationModule?.id || null,
    applicationModuleLabel: applicationModule?.label || null,
    applicationModuleMode: document.documentElement.dataset.ddApplicationModuleMode || applicationModeForDefinition(definition),
    applicationArchitectureBuild: APPLICATION_ARCHITECTURE_BUILD,
    applicationRuntimeCatalogBuild: APPLICATION_RUNTIME_CATALOG_BUILD,
    applicationRuntimeInventoryBuild: APPLICATION_RUNTIME_INVENTORY_BUILD,
    applicationRuntimeEntry: applicationRuntime?.entry || null,
    activeApplicationModuleId,
    pathname: window.location.pathname,
    contractsOk: contractValidation.ok,
    servicesOk: serviceRegistration.ok,
    runtimeEntry: definition?.entry || null,
    state: definition ? registry.state(definition.id) : null,
    ...extra,
  });
}

function dispatchResolution(definition, mode, extra = {}) {
  const detail = resolutionDetail(definition, mode, extra);
  document.dispatchEvent(new CustomEvent('dd:module-resolved', { detail }));
  document.dispatchEvent(new CustomEvent('dd:application-module-resolved', { detail }));
}

async function deactivateActive(reason = 'route-lifecycle') {
  if (!activeModuleId) return false;
  const id = activeModuleId;
  activeModuleId = null;
  try {
    return await registry.deactivate(id, { reason, pathname: window.location.pathname, user: verifiedAdmin });
  } catch (error) {
    console.warn(`[DD modules] failed to deactivate domain ${id}`, error);
    return false;
  }
}

async function loadApplicationModule(applicationModule, definition, user) {
  if (!applicationModule?.entry) return null;
  if (applicationModuleNamespaces.has(applicationModule.id)) {
    return applicationModuleNamespaces.get(applicationModule.id);
  }

  const namespace = await import(applicationModule.entry);
  applicationModuleNamespaces.set(applicationModule.id, namespace);
  if (!loadedApplicationModules.has(applicationModule.id)) {
    if (typeof namespace?.onLoad === 'function') {
      await namespace.onLoad({
        registry,
        applicationModule,
        domainDefinition: definition,
        user,
        pathname: window.location.pathname,
      });
    }
    loadedApplicationModules.add(applicationModule.id);
  }
  return namespace;
}

async function deactivateActiveApplicationModule(reason = 'route-lifecycle') {
  if (!activeApplicationModuleId) return false;
  const id = activeApplicationModuleId;
  const applicationModule = getApplicationModule(id);
  const namespace = applicationModuleNamespaces.get(id) || null;
  activeApplicationModuleId = null;
  try {
    if (typeof namespace?.onDeactivate === 'function') {
      await namespace.onDeactivate({
        registry,
        applicationModule,
        reason,
        pathname: window.location.pathname,
        user: verifiedAdmin,
      });
    }
    return true;
  } catch (error) {
    console.warn(`[DD modules] failed to deactivate application module ${id}`, error);
    return false;
  }
}

async function activateApplicationModuleForDefinition(definition, user) {
  const applicationModule = applicationRuntimeFromDefinition(definition);
  if (!applicationModule) {
    if (activeApplicationModuleId) await deactivateActiveApplicationModule('application-module-change');
    return null;
  }

  if (activeApplicationModuleId && activeApplicationModuleId !== applicationModule.id) {
    await deactivateActiveApplicationModule('application-module-change');
  }

  if (activeApplicationModuleId === applicationModule.id) return applicationModule;

  const namespace = await loadApplicationModule(applicationModule, definition, user);
  if (typeof namespace?.onActivate === 'function') {
    await namespace.onActivate({
      registry,
      applicationModule,
      domainDefinition: definition,
      user,
      pathname: window.location.pathname,
      verified: true,
    });
  }
  activeApplicationModuleId = applicationModule.id;
  return applicationModule;
}

function applicationModuleRuntimeStatus(moduleId) {
  const id = String(moduleId || '').trim().toLowerCase();
  const namespace = applicationModuleNamespaces.get(id) || null;
  try {
    return namespace?.getStatus?.() || null;
  } catch {
    return null;
  }
}

async function resolveVerifiedAdmin(user) {
  if (!authenticatedAdmin(user)) return null;
  verifiedAdmin = user;
  annotateAdminLinks(document);

  const definition = registry.resolve(window.location.pathname, user);
  if (!definition) {
    await deactivateActive('unresolved-route');
    await deactivateActiveApplicationModule('unresolved-route');
    setResolution(null, 'shadow', 'domain-bridge');
    dispatchResolution(null, 'shadow');
    return null;
  }

  if (activeModuleId && activeModuleId !== definition.id) {
    await deactivateActive('module-change');
  }

  let applicationMode = 'domain-bridge';
  const applicationRuntime = applicationRuntimeFromDefinition(definition);
  if (applicationRuntime) {
    try {
      await activateApplicationModuleForDefinition(definition, user);
      applicationMode = 'active';
    } catch (error) {
      console.warn(`[DD modules] application module activation failed (${applicationRuntime.id})`, error);
      applicationMode = 'activation-failed';
    }
  } else if (activeApplicationModuleId) {
    await deactivateActiveApplicationModule('application-module-not-required');
  }

  if (!definition.entry) {
    setResolution(definition, 'shadow', applicationMode);
    dispatchResolution(definition, 'shadow', {
      applicationModuleRuntimeStatus: applicationModuleRuntimeStatus(currentApplicationModule?.id),
    });
    return definition;
  }

  if (!contractValidation.ok) {
    setResolution(definition, 'activation-blocked-contracts', applicationMode);
    dispatchResolution(definition, 'activation-blocked-contracts');
    return definition;
  }

  const missingServices = missingRuntimeServices(definition);
  if (missingServices.length) {
    setResolution(definition, 'activation-blocked-services', applicationMode);
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

  setResolution(definition, 'active', applicationMode);
  dispatchResolution(definition, 'active');
  return definition;
}

function requestVerifiedAdminResolution(user, source = 'auth-event') {
  if (!authenticatedAdmin(user)) return Promise.resolve(null);
  if (verifiedResolutionPromise) return verifiedResolutionPromise;

  verifiedResolutionPromise = resolveVerifiedAdmin(user)
    .catch((error) => {
      console.warn(`[DD modules] verified module activation failed (${source})`, error);
      document.documentElement.dataset.ddModuleMode = 'activation-failed';
      throw error;
    })
    .finally(() => {
      verifiedResolutionPromise = null;
    });
  return verifiedResolutionPromise;
}

function reconcileVerifiedAuthState() {
  const authState = globalThis.DDAuthUiState;
  if (authState?.verified !== true || !authenticatedAdmin(authState?.user)) return false;
  void requestVerifiedAdminResolution(authState.user, 'verified-state-reconcile').catch(() => {});
  return true;
}

function bootstrap() {
  annotateAdminLinks(document);
  const definition = classifyPath(window.location.pathname);
  const domainMode = definition?.entry ? 'activation-pending' : 'shadow-unverified';
  const applicationMode = applicationRuntimeFromDefinition(definition) ? 'activation-pending' : 'domain-bridge';
  setResolution(definition, domainMode, applicationMode);
  dispatchResolution(definition, document.documentElement.dataset.ddModuleMode);

  // site-auth-ui may have completed /api/auth/me before this async module import
  // finished. Reconcile retained verified state so activation never depends on
  // catching a one-time dd:admin-ready event.
  queueMicrotask(reconcileVerifiedAuthState);
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
    void requestVerifiedAdminResolution(detail.user, 'dd:admin-ready').catch(() => {});
    return;
  }

  // Cached/degraded identity may classify the route but cannot start a domain or application runtime.
  if (!activeModuleId && !activeApplicationModuleId) {
    const definition = registry.resolve(window.location.pathname, detail.user);
    const applicationMode = applicationRuntimeFromDefinition(definition)
      ? 'activation-pending'
      : 'domain-bridge';
    setResolution(definition, detail.degraded ? 'shadow-degraded' : 'activation-pending', applicationMode);
    dispatchResolution(definition, document.documentElement.dataset.ddModuleMode);
  } else if (detail.degraded) {
    if (activeModuleId) document.documentElement.dataset.ddModuleMode = 'active-degraded';
    if (activeApplicationModuleId) document.documentElement.dataset.ddApplicationModuleMode = 'active-degraded';
  }
});

document.addEventListener('dd:auth-verified', () => {
  reconcileVerifiedAuthState();
});

document.addEventListener('dd:auth-rejected', () => {
  verifiedAdmin = null;
  void Promise.all([
    deactivateActive('auth-rejected'),
    deactivateActiveApplicationModule('auth-rejected'),
  ]).finally(() => {
    currentResolution = null;
    currentApplicationModule = null;
    document.documentElement.dataset.ddModule = 'unverified';
    document.documentElement.dataset.ddModuleMode = 'shadow-unverified';
    document.documentElement.dataset.ddApplicationModule = 'unverified';
    document.documentElement.dataset.ddApplicationModuleMode = 'domain-bridge';
  });
});

window.addEventListener('pagehide', () => {
  void Promise.all([
    deactivateActive('pagehide'),
    deactivateActiveApplicationModule('pagehide'),
  ]);
}, { once: true });

if (!contractValidation.ok) {
  console.warn('[DD modules] contract catalog validation failed', [...contractValidation.errors]);
}
if (!serviceRegistration.ok) {
  console.warn('[DD modules] default module service registration failed', [...serviceRegistration.missing]);
}

const runtimeApi = Object.freeze({
  mode: 'runtime',
  build: 305,
  applicationArchitectureBuild: APPLICATION_ARCHITECTURE_BUILD,
  applicationRuntimeCatalogBuild: APPLICATION_RUNTIME_CATALOG_BUILD,
  applicationRuntimeInventoryBuild: APPLICATION_RUNTIME_INVENTORY_BUILD,
  applicationArchitecture,
  registry,
  definitions: registry.list(),
  contractValidation,
  serviceRegistration,
  classifyPath,
  resolveForUser: (pathname, user) => registry.resolve(pathname, user),
  applicationModuleForDomain,
  applicationModuleRuntimeForDomain,
  getApplicationModule,
  getCurrent: () => currentResolution,
  getCurrentApplicationModule: () => currentApplicationModule,
  getActiveModuleId: () => activeModuleId,
  getActiveApplicationModuleId: () => activeApplicationModuleId,
  getApplicationModuleRuntimeStatus: (moduleId) => applicationModuleRuntimeStatus(moduleId),
  getCurrentApplicationModuleRuntimeStatus: () => applicationModuleRuntimeStatus(currentApplicationModule?.id),
  getModuleState: (moduleId) => registry.state(moduleId),
  service: (name) => registry.service(name),
  getServiceIds: () => Object.freeze([...serviceRegistration.available]),
  annotateAdminLinks: () => annotateAdminLinks(document),
  reconcileVerifiedAuthState,
});

window.DDModuleRuntime = runtimeApi;
window.DDModuleShadow = runtimeApi;
