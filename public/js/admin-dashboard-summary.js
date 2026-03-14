document.addEventListener("DOMContentLoaded", async () => {
  const totalUsersEl = document.getElementById("summaryTotalUsers");
  const activeUsersEl = document.getElementById("summaryActiveUsers");
  const inactiveUsersEl = document.getElementById("summaryInactiveUsers");
  const adminUsersEl = document.getElementById("summaryAdminUsers");
  const activeSessionsEl = document.getElementById("summaryActiveSessions");
  const errorEl = document.getElementById("dashboardSummaryError");
  const refreshButtons = document.querySelectorAll("[data-refresh-dashboard]");

  function show(el) {
    if (el) el.style.display = "";
  }

  function hide(el) {
    if (el) el.style.display = "none";
  }

  function setText(el, value) {
    if (el) el.textContent = String(value);
  }

  async function loadSummary() {
    hide(errorEl);

    try {
      const response = await window.DDAuth.apiFetch("/api/admin/dashboard-summary", {
        method: "GET"
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to load dashboard summary.");
      }

      const summary = data.summary || {};

      setText(totalUsersEl, Number(summary.total_users || 0));
      setText(activeUsersEl, Number(summary.active_users || 0));
      setText(inactiveUsersEl, Number(summary.inactive_users || 0));
      setText(adminUsersEl, Number(summary.admin_users || 0));
      setText(activeSessionsEl, Number(summary.active_sessions || 0));
    } catch (error) {
      if (errorEl) {
        errorEl.textContent = error.message || "Failed to load dashboard summary.";
      }
      show(errorEl);
    }
  }

  refreshButtons.forEach(button => {
    button.addEventListener("click", async () => {
      await loadSummary();
    });
  });

  document.addEventListener("dd:user-created", async () => {
    await loadSummary();
  });

  document.addEventListener("dd:session-changed", async () => {
    await loadSummary();
  });

  document.addEventListener("dd:admin-data-changed", async () => {
    await loadSummary();
  });

  if (!window.DDAuth || !window.DDAuth.isLoggedIn()) {
    return;
  }

  await loadSummary();
});
