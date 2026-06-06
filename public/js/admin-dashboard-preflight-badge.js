// File: /public/js/admin-dashboard-preflight-badge.js
// Brief description: Adds the latest Deployment Preflight status badge to the desktop admin dashboard.

document.addEventListener('DOMContentLoaded', () => {
  if (!window.DDAuth?.apiFetch) return;
  const grid = document.querySelector('.admin-summary-grid') || document.querySelector('.dashboard-summary-grid');
  if (!grid) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const cls = (status) => status === 'blocked' || status === 'fail' ? 'status-pill status-pill-error' : (status === 'review' || status === 'warn' ? 'status-pill status-pill-warning' : 'status-pill status-pill-success');
  window.DDAuth.apiFetch('/api/admin/deployment-preflight')
    .then((response) => response.json())
    .then((data) => {
      if (!data?.ok) return;
      const card = document.createElement('a');
      card.className = 'admin-stat admin-stat-link';
      card.href = '/admin/deployment-preflight/';
      card.innerHTML = `<div class="admin-stat-label">Preflight</div><div class="admin-stat-value"><span class="${cls(data.summary?.status)}">${esc(data.summary?.status || 'unknown')}</span></div><div class="small">${esc(data.summary?.blocker_count || 0)} blocker(s) · ${esc(data.summary?.warning_count || 0)} warning(s)</div>`;
      grid.prepend(card);
    })
    .catch(() => {});
});
