document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("createUserForm");
  const messageEl = document.getElementById("createUserMessage");

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

    const payload = {
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || ""),
      display_name: String(formData.get("display_name") || "").trim(),
      role: String(formData.get("role") || "member").trim(),
      is_active: formData.get("is_active") === "0" ? 0 : 1
    };

    if (!payload.email || !payload.password) {
      setMessage("Email and password are required.", true);
      return;
    }

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Creating...";
      }

      const response = await window.DDAuth.apiFetch("/api/admin/create-user", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to create user.");
      }

      setMessage("User created successfully.");
      form.reset();

      document.dispatchEvent(new CustomEvent("dd:user-created", {
        detail: data.user || null
      }));
    } catch (error) {
      setMessage(error.message || "Failed to create user.", true);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Create User";
      }
    }
  });
});
