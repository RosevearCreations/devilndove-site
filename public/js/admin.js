// File: /public/js/admin.js
// Build 245: resilient desktop admin identity panel. Temporary 5xx responses never render a false signed-out state.
// Build 290: Packaging physically removes retired broad Catalog/Inventory reads from legacy server source.
// Build 296: Packaging exposes an explicit client transport facade over the proven read/write bridges.
// Build 303: Core runtime reports Build 302 umbrella application-module classification without changing domain activation.
// Build 304: Core activates the Commerce & Operations umbrella runtime for Catalog routes only.
// Build 305: Commerce & Operations extends to Inventory through the existing inventory-read authority.
// Build 306: Inventory write-side contract readiness is exposed without moving mutation authority.
// Build 307: Inventory exposes an owned compensating reversal service; consumer migration remains disabled.
// Build 309: Inventory exposes an owned reviewed-material post service; Creative post migration remains disabled.
// Build 310: Creative consumes both Inventory-owned post and reverse authorities.
// Build 311: Inventory exposes the passive cost read contract; Operations remains bridge-only.
// Build 312: Accounting exposes a passive bounded read prerequisite; Operations remains inactive.
// Build 313: Commerce & Operations activates the first read-only Operations runtime page.
// Build 314: Operations runtime coverage is explicit for Operations and Customer Documents pages only.
// Build 315: Orders joins explicit read-only Operations runtime coverage without moving order/payment writes.
// Build 348: Business & Administration activates read-only runtime coverage for /admin/accounting/ only.
// Build 351: Creative & Production activates top-level coverage for proven /admin/packaging-studio/ only.
// Build 354: Creative & Production adds /admin/creative-process/ without moving Creative Process mutations.
// Build 357: Creative & Production adds /admin/content-studio/ after removing GET-time schema creation.

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
});

void import('/public/js/core/dd-admin-module-runtime.mjs?v=357')
  .catch((error) => console.warn('[DD modules] runtime bridge unavailable', error));
