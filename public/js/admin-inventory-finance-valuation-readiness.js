(() => {
  const mount = document.getElementById('inventoryFinanceValuationMount');
  if (!mount) return;
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = (cents, currency='CAD') => {
    const n = Number(cents || 0) / 100;
    try { return n.toLocaleString('en-CA',{style:'currency',currency:currency || 'CAD'}); } catch { return `${n.toFixed(2)} ${currency || 'CAD'}`; }
  };
  const label = (value) => String(value || 'unknown').replaceAll('_',' ');
  const qty = (value) => Number(value || 0).toLocaleString('en-CA',{maximumFractionDigits:3});
  const stateBadge = (row) => row.finance_review_supported ? 'Review supported' : (row.valuation_state === 'no_on_hand_value' ? 'No on-hand value' : 'Review');

  const card = (row) => {
    const history = row.latest_cost_history;
    const issue = Array.isArray(row.issues) && row.issues.length ? row.issues[0] : null;
    return `
      <article class="ifv-card card">
        <div class="ifv-card-head">
          <div><p class="small">${esc(row.category || row.source_type || 'Inventory')}</p><h2>${esc(row.item_name || `Inventory item ${row.site_item_inventory_id}`)}</h2><p class="small">${esc(row.supplier_name || 'Supplier not recorded')}${row.supplier_sku ? ` • ${esc(row.supplier_sku)}` : ''}</p></div>
          <strong class="ifv-badge">${esc(stateBadge(row))}</strong>
        </div>
        <div class="ifv-grid">
          <div><span>On hand</span><strong>${esc(qty(row.on_hand_quantity))} ${esc(row.stock_unit_label)}</strong></div>
          <div><span>Current unit cost</span><strong>${esc(money(row.unit_cost_cents,row.currency))}</strong></div>
          <div><span>Operational value</span><strong>${esc(money(row.operational_inventory_value_cents,row.currency))}</strong></div>
          <div><span>Finance state</span><strong>${esc(label(row.valuation_state))}</strong></div>
          <div><span>Latest history cost</span><strong>${history ? esc(money(history.new_unit_cost_cents,row.currency)) : '—'}</strong></div>
          <div><span>Cost provenance</span><strong>${history?.provenance_present ? 'Present' : 'Unverified'}</strong></div>
        </div>
        ${issue ? `<p class="ifv-issue"><strong>${esc(label(issue.code))}:</strong> ${esc(issue.detail)}</p>` : ''}
        ${history ? `<p class="small">Latest history: ${esc(history.source_kind || 'source not classified')}${history.source_reference ? ` • ${esc(history.source_reference)}` : ''}${history.created_at ? ` • ${esc(history.created_at)}` : ''}</p>` : ''}
        <div class="ifv-links"><a class="btn" href="${esc(row.owner_urls?.inventory || '/admin/inventory-intelligence/')}">Inventory owner</a><a class="btn secondary" href="${esc(row.owner_urls?.finance || '/admin/accounting/')}">Finance review</a></div>
      </article>`;
  };

  async function load() {
    mount.innerHTML = '<div class="card">Loading Inventory ↔ Finance valuation readiness…</div>';
    try {
      const res = await fetch('/api/admin/inventory-finance-valuation-readiness', { credentials:'same-origin' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const s = data.summary || {};
      const rows = Array.isArray(data.items) ? data.items : [];
      const prioritized = [...rows].sort((a,b) => {
        const rank = {unvalued_on_hand:0,current_cost_unreconciled:1,provenance_missing:2,provenance_unavailable:3,source_evidence_missing:4,tool_asset_review:5,review_supported:6,no_on_hand_value:7};
        return (rank[a.valuation_state] ?? 9) - (rank[b.valuation_state] ?? 9) || Number(b.operational_inventory_value_cents || 0) - Number(a.operational_inventory_value_cents || 0);
      });
      mount.innerHTML = `
        <section class="ifv-summary">
          <div class="card"><span>On-hand stock items</span><strong>${Number(s.non_tool_on_hand_items || 0)}</strong></div>
          <div class="card"><span>Finance review supported</span><strong>${Number(s.finance_review_supported_items || 0)}</strong></div>
          <div class="card"><span>Needs review</span><strong>${Number(s.finance_review_attention_items || 0)}</strong></div>
          <div class="card"><span>Unvalued on hand</span><strong>${Number(s.unvalued_on_hand_items || 0)}</strong></div>
          <div class="card"><span>Supported operational value</span><strong>${esc(money(s.supported_operational_value_cents,'CAD'))}</strong></div>
          <div class="card"><span>Review-supported value</span><strong>${esc(money(s.finance_review_supported_value_cents,'CAD'))}</strong></div>
        </section>
        <p class="small">Read-only; no Inventory cost/quantity mutation, fixed-asset classification, accounting posting, provider action, or schema change occurred. Operational Inventory value is not book or tax value.</p>
        ${data.inventory_cost_history_available ? '' : '<div class="card ifv-warning"><strong>Cost-history provenance unavailable.</strong><p>Current Inventory cost remains the operational authority, but Finance provenance review fails closed until historical/source evidence is available.</p></div>'}
        <section class="ifv-list">${prioritized.map(card).join('') || '<div class="card">No active Inventory items were returned.</div>'}</section>`;
    } catch (error) {
      mount.innerHTML = `<div class="card"><strong>Valuation readiness unavailable.</strong><p>${esc(error.message || error)}</p></div>`;
    }
  }
  load();
})();
