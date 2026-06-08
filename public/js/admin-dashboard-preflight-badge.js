// File: /public/js/admin-dashboard-preflight-badge.js
// Brief description: Adds latest Deployment Preflight and Release Control readiness badges to the desktop admin dashboard.

document.addEventListener('DOMContentLoaded', () => {
  if (!window.DDAuth?.apiFetch) return;
  const grid = document.querySelector('.admin-summary-grid') || document.querySelector('.dashboard-summary-grid');
  if (!grid) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const cls = (status) => status === 'blocked' || status === 'fail' || status === 'not_ready' ? 'status-pill status-pill-error' : (status === 'review' || status === 'warn' ? 'status-pill status-pill-warning' : 'status-pill status-pill-success');
  Promise.all([
    window.DDAuth.apiFetch('/api/admin/deployment-preflight').then((r) => r.json()).catch(() => null),
    window.DDAuth.apiFetch('/api/admin/release-control?view=phone').then((r) => r.json()).catch(() => null)
  ]).then(([preflight, release]) => {
    if (release?.ok) {
      const score = Number(release.summary?.readiness_score || 0);
      const rel = document.createElement('a');
      rel.className = 'admin-stat admin-stat-link';
      rel.href = '/admin/release-control/';
      rel.innerHTML = `<div class="admin-stat-label">Deploy Score</div><div class="admin-stat-value"><span class="${cls(score >= 90 ? 'passed' : 'review')}">${esc(score)}/100</span></div><div class="small">${esc(release.summary?.dashboard_card_count || 0)} release card(s)</div>`;
      grid.prepend(rel);
    }
    if (preflight?.ok) {
      const card = document.createElement('a');
      card.className = 'admin-stat admin-stat-link';
      card.href = '/admin/deployment-preflight/';
      card.innerHTML = `<div class="admin-stat-label">Preflight</div><div class="admin-stat-value"><span class="${cls(preflight.summary?.status)}">${esc(preflight.summary?.status || 'unknown')}</span></div><div class="small">${esc(preflight.summary?.blocker_count || 0)} blocker(s) · ${esc(preflight.summary?.warning_count || 0)} warning(s)</div>`;
      grid.prepend(card);
    }
  }).catch(() => {});
});
