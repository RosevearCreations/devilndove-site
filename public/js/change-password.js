document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("changePasswordForm");
  const messageEl = document.getElementById("changePasswordMessage");

  function setMessage(message, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.style.display = "block";
    messageEl.style.color = isError ? "#b00020" : "#0a7a2f";
  }

  function clearMessage() {
    if (!messageEl) return;
    messageEl.textContent = "";
    messageEl.style.display = "none";
  }

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);

    const current_password = String(formData.get("current_password") || "");
    const new_password = String(formData.get("new_password") || "");
    const confirm_password = String(formData.get("confirm_password") || "");

    if (!current_password || !new_password || !confirm_password) {
      setMessage("All password fields are required.", true);
      return;
    }

    if (new_password.length < 6) {
      setMessage("New password must be at least 6 characters.", true);
      return;
    }

    if (new_password !== confirm_password) {
      setMessage("New password and confirm password do not match.", true);
      return;
    }

    if (new_password === current_password) {
      setMessage("New password must be different from the current password.", true);
      return;
    }

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Saving...";
      }

      const response = await window.DDAuth.apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password,
          new_password
        })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to change password.");
      }

      form.reset();
      setMessage("Password changed successfully.");
    } catch (error) {
      setMessage(error.message || "Failed to change password.", true);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Change Password";
      }
    }
  });
});
