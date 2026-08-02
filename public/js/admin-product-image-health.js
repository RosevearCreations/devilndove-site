// File: /public/js/admin-product-image-health.js
// Brief description: Operations panel for product image coverage, alt text, and media public URL health.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('productImageHealthAdminMount');
  if (!mount || !window.DDAuth) return;
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
  function pill(status) { const clean = String(status || 'unknown').toLowerCase(); const cls = clean === 'ok' || clean === 'pass' ? 'ok' : (clean === 'fail' ? 'danger' : 'warn'); return `<span class="admin-status-pill ${cls}">${esc(clean)}</span>`; }
  function setMessage(text, isError = false) { const el = document.getElementById('productImageHealthMessage'); if (!el) return; el.textContent = text || ''; el.style.display = text ? 'block' : 'none'; el.style.color = isError ? '#ffb4c1' : '#9ef0b4'; }
  async function readJson(response, fallback) { const data = await response.json().catch(() => null); if (!response.ok || !data?.ok) throw new Error(data?.error || fallback || 'Request failed.'); return data; }
  function render(data) {
    const results = document.getElementById('productImageHealthResults');
    if (!results) return;
    const summary = data.summary || {};
    const checks = Array.isArray(data.checks) ? data.checks : [];
    const missing = Array.isArray(data.missing_image_products) ? data.missing_image_products : [];
    const lowAlt = Array.isArray(data.low_alt_images) ? data.low_alt_images : [];
    results.innerHTML = `
      <div class="release-sanity-summary" style="margin-top:10px"><div>${pill(summary.status)} <strong>${esc(data.generated_at || '')}</strong></div><div class="small">Featured ${esc(summary.products_with_featured_image || 0)}/${esc(summary.active_products || 0)} • Product images ${esc(summary.product_images_total || 0)} • Media assets ${esc(summary.media_assets_total || 0)}</div></div>
      <div class="admin-table-wrap" style="margin-top:10px"><table><thead><tr><th>Status</th><th>Check</th><th>Detail</th><th>Action</th></tr></thead><tbody>${checks.map((row) => `<tr><td>${pill(row.status)}</td><td><strong>${esc(row.label)}</strong></td><td>${esc(row.detail)}</td><td class="small">${esc(row.action)}</td></tr>`).join('') || '<tr><td colspan="4">No checks returned.</td></tr>'}</tbody></table></div>
      <details style="margin-top:10px" ${missing.length ? 'open' : ''}><summary>Products without featured/gallery images (${missing.length})</summary><div class="admin-table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Slug</th><th>Status</th></tr></thead><tbody>${missing.map((row) => `<tr><td>${esc(row.product_id)}</td><td>${esc(row.name)}</td><td>${esc(row.slug)}</td><td>${esc(row.status)}</td></tr>`).join('') || '<tr><td colspan="4">No missing-image products in the sample.</td></tr>'}</tbody></table></div></details>
      <details style="margin-top:10px"><summary>Images with weak/missing alt text (${lowAlt.length})</summary><div class="admin-table-wrap"><table><thead><tr><th>Image ID</th><th>Product</th><th>Alt text</th><th>Image</th></tr></thead><tbody>${lowAlt.map((row) => `<tr><td>${esc(row.product_image_id)}</td><td>${esc(row.product_id)} ${esc(row.name || '')}</td><td>${esc(row.alt_text || '')}</td><td>${row.image_url ? `<a href="${esc(row.image_url)}" target="_blank" rel="noopener">open</a>` : '—'}</td></tr>`).join('') || '<tr><td colspan="4">No weak-alt image rows in the sample.</td></tr>'}</tbody></table></div></details>`;
  }
  async function run() {
    try {
      setMessage('Checking product image health...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/product-image-health', { method: 'GET' }), 'Product image health endpoint is unavailable.');
      render(data);
      setMessage('Product image health check complete.');
    } catch (error) {
      setMessage(error.message || 'Failed to run product image health.', true);
    }
  }
  mount.innerHTML = `
    <div class="card" style="margin-top:18px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><h2 style="margin-top:0">Product Image Health</h2><p class="small" style="margin:8px 0 0 0">Checks featured images, gallery image rows, alt text, and media public URLs for product readiness.</p></div>
        <button class="btn primary" type="button" id="productImageHealthRunButton">Run image health</button>
      </div>
      <div id="productImageHealthMessage" class="small" style="display:none;margin-top:10px"></div>
      <div id="productImageHealthResults"></div>
    </div>`;
  document.getElementById('productImageHealthRunButton')?.addEventListener('click', run);
});
