// File: /public/js/admin-product-bulk-tools.js
// Brief description: Adds bulk product workflow tools to the admin dashboard. It lets admins
// select product IDs for quick bulk updates and preview JSON import rows before a future full
// import step, improving the deeper admin product workflow without replacing the current form.

document.addEventListener('DOMContentLoaded', () => {
  const mountEl = document.getElementById('productsAdminMount');
  if (!mountEl || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  let rendered = false;

  function setMessage(message, isError = false) {
    const el = document.getElementById('adminBulkProductsMessage');
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
      <h3 style="margin-top:0">Bulk Product Tools</h3>
      <p class="small" style="margin-top:0">Use comma-separated product IDs for quick bulk changes, and preview JSON rows for future imports.</p>
      <div id="adminBulkProductsMessage" class="small" style="display:none;margin-bottom:12px"></div>
      <div class="grid cols-2" style="gap:18px">
        <form id="bulkProductUpdateForm" class="grid" style="gap:12px">
          <div>
            <label class="small" for="bulkProductIds">Product IDs</label>
            <input id="bulkProductIds" type="text" placeholder="12, 15, 18" />
          </div>
          <div>
            <label class="small" for="bulkProductStatus">Bulk Status</label>
            <select id="bulkProductStatus">
              <option value="">No Change</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label class="small" for="bulkProductInventory">Inventory Quantity</label>
            <input id="bulkProductInventory" type="number" min="0" step="1" placeholder="Optional" />
          </div>
          <div class="grid cols-2" style="gap:12px"><div><label class="small" for="bulkTaxClassId">Tax Class ID</label><input id="bulkTaxClassId" type="number" min="1" step="1" placeholder="Optional" /></div><div><label class="small" for="bulkInventoryTracking">Inventory Tracking</label><select id="bulkInventoryTracking"><option value="">No Change</option><option value="1">Track Inventory</option><option value="0">Do Not Track</option></select></div></div><div style="display:flex;gap:12px;flex-wrap:wrap">
            <label class="small"><input id="bulkRequiresShipping" type="checkbox" /> Require shipping</label>
            <label class="small"><input id="bulkTaxable" type="checkbox" checked /> Taxable</label>
          </div>
          <div><button class="btn" type="submit" id="bulkProductUpdateButton">Run Bulk Update</button></div>
        </form>
        <form id="productImportPreviewForm" class="grid" style="gap:12px">
          <div>
            <label class="small" for="productImportRows">Import Preview JSON Rows</label>
            <textarea id="productImportRows" rows="10" placeholder='[{"name":"Example","slug":"example","product_type":"physical","price_cents":2500}]'></textarea>
          </div>
          <div><button class="btn" type="submit" id="productImportPreviewButton">Preview Import</button></div>
          <div id="productImportPreviewResults" class="small"></div>
        </form>
      </div>
    `;

    mountEl.appendChild(card);
    document.getElementById('bulkProductUpdateForm')?.addEventListener('submit', onBulkUpdate);
    document.getElementById('productImportPreviewForm')?.addEventListener('submit', onImportPreview);
  }

  function parseIds(text) {
    return String(text || '')
      .split(',')
      .map((part) => Number(String(part).trim()))
      .filter((id) => Number.isInteger(id) && id > 0);
  }

  async function onBulkUpdate(event) {
    event.preventDefault();
    const ids = parseIds(document.getElementById('bulkProductIds')?.value);
    if (!ids.length) {
      setMessage('Please enter at least one valid product ID.', true);
      return;
    }

    const payload = {
      product_ids: ids,
      updates: {}
    };

    const status = String(document.getElementById('bulkProductStatus')?.value || '').trim();
    const inventoryRaw = String(document.getElementById('bulkProductInventory')?.value || '').trim();

    if (status) payload.updates.status = status;
    if (inventoryRaw !== '') payload.updates.inventory_quantity = Number(inventoryRaw);
    const taxClassRaw = String(document.getElementById('bulkTaxClassId')?.value || '').trim();
    const inventoryTrackingRaw = String(document.getElementById('bulkInventoryTracking')?.value || '').trim();
    if (taxClassRaw !== '') payload.updates.tax_class_id = Number(taxClassRaw);
    if (inventoryTrackingRaw !== '') payload.updates.inventory_tracking = Number(inventoryTrackingRaw);
    payload.updates.requires_shipping = document.getElementById('bulkRequiresShipping')?.checked ? 1 : 0;
    payload.updates.taxable = document.getElementById('bulkTaxable')?.checked ? 1 : 0;

    try {
      setMessage('Running bulk product update...');
      const response = await window.DDAuth.apiFetch('/api/admin/bulk-update-products', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Bulk product update failed.');
      setMessage(`Bulk update completed for ${Number(data.updated_count || 0)} product(s).`);
      document.dispatchEvent(new CustomEvent('dd:product-updated', { detail: { bulk: true } }));
    } catch (error) {
      setMessage(error.message || 'Bulk product update failed.', true);
    }
  }

  async function onImportPreview(event) {
    event.preventDefault();
    const outputEl = document.getElementById('productImportPreviewResults');
    if (!outputEl) return;

    let rows;
    try {
      rows = JSON.parse(String(document.getElementById('productImportRows')?.value || '[]'));
    } catch {
      setMessage('Import preview JSON is invalid.', true);
      return;
    }

    try {
      setMessage('Generating import preview...');
      const response = await window.DDAuth.apiFetch('/api/admin/import-products-preview', {
        method: 'POST',
        body: JSON.stringify({ rows })
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Import preview failed.');
      outputEl.innerHTML = `Valid rows: ${Number(data.summary?.valid_rows || 0)} • Invalid rows: ${Number(data.summary?.invalid_rows || 0)}<br>${(data.preview || []).slice(0, 5).map((row) => `Row ${row.row_number}: ${row.valid ? 'OK' : row.issues.join(' ')}`).join('<br>')}`;
      setMessage('Import preview generated.');
    } catch (error) {
      outputEl.textContent = '';
      setMessage(error.message || 'Import preview failed.', true);
    }
  }

  document.addEventListener('dd:admin-ready', (event) => {
    if (!event?.detail?.ok) return;
    render();
  });

  render();
});
