// File: /public/js/site-auth-ui.js
// Build 233: temporary Worker/network failures no longer erase a valid browser session.
// Only an explicit 401/403 authentication response clears credentials.

document.addEventListener("DOMContentLoaded", () => {
  if (!window.DDAuth) return;

  const loggedInEls = Array.from(document.querySelectorAll("[data-show-when-logged-in]"));
  const loggedOutEls = Array.from(document.querySelectorAll("[data-show-when-logged-out]"));
  const adminEls = Array.from(document.querySelectorAll("[data-show-when-admin]"));
  const navUserNameEls = Array.from(document.querySelectorAll("[data-nav-user-name]"));
  const logoutButtons = Array.from(document.querySelectorAll("[data-nav-logout]"));
  const linksWrap = document.querySelector('.nav .links');
  let floatingWidgetEl = null;
  let lastAuthReadySignature = '';

  function show(el, shouldShow) { if (el) el.style.display = shouldShow ? "" : "none"; }
  function getSafeUserName(user) { return String(user?.display_name || user?.email || 'Member').trim() || 'Member'; }

  function ensureFloatingWidget() {
    if (floatingWidgetEl) return floatingWidgetEl;
    floatingWidgetEl = document.createElement('aside');
    floatingWidgetEl.id = 'ddAuthWidget';
    floatingWidgetEl.className = 'dd-auth-widget card';
    floatingWidgetEl.innerHTML = `
      <div class="dd-auth-widget-head">
        <div>
          <div class="dd-auth-widget-title">Account</div>
          <div class="small" id="ddAuthWidgetState">Checking session…</div>
        </div>
        <button class="btn" type="button" id="ddAuthWidgetToggle">Open</button>
      </div>
      <div class="dd-auth-widget-body" id="ddAuthWidgetBody" style="display:none">
        <div id="ddAuthWidgetLoggedIn" style="display:none">
          <div class="small" id="ddAuthWidgetUserLabel" style="margin-bottom:10px"></div>
          <div class="dd-auth-widget-links">
            <a href="/members/index.html">Settings</a>
            <a href="/members/index.html#orders">Orders</a>
            <a href="/admin/index.html" id="ddAuthWidgetAdminLink" style="display:none">Admin Dashboard</a>
            <button class="btn" type="button" id="ddAuthWidgetLogout">Logout</button>
          </div>
        </div>
        <div id="ddAuthWidgetLoggedOut" style="display:none">
          <div class="small" style="margin-bottom:10px">You are currently logged out.</div>
          <div class="dd-auth-widget-links">
            <a href="/login/index.html">Login</a>
            <a href="/register/index.html">Create account</a>
            <a href="/account-help/index.html?mode=password">Forgot password</a>
            <a href="/account-help/index.html?mode=email">Forgot email</a>
          </div>
        </div>
      </div>`;
    document.body.appendChild(floatingWidgetEl);
    const toggle = floatingWidgetEl.querySelector('#ddAuthWidgetToggle');
    const body = floatingWidgetEl.querySelector('#ddAuthWidgetBody');
    const logout = floatingWidgetEl.querySelector('#ddAuthWidgetLogout');
    toggle?.addEventListener('click', () => {
      body.style.display = body.style.display === 'none' ? 'block' : 'block';
      if (body.style.display === 'block' && toggle.textContent === 'Open') toggle.textContent = 'Close';
      else if (toggle.textContent === 'Close') { body.style.display = 'none'; toggle.textContent = 'Open'; }
    });
    logout?.addEventListener('click', async () => {
      try { await window.DDAuth.logout(); } finally { window.location.href = '/'; }
    });
    return floatingWidgetEl;
  }

  function applyUi(user) {
    const loggedIn = !!user;
    const role = String(user?.role || "").trim().toLowerCase();
    const isAdmin = loggedIn && role === 'admin';
    const name = getSafeUserName(user);
    loggedInEls.forEach((el) => show(el, loggedIn));
    loggedOutEls.forEach((el) => show(el, !loggedIn));
    adminEls.forEach((el) => show(el, isAdmin));
    navUserNameEls.forEach((el) => { el.textContent = name; });
    const widget = ensureFloatingWidget();
    if (widget) {
      const state = widget.querySelector('#ddAuthWidgetState');
      const loggedInWrap = widget.querySelector('#ddAuthWidgetLoggedIn');
      const loggedOutWrap = widget.querySelector('#ddAuthWidgetLoggedOut');
      const label = widget.querySelector('#ddAuthWidgetUserLabel');
      const adminLink = widget.querySelector('#ddAuthWidgetAdminLink');
      if (state) state.textContent = loggedIn ? `${name} • ${role || 'member'}` : 'Not logged in';
      if (label) label.textContent = loggedIn ? `Signed in as ${name} (${user?.email || 'no email'})` : '';
      if (adminLink) adminLink.style.display = isAdmin ? '' : 'none';
      show(loggedInWrap, loggedIn);
      show(loggedOutWrap, !loggedIn);
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
      const nameEl = statusEl?.querySelector('[data-nav-user-name]');
      if (nameEl) nameEl.textContent = name;
    }
  }

  function emitAuthEvents(user, session = null, { force = false } = {}) {
    const loggedIn = !!user;
    const role = String(user?.role || "").trim().toLowerCase();
    const isAdmin = loggedIn && role === 'admin';
    const signature = `${loggedIn ? 1 : 0}:${Number(user?.user_id || 0)}:${role}`;
    if (!force && signature === lastAuthReadySignature) return false;
    lastAuthReadySignature = signature;
    const detail = { ok: true, logged_in: loggedIn, user, session };
    document.dispatchEvent(new CustomEvent('dd:auth-ready', { detail }));
    document.dispatchEvent(new CustomEvent('dd:member-access-ready', { detail: { ...detail, ok: loggedIn } }));
    document.dispatchEvent(new CustomEvent('dd:members-ready', { detail: { ...detail, ok: loggedIn } }));
    document.dispatchEvent(new CustomEvent('dd:admin-ready', { detail: { ...detail, ok: isAdmin } }));
    return true;
  }

  async function refreshAuthState() {
    const cachedUser = window.DDAuth.getStoredUser();
    if (cachedUser) {
      applyUi(cachedUser);
      emitAuthEvents(cachedUser, null);
    }
    if (!window.DDAuth.isLoggedIn()) {
      if (!cachedUser) {
        applyUi(null);
        emitAuthEvents(null, null);
      }
      return;
    }
    try {
      const data = await window.DDAuth.me();
      applyUi(data?.user || null);
      emitAuthEvents(data?.user || null, data?.session || null);
      document.dispatchEvent(new CustomEvent('dd:auth-verified', { detail: { ok: true, logged_in: !!data?.user, user: data?.user || null, session: data?.session || null } }));
    } catch (error) {
      const status = Number(error?.httpStatus || 0);
      const authenticationRejected = status === 401 || status === 403;
      if (authenticationRejected || !window.DDAuth.isLoggedIn()) {
        window.DDAuth.clearAuth();
        applyUi(null);
        emitAuthEvents(null, null);
        return;
      }

      // A 5xx, Cloudflare 1102, timeout, offline response, or malformed upstream
      // response is not proof that the session is invalid. Preserve the token and
      // cached identity so the owner can retry after the service recovers.
      const retainedUser = window.DDAuth.getStoredUser();
      applyUi(retainedUser);
      emitAuthEvents(retainedUser, null);
      document.dispatchEvent(new CustomEvent('dd:auth-degraded', {
        detail: {
          ok: false,
          session_retained: true,
          http_status: status,
          code: String(error?.code || 'session_verification_unavailable')
        }
      }));
      const widgetState = document.getElementById('ddAuthWidgetState');
      if (widgetState) widgetState.textContent = 'Session retained • verification temporarily unavailable';
    }
  }

  logoutButtons.forEach((button) => button.addEventListener('click', async () => {
    try { await window.DDAuth.logout(); } finally { window.location.href = '/'; }
  }));

  document.addEventListener('dd:auth-changed', (event) => {
    const user = event?.detail?.logged_in ? (event?.detail?.user || window.DDAuth.getStoredUser()) : null;
    applyUi(user);
    emitAuthEvents(user, null);
  });

  applyUi(window.DDAuth.getStoredUser());
  refreshAuthState();
});
