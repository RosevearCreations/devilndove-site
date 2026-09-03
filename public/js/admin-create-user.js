// Release 467 Build 30 — admin user creation with reveal and temporary-password generator.

document.addEventListener("DOMContentLoaded", () => {
  const mountEl = document.getElementById("usersAdminMount");
  if (!mountEl || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;
  let hasRendered = false;

  function setMessage(message, isError = false) {
    const el = document.getElementById("adminCreateUserMessage");
    if (!el) return;
    el.textContent = message;
    el.style.display = message ? "block" : "none";
    el.style.color = isError ? "#b00020" : "#0a7a2f";
  }
  function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim()); }
  function generateTemporaryPassword(length = 16) {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ", lower = "abcdefghijkmnopqrstuvwxyz", digits = "23456789", symbols = "!@#$%*-_";
    const all = upper + lower + digits + symbols;
    const values = new Uint32Array(Math.max(length, 12));
    crypto.getRandomValues(values);
    const pick = (chars, index) => chars[values[index] % chars.length];
    const chars = [pick(upper,0), pick(lower,1), pick(digits,2), pick(symbols,3)];
    for (let i = 4; i < values.length; i += 1) chars.push(pick(all,i));
    for (let i = chars.length - 1; i > 0; i -= 1) { const j = values[i % values.length] % (i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
    return chars.join("");
  }
  function togglePassword(inputId, button) {
    const input = document.getElementById(inputId); if (!input) return;
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    button.setAttribute("aria-pressed", showing ? "false" : "true");
    button.textContent = showing ? "👁 Show" : "🙈 Hide";
  }
  function passwordInput(id, name, label) {
    return `<div><label class="small" for="${id}">${label}</label><div style="display:flex;gap:8px;align-items:center"><input id="${id}" name="${name}" type="password" autocomplete="new-password" required style="flex:1"/><button class="btn secondary" type="button" data-password-toggle="${id}" aria-pressed="false">👁 Show</button></div></div>`;
  }

  function renderUi() {
    if (hasRendered) return;
    hasRendered = true;
    const card = document.createElement("div");
    card.className = "card";
    card.style.marginTop = "18px";
    card.innerHTML = `
      <h3 style="margin-top:0">Create User</h3>
      <p class="small" style="margin-top:0">Create a new member or admin account. Password values can be revealed while you are entering them, but they are stored only as one-way hashes.</p>
      <form id="adminCreateUserForm" class="grid" style="gap:12px">
        <div class="grid cols-2" style="gap:12px"><div><label class="small" for="adminCreateUserEmail">Email</label><input id="adminCreateUserEmail" name="email" type="email" autocomplete="email" required/></div><div><label class="small" for="adminCreateUserDisplayName">Display Name</label><input id="adminCreateUserDisplayName" name="display_name" type="text" autocomplete="name"/></div></div>
        <div class="grid cols-3" style="gap:12px">${passwordInput("adminCreateUserPassword","password","Temporary Password")}${passwordInput("adminCreateUserConfirmPassword","confirm_password","Confirm Password")}<div><label class="small" for="adminCreateUserRole">Role</label><select id="adminCreateUserRole" name="role"><option value="member" selected>Member</option><option value="admin">Admin</option></select></div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn secondary" type="button" id="adminCreateUserGeneratePassword">Generate Temporary Password</button><button class="btn secondary" type="button" id="adminCreateUserCopyPassword">Copy Entered Password</button></div>
        <label class="small" style="display:flex;gap:8px;align-items:flex-start"><input id="adminCreateUserIsActive" name="is_active" type="checkbox" checked/><span>Create this account as active</span></label>
        <div id="adminCreateUserMessage" class="small" style="display:none"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" type="submit" id="adminCreateUserSubmitButton">Create User</button></div>
      </form>`;
    mountEl.appendChild(card);
    card.querySelectorAll("[data-password-toggle]").forEach((button) => button.addEventListener("click", () => togglePassword(button.dataset.passwordToggle, button)));
    document.getElementById("adminCreateUserGeneratePassword")?.addEventListener("click", () => {
      const value = generateTemporaryPassword();
      const password = document.getElementById("adminCreateUserPassword");
      const confirm = document.getElementById("adminCreateUserConfirmPassword");
      if (password) { password.value = value; password.type = "text"; }
      if (confirm) confirm.value = value;
      const toggle = card.querySelector('[data-password-toggle="adminCreateUserPassword"]');
      if (toggle) { toggle.textContent = "🙈 Hide"; toggle.setAttribute("aria-pressed","true"); }
      setMessage("Temporary password generated. Copy it before creating the account if you need to give it to the user.");
    });
    document.getElementById("adminCreateUserCopyPassword")?.addEventListener("click", async () => {
      const value = String(document.getElementById("adminCreateUserPassword")?.value || "");
      if (!value) return setMessage("Enter or generate a password first.", true);
      try { await navigator.clipboard.writeText(value); setMessage("Entered password copied to the clipboard."); }
      catch { setMessage("Clipboard access was unavailable. Use the eye button and copy the value manually.", true); }
    });
    document.getElementById("adminCreateUserForm")?.addEventListener("submit", handleSubmit);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const email = String(document.getElementById("adminCreateUserEmail")?.value || "").trim().toLowerCase();
    const display_name = String(document.getElementById("adminCreateUserDisplayName")?.value || "").trim();
    const password = String(document.getElementById("adminCreateUserPassword")?.value || "");
    const confirm_password = String(document.getElementById("adminCreateUserConfirmPassword")?.value || "");
    const role = String(document.getElementById("adminCreateUserRole")?.value || "member").trim().toLowerCase();
    const is_active = document.getElementById("adminCreateUserIsActive")?.checked ? 1 : 0;
    const submitButton = document.getElementById("adminCreateUserSubmitButton");
    if (!email) return setMessage("Email is required.", true);
    if (!isValidEmail(email)) return setMessage("Please enter a valid email address.", true);
    if (password.length < 8) return setMessage("Password must be at least 8 characters.", true);
    if (password !== confirm_password) return setMessage("Passwords do not match.", true);
    if (!["member","admin"].includes(role)) return setMessage("Role must be member or admin.", true);
    const originalText = submitButton?.textContent || "Create User";
    try {
      setMessage("Creating user...");
      if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Creating..."; }
      const response = await window.DDAuth.apiFetch("/api/admin/create-user", { method: "POST", body: JSON.stringify({ email, display_name, password, confirm_password, role, is_active }) });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Failed to create user.");
      document.getElementById("adminCreateUserForm")?.reset();
      document.getElementById("adminCreateUserIsActive").checked = true;
      document.getElementById("adminCreateUserRole").value = "member";
      setMessage(`User created successfully: ${data?.user?.email || email}`);
      document.dispatchEvent(new CustomEvent("dd:user-updated", { detail: { action: "created", user: data?.user || null } }));
    } catch (error) { setMessage(error.message || "Failed to create user.", true); }
    finally { if (submitButton) { submitButton.disabled = false; submitButton.textContent = originalText; } }
  }

  document.addEventListener("dd:admin-ready", (event) => { if (event?.detail?.ok) renderUi(); });
  renderUi();
});
