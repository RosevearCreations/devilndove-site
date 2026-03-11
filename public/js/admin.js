document.addEventListener("DOMContentLoaded", async () => {
  const statusEl = document.getElementById("adminStatus");
  const adminOnlyEls = document.querySelectorAll("[data-admin-only]");
  const notAdminEls = document.querySelectorAll("[data-not-admin]");

  function setStatus(message, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.display = "block";
    statusEl.style.color = isError ? "#b00020" : "#0a7a2f";
  }

  function showAdmin() {
    adminOnlyEls.forEach(el => {
      el.style.display = "";
    });
    notAdminEls.forEach(el => {
      el.style.display = "none";
    });
  }

  function showNotAdmin(message = "You do not have permission to view this page.") {
    adminOnlyEls.forEach(el => {
      el.style.display = "none";
    });
    notAdminEls.forEach(el => {
      el.style.display = "";
    });
    setStatus(message, true);
  }

  function redirectToLogin() {
    const next = encodeURIComponent(window.location.pathname);
    window.location.href = `/login/?next=${next}`;
  }

  try {
    if (!window.DDAuth || !window.DDAuth.isLoggedIn()) {
      redirectToLogin();
      return;
    }

    const user = await window.DDAuth.fetchMe();

    if (!user || user.role !== "admin") {
      showNotAdmin();
      return;
    }

    showAdmin();
    setStatus("Admin access verified.");
  } catch (error) {
    if (window.DDAuth) {
      window.DDAuth.clearAuth();
    }
    redirectToLogin();
  }
});
