// File: /public/js/admin.js
// Build 245: resilient desktop admin identity panel. Temporary 5xx responses never render a false signed-out state.
// Build 290: Packaging physically removes retired broad Catalog/Inventory reads from legacy server source.
// Build 296: Packaging exposes an explicit client transport facade over the proven read/write bridges.
// Builds 303–397: Core and the three top-level application-module runtimes progressively add proven page-specific read coverage.
// Build 397: Commerce & Operations gives /admin/customer-documents/ its Operations-owned read boundary.
// Build 438: authoritative server module availability is loaded before any top-level runtime activation.
// Build 440: Products loads the audited finished-production reversal workspace on demand.
// Release 461: backend external-information fields receive reusable circled help with provider acquisition steps.
// Build 56: Products, Product Photography Manager and Packaging Studio load workflow-guidance overlays without changing their underlying write authorities.
// Hotfix 467: Products must never load the inventory usability MutationObserver; Inventory workflows retain it.
// Release 467 Build 65: optional admin panels/services are selector- and viewport-gated instead of starting on every admin page.
// Release 467 Build 66: Products uses focused presentation workspaces while retaining one Product authority.
// Release 467 Build 67: Product Editor adds product-scoped recovery, stale-copy preflight and unsaved-change protection.
// Release 467 Build 95: Products loads the current workspace context bundle instead of the stale Build 66 asset revision.

const DD_ADMIN_LAZY_VERSION = 'R467B65_V1';
const ddAdminLazyState = new Map();

function ddAdminLazySnapshot() {
  return [...ddAdminLazyState.values()].map((row) => ({
    key: row.key,
    status: row.status,
    requested_at: row.requested_at || null,
    loaded_at: row.loaded_at || null,
    failed_at: row.failed_at || null,
  }));
}

function ddImportOnce(key, importer, label = key) {
  const existing = ddAdminLazyState.get(key);
  if (existing?.promise) return existing.promise;
  const row = { key, status: 'loading', requested_at: Date.now(), promise: null };
  row.promise = Promise.resolve()
    .then(importer)
    .then((module) => {
      row.status = 'loaded';
      row.loaded_at = Date.now();
      return module;
    })
    .catch((error) => {
      row.status = 'failed';
      row.failed_at = Date.now();
      console.warn(`[DD Build 65] ${label} unavailable`, error);
      return null;
    });
  ddAdminLazyState.set(key, row);
  return row.promise;
}

function ddElementIsNearViewport(element) {
  if (!element?.getBoundingClientRect) return false;
  if (element.closest?.('[hidden], [inert]')) return false;
  const style = typeof window.getComputedStyle === 'function' ? window.getComputedStyle(element) : null;
  if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
  const rect = element.getBoundingClientRect();
  const height = window.innerHeight || document.documentElement.clientHeight || 0;
  return rect.bottom >= -320 && rect.top <= height + 320;
}

function ddLazyImportWhenVisible({ key, selector, importer, label = key, rootMargin = '420px 0px', observeForMs = 20000 }) {
  let presenceObserver = null;
  let visibilityObserver = null;
  let timeoutId = 0;
  let target = null;

  const stopInteractionWatch = () => {
    document.removeEventListener('focusin', onInteraction, true);
    document.removeEventListener('pointerdown', onInteraction, true);
  };
  const cleanup = () => {
    presenceObserver?.disconnect();
    visibilityObserver?.disconnect();
    presenceObserver = null;
    visibilityObserver = null;
    stopInteractionWatch();
    if (timeoutId) window.clearTimeout(timeoutId);
    timeoutId = 0;
  };
  const load = () => {
    cleanup();
    return ddImportOnce(key, importer, label);
  };
  function onInteraction(event) {
    if (!target) return;
    if (event.target === target || target.contains?.(event.target)) void load();
  }
  const watchTarget = (element) => {
    if (!element) return false;
    target = element;
    presenceObserver?.disconnect();
    presenceObserver = null;
    if (ddElementIsNearViewport(element) || typeof IntersectionObserver !== 'function') {
      void load();
      return true;
    }
    visibilityObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void load();
    }, { root: null, rootMargin, threshold: 0.01 });
    visibilityObserver.observe(element);
    document.addEventListener('focusin', onInteraction, true);
    document.addEventListener('pointerdown', onInteraction, true);
    return true;
  };

  if (watchTarget(document.querySelector(selector))) return;
  if (!document.body || typeof MutationObserver !== 'function') return;
  presenceObserver = new MutationObserver(() => {
    const element = document.querySelector(selector);
    if (element) watchTarget(element);
  });
  presenceObserver.observe(document.body, { childList: true, subtree: true });
  timeoutId = window.setTimeout(() => cleanup(), Math.max(1000, Number(observeForMs) || 20000));
}

window.DDAdminLazyLoading = Object.freeze({
  version: DD_ADMIN_LAZY_VERSION,
  snapshot: ddAdminLazySnapshot,
});

