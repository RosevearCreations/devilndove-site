// File: /public/js/admin-media-diagnostics.js
// Brief description: Operations panel for R2 product-media binding and public URL diagnostics.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('mediaDiagnosticsAdminMount');
  if (!mount || !window.DDAuth) return;

  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
  function pill(status) {
    const clean = String(status || 'unknown').toLowerCase();
    const cls = clean === 'ok' || clean === 'pass' ? 'ok' : (clean === 'fail' || clean === 'error' ? 'danger' : 'warn');
    return `<span class="admin-status-pill ${cls}">${esc(clean)}</span>`;
  }
  function setMessage(text, isError = false) {
    const el = document.getElementById('mediaDiagnosticsMessage');
    if (!el) return;
    el.textContent = text || '';
    el.style.display = text ? 'block' : 'none';
    el.style.color = isError ? '#ffb4c1' : '#9ef0b4';
  }
  async function readJson(response, fallback) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || fallback || 'Request failed.');
    return data;
  }
  function render(data) {
    const results = document.getElementById('mediaDiagnosticsResults');
    if (!results) return;
    const summary = data.summary || {};
    const counts = data.counts || {};
    const diagnostics = data.diagnostics || {};
    const latest = Array.isArray(data.latest_media_assets) ? data.latest_media_assets : [];
    results.innerHTML = `
      <div class="release-sanity-summary" style="margin-top:10px">
        <div>${pill(summary.status)} <strong>${esc(summary.public_base_url || '')}</strong></div>
        <div class="small">Bucket ${summary.bucket_binding_ok ? 'connected' : 'missing'} • Source ${esc(summary.public_base_source || '')}</div>
      </div>
      ${Array.isArray(summary.failures) && summary.failures.length ? `<div class="status-note danger" style="margin-top:10px">${summary.failures.map(esc).join('<br>')}</div>` : ''}
      ${Array.isArray(summary.warnings) && summary.warnings.length ? `<div class="status-note warn" style="margin-top:10px">${summary.warnings.map(esc).join('<br>')}</div>` : ''}
      <div class="grid cols-4 media-diagnostic-metrics" style="gap:10px;margin-top:12px">
        <div class="card"><strong>${esc(counts.media_assets_total ?? '—')}</strong><div class="small">media assets</div></div>
        <div class="card"><strong>${esc(counts.media_assets_missing_public_url ?? '—')}</strong><div class="small">missing public URL</div></div>
        <div class="card"><strong>${esc(counts.product_images_total ?? '—')}</strong><div class="small">product image rows</div></div>
        <div class="card"><strong>${esc(counts.products_with_featured_image ?? '—')}</strong><div class="small">products with featured image</div></div>
      </div>
      <div class="small" style="margin-top:10px"><strong>Upload endpoint:</strong> <code>${esc(diagnostics.expected_upload_endpoint || '/api/admin/media-upload')}</code>${diagnostics.sample_public_url ? ` • <strong>Latest URL:</strong> <a href="${esc(diagnostics.sample_public_url)}" target="_blank" rel="noopener">open sample</a>` : ''}</div>
      ${diagnostics.sample_fetch?.attempted ? `<div class="small" style="margin-top:6px">Sample HEAD check: ${pill(diagnostics.sample_fetch.ok ? 'pass' : 'warn')} ${esc(diagnostics.sample_fetch.status || diagnostics.sample_fetch.error || '')}</div>` : ''}
      <div class="admin-table-wrap" style="margin-top:10px"><table><thead><tr><th>ID</th><th>Product</th><th>Filename</th><th>Public URL</th><th>Created</th></tr></thead><tbody>${latest.map((row) => `
        <tr><td>${esc(row.media_asset_id || '')}</td><td>${esc(row.product_id || '')}</td><td>${esc(row.original_filename || row.object_key || '')}</td><td>${row.public_url ? `<a href="${esc(row.public_url)}" target="_blank" rel="noopener">open</a>` : '<span class="small">missing</span>'}</td><td>${esc(row.created_at || '')}</td></tr>
      `).join('') || '<tr><td colspan="5">No media assets found yet.</td></tr>'}</tbody></table></div>
      <details style="margin-top:10px"><summary>Raw diagnostics</summary><pre class="small" style="white-space:pre-wrap">${esc(JSON.stringify(data, null, 2))}</pre></details>`;
  }
  async function run(verify = false) {
    try {
      setMessage(verify ? 'Checking media/R2 diagnostics and sample URL...' : 'Checking media/R2 diagnostics...');
      const data = await readJson(await window.DDAuth.apiFetch(`/api/admin/media-diagnostics${verify ? '?verify=1' : ''}`, { method: 'GET' }), 'Media diagnostics endpoint is unavailable.');
      render(data);
      setMessage('Media/R2 diagnostics complete.');
    } catch (error) {
      setMessage(error.message || 'Failed to run media diagnostics.', true);
    }
  }

  mount.innerHTML = `
    <div class="card" style="margin-top:18px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><h2 style="margin-top:0">Media / R2 Diagnostics</h2><p class="small" style="margin:8px 0 0 0">Checks the product image upload bucket binding, public URL base, and recent media rows before product uploads fail.</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" type="button" id="mediaDiagnosticsRunButton">Run diagnostics</button><button class="btn" type="button" id="mediaDiagnosticsVerifyButton">Verify latest URL</button></div>
      </div>
      <div id="mediaDiagnosticsMessage" class="small" style="display:none;margin-top:10px"></div>
      <div id="mediaDiagnosticsResults"></div>
    </div>`;
  document.getElementById('mediaDiagnosticsRunButton')?.addEventListener('click', () => run(false));
  document.getElementById('mediaDiagnosticsVerifyButton')?.addEventListener('click', () => run(true));
});
