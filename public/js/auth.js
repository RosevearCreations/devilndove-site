// File: /public/js/auth.js
// Brief description: Shared client-side auth helper for the site. It stores the session token,
// mirrors it into a first-party cookie for same-site continuity, exposes login/register/logout/account
// methods, and provides the authenticated apiFetch wrapper used across public, member, and admin flows.

(function () {
  const TOKEN_KEY = "dd_auth_token";
  const USER_KEY = "dd_auth_user";
  const TOKEN_COOKIE = "dd_auth_token";
  const USER_COOKIE = "dd_auth_user";
  const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
  const JSON_INFLIGHT = new Map();
  const API_CACHE_PREFIX = "dd_api_cache_v243:";

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function getCookie(name) {
    try {
      const safeName = String(name || "").trim();
      if (!safeName) return "";
      const parts = String(document.cookie || "").split(/;\s*/);
      for (const part of parts) {
        const eq = part.indexOf("=");
        if (eq === -1) continue;
        const key = part.slice(0, eq).trim();
        if (key !== safeName) continue;
        return decodeURIComponent(part.slice(eq + 1));
      }
    } catch {}
    return "";
  }

  function setCookie(name, value, maxAgeSeconds = TOKEN_COOKIE_MAX_AGE) {
    try {
      const safeName = String(name || "").trim();
      if (!safeName) return;
      const encoded = encodeURIComponent(String(value || ""));
      if (!value) {
        document.cookie = `${safeName}=; path=/; max-age=0; SameSite=Lax`;
        return;
      }
      document.cookie = `${safeName}=${encoded}; path=/; max-age=${Number(maxAgeSeconds || 0)}; SameSite=Lax`;
    } catch {}
  }

  function getToken() {
    try {
      const fromLocal = normalizeText(localStorage.getItem(TOKEN_KEY));
      if (fromLocal) return fromLocal;
    } catch {}
    return normalizeText(getCookie(TOKEN_COOKIE));
  }

  function setToken(token) {
    const safeToken = normalizeText(token);
    try {
      if (safeToken) localStorage.setItem(TOKEN_KEY, safeToken);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {}
    setCookie(TOKEN_COOKIE, safeToken, safeToken ? TOKEN_COOKIE_MAX_AGE : 0);
    return safeToken;
  }

  function getStoredUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      const parsed = JSON.parse(raw || 'null');
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}
    try {
      const raw = getCookie(USER_COOKIE);
      const parsed = JSON.parse(raw || 'null');
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {}
    return null;
  }

  function setStoredUser(user) {
    try {
      if (user && typeof user === 'object') localStorage.setItem(USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(USER_KEY);
    } catch {}
    try {
      if (user && typeof user === 'object') setCookie(USER_COOKIE, JSON.stringify({
        user_id: Number(user.user_id || 0),
        email: user.email || '',
        display_name: user.display_name || '',
        role: user.role || 'member'
      }), TOKEN_COOKIE_MAX_AGE);
      else setCookie(USER_COOKIE, '', 0);
    } catch {}
    return user || null;
  }

  function clearAuth() {
    setToken('');
    setStoredUser(null);
  }

  function isLoggedIn() {
    return !!getToken();
  }

  async function apiFetch(url, options = {}) {
    const token = getToken();
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(url, { ...options, headers, credentials: 'same-origin' });
    if (response.status === 401 && !String(url).includes('/api/auth/login')) {
      clearAuth();
      document.dispatchEvent(new CustomEvent('dd:auth-changed', { detail: { ok: false, logged_in: false, user: null } }));
    }
    return response;
  }

  async function readApiJson(response, options = {}) {
    const fallbackMessage = normalizeText(options.fallbackMessage) || 'Request failed.';
    const status = Number(response?.status || 0);
    const contentType = normalizeText(response?.headers?.get('Content-Type')).toLowerCase();
    const cloudflareErrorType = normalizeText(response?.headers?.get('cf-error-type'));
    const cloudflareRay = normalizeText(response?.headers?.get('cf-ray'));
    const raw = await response?.text().catch(() => '') || '';
    let data = null;

    if (raw && (contentType.includes('json') || /^[\s\r\n]*[\[{]/.test(raw))) {
      try { data = JSON.parse(raw); } catch {}
    }

    if (response?.ok && data?.ok) return data;

    const resourceLimit = cloudflareErrorType === '1102' || /worker exceeded resource limits/i.test(raw);
    const malformedSuccess = Boolean(response?.ok && !data);
    const message = resourceLimit
      ? 'Cloudflare stopped this request because the Worker reached a CPU or memory limit. Wait a moment and retry; the page will keep any browser recovery copy.'
      : data
        ? (data.error_detail || data.error || fallbackMessage)
        : malformedSuccess
          ? `${fallbackMessage} The server returned an invalid response instead of application data.`
          : `${fallbackMessage} The server returned ${status || 'an error'} without valid application data.`;
    const error = new Error(message);
    error.httpStatus = status;
    error.code = normalizeText(data?.code || (resourceLimit ? 'cloudflare_worker_resource_limit' : 'invalid_api_response'));
    error.hint = normalizeText(data?.hint);
    error.detail = normalizeText(data?.detail);
    error.payload = data;
    error.cloudflareErrorType = cloudflareErrorType;
    error.cloudflareRay = cloudflareRay;
    error.isCloudflareResourceLimit = resourceLimit;
    error.isRetryable = status === 0 || status === 408 || status === 429 || [500, 502, 503, 504].includes(status);
    if (cloudflareRay && !String(error.message || '').includes(cloudflareRay)) {
      error.message = `${error.message} Reference ${cloudflareRay}.`;
    }
    throw error;
  }

  function cacheRead(cacheKey, { allowExpired = false } = {}) {
    if (!cacheKey) return null;
    try {
      const raw = sessionStorage.getItem(`${API_CACHE_PREFIX}${cacheKey}`);
      const parsed = JSON.parse(raw || 'null');
      if (!parsed || typeof parsed !== 'object' || !parsed.data) return null;
      const expiresAt = Number(parsed.expires_at || 0);
      if (!allowExpired && expiresAt && Date.now() > expiresAt) return null;
      return parsed.data;
    } catch {
      return null;
    }
  }

  function cacheWrite(cacheKey, data, ttlMs) {
    if (!cacheKey || !data || typeof data !== 'object') return;
    try {
      sessionStorage.setItem(`${API_CACHE_PREFIX}${cacheKey}`, JSON.stringify({
        expires_at: Date.now() + Math.max(1000, Number(ttlMs || 30000)),
        data
      }));
    } catch {}
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms || 0))));
  }

  async function apiJson(url, options = {}, config = {}) {
    const method = String(options.method || 'GET').toUpperCase();
    const safeRead = method === 'GET' || method === 'HEAD';
    const dedupe = config.dedupe !== false && safeRead;
    const requestKey = `${method}:${String(url)}`;
    const cacheKey = normalizeText(config.cacheKey);
    const cacheTtlMs = Math.max(1000, Number(config.cacheTtlMs || 30000));
    const maxRetries = safeRead ? Math.max(0, Math.min(3, Number(config.retries ?? 2))) : 0;

    if (config.preferCache && cacheKey) {
      const cached = cacheRead(cacheKey);
      if (cached) return { ...cached, _response_meta: { cached: true, stale: false } };
    }

    if (dedupe && JSON_INFLIGHT.has(requestKey)) return JSON_INFLIGHT.get(requestKey);

    const task = (async () => {
      let lastError = null;
      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        try {
          const response = await apiFetch(url, options);
          const data = await readApiJson(response, { fallbackMessage: normalizeText(config.fallbackMessage) || 'Request failed.' });
          if (cacheKey) cacheWrite(cacheKey, data, cacheTtlMs);
          return { ...data, _response_meta: { cached: false, stale: false, attempt } };
        } catch (error) {
          lastError = error;
          if (!safeRead || !error?.isRetryable || attempt >= maxRetries) break;
          const backoff = [500, 1500, 4000][attempt] || 4000;
          await delay(backoff);
        }
      }

      if (cacheKey && config.staleOnError !== false && lastError?.isRetryable) {
        const stale = cacheRead(cacheKey, { allowExpired: true });
        if (stale) {
          return {
            ...stale,
            _response_meta: { cached: true, stale: true, fallback_reason: lastError.code || 'temporary_service_error' }
          };
        }
      }
      throw lastError || new Error(normalizeText(config.fallbackMessage) || 'Request failed.');
    })();

    if (dedupe) JSON_INFLIGHT.set(requestKey, task);
    try {
      return await task;
    } finally {
      if (dedupe && JSON_INFLIGHT.get(requestKey) === task) JSON_INFLIGHT.delete(requestKey);
    }
  }

  async function parseJson(response) {
    return readApiJson(response, { fallbackMessage: `Request failed (${response?.status || 'unknown status'}).` });
  }

  async function handleAuthResponse(response, successFallback) {
    const data = await parseJson(response);
    const token = normalizeText(data?.session_token) || normalizeText(data?.token) || normalizeText(data?.session?.session_token) || normalizeText(data?.session?.token);
    if (!token && successFallback !== 'allow-no-token') throw new Error('Authentication succeeded but no session token was returned.');
    if (token) setToken(token);
    setStoredUser(data?.user || null);
    document.dispatchEvent(new CustomEvent('dd:auth-changed', { detail: { ok: true, logged_in: !!token, user: data?.user || null } }));
    return data;
  }

  async function postLoginTo(endpoint, email, password) {
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
      body: JSON.stringify({ email: normalizeText(email).toLowerCase(), password: String(password || '') })
    });
  }

  async function login(email, password) {
    let response = await postLoginTo('/api/auth/login', email, password);

    // Build 188: retry the flat alias if the nested route returns a platform/static 405.
    if (response.status === 405) {
      response = await postLoginTo('/api/auth-login', email, password);
    }

    return handleAuthResponse(response);
  }

  async function register(payload) {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        email: normalizeText(payload?.email).toLowerCase(),
        display_name: normalizeText(payload?.display_name),
        password: String(payload?.password || ''),
        password_confirm: String(payload?.password_confirm || '')
      })
    });
    return handleAuthResponse(response);
  }

  async function logout() {
    try {
      const response = await apiFetch('/api/auth/logout', { method: 'POST' });
      await response.json().catch(() => null);
    } finally {
      clearAuth();
      document.dispatchEvent(new CustomEvent('dd:auth-changed', { detail: { ok: true, logged_in: false, user: null } }));
    }
    return { ok: true };
  }

  async function logoutAll() {
    const response = await apiFetch('/api/auth/logout-all', { method: 'POST' });
    const data = await parseJson(response);
    clearAuth();
    document.dispatchEvent(new CustomEvent('dd:auth-changed', { detail: { ok: true, logged_in: false, user: null } }));
    return data;
  }

  async function me() {
    const response = await apiFetch('/api/auth/me', { method: 'GET' });
    const data = await parseJson(response);
    setStoredUser(data?.user || null);
    return data;
  }

  async function changePassword(current_password, new_password) {
    const response = await apiFetch('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: String(current_password || ''), new_password: String(new_password || '') })
    });
    return parseJson(response);
  }

  async function fetchSessionInfo() {
    const response = await apiFetch('/api/auth/session-info', { method: 'GET' });
    return parseJson(response);
  }

  async function fetchBootstrapStatus() {
    const response = await fetch('/api/auth/bootstrap-status', { method: 'GET', credentials: 'same-origin' });
    return parseJson(response);
  }

  async function bootstrapAdmin(payload) {
    const response = await fetch('/api/auth/bootstrap-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        email: normalizeText(payload?.email).toLowerCase(),
        display_name: normalizeText(payload?.display_name),
        password: String(payload?.password || ''),
        password_confirm: String(payload?.password_confirm || ''),
        bootstrap_token: normalizeText(payload?.bootstrap_token)
      })
    });
    return handleAuthResponse(response);
  }

  window.DDAuth = {
    getToken,
    setToken,
    getStoredUser,
    setStoredUser,
    clearAuth,
    isLoggedIn,
    apiFetch,
    apiJson,
    readApiJson,
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
