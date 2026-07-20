// File: /public/js/admin-dashboard-notification-actions.js
// Brief description: Adds lightweight Build 180 snooze/dismiss controls for dashboard notification cards when the API is available.
document.addEventListener('DOMContentLoaded', () => {
  if (!window.DDAuth?.apiFetch) return;
  const grid = document.querySelector('.department-grid');
  if (!grid) return;
  const panel = document.createElement('section');
  panel.className = 'card dashboard-notification-actions';
  panel.innerHTML = '<h2 style="margin-top:0">Release notification controls</h2><p class="small">Build 180 adds snooze/dismiss storage for release, smoke-test, recall, and promotion warning cards. Use the Go-Live Execution page to refresh visibility state.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="/admin/go-live-execution/">Open Go-Live Execution</a><button class="btn secondary" id="seedDashboardVisibility" type="button">Seed visibility row</button></div>';
  grid.parentNode.insertBefore(panel, grid);
  panel.querySelector('#seedDashboardVisibility')?.addEventListener('click', async () => {
    const response = await window.DDAuth.apiFetch('/api/admin/go-live-execution', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'seed_dashboard_visibility', dashboard_notification_card_id: 0, visibility_status: 'snoozed', snooze_until: new Date(Date.now() + 3600000).toISOString() }) });
    const data = await response.json().catch(() => ({}));
    alert(data?.ok ? 'Dashboard notification visibility row saved.' : (data?.error || 'Unable to save visibility row.'));
  });
});
