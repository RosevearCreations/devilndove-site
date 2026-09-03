// Release 467 Build 30 — admin-selected temporary password reset with reveal/generate controls.
// Existing passwords are never returned: users.password_hash remains one-way authentication data.

document.addEventListener("DOMContentLoaded", () => {
  const mountEl = document.getElementById("usersAdminMount");
  if (!mountEl || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  let hasRendered = false;
  let selectedUser = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setMessage(message, isError = false) {
    const el = document.getElementById("adminResetPasswordMessage");
    if (!el) return;
    el.textContent = message;
    el.style.display = message ? "block" : "none";
    el.style.color = isError ? "#b00020" : "#0a7a2f";
  }

  function generateTemporaryPassword(length = 16) {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghijkmnopqrstuvwxyz";
    const digits = "23456789";
    const symbols = "!@#$%*-_";
    const all = upper + lower + digits + symbols;
    const values = new Uint32Array(Math.max(length, 12));
    crypto.getRandomValues(values);
    const pick = (chars, index) => chars[values[index] % chars.length];
    const required = [pick(upper, 0), pick(lower, 1), pick(digits, 2), pick(symbols, 3)];
    for (let i = 4; i < values.length; i += 1) required.push(pick(all, i));
    for (let i = required.length - 1; i > 0; i -= 1) {
      const j = values[i % values.length] % (i + 1);
      [required[i], required[j]] = [required[j], required[i]];
    }
    return required.join("");
  }

  function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    button.setAttribute("aria-pressed", showing ? "false" : "true");
    button.textContent = showing ? "👁 Show" : "🙈 Hide";
  }

  function passwordControl(inputId, name, label) {
    return `<div>
      <label class="small" for="${inputId}">${label}</label>
      <div style="display:flex;gap:8px;align-items:center">
        <input id="${inputId}" name="${name}" type="password" autocomplete="new-password" required style="flex:1"/>
        <button class="btn secondary" type="button" data-password-toggle="${inputId}" aria-pressed="false" aria-label="Show ${escapeHtml(label)}">👁 Show</button>
      </div>
    </div>`;
  }

  function renderSelectedUser() {
    const target = document.getElementById("adminResetPasswordTarget");
    const userIdEl = document.getElementById("adminResetPasswordUserId");
    if (userIdEl) userIdEl.value = selectedUser?.user_id ? String(selectedUser.user_id) : "";
    if (!target) return;
    target.innerHTML = selectedUser
      ? `<strong>${escapeHtml(selectedUser.email || `User #${selectedUser.user_id}`)}</strong><div class="small">${escapeHtml(selectedUser.display_name || selectedUser.preferred_name || "No display name")} • User ID ${escapeHtml(selectedUser.user_id)}</div>`
      : '<strong>No account selected.</strong><div class="small">Choose “Password” from the User Directory below, or enter a valid user ID manually.</div>';
  }

  function renderUi() {
    if (hasRendered) return;
    hasRendered = true;

    const card = document.createElement("div");
    card.className = "card";
    card.id = "adminResetPasswordCard";
    card.style.marginTop = "18px";
    card.innerHTML = `
      <h3 style="margin-top:0">Set / Reset User Password</h3>
      <p class="small" style="margin-top:0">An administrator can set a new temporary password without knowing the user's existing password. Stored existing passwords cannot be displayed because only a one-way password hash is retained.</p>
      <div id="adminResetPasswordTarget" class="card" style="padding:10px;margin-bottom:12px"></div>

      <form id="adminResetPasswordForm" class="grid" style="gap:12px">
        <div>
          <label class="small" for="adminResetPasswordUserId">User ID</label>
          <input id="adminResetPasswordUserId" name="user_id" type="number" min="1" step="1" required />
        </div>
        <div class="grid cols-2" style="gap:12px">
          ${passwordControl("adminResetPasswordNewPassword", "new_password", "New / Temporary Password")}
          ${passwordControl("adminResetPasswordConfirmPassword", "confirm_password", "Confirm Password")}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn secondary" type="button" id="adminGenerateTemporaryPassword">Generate Temporary Password</button>
          <button class="btn secondary" type="button" id="adminCopyTemporaryPassword">Copy Entered Password</button>
        </div>
        <label class="small" style="display:flex;gap:8px;align-items:flex-start">
          <input id="adminResetPasswordClearSessions" name="clear_sessions" type="checkbox" checked />
          <span>Clear the user’s other sessions after resetting the password</span>
        </label>
        <div class="small">After giving the temporary password to the user, they can change it from their Account page. The temporary value is never stored or returned in readable form by the server.</div>
        <div id="adminResetPasswordMessage" class="small" style="display:none"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" type="submit" id="adminResetPasswordSubmitButton">Set Password</button></div>
      </form>`;

    mountEl.appendChild(card);
    renderSelectedUser();

    card.querySelectorAll("[data-password-toggle]").forEach((button) => {
      button.addEventListener("click", () => togglePassword(button.dataset.passwordToggle, button));
    });

    document.getElementById("adminGenerateTemporaryPassword")?.addEventListener("click", () => {
      const value = generateTemporaryPassword();
      const password = document.getElementById("adminResetPasswordNewPassword");
      const confirm = document.getElementById("adminResetPasswordConfirmPassword");
      if (password) { password.value = value; password.type = "text"; }
      if (confirm) confirm.value = value;
      card.querySelector(`[data-password-toggle="adminResetPasswordNewPassword"]`)?.setAttribute("aria-pressed", "true");
      const toggle = card.querySelector(`[data-password-toggle="adminResetPasswordNewPassword"]`);
      if (toggle) toggle.textContent = "🙈 Hide";
      setMessage("Temporary password generated. Copy it before submitting if you need to give it to the user.");
    });

    document.getElementById("adminCopyTemporaryPassword")?.addEventListener("click", async () => {
      const value = String(document.getElementById("adminResetPasswordNewPassword")?.value || "");
      if (!value) return setMessage("Enter or generate a password first.", true);
      try {
        await navigator.clipboard.writeText(value);
        setMessage("Entered temporary password copied to the clipboard.");
      } catch {
        setMessage("Clipboard access was unavailable. Use the eye button and copy the value manually.", true);
      }
    });

    document.getElementById("adminResetPasswordUserId")?.addEventListener("input", (event) => {
      const id = Number(event.target.value || 0);
      if (!selectedUser || Number(selectedUser.user_id) !== id) selectedUser = id > 0 ? { user_id: id, email: "", display_name: "" } : null;
      renderSelectedUser();
    });

    document.getElementById("adminResetPasswordForm")?.addEventListener("submit", handleSubmit);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const user_id = Number(document.getElementById("adminResetPasswordUserId")?.value || 0);
    const new_password = String(document.getElementById("adminResetPasswordNewPassword")?.value || "");
    const confirm_password = String(document.getElementById("adminResetPasswordConfirmPassword")?.value || "");
    const clear_sessions = !!document.getElementById("adminResetPasswordClearSessions")?.checked;
    const submitButton = document.getElementById("adminResetPasswordSubmitButton");

    if (!Number.isInteger(user_id) || user_id <= 0) return setMessage("Select a user or enter a valid user ID.", true);
    if (new_password.length < 8) return setMessage("New password must be at least 8 characters.", true);
    if (new_password !== confirm_password) return setMessage("Passwords do not match.", true);

    const originalText = submitButton?.textContent || "Set Password";
    try {
      setMessage("Setting password...");
      if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Saving..."; }
      const response = await window.DDAuth.apiFetch("/api/admin/reset-password", {
        method: "POST",
        body: JSON.stringify({ user_id, new_password, confirm_password, clear_sessions })
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Failed to reset password.");

      const password = document.getElementById("adminResetPasswordNewPassword");
      const confirm = document.getElementById("adminResetPasswordConfirmPassword");
      if (password) { password.value = ""; password.type = "password"; }
      if (confirm) { confirm.value = ""; confirm.type = "password"; }
      document.getElementById("adminResetPasswordClearSessions").checked = true;
      setMessage(`Password set successfully for ${data?.user?.email || `user #${user_id}`}. ${Number(data?.sessions?.deleted_sessions || 0)} other session(s) cleared.`);
      document.dispatchEvent(new CustomEvent("dd:user-updated", { detail: { action: "password_reset", user: data?.user || null } }));
    } catch (error) {
      setMessage(error.message || "Failed to reset password.", true);
    } finally {
      if (submitButton) { submitButton.disabled = false; submitButton.textContent = originalText; }
    }
  }

  document.addEventListener("dd:admin-reset-password-target", (event) => {
    const user = event?.detail?.user || null;
    if (!user?.user_id) return;
    selectedUser = user;
    renderUi();
    renderSelectedUser();
    document.getElementById("adminResetPasswordCard")?.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("adminResetPasswordNewPassword")?.focus();
    setMessage(`Selected ${user.email || `user #${user.user_id}`}. Enter or generate a temporary password.`);
  });

  document.addEventListener("dd:admin-ready", (event) => { if (event?.detail?.ok) renderUi(); });
  renderUi();
});
