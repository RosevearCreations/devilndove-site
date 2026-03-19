// File: /public/js/login.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const emailEl = document.getElementById("loginEmail");
  const passwordEl = document.getElementById("loginPassword");
  const messageEl = document.getElementById("loginMessage");
  const submitButton = document.getElementById("loginSubmitButton");

  function setMessage(message, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.style.display = message ? "block" : "none";
    messageEl.style.color = isError ? "#b00020" : "";
  }

  function getRedirectTarget(user) {
    const role = String(user?.role || "").trim().toLowerCase();

    if (role === "admin") {
      return "/admin/";
    }

    return "/members/";
  }

  async function redirectIfAlreadyLoggedIn() {
    if (!window.DDAuth || !window.DDAuth.isLoggedIn()) {
      return;
    }

    try {
      setMessage("Checking your session...");
      const user = await window.DDAuth.fetchMe();
      window.location.href = getRedirectTarget(user);
    } catch {
      window.DDAuth.clearToken();
      setMessage("");
    }
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (!window.DDAuth) {
      setMessage("Authentication tools are not available.", true);
      return;
    }

    const email = String(emailEl?.value || "").trim();
    const password = String(passwordEl?.value || "");

    if (!email) {
      setMessage("Email is required.", true);
      return;
    }

    if (!password) {
      setMessage("Password is required.", true);
      return;
    }

    const originalText = submitButton?.textContent || "Login";

    try {
      setMessage("Logging in...");
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Logging in...";
      }

      const result = await window.DDAuth.login(email, password);
      const user = result?.user || null;

      setMessage("Login successful.");
      document.dispatchEvent(new CustomEvent("dd:auth-changed", {
        detail: { ok: true, logged_in: true, user }
      }));

      window.location.href = getRedirectTarget(user);
    } catch (error) {
      setMessage(error.message || "Login failed.", true);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  }

  if (form) {
    form.addEventListener("submit", handleLogin);
  }

  redirectIfAlreadyLoggedIn();
});
