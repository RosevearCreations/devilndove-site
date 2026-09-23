// File: /public/js/admin-security-summary.js

document.addEventListener("DOMContentLoaded", () => {
  const mountTargets = [
    document.getElementById("accessTiersAdminMount"),
    document.getElementById("usersAdminMount")
  ].filter(Boolean);

  if (!mountTargets.length || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  let hasRendered = false;
  let isLoading = false;

  function formatCount(value) {
    const count = Number(value || 0);
    return Number.isFinite(count) ? count.toLocaleString() : "0";
  }

  function setMessage(message, isError = false) {
    const el = document.getElementById("adminSecuritySummaryMessage");
    if (!el) return;

    el.textContent = message;
    el.style.display = message ? "block" : "none";
    el.style.color = isError ? "#b00020" : "";
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
  }

  function renderUi() {
    if (hasRendered) return;
    hasRendered = true;

    const container = document.createElement("div");
    container.className = "card";
    container.style.marginTop = "18px";
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div>
          <h3 style="margin:0">Security Overview</h3>
          <p class="small" style="margin:8px 0 0 0">
            Basic security health for users, sessions, admin access, and bootstrap state.
          </p>
        </div>

        <button class="btn" type="button" id="refreshAdminSecuritySummaryButton">
          Refresh Security
        </button>
      </div>

      <div id="adminSecuritySummaryMessage" class="small" style="display:none;margin-top:12px"></div>

      <div class="grid cols-4" style="gap:12px;margin-top:14px">
        <div class="card">
          <div class="small">Total Users</div>
          <div id="securityTotalUsers" style="font-size:1.35rem;font-weight:800">—</div>
        </div>

        <div class="card">
          <div class="small">Active Users</div>
          <div id="securityActiveUsers" style="font-size:1.35rem;font-weight:800">—</div>
        </div>

        <div class="card">
          <div class="small">Inactive Users</div>
          <div id="securityInactiveUsers" style="font-size:1.35rem;font-weight:800">—</div>
        </div>

        <div class="card">
          <div class="small">Admin Users</div>
          <div id="securityAdminUsers" style="font-size:1.35rem;font-weight:800">—</div>
        </div>
      </div>

      <div class="grid cols-4" style="gap:12px;margin-top:12px">
        <div class="card">
          <div class="small">Active Admins</div>
          <div id="securityActiveAdmins" style="font-size:1.35rem;font-weight:800">—</div>
        </div>

        <div class="card">
          <div class="small">Total Sessions</div>
          <div id="securityTotalSessions" style="font-size:1.35rem;font-weight:800">—</div>
        </div>

        <div class="card">
          <div class="small">Active Sessions</div>
          <div id="securityActiveSessions" style="font-size:1.35rem;font-weight:800">—</div>
        </div>

        <div class="card">
          <div class="small">Expired Sessions</div>
          <div id="securityExpiredSessions" style="font-size:1.35rem;font-weight:800">—</div>
        </div>
      </div>

      <div class="grid cols-2" style="gap:12px;margin-top:12px">
        <div class="card">
          <div class="small">Expiring Within 7 Days</div>
          <div id="securityExpiringSoonSessions" style="font-size:1.35rem;font-weight:800">—</div>
        </div>
        <div class="card">
          <div class="small">Stale Expired Sessions</div>
          <div id="securityStaleExpiredSessions" style="font-size:1.35rem;font-weight:800">—</div>
        </div>
      </div>

      <div class="card" style="margin-top:12px">
        <div class="small">Security Controls</div>
        <div id="securityControlStatus" class="small" style="margin-top:6px">—</div>
      </div>

      <div class="card" style="margin-top:12px">
        <div class="small">Bootstrap Status</div>
        <div id="securityBootstrapStatus" style="font-size:1.1rem;font-weight:700;margin-top:4px">—</div>
      </div>
    `;

    mountTargets[0].appendChild(container);

    const refreshButton = document.getElementById("refreshAdminSecuritySummaryButton");
    if (refreshButton) {
      refreshButton.addEventListener("click", async () => {
        await loadSummary();
      });
    }
  }

  async function fetchSummary() {
    const response = await window.DDAuth.apiFetch("/api/admin/security-summary", {
      method: "GET"
    });

    const data = await response.json();

    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "Failed to load security summary.");
    }

    return { summary: data.summary || {}, controls: data.security_controls || {} };
  }

  function renderSummary(summary, controls = {}) {
    setValue("securityTotalUsers", formatCount(summary.total_users));
    setValue("securityActiveUsers", formatCount(summary.active_users));
    setValue("securityInactiveUsers", formatCount(summary.inactive_users));
    setValue("securityAdminUsers", formatCount(summary.admin_users));
    setValue("securityActiveAdmins", formatCount(summary.active_admin_users));
    setValue("securityTotalSessions", formatCount(summary.total_sessions));
    setValue("securityActiveSessions", formatCount(summary.active_sessions));
    setValue("securityExpiredSessions", formatCount(summary.expired_sessions));
    setValue("securityExpiringSoonSessions", formatCount(summary.expiring_soon_sessions));
    setValue("securityStaleExpiredSessions", formatCount(summary.stale_expired_sessions));
    setValue("securityControlStatus",
      `Cookie-first sessions: ${controls.session_mode === "http_only_cookie" ? "ON" : "CHECK"} • ` +
      `Origin guard: ${controls.mutation_origin_guard ? "ON" : "CHECK"} • ` +
      `Nonce CSP: ${controls.runtime_script_nonce_csp ? "ON" : "CHECK"} • ` +
      `Login throttle: ${controls.login_throttle?.enabled ? "ON" : "CHECK"} • ` +
      `Admin cleanup step-up: ${controls.admin_session_cleanup_step_up ? "ON" : "CHECK"}`
    );
    setValue(
      "securityBootstrapStatus",
      summary.bootstrap_required ? "Bootstrap Still Open" : "Bootstrap Locked"
    );
  }

  async function loadSummary() {
    if (isLoading) return;

    const refreshButton = document.getElementById("refreshAdminSecuritySummaryButton");
    const originalText = refreshButton?.textContent || "Refresh Security";

    isLoading = true;

    try {
      setMessage("Loading security overview...");

      if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.textContent = "Loading...";
      }

      const result = await fetchSummary();
      renderSummary(result.summary, result.controls);
      setMessage("Security overview loaded.");
    } catch (error) {
      setMessage(error.message || "Failed to load security overview.", true);
    } finally {
      isLoading = false;

      if (refreshButton) {
        refreshButton.disabled = false;
        refreshButton.textContent = originalText;
      }
    }
  }

  document.addEventListener("dd:admin-ready", async (event) => {
    if (!event?.detail?.ok) return;
    renderUi();
    await loadSummary();
  });

  document.addEventListener("dd:order-updated", async () => {
    if (!hasRendered) return;
    await loadSummary();
  });

  renderUi();
  loadSummary();
});
