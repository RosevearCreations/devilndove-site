// Release 467 Build 112 — Inventory & Material-Usage reconciliation UI.
// GET-only evidence surface. Existing Inventory/Product/Creative/Kit controls remain the only mutation owners.
(() => {
  const mount=document.getElementById('inventoryMaterialUsageReconciliationMount');
  if(!mount || !window.DDAuth) return;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=(cents)=>new Intl.NumberFormat(undefined,{style:'currency',currency:'CAD'}).format(Number(cents||0)/100);
  const state={data:null,filter:'all'};
  const cls=(value)=>['ready','review','blocked'].includes(String(value||''))?String(value):'review';

  function render() {
    const r=state.data?.reconciliation;
    if(!r) return;
    const summary=r.summary||{};
    const all=Array.isArray(r.records)?r.records:[];
    const records=state.filter==='all'?all:all.filter(row=>row.state===state.filter);
    mount.innerHTML=`
      <section class="card imr-card" data-build112-inventory-material-reconciliation="1">
        <div class="imr-head">
          <div><p class="inventory-operations-eyebrow">Release 467 Build 112 • read-only</p><h3>Inventory &amp; Material-Usage Reconciliation</h3>
          <p class="small">Reconcile Product plans, Product production evidence, reviewed Creative consumption, aggregate reservations, kit component remnants and current-cost authority. This surface never changes stock.</p></div>
          <span class="imr-state ${cls(r.state)}">${esc(String(r.state||'review').toUpperCase())}</span>
        </div>
        <div class="imr-summary">
          <div><strong>${Number(summary.inventory_item_count||0)}</strong><span>Inventory items</span></div>
          <div><strong>${Number(summary.blocked_item_count||0)}</strong><span>Blocked</span></div>
          <div><strong>${Number(summary.review_item_count||0)}</strong><span>Review</span></div>
          <div><strong>${Number(summary.exception_count||0)}</strong><span>Exceptions</span></div>
        </div>
        <div class="imr-controls">
          <label class="small">Show
            <select class="input" id="imrFilter">
              <option value="all" ${state.filter==='all'?'selected':''}>All</option>
              <option value="blocked" ${state.filter==='blocked'?'selected':''}>Blocked</option>
              <option value="review" ${state.filter==='review'?'selected':''}>Review</option>
              <option value="ready" ${state.filter==='ready'?'selected':''}>Ready</option>
            </select>
          </label>
          <button class="btn" id="imrRefresh" type="button">Refresh evidence</button>
        </div>
        <div class="imr-records">
          ${records.length?records.map(row=>`
            <details class="imr-row ${cls(row.state)}" ${row.state!=='ready'?'open':''}>
              <summary><span><strong>${esc(row.item_name||row.external_key||'Inventory item')}</strong><small>${esc(row.source_type)} • available ${esc(row.available_quantity)} ${esc(row.stock_unit_label||'unit')} • ${money(row.current_unit_cost_cents)} current cost</small></span><b>${esc(String(row.state||'review').toUpperCase())}</b></summary>
              <div class="imr-detail-grid">
                <div><strong>Stock truth</strong><span>On hand ${esc(row.on_hand_quantity)} • Reserved ${esc(row.reserved_quantity)} • Incoming ${esc(row.incoming_quantity)}</span></div>
                <div><strong>Reservation evidence</strong><span>Ledger net ${esc(row.reservation_evidence?.movement_reserved_delta||0)} • Product-tagged net ${esc(row.reservation_evidence?.product_reserved_delta||0)}</span></div>
                <div><strong>Product plans</strong><span>${Number(row.product_plans?.length||0)} linked plan(s)</span></div>
                <div><strong>Usage evidence</strong><span>${Number(row.product_usage_evidence?.length||0)} Product • ${Number(row.creative_usage_evidence?.length||0)} Creative</span></div>
                <div><strong>Kit remnant evidence</strong><span>${Number(row.kit_component_evidence?.length||0)} linked kit component role(s); balances are aggregate, not origin-attributed.</span></div>
                <div><strong>Current value</strong><span>${money(row.current_inventory_value_cents)}</span></div>
              </div>
              ${(row.issues||[]).length?`<ul class="imr-issues">${row.issues.map(x=>`<li class="${cls(x.state)}"><strong>${esc(x.code)}</strong> — ${esc(x.detail)}${x.href?` <a href="${esc(x.href)}">Open owner →</a>`:''}</li>`).join('')}</ul>`:'<p class="small">No reconciliation exception is currently derived for this item.</p>'}
            </details>`).join(''):'<p class="small">No records match this filter.</p>'}
        </div>
        ${(r.orphan_product_links||[]).length?`<div class="imr-exceptions"><h4>Unlinked Product material plans</h4>${r.orphan_product_links.map(x=>`<p class="small"><strong>${esc(x.product_name||`Product ${x.product_id}`)}</strong> — ${esc(x.source_key)}: ${esc(x.detail)}</p>`).join('')}</div>`:''}
        ${(r.kit_open_issues||[]).length?`<div class="imr-exceptions"><h4>Kit provenance exceptions</h4>${r.kit_open_issues.map(x=>`<p class="small"><strong>${esc(x.template_name)}</strong> — ${esc(x.detail)}</p>`).join('')}</div>`:''}
        <p class="small imr-boundary"><strong>Safety boundary:</strong> no POST route, no synthetic movement, no automatic reservation/release, no production post, no Creative posting/reversal, no kit opening/use, no cost edit and no schema repair exist here.</p>
      </section>`;
    document.getElementById('imrFilter')?.addEventListener('change',e=>{state.filter=String(e.target.value||'all');render();});
    document.getElementById('imrRefresh')?.addEventListener('click',load);
  }

  async function load() {
    mount.innerHTML='<section class="card imr-card"><p class="small">Loading Build 112 reconciliation evidence…</p></section>';
    try {
      const response=await window.DDAuth.apiFetch('/api/admin/inventory-material-usage-reconciliation?limit=500',{method:'GET',cache:'no-store'});
      const data=await window.DDAuth.readApiJson(response,{fallbackMessage:'Inventory reconciliation could not be loaded.'});
      if(!response.ok || data?.ok!==true) throw new Error(data?.error||`HTTP ${response.status}`);
      state.data=data;
      render();
    } catch(error) {
      mount.innerHTML=`<section class="card imr-card"><h3>Inventory reconciliation unavailable</h3><p class="small">${esc(error?.message||error)}</p><button class="btn" type="button" id="imrRetry">Retry</button></section>`;
      document.getElementById('imrRetry')?.addEventListener('click',load);
    }
  }

  document.addEventListener('dd:admin-ready',event=>{if(event?.detail?.ok) load();});
  if(window.DDAuth.isLoggedIn()) load();
})();
