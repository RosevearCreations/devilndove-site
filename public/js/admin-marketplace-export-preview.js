// File: /public/js/admin-marketplace-export-preview.js
// Brief description: Admin marketplace validation preview, CSV download, per-channel image selector persistence, field preview, history replay, and rollback.
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('marketplaceExportPreviewMount');
  if (!mount || !window.DDAuth) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  let currentChannel = 'etsy';
  async function read(response, fallback = 'Marketplace request failed.') {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || fallback);
    return data;
  }
  async function load(channel = currentChannel) {
    currentChannel = channel;
    mount.innerHTML = '<p class="small">Loading marketplace export preview...</p>';
    try {
      const data = await read(await window.DDAuth.apiFetch(`/api/admin/marketplace-export-preview?channel=${encodeURIComponent(channel)}`), 'Marketplace preview failed.');
      const rows = Array.isArray(data.previews) ? data.previews : [];
      const rule = data.rules || {};
      const historyButtons = (data.history || []).slice(0,5).map((item) => `<button class="btn small" data-replay-history="${esc(item.marketplace_export_history_id)}" type="button">Replay ${esc(item.created_at || 'history')}</button>`).join('');
      mount.innerHTML = `<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><h2 style="margin-top:0">${esc(rule.label || channel)} preview</h2><p class="small">Ready ${esc(data.summary?.ready || 0)} / ${esc(data.summary?.total || 0)} • Blocked ${esc(data.summary?.blocked || 0)} • Selected ${esc(data.summary?.selected_products || 0)} product(s)</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-channel="etsy">Etsy</button><button class="btn" data-channel="facebook">Facebook</button><button class="btn" data-channel="pinterest">Pinterest</button><button class="btn" data-channel="manual">Manual</button><a class="btn" href="/admin/marketplace-mapping/">Mapping editor</a><button class="btn" id="bulkApplyMarketplaceImages" type="button">Bulk apply role order</button><a class="btn primary" href="/api/admin/marketplace-export-preview?channel=${encodeURIComponent(channel)}&format=csv">Download CSV</a></div></div><div class="status-note info small">Select exactly the public-ready images you want each marketplace export to use, then save selection before downloading CSV.</div><div class="marketplace-history small"><strong>Recent ${esc(channel)} exports:</strong> ${historyButtons || 'No export history yet.'}</div><div class="marketplace-preview-grid">${rows.map(rowCard).join('')}</div>`;
      mount.querySelectorAll('[data-channel]').forEach((button) => button.addEventListener('click', () => load(button.getAttribute('data-channel') || 'etsy')));
      mount.querySelectorAll('[data-save-marketplace-images]').forEach((button) => button.addEventListener('click', () => saveSelection(button.getAttribute('data-save-marketplace-images'))));
      mount.querySelectorAll('[data-rollback-marketplace-selection]').forEach((button) => button.addEventListener('click', () => rollbackSelection(button.getAttribute('data-rollback-marketplace-selection'))));
      mount.querySelectorAll('[data-replay-history]').forEach((button) => button.addEventListener('click', () => replayHistory(button.getAttribute('data-replay-history'))));
      document.getElementById('bulkApplyMarketplaceImages')?.addEventListener('click', bulkApplyRoleOrder);
    } catch (error) { mount.innerHTML = `<p class="small" style="color:#ffb4c1">${esc(error.message || 'Marketplace preview failed.')}</p>`; }
  }
  function fieldPreview(row) {
    const fields = row.field_preview || {};
    const wanted = Array.isArray(row.required_fields) ? row.required_fields.slice(0, 8) : ['title','description','price','image_1'];
    return `<details class="marketplace-field-preview"><summary>CSV field preview</summary><dl>${wanted.map((key) => `<dt>${esc(key)}</dt><dd>${esc(Array.isArray(fields[key]) ? fields[key].join(', ') : fields[key] || '')}</dd>`).join('')}</dl></details>`;
  }
  function rowCard(row) {
    const selected = new Set(row.selected_image_urls || []);
    const images = Array.isArray(row.available_images) ? row.available_images : [];
    return `<article class="card marketplace-preview-card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:start"><div><h3 style="margin:0">${esc(row.name || 'Product')}</h3><p class="small">#${esc(row.product_id)} • ${esc(row.sku || '')}</p></div>${row.ok ? '<span class="admin-status-pill ok">ready</span>' : '<span class="admin-status-pill warning">fix first</span>'}</div><div class="marketplace-image-selector">${images.length ? images.map((img) => `<label class="marketplace-image-choice"><input type="checkbox" data-marketplace-image="${esc(row.product_id)}" value="${esc(img.image_url)}" ${selected.has(img.image_url)?'checked':''}><img src="${esc(img.image_url)}" alt="${esc(img.alt_text || row.name || 'Product image')}"><span>${esc(img.image_role || 'image')}</span></label>`).join('') : '<p class="small">No public-ready images available.</p>'}</div>${fieldPreview(row)}<div class="small">${esc((row.issues || []).join(' • ') || 'No issues')}</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn small" type="button" data-save-marketplace-images="${esc(row.product_id)}">Save image selection</button><button class="btn small secondary" type="button" data-rollback-marketplace-selection="${esc(row.product_id)}">Rollback selection</button></div></article>`;
  }
  async function bulkApplyRoleOrder() { await read(await window.DDAuth.apiFetch('/api/admin/marketplace-export-preview', { method: 'POST', body: JSON.stringify({ channel: currentChannel, action: 'bulk_apply_role_order' }) }), 'Bulk apply failed.'); await load(currentChannel); }
  async function replayHistory(historyId) { await read(await window.DDAuth.apiFetch('/api/admin/marketplace-export-preview', { method: 'POST', body: JSON.stringify({ channel: currentChannel, action: 'replay_history', marketplace_export_history_id: Number(historyId || 0) }) }), 'History replay failed.'); await load(currentChannel); }
  async function rollbackSelection(productId) { await read(await window.DDAuth.apiFetch('/api/admin/marketplace-export-preview', { method: 'POST', body: JSON.stringify({ channel: currentChannel, action: 'rollback_selection', product_id: Number(productId || 0) }) }), 'Rollback failed.'); await load(currentChannel); }
  async function saveSelection(productId) {
    const urls = Array.from(mount.querySelectorAll(`[data-marketplace-image="${CSS.escape(String(productId))}"]:checked`)).map((input) => input.value).filter(Boolean);
    await read(await window.DDAuth.apiFetch('/api/admin/marketplace-export-preview', { method: 'POST', body: JSON.stringify({ channel: currentChannel, product_id: Number(productId), selected_image_urls: urls }) }), 'Image selection failed.');
    await load(currentChannel);
  }
  document.addEventListener('dd:admin-ready', (event) => { if (event?.detail?.ok) load('etsy'); });
  load('etsy');
});
