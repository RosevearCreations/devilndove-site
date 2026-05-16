// File: /public/js/admin-public-api-health.js
// Brief description: Operations panel for testing public JSON endpoints after deploys.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('publicApiHealthAdminMount');
  if (!mount || !window.DDAuth) return;
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
  function pill(status) {
    const clean = String(status || 'unknown').toLowerCase();
    const cls = clean === 'ok' || clean === 'pass' ? 'ok' : (clean === 'fail' || clean === 'error' ? 'danger' : 'warn');
    return `<span class="admin-status-pill ${cls}">${esc(clean)}</span>`;
  }
  function setMessage(text, isError = false) {
    const el = document.getElementById('publicApiHealthMessage');
    if (!el) return;
    el.style.display = text ? 'block' : 'none';
    el.style.color = isError ? '#b00020' : '#14532d';
    el.textContent = text || '';
  }
  async function readJson(response, fallback) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || fallback || 'Request failed.');
    return data;
  }
  function render(data) {
    const results = document.getElementById('publicApiHealthResults');
    if (!results) return;
    const summary = data.summary || {};
    const rows = Array.isArray(data.results) ? data.results : [];
    results.innerHTML = `
      <div class="release-sanity-summary" style="margin-top:10px"><div>${pill(summary.status)} <strong>${esc(data.generated_at || '')}</strong></div><div class="small">Pass ${esc(summary.pass_count || 0)} • Warn ${esc(summary.warning_count || 0)} • Fail ${esc(summary.fail_count || 0)}</div></div>${data.db_snapshot ? `<details style="margin-top:8px"><summary>D1 snapshot</summary><pre class="small" style="white-space:pre-wrap">${esc(JSON.stringify(data.db_snapshot, null, 2))}</pre></details>` : ''}
      <div class="admin-table-wrap" style="margin-top:10px"><table><thead><tr><th>Status</th><th>Endpoint</th><th>HTTP</th><th>Count</th><th>Authority / warning</th><th>Next action</th></tr></thead><tbody>
        ${rows.map((row) => `
          <tr>
            <td>${pill(row.ok ? (row.warning || row.error ? 'warn' : 'pass') : 'fail')}</td>
            <td><strong>${esc(row.label)}</strong><div class="small"><code>${esc(row.path)}</code> • ${esc(String(row.duration_ms || 0))}ms</div></td>
            <td>${esc(row.status || 0)}</td>
            <td>${row.count == null ? '—' : esc(row.count)}</td>
            <td>${esc(row.authority || row.warning || row.error || 'ok')}</td><td class="small">${esc(row.next_action || '')}</td>
          </tr>
        `).join('') || '<tr><td colspan="6">No endpoint checks returned.</td></tr>'}
      </tbody></table></div>
      <details style="margin-top:10px"><summary>Raw endpoint health payload</summary><pre class="small" style="white-space:pre-wrap">${esc(JSON.stringify(data, null, 2))}</pre></details>`;
  }
  async function run() {
    try {
      setMessage('Checking public APIs...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/public-api-health'), 'Public API health endpoint is unavailable.');
      render(data);
      setMessage('Public API health check complete.');
    } catch (error) {
      setMessage(error.message || 'Failed to run public API health.', true);
    }
  }
  mount.innerHTML = `
    <div class="card" style="margin-top:18px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><h2 style="margin-top:0">Public API Health</h2><p class="small" style="margin:8px 0 0 0">Tests the JSON endpoints that power the shop, product detail, Tools, and Supplies pages. Use this right after deployment and after D1 migrations.</p></div>
        <button class="btn primary" type="button" id="publicApiHealthRunButton">Run public API health</button>
      </div>
      <div id="publicApiHealthMessage" class="small" style="display:none;margin-top:10px"></div>
      <div id="publicApiHealthResults"></div>
    </div>`;
  document.getElementById('publicApiHealthRunButton')?.addEventListener('click', run);
});
