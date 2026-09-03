(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const state = { rows: [], summary: {} };
  const readinessStates = new Set(['finished_stock_supported','buildability_review','finished_stock_shortfall','resource_shortage','demand_unverified','capacity_unverified','product_missing']);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
  const label = (v) => String(v || '').replaceAll('_', ' ');
  const metric = (title, value, note='') => `<article class="card ofr-metric"><span>${esc(title)}</span><strong>${esc(value)}</strong>${note ? `<small>${esc(note)}</small>` : ''}</article>`;
  function summary() {
    const s = state.summary || {};
    $('ofrSummary').innerHTML = [
      metric('Products with open demand', s.products_with_open_demand || 0),
      metric('Recognized units', s.recognized_active_units || 0, `${s.paid_active_units || 0} paid`),
      metric('Stock supported', s.finished_stock_supported || 0),
      metric('Buildability review', s.buildability_review || 0),
      metric('Shortfall / shortage', num(s.finished_stock_shortfall) + num(s.resource_shortage)),
      metric('Unverified units', s.unclassified_open_units || 0),
    ].join('');
  }
  function filtered() {
    const wanted = $('ofrState').value;
    const q = $('ofrSearch').value.trim().toLowerCase();
    return state.rows.filter((row) => (wanted === 'all' || row.readiness_state === wanted) && (!q || [row.name,row.sku,row.readiness_state,row.fulfillment_state,row.sellability_state].join(' ').toLowerCase().includes(q)));
  }
  function card(row) {
    const owners = row.owner_urls || {};
    const buildable = row.buildable_units_from_resources == null ? 'unknown' : row.buildable_units_from_resources;
    const stock = row.direct_stock_units == null ? 'unknown' : row.direct_stock_units;
    const stateLabel = readinessStates.has(row.readiness_state) ? row.readiness_state : 'capacity_unverified';
    return `<article class="card ofr-card" data-state="${esc(stateLabel)}"><div class="ofr-card-head"><div><p class="eyebrow">${esc(label(stateLabel))}</p><h2>${esc(row.name || `Product ${row.product_id}`)}</h2><p class="small">${esc(row.sku || `Product ID ${row.product_id}`)}</p></div><span class="ofr-badge">${esc(row.active_order_units)} active unit(s)</span></div><div class="ofr-grid"><div><span>Open orders</span><strong>${esc(row.active_order_count)}</strong></div><div><span>Paid units</span><strong>${esc(row.paid_active_units)}</strong></div><div><span>Finished stock</span><strong>${esc(stock)}</strong></div><div><span>Stock gap</span><strong>${esc(row.finished_stock_gap_units == null ? 'unknown' : row.finished_stock_gap_units)}</strong></div><div><span>Buildable evidence</span><strong>${esc(buildable)}</strong></div><div><span>Resource shortages</span><strong>${esc(row.resource_shortage_links == null ? 'unknown' : row.resource_shortage_links)}</strong></div></div>${row.unclassified_open_units ? `<p class="ofr-warning"><strong>Unclassified demand:</strong> ${esc(row.unclassified_open_units)} unit(s) — ${esc((row.unclassified_statuses || []).join(', ') || 'unknown')}</p>` : ''}<p>${esc(row.detail)}</p><div class="ofr-links">${owners.orders ? `<a class="btn secondary" href="${esc(owners.orders)}">Order owner</a>` : ''}${owners.inventory ? `<a class="btn secondary" href="${esc(owners.inventory)}">Inventory</a>` : ''}${owners.sellability ? `<a class="btn secondary" href="${esc(owners.sellability)}">Sellability</a>` : ''}${owners.product ? `<a class="btn secondary" href="${esc(owners.product)}">Product</a>` : ''}</div></article>`;
  }
  function render() {
    summary();
    const rows = filtered();
    $('ofrCount').textContent = `${rows.length} of ${state.rows.length} Product demand row(s)`;
    $('ofrList').innerHTML = rows.length ? rows.map(card).join('') : '<div class="card">No rows match this view.</div>';
  }
  async function load() {
    $('ofrMessage').textContent = 'Loading Build 26 reconciliation…';
    try {
      const response = await (window.DDAuth?.apiFetch || fetch)('/api/admin/order-inventory-fulfillment-readiness', { credentials: 'same-origin' });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || `HTTP ${response.status}`);
      state.rows = Array.isArray(payload.rows) ? payload.rows : [];
      state.summary = payload.summary || {};
      $('ofrMessage').textContent = 'Read-only; no stock reservation/deduction, build, order/shipment change, customer contact, schema mutation, or provider execution occurred.';
      render();
    } catch (error) {
      $('ofrMessage').textContent = `Could not load Build 26 readiness: ${error.message || error}`;
      $('ofrList').innerHTML = '<div class="card">Readiness evidence is unavailable. No fulfillment action was taken.</div>';
    }
  }
  $('ofrState')?.addEventListener('change', render);
  $('ofrSearch')?.addEventListener('input', render);
  $('ofrRefresh')?.addEventListener('click', load);
  $('ofrReset')?.addEventListener('click', () => { $('ofrState').value='all'; $('ofrSearch').value=''; render(); });
  load();
})();
