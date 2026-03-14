document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("usersTableBody");

  if (!tableBody || !window.DDAuth || !window.DDAuth.isLoggedIn()) {
    return;
  }

  function getRowUserId(row) {
    const saveButton = row.querySelector("[data-save-user]");
    if (!saveButton) return null;
    return Number(saveButton.getAttribute("data-user-id"));
  }

  function protectOwnRow(currentUserId) {
    const rows = tableBody.querySelectorAll("tr");

    rows.forEach(row => {
      const rowUserId = getRowUserId(row);
      if (!rowUserId || rowUserId !== currentUserId) return;

      const roleSelect = row.querySelector("[data-role-select]");
      const activeSelect = row.querySelector("[data-active-select]");
      const deleteButton = row.querySelector("[data-delete-user-id]");

      if (roleSelect) {
        const memberOption = roleSelect.querySelector('option[value="member"]');
        if (memberOption) {
          memberOption.disabled = true;
        }
      }

      if (activeSelect) {
        const inactiveOption = activeSelect.querySelector('option[value="0"]');
        if (inactiveOption) {
          inactiveOption.disabled = true;
        }
      }

      if (deleteButton) {
        deleteButton.disabled = true;
        deleteButton.title = "You cannot delete your own account.";
      }
    });
  }

  async function applyProtection() {
    try {
      const user = await window.DDAuth.fetchMe();
      const currentUserId = Number(user?.user_id || 0);
      if (!currentUserId) return;
      protectOwnRow(currentUserId);
    } catch {
      // ignore
    }
  }

  document.addEventListener("dd:user-created", applyProtection);
  document.addEventListener("dd:user-deleted", applyProtection);
  document.addEventListener("dd:admin-data-changed", applyProtection);

  const observer = new MutationObserver(() => {
    applyProtection();
  });

  observer.observe(tableBody, {
    childList: true,
    subtree: true
  });

  await applyProtection();
});
