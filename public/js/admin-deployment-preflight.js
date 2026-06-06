// File: /public/js/admin-deployment-preflight.js
// Brief description: Renders the Deployment Preflight admin page and saves preflight snapshots.

document.addEventListener('DOMContentLoaded', () => {
  const messageEl = document.getElementById('deploymentPreflightMessage');
  const runButton = document.getElementById('runDeploymentPreflightButton');
  const saveButton = document.getElementById('saveDeploymentPreflightButton');
  const summaryEl = document.getElementById('deploymentPreflightSummary');
  const checksEl = document.getElementById('deploymentPreflightChecks');
  const runsEl = document.getElementById('deploymentPreflightRuns');

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  }

  function setMessage(text, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = text || '';
    messageEl.style.display = text ? 'block' : 'none';
    messageEl.style.color = isError ? '#b00020' : '';
  }

  function statusClass(status) {
    if (status === 'fail' || status === 'blocked') return 'status-pill status-pill-error';
    if (status === 'warn' || status === 'review') return 'status-pill status-pill-warning';
    return 'status-pill status-pill-success';
  }

  function renderSummary(summary = {}) {
    if (!summaryEl) return;
    summaryEl.innerHTML = `
      <div class="admin-summary-grid">
        <div class="admin-stat"><div class="admin-stat-label">Status</div><div class="admin-stat-value"><span class="${statusClass(summary.status)}">${esc(summary.status || 'unknown')}</span></div></div>
        <div class="admin-stat"><div class="admin-stat-label">Blockers</div><div class="admin-stat-value">${Number(summary.blocker_count || 0).toLocaleString()}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Warnings</div><div class="admin-stat-value">${Number(summary.warning_count || 0).toLocaleString()}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Checks</div><div class="admin-stat-value">${Number(summary.check_count || 0).toLocaleString()}</div></div>
      </div>`;
  }

  function renderChecks(checks = []) {
    if (!checksEl) return;
    if (!checks.length) {
      checksEl.innerHTML = '<p class="small">No checks returned yet.</p>';
      return;
    }
    checksEl.innerHTML = `
      <h3>Checklist</h3>
      <div class="table-wrap"><table class="admin-table"><thead><tr><th>Status</th><th>Area</th><th>Details</th><th>Next action</th></tr></thead><tbody>
        ${checks.map((check) => `<tr>
          <td><span class="${statusClass(check.status)}">${esc(check.status)}</span></td>
          <td><strong>${esc(check.label)}</strong><div class="small">${esc(check.code)}</div></td>
          <td>${esc(check.detail)}</td>
          <td>${esc(check.action || '—')}</td>
        </tr>`).join('')}
      </tbody></table></div>`;
  }

  function renderRuns(runs = []) {
    if (!runsEl) return;
    if (!runs.length) {
      runsEl.innerHTML = '<h3>Saved snapshots</h3><p class="small">No saved preflight snapshots yet.</p>';
      return;
    }
    runsEl.innerHTML = `
      <h3>Saved snapshots</h3>
      <div class="table-wrap"><table class="admin-table"><thead><tr><th>When</th><th>Build</th><th>Status</th><th>Blockers</th><th>Warnings</th></tr></thead><tbody>
      ${runs.map((run) => `<tr>
        <td>${esc(run.created_at || '')}</td>
        <td>${esc(run.build_label || '')}</td>
        <td><span class="${statusClass(run.run_status)}">${esc(run.run_status || '')}</span></td>
        <td>${Number(run.blocker_count || 0).toLocaleString()}</td>
        <td>${Number(run.warning_count || 0).toLocaleString()}</td>
      </tr>`).join('')}
      </tbody></table></div>`;
  }

  async function callPreflight(save = false) {
    if (!window.DDAuth?.apiFetch) throw new Error('Auth helper is not loaded.');
    const response = await window.DDAuth.apiFetch('/api/admin/deployment-preflight', {
      method: save ? 'POST' : 'GET',
      headers: save ? { 'Content-Type': 'application/json' } : undefined,
      body: save ? JSON.stringify({ build_label: 'Build 173' }) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw new Error(data?.error || 'Preflight request failed.');
    return data;
  }

  async function load(save = false) {
    const activeButton = save ? saveButton : runButton;
    const originalText = activeButton?.textContent || '';
    try {
      setMessage(save ? 'Saving preflight snapshot…' : 'Running deployment preflight…');
      if (activeButton) { activeButton.disabled = true; activeButton.textContent = 'Working…'; }
      const data = await callPreflight(save);
      renderSummary(data.summary || {});
      renderChecks(data.checks || []);
      renderRuns(data.recent_runs || []);
      setMessage(save ? 'Snapshot saved.' : `Preflight complete: ${data.summary?.status || 'unknown'}.`, (data.summary?.status === 'blocked'));
    } catch (error) {
      setMessage(error.message || 'Preflight failed.', true);
    } finally {
      if (activeButton) { activeButton.disabled = false; activeButton.textContent = originalText; }
    }
  }

  runButton?.addEventListener('click', () => load(false));
  saveButton?.addEventListener('click', () => load(true));
  document.addEventListener('dd:admin-ready', (event) => {
    if (event?.detail?.ok) load(false);
    else setMessage('Please log in as admin to run deployment preflight.', true);
  });
});
