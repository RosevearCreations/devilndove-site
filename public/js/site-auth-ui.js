// File: /public/js/site-auth-ui.js
// Brief description: Shared site-wide auth UI helper. It updates nav visibility,
// renders a top-right logged-in user menu, and emits page-level auth events.

document.addEventListener("DOMContentLoaded", () => {
  if (!window.DDAuth) return;

  const loggedInEls = Array.from(document.querySelectorAll("[data-show-when-logged-in]"));
  const loggedOutEls = Array.from(document.querySelectorAll("[data-show-when-logged-out]"));
  const adminEls = Array.from(document.querySelectorAll("[data-show-when-admin]"));
  const navUserNameEls = Array.from(document.querySelectorAll("[data-nav-user-name]"));
  const logoutButtons = Array.from(document.querySelectorAll("[data-nav-logout]"));
  const linksWrap = document.querySelector('.nav .links');
  let userMenuEl = null;

  function show(el, shouldShow) {
    if (!el) return;
    el.style.display = shouldShow ? "" : "none";
  }

  function getSafeUserName(user) {
    return String(user?.display_name || user?.email || 'Member').trim() || 'Member';
  }

  function ensureUserMenu() {
    if (!linksWrap) return null;
    if (userMenuEl) return userMenuEl;
    userMenuEl = document.createElement('div');
    userMenuEl.id = 'siteUserMenu';
    userMenuEl.style.display = 'none';
    userMenuEl.style.position = 'relative';
    userMenuEl.innerHTML = `
      <button class="btn" type="button" id="siteUserMenuButton">Account ▾</button>
      <div id="siteUserMenuPanel" class="card" style="display:none;position:absolute;right:0;top:100%;min-width:220px;z-index:50;margin-top:8px">
        <div class="small" id="siteUserMenuLabel" style="margin-bottom:10px"></div>
        <div style="display:grid;gap:8px">
          <a href="/members/" id="siteUserMenuMembers">Profile & Settings</a>
          <a href="/admin/" id="siteUserMenuAdmin" style="display:none">Admin Dashboard</a>
          <button class="btn" type="button" id="siteUserMenuLogout">Logout</button>
        </div>
      </div>
    `;
    linksWrap.appendChild(userMenuEl);
    const button = userMenuEl.querySelector('#siteUserMenuButton');
    const panel = userMenuEl.querySelector('#siteUserMenuPanel');
    const logout = userMenuEl.querySelector('#siteUserMenuLogout');
    button?.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    logout?.addEventListener('click', async () => {
      try { await window.DDAuth.logout(); } finally { window.location.href = '/'; }
    });
    document.addEventListener('click', (event) => {
      if (!userMenuEl?.contains(event.target)) {
        panel.style.display = 'none';
      }
    });
    return userMenuEl;
  }

  function applyUi(user) {
    const loggedIn = !!user;
    const role = String(user?.role || "").trim().toLowerCase();
    const isAdmin = loggedIn && role === "admin";
    const name = getSafeUserName(user);

    loggedInEls.forEach((el) => show(el, loggedIn));
    loggedOutEls.forEach((el) => show(el, !loggedIn));
    adminEls.forEach((el) => show(el, isAdmin));
    navUserNameEls.forEach((el) => { el.textContent = name; });

    const menu = ensureUserMenu();
    if (menu) {
      menu.style.display = loggedIn ? '' : 'none';
      const label = menu.querySelector('#siteUserMenuLabel');
      const adminLink = menu.querySelector('#siteUserMenuAdmin');
      if (label) label.textContent = `${name} • ${role || 'member'}`;
      if (adminLink) adminLink.style.display = isAdmin ? '' : 'none';
    }
  }

  function emitAuthEvents(user, session = null) {
    const loggedIn = !!user;
    const role = String(user?.role || "").trim().toLowerCase();
    const isAdmin = loggedIn && role === "admin";
    document.dispatchEvent(new CustomEvent("dd:auth-ready", { detail: { ok: true, logged_in: loggedIn, user, session } }));
    document.dispatchEvent(new CustomEvent("dd:member-access-ready", { detail: { ok: loggedIn, logged_in: loggedIn, user, session } }));
    document.dispatchEvent(new CustomEvent("dd:members-ready", { detail: { ok: loggedIn, logged_in: loggedIn, user, session } }));
    document.dispatchEvent(new CustomEvent("dd:admin-ready", { detail: { ok: isAdmin, logged_in: loggedIn, user, session } }));
  }

  async function refreshAuthState() {
    if (!window.DDAuth.isLoggedIn()) {
      window.DDAuth.setStoredUser(null);
      applyUi(null);
      emitAuthEvents(null, null);
      return;
    }
    try {
      const data = await window.DDAuth.me();
      applyUi(data?.user || null);
      emitAuthEvents(data?.user || null, data?.session || null);
    } catch {
      window.DDAuth.clearAuth();
      applyUi(null);
      emitAuthEvents(null, null);
    }
  }

  logoutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      try { await window.DDAuth.logout(); } finally { window.location.href = "/"; }
    });
  });

  document.addEventListener("dd:auth-changed", (event) => {
    const user = event?.detail?.logged_in ? (event?.detail?.user || window.DDAuth.getStoredUser()) : null;
    applyUi(user);
    emitAuthEvents(user, null);
  });

  applyUi(window.DDAuth.getStoredUser());
  refreshAuthState();
});
