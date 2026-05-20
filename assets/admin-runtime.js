// assets/admin-runtime.js
//
// Shared helper for session-first admin/detailer pages.
// - keeps credentials on every request
// - optionally adds the legacy x-admin-password bridge
// - normalizes JSON, timeout, and text/network errors
// - provides small actor/status helpers for internal screens

(function attachAdminRuntime(globalScope) {
  async function requestJson(url, options = {}) {
    const method = String(options.method || (options.body === undefined ? 'GET' : 'POST')).toUpperCase();
    const headers = {
      ...(options.headers || {})
    };

    if (options.password) {
      headers['x-admin-password'] = String(options.password || '').trim();
    }

    const init = {
      method,
      credentials: options.credentials || 'include',
      cache: options.cache || 'no-store',
      headers,
      redirect: options.redirect || 'follow'
    };

    if (options.body !== undefined) {
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }
      init.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    const timeoutMs = Number(options.timeout_ms || options.timeoutMs || 20000);
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    if (controller) init.signal = controller.signal;

    let response;
    try {
      response = await fetch(url, init);
    } catch (err) {
      if (timeout) clearTimeout(timeout);
      const timedOut = err && (err.name === 'AbortError' || /aborted|timeout/i.test(String(err.message || '')));
      return {
        ok: false,
        status: 0,
        data: null,
        text: null,
        error: timedOut ? `Request timed out after ${timeoutMs}ms.` : (err && err.message ? err.message : 'Network request failed.')
      };
    }

    if (timeout) clearTimeout(timeout);

    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    let data = null;
    let text = null;

    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      try {
        text = await response.text();
        if (text && /^[\[{]/.test(text.trim())) {
          data = JSON.parse(text);
        }
      } catch {
        text = null;
      }
    }

    return {
      ok: response.ok && (!data || data.ok !== false),
      status: response.status,
      data,
      text,
      response,
      error:
        (data && data.error) ||
        (text && !response.ok ? text.slice(0, 240) : null) ||
        (!response.ok ? `Request failed (${response.status}).` : null)
    };
  }

  function actorLabel(actor) {
    if (!actor) return 'No signed-in staff session detected.';
    const name = actor.full_name || actor.assignment_label || actor.email || 'staff';
    const role = actor.role_code || 'staff';
    return `Signed in as ${name} (${role}).`;
  }

  function bridgeLabel(actor, password) {
    if (password) {
      return actor
        ? `${actorLabel(actor)} Legacy password bridge is filled and available only as fallback.`
        : 'Legacy password bridge is available as a fallback for older routes.';
    }

    return actor
      ? `${actorLabel(actor)} Legacy password bridge is optional here.`
      : 'No signed-in staff session detected. Legacy password bridge is still available as a fallback.';
  }

  function formatCrewBadges(assignments, booking) {
    const list = Array.isArray(assignments) ? assignments.filter(Boolean) : [];
    if (!list.length) {
      const single = booking && (booking.assigned_staff_name || booking.assigned_to || booking.assigned_staff_email);
      return single ? `<span class="badge">Lead: ${escapeHtml(single)}</span>` : `<span class="badge">Unassigned</span>`;
    }
    return list.map((row) => `<span class="badge${row.assignment_role === 'lead' ? ' accent' : ''}">${row.assignment_role === 'lead' ? 'Lead' : 'Crew'}: ${escapeHtml(row.staff_name || row.staff_email || 'Staff')}</span>`).join(' ');
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function normalizeError(result, fallbackMessage) {
    if (!result) return fallbackMessage || 'Unexpected error.';
    return result.error || fallbackMessage || 'Unexpected error.';
  }

  globalScope.AdminRuntime = {
    requestJson,
    actorLabel,
    bridgeLabel,
    formatCrewBadges,
    normalizeError
  };
})(window);
