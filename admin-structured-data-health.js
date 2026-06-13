// File: /public/js/admin-structured-data-health.js
// Brief description: Operations panel for checking JSON-LD and Product structured-data readiness.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('structuredDataHealthAdminMount');
  if (!mount || !window.DDAuth) return;
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const pill = (status) => {
    const clean = String(status || 'unknown').toLowerCase();
    const cls = clean === 'ok' || clean === 'pass' ? 'ok' : (clean === 'fail' || clean === 'error' ? 'danger' : 'warn');
    return `<span class="admin-status-pill ${cls}">${esc(clean)}</span>`;
  };
  const setMsg = (text, error = false) => {
    const el = document.getElementById('structuredDataHealthMessage');
    if (!el) return;
    el.style.display = text ? 'block' : 'none';
    el.style.color = error ? '#b00020' : '#14532d';
    el.textContent = text || '';
  };
  async function readJson(response) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Structured-data health failed.');
    return data;
  }
  function render(data) {
    const el = document.getElementById('structuredDataHealthResults');
    if (!el) return;
    const pageRows = Array.isArray(data.page_results) ? data.page_results : [];
    const productRows = Array.isArray(data.product_readiness?.products) ? data.product_readiness.products : [];
    el.innerHTML = `
      <div class="release-sanity-summary" style="margin-top:10px"><div>${pill(data.summary?.status)} <strong>${esc(data.generated_at || '')}</strong></div><div class="small">Pages ${esc(data.summary?.page_count || 0)} • Page warnings ${esc(data.summary?.page_warning_count || 0)} • Product warnings ${esc(data.summary?.product_warning_count || 0)}</div></div>
      <div class="admin-table-wrap" style="margin-top:10px"><table><thead><tr><th>Status</th><th>Page</th><th>JSON-LD</th><th>Types</th><th>Next action</th></tr></thead><tbody>
        ${pageRows.map((row) => `<tr><td>${pill(row.status)}</td><td><strong>${esc(row.label)}</strong><div class="small"><code>${esc(row.path)}</code> • HTTP ${esc(row.http_status || 0)} • ${esc(row.duration_ms || 0)}ms</div></td><td>${esc(row.json_ld_blocks || 0)} block(s)${row.invalid_json_ld_blocks ? `<div class="small danger">${esc(row.invalid_json_ld_blocks)} invalid</div>` : ''}</td><td class="small">${esc((row.schema_types || []).join(', ') || '—')}${(row.missing_required_types || []).length ? `<div class="danger">Missing: ${esc(row.missing_required_types.join(', '))}</div>` : ''}</td><td class="small">${esc(row.next_action || '')}</td></tr>`).join('') || '<tr><td colspan="5">No page checks returned.</td></tr>'}
      </tbody></table></div>
      <details style="margin-top:10px"><summary>Product structured-data readiness sample</summary>
        <div class="small" style="margin:8px 0">Authority: ${esc(data.product_readiness?.products_authority || 'unknown')} • Checked ${esc(data.product_readiness?.summary?.total_checked || 0)} product(s)</div>
        <div class="admin-table-wrap"><table><thead><tr><th>Status</th><th>Product</th><th>Missing values</th><th>Schema</th></tr></thead><tbody>
          ${productRows.map((row) => `<tr><td>${pill(row.status)}</td><td><strong>${esc(row.name)}</strong><div class="small"><code>${esc(row.slug || '')}</code></div></td><td class="small">${esc((row.missing || []).join(', ') || 'none')}</td><td class="small">${esc(row.schema_type || 'Product')} • ${esc(row.currency || '—')} • ${esc(row.price_cents || 0)} cents</td></tr>`).join('') || '<tr><td colspan="4">No product sample returned.</td></tr>'}
        </tbody></table></div>
      </details>
      <details style="margin-top:10px"><summary>Raw structured-data health payload</summary><pre class="small" style="white-space:pre-wrap">${esc(JSON.stringify(data, null, 2))}</pre></details>`;
  }
  async function run() {
    try {
      setMsg('Checking structured data...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/structured-data-health'));
      render(data);
      setMsg('Structured-data health complete.');
    } catch (error) {
      setMsg(error.message || 'Structured-data health failed.', true);
    }
  }
  mount.innerHTML = `
    <div class="card" style="margin-top:18px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><h2 style="margin-top:0">Structured Data Health</h2><p class="small" style="margin:8px 0 0 0">Checks important public pages for JSON-LD and samples Product schema readiness from live product data.</p></div>
        <button class="btn primary" type="button" id="structuredDataHealthRunButton">Run structured-data health</button>
      </div>
      <div id="structuredDataHealthMessage" class="small" style="display:none;margin-top:10px"></div>
      <div id="structuredDataHealthResults"></div>
    </div>`;
  document.getElementById('structuredDataHealthRunButton')?.addEventListener('click', run);
});
