// Release 467 Build 218 — Quote ↔ Production Cost ↔ Margin Guardrails UI.
(()=>{
  const ENDPOINT='/api/admin/custom-work-margin-guardrails';
  const state={snapshot:null,requestId:0};
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(v||0)||0;
  const money=v=>v===null||v===undefined?'Unknown':new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(v||0)/100);
  const pct=v=>v===null||v===undefined?'Unknown':Number(v).toFixed(1)+'%';
  const apiFetch=(...a)=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(...a):fetch(...a);
  const mount=()=>$('customWorkMarginGuardrails218Mount');
  const toCents=v=>{if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(v);return Number.isFinite(n)&&n>=0?Math.round(n*100):null;};
  const chip=(label,stateName='review')=>`<span class="status-note" style="margin-right:6px">${esc(label)}: ${esc(stateName)}</span>`;

  function requestOptions(){
    const rows=state.snapshot?.request_choices||[];
    return '<option value="">Choose a Custom Request…</option>'+rows.map(r=>`<option value="${num(r.custom_request_id)}" ${num(r.custom_request_id)===state.requestId?'selected':''}>#${num(r.custom_request_id)} ${esc(r.product_interest||r.request_type||r.request_key)} • quote ${esc(r.quote_status||'none')} • project ${esc(r.project_title||'unlinked')}</option>`).join('');
  }
  function metric(label,value,note=''){
    return `<div class="card" style="margin:0"><div class="small">${esc(label)}</div><strong style="font-size:1.2rem">${esc(value)}</strong>${note?'<div class="small">'+esc(note)+'</div>':''}</div>`;
  }
  function headline(){
    const g=state.snapshot?.margin_guardrails||{},p=state.snapshot?.production_cost_evidence||{},m=state.snapshot?.inventory_material_evidence||{};
    return `<section class="card" style="margin-top:12px">
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><h3 style="margin:0">Guardrail status</h3><p class="small" style="margin:.35rem 0 0">Unknown cost remains unknown. No price is changed automatically.</p></div><div>${chip('review',g.state||'unknown')}${chip('production evidence',p.cost_evidence_state||'unknown')}${chip('material evidence',m.cost_state||'unknown')}</div></div>
      ${(g.blockers||[]).length?'<p class="small"><strong>Blockers:</strong> '+esc(g.blockers.join(' '))+'</p>':''}
      ${(g.warnings||[]).length?'<p class="small"><strong>Review:</strong> '+esc(g.warnings.join(' '))+'</p>':''}
    </section>`;
  }
  function quoteLane(){
    const q=state.snapshot?.quote_economics||{},t=state.snapshot?.terms||{};
    return `<section class="card"><h3 style="margin-top:0">Quote revenue lane</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px">
      ${metric('Quote quantity',q.quote_quantity??'Unknown')}${metric('Quoted revenue before tax/shipping',money(q.quoted_revenue_before_tax_shipping_cents))}${metric('Quoted unit revenue',money(q.quoted_unit_revenue_cents))}
    </div><p class="small">Customer-visible quote price evidence only. Existing quote status: <strong>${esc(q.quote_status||'unknown')}</strong>. Build 215 production-cost flag: <strong>${esc(t.production_cost_state||'unknown')}</strong>.</p></section>`;
  }
  function productionLane(){
    const p=state.snapshot?.production_cost_evidence||{},m=state.snapshot?.inventory_material_evidence||{},g=state.snapshot?.margin_guardrails||{};
    return `<section class="card"><h3 style="margin-top:0">Production cost evidence lane</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px">
      ${metric('Reviewed direct components',money(p.known_direct_cost_cents),p.cost_evidence_state||'unknown')}
      ${metric('Actual direct cost / accepted unit',money(g.actual_reviewed_direct_unit_cost_cents))}
      ${metric('Accepted quantity',p.quantity_accepted==null?'Unknown':p.quantity_accepted)}
      ${metric('Inventory material cost evidenced',money(m.known_material_cost_cents),m.cost_state||'unknown')}
    </div><p class="small">Build 217 source evidence stays separate from Inventory material evidence. Missing material or direct-cost evidence is never substituted with zero.</p></section>`;
  }
  function comparisonLane(){
    const g=state.snapshot?.margin_guardrails||{};
    return `<section class="card"><h3 style="margin-top:0">Expected ↔ actual review</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px">
      ${metric('Expected production cost',money(g.expected_production_cost_cents))}
      ${metric('Expected unit cost',money(g.expected_unit_cost_cents))}
      ${metric('Actual reviewed direct cost',money(g.actual_reviewed_direct_cost_cents))}
      ${metric('Expected vs actual variance',money(g.expected_vs_actual_direct_cost_variance_cents))}
      ${metric('Expected unit headroom',money(g.expected_unit_headroom_cents),'quoted unit revenue minus expected unit cost')}
      ${metric('Actual direct unit headroom',money(g.actual_direct_unit_headroom_cents),'quoted unit revenue minus reviewed direct unit cost')}
    </div><p class="small">${esc(g.scope_note||'Expected and actual scope must be reviewed by the operator.')}</p></section>`;
  }
  function resourceMargins(){
    const rows=state.snapshot?.linked_resource_margins||[];
    if(!rows.length)return '<section class="card"><h3 style="margin-top:0">Linked-resource margin</h3><p class="small">No linked Product is available for this Creative Project. Product linked-resource margin remains unavailable rather than being inferred.</p></section>';
    return `<section class="card"><h3 style="margin-top:0">Linked-resource margin — Product evidence only</h3><p class="small">This lane is Build 191/203-style Product resource evidence. It excludes labour, overhead, marketplace/payment fees, shipping, tax and accounting adjustments.</p><div style="display:grid;gap:8px">${rows.map(r=>`<div class="card" style="margin:0"><strong>${esc(r.product_name||('Product '+r.product_id))}</strong><div class="small">${esc(r.scope||'linked resources only')}</div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px"><span>Price: <strong>${esc(money(r.price_cents))}</strong></span><span>Resource cost: <strong>${esc(money(r.evidenced_resource_cost_cents))}</strong></span><span>Resource margin: <strong>${esc(money(r.resource_margin_cents))}</strong></span><span>Margin %: <strong>${esc(pct(r.resource_margin_percent))}</strong></span><span>Unknown cost links: <strong>${num(r.unknown_cost_links)}</strong></span></div></div>`).join('')}</div></section>`;
  }
  function financeLane(){
    const f=state.snapshot?.finance_profitability;
    if(!f)return '<section class="card"><h3 style="margin-top:0">Full Finance profitability</h3><p class="small">No Finance profitability record is available for the linked Creative Project. This is not treated as zero profit.</p><p class="small"><a href="/admin/project-profitability-reconciliation/">Open Creator ↔ Finance reconciliation</a></p></section>';
    return `<section class="card"><h3 style="margin-top:0">Full Finance profitability — separate authority</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px">
      ${metric('Finance revenue',money(f.revenue_cents))}${metric('Finance total cost',money(f.total_cost_cents))}${metric('Finance project profit',money(f.project_profit_cents))}${metric('Finance margin',pct(f.margin_percent))}
    </div><p class="small">This is the existing Finance profitability calculation. Build 218 does not post Accounting or replace it with quote/resource math.</p><p class="small"><a href="/admin/project-profitability-reconciliation/">Open Creator ↔ Finance reconciliation</a></p></section>`;
  }
  function latestReview(){
    const r=state.snapshot?.latest_margin_review;
    if(!r)return '<section class="card"><h3 style="margin-top:0">Latest margin review</h3><p class="small">No Build 218 review has been recorded for this quote.</p></section>';
    return `<section class="card"><h3 style="margin-top:0">Latest margin review</h3><p><strong>${esc(r.review_disposition||'review')}</strong> • ${esc(r.created_at||'')}</p><p class="small">${esc(r.review_note||r.revision_notes||'')}</p><p class="small">Expected total: ${esc(money(r.expected_production_cost_cents))} • expected unit: ${esc(money(r.expected_unit_cost_cents))}</p></section>`;
  }
  function reviewForm(){
    const g=state.snapshot?.margin_guardrails||{},p=state.snapshot?.project||{};
    return `<form id="marginGuardrail218ReviewForm" class="card"><h3 style="margin-top:0">Record quote margin review</h3>
      <p class="small">Linked Creative Project: <strong>${esc(p.project_title||'Not linked')}</strong>. This appends a snapshot to the existing quote revision history; it does not rewrite price lines.</p>
      <div class="admin-form-grid">
        <label>Expected production cost (CAD; blank = unknown)<input class="input" name="expected_total" type="number" min="0" step="0.01" value="${g.expected_production_cost_cents==null?'':esc((Number(g.expected_production_cost_cents)/100).toFixed(2))}"></label>
        <label>Expected unit cost (CAD; blank = unknown)<input class="input" name="expected_unit" type="number" min="0" step="0.01" value="${g.expected_unit_cost_cents==null?'':esc((Number(g.expected_unit_cost_cents)/100).toFixed(2))}"></label>
        <label>Review disposition<select class="input" name="review_disposition"><option value="needs_cost_evidence">Needs cost evidence</option><option value="reviewed_no_price_change">Reviewed — no price change</option><option value="price_review_recommended">Price review recommended</option></select></label>
        <label style="grid-column:1/-1">Review note<textarea class="input" name="review_note" rows="3" required placeholder="Define the expected-cost scope, what evidence was compared, and why the price is unchanged or needs human review."></textarea></label>
      </div><button class="btn primary" type="submit">Append margin review</button><span id="marginGuardrail218Message" class="small" role="status" aria-live="polite"></span>
    </form>`;
  }
  function render(){
    const h=mount();if(!h)return;const d=state.snapshot||{};
    h.innerHTML=`<section class="card" style="margin-top:18px"><p class="eyebrow">Release 467 • Build 218</p><h2 style="margin-top:0">Quote ↔ Production Cost ↔ Margin Guardrails</h2>
      <p class="small">Review quote cost coverage, expected versus actual production economics, Product linked-resource margin and full Finance profitability without collapsing them into one number.</p>
      <label class="small">Custom Request<select class="input" id="marginGuardrail218Request">${requestOptions()}</select></label></section>
      ${state.requestId?(headline()+quoteLane()+productionLane()+comparisonLane()+resourceMargins()+financeLane()+latestReview()+reviewForm()):'<section class="card"><p class="small">Choose a Custom Request to review its existing quote and linked production evidence.</p></section>'}`;
    bind();
  }
  async function load(requestId=state.requestId){
    state.requestId=num(requestId);const qs=state.requestId?'?request_id='+state.requestId:'';
    try{const r=await apiFetch(ENDPOINT+qs,{cache:'no-store'}),d=await r.json().catch(()=>null);if(!r.ok||!d?.ok)throw new Error(d?.error||'Build 218 load failed.');state.snapshot=d;render();}
    catch(e){if(mount())mount().innerHTML='<section class="card" style="margin-top:18px"><h2>Margin guardrails unavailable</h2><p class="small">'+esc(e.message||e)+'</p><button class="btn" id="marginGuardrail218Retry" type="button">Retry</button></section>';$('marginGuardrail218Retry')?.addEventListener('click',()=>load());}
  }
  async function recordReview(payload){
    const m=$('marginGuardrail218Message');if(m)m.textContent='Recording review…';
    try{const r=await apiFetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'record_review',request_id:state.requestId,...payload})}),d=await r.json().catch(()=>null);if(!r.ok||!d?.ok)throw new Error(d?.error||'Review save failed.');state.snapshot=d;render();const n=$('marginGuardrail218Message');if(n)n.textContent=d.message||'Review recorded.';}
    catch(e){if(m)m.textContent=e.message||'Review save failed.';}
  }
  function bind(){
    $('marginGuardrail218Request')?.addEventListener('change',e=>load(e.target.value));
    $('marginGuardrail218ReviewForm')?.addEventListener('submit',e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget).entries());recordReview({
      expected_production_cost_cents:toCents(f.expected_total),expected_unit_cost_cents:toCents(f.expected_unit),
      review_disposition:f.review_disposition,review_note:f.review_note
    });});
  }
  document.addEventListener('DOMContentLoaded',()=>load(num(new URLSearchParams(location.search).get('request_id')||0)));
})();
