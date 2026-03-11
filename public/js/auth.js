(function () {
  const TOKEN_KEY = "dd_auth_token";
  const USER_KEY = "dd_auth_user";

  function saveAuth(token, user) {
    localStorage.setItem(TOKEN_KEY, token || "");
    localStorage.setItem(USER_KEY, JSON.stringify(user || null));
  }

  function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  }

  function isLoggedIn() {
    return !!getToken();
  }

  async function apiFetch(url, options = {}) {
    const token = getToken();
    const headers = new Headers(options.headers || {});

    if (!headers.has("Content-Type") && options.body) {
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
    }

    return response;
  }

  async function login(email, password) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Login failed.");
    }

    saveAuth(data.token, data.user);
    return data;
  }

  async function register(email, password, display_name) {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password, display_name })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Registration failed.");
    }

    return data;
  }

  async function logout() {
    const response = await apiFetch("/api/auth/logout", {
      method: "POST"
    });

    clearAuth();

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = { ok: true };
    }

    return data;
  }

  async function fetchMe() {
    const response = await apiFetch("/api/me", {
      method: "GET"
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Unable to fetch user.");
    }

    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return data.user;
  }

  window.DDAuth = {
    saveAuth,
    clearAuth,
    getToken,
    getUser,
    isLoggedIn,
    apiFetch,
    login,
    register,
    logout,
    fetchMe
  };
})();
