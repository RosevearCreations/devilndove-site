// File: /public/js/site-auth-ui.js

document.addEventListener("DOMContentLoaded", () => {
  const loggedInEls = Array.from(document.querySelectorAll("[data-show-when-logged-in]"));
  const loggedOutEls = Array.from(document.querySelectorAll("[data-show-when-logged-out]"));
  const adminEls = Array.from(document.querySelectorAll("[data-show-when-admin]"));
  const userNameEls = Array.from(document.querySelectorAll("[data-nav-user-name]"));
  const logoutButtons = Array.from(document.querySelectorAll("[data-nav-logout]"));

  let currentUser = null;
  let isRefreshing = false;

  function show(el) {
    if (!el) return;
    el.style.display = "";
  }

  function hide(el) {
    if (!el) return;
    el.style.display = "none";
  }

  function normalizeRole(value) {
    return String(value || "").trim().toLowerCase();
  }

  function isActiveUser(user) {
    return user?.is_active === true || Number(user?.is_active || 0) === 1;
  }

  function isAdminUser(user) {
    return normalizeRole(user?.role) === "admin";
  }

  function getDisplayName(user) {
    return (
      String(user?.display_name || "").trim() ||
      String(user?.email || "").trim() ||
      "Member"
    );
  }

  function updateUserName(user) {
    const name = getDisplayName(user);
    userNameEls.forEach((el) => {
      el.textContent = name;
    });
  }

  function applyLoggedOutUi() {
    loggedInEls.forEach(hide);
    adminEls.forEach(hide);
    loggedOutEls.forEach(show);

    userNameEls.forEach((el) => {
      el.textContent = "Member";
    });
  }

  function applyLoggedInUi(user) {
    loggedOutEls.forEach(hide);
    loggedInEls.forEach(show);

    if (isAdminUser(user)) {
      adminEls.forEach(show);
    } else {
      adminEls.forEach(hide);
    }

    updateUserName(user);
  }

  function applyUiForCurrentUser() {
    if (!currentUser || !isActiveUser(currentUser)) {
      applyLoggedOutUi();
      return;
    }

    applyLoggedInUi(currentUser);
  }

  function dispatchAuthChanged(detail = {}) {
    document.dispatchEvent(new CustomEvent("dd:auth-changed", { detail }));
  }

  async function refreshAuthUi() {
    if (isRefreshing) return currentUser;

    isRefreshing = true;

    try {
      if (!window.DDAuth || !window.DDAuth.isLoggedIn()) {
        currentUser = null;
        applyLoggedOutUi();
        dispatchAuthChanged({ ok: true, logged_in: false, user: null });
        return null;
      }

      const me = await window.DDAuth.fetchMe();

      if (!me || !isActiveUser(me)) {
        currentUser = null;
        applyLoggedOutUi();
        dispatchAuthChanged({ ok: true, logged_in: false, user: null });
        return null;
      }

      currentUser = me;
      applyUiForCurrentUser();
      dispatchAuthChanged({ ok: true, logged_in: true, user: currentUser });

      return currentUser;
    } catch (error) {
      currentUser = null;
      applyLoggedOutUi();
      dispatchAuthChanged({
        ok: false,
        logged_in: false,
        user: null,
        error: error?.message || "Session could not be verified."
      });

      return null;
    } finally {
      isRefreshing = false;
    }
  }

  async function handleLogoutClick(button) {
    if (!window.DDAuth || !window.DDAuth.logout) {
      applyLoggedOutUi();
      return;
    }

    const originalText = button?.textContent || "Logout";

    try {
      if (button) {
        button.disabled = true;
        button.textContent = "Logging out...";
      }

      await window.DDAuth.logout();
    } catch {
      // ignore logout cleanup failure and still reset UI
    } finally {
      currentUser = null;
      applyLoggedOutUi();
      dispatchAuthChanged({ ok: true, logged_in: false, user: null });

      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }

    const isProtectedPage =
      window.location.pathname.startsWith("/admin/") ||
      window.location.pathname.startsWith("/members/");

    if (isProtectedPage) {
      window.location.href = "/login/";
    }
  }

  logoutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await handleLogoutClick(button);
    });
  });

  applyLoggedOutUi();
  refreshAuthUi();
});
