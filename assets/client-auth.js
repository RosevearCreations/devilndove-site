(function attachClientAuth(globalScope) {
  const API = {
    signup: "/api/client/auth_signup",
    login: "/api/client/auth_login",
    me: "/api/client/auth_me",
    logout: "/api/client/auth_logout",
    updateProfile: "/api/client/profile_update"
  };

  const state = { customer: null, authenticated: false, loaded: false };

  async function requestJson(url, options = {}) {
    const response = await fetch(url, {
      credentials: "include",
      cache: "no-store",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    let data = null;
    try { data = await response.json(); } catch { data = null; }
    return { ok: response.ok, status: response.status, data, response };
  }

  async function loadCurrentCustomer() {
    const result = await requestJson(API.me, { method: "GET" });
    if (!result.ok && result.status >= 500) throw new Error((result.data && result.data.error) || "Could not load current client session.");
    const authenticated = !!result.data && result.data.authenticated === true && !!result.data.customer;
    state.customer = authenticated ? result.data.customer : null;
    state.authenticated = authenticated;
    state.loaded = true;
    return { authenticated: state.authenticated, customer: state.customer };
  }

  async function signUp(payload) {
    const result = await requestJson(API.signup, { method: "POST", body: JSON.stringify(payload) });
    if (!result.ok) throw new Error((result.data && result.data.error) || "Sign-up failed.");
    state.customer = result.data && result.data.customer ? result.data.customer : null;
    state.authenticated = !!state.customer;
    state.loaded = true;
    return { authenticated: state.authenticated, customer: state.customer };
  }

  async function signIn({ email, password }) {
    const result = await requestJson(API.login, { method: "POST", body: JSON.stringify({ email, password }) });
    if (!result.ok) throw new Error((result.data && result.data.error) || "Sign-in failed.");
    state.customer = result.data && result.data.customer ? result.data.customer : null;
    state.authenticated = !!state.customer;
    state.loaded = true;
    return { authenticated: state.authenticated, customer: state.customer };
  }

  async function signOut() {
    const result = await requestJson(API.logout, { method: "POST", body: JSON.stringify({}) });
    state.customer = null;
    state.authenticated = false;
    state.loaded = true;
    if (!result.ok && result.status >= 500) throw new Error((result.data && result.data.error) || "Sign-out failed.");
    return { authenticated: false, customer: null };
  }

  async function updateProfile(payload) {
    const result = await requestJson(API.updateProfile, { method: "POST", body: JSON.stringify(payload) });
    if (!result.ok) throw new Error((result.data && result.data.error) || "Profile update failed.");
    if (result.data && result.data.customer) state.customer = result.data.customer;
    state.loaded = true;
    state.authenticated = !!state.customer;
    return { authenticated: state.authenticated, customer: state.customer };
  }

  function getCustomer() { return state.customer; }
  function isAuthenticated() { return state.authenticated === true; }
  function getState() { return { loaded: state.loaded, authenticated: state.authenticated, customer: state.customer }; }

  globalScope.ClientAuth = { API, loadCurrentCustomer, signUp, signIn, signOut, updateProfile, getCustomer, isAuthenticated, getState };
})(window);
