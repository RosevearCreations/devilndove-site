// Release 467 Build 30 — member password change with explicit reveal/hide controls.
// Eye buttons reveal only values the user has typed; stored passwords remain one-way hashes.

document.addEventListener("DOMContentLoaded", () => {
  const mountEl = document.getElementById("memberAccountToolsMount");
  if (!mountEl || !window.DDAuth) return;
  let hasRendered = false;

  function setMessage(message, isError = false) {
    const el = document.getElementById("memberChangePasswordMessage");
    if (!el) return;
    el.textContent = message;
    el.style.display = message ? "block" : "none";
    el.style.color = isError ? "#b00020" : "#0a7a2f";
  }
  function togglePassword(inputId, button) {
    const input = document.getElementById(inputId); if (!input) return;
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    button.setAttribute("aria-pressed", showing ? "false" : "true");
    button.textContent = showing ? "👁 Show" : "🙈 Hide";
  }
  function passwordInput(id, name, label, autocomplete) {
    return `<div><label class="small" for="${id}">${label}</label><div style="display:flex;gap:8px;align-items:center"><input id="${id}" name="${name}" type="password" autocomplete="${autocomplete}" required style="flex:1"/><button class="btn secondary" type="button" data-password-toggle="${id}" aria-pressed="false">👁 Show</button></div></div>`;
  }

  function renderUi() {
    if (hasRendered) return;
    hasRendered = true;
    const card = document.createElement("div");
    card.className = "card";
    card.style.marginTop = "18px";
    card.innerHTML = `
      <h4 style="margin-top:0">Change Password</h4>
      <p class="small" style="margin-top:0">Update your password for this account. Use the eye buttons to read what you have typed in regular text. The site cannot display the stored existing password because it is retained only as a one-way hash.</p>
      <form id="memberChangePasswordForm" class="grid" style="gap:12px">
        <input id="memberChangePasswordUsername" name="username" type="email" autocomplete="username" hidden tabindex="-1" aria-hidden="true" value=""/>
        ${passwordInput("memberCurrentPassword","current_password","Current Password","current-password")}
        ${passwordInput("memberNewPassword","new_password","New Password","new-password")}
        ${passwordInput("memberConfirmNewPassword","confirm_new_password","Confirm New Password","new-password")}
        <div id="memberChangePasswordMessage" class="small" style="display:none"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" type="submit" id="memberChangePasswordButton">Change Password</button></div>
      </form>`;
    mountEl.appendChild(card);
    card.querySelectorAll("[data-password-toggle]").forEach((button) => button.addEventListener("click", () => togglePassword(button.dataset.passwordToggle, button)));
    document.getElementById("memberChangePasswordForm")?.addEventListener("submit", handleSubmit);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const current_password = String(document.getElementById("memberCurrentPassword")?.value || "");
    const new_password = String(document.getElementById("memberNewPassword")?.value || "");
    const confirm_new_password = String(document.getElementById("memberConfirmNewPassword")?.value || "");
    const usernameEl = document.getElementById("memberChangePasswordUsername");
    const button = document.getElementById("memberChangePasswordButton");
    const form = document.getElementById("memberChangePasswordForm");
    if (!current_password) return setMessage("Current password is required.", true);
    if (new_password.length < 8) return setMessage("New password must be at least 8 characters.", true);
    if (new_password !== confirm_new_password) return setMessage("New passwords do not match.", true);
    const originalText = button?.textContent || "Change Password";
    try {
      setMessage("Changing password...");
      if (button) { button.disabled = true; button.textContent = "Saving..."; }
      const sessionInfo = await window.DDAuth.fetchSessionInfo().catch(() => null);
      const email = String(sessionInfo?.user?.email || "");
      if (usernameEl) usernameEl.value = email;
      await window.DDAuth.changePassword(current_password, new_password);
      form?.reset();
      if (usernameEl) usernameEl.value = email;
      form?.querySelectorAll('input[type="text"][name*="password"]').forEach((input) => { input.type = "password"; });
      form?.querySelectorAll("[data-password-toggle]").forEach((toggle) => { toggle.textContent = "👁 Show"; toggle.setAttribute("aria-pressed","false"); });
      setMessage("Password changed successfully.");
    } catch (error) { setMessage(error.message || "Failed to change password.", true); }
    finally { if (button) { button.disabled = false; button.textContent = originalText; } }
  }

  document.addEventListener("dd:members-ready", (event) => { if (!event?.detail?.ok) return; renderUi(); const el=document.getElementById("memberChangePasswordUsername"); if(el) el.value=String(event.detail?.user?.email || ""); });
  document.addEventListener("dd:member-access-ready", (event) => { if (!event?.detail?.ok) return; renderUi(); const el=document.getElementById("memberChangePasswordUsername"); if(el) el.value=String(event.detail?.user?.email || ""); });
});
