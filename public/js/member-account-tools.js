// File: /public/js/member-account-tools.js

document.addEventListener("DOMContentLoaded", () => {
  const mountEl = document.getElementById("memberAccountToolsMount");

  if (!mountEl || !window.DDAuth) return;

  let hasRendered = false;

  function renderTools() {
    if (hasRendered) return;
    hasRendered = true;

    mountEl.innerHTML = `
      <div class="grid cols-2" style="gap:18px">
        <div class="card">
          <h3 style="margin-top:0">Change Password</h3>
          <form id="changePasswordForm" class="grid" style="gap:12px">
            <div>
              <label class="small" for="currentPassword">Current Password</label>
              <input id="currentPassword" type="password" autocomplete="current-password" />
            </div>

            <div>
              <label class="small" for="newPassword">New Password</label>
              <input id="newPassword" type="password" autocomplete="new-password" />
            </div>

            <div>
              <label class="small" for="confirmNewPassword">Confirm New Password</label>
              <input id="confirmNewPassword" type="password" autocomplete="new-password" />
            </div>

            <div id="changePasswordMessage" class="small" style="display:none"></div>

            <div>
              <button class="btn" type="submit" id="changePasswordSubmitButton">
                Change Password
              </button>
            </div>
          </form>
        </div>

        <div class="card">
          <h3 style="margin-top:0">Session Tools</h3>
          <p class="small" style="margin-top:0">
            Manage your current session and sign out from all other devices if needed.
          </p>

          <div id="memberSessionToolsMessage" class="small" style="display:none;margin-bottom:10px"></div>

          <div style="display:grid;gap:10px">
            <button class="btn" type="button" id="logoutAllSessionsButton">
              Logout All Sessions
            </button>
          </div>
        </div>
      </div>
    `;

    attachSessionTools();
  }

  function setSessionToolsMessage(message, isError = false) {
    const messageEl = document.getElementById("memberSessionToolsMessage");
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.style.display = message ? "block" : "none";
    messageEl.style.color = isError ? "#b00020" : "";
  }

  function attachSessionTools() {
    const logoutAllButton = document.getElementById("logoutAllSessionsButton");
    if (!logoutAllButton) return;

    logoutAllButton.addEventListener("click", async () => {
      const originalText = logoutAllButton.textContent || "Logout All Sessions";

      try {
        setSessionToolsMessage("Logging out other sessions...");

        logoutAllButton.disabled = true;
        logoutAllButton.textContent = "Working...";

        await window.DDAuth.logoutAll();

        setSessionToolsMessage("All sessions were logged out successfully.");
        document.dispatchEvent(new CustomEvent("dd:auth-changed", {
          detail: { ok: true, logged_in: false, user: null }
        }));

        window.location.href = "/login/";
      } catch (error) {
        setSessionToolsMessage(error.message || "Could not logout all sessions.", true);
      } finally {
        logoutAllButton.disabled = false;
        logoutAllButton.textContent = originalText;
      }
    });
  }

  document.addEventListener("dd:members-ready", (event) => {
    if (!event?.detail?.ok) return;
    renderTools();
  });

  document.addEventListener("dd:member-access-ready", (event) => {
    if (!event?.detail?.ok) return;
    renderTools();
  });
});
