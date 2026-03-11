document.addEventListener("DOMContentLoaded", async () => {
  const nameEls = document.querySelectorAll("[data-user-name]");
  const emailEls = document.querySelectorAll("[data-user-email]");
  const roleEls = document.querySelectorAll("[data-user-role]");
  const logoutButtons = document.querySelectorAll("[data-logout]");
  const authOnlyEls = document.querySelectorAll("[data-auth-only]");
  const guestOnlyEls = document.querySelectorAll("[data-guest-only]");
  const statusEl = document.getElementById("memberStatus");

  function setStatus(message, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.display = "block";
    statusEl.style.color = isError ? "#b00020" : "#0a7a2f";
  }

  function hideStatus() {
    if (!statusEl) return;
    statusEl.textContent = "";
    statusEl.style.display = "none";
  }

  function fillUser(user) {
    const displayName =
      user?.display_name?.trim() || user?.email || "Member";

    nameEls.forEach(el => {
      el.textContent = displayName;
    });

    emailEls.forEach(el => {
      el.textContent = user?.email || "";
    });

    roleEls.forEach(el => {
      el.textContent = user?.role || "member";
    });

    authOnlyEls.forEach(el => {
      el.style.display = "";
    });

    guestOnlyEls.forEach(el => {
      el.style.display = "none";
    });
  }

  function redirectToLogin() {
    const next = encodeURIComponent(window.location.pathname);
    window.location.href = `/login/?next=${next}`;
  }

  try {
    hideStatus();

    if (!window.DDAuth || !window.DDAuth.isLoggedIn()) {
      redirectToLogin();
      return;
    }

    const user = await window.DDAuth.fetchMe();
    fillUser(user);
  } catch (error) {
    if (window.DDAuth) {
      window.DDAuth.clearAuth();
    }
    redirectToLogin();
    return;
  }

  logoutButtons.forEach(button => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      setStatus("Logging out...");

      try {
        await window.DDAuth.logout();
        window.location.href = "/login/";
      } catch (error) {
        setStatus(error.message || "Logout failed.", true);
        button.disabled = false;
      }
    });
  });
});
