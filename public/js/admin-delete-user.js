document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("usersTableBody");

  if (!tableBody) return;

  function getRowUserId(button) {
    return Number(button.getAttribute("data-delete-user-id"));
  }

  async function deleteUser(userId, button) {
    const originalText = button.textContent;

    try {
      button.disabled = true;
      button.textContent = "Deleting...";

      const response = await window.DDAuth.apiFetch("/api/admin/delete-user", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId
        })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Delete failed.");
      }

      alert(data.message || "User deleted successfully.");

      document.dispatchEvent(new CustomEvent("dd:admin-data-changed", {
        detail: {
          type: "user-deleted",
          user_id: userId
        }
      }));

      document.dispatchEvent(new CustomEvent("dd:user-deleted", {
        detail: {
          user_id: userId
        }
      }));
    } catch (error) {
      alert(error.message || "Delete failed.");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  tableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete-user-id]");
    if (!button) return;

    const userId = getRowUserId(button);
    if (!userId) {
      alert("Invalid user.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this user account? This will also remove all of that user's sessions."
    );

    if (!confirmed) return;

    await deleteUser(userId, button);
  });
});
