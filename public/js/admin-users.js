// File: /public/js/admin-users.js

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("usersTableBody");
  const emptyEl = document.getElementById("usersEmpty");
  const errorEl = document.getElementById("usersError");
  const loadingEl = document.getElementById("usersLoading");
  const refreshButtons = document.querySelectorAll("[data-refresh-users]");

  function show(el) {
    if (el) el.style.display = "";
  }

  function hide(el) {
    if (el) el.style.display = "none";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(value) {
    if (!value) return "";
    const d = new Date(value.replace(" ", "T") + "Z");
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  }

  function notifyDashboardChanged(detail = {}) {
    document.dispatchEvent(new CustomEvent("dd:admin-data-changed", {
      detail
    }));
  }

  async function loadUsers(options = {}) {
    const { silent = false } = options;

    hide(emptyEl);
    hide(errorEl);

    if (!silent) {
      show(loadingEl);
    }

    try {
      const response = await window.DDAuth.apiFetch("/api/admin/users", {
        method: "GET"
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to load users.");
      }

      const users = Array.isArray(data.users) ? data.users : [];

      if (!users.length) {
        if (tableBody) tableBody.innerHTML = "";
        show(emptyEl);
        return;
      }

      renderRows(users);
    } catch (error) {
      if (tableBody) tableBody.innerHTML = "";
      if (errorEl) {
        errorEl.textContent = error.message || "Failed to load users.";
      }
      show(errorEl);
    } finally {
      hide(loadingEl);
    }
  }

  async function updateUser(userId, payload, triggerButton) {
    const originalText = triggerButton ? triggerButton.textContent : "";

    try {
      if (triggerButton) {
        triggerButton.disabled = true;
        triggerButton.textContent = "Saving...";
      }

      const response = await window.DDAuth.apiFetch("/api/admin/user-update", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          ...payload
        })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Update failed.");
      }

      await loadUsers({ silent: true });
      notifyDashboardChanged({
        type: "user-updated",
        user_id: userId
      });
    } catch (error) {
      alert(error.message || "Update failed.");
      if (triggerButton) {
        triggerButton.disabled = false;
        triggerButton.textContent = originalText;
      }
    }
  }

  function renderRows(users) {
    if (!tableBody) return;

    tableBody.innerHTML = users.map(user => {
      const userId = Number(user.user_id);
      const email = escapeHtml(user.email);
      const displayName = escapeHtml(user.display_name || "");
      const role = user.role || "member";
      const isActive = Number(user.is_active) === 1 ? 1 : 0;
      const created = escapeHtml(formatDate(user.created_at));

      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #ddd">${userId}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${email}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${displayName}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">
            <select data-role-select data-user-id="${userId}">
              <option value="member" ${role === "member" ? "selected" : ""}>member</option>
              <option value="admin" ${role === "admin" ? "selected" : ""}>admin</option>
            </select>
          </td>
          <td style="padding:8px;border-bottom:1px solid #ddd">
            <select data-active-select data-user-id="${userId}">
              <option value="1" ${isActive === 1 ? "selected" : ""}>active</option>
              <option value="0" ${isActive === 0 ? "selected" : ""}>inactive</option>
            </select>
          </td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${created}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn" type="button" data-save-user data-user-id="${userId}">
                Save
              </button>
              <button class="btn" type="button" data-reset-password-user-id="${userId}">
                Reset Password
              </button>
              <button class="btn" type="button" data-manage-access-tiers-user-id="${userId}">
                Manage Access
              </button>
              <button class="btn" type="button" data-delete-user-id="${userId}">
                Delete User
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    bindRowActions();
  }

  function bindRowActions() {
    const saveButtons = tableBody.querySelectorAll("[data-save-user]");

    saveButtons.forEach(button => {
      button.addEventListener("click", async () => {
        const userId = Number(button.getAttribute("data-user-id"));
        const roleSelect = tableBody.querySelector(`[data-role-select][data-user-id="${userId}"]`);
        const activeSelect = tableBody.querySelector(`[data-active-select][data-user-id="${userId}"]`);

        const role = roleSelect ? roleSelect.value : "member";
        const is_active = activeSelect ? Number(activeSelect.value) : 1;

        await updateUser(userId, { role, is_active }, button);
      });
    });
  }

  refreshButtons.forEach(button => {
    button.addEventListener("click", async () => {
      await loadUsers();
      notifyDashboardChanged({
        type: "users-refreshed"
      });
    });
  });

  document.addEventListener("dd:user-created", async () => {
    await loadUsers({ silent: true });
    notifyDashboardChanged({
      type: "user-created"
    });
  });

  document.addEventListener("dd:user-deleted", async () => {
    await loadUsers({ silent: true });
    notifyDashboardChanged({
      type: "user-deleted"
    });
  });

  if (!window.DDAuth || !window.DDAuth.isLoggedIn()) {
    return;
  }

  await loadUsers();
});
