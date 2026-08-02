// File: /public/js/admin-storefront-schema-repair.js
// Brief description: Operations panel for applying non-destructive storefront D1 schema repairs.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('storefrontSchemaRepairAdminMount');
  if (!mount || !window.DDAuth) return;

  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
  function pill(status) {
    const clean = String(status || 'unknown').toLowerCase();
    const cls = clean === 'pass' || clean === 'ok' ? 'ok' : (clean === 'fail' ? 'danger' : 'warn');
    return `<span class="admin-status-pill ${cls}">${esc(clean)}</span>`;
  }
  function setMessage(text, isError = false) {
    const el = document.getElementById('storefrontSchemaRepairMessage');
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
    const results = document.getElementById('storefrontSchemaRepairResults');
    if (!results) return;
    const summary = data.summary || data.report?.summary || {};
    const tables = Array.isArray(data.tables) ? data.tables : (Array.isArray(data.report?.tables) ? data.report.tables : []);
    results.innerHTML = `
      <div class="release-sanity-summary" style="margin-top:10px">
        <div>${pill(summary.status)} <strong>${esc(data.generated_at || data.report?.generated_at || '')}</strong></div>
        <div class="small">Missing columns ${esc(summary.missing_column_count || 0)} • Warn ${esc(summary.warning_count || 0)} • Fail ${esc(summary.fail_count || 0)}</div>
      </div>
      <div class="admin-table-wrap" style="margin-top:10px"><table><thead><tr><th>Status</th><th>Table</th><th>Missing safe columns</th><th>Purpose</th></tr></thead><tbody>
        ${tables.map((row) => {
          const missing = Array.isArray(row.missing_columns) ? row.missing_columns : [];
          return `<tr>
            <td>${pill(row.status)}</td>
            <td><strong>${esc(row.table)}</strong><div class="small">${row.exists ? `${esc(row.live_column_count || 0)} live column(s)` : 'table missing'}</div></td>
            <td>${missing.length ? missing.map((item) => `<code>${esc(item.name)}</code>`).join(' ') : '<span class="small">—</span>'}</td>
            <td>${missing.slice(0, 4).map((item) => `<div class="small"><strong>${esc(item.name)}:</strong> ${esc(item.purpose)}</div>`).join('') || '<span class="small">No safe repairs needed.</span>'}</td>
          </tr>`;
        }).join('') || '<tr><td colspan="4">No schema repair results returned.</td></tr>'}
      </tbody></table></div>
      ${Array.isArray(data.actions) ? `<details style="margin-top:10px"><summary>Applied action log</summary><pre class="small" style="white-space:pre-wrap">${esc(JSON.stringify(data.actions, null, 2))}</pre></details>` : ''}
      <details style="margin-top:10px"><summary>Raw storefront repair payload</summary><pre class="small" style="white-space:pre-wrap">${esc(JSON.stringify(data, null, 2))}</pre></details>`;
  }
  async function inspect() {
    try {
      setMessage('Inspecting storefront schema repairs...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/storefront-schema-repair'), 'Storefront schema repair report is unavailable.');
      render(data);
      setMessage('Storefront schema repair report loaded.');
    } catch (error) {
      setMessage(error.message || 'Failed to inspect storefront schema repair.', true);
    }
  }
  async function apply() {
    try {
      if (!window.confirm('Apply non-destructive storefront schema repairs? This only adds missing safe columns/tables and indexes.')) return;
      setMessage('Applying non-destructive storefront schema repairs...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/storefront-schema-repair', {
        method: 'POST',
        body: JSON.stringify({ action: 'apply_safe_columns', confirm: true })
      }), 'Storefront schema repair failed.');
      render(data.report ? { ...data.report, actions: data.actions } : data);
      setMessage(`Storefront schema repair complete. Missing before ${data.before?.missing_column_count ?? '?'}; after ${data.after?.missing_column_count ?? '?'}.`);
    } catch (error) {
      setMessage(error.message || 'Failed to apply storefront schema repair.', true);
    }
  }

  mount.innerHTML = `
    <div class="card" style="margin-top:18px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><h2 style="margin-top:0">Storefront Schema Repair</h2><p class="small" style="margin:8px 0 0 0">Adds missing non-destructive product, tax, and product SEO columns so the public shop can use the richer D1 query instead of staying on emergency fallbacks.</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" id="storefrontSchemaInspectButton">Inspect repairs</button><button class="btn primary" type="button" id="storefrontSchemaApplyButton">Apply safe repairs</button></div>
      </div>
      <p class="small" style="margin-top:10px">This does not delete data and does not mass-change products. It only creates missing compatibility columns/tables/indexes after checking D1 first.</p>
      <div id="storefrontSchemaRepairMessage" class="small" style="display:none;margin-top:10px"></div>
      <div id="storefrontSchemaRepairResults"></div>
    </div>`;
  document.getElementById('storefrontSchemaInspectButton')?.addEventListener('click', inspect);
  document.getElementById('storefrontSchemaApplyButton')?.addEventListener('click', apply);
});
