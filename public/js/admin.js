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

  if (document.body?.dataset?.adminPage === 'products') {
    void import('/public/js/admin-product-production-reversal.js?v=440')
      .catch((error) => console.warn('[DD Build 440] production reversal workspace unavailable', error));
    void import('/public/js/admin-product-image-quality-editor-bridge-v56.js?v=56')
      .catch((error) => console.warn('[DD Build 56] Product Editor image-quality bridge unavailable', error));
  }
  if (document.body?.dataset?.adminPage === 'product-image-quality') {
    void import('/public/js/admin-product-image-quality-guidance-v56.js?v=56')
      .catch((error) => console.warn('[DD Build 56] photography coaching unavailable', error));
  }
  if (document.body?.dataset?.adminPage === 'packaging-studio') {
    void import('/public/js/admin-packaging-onboarding-v56.js?v=56')
      .catch((error) => console.warn('[DD Build 56] Packaging walkthrough unavailable', error));
  }
});

void import('/public/js/admin-external-help.js?v=461')
  .catch((error) => console.warn('[DD Release 461] external field help unavailable', error));

void import('/public/js/admin-inventory-base-unit-usability.js?v=461')
  .catch((error) => console.warn('[DD Release 461] inventory base-unit usability overlay unavailable', error));

void import('/public/js/core/dd-application-module-bootstrap.mjs?v=440')
  .catch((error) => console.warn('[DD modules] authoritative module bootstrap unavailable', error));