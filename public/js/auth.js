(function () {
  const TOKEN_KEY = "dd_auth_token";
  const USER_KEY = "dd_auth_user";

  function saveAuth(token, user) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }

    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
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

  async function readJsonSafe(response) {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { ok: false, error: "Invalid server response." };
    }
  }

  async function apiFetch(url, options = {}) {
    const token = getToken();
    const headers = new Headers(options.headers || {});
    const hasBody = options.body != null;

    if (hasBody && !headers.has("Content-Type")) {
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

    const data = await readJsonSafe(response);

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

    const data = await readJsonSafe(response);

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Registration failed.");
    }

    return data;
  }

  async function logout() {
    const response = await apiFetch("/api/auth/logout", {
      method: "POST"
    });

    const data = await readJsonSafe(response);
    clearAuth();

    if (!response.ok && data?.error) {
      throw new Error(data.error);
    }

    return data;
  }

  async function fetchMe() {
    const response = await apiFetch("/api/me", {
      method: "GET"
    });

    const data = await readJsonSafe(response);

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
