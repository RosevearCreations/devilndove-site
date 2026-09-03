(() => {
  const mount = document.getElementById('orderProductionReadinessMount');
  if (!mount) return;
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const label = (v) => String(v || 'unknown').replaceAll('_',' ');
  const qty = (v) => Number(v || 0).toLocaleString('en-CA',{maximumFractionDigits:2});
  const money = (cents) => (Number(cents || 0) / 100).toLocaleString('en-CA',{style:'currency',currency:'CAD'});
  let state = { rows: [], selected: null, production_preview: null, summary: {} };

  function selectedPanel() {
    const row = state.selected;
    if (!row) return '<div class="card opr-detail"><strong>Select a stock-gap row</strong><p>Run the exact existing Production Release preview only when you want to inspect the current material, purchase-lot and ingredient blockers for that order-demand gap.</p></div>';
    const preview = state.production_preview;
    const blockers = Array.isArray(preview?.blockers) ? preview.blockers : [];
    const materials = Array.isArray(preview?.materials) ? preview.materials : [];
    return `<section class="card opr-detail">
      <div class="opr-head"><div><p class="small">Exact production preview</p><h2>${esc(row.name || `Product ${row.product_id}`)}</h2></div><strong>${esc(label(row.production_release_state))}</strong></div>
      <p>${esc(row.detail || '')}</p>
      <div class="opr-stats">
        <div><span>Recognized demand</span><strong>${esc(qty(row.active_order_units))}</strong></div>
        <div><span>Finished stock</span><strong>${row.direct_stock_units == null ? 'Unverified' : esc(qty(row.direct_stock_units))}</strong></div>
        <div><span>Exact preview quantity</span><strong>${esc(qty(row.production_preview_quantity))}</strong></div>
        <div><span>Estimated material cost</span><strong>${preview ? esc(money(preview.estimated_material_cost_cents)) : '—'}</strong></div>
      </div>
      ${blockers.length ? `<div class="opr-blockers"><strong>Current blockers</strong><ul>${blockers.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>` : (preview ? '<p><strong>No current Production Release blockers were reported for this exact preview.</strong> Posting still requires the existing Product/Production owner.</p>' : '')}
      ${materials.length ? `<details><summary>Material / lot evidence (${materials.length})</summary><div class="opr-materials">${materials.map((m) => `<div><strong>${esc(m.item_name || m.source_key || 'Material')}</strong><span>${esc(qty(m.stock_quantity_consumed))} ${esc(m.stock_unit_label || 'unit')} required • ${esc(qty(m.available_stock_quantity))} available • lot ${m.lot_ready ? 'ready' : 'review'}</span></div>`).join('')}</div></details>` : ''}
      <div class="opr-links"><a class="btn" href="${esc(row.owner_urls?.production || '/admin/products/')}">Open Product / Production owner</a><a class="btn secondary" href="${esc(row.owner_urls?.orders || '/admin/order-fulfillment-care/')}">Open Orders owner</a></div>
      <p class="small">Read-only; no production post, inventory reservation/deduction, order/shipment mutation, customer contact, provider action or schema change occurred.</p>
    </section>`;
  }

  function rowCard(row) {
    const canPreview = row.production_release_state === 'production_preview_required';
    return `<article class="card opr-row">
      <div class="opr-head"><div><p class="small">${esc(row.sku || `Product ${row.product_id}`)}</p><h2>${esc(row.name || row.demand_product_name || `Product ${row.product_id}`)}</h2></div><strong>${esc(label(row.production_release_state))}</strong></div>
      <div class="opr-stats">
        <div><span>Open demand</span><strong>${esc(qty(row.active_order_units))}</strong></div>
        <div><span>Paid demand</span><strong>${esc(qty(row.paid_active_units))}</strong></div>
        <div><span>Finished stock</span><strong>${row.direct_stock_units == null ? 'Unverified' : esc(qty(row.direct_stock_units))}</strong></div>
        <div><span>Stock gap</span><strong>${row.finished_stock_gap_units == null ? 'Unverified' : esc(qty(row.finished_stock_gap_units))}</strong></div>
      </div>
      <p>${esc(row.detail || '')}</p>
      <div class="opr-links">${canPreview ? `<button class="btn" type="button" data-preview-product="${Number(row.product_id)}">Check exact production preview</button>` : ''}<a class="btn secondary" href="${esc(row.owner_urls?.orders || '/admin/order-fulfillment-care/')}">Orders owner</a></div>
    </article>`;
  }

  function render() {
    const s = state.summary || {};
    mount.innerHTML = `<section class="opr-summary">
      <div class="card"><span>Products with open demand</span><strong>${Number(s.products_with_open_demand || 0)}</strong></div>
      <div class="card"><span>Recognized units</span><strong>${Number(s.recognized_active_units || 0)}</strong></div>
      <div class="card"><span>Finished-stock gap</span><strong>${Number(s.finished_stock_gap_units || 0)}</strong></div>
      <div class="card"><span>Exact previews needed</span><strong>${Number(s.production_preview_required || 0)}</strong></div>
      <div class="card"><span>Covered by stock</span><strong>${Number(s.no_production_required || 0)}</strong></div>
      <div class="card"><span>Demand / gap unverified</span><strong>${Number(s.demand_unverified || 0) + Number(s.gap_unverified || 0) + Number(s.product_missing || 0)}</strong></div>
    </section>
    ${selectedPanel()}
    <section class="opr-list">${state.rows.map(rowCard).join('') || '<div class="card">No current open physical order demand was returned by Build 26.</div>'}</section>`;
    mount.querySelectorAll('[data-preview-product]').forEach((button) => button.addEventListener('click', () => load(Number(button.dataset.previewProduct || 0))));
  }

  async function load(productId = 0) {
    mount.innerHTML = productId && state.rows.length ? '<div class="card">Loading exact Production Release preview…</div>' : '<div class="card">Loading Order ↔ Production Release readiness…</div>';
    try {
      const suffix = productId > 0 ? `?product_id=${encodeURIComponent(productId)}` : '';
      const response = await fetch(`/api/admin/order-production-release-readiness${suffix}`, { credentials:'same-origin' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      state = { rows: Array.isArray(data.rows) ? data.rows : [], selected: data.selected || null, production_preview: data.production_preview || null, summary: data.summary || {} };
      render();
    } catch (error) {
      mount.innerHTML = `<div class="card"><strong>Order / Production readiness unavailable.</strong><p>${esc(error.message || error)}</p></div>`;
    }
  }
  load();
})();
