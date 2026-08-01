// File: /public/js/admin-schema-drift-report.js
// Brief description: Operations panel for D1 schema drift checks by table/column.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('schemaDriftAdminMount');
  if (!mount || !window.DDAuth) return;

  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
  function pill(status) {
    const clean = String(status || 'unknown').toLowerCase();
    const cls = clean === 'pass' || clean === 'ok' ? 'ok' : (clean === 'fail' ? 'danger' : 'warn');
    return `<span class="admin-status-pill ${cls}">${esc(clean)}</span>`;
  }
  function setMessage(text, isError = false) {
    const el = document.getElementById('schemaDriftMessage');
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
  function list(values) {
    const items = Array.isArray(values) ? values.filter(Boolean) : [];
    return items.length ? items.map((item) => `<code>${esc(item)}</code>`).join(' ') : '<span class="small">—</span>';
  }
  function render(data) {
    const results = document.getElementById('schemaDriftResults');
    if (!results) return;
    const summary = data.summary || {};
    const tables = Array.isArray(data.tables) ? data.tables : [];
    results.innerHTML = `
      <div class="release-sanity-summary" style="margin-top:10px">
        <div>${pill(summary.status)} <strong>${esc(data.generated_at || '')}</strong></div>
        <div class="small">Pass ${esc(summary.pass_count || 0)} • Warn ${esc(summary.warning_count || 0)} • Fail ${esc(summary.fail_count || 0)}</div>
      </div>
      <div class="admin-table-wrap" style="margin-top:10px"><table><thead><tr><th>Status</th><th>Table</th><th>Missing required</th><th>Missing recommended</th><th>Why it matters</th></tr></thead><tbody>
        ${tables.map((row) => `
          <tr>
            <td>${pill(row.status)}</td>
            <td><strong>${esc(row.table)}</strong><div class="small">${esc(row.area || '')} • ${esc(String(row.column_count || 0))} live column(s)</div></td>
            <td>${list(row.missing_required)}</td>
            <td>${list(row.missing_recommended)}</td>
            <td>${esc(row.why || '')}</td>
          </tr>
        `).join('') || '<tr><td colspan="5">No schema drift results returned.</td></tr>'}
      </tbody></table></div>
      <details style="margin-top:10px"><summary>Raw drift report</summary><pre class="small" style="white-space:pre-wrap">${esc(JSON.stringify(data, null, 2))}</pre></details>`;
  }
  async function load() {
    try {
      setMessage('Checking D1 schema drift...');
      const includeOptional = document.getElementById('schemaDriftIncludeOptional')?.checked ? '1' : '0';
      const data = await readJson(await window.DDAuth.apiFetch(`/api/admin/schema-drift-report?include_optional=${includeOptional}`), 'Schema drift report is unavailable.');
      render(data);
      setMessage('Schema drift report loaded.');
    } catch (error) {
      setMessage(error.message || 'Failed to load schema drift report.', true);
    }
  }

  mount.innerHTML = `
    <div class="card" style="margin-top:18px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><h2 style="margin-top:0">D1 Schema Drift Report</h2><p class="small" style="margin:8px 0 0 0">Compares live D1 tables against the columns the current build expects. Required missing columns are blockers; recommended missing columns explain degraded features.</p></div>
        <button class="btn primary" type="button" id="schemaDriftRunButton">Run schema drift check</button>
      </div>
      <label class="small" style="display:block;margin-top:10px"><input type="checkbox" id="schemaDriftIncludeOptional" /> Include optional nice-to-have columns in raw report</label>
      <div id="schemaDriftMessage" class="small" style="display:none;margin-top:10px"></div>
      <div id="schemaDriftResults"></div>
    </div>`;
  document.getElementById('schemaDriftRunButton')?.addEventListener('click', load);
});
