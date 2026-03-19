// File: /public/js/register.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const emailEl = document.getElementById("registerEmail");
  const displayNameEl = document.getElementById("registerDisplayName");
  const passwordEl = document.getElementById("registerPassword");
  const confirmPasswordEl = document.getElementById("registerConfirmPassword");
  const messageEl = document.getElementById("registerMessage");
  const submitButton = document.getElementById("registerSubmitButton");

  function setMessage(message, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.style.display = message ? "block" : "none";
    messageEl.style.color = isError ? "#b00020" : "";
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
  }

  function getRedirectTarget(user) {
    const role = String(user?.role || "").trim().toLowerCase();
    return role === "admin" ? "/admin/" : "/members/";
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
      if (window.DDAuth.clearToken) {
        window.DDAuth.clearToken();
      }
      setMessage("");
    }
  }

  async function handleRegister(event) {
    event.preventDefault();

    if (!window.DDAuth) {
      setMessage("Authentication tools are not available.", true);
      return;
    }

    const email = String(emailEl?.value || "").trim().toLowerCase();
    const display_name = String(displayNameEl?.value || "").trim();
    const password = String(passwordEl?.value || "");
    const password_confirm = String(confirmPasswordEl?.value || "");

    if (!email) {
      setMessage("Email is required.", true);
      return;
    }

    if (!isValidEmail(email)) {
      setMessage("Please enter a valid email address.", true);
      return;
    }

    if (!password) {
      setMessage("Password is required.", true);
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.", true);
      return;
    }

    if (password !== password_confirm) {
      setMessage("Passwords do not match.", true);
      return;
    }

    const originalText = submitButton?.textContent || "Create Account";

    try {
      setMessage("Creating your account...");
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Creating...";
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          display_name,
          password,
          password_confirm
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Registration failed.");
      }

      const token =
        String(data.session_token || "").trim() ||
        String(data.token || "").trim() ||
        String(data.session?.session_token || "").trim() ||
        String(data.session?.token || "").trim();

      if (!token) {
        throw new Error("Account created but no session token was returned.");
      }

      if (window.DDAuth.setToken) {
        window.DDAuth.setToken(token);
      }

      const user = data.user || null;

      setMessage("Account created successfully.");
      document.dispatchEvent(new CustomEvent("dd:auth-changed", {
        detail: { ok: true, logged_in: true, user }
      }));

      window.location.href = getRedirectTarget(user);
    } catch (error) {
      setMessage(error.message || "Registration failed.", true);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  }

  if (form) {
    form.addEventListener("submit", handleRegister);
  }

  redirectIfAlreadyLoggedIn();
});
