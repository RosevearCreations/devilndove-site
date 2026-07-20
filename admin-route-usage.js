// File: /public/js/admin-route-usage.js
// Build 193: lightweight authenticated usage telemetry for evidence-based admin-page consolidation.
// It records only route/event metadata, never form data, secrets, or customer content.

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname || '';
  if (!path.startsWith('/admin/')) return;
  if (!window.DDAuth?.apiFetch || !window.DDAuth?.isLoggedIn?.()) return;
  window.DDAuth.apiFetch('/api/admin/live-readiness-playbook', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'record_usage',route_path:path,event_kind:'view',source_route:document.referrer ? new URL(document.referrer, window.location.origin).pathname : ''})
  }).catch(() => null);
});
