// File: /public/js/site-auth-ui.js
// Brief description: Shared site-wide auth UI helper. It reads the current session,
// updates nav visibility for logged-in/member/admin states, wires logout buttons,
// and emits the page-level auth events used by the member and admin pages.

document.addEventListener("DOMContentLoaded", () => {
  if (!window.DDAuth) return;

  const loggedInEls = Array.from(document.querySelectorAll("[data-show-when-logged-in]"));
  const loggedOutEls = Array.from(document.querySelectorAll("[data-show-when-logged-out]"));
  const adminEls = Array.from(document.querySelectorAll("[data-show-when-admin]"));
  const navUserNameEls = Array.from(document.querySelectorAll("[data-nav-user-name]"));
  const logoutButtons = Array.from(document.querySelectorAll("[data-nav-logout]"));

  function show(el, shouldShow) {
    if (!el) return;
    el.style.display = shouldShow ? "" : "none";
  }

  function getSafeUserName(user) {
    const displayName = String(user?.display_name || "").trim();
    const email = String(user?.email || "").trim();

    if (displayName) return displayName;
    if (email) return email;
    return "Member";
  }

  function applyUi(user) {
    const loggedIn = !!user;
    const role = String(user?.role || "").trim().toLowerCase();
    const isAdmin = loggedIn && role === "admin";
    const name = getSafeUserName(user);

    loggedInEls.forEach((el) => show(el, loggedIn));
    loggedOutEls.forEach((el) => show(el, !loggedIn));
    adminEls.forEach((el) => show(el, isAdmin));

    navUserNameEls.forEach((el) => {
      el.textContent = name;
    });
  }

  function emitAuthEvents(user, session = null) {
    const loggedIn = !!user;
    const role = String(user?.role || "").trim().toLowerCase();
    const isAdmin = loggedIn && role === "admin";

    document.dispatchEvent(new CustomEvent("dd:auth-ready", {
      detail: {
        ok: true,
        logged_in: loggedIn,
        user,
        session
      }
    }));

    document.dispatchEvent(new CustomEvent("dd:member-access-ready", {
      detail: {
        ok: loggedIn,
        logged_in: loggedIn,
        user,
        session
      }
    }));

    document.dispatchEvent(new CustomEvent("dd:members-ready", {
      detail: {
        ok: loggedIn,
        logged_in: loggedIn,
        user,
        session
      }
    }));

    document.dispatchEvent(new CustomEvent("dd:admin-ready", {
      detail: {
        ok: isAdmin,
        logged_in: loggedIn,
        user,
        session
      }
    }));
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
      const user = data?.user || null;
      const session = data?.session || null;

      applyUi(user);
      emitAuthEvents(user, session);
    } catch {
      window.DDAuth.clearAuth();
      applyUi(null);
      emitAuthEvents(null, null);
    }
  }

  logoutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const originalText = button.textContent;

      try {
        button.disabled = true;
        button.textContent = "Logging Out...";
        await window.DDAuth.logout();
      } catch {
        window.DDAuth.clearAuth();
      } finally {
        button.disabled = false;
        button.textContent = originalText;
        applyUi(null);
        emitAuthEvents(null, null);
        window.location.href = "/";
      }
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
