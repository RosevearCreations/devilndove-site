// File: /public/js/site-auth-ui.js
// Build 245: resilient authentication UI. A temporary Worker/D1/network failure never becomes a false logout.
// Only an explicit 401/403 clears stored credentials. Cached identity is provisional until /api/auth/me verifies it.
// Build 438: public/member navigation receives one bounded module-availability read; Admin has its own richer bootstrap.
// The Application Modules recovery link remains visible to a verified/cached Admin even if Business Administration is disabled.
// Forward enhancement: admin routes bootstrap the shared accessible contextual-help layer.

document.addEventListener('DOMContentLoaded', () => {
  if (!window.DDAuth) return;

  const loggedInEls = [...document.querySelectorAll('[data-show-when-logged-in]')];
  const loggedOutEls = [...document.querySelectorAll('[data-show-when-logged-out]')];
  const adminEls = [...document.querySelectorAll('[data-show-when-admin]')];
  const navUserNameEls = [...document.querySelectorAll('[data-nav-user-name]')];
  const logoutButtons = [...document.querySelectorAll('[data-nav-logout]')];
  const linksWrap = document.querySelector('.nav .links');
  let floatingWidgetEl = null;
  let lastAuthReadySignature = '';

  window.DDAuthUiState = window.DDAuthUiState || {
    phase: 'checking',
    user: window.DDAuth.getStoredUser?.() || null,
    verified: false,
    degraded: false,
    last_error: null
  };

  const show = (el, yes) => { if (el) el.style.display = yes ? '' : 'none'; };
  const safeName = (user) => String(user?.display_name || user?.email || 'Member').trim() || 'Member';

  function ensureFloatingWidget() {
    if (floatingWidgetEl) return floatingWidgetEl;
    floatingWidgetEl = document.createElement('aside');
    floatingWidgetEl.id = 'ddAuthWidget';
    floatingWidgetEl.className = 'dd-auth-widget card';
    floatingWidgetEl.innerHTML = `
      <div class="dd-auth-widget-head">
        <div><div class="dd-auth-widget-title">Account</div><div class="small" id="ddAuthWidgetState">Checking session…</div></div>
        <button class="btn" type="button" id="ddAuthWidgetToggle">Open</button>
      </div>
      <div class="dd-auth-widget-body" id="ddAuthWidgetBody" style="display:none">
        <div id="ddAuthWidgetLoggedIn" style="display:none">
          <div class="small" id="ddAuthWidgetUserLabel" style="margin-bottom:10px"></div>
          <div class="dd-auth-widget-links">
            <a href="/members/index.html">Settings</a><a href="/members/index.html#orders">Orders</a>
            <a href="/admin/index.html" id="ddAuthWidgetAdminLink" style="display:none">Admin Dashboard</a>
            <a href="/admin/application-modules/" id="ddAuthWidgetModuleLink" style="display:none">Application Modules</a>
            <button class="btn" type="button" id="ddAuthWidgetLogout">Logout</button>
          </div>
        </div>
        <div id="ddAuthWidgetLoggedOut" style="display:none"><div class="small" style="margin-bottom:10px">You are currently logged out.</div><div class="dd-auth-widget-links"><a href="/login/index.html">Login</a><a href="/register/index.html">Create account</a><a href="/account-help/index.html?mode=password">Forgot password</a><a href="/account-help/index.html?mode=email">Forgot email</a></div></div>
      </div>`;
    document.body.appendChild(floatingWidgetEl);
    const toggle = floatingWidgetEl.querySelector('#ddAuthWidgetToggle');
    const body = floatingWidgetEl.querySelector('#ddAuthWidgetBody');
    toggle?.addEventListener('click', () => {
      const open = body.style.display === 'none';
      body.style.display = open ? 'block' : 'none';
      toggle.textContent = open ? 'Close' : 'Open';
    });
    floatingWidgetEl.querySelector('#ddAuthWidgetLogout')?.addEventListener('click', async () => {
      try { await window.DDAuth.logout(); } finally { window.location.href = '/'; }
    });
    return floatingWidgetEl;
  }

  function applyUi(user, { degraded = false } = {}) {
    const loggedIn = Boolean(user);
    const role = String(user?.role || '').trim().toLowerCase();
    const isAdmin = loggedIn && role === 'admin';
    const name = safeName(user);
    loggedInEls.forEach((el) => show(el, loggedIn));
    loggedOutEls.forEach((el) => show(el, !loggedIn));
    adminEls.forEach((el) => show(el, isAdmin));
    navUserNameEls.forEach((el) => { el.textContent = name; });
    const widget = ensureFloatingWidget();
    if (widget) {
      const state = widget.querySelector('#ddAuthWidgetState');
      if (state) state.textContent = degraded && loggedIn ? 'Session retained • verification temporarily unavailable' : (loggedIn ? `${name} • ${role || 'member'}` : 'Not logged in');
      const label = widget.querySelector('#ddAuthWidgetUserLabel');
      if (label) label.textContent = loggedIn ? `Signed in as ${name} (${user?.email || 'no email'})` : '';
      const adminLink = widget.querySelector('#ddAuthWidgetAdminLink');
      if (adminLink) adminLink.style.display = isAdmin ? '' : 'none';
      const moduleLink = widget.querySelector('#ddAuthWidgetModuleLink');
      if (moduleLink) moduleLink.style.display = isAdmin ? '' : 'none';
      show(widget.querySelector('#ddAuthWidgetLoggedIn'), loggedIn);
      show(widget.querySelector('#ddAuthWidgetLoggedOut'), !loggedIn);
    }
    if (linksWrap) {
      let statusEl = linksWrap.querySelector('.dd-nav-status');
      if (!statusEl) {
        statusEl = document.createElement('span');
        statusEl.className = 'small dd-nav-status';
        statusEl.innerHTML = 'Signed in as <span data-nav-user-name>Member</span>';
        statusEl.style.display = 'none';
        linksWrap.appendChild(statusEl);
      }
      show(statusEl, loggedIn);
      const nameEl = statusEl.querySelector('[data-nav-user-name]');
      if (nameEl) nameEl.textContent = name;
    }
  }

  function emitAuthEvents(user, session = null, { force = false, verified = false, degraded = false, error = null } = {}) {
    const loggedIn = Boolean(user);
    const role = String(user?.role || '').trim().toLowerCase();
    const isAdmin = loggedIn && role === 'admin';
    const signature = `${loggedIn ? 1 : 0}:${Number(user?.user_id || 0)}:${role}:${verified ? 1 : 0}:${degraded ? 1 : 0}`;
    if (!force && signature === lastAuthReadySignature) return false;
    lastAuthReadySignature = signature;
    const detail = { ok: true, logged_in: loggedIn, user, session, verified, degraded, error };
    document.dispatchEvent(new CustomEvent('dd:auth-ready', { detail }));
    document.dispatchEvent(new CustomEvent('dd:member-access-ready', { detail: { ...detail, ok: loggedIn } }));
    document.dispatchEvent(new CustomEvent('dd:members-ready', { detail: { ...detail, ok: loggedIn } }));
    document.dispatchEvent(new CustomEvent('dd:admin-ready', { detail: { ...detail, ok: isAdmin } }));
    return true;
  }

  async function refreshAuthState() {
    const cachedUser = window.DDAuth.getStoredUser?.() || null;
    window.DDAuthUiState = { phase: cachedUser ? 'provisional' : 'checking', user: cachedUser, verified: false, degraded: false, last_error: null };
    applyUi(cachedUser);
    queueMicrotask(() => emitAuthEvents(cachedUser, null, { force: true, verified: false }));

    if (!window.DDAuth.isLoggedIn()) {
      if (!cachedUser) {
        window.DDAuthUiState = { phase: 'signed_out', user: null, verified: false, degraded: false, last_error: null };
        applyUi(null);
        queueMicrotask(() => emitAuthEvents(null, null, { force: true }));
      }
      return;
    }

    try {
      const data = await window.DDAuth.me();
      const user = data?.user || null;
      window.DDAuthUiState = { phase: user ? 'verified' : 'signed_out', user, verified: Boolean(user), degraded: false, last_error: null };
      applyUi(user);
      emitAuthEvents(user, data?.session || null, { force: true, verified: true });
      document.dispatchEvent(new CustomEvent('dd:auth-verified', { detail: { ok: true, logged_in: Boolean(user), user, session: data?.session || null } }));
    } catch (error) {
      const status = Number(error?.httpStatus || 0);
      if (status === 401 || status === 403 || !window.DDAuth.isLoggedIn()) {
        window.DDAuth.clearAuth();
        window.DDAuthUiState = { phase: 'rejected', user: null, verified: false, degraded: false, last_error: error };
        applyUi(null);
        emitAuthEvents(null, null, { force: true, error });
        document.dispatchEvent(new CustomEvent('dd:auth-rejected', { detail: { ok: false, http_status: status, error } }));
        return;
      }

      const retainedUser = window.DDAuth.getStoredUser?.() || cachedUser || null;
      window.DDAuthUiState = { phase: 'degraded', user: retainedUser, verified: false, degraded: true, last_error: error };
      applyUi(retainedUser, { degraded: true });
      emitAuthEvents(retainedUser, null, { force: true, degraded: true, error });
      document.dispatchEvent(new CustomEvent('dd:auth-degraded', { detail: { ok: false, session_retained: Boolean(retainedUser), user: retainedUser, http_status: status, code: String(error?.code || 'session_verification_unavailable'), ray: String(error?.cloudflareRay || '') } }));
    }
  }

  logoutButtons.forEach((button) => button.addEventListener('click', async () => { try { await window.DDAuth.logout(); } finally { window.location.href = '/'; } }));
  document.addEventListener('dd:auth-changed', (event) => {
    const user = event?.detail?.logged_in ? (event?.detail?.user || window.DDAuth.getStoredUser?.()) : null;
    window.DDAuthUiState = { phase: user ? 'provisional' : 'signed_out', user, verified: false, degraded: false, last_error: null };
    applyUi(user);
    emitAuthEvents(user, null, { force: true });
  });

  refreshAuthState();
});

if (window.location.pathname.startsWith('/admin')) {
  void import('/public/js/admin-context-help.js?v=448-context-help')
    .catch((error) => console.warn('[DD admin help] contextual help unavailable', error));
} else {
  void import('/public/js/core/dd-public-module-visibility.mjs?v=440')
    .catch((error) => console.warn('[DD modules] public navigation module visibility unavailable', error));
}
