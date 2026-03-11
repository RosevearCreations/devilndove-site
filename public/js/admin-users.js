document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("usersTableBody");
  const emptyEl = document.getElementById("usersEmpty");
  const errorEl = document.getElementById("usersError");
  const loadingEl = document.getElementById("usersLoading");

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

  function renderRows(users) {
    if (!tableBody) return;

    tableBody.innerHTML = users.map(user => {
      const name = user.display_name || "";
      const role = user.role || "member";
      const active = Number(user.is_active) === 1 ? "Yes" : "No";

      return `
        <tr>
          <td>${escapeHtml(user.user_id)}</td>
          <td>${escapeHtml(user.email)}</td>
          <td>${escapeHtml(name)}</td>
          <td>${escapeHtml(role)}</td>
          <td>${escapeHtml(active)}</td>
          <td>${escapeHtml(formatDate(user.created_at))}</td>
        </tr>
      `;
    }).join("");
  }

  async function loadUsers() {
    hide(emptyEl);
    hide(errorEl);
    show(loadingEl);

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
      if (errorEl) {
        errorEl.textContent = error.message || "Failed to load users.";
      }
      show(errorEl);
    } finally {
      hide(loadingEl);
    }
  }

  if (!window.DDAuth || !window.DDAuth.isLoggedIn()) {
    return;
  }

  await loadUsers();
});
