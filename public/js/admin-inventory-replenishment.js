(() => {
  const mount = document.getElementById('replenishmentMount');
  if (!mount) return;

  const apiFetch = window.DDAuth?.apiFetch || fetch;
  let state = null;
  let severity = 'all';
  let lane = 'all';

  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[ch]);
  const money = (cents) => (Number(cents || 0) / 100).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
  const qty = (value) => Number.isFinite(Number(value)) ? Number(Number(value).toFixed(3)).toLocaleString('en-CA') : '—';
  const when = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? esc(value) : date.toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' });
  };
  const badge = (value, tone = '') => `<span class="rp-badge ${esc(tone || value || '')}">${esc(value || '—')}</span>`;
  const stat = (label, value, note = '') => `<div class="rp-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong>${note ? `<small>${esc(note)}</small>` : ''}</div>`;
  const laneLabel = (value) => ({
    replenishment: 'Replenishment',
    supplier: 'Supplier',
    procurement: 'Procurement',
    receiving: 'Receiving',
    inventory_accuracy: 'Inventory accuracy',
    economics: 'Stock economics',
  })[value] || value || 'Other';
  const coverageLabel = (days, band) => {
    if (days == null) return badge('No usage history', 'low');
    const tone = band === 'critical' ? 'critical' : band === 'low' ? 'high' : band === 'watch' ? 'medium' : 'low';
    return `${badge(`${qty(days)} days`, tone)}`;
  };

  const filtered = () => (Array.isArray(state?.queue) ? state.queue : [])
    .filter((item) => (severity === 'all' || item.severity === severity) && (lane === 'all' || item.lane === lane));

  function queueHtml() {
    const list = filtered();
    if (!list.length) return '<div class="card rp-empty">No attention items match the current filters.</div>';
    return `<div class="rp-queue">${list.map((item) => `
      <article class="card rp-attention severity-${esc(item.severity)}">
        <div class="rp-row rp-between"><div>${badge(item.severity, item.severity)} ${badge(laneLabel(item.lane), item.lane)}</div><small>${when(item.updated_at)}</small></div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.detail)}</p>
        <div class="rp-row rp-between"><small>${item.supplier_name ? `Supplier: ${esc(item.supplier_name)}` : 'Supplier not recorded'}</small><a class="btn" href="${esc(item.owner_href)}">${esc(item.owner_label || 'Open owner')}</a></div>
      </article>`).join('')}</div>`;
  }

  function supplierComparisonText(economics = {}) {
    const supplier = economics.supplier_economics || {};
    const comparisons = Array.isArray(supplier.comparisons) ? supplier.comparisons : [];
    if (!comparisons.length) return 'No received-lot landed-cost history yet.';
    return comparisons.slice(0, 3).map((row) => {
      const marker = row.preferred_supplier_match ? 'preferred' : 'observed';
      return `${row.supplier_name}: ${money(row.weighted_landed_unit_cost_cents)} / unit (${marker}, ${Number(row.observed_lot_count || 0)} lot${Number(row.observed_lot_count || 0) === 1 ? '' : 's'})`;
    }).join(' • ');
  }

  function inventoryHtml() {
    const list = (state?.inventory || []).filter((item) => {
      const economics = item.reorder_economics || {};
      return Number(item.is_on_reorder_list || 0) === 1
        || Number(economics.recommended_reorder_quantity || 0) > 0
        || ['critical', 'low'].includes(economics.projected_coverage_band);
    }).slice(0, 100);
    if (!list.length) return '<p class="small">No inventory items currently meet the reorder/economics review filter.</p>';
    return `<div class="rp-table-wrap"><table class="rp-table"><thead><tr>
      <th>Item</th><th>Supplier</th><th>Available</th><th>Incoming</th><th>Coverage</th><th>Reorder level</th><th>Recommended</th><th>Cost basis</th><th>Est. landed</th><th>Buildable impact</th><th>Flags</th>
    </tr></thead><tbody>${list.map((item) => {
      const economics = item.reorder_economics || {};
      const supplier = economics.supplier_economics || {};
      const buildable = economics.buildable_economics || {};
      const unit = item.stock_unit_label || 'unit';
      const currentBuildable = buildable.current_lowest_resource_buildable_units;
      const projectedBuildable = buildable.projected_lowest_resource_buildable_units;
      const buildableText = currentBuildable == null
        ? 'No depleting linked Product resource'
        : `${qty(currentBuildable)} → ${qty(projectedBuildable)} resource-limited unit(s)`;
      return `<tr>
        <td><a href="/admin/inventory-operations/?site_item_inventory_id=${Number(item.site_item_inventory_id || 0)}">${esc(item.item_name || item.site_item_inventory_id)}</a><br/><small>${esc(item.source_type || '')}</small></td>
        <td>${esc(item.supplier_name || 'Unassigned')}<br/><small>${esc(item.supplier_sku || '')}</small></td>
        <td>${qty(economics.available_quantity)} ${esc(unit)}</td>
        <td>${qty(item.incoming_quantity)} ${esc(unit)}</td>
        <td>${coverageLabel(economics.projected_coverage_days, economics.projected_coverage_band)}<br/><small>${qty(economics.forecast_daily_usage)} ${esc(unit)}/day forecast</small></td>
        <td>${qty(item.reorder_level)} ${esc(unit)}</td>
        <td><strong>${qty(economics.recommended_reorder_quantity)} ${esc(unit)}</strong><br/><small>advisory only</small></td>
        <td>${supplier.cost_basis_unit_cents ? `${money(supplier.cost_basis_unit_cents)} / ${esc(unit)}` : 'Missing'}<br/><small>${esc(supplier.cost_basis_kind || '')}</small></td>
        <td>${economics.estimated_reorder_landed_cost_cents ? money(economics.estimated_reorder_landed_cost_cents) : '—'}</td>
        <td>${esc(buildableText)}<br/><small>${Number(buildable.linked_product_count || 0)} linked Product(s)</small></td>
        <td>${Number(item.do_not_reorder || 0) === 1 ? badge('Do not reorder', 'critical') : ''} ${Number(item.is_on_reorder_list || 0) === 1 ? badge('Reorder list', 'medium') : ''}</td>
      </tr>
      <tr><td colspan="11"><small><strong>Supplier comparison:</strong> ${esc(supplierComparisonText(economics))}</small></td></tr>`;
    }).join('')}</tbody></table></div>`;
  }

  function economicsHtml() {
    const list = (state?.inventory || [])
      .filter((item) => Number(item?.reorder_economics?.recommended_reorder_quantity || 0) > 0)
      .sort((a, b) => Number(b?.reorder_economics?.estimated_reorder_landed_cost_cents || 0) - Number(a?.reorder_economics?.estimated_reorder_landed_cost_cents || 0))
      .slice(0, 80);
    if (!list.length) return '<p class="small">No reorder quantity is currently recommended by the advisory model.</p>';
    return `<div class="rp-table-wrap"><table class="rp-table"><thead><tr><th>Item</th><th>30d use</th><th>90d use</th><th>Projected coverage</th><th>Target stock</th><th>Recommended quantity</th><th>Observed landed basis</th><th>Estimated reorder landed cost</th></tr></thead><tbody>${list.map((item) => {
      const economics = item.reorder_economics || {};
      const supplier = economics.supplier_economics || {};
      return `<tr>
        <td><a href="/admin/inventory-operations/?site_item_inventory_id=${Number(item.site_item_inventory_id || 0)}">${esc(item.item_name || item.site_item_inventory_id)}</a></td>
        <td>${qty(economics.consumed_30d)}</td>
        <td>${qty(economics.consumed_90d)}</td>
        <td>${economics.projected_coverage_days == null ? 'Unknown' : `${qty(economics.projected_coverage_days)} days`}</td>
        <td>${qty(economics.target_stock_quantity)} ${esc(economics.stock_unit_label || 'unit')}</td>
        <td><strong>${qty(economics.recommended_reorder_quantity)} ${esc(economics.stock_unit_label || 'unit')}</strong></td>
        <td>${supplier.cost_basis_unit_cents ? `${esc(supplier.cost_basis_supplier || 'Observed source')} at ${money(supplier.cost_basis_unit_cents)}` : 'No cost basis'}</td>
        <td>${economics.estimated_reorder_landed_cost_cents ? money(economics.estimated_reorder_landed_cost_cents) : '—'}</td>
      </tr>`;
    }).join('')}</tbody></table></div><p class="small"><strong>Recommendation only:</strong> this workspace cannot create or submit a purchase order. Review quantities, supplier, current pricing and physical stock before purchasing.</p>`;
  }

  function poHtml() {
    const list = (state?.purchase_orders || []).slice(0, 80);
    if (!list.length) return '<p class="small">No purchase-order records returned.</p>';
    return `<div class="rp-table-wrap"><table class="rp-table"><thead><tr><th>PO</th><th>Supplier</th><th>Status</th><th>Lines</th><th>Ordered</th><th>Received</th><th>Open</th><th>Estimate</th><th>Updated</th></tr></thead><tbody>${list.map((item) => {
      const open = Math.max(0, Number(item.total_quantity_ordered || 0) - Number(item.total_quantity_received || 0));
      return `<tr><td>#${Number(item.supplier_purchase_order_id || 0)}</td><td>${esc(item.supplier_name || 'Unassigned')}</td><td>${badge(item.status || 'draft')}</td><td>${Number(item.item_count || 0)}</td><td>${qty(item.total_quantity_ordered)}</td><td>${qty(item.total_quantity_received)}</td><td>${qty(open)}</td><td>${money(item.total_estimated_cents)}</td><td>${when(item.updated_at || item.created_at)}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }

  function supplierHtml() {
    const list = (state?.suppliers || []).slice(0, 60);
    if (!list.length) return '<p class="small">No supplier context returned.</p>';
    return `<div class="rp-supplier-grid">${list.map((item) => `<div class="card rp-supplier">
      <div class="rp-row rp-between"><strong>${esc(item.supplier_name)}</strong>${item.replenishment_items ? badge(`${item.replenishment_items} review`,'high') : badge('clear','low')}</div>
      <p>${Number(item.inventory_items || 0)} inventory item(s) • ${Number(item.open_purchase_orders || 0)} open PO(s)</p>
      <small>${qty(item.incoming_quantity)} incoming • ${qty(item.open_order_quantity)} open ordered • ${money(item.total_open_estimated_cents)} open PO estimate</small><br/>
      <small>${qty(item.recommended_reorder_units)} advisory reorder units • ${money(item.recommended_reorder_landed_cents)} observed-landed estimate</small>
    </div>`).join('')}</div>`;
  }

  function receiptsHtml() {
    const list = (state?.recent_receipts || []).slice(0, 30);
    if (!list.length) return '<p class="small">No recent receiving claims returned.</p>';
    return `<div class="rp-table-wrap"><table class="rp-table"><thead><tr><th>Receipt</th><th>Item</th><th>Quantity</th><th>PO line</th><th>Lot</th><th>Recorded</th></tr></thead><tbody>${list.map((item) => `<tr><td>#${Number(item.inventory_receiving_claim_id || 0)}</td><td>${esc(item.item_name || item.site_item_inventory_id)}</td><td>${qty(item.quantity_received)} ${esc(item.stock_unit_label || 'unit')}</td><td>${item.supplier_purchase_order_item_id ? `#${Number(item.supplier_purchase_order_item_id)}` : '—'}</td><td>${esc(item.lot_code || '—')}</td><td>${when(item.created_at)}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function render() {
    const summary = state?.summary || {};
    const lanes = ['all', 'replenishment', 'economics', 'supplier', 'procurement', 'receiving', 'inventory_accuracy'];
    mount.innerHTML = `
      <section class="rp-stats">
        ${stat('Attention', summary.attention_total || 0, 'read-only queue')}
        ${stat('Critical', summary.critical || 0)}
        ${stat('High', summary.high || 0)}
        ${stat('Reorder recommendations', summary.recommended_reorder_items || 0, 'operator review')}
        ${stat('Estimated landed', money(summary.recommended_landed_cost_cents || 0), 'advisory')}
        ${stat('Low coverage', summary.low_coverage_items || 0)}
        ${stat('Open POs', summary.open_purchase_orders || 0)}
        ${stat('Open receiving', qty(summary.open_receiving_quantity || 0), 'units')}
      </section>
      <section class="card rp-controls">
        <div><strong>Inventory / Reorder Economics</strong><p class="small">Build 72 is recommendation-only. It cannot create orders, submit purchases, change stock, contact suppliers, or post accounting.</p></div>
        <label>Severity<select id="rpSeverity"><option value="all">All</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
        <label>Lane<select id="rpLane">${lanes.map((value) => `<option value="${value}">${esc(value === 'all' ? 'All lanes' : laneLabel(value))}</option>`).join('')}</select></label>
        <button class="btn" type="button" id="rpRefresh">Refresh</button>
      </section>
      <section id="rpQueueMount">${queueHtml()}</section>
      <details class="card rp-section" open><summary><strong>Reorder economics</strong> <span class="small">${Number(summary.recommended_reorder_items || 0)} recommendation(s)</span></summary>${economicsHtml()}</details>
      <details class="card rp-section" open><summary><strong>Replenishment inventory</strong> <span class="small">coverage + supplier + buildability</span></summary>${inventoryHtml()}</details>
      <details class="card rp-section"><summary><strong>Purchase-order readiness</strong> <span class="small">${Number(summary.open_purchase_orders || 0)} open</span></summary>${poHtml()}<p><a class="btn" href="/admin/inventory-operations/">Open Inventory / Purchase Order owner</a></p></details>
      <details class="card rp-section"><summary><strong>Supplier context</strong></summary>${supplierHtml()}</details>
      <details class="card rp-section"><summary><strong>Recent audited receipts</strong></summary>${receiptsHtml()}<p><a class="btn" href="/admin/inventory-operations/#inventoryReceivingMount">Open Receiving owner</a></p></details>
      <section class="card rp-owner-grid">
        <div><strong>Inventory Operations</strong><p>Stock, reorder flags, suppliers and purchase-order actions remain here.</p><a class="btn" href="/admin/inventory-operations/">Open Inventory</a></div>
        <div><strong>Receiving</strong><p>Audited stock/lot receiving remains in the existing receiving workflow.</p><a class="btn" href="/admin/inventory-operations/#inventoryReceivingMount">Open Receiving</a></div>
        <div><strong>Creator</strong><p>Return to the Creator workspace for materials, tools and packaging.</p><a class="btn" href="/admin/creator/">Open Creator</a></div>
      </section>`;

    const severitySelect = document.getElementById('rpSeverity');
    const laneSelect = document.getElementById('rpLane');
    severitySelect.value = severity;
    laneSelect.value = lane;
    severitySelect.addEventListener('change', () => { severity = severitySelect.value; document.getElementById('rpQueueMount').innerHTML = queueHtml(); });
    laneSelect.addEventListener('change', () => { lane = laneSelect.value; document.getElementById('rpQueueMount').innerHTML = queueHtml(); });
    document.getElementById('rpRefresh').addEventListener('click', load);
  }

  async function load() {
    mount.innerHTML = '<div class="card"><strong>Loading Inventory / Reorder Economics…</strong></div>';
    try {
      const response = await apiFetch('/api/admin/inventory-replenishment', { headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `Request failed (${response.status})`);
      state = data;
      render();
    } catch (error) {
      mount.innerHTML = `<div class="card rp-error"><strong>Could not load Inventory / Reorder Economics.</strong><p>${esc(error.message || error)}</p><button class="btn" type="button" id="rpRetry">Retry</button></div>`;
      document.getElementById('rpRetry')?.addEventListener('click', load);
    }
  }

  load();
})();
