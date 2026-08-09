// File: /public/js/admin-route-usage.js
// Build 243: admin route telemetry is non-critical and runs once per route/session during idle time.

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname || '';
  if (!path.startsWith('/admin/')) return;
  const key = `dd_admin_route_usage_v243:${path}`;
  try { if (sessionStorage.getItem(key)) return; } catch {}

  const record = async () => {
    if (!window.DDAuth?.apiFetch || !window.DDAuth?.isLoggedIn?.()) return;
    try {
      await window.DDAuth.apiFetch('/api/admin/live-readiness-playbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_usage',
          route_path: path,
          event_kind: 'view',
          source_route: document.referrer ? new URL(document.referrer, window.location.origin).pathname : ''
        })
      });
      try { sessionStorage.setItem(key, '1'); } catch {}
    } catch {}
  };

  if ('requestIdleCallback' in window) window.requestIdleCallback(record, { timeout: 5000 });
  else window.setTimeout(record, 4000);
});
