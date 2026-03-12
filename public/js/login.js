document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const messageBox = document.getElementById("loginMessage");

  function showMessage(message, isError = false) {
    if (!messageBox) return;
    messageBox.textContent = message;
    messageBox.style.display = "block";
    messageBox.style.color = isError ? "#b00020" : "#0a7a2f";
  }

  function clearMessage() {
    if (!messageBox) return;
    messageBox.textContent = "";
    messageBox.style.display = "none";
  }

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const email = (emailInput?.value || "").trim();
    const password = passwordInput?.value || "";

    if (!email || !password) {
      showMessage("Please enter both email and password.", true);
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Logging in...";
      }

      await window.DDAuth.login(email, password);
      showMessage("Login successful. Redirecting...");

      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next || "/members/";
    } catch (error) {
      showMessage(error.message || "Login failed.", true);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Login";
      }
    }
  });
});
