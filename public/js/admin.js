// File: /public/js/admin.js
// Build 245: resilient desktop admin identity panel. Temporary 5xx responses never render a false signed-out state.

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
