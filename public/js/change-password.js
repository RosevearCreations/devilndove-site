// File: /public/js/change-password.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("changePasswordForm");
  const currentPasswordEl = document.getElementById("currentPassword");
  const newPasswordEl = document.getElementById("newPassword");
  const confirmPasswordEl = document.getElementById("confirmNewPassword");
  const messageEl = document.getElementById("changePasswordMessage");
  const submitButton = document.getElementById("changePasswordSubmitButton");

  if (!form || !window.DDAuth) return;

  function setMessage(message, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.style.display = message ? "block" : "none";
    messageEl.style.color = isError ? "#b00020" : "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const current_password = String(currentPasswordEl?.value || "");
    const new_password = String(newPasswordEl?.value || "");
    const confirm_password = String(confirmPasswordEl?.value || "");

    if (!current_password) {
      setMessage("Current password is required.", true);
      return;
    }

    if (!new_password) {
      setMessage("New password is required.", true);
      return;
    }

    if (new_password.length < 6) {
      setMessage("New password must be at least 6 characters.", true);
      return;
    }

    if (new_password !== confirm_password) {
      setMessage("New passwords do not match.", true);
      return;
    }

    if (current_password === new_password) {
      setMessage("New password must be different from the current password.", true);
      return;
    }

    const originalText = submitButton?.textContent || "Change Password";

    try {
      setMessage("Updating password...");

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Saving...";
      }

      await window.DDAuth.changePassword(current_password, new_password);

      form.reset();
      setMessage("Password changed successfully.");

      document.dispatchEvent(new CustomEvent("dd:member-password-changed", {
        detail: { ok: true }
      }));
    } catch (error) {
      setMessage(error.message || "Password change failed.", true);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  }

  form.addEventListener("submit", handleSubmit);
});
