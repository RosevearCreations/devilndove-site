// File: /public/js/admin-marketplace-export-preview.js
// Brief description: Admin marketplace image/listing validation preview before CSV export downloads.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('marketplaceExportPreviewMount');
  if (!mount || !window.DDAuth) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  async function load(channel = 'etsy') {
    mount.innerHTML = '<p class="small">Loading marketplace export preview...</p>';
    try {
      const response = await window.DDAuth.apiFetch(`/api/admin/marketplace-export-preview?channel=${encodeURIComponent(channel)}`);
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Marketplace preview failed.');
      const rows = Array.isArray(data.previews) ? data.previews : [];
      mount.innerHTML = `<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><h2 style="margin-top:0">${esc(channel)} preview</h2><p class="small">Ready ${esc(data.summary?.ready || 0)} / ${esc(data.summary?.total || 0)} • Blocked ${esc(data.summary?.blocked || 0)}</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-channel="etsy">Etsy</button><button class="btn" data-channel="facebook">Facebook</button><button class="btn" data-channel="pinterest">Pinterest</button><button class="btn" data-channel="manual">Manual</button></div></div><div class="admin-table-wrap"><table><thead><tr><th>Product</th><th>Images</th><th>Status</th><th>Issues</th></tr></thead><tbody>${rows.map((row) => `<tr><td><strong>${esc(row.name || 'Product')}</strong><br><span class="small">#${esc(row.product_id)} • ${esc(row.sku || '')}</span></td><td>${esc(row.image_count)} images<br><span class="small">${esc(row.public_ready_images)} public-ready</span></td><td>${row.ok ? '<span class="admin-status-pill ok">ready</span>' : '<span class="admin-status-pill warning">fix first</span>'}</td><td class="small">${esc((row.issues || []).join(' • ') || 'No issues')}</td></tr>`).join('')}</tbody></table></div>`;
      mount.querySelectorAll('[data-channel]').forEach((button) => button.addEventListener('click', () => load(button.getAttribute('data-channel') || 'etsy')));
    } catch (error) { mount.innerHTML = `<p class="small" style="color:#ffb4c1">${esc(error.message || 'Marketplace preview failed.')}</p>`; }
  }
  document.addEventListener('dd:admin-ready', (event) => { if (event?.detail?.ok) load('etsy'); });
  load('etsy');
});
