// File: /public/js/admin-runtime-incidents.js
// Brief description: Admin runtime incident review panel with grouping, filters, and resolve/ignore actions.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('runtimeIncidentsAdminMount');
  if (!mount || !window.DDAuth) return;

  let lastData = null;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function statusPill(status) {
    const clean = String(status || 'unknown').toLowerCase();
    const cls = clean === 'critical' || clean === 'error' || clean === 'fail'
      ? 'danger'
      : (clean === 'warning' || clean === 'warn' || clean === 'reviewing' ? 'warn' : (clean === 'resolved' || clean === 'ignored' ? 'ok' : 'muted'));
    return `<span class="admin-status-pill ${cls}">${escapeHtml(clean)}</span>`;
  }

  function setMessage(text, isError = false) {
    const el = document.getElementById('runtimeIncidentsMessage');
    if (!el) return;
    el.textContent = text || '';
    el.style.display = text ? 'block' : 'none';
    el.style.color = isError ? '#b00020' : '#0a7a2f';
  }

  function parseDetails(value) {
    if (!value) return '';
    try { return JSON.stringify(JSON.parse(value), null, 2); }
    catch { return String(value); }
  }

  function getSelectedIds() {
    return Array.from(document.querySelectorAll('[data-runtime-incident-check]:checked'))
      .map((el) => Number(el.value))
      .filter((id) => Number.isFinite(id) && id > 0);
  }

  function render(data) {
    lastData = data;
    const summary = data.summary || {};
    const groups = Array.isArray(data.groups) ? data.groups : [];
    const incidents = Array.isArray(data.incidents) ? data.incidents : [];
    const results = document.getElementById('runtimeIncidentsResults');
    if (!results) return;

    results.innerHTML = `
      <div class="grid cols-4" style="gap:12px;margin-top:12px">
        <div class="card"><div class="small">Open incidents</div><strong>${escapeHtml(String(Number(summary.open_count || 0)))}</strong></div>
        <div class="card"><div class="small">Critical</div><strong>${escapeHtml(String(Number(summary.critical_count || 0)))}</strong></div>
        <div class="card"><div class="small">Errors</div><strong>${escapeHtml(String(Number(summary.error_count || 0)))}</strong></div>
        <div class="card"><div class="small">Warnings</div><strong>${escapeHtml(String(Number(summary.warning_count || 0)))}</strong></div>
      </div>

      <details open style="margin-top:12px"><summary><strong>Grouped recurring incidents</strong></summary>
        <div class="admin-table-wrap" style="margin-top:10px"><table><thead><tr><th>Count</th><th>Severity</th><th>Scope</th><th>Code</th><th>Endpoint</th><th>Last seen</th></tr></thead><tbody>${groups.map((row) => `
          <tr>
            <td><strong>${escapeHtml(String(Number(row.incident_count || 0)))}</strong></td>
            <td>${statusPill(row.severity)}</td>
            <td>${escapeHtml(row.incident_scope || '')}</td>
            <td>${escapeHtml(row.incident_code || '')}</td>
            <td><code>${escapeHtml(row.endpoint_path || '')}</code></td>
            <td>${escapeHtml(row.last_seen_at || '')}</td>
          </tr>
        `).join('') || '<tr><td colspan="6">No matching grouped incidents.</td></tr>'}</tbody></table></div>
      </details>

      <details open style="margin-top:12px"><summary><strong>Recent incident records</strong></summary>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin:10px 0">
          <button class="btn" type="button" data-runtime-action="reviewing">Mark reviewing</button>
          <button class="btn" type="button" data-runtime-action="resolve">Resolve selected</button>
          <button class="btn" type="button" data-runtime-action="ignore">Ignore selected</button>
          <button class="btn" type="button" data-runtime-action="reopen">Reopen selected</button>
        </div>
        <label class="small" style="display:block;margin-bottom:8px">Admin note <input class="input" id="runtimeIncidentAdminNote" placeholder="Example: duplicate from old deploy; fixed in build 126"/></label>
        <div class="admin-table-wrap"><table><thead><tr><th></th><th>ID</th><th>Status</th><th>Severity</th><th>Scope / code</th><th>Endpoint</th><th>Message / details</th><th>Created</th></tr></thead><tbody>${incidents.map((row) => `
          <tr>
            <td><input type="checkbox" data-runtime-incident-check value="${escapeHtml(String(row.runtime_incident_id || ''))}"/></td>
            <td>${escapeHtml(String(row.runtime_incident_id || ''))}</td>
            <td>${statusPill(row.review_status)}</td>
            <td>${statusPill(row.severity)}</td>
            <td><strong>${escapeHtml(row.incident_scope || '')}</strong><br/><span class="small">${escapeHtml(row.incident_code || '')}</span></td>
            <td><code>${escapeHtml(row.request_method || '')} ${escapeHtml(row.endpoint_path || '')}</code></td>
            <td>${escapeHtml(row.message || '')}${row.details_json ? `<details><summary>details</summary><pre class="small" style="white-space:pre-wrap">${escapeHtml(parseDetails(row.details_json))}</pre></details>` : ''}</td>
            <td>${escapeHtml(row.created_at || '')}</td>
          </tr>
        `).join('') || '<tr><td colspan="8">No matching incidents.</td></tr>'}</tbody></table></div>
      </details>
    `;

    results.querySelectorAll('[data-runtime-action]').forEach((button) => {
      button.addEventListener('click', async () => {
        await updateSelected(button.getAttribute('data-runtime-action'));
      });
    });
  }

  function readFilters() {
    const qs = new URLSearchParams();
    qs.set('group', '1');
    qs.set('days', document.getElementById('runtimeIncidentDays')?.value || '7');
    qs.set('limit', document.getElementById('runtimeIncidentLimit')?.value || '50');
    const severity = document.getElementById('runtimeIncidentSeverity')?.value || '';
    const reviewStatus = document.getElementById('runtimeIncidentReviewStatus')?.value || 'open';
    if (severity) qs.set('severity', severity);
    if (reviewStatus) qs.set('review_status', reviewStatus);
    return qs;
  }

  async function loadIncidents() {
    try {
      setMessage('Loading runtime incidents...');
      const response = await window.DDAuth.apiFetch(`/api/admin/runtime-incidents?${readFilters().toString()}`);
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to load runtime incidents.');
      render(data);
      setMessage('Runtime incidents loaded.');
    } catch (error) {
      setMessage(error.message || 'Failed to load runtime incidents.', true);
    }
  }

  async function updateSelected(action) {
    const ids = getSelectedIds();
    if (!ids.length) {
      setMessage('Select at least one incident first.', true);
      return;
    }
    try {
      const note = document.getElementById('runtimeIncidentAdminNote')?.value || '';
      setMessage('Updating selected runtime incidents...');
      const response = await window.DDAuth.apiFetch('/api/admin/runtime-incidents', {
        method: 'POST',
        body: JSON.stringify({ action, runtime_incident_ids: ids, admin_note: note })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to update runtime incidents.');
      setMessage(`Updated ${data.updated_count || ids.length} incident(s).`);
      await loadIncidents();
    } catch (error) {
      setMessage(error.message || 'Failed to update runtime incidents.', true);
    }
  }

  mount.innerHTML = `
    <div class="card" style="margin-top:18px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div>
          <h2 style="margin-top:0">Security / Runtime Incidents</h2>
          <p class="small" style="margin:8px 0 0 0">Review server-side runtime errors and fallback warnings. Grouped rows show recurring scope/code/endpoint patterns so we can fix the noisy issue first.</p>
        </div>
        <button class="btn primary" id="refreshRuntimeIncidentsButton" type="button">Refresh incidents</button>
      </div>
      <div class="grid cols-4" style="gap:12px;margin-top:12px">
        <label class="small">Days <input class="input" id="runtimeIncidentDays" type="number" min="1" max="90" value="7"/></label>
        <label class="small">Limit <input class="input" id="runtimeIncidentLimit" type="number" min="1" max="100" value="50"/></label>
        <label class="small">Severity <select class="input" id="runtimeIncidentSeverity"><option value="">All</option><option value="critical">Critical</option><option value="error">Error</option><option value="warning">Warning</option><option value="info">Info</option></select></label>
        <label class="small">Review status <select class="input" id="runtimeIncidentReviewStatus"><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="ignored">Ignored</option><option value="all">All</option></select></label>
      </div>
      <div id="runtimeIncidentsMessage" class="small" style="display:none;margin-top:10px"></div>
      <div id="runtimeIncidentsResults"></div>
    </div>
  `;

  document.getElementById('refreshRuntimeIncidentsButton')?.addEventListener('click', loadIncidents);
  ['runtimeIncidentDays', 'runtimeIncidentLimit', 'runtimeIncidentSeverity', 'runtimeIncidentReviewStatus'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', loadIncidents);
  });

  document.addEventListener('dd:admin-ready', async (event) => {
    if (!event?.detail?.ok) return;
    await loadIncidents();
  });

  loadIncidents();
});
