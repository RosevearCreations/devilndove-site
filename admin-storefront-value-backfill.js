// File: /public/js/admin-storefront-value-backfill.js
// Brief description: Operations panel for safe storefront product default backfills.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('storefrontValueBackfillAdminMount');
  if (!mount || !window.DDAuth) return;
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const pill = (status) => {
    const clean = String(status || 'unknown').toLowerCase();
    const cls = clean === 'ok' || clean === 'pass' || clean === 'applied' ? 'ok' : (clean === 'fail' || clean === 'failed' ? 'danger' : 'warn');
    return `<span class="admin-status-pill ${cls}">${esc(clean)}</span>`;
  };
  const setMsg = (text, error = false) => {
    const el = document.getElementById('storefrontValueBackfillMessage');
    if (!el) return;
    el.style.display = text ? 'block' : 'none';
    el.style.color = error ? '#b00020' : '#14532d';
    el.textContent = text || '';
  };
  async function readJson(response) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Storefront value backfill request failed.');
    return data;
  }
  function renderReport(data) {
    const report = data.report || data.after || data.before || {};
    const el = document.getElementById('storefrontValueBackfillResults');
    if (!el) return;
    const checks = Array.isArray(report.product_checks) ? report.product_checks : [];
    const actions = Array.isArray(data.actions) ? data.actions : [];
    el.innerHTML = `
      <div class="release-sanity-summary" style="margin-top:10px"><div>${pill(report.summary?.status)} <strong>${esc(report.generated_at || '')}</strong></div><div class="small">Pending product defaults ${esc(report.summary?.product_backfill_pending_count || 0)} • Missing SEO rows ${esc(report.summary?.missing_product_seo_rows || 0)}</div></div>
      <div class="admin-table-wrap" style="margin-top:10px"><table><thead><tr><th>Status</th><th>Field</th><th>Pending</th><th>Purpose</th></tr></thead><tbody>
        ${checks.map((row) => `<tr><td>${pill(row.status)}</td><td><code>${esc(row.column)}</code></td><td>${row.pending_count == null ? '—' : esc(row.pending_count)}</td><td class="small">${esc(row.purpose || row.note || '')}</td></tr>`).join('') || '<tr><td colspan="4">No product checks returned.</td></tr>'}
      </tbody></table></div>
      <div class="small" style="margin-top:10px">Product SEO placeholders: ${pill(report.product_seo?.status)} ${esc(report.product_seo?.missing_rows ?? '—')} missing row(s). ${esc(report.product_seo?.note || '')}</div>
      ${actions.length ? `<details open style="margin-top:10px"><summary>Applied actions</summary><pre class="small" style="white-space:pre-wrap">${esc(JSON.stringify(actions, null, 2))}</pre></details>` : ''}
      <details style="margin-top:10px"><summary>Raw value-backfill payload</summary><pre class="small" style="white-space:pre-wrap">${esc(JSON.stringify(data, null, 2))}</pre></details>`;
  }
  async function inspect() {
    try {
      setMsg('Inspecting storefront value defaults...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/storefront-value-backfill'));
      renderReport(data);
      setMsg('Storefront value inspection complete.');
    } catch (error) {
      setMsg(error.message || 'Inspection failed.', true);
    }
  }
  async function apply() {
    if (!window.confirm('Apply safe storefront defaults to blank product fields and create missing product_seo placeholder rows?')) return;
    try {
      setMsg('Applying safe storefront value backfill...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/storefront-value-backfill', { method: 'POST', body: JSON.stringify({ action: 'apply_safe_defaults' }) }));
      renderReport(data);
      setMsg('Storefront value backfill complete.');
    } catch (error) {
      setMsg(error.message || 'Backfill failed.', true);
    }
  }
  mount.innerHTML = `
    <div class="card" style="margin-top:18px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><h2 style="margin-top:0">Storefront Value Backfill</h2><p class="small" style="margin:8px 0 0 0">Safely fills blank product defaults such as CAD currency, active status, handmade origin, onsite sale channel, and placeholder product SEO rows.</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" id="storefrontValueInspectButton">Inspect defaults</button><button class="btn primary" type="button" id="storefrontValueApplyButton">Apply safe backfill</button></div>
      </div>
      <div id="storefrontValueBackfillMessage" class="small" style="display:none;margin-top:10px"></div>
      <div id="storefrontValueBackfillResults"></div>
    </div>`;
  document.getElementById('storefrontValueInspectButton')?.addEventListener('click', inspect);
  document.getElementById('storefrontValueApplyButton')?.addEventListener('click', apply);
});
