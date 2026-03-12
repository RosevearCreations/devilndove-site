document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("usersTableBody");

  if (!tableBody) return;

  function getRowUserId(button) {
    return Number(button.getAttribute("data-reset-password-user-id"));
  }

  async function resetPassword(userId, newPassword, button) {
    const originalText = button.textContent;

    try {
      button.disabled = true;
      button.textContent = "Saving...";

      const response = await window.DDAuth.apiFetch("/api/admin/reset-password", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          password: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Password reset failed.");
      }

      alert("Password reset successfully.");
    } catch (error) {
      alert(error.message || "Password reset failed.");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  tableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-reset-password-user-id]");
    if (!button) return;

    const userId = getRowUserId(button);
    if (!userId) {
      alert("Invalid user.");
      return;
    }

    const newPassword = window.prompt("Enter the new password (minimum 6 characters):", "");
    if (newPassword == null) return;

    if (String(newPassword).length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    await resetPassword(userId, String(newPassword), button);
  });
});
