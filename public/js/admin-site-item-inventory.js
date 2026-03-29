// File: /public/js/admin-site-item-inventory.js
// Brief description: Admin editor for tools and supplies inventory, reorder queues,
// do-not-reuse flags, sync actions, and movement history with visual item references.

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
  function fmtMoney(cents) { return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'CAD' }).format(Number(cents || 0) / 100); }
  function escapeHtml(v) { return String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'", '&#039;'); }
  function debounce(fn, wait) { let t = null; return () => { clearTimeout(t); t = setTimeout(() => fn(), wait); }; }
  function setValue(id, value) { const el = document.getElementById(id); if (el) el.textContent = String(value ?? '—'); }

  function render() {
    if (rendered) return;
    rendered = true;
    mountEl.innerHTML = `
      <div class="card" style="margin-top:18px">
        <h3 style="margin-top:0">Tools & Supplies Inventory Operations</h3>
        <p class="small" style="margin-top:0">Track quantities, reorder lists, do-not-reuse flags, supplier details, item images, and movement history for tools and supplies.</p>
        <div id="siteInventoryMessage" class="small" style="display:none;margin-bottom:12px"></div>
        <div class="grid cols-6" style="gap:12px;margin-bottom:12px">
          <div class="card"><div class="small">Items</div><div id="siteInventoryTotalItems" style="font-size:1.15rem;font-weight:800">—</div></div>
          <div class="card"><div class="small">Active</div><div id="siteInventoryActiveItems" style="font-size:1.15rem;font-weight:800">—</div></div>
          <div class="card"><div class="small">Low Stock</div><div id="siteInventoryLowStock" style="font-size:1.15rem;font-weight:800">—</div></div>
          <div class="card"><div class="small">Reserved</div><div id="siteInventoryReserved" style="font-size:1.15rem;font-weight:800">—</div></div>
          <div class="card"><div class="small">Incoming</div><div id="siteInventoryIncoming" style="font-size:1.15rem;font-weight:800">—</div></div>
          <div class="card"><div class="small">Reorder List</div><div id="siteInventoryReorderListCount" style="font-size:1.15rem;font-weight:800">—</div></div>
        </div>
        <form id="siteInventoryForm" class="grid" style="gap:12px">
          <div class="grid cols-4" style="gap:12px">
            <div><label class="small" for="siteInventorySourceType">Source Type</label><select id="siteInventorySourceType"><option value="tool">Tool</option><option value="supply">Supply</option><option value="product">Product</option><option value="other">Other</option></select></div>
            <div><label class="small" for="siteInventoryExternalKey">External Key</label><input id="siteInventoryExternalKey" type="text" placeholder="sku, source key, item id" /></div>
            <div><label class="small" for="siteInventoryItemName">Item Name</label><input id="siteInventoryItemName" type="text" /></div>
            <div><label class="small" for="siteInventoryCategory">Category</label><input id="siteInventoryCategory" type="text" /></div>
          </div>
          <div class="grid cols-4" style="gap:12px">
            <div><label class="small" for="siteInventoryImageUrl">Image URL</label><input id="siteInventoryImageUrl" type="url" placeholder="https://..." /></div>
            <div><label class="small" for="siteInventorySourceUrl">Source URL</label><input id="siteInventorySourceUrl" type="url" placeholder="https://..." /></div>
            <div><label class="small" for="siteInventoryAmazonUrl">Amazon URL</label><input id="siteInventoryAmazonUrl" type="url" placeholder="https://..." /></div>
            <div><label class="small" for="siteInventoryIsActive">Status</label><select id="siteInventoryIsActive"><option value="1">Active</option><option value="0">Inactive</option></select></div>
          </div>
          <div class="grid cols-5" style="gap:12px">
            <div><label class="small" for="siteInventoryOnHand">On Hand</label><input id="siteInventoryOnHand" type="number" min="0" step="1" value="0" /></div>
            <div><label class="small" for="siteInventoryReservedInput">Reserved</label><input id="siteInventoryReservedInput" type="number" min="0" step="1" value="0" /></div>
            <div><label class="small" for="siteInventoryIncomingInput">Incoming</label><input id="siteInventoryIncomingInput" type="number" min="0" step="1" value="0" /></div>
            <div><label class="small" for="siteInventoryReorder">Reorder At</label><input id="siteInventoryReorder" type="number" min="0" step="1" value="0" /></div>
            <div><label class="small" for="siteInventoryPreferredReorderQty">Preferred Reorder Qty</label><input id="siteInventoryPreferredReorderQty" type="number" min="0" step="1" value="0" /></div>
          </div>
          <div class="grid cols-4" style="gap:12px">
            <div><label class="small" for="siteInventoryUnitCost">Unit Cost (cents)</label><input id="siteInventoryUnitCost" type="number" min="0" step="1" value="0" /></div>
            <div><label class="small" for="siteInventorySupplierName">Supplier</label><input id="siteInventorySupplierName" type="text" /></div>
            <div><label class="small" for="siteInventorySupplierSku">Supplier SKU</label><input id="siteInventorySupplierSku" type="text" /></div>
            <div><label class="small" for="siteInventorySupplierContact">Supplier Contact</label><input id="siteInventorySupplierContact" type="text" placeholder="email or phone" /></div>
            <div><label class="small" for="siteInventoryReuseStatus">Reuse Status</label><input id="siteInventoryReuseStatus" type="text" placeholder="wash, refill, one-time use" /></div>
          </div>
          <div class="grid cols-4" style="gap:12px">
            <label class="small" style="display:flex;gap:8px;align-items:center"><input id="siteInventoryOnReorderList" type="checkbox" /> On reorder list</label>
            <label class="small" style="display:flex;gap:8px;align-items:center"><input id="siteInventoryDoNotReorder" type="checkbox" /> Do not reorder</label>
            <label class="small" style="display:flex;gap:8px;align-items:center"><input id="siteInventoryDoNotReuse" type="checkbox" /> Do not reuse</label>
            <div></div>
          </div>
          <div class="grid cols-2" style="gap:12px">
            <div><label class="small" for="siteInventoryNotes">Reorder / Usage Notes</label><input id="siteInventoryNotes" type="text" /></div>
            <div><label class="small" for="siteInventoryMovementNote">Movement Note</label><input id="siteInventoryMovementNote" type="text" placeholder="restock, count correction, incoming order..." /></div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" type="submit">Save Inventory Item</button><button class="btn" type="button" id="siteInventoryResetButton">Reset Form</button></div>
        </form>

        <div class="grid cols-4" style="gap:12px;align-items:end;margin-top:16px">
          <div><label class="small" for="siteInventorySearch">Search</label><input id="siteInventorySearch" type="text" placeholder="name, category, supplier" /></div>
          <div><label class="small" for="siteInventoryStockView">Stock view</label><select id="siteInventoryStockView"><option value="">All items</option><option value="low">Low stock</option><option value="reorder">Reorder list</option><option value="no_reuse">Do not reuse</option></select></div>
          <div style="align-self:end;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" id="siteInventoryRefreshButton">Refresh</button><button class="btn" type="button" id="siteInventorySyncToolsButton">Sync tools</button><button class="btn" type="button" id="siteInventorySyncSuppliesButton">Sync supplies</button></div>
        </div>

        <div class="admin-table-wrap" style="margin-top:12px"><table><thead><tr><th>Item</th><th>Stock</th><th>Rules</th><th>Supplier</th><th>Linked Products</th><th>Cost</th><th>Actions</th></tr></thead><tbody id="siteInventoryList"><tr><td colspan="7" style="padding:8px">Loading inventory...</td></tr></tbody></table></div>
        <div class="card" style="margin-top:16px"><h4 style="margin-top:0">Recent Inventory Movements</h4><div class="admin-table-wrap"><table><thead><tr><th>When</th><th>Item</th><th>Type</th><th>On Hand</th><th>Note</th></tr></thead><tbody id="siteInventoryMovementList"><tr><td colspan="5" style="padding:8px">Loading movement history...</td></tr></tbody></table></div></div>
      </div>`;

    document.getElementById('siteInventoryForm')?.addEventListener('submit', saveItem);
    document.getElementById('siteInventoryRefreshButton')?.addEventListener('click', loadList);
    document.getElementById('siteInventoryStockView')?.addEventListener('change', loadList);
    document.getElementById('siteInventorySyncToolsButton')?.addEventListener('click', () => syncCatalog(['tool']));
    document.getElementById('siteInventorySyncSuppliesButton')?.addEventListener('click', () => syncCatalog(['supply']));
    document.getElementById('siteInventorySearch')?.addEventListener('input', debounce(loadList, 250));
    document.getElementById('siteInventoryResetButton')?.addEventListener('click', () => document.getElementById('siteInventoryForm')?.reset());
    mountEl.addEventListener('click', onTableClick);
  }

  function readForm() {
    return {
      source_type: document.getElementById('siteInventorySourceType')?.value || 'tool',
      external_key: document.getElementById('siteInventoryExternalKey')?.value || '',
      item_name: document.getElementById('siteInventoryItemName')?.value || '',
      category: document.getElementById('siteInventoryCategory')?.value || '',
      image_url: document.getElementById('siteInventoryImageUrl')?.value || '',
      on_hand_quantity: Number(document.getElementById('siteInventoryOnHand')?.value || 0),
      reserved_quantity: Number(document.getElementById('siteInventoryReservedInput')?.value || 0),
      incoming_quantity: Number(document.getElementById('siteInventoryIncomingInput')?.value || 0),
      reorder_level: Number(document.getElementById('siteInventoryReorder')?.value || 0),
      preferred_reorder_quantity: Number(document.getElementById('siteInventoryPreferredReorderQty')?.value || 0),
      unit_cost_cents: Number(document.getElementById('siteInventoryUnitCost')?.value || 0),
      supplier_name: document.getElementById('siteInventorySupplierName')?.value || '',
      supplier_sku: document.getElementById('siteInventorySupplierSku')?.value || '',
      supplier_contact: document.getElementById('siteInventorySupplierContact')?.value || '',
      amazon_url: document.getElementById('siteInventoryAmazonUrl')?.value || '',
      source_url: document.getElementById('siteInventorySourceUrl')?.value || '',
      reorder_notes: document.getElementById('siteInventoryNotes')?.value || '',
      movement_note: document.getElementById('siteInventoryMovementNote')?.value || '',
      is_active: Number(document.getElementById('siteInventoryIsActive')?.value || 1),
      is_on_reorder_list: document.getElementById('siteInventoryOnReorderList')?.checked ? 1 : 0,
      do_not_reorder: document.getElementById('siteInventoryDoNotReorder')?.checked ? 1 : 0,
      do_not_reuse: document.getElementById('siteInventoryDoNotReuse')?.checked ? 1 : 0,
      reuse_status: document.getElementById('siteInventoryReuseStatus')?.value || ''
    };
  }

  function renderMovements(movements) {
    const body = document.getElementById('siteInventoryMovementList');
    if (!body) return;
    if (!Array.isArray(movements) || !movements.length) {
      body.innerHTML = '<tr><td colspan="5" style="padding:8px">No movement history recorded yet.</td></tr>';
      return;
    }
    body.innerHTML = movements.map((row) => `<tr><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(row.created_at || '—')}</td><td style="padding:8px;border-bottom:1px solid #ddd"><strong>${escapeHtml(row.item_name || '—')}</strong><div class="small">${escapeHtml(row.source_type || '')}</div></td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(row.movement_type || 'adjustment')}<div class="small">Δ ${row.quantity_delta || 0}</div></td><td style="padding:8px;border-bottom:1px solid #ddd">${row.previous_on_hand_quantity || 0} → ${row.new_on_hand_quantity || 0}<div class="small">Res ${row.previous_reserved_quantity || 0} → ${row.new_reserved_quantity || 0} • In ${row.previous_incoming_quantity || 0} → ${row.new_incoming_quantity || 0}</div></td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(row.note || '—')}</td></tr>`).join('');
  }

  async function syncCatalog(sourceTypes) {
    try {
      setMessage(`Syncing ${sourceTypes.join(', ')} catalog items into inventory...`);
      const response = await window.DDAuth.apiFetch('/api/admin/site-item-inventory', { method: 'POST', body: JSON.stringify({ action: 'sync_catalog', source_types: sourceTypes }) });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to sync catalog items.');
      setMessage(`Synced ${Number(data.synced || 0)} ${sourceTypes.join('/')} inventory items.`);
      await loadList();
    } catch (err) {
      setMessage(err.message || 'Failed to sync catalog items.', true);
    }
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
      const stockView = document.getElementById('siteInventoryStockView')?.value || '';
      const response = await window.DDAuth.apiFetch(`/api/admin/site-item-inventory?q=${encodeURIComponent(q)}&include_history=1&stock_view=${encodeURIComponent(stockView)}`);
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to load inventory list.');
      const summary = data.summary || {};
      setValue('siteInventoryTotalItems', summary.total_items || 0);
      setValue('siteInventoryActiveItems', summary.active_items || 0);
      setValue('siteInventoryLowStock', summary.low_stock_items || 0);
      setValue('siteInventoryReserved', summary.total_reserved || 0);
      setValue('siteInventoryIncoming', summary.total_incoming || 0);
      setValue('siteInventoryReorderListCount', summary.reorder_list_items || 0);
      const items = Array.isArray(data.items) ? data.items : [];
      const body = document.getElementById('siteInventoryList');
      if (!body) return;
      if (!items.length) {
        body.innerHTML = '<tr><td colspan="7" style="padding:8px">No site inventory items matched the current view.</td></tr>';
      } else {
        body.innerHTML = items.map((x) => `<tr><td style="padding:8px;border-bottom:1px solid #ddd">${x.image_url ? `<img src="${escapeHtml(x.image_url)}" alt="${escapeHtml(x.item_name)}" style="width:52px;height:52px;object-fit:cover;border-radius:10px;display:block;margin-bottom:8px"/>` : ''}${x.needs_reorder ? '⚠️ ' : ''}<strong>${escapeHtml(x.item_name)}</strong><div class="small">${escapeHtml(x.source_type)} • ${escapeHtml(x.category || '—')}</div></td><td style="padding:8px;border-bottom:1px solid #ddd">On hand ${x.on_hand_quantity}<div class="small">Reserved ${x.reserved_quantity} • Incoming ${x.incoming_quantity} • Reorder ${x.reorder_level}</div><div class="small">Preferred reorder ${x.preferred_reorder_quantity || 0}</div></td><td style="padding:8px;border-bottom:1px solid #ddd"><div class="small">${x.is_on_reorder_list ? 'On reorder list' : 'Not queued'}</div><div class="small">${x.do_not_reorder ? 'Do not reorder' : 'Can reorder'}</div><div class="small">${x.do_not_reuse ? 'Do not reuse' : (x.reuse_status || 'Reusable/normal')}</div></td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(x.supplier_name || '—')}<div class="small">${escapeHtml(x.supplier_sku || '')}</div><div class="small">${escapeHtml(x.supplier_contact || '')}</div></td><td style="padding:8px;border-bottom:1px solid #ddd">${Number(x.linked_product_count || 0)}<div class="small">${escapeHtml(x.linked_product_names || '')}</div></td><td style="padding:8px;border-bottom:1px solid #ddd">${fmtMoney(x.unit_cost_cents || 0)}</td><td style="padding:8px;border-bottom:1px solid #ddd"><button class="btn" type="button" data-edit-id="${x.site_item_inventory_id}" data-item='${escapeHtml(JSON.stringify(x))}'>Quick Update</button> <button class="btn" type="button" data-adjust-action="reserve" data-id="${x.site_item_inventory_id}">Reserve</button> <button class="btn" type="button" data-adjust-action="receive" data-id="${x.site_item_inventory_id}">Receive</button> <button class="btn" type="button" data-adjust-action="reorder_request" data-id="${x.site_item_inventory_id}">Reorder</button> <button class="btn" type="button" data-delete-id="${x.site_item_inventory_id}">Delete</button></td></tr>`).join('');
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
      let item = null; try { item = JSON.parse(editBtn.getAttribute('data-item') || '{}'); } catch {}
      const id = Number(item?.site_item_inventory_id || editBtn.getAttribute('data-edit-id') || 0);
      if (!id) return;
      const onHand = Number(window.prompt('New on-hand quantity?', String(item?.on_hand_quantity ?? 0)));
      if (Number.isNaN(onHand)) return;
      const reorderList = window.confirm('Put this item on the reorder list? Click Cancel to leave it off.');
      const doNotReuse = window.confirm('Mark this item as DO NOT REUSE? Click Cancel to leave reusable/normal.');
      const movementNote = String(window.prompt('Movement note?', 'Manual stock count correction') || '').trim();
      try {
        setMessage('Updating inventory item...');
        const response = await window.DDAuth.apiFetch('/api/admin/site-item-inventory', { method: 'PATCH', body: JSON.stringify({ site_item_inventory_id: id, item_name: item?.item_name || '', on_hand_quantity: onHand, is_on_reorder_list: reorderList ? 1 : 0, do_not_reuse: doNotReuse ? 1 : 0, movement_note: movementNote || 'Inventory quantity updated.' }) });
        const data = await response.json();
        if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to update inventory item.');
        await loadList();
      } catch (error) {
        setMessage(error.message || 'Failed to update inventory item.', true);
      }
      return;
    }

    const adjustBtn = event.target.closest('[data-adjust-action]');
    if (adjustBtn) {
      const id = Number(adjustBtn.getAttribute('data-id') || 0);
      const action = String(adjustBtn.getAttribute('data-adjust-action') || '').trim();
      if (!id || !action) return;
      const qty = Number(window.prompt('Quantity?', '1'));
      if (!Number.isFinite(qty) || qty <= 0) return;
      const note = String(window.prompt('Note?', action === 'reorder_request' ? 'Manual reorder request' : `Inventory ${action}`) || '').trim();
      try {
        setMessage(`Running ${action}...`);
        const response = await window.DDAuth.apiFetch('/api/admin/site-item-inventory', { method: 'POST', body: JSON.stringify({ action, site_item_inventory_id: id, quantity: qty, note }) });
        const data = await response.json();
        if (!response.ok || !data?.ok) throw new Error(data?.error || `Failed to ${action}.`);
        await loadList();
      } catch (error) {
        setMessage(error.message || `Failed to ${action}.`, true);
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

  document.addEventListener('dd:admin-ready', (event) => { if (!event?.detail?.ok) return; render(); loadList(); });
  render();
});