document.addEventListener('DOMContentLoaded', () => {
  const stateEl = document.getElementById('adminAuthState');
  const userEl = document.getElementById('adminUserSummary');
  const accessMessage = document.getElementById('adminAccessMessage');
  if (!window.DDAuth) return;

  const safeName = (u) => String(u?.display_name || u?.email || 'Administrator').trim() || 'Administrator';
  function renderChecking() {
    if (stateEl) stateEl.textContent = 'Checking administrator session…';
    if (userEl) userEl.textContent = '';
    if (accessMessage && !accessMessage.textContent) { accessMessage.textContent = 'Checking administrator session…'; accessMessage.classList.add('admin-access-checking'); }
  }
  function renderAdmin(user, { degraded = false, provisional = false } = {}) {
    if (stateEl) stateEl.textContent = degraded ? 'Admin session retained — verification temporarily unavailable' : (provisional ? 'Admin session restored — verifying…' : 'Administrator session verified');
    if (userEl) userEl.textContent = `${safeName(user)}${user?.email ? ` • ${user.email}` : ''}`;
  }
  function renderDenied() {
    if (stateEl) stateEl.textContent = 'Administrator login required';
    if (userEl) userEl.textContent = '';
  }

  renderChecking();
  const cached = window.DDAuth.getStoredUser?.();
  if (cached && String(cached.role || '').toLowerCase() === 'admin' && window.DDAuth.isLoggedIn()) renderAdmin(cached, { provisional: true });

  document.addEventListener('dd:admin-ready', (event) => {
    const d = event?.detail || {};
    if (d.ok && d.user) renderAdmin(d.user, { degraded: Boolean(d.degraded), provisional: !d.verified });
  });
  document.addEventListener('dd:auth-degraded', () => {
    const user = window.DDAuth.getStoredUser?.();
    if (user && String(user.role || '').toLowerCase() === 'admin') renderAdmin(user, { degraded: true, provisional: true });
  });
  document.addEventListener('dd:auth-rejected', renderDenied);

  const adminPage = document.body?.dataset?.adminPage || '';
  if (document.body?.dataset?.adminPage === 'products') {
    void ddImportOnce(
      'product-workspace-split',
      () => import('/public/js/admin-product-workspaces.js?v=95'),
      'Product workspace current context',
    );
    void ddImportOnce(
      'product-editor-recovery-autosave',
      () => import('/public/js/admin-product-editor-recovery.js?v=67'),
      'Product Editor recovery and autosave guard',
    );
    ddLazyImportWhenVisible({
      key: 'product-production-reversal',
      selector: '.product-production-release',
      label: 'production reversal workspace',
      importer: () => import('/public/js/admin-product-production-reversal.js?v=440'),
    });
    ddLazyImportWhenVisible({
      key: 'product-image-quality-editor',
      selector: '#createProductForm',
      label: 'Product Editor image-quality bridge',
      importer: () => import('/public/js/admin-product-image-quality-editor-bridge-v56.js?v=56'),
    });
  }
  if (adminPage === 'product-image-quality') {
    void ddImportOnce('product-image-quality-guidance', () => import('/public/js/admin-product-image-quality-guidance-v56.js?v=56'), 'photography coaching');
  }
  if (adminPage === 'packaging-studio') {
    void ddImportOnce('packaging-onboarding', () => import('/public/js/admin-packaging-onboarding-v56.js?v=56'), 'Packaging walkthrough');
  }

  if (document.body?.dataset?.adminPage !== 'products') {
    ddLazyImportWhenVisible({
      key: 'inventory-base-unit-usability',
      selector: '#siteInventoryAdminMount',
      label: 'inventory base-unit usability overlay',
      importer: () => import('/public/js/admin-inventory-base-unit-usability.js?v=461'),
    });
  }

  ddLazyImportWhenVisible({
    key: 'external-field-help',
    selector: '[data-external-help-key], .it-setup-field code, input[id*="external" i], input[name*="external" i], input[id*="callback" i], input[name*="callback" i], input[id*="redirect" i], input[name*="redirect" i], input[id*="webhook" i], input[name*="webhook" i], input[id*="scope" i], input[name*="scope" i], input[id*="credential" i], input[name*="credential" i], input[id*="etsy" i], input[name*="etsy" i], input[id*="stripe" i], input[name*="stripe" i], input[id*="paypal" i], input[name*="paypal" i], input[id*="pinterest" i], input[name*="pinterest" i], input[id*="tiktok" i], input[name*="tiktok" i], input[id*="youtube" i], input[name*="youtube" i], input[id*="meta" i], input[name*="meta" i]',
    label: 'external field help',
    rootMargin: '520px 0px',
    observeForMs: 30000,
    importer: () => import('/public/js/admin-external-help.js?v=461'),
  });
});

void import('/public/js/core/dd-application-module-bootstrap.mjs?v=440')
  .catch((error) => console.warn('[DD modules] authoritative module bootstrap unavailable', error));
