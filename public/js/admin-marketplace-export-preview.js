// File: /public/js/admin-marketplace-export-preview.js
// Brief description: Admin marketplace validation preview, CSV download, and per-channel image selector persistence.
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('marketplaceExportPreviewMount');
  if (!mount || !window.DDAuth) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  let currentChannel = 'etsy';
  async function load(channel = currentChannel) {
    currentChannel = channel;
    mount.innerHTML = '<p class="small">Loading marketplace export preview...</p>';
    try {
      const response = await window.DDAuth.apiFetch(`/api/admin/marketplace-export-preview?channel=${encodeURIComponent(channel)}`);
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Marketplace preview failed.');
      const rows = Array.isArray(data.previews) ? data.previews : [];
      const rule = data.rules || {};
      mount.innerHTML = `<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><h2 style="margin-top:0">${esc(rule.label || channel)} preview</h2><p class="small">Ready ${esc(data.summary?.ready || 0)} / ${esc(data.summary?.total || 0)} • Blocked ${esc(data.summary?.blocked || 0)} • Selected ${esc(data.summary?.selected_products || 0)} product(s)</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-channel="etsy">Etsy</button><button class="btn" data-channel="facebook">Facebook</button><button class="btn" data-channel="pinterest">Pinterest</button><button class="btn" data-channel="manual">Manual</button><a class="btn" href="/admin/marketplace-mapping/">Mapping editor</a><a class="btn primary" href="/api/admin/marketplace-export-preview?channel=${encodeURIComponent(channel)}&format=csv">Download CSV</a></div></div><div class="status-note info small">Select exactly the public-ready images you want each marketplace export to use, then save selection before downloading CSV.</div><div class="marketplace-preview-grid">${rows.map(rowCard).join('')}</div>`;
      mount.querySelectorAll('[data-channel]').forEach((button) => button.addEventListener('click', () => load(button.getAttribute('data-channel') || 'etsy')));
      mount.querySelectorAll('[data-save-marketplace-images]').forEach((button) => button.addEventListener('click', () => saveSelection(button.getAttribute('data-save-marketplace-images'))));
    } catch (error) { mount.innerHTML = `<p class="small" style="color:#ffb4c1">${esc(error.message || 'Marketplace preview failed.')}</p>`; }
  }
  function rowCard(row) {
    const selected = new Set(row.selected_image_urls || []);
    const images = Array.isArray(row.available_images) ? row.available_images : [];
    return `<article class="card marketplace-preview-card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:start"><div><h3 style="margin:0">${esc(row.name || 'Product')}</h3><p class="small">#${esc(row.product_id)} • ${esc(row.sku || '')}</p></div>${row.ok ? '<span class="admin-status-pill ok">ready</span>' : '<span class="admin-status-pill warning">fix first</span>'}</div><div class="marketplace-image-selector">${images.length ? images.map((img) => `<label class="marketplace-image-choice"><input type="checkbox" data-marketplace-image="${esc(row.product_id)}" value="${esc(img.image_url)}" ${selected.has(img.image_url)?'checked':''}><img src="${esc(img.image_url)}" alt="${esc(img.alt_text || row.name || 'Product image')}"><span>${esc(img.image_role || 'image')}</span></label>`).join('') : '<p class="small">No public-ready images available.</p>'}</div><div class="small">${esc((row.issues || []).join(' • ') || 'No issues')}</div><button class="btn small" type="button" data-save-marketplace-images="${esc(row.product_id)}">Save image selection</button></article>`;
  }
  async function saveSelection(productId) {
    const urls = Array.from(mount.querySelectorAll(`[data-marketplace-image="${CSS.escape(String(productId))}"]:checked`)).map((input) => input.value).filter(Boolean);
    const response = await window.DDAuth.apiFetch('/api/admin/marketplace-export-preview', { method: 'POST', body: JSON.stringify({ channel: currentChannel, product_id: Number(productId), selected_image_urls: urls }) });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Image selection failed.');
    await load(currentChannel);
  }
  document.addEventListener('dd:admin-ready', (event) => { if (event?.detail?.ok) load('etsy'); });
  load('etsy');
});
