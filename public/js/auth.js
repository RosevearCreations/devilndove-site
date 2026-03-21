// File: /public/js/auth.js
// Brief description: Shared client-side auth helper for the site. It stores the session token,
// exposes login/register/logout/account methods, and provides the authenticated apiFetch wrapper
// used by the member, admin, and checkout flows.

(function () {
  const TOKEN_KEY = "dd_auth_token";
  const USER_KEY = "dd_auth_user";

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function getToken() {
    try {
      return normalizeText(localStorage.getItem(TOKEN_KEY));
    } catch {
      return "";
    }
  }

  function setToken(token) {
    const safeToken = normalizeText(token);

    try {
      if (safeToken) {
        localStorage.setItem(TOKEN_KEY, safeToken);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // ignore storage failures
    }

    return safeToken;
  }

  function getStoredUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      const parsed = JSON.parse(raw || "null");
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function setStoredUser(user) {
    try {
      if (user && typeof user === "object") {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch {
      // ignore storage failures
    }

    return user || null;
  }

  function clearAuth() {
    setToken("");
    setStoredUser(null);
  }

  function isLoggedIn() {
    return !!getToken();
  }

  async function apiFetch(url, options = {}) {
    const token = getToken();
    const headers = new Headers(options.headers || {});

    if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      clearAuth();
      document.dispatchEvent(new CustomEvent("dd:auth-changed", {
        detail: {
          ok: false,
          logged_in: false,
          user: null
        }
      }));
    }

    return response;
  }

  async function parseJson(response) {
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "Request failed.");
    }

    return data;
  }

  async function login(email, password) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: normalizeText(email).toLowerCase(),
        password: String(password || "")
      })
    });

    const data = await parseJson(response);
    const token =
      normalizeText(data?.session_token) ||
      normalizeText(data?.token) ||
      normalizeText(data?.session?.session_token) ||
      normalizeText(data?.session?.token);

    if (!token) {
      throw new Error("Login succeeded but no session token was returned.");
    }

    setToken(token);
    setStoredUser(data?.user || null);

    return data;
  }

  async function register(payload) {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: normalizeText(payload?.email).toLowerCase(),
        display_name: normalizeText(payload?.display_name),
        password: String(payload?.password || ""),
        password_confirm: String(payload?.password_confirm || "")
      })
    });

    const data = await parseJson(response);
    const token =
      normalizeText(data?.session_token) ||
      normalizeText(data?.token) ||
      normalizeText(data?.session?.session_token) ||
      normalizeText(data?.session?.token);

    if (!token) {
      throw new Error("Registration succeeded but no session token was returned.");
    }

    setToken(token);
    setStoredUser(data?.user || null);

    return data;
  }

  async function logout() {
    try {
      const response = await apiFetch("/api/auth/logout", {
        method: "POST"
      });

      await response.json().catch(() => null);
    } finally {
      clearAuth();
      document.dispatchEvent(new CustomEvent("dd:auth-changed", {
        detail: {
          ok: true,
          logged_in: false,
          user: null
        }
      }));
    }

    return { ok: true };
  }

  async function logoutAll() {
    const response = await apiFetch("/api/auth/logout-all", {
      method: "POST"
    });

    const data = await parseJson(response);

    clearAuth();
    document.dispatchEvent(new CustomEvent("dd:auth-changed", {
      detail: {
        ok: true,
        logged_in: false,
        user: null
      }
    }));

    return data;
  }

  async function me() {
    const response = await apiFetch("/api/auth/me", {
      method: "GET"
    });

    const data = await parseJson(response);
    setStoredUser(data?.user || null);
    return data;
  }

  async function changePassword(current_password, new_password) {
    const response = await apiFetch("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        current_password: String(current_password || ""),
        new_password: String(new_password || "")
      })
    });

    return parseJson(response);
  }

  async function fetchSessionInfo() {
    const response = await apiFetch("/api/auth/session-info", {
      method: "GET"
    });

    return parseJson(response);
  }

  async function fetchBootstrapStatus() {
    const response = await fetch("/api/auth/bootstrap-status", {
      method: "GET"
    });

    return parseJson(response);
  }

  async function bootstrapAdmin(payload) {
    const response = await fetch("/api/auth/bootstrap-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: normalizeText(payload?.email).toLowerCase(),
        display_name: normalizeText(payload?.display_name),
        password: String(payload?.password || ""),
        password_confirm: String(payload?.password_confirm || ""),
        bootstrap_token: normalizeText(payload?.bootstrap_token)
      })
    });

    const data = await parseJson(response);
    const token =
      normalizeText(data?.session_token) ||
      normalizeText(data?.token) ||
      normalizeText(data?.session?.session_token) ||
      normalizeText(data?.session?.token);

    if (token) {
      setToken(token);
      setStoredUser(data?.user || null);
    }

    return data;
  }

  window.DDAuth = {
    getToken,
    setToken,
    getStoredUser,
    setStoredUser,
    clearAuth,
    isLoggedIn,
    apiFetch,
    login,
    register,
    logout,
    logoutAll,
    me,
    changePassword,
    fetchSessionInfo,
    fetchBootstrapStatus,
    bootstrapAdmin
  };
})();
