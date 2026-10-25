// File: /public/js/login.js
// Build 233: resource-limit failures remain concise and retryable; the password
// stays in the form and the submit control is safely restored for a later retry.

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const emailEl = document.getElementById("loginEmail");
  const passwordEl = document.getElementById("loginPassword");
  const messageEl = document.getElementById("loginMessage");
  const submitButton = document.getElementById("loginSubmitButton");
  let signingIn = false;

  if (!form || !window.DDAuth) return;

  function setMessage(message, isError = false) {
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.style.display = message ? "block" : "none";
    messageEl.style.color = isError ? "#b00020" : "";
    messageEl.setAttribute('role', isError ? 'alert' : 'status');
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
  }

  function getRedirectTarget(user) {
    const url = new URL(window.location.href);
    const next = String(url.searchParams.get("next") || "").trim();

    if (next.startsWith("/") && !next.startsWith("//")) {
      return next;
    }

    const role = String(user?.role || "").trim().toLowerCase();

    if (role === "admin") {
      return "/admin/";
    }

    return "/members/";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (signingIn) return; // exactly one password POST per deliberate submit

    const email = String(emailEl?.value || "").trim().toLowerCase();
    const password = String(passwordEl?.value || "");

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

    const originalText = submitButton?.textContent || "Login";

    try {
      signingIn = true;
      setMessage("Signing you in...");

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Signing In...";
      }

      const result = await window.DDAuth.login(email, password);
      const user = result?.user || null;

      document.dispatchEvent(new CustomEvent("dd:auth-changed", {
        detail: {
          ok: true,
          logged_in: true,
          user
        }
      }));

      setMessage("Login successful.");
      window.location.href = getRedirectTarget(user);
    } catch (error) {
      const incident = window.DDRecovery468?.classify(error, 'login');
      const reference = incident?.cloudflareRay ? ` Cloudflare reference ${incident.cloudflareRay}.` : '';
      setMessage(incident?.temporary
        ? `${incident.guidance}${reference}`
        : `${error.message || 'Login failed.'}${incident?.category === 'authorization' ? ' Check our email and password.' : ''}`, true);
    } finally {
      signingIn = false;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  }

  form.addEventListener("submit", handleSubmit);
});
