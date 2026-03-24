// File: /public/js/admin-import-products.js
// Brief description: Adds preview-first product import tooling so admins can validate rows,
// duplicates, and media URLs before seeding products into the store.

document.addEventListener('DOMContentLoaded', () => {
  const mountEl = document.getElementById('productsAdminMount');
  if (!mountEl || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  let rendered = false;

  function setMessage(message, isError = false) {
    const el = document.getElementById('adminImportProductsMessage');
    if (!el) return;
    el.textContent = message;
    el.style.display = message ? 'block' : 'none';
    el.style.color = isError ? '#b00020' : '#0a7a2f';
  }

  function render() {
    if (rendered) return;
    rendered = true;
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginTop = '18px';
    card.innerHTML = `
      <h3 style="margin-top:0">Finished Product Import</h3>
      <p class="small" style="margin-top:0">Preview rows before import so duplicate slugs, missing fields, and malformed image URLs are caught early.</p>
      <div id="adminImportProductsMessage" class="small" style="display:none;margin-bottom:12px"></div>
      <div><label class="small" for="adminImportProductsJson">Products JSON</label><textarea id="adminImportProductsJson" rows="10" placeholder='[{"name":"Example Ring","slug":"example-ring","product_type":"physical","status":"active","price_cents":4500,"inventory_tracking":1,"inventory_quantity":3}]'></textarea></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button class="btn" type="button" id="adminPreviewProductImportButton">Preview Import</button><button class="btn" type="button" id="adminRunProductImportButton">Run Import</button></div>
      <div id="adminImportProductsPreview" class="small" style="margin-top:12px">No preview run yet.</div>`;
    mountEl.appendChild(card);
    document.getElementById('adminPreviewProductImportButton')?.addEventListener('click', previewImport);
    document.getElementById('adminRunProductImportButton')?.addEventListener('click', runImport);
  }

  function parseRows() {
    const raw = document.getElementById('adminImportProductsJson')?.value || '[]';
    const rows = JSON.parse(raw);
    if (!Array.isArray(rows)) throw new Error('Products JSON must be an array.');
    return rows;
  }

  async function previewImport() {
    try {
      setMessage('Running import preview...');
      const rows = parseRows();
      const response = await window.DDAuth.apiFetch('/api/admin/import-products-preview', { method: 'POST', body: JSON.stringify({ rows }) });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to preview import.');
      const previewEl = document.getElementById('adminImportProductsPreview');
      const previewRows = Array.isArray(data.preview) ? data.preview : [];
      previewEl.innerHTML = `<strong>${data.summary?.valid_rows || 0}</strong> valid row(s) • <strong>${data.summary?.invalid_rows || 0}</strong> invalid row(s)<br><br>` + (previewRows.map((row) => `${row.row_number}. ${row.normalized?.name || 'Unnamed'} — ${row.valid ? 'valid' : 'invalid'}${row.issues?.length ? ` — ${row.issues.join(' | ')}` : ''}`).join('<br>') || 'No rows to preview.');
      setMessage('Preview complete.');
    } catch (error) {
      setMessage(error.message || 'Failed to preview import.', true);
    }
  }

  async function runImport() {
    try {
      setMessage('Running import...');
      const rows = parseRows();
      const response = await window.DDAuth.apiFetch('/api/admin/import-products', { method: 'POST', body: JSON.stringify({ rows }) });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to import products.');
      setMessage(`Import finished. Inserted ${data.inserted_count || 0} row(s).${data.error_count ? ` ${data.error_count} row(s) failed.` : ''}`);
      document.dispatchEvent(new CustomEvent('dd:product-updated', { detail: { inserted_count: data.inserted_count || 0 } }));
    } catch (error) {
      setMessage(error.message || 'Failed to import products.', true);
    }
  }

  document.addEventListener('dd:admin-ready', (event) => {
    if (!event?.detail?.ok) return;
    render();
  });

  render();
});
