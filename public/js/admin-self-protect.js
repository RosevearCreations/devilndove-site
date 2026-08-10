// File: /public/js/admin-self-protect.js
// Build 245: admin shell protection that distinguishes auth rejection from temporary backend failure.

document.addEventListener('DOMContentLoaded', () => {
  if (!window.DDAuth) return;
  const accessMessageEl = document.getElementById('adminAccessMessage');
  let rejected = false;
  let grantedOnce = false;

  window.DDAdminAccessState = window.DDAdminAccessState || { granted: false, provisional: false, degraded: false, user: null };

  function setMessage(message, kind = 'checking') {
    if (!accessMessageEl) return;
    accessMessageEl.textContent = message || '';
    accessMessageEl.style.display = message ? 'block' : 'none';
    accessMessageEl.classList.remove('admin-access-checking', 'admin-access-degraded', 'admin-access-error');
    if (message) accessMessageEl.classList.add(kind === 'error' ? 'admin-access-error' : kind === 'degraded' ? 'admin-access-degraded' : 'admin-access-checking');
  }
  function redirectToLogin() {
    const next = `${window.location.pathname}${window.location.search || ''}${window.location.hash || ''}`;
    const url = new URL('/login/', window.location.origin); url.searchParams.set('next', next); window.location.href = url.toString();
  }
  function grant(user, { provisional = false, degraded = false } = {}) {
    if (rejected) return;
    const role = String(user?.role || '').toLowerCase();
    if (!user || role !== 'admin') return;
    const firstGrant = !grantedOnce;
    grantedOnce = true;
    window.DDAdminAccessState = { granted: true, provisional, degraded, user };
    setMessage(degraded ? 'Admin session retained. Server verification is temporarily unavailable; some live data may be delayed while Devil n Dove retries.' : '', degraded ? 'degraded' : 'checking');
    document.dispatchEvent(new CustomEvent('dd:admin-access-granted', { detail: { ok: true, user, provisional, degraded, first_grant: firstGrant } }));
  }
  function reject(message = 'Please log in with an admin account to access this page.') {
    if (rejected) return;
    rejected = true;
    window.DDAdminAccessState = { granted: false, provisional: false, degraded: false, user: null };
    setMessage(message, 'error');
    document.dispatchEvent(new CustomEvent('dd:admin-access-denied', { detail: { ok: false } }));
    window.setTimeout(redirectToLogin, 250);
  }

  // Give the cached admin identity provisional UI access. API authorization remains server-side.
  const cached = window.DDAuth.getStoredUser?.() || window.DDAuthUiState?.user || null;
  if (cached && String(cached.role || '').toLowerCase() === 'admin' && window.DDAuth.isLoggedIn()) grant(cached, { provisional: true });
  else setMessage('Checking administrator session…', 'checking');

  document.addEventListener('dd:admin-ready', (event) => {
    const d = event?.detail || {};
    if (d.ok && d.user) grant(d.user, { provisional: !d.verified, degraded: Boolean(d.degraded) });
    // A generic not-ok event is not enough to redirect; only dd:auth-rejected is authoritative.
  });
  document.addEventListener('dd:auth-degraded', (event) => {
    const user = event?.detail?.user || window.DDAuth.getStoredUser?.();
    if (user && String(user.role || '').toLowerCase() === 'admin') grant(user, { provisional: true, degraded: true });
    else setMessage('Administrator verification is temporarily unavailable. Retrying…', 'degraded');
  });
  document.addEventListener('dd:auth-rejected', () => reject());

  window.DDWhenAdminReady = function DDWhenAdminReady(callback, { delayMs = 0 } = {}) {
    if (typeof callback !== 'function') return () => {};
    let ran = false;
    const run = (detail = {}) => {
      if (ran) return;
      const state = window.DDAdminAccessState || {};
      if (!state.granted && !detail.ok) return;
      ran = true;
      window.setTimeout(() => callback({ ...(detail || {}), ...(state || {}) }), Math.max(0, Number(delayMs || 0)));
    };
    if (window.DDAdminAccessState?.granted) queueMicrotask(() => run(window.DDAdminAccessState));
    const listener = (event) => run(event?.detail || {});
    document.addEventListener('dd:admin-access-granted', listener, { once: true });
    return () => document.removeEventListener('dd:admin-access-granted', listener);
  };
});
