// File: /public/js/admin-site-item-inventory.js
// Brief description: Adds deeper inventory operations for products, tools, and supplies,
// including movement history, low-stock visibility, and editable admin actions.

document.addEventListener('DOMContentLoaded', () => {
  const mountEl = document.getElementById('siteInventoryAdminMount');
  if (!mountEl || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  let rendered = false;

  function setMessage(message, isError = false) {
    const el = document.getElementById('siteInventoryMessage');
    if (!el) return;
    el.textContent = message;
    el.style.display = message ? 'block' : 'none';
    el.style.color = isError ? '#b00020' : '#0a7a2f';
  }

  function fmtMoney(cents) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'CAD' }).format(Number(cents || 0) / 100);
  }

  function escapeHtml(value) {
    return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function render() {
    if (rendered) return;
    rendered = true;
    mountEl.innerHTML = `
      <div class="card" style="margin-top:18px">
        <h3 style="margin-top:0">Site Inventory Operations</h3>
        <p class="small" style="margin-top:0">Track sellable products, tools, and supplies with on-hand, reserved, incoming, reorder, supplier details, movement history, and a staged path toward unified D1-backed catalog data.</p>
        <div id="siteInventoryMessage" class="small" style="display:none;margin-bottom:12px"></div>
        <div class="grid cols-5" style="gap:12px;margin-bottom:12px">
          <div class="card"><div class="small">Items</div><div id="siteInventoryTotalItems" style="font-size:1.15rem;font-weight:800">—</div></div>
          <div class="card"><div class="small">Active</div><div id="siteInventoryActiveItems" style="font-size:1.15rem;font-weight:800">—</div></div>
          <div class="card"><div class="small">Low Stock</div><div id="siteInventoryLowStock" style="font-size:1.15rem;font-weight:800">—</div></div>
          <div class="card"><div class="small">Reserved</div><div id="siteInventoryReserved" style="font-size:1.15rem;font-weight:800">—</div></div>
          <div class="card"><div class="small">Incoming</div><div id="siteInventoryIncoming" style="font-size:1.15rem;font-weight:800">—</div></div>
        </div>
        <form id="siteInventoryForm" class="grid" style="gap:12px">
          <div class="grid cols-4" style="gap:12px">
            <div><label class="small" for="siteInventorySourceType">Source Type</label><select id="siteInventorySourceType"><option value="product">Product</option><option value="tool">Tool</option><option value="supply">Supply</option><option value="other">Other</option></select></div>
            <div><label class="small" for="siteInventoryExternalKey">External Key</label><input id="siteInventoryExternalKey" type="text" placeholder="sku, product slug, item id" /></div>
            <div><label class="small" for="siteInventoryItemName">Item Name</label><input id="siteInventoryItemName" type="text" /></div>
            <div><label class="small" for="siteInventoryCategory">Category</label><input id="siteInventoryCategory" type="text" /></div>
          </div>
          <div class="grid cols-4" style="gap:12px">
            <div><label class="small" for="siteInventoryOnHand">On Hand</label><input id="siteInventoryOnHand" type="number" min="0" step="1" value="0" /></div>
            <div><label class="small" for="siteInventoryReservedInput">Reserved</label><input id="siteInventoryReservedInput" type="number" min="0" step="1" value="0" /></div>
            <div><label class="small" for="siteInventoryIncomingInput">Incoming</label><input id="siteInventoryIncomingInput" type="number" min="0" step="1" value="0" /></div>
            <div><label class="small" for="siteInventoryReorder">Reorder At</label><input id="siteInventoryReorder" type="number" min="0" step="1" value="0" /></div>
          </div>
          <div class="grid cols-4" style="gap:12px">
            <div><label class="small" for="siteInventoryUnitCost">Unit Cost (cents)</label><input id="siteInventoryUnitCost" type="number" min="0" step="1" value="0" /></div>
            <div><label class="small" for="siteInventorySupplierName">Supplier</label><input id="siteInventorySupplierName" type="text" /></div>
            <div><label class="small" for="siteInventorySupplierSku">Supplier SKU</label><input id="siteInventorySupplierSku" type="text" /></div>
            <div><label class="small" for="siteInventoryIsActive">Status</label><select id="siteInventoryIsActive"><option value="1">Active</option><option value="0">Inactive</option></select></div>
          </div>
          <div class="grid cols-2" style="gap:12px">
            <div><label class="small" for="siteInventorySourceUrl">Source URL</label><input id="siteInventorySourceUrl" type="url" placeholder="https://..." /></div>
            <div><label class="small" for="siteInventoryAmazonUrl">Amazon URL</label><input id="siteInventoryAmazonUrl" type="url" placeholder="https://..." /></div>
          </div>
          <div class="grid cols-2" style="gap:12px">
            <div><label class="small" for="siteInventoryNotes">Notes</label><input id="siteInventoryNotes" type="text" /></div>
            <div><label class="small" for="siteInventoryMovementNote">Movement Note</label><input id="siteInventoryMovementNote" type="text" placeholder="restock, count correction, incoming order..." /></div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" type="submit">Save Inventory Item</button><button class="btn" type="button" id="siteInventoryResetButton">Reset Form</button></div>
        </form>
        <div class="grid cols-2" style="gap:12px;margin-top:16px">
          <div><label class="small" for="siteInventorySearch">Search</label><input id="siteInventorySearch" type="text" placeholder="name, category, supplier" /></div>
          <div style="align-self:end"><button class="btn" type="button" id="siteInventoryRefreshButton">Refresh List</button></div>
        </div>
        <div style="overflow:auto;margin-top:12px"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Item</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Stock</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Supplier</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Cost</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Actions</th></tr></thead><tbody id="siteInventoryList"><tr><td colspan="5" style="padding:8px">Loading inventory...</td></tr></tbody></table></div>
        <div class="card" style="margin-top:16px">
          <h4 style="margin-top:0">Recent Inventory Movements</h4>
          <div style="overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">When</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Item</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Type</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">On Hand</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Note</th></tr></thead><tbody id="siteInventoryMovementList"><tr><td colspan="5" style="padding:8px">Loading movement history...</td></tr></tbody></table></div>
        </div>
      </div>`;

    document.getElementById('siteInventoryForm')?.addEventListener('submit', saveItem);
    document.getElementById('siteInventoryRefreshButton')?.addEventListener('click', loadList);
    document.getElementById('siteInventorySearch')?.addEventListener('input', debounce(loadList, 250));
    document.getElementById('siteInventoryResetButton')?.addEventListener('click', () => document.getElementById('siteInventoryForm')?.reset());
    mountEl.addEventListener('click', onTableClick);
  }

  function debounce(fn, wait) {
    let timer = null;
    return function debounced() {
      clearTimeout(timer);
      timer = setTimeout(() => fn(), wait);
    };
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value ?? '—');
  }

  function readForm() {
    return {
      source_type: document.getElementById('siteInventorySourceType')?.value || 'tool',
      external_key: document.getElementById('siteInventoryExternalKey')?.value || '',
      item_name: document.getElementById('siteInventoryItemName')?.value || '',
      category: document.getElementById('siteInventoryCategory')?.value || '',
      on_hand_quantity: Number(document.getElementById('siteInventoryOnHand')?.value || 0),
      reserved_quantity: Number(document.getElementById('siteInventoryReservedInput')?.value || 0),
      incoming_quantity: Number(document.getElementById('siteInventoryIncomingInput')?.value || 0),
      reorder_level: Number(document.getElementById('siteInventoryReorder')?.value || 0),
      unit_cost_cents: Number(document.getElementById('siteInventoryUnitCost')?.value || 0),
      supplier_name: document.getElementById('siteInventorySupplierName')?.value || '',
      supplier_sku: document.getElementById('siteInventorySupplierSku')?.value || '',
      amazon_url: document.getElementById('siteInventoryAmazonUrl')?.value || '',
      source_url: document.getElementById('siteInventorySourceUrl')?.value || '',
      reorder_notes: document.getElementById('siteInventoryNotes')?.value || '',
      movement_note: document.getElementById('siteInventoryMovementNote')?.value || '',
      is_active: Number(document.getElementById('siteInventoryIsActive')?.value || 1)
    };
  }

  function renderMovements(movements) {
    const body = document.getElementById('siteInventoryMovementList');
    if (!body) return;
    if (!Array.isArray(movements) || !movements.length) {
      body.innerHTML = '<tr><td colspan="5" style="padding:8px">No movement history recorded yet.</td></tr>';
      return;
    }
    body.innerHTML = movements.map((row) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(row.created_at || '—')}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd"><strong>${escapeHtml(row.item_name || '—')}</strong><div class="small">${escapeHtml(row.source_type || '')}</div></td>
        <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(row.movement_type || 'adjustment')}<div class="small">Δ ${row.quantity_delta || 0}</div></td>
        <td style="padding:8px;border-bottom:1px solid #ddd">${row.previous_on_hand_quantity || 0} → ${row.new_on_hand_quantity || 0}<div class="small">Res ${row.previous_reserved_quantity || 0} → ${row.new_reserved_quantity || 0} • In ${row.previous_incoming_quantity || 0} → ${row.new_incoming_quantity || 0}</div></td>
        <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(row.note || '—')}</td>
      </tr>`).join('');
  }

  async function saveItem(event) {
    event.preventDefault();
    try {
      setMessage('Saving inventory item...');
      const response = await window.DDAuth.apiFetch('/api/admin/site-item-inventory', { method: 'POST', body: JSON.stringify(readForm()) });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to save inventory item.');
      setMessage('Inventory item saved.');
      document.getElementById('siteInventoryForm')?.reset();
      await loadList();
    } catch (err) {
      setMessage(err.message || 'Failed to save inventory item.', true);
    }
  }

  async function loadList() {
    try {
      setMessage('Loading inventory list...');
      const q = document.getElementById('siteInventorySearch')?.value || '';
      const response = await window.DDAuth.apiFetch(`/api/admin/site-item-inventory?q=${encodeURIComponent(q)}&include_history=1`);
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to load inventory list.');
      const summary = data.summary || {};
      setValue('siteInventoryTotalItems', summary.total_items || 0);
      setValue('siteInventoryActiveItems', summary.active_items || 0);
      setValue('siteInventoryLowStock', summary.low_stock_items || 0);
      setValue('siteInventoryReserved', summary.total_reserved || 0);
      setValue('siteInventoryIncoming', summary.total_incoming || 0);
      const items = Array.isArray(data.items) ? data.items : [];
      const body = document.getElementById('siteInventoryList');
      if (!body) return;
      if (!items.length) {
        body.innerHTML = '<tr><td colspan="5" style="padding:8px">No site inventory items saved yet.</td></tr>';
      } else {
        body.innerHTML = items.map((x) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #ddd">${x.needs_reorder ? '⚠️ ' : ''}<strong>${escapeHtml(x.item_name)}</strong><div class="small">${escapeHtml(x.source_type)} • ${escapeHtml(x.category || '—')}</div></td>
            <td style="padding:8px;border-bottom:1px solid #ddd">On hand ${x.on_hand_quantity}<br><span class="small">Reserved ${x.reserved_quantity} • Incoming ${x.incoming_quantity} • Reorder ${x.reorder_level}</span></td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(x.supplier_name || '—')}<div class="small">${escapeHtml(x.supplier_sku || '')}</div></td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${fmtMoney(x.unit_cost_cents || 0)}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd"><button class="btn" type="button" data-edit-id="${x.site_item_inventory_id}" data-item-name="${escapeHtml(x.item_name)}">Quick Update</button> <button class="btn" type="button" data-delete-id="${x.site_item_inventory_id}">Delete</button></td>
          </tr>`).join('');
      }
      renderMovements(data.movements || []);
      setMessage('');
    } catch (err) {
      setMessage(err.message || 'Failed to load inventory list.', true);
    }
  }

  async function onTableClick(event) {
    const editBtn = event.target.closest('[data-edit-id]');
    const deleteBtn = event.target.closest('[data-delete-id]');
    if (editBtn) {
      const id = Number(editBtn.getAttribute('data-edit-id') || 0);
      const itemName = String(editBtn.getAttribute('data-item-name') || '').trim();
      const onHand = Number(window.prompt('New on-hand quantity?', '0'));
      const movementNote = String(window.prompt('Movement note?', 'Manual stock count correction') || '').trim();
      if (!id || !itemName || Number.isNaN(onHand)) return;
      try {
        setMessage('Updating inventory item...');
        const response = await window.DDAuth.apiFetch('/api/admin/site-item-inventory', {
          method: 'PATCH',
          body: JSON.stringify({ site_item_inventory_id: id, item_name: itemName, on_hand_quantity: onHand, movement_note: movementNote || 'Inventory quantity updated.' })
        });
        const data = await response.json();
        if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to update inventory item.');
        await loadList();
      } catch (error) {
        setMessage(error.message || 'Failed to update inventory item.', true);
      }
      return;
    }
    if (deleteBtn) {
      const id = Number(deleteBtn.getAttribute('data-delete-id') || 0);
      if (!id || !window.confirm('Delete this inventory item?')) return;
      try {
        setMessage('Deleting inventory item...');
        const response = await window.DDAuth.apiFetch(`/api/admin/site-item-inventory?site_item_inventory_id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to delete inventory item.');
        await loadList();
      } catch (error) {
        setMessage(error.message || 'Failed to delete inventory item.', true);
      }
    }
  }

  document.addEventListener('dd:admin-ready', (event) => {
    if (!event?.detail?.ok) return;
    render();
    loadList();
  });

  render();
});
