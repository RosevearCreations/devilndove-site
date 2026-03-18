// File: /public/js/auth.js

(() => {
  const STORAGE_KEY = "dd_session_token";

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function getToken() {
    try {
      return normalizeText(localStorage.getItem(STORAGE_KEY));
    } catch {
      return "";
    }
  }

  function setToken(token) {
    try {
      const safeToken = normalizeText(token);

      if (!safeToken) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      localStorage.setItem(STORAGE_KEY, safeToken);
    } catch {
      // ignore storage failures
    }
  }

  function clearToken() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage failures
    }
  }

  function isLoggedIn() {
    return !!getToken();
  }

  async function parseJsonSafe(response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
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
      clearToken();
    }

    return response;
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

    const data = await parseJsonSafe(response);

    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "Login failed.");
    }

    const token =
      normalizeText(data.session_token) ||
      normalizeText(data.token) ||
      normalizeText(data.session?.session_token) ||
      normalizeText(data.session?.token);

    if (!token) {
      throw new Error("Login succeeded but no session token was returned.");
    }

    setToken(token);

    return data;
  }

  async function logout() {
    const token = getToken();

    try {
      await apiFetch("/api/auth/logout", {
        method: "POST"
      });
    } catch {
      // ignore network/logout endpoint failure
    } finally {
      clearToken();
    }

    return { ok: true, had_token: !!token };
  }

  async function logoutAll() {
    const response = await apiFetch("/api/auth/logout-all", {
      method: "POST"
    });

    const data = await parseJsonSafe(response);

    clearToken();

    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "Logout-all failed.");
    }

    return data;
  }

  async function fetchMe() {
    const response = await apiFetch("/api/auth/me", {
      method: "GET"
    });

    const data = await parseJsonSafe(response);

    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "Unable to verify session.");
    }

    return data.user || null;
  }

  async function changePassword(current_password, new_password) {
    const response = await apiFetch("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        current_password: String(current_password || ""),
        new_password: String(new_password || "")
      })
    });

    const data = await parseJsonSafe(response);

    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "Password change failed.");
    }

    return data;
  }

  async function fetchSessionInfo() {
    const response = await apiFetch("/api/auth/session-info", {
      method: "GET"
    });

    const data = await parseJsonSafe(response);

    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "Unable to load session info.");
    }

    return data;
  }

  async function bootstrapAdmin(payload = {}) {
    const response = await fetch("/api/auth/bootstrap-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload || {})
    });

    const data = await parseJsonSafe(response);

    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "Bootstrap admin failed.");
    }

    return data;
  }

  async function fetchBootstrapStatus() {
    const response = await fetch("/api/auth/bootstrap-status", {
      method: "GET"
    });

    const data = await parseJsonSafe(response);

    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "Unable to load bootstrap status.");
    }

    return data;
  }

  window.DDAuth = {
    STORAGE_KEY,
    getToken,
    setToken,
    clearToken,
    isLoggedIn,
    apiFetch,
    login,
    logout,
    logoutAll,
    fetchMe,
    changePassword,
    fetchSessionInfo,
    bootstrapAdmin,
    fetchBootstrapStatus
  };
})();
