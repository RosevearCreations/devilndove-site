// Build 221 — purchase-lot editor, reconciliation review and depletion preferences.
(() => {
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
  const money = (cents) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'CAD' }).format(Number(cents || 0) / 100);
  let selectedItemId = 0;
  let detail = null;

  function mount() {
    let node = document.getElementById('inventoryLotsAdminMount');
    if (node) return node;
    const host = document.getElementById('siteInventoryAdminMount');
    if (!host) return null;
    node = document.createElement('section');
    node.id = 'inventoryLotsAdminMount';
    node.className = 'card inventory-lots-admin';
    node.style.marginTop = '16px';
    host.parentNode?.insertBefore(node, host.nextSibling);
    return node;
  }

  function msg(text = '', error = false) {
    const node = document.getElementById('inventoryLotsMessage');
    if (!node) return;
    node.textContent = text;
    node.hidden = !text;
    node.className = `small ${error ? 'is-error' : 'is-success'}`;
  }

  async function load(itemId) {
    selectedItemId = Number(itemId || 0);
    detail = null;
    render();
    if (!selectedItemId) return;
    try {
      const response = await DDAuth.apiFetch(`/api/admin/inventory-lots?site_item_inventory_id=${encodeURIComponent(selectedItemId)}`);
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Purchase lots could not load.');
      detail = data.detail;
      render();
    } catch (error) { msg(error.message, true); }
  }

  function lotRow(lot) {
    return `<tr>
      <td>${esc(lot.lot_code)}</td>
      <td>${esc(lot.purchase_date || '—')}</td>
      <td>${esc(lot.supplier_name || '—')}<div class="small">${esc(lot.supplier_order_number || '')}</div></td>
      <td>${lot.quantity_remaining} / ${lot.quantity_received}</td>
      <td>${money(lot.unit_cost_cents)}</td>
      <td>${esc(lot.expiry_date || '—')}</td>
      <td>${esc(lot.lot_status || 'available')}</td>
      <td><button class="btn" type="button" data-edit-lot='${esc(JSON.stringify(lot))}'>Edit</button><button class="btn danger" type="button" data-delete-lot="${lot.inventory_purchase_lot_id}">Delete</button></td>
    </tr>`;
  }

  function reconciliationRow(row) {
    return `<tr><td>${esc(row.reviewed_at || '')}</td><td>${Number(row.main_on_hand_quantity || 0)}</td><td>${Number(row.lot_remaining_quantity || 0)}</td><td>${Number(row.discrepancy_quantity || 0)}</td><td>${Number(row.applied_to_main_inventory || 0) === 1 ? 'Applied' : 'Review only'}</td><td>${esc(row.depletion_method || 'manual')}</td><td>${esc(row.review_note || '')}</td></tr>`;
  }

  function render() {
    const node = mount();
    if (!node) return;
    if (!selectedItemId) {
      node.innerHTML = `<h2 style="margin-top:0">Purchase lots &amp; batches</h2><p class="small">Use <strong>Lots</strong> beside an inventory row to separate repeated Amazon or supplier purchases by date, order, cost, remaining quantity, expiry, and storage location.</p>`;
      return;
    }
    if (!detail) {
      node.innerHTML = `<h2 style="margin-top:0">Purchase lots &amp; batches</h2><p class="small">Loading selected inventory item…</p><div id="inventoryLotsMessage" hidden></div>`;
      return;
    }
    const item = detail.item || {};
    const lots = detail.lots || [];
    const summary = detail.summary || {};
    const policy = detail.policy || {};
    const reconciliations = detail.reconciliations || [];
    const discrepancy = Number(summary.discrepancy_quantity || 0);
    const discrepancyClass = Math.abs(discrepancy) < 0.0001 ? 'is-success' : 'is-error';
    node.innerHTML = `
      <div class="section-heading-row">
        <div><h2 style="margin:0">Lots for ${esc(item.item_name)}</h2><p class="small">${lots.length} purchase lot(s) · ${summary.quantity_remaining || 0} ${esc(item.stock_unit_label || 'unit')} recorded across lots.</p></div>
        <button class="btn" id="closeInventoryLots" type="button">Close lots</button>
      </div>
      <div id="inventoryLotsMessage" hidden></div>
      <div class="inventory-lot-intro"><img src="/assets/inventory-lot-tracking-placeholder.svg" alt="Purchase lots separated by purchase date, supplier, cost and remaining quantity"/><p class="small">Create one lot for each purchase occasion so goat milk base, oils, mica and coloured bases remain traceable by supplier order and date.</p></div>
      <section class="inventory-lot-reconciliation card">
        <div class="section-heading-row"><div><h3 style="margin:0">Lot-to-main inventory reconciliation</h3><p class="small">Review the lot total against the main on-hand count. Nothing changes automatically unless you deliberately apply the lot total.</p></div><span class="status-pill ${discrepancyClass}">${Math.abs(discrepancy) < 0.0001 ? 'Matched' : `Difference ${discrepancy}`}</span></div>
        <div class="inventory-lot-balance-grid">
          <div><span class="small">Main on hand</span><strong>${Number(summary.main_on_hand_quantity || 0)} ${esc(item.stock_unit_label || 'unit')}</strong></div>
          <div><span class="small">Remaining across lots</span><strong>${Number(summary.quantity_remaining || 0)} ${esc(item.stock_unit_label || 'unit')}</strong></div>
          <div><span class="small">Difference</span><strong>${discrepancy}</strong></div>
          <div><span class="small">Review status</span><strong>${esc(policy.reconcile_status || 'needs_review')}</strong></div>
        </div>
        <div class="grid cols-3">
          <label><span class="small">Preferred depletion method</span><select class="input" id="inventoryLotDepletionMethod"><option value="manual" ${policy.depletion_method === 'manual' ? 'selected' : ''}>Manual lot selection</option><option value="fifo" ${policy.depletion_method === 'fifo' ? 'selected' : ''}>FIFO — oldest purchase first</option><option value="fefo" ${policy.depletion_method === 'fefo' ? 'selected' : ''}>FEFO — earliest expiry first</option></select></label>
          <label><span class="small">Policy status</span><select class="input" id="inventoryLotReconcileStatus"><option value="needs_review" ${policy.reconcile_status === 'needs_review' ? 'selected' : ''}>needs_review</option><option value="reconciled" ${policy.reconcile_status === 'reconciled' ? 'selected' : ''}>reconciled</option><option value="blocked" ${policy.reconcile_status === 'blocked' ? 'selected' : ''}>blocked</option></select></label>
          <button class="btn" id="saveInventoryLotPolicy" type="button">Save policy</button>
        </div>
        <label><span class="small">Reconciliation note</span><textarea class="input" id="inventoryLotReconcileNote" rows="2" placeholder="Counted sealed packages and opened partial lot; lot total agrees with physical stock."></textarea></label>
        <div class="product-offer-actions"><button class="btn" id="recordInventoryLotReview" type="button">Record review only</button><button class="btn danger" id="applyInventoryLotTotal" type="button">Apply lot total to main on-hand</button></div>
      </section>
      <form id="inventoryLotForm" class="inventory-lot-form">
        <input type="hidden" id="inventoryPurchaseLotId"/>
        <div class="grid cols-4"><label><span class="small">Lot / batch code</span><input class="input" id="inventoryLotCode" required placeholder="AMZ-2026-07-01-A"/></label><label><span class="small">Purchase date</span><input class="input" id="inventoryLotPurchaseDate" type="date"/></label><label><span class="small">Received date</span><input class="input" id="inventoryLotReceivedDate" type="date"/></label><label><span class="small">Status</span><select class="input" id="inventoryLotStatus"><option>available</option><option>consumed</option><option>expired</option><option>quarantined</option><option>returned</option></select></label></div>
        <div class="grid cols-4"><label><span class="small">Supplier</span><input class="input" id="inventoryLotSupplier" value="${esc(item.supplier_name || '')}"/></label><label><span class="small">Order number</span><input class="input" id="inventoryLotOrder"/></label><label><span class="small">Supplier SKU / ASIN</span><input class="input" id="inventoryLotSku" value="${esc(item.supplier_sku || '')}"/></label><label><span class="small">Source URL</span><input class="input" id="inventoryLotUrl" type="url" value="${esc(item.amazon_url || item.source_url || '')}"/></label></div>
        <div class="grid cols-4"><label><span class="small">Quantity received</span><input class="input" id="inventoryLotReceivedQty" type="number" min="0" step="0.01" value="1"/></label><label><span class="small">Quantity remaining</span><input class="input" id="inventoryLotRemainingQty" type="number" min="0" step="0.01" value="1"/></label><label><span class="small">Unit cost before tax (CAD)</span><input class="input" id="inventoryLotUnitCost" type="number" min="0" step="0.01" value="${(Number(item.unit_cost_cents || 0) / 100).toFixed(2)}"/></label><label><span class="small">Expiry / best-before</span><input class="input" id="inventoryLotExpiry" type="date"/></label></div>
        <div class="grid cols-2"><label><span class="small">Shipping allocated to this lot (CAD)</span><input class="input" id="inventoryLotShippingCost" type="number" min="0" step="0.01" value="0.00"/></label><label><span class="small">Tax allocated to this lot (CAD)</span><input class="input" id="inventoryLotTaxCost" type="number" min="0" step="0.01" value="0.00"/></label></div>
        <div class="grid cols-2"><label><span class="small">Storage location</span><input class="input" id="inventoryLotStorage" placeholder="Soap shelf A / sealed tote 2"/></label><label><span class="small">Notes</span><input class="input" id="inventoryLotNotes" placeholder="Colour, formulation, packaging condition, intended project"/></label></div>
        <div class="product-offer-actions"><button class="btn primary" type="submit">Save purchase lot</button><button class="btn" type="button" id="resetInventoryLotForm">Clear form</button></div>
      </form>
      <div class="admin-table-wrap"><table class="inventory-lot-table"><thead><tr><th>Lot</th><th>Purchased</th><th>Supplier / order</th><th>Remaining</th><th>Unit cost</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead><tbody>${lots.length ? lots.map(lotRow).join('') : '<tr><td colspan="8">No lots recorded yet.</td></tr>'}</tbody></table></div>
      <details class="inventory-lot-history"><summary>Reconciliation history (${reconciliations.length})</summary><div class="admin-table-wrap"><table><thead><tr><th>Reviewed</th><th>Main</th><th>Lots</th><th>Difference</th><th>Action</th><th>Method</th><th>Note</th></tr></thead><tbody>${reconciliations.length ? reconciliations.map(reconciliationRow).join('') : '<tr><td colspan="7">No reconciliation reviews recorded yet.</td></tr>'}</tbody></table></div></details>`;
    bind();
  }

  function values() {
    return {
      action: 'save_lot',
      inventory_purchase_lot_id: Number(document.getElementById('inventoryPurchaseLotId')?.value || 0) || undefined,
      site_item_inventory_id: selectedItemId,
      lot_code: document.getElementById('inventoryLotCode')?.value || '',
      purchase_date: document.getElementById('inventoryLotPurchaseDate')?.value || '',
      received_date: document.getElementById('inventoryLotReceivedDate')?.value || '',
      supplier_name: document.getElementById('inventoryLotSupplier')?.value || '',
      supplier_order_number: document.getElementById('inventoryLotOrder')?.value || '',
      supplier_sku: document.getElementById('inventoryLotSku')?.value || '',
      asin: document.getElementById('inventoryLotSku')?.value || '',
      source_url: document.getElementById('inventoryLotUrl')?.value || '',
      quantity_received: Number(document.getElementById('inventoryLotReceivedQty')?.value || 0),
      quantity_remaining: Number(document.getElementById('inventoryLotRemainingQty')?.value || 0),
      unit_cost_cents: Math.round(Number(document.getElementById('inventoryLotUnitCost')?.value || 0) * 100),
      shipping_cost_cents: Math.round(Number(document.getElementById('inventoryLotShippingCost')?.value || 0) * 100),
      tax_cost_cents: Math.round(Number(document.getElementById('inventoryLotTaxCost')?.value || 0) * 100),
      expiry_date: document.getElementById('inventoryLotExpiry')?.value || '',
      storage_location: document.getElementById('inventoryLotStorage')?.value || '',
      lot_status: document.getElementById('inventoryLotStatus')?.value || 'available',
      notes: document.getElementById('inventoryLotNotes')?.value || ''
    };
  }

  function populate(lot) {
    const map = {
      inventoryPurchaseLotId: lot.inventory_purchase_lot_id,
      inventoryLotCode: lot.lot_code,
      inventoryLotPurchaseDate: lot.purchase_date,
      inventoryLotReceivedDate: lot.received_date,
      inventoryLotSupplier: lot.supplier_name,
      inventoryLotOrder: lot.supplier_order_number,
      inventoryLotSku: lot.supplier_sku || lot.asin,
      inventoryLotUrl: lot.source_url,
      inventoryLotReceivedQty: lot.quantity_received,
      inventoryLotRemainingQty: lot.quantity_remaining,
      inventoryLotUnitCost: (Number(lot.unit_cost_cents || 0) / 100).toFixed(2),
      inventoryLotShippingCost: (Number(lot.shipping_cost_cents || 0) / 100).toFixed(2),
      inventoryLotTaxCost: (Number(lot.tax_cost_cents || 0) / 100).toFixed(2),
      inventoryLotExpiry: lot.expiry_date,
      inventoryLotStorage: lot.storage_location,
      inventoryLotStatus: lot.lot_status,
      inventoryLotNotes: lot.notes
    };
    Object.entries(map).forEach(([fieldId, value]) => { const node = document.getElementById(fieldId); if (node) node.value = value ?? ''; });
    document.getElementById('inventoryLotForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function savePolicy() {
    const response = await DDAuth.apiFetch('/api/admin/inventory-lots', { method: 'POST', body: JSON.stringify({ action: 'save_policy', site_item_inventory_id: selectedItemId, depletion_method: document.getElementById('inventoryLotDepletionMethod')?.value || 'manual', reconcile_status: document.getElementById('inventoryLotReconcileStatus')?.value || 'needs_review' }) });
    const data = await response.json();
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Lot policy could not be saved.');
    detail = data.detail; render(); msg(data.message);
  }

  async function reconcile(apply) {
    const note = document.getElementById('inventoryLotReconcileNote')?.value || '';
    let confirmationPhrase = '';
    if (apply) {
      if (!confirm('Apply the current remaining-lot total to the main on-hand quantity? This creates an audited inventory reconciliation movement.')) return;
      confirmationPhrase = prompt('Type APPLY LOT TOTAL exactly.') || '';
    }
    const response = await DDAuth.apiFetch('/api/admin/inventory-lots', { method: 'POST', body: JSON.stringify({ action: 'reconcile_lot_totals', site_item_inventory_id: selectedItemId, depletion_method: document.getElementById('inventoryLotDepletionMethod')?.value || 'manual', review_note: note, apply_to_main_inventory: apply ? 1 : 0, confirmation_phrase: confirmationPhrase }) });
    const data = await response.json();
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Lot reconciliation could not be recorded.');
    detail = data.detail; render(); msg(data.message);
  }

  function bind() {
    document.getElementById('closeInventoryLots')?.addEventListener('click', () => load(0));
    document.getElementById('resetInventoryLotForm')?.addEventListener('click', () => { document.getElementById('inventoryLotForm')?.reset(); const hidden = document.getElementById('inventoryPurchaseLotId'); if (hidden) hidden.value = ''; });
    document.getElementById('inventoryLotForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
        msg('Saving purchase lot…');
        const response = await DDAuth.apiFetch('/api/admin/inventory-lots', { method: 'POST', body: JSON.stringify(values()) });
        const data = await response.json();
        if (!response.ok || !data?.ok) throw new Error(data?.error || 'Purchase lot could not be saved.');
        detail = data.detail; render(); msg(data.message);
      } catch (error) { msg(error.message, true); }
    });
    document.getElementById('saveInventoryLotPolicy')?.addEventListener('click', () => savePolicy().catch((error) => msg(error.message, true)));
    document.getElementById('recordInventoryLotReview')?.addEventListener('click', () => reconcile(false).catch((error) => msg(error.message, true)));
    document.getElementById('applyInventoryLotTotal')?.addEventListener('click', () => reconcile(true).catch((error) => msg(error.message, true)));
    document.querySelectorAll('[data-edit-lot]').forEach((button) => { button.onclick = () => { try { populate(JSON.parse(button.dataset.editLot || '{}')); } catch {} }; });
    document.querySelectorAll('[data-delete-lot]').forEach((button) => {
      button.onclick = async () => {
        if (!confirm('Delete this lot record? This does not change the main on-hand count and will mark reconciliation for review.')) return;
        try {
          const response = await DDAuth.apiFetch(`/api/admin/inventory-lots?inventory_purchase_lot_id=${encodeURIComponent(button.dataset.deleteLot)}`, { method: 'DELETE' });
          const data = await response.json();
          if (!response.ok || !data?.ok) throw new Error(data?.error || 'Lot could not be deleted.');
          await load(selectedItemId); msg(data.message);
        } catch (error) { msg(error.message, true); }
      };
    });
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-open-inventory-lots]');
    if (!button) return;
    load(Number(button.dataset.openInventoryLots || 0));
    setTimeout(() => mount()?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  });
  document.addEventListener('DOMContentLoaded', () => { mount(); render(); });
})();
