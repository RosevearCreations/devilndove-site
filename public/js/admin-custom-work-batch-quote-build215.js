// Release 467 Build 215 — Small-Batch, Corporate & Event Quoting UI.
(() => {
  const ENDPOINT='/api/admin/custom-work-batch-quote';
  const OWNER='/api/admin/custom-requests';
  const state={data:null,requestId:0,editingTierId:0};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(v||0)||0;
  const dollars=c=>Number(c||0)/100;
  const centsFromDollars=v=>Math.max(0,Math.round((Number(v)||0)*100));
  const apiFetch=(...args)=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(...args):fetch(...args);
  const mount=()=>document.getElementById('customWorkBatchQuote215Mount');
  const msg=(text,error=false)=>{const e=document.getElementById('batchQuote215Message');if(e){e.textContent=text||'';e.dataset.error=error?'1':'0';}};
  function requestOptions(){
    const rows=state.data?.request_choices||[];
    return '<option value="">Choose a Custom Request…</option>'+rows.map(r=>`<option value="${num(r.custom_request_id)}" ${num(r.custom_request_id)===state.requestId?'selected':''}>#${num(r.custom_request_id)} ${esc(r.product_interest||r.request_type||r.request_key)} • ${esc(r.project_intent||r.status||'')}</option>`).join('');
  }
  function badge(text){return `<span class="status-note">${esc(text||'')}</span>`;}
  function readiness(){
    const r=state.data?.readiness||{};
    const blockers=r.blockers||[],warnings=r.warnings||[];
    return `<section class="card"><h3 style="margin-top:0">Quote readiness</h3><p>${badge(r.state||'not configured')}</p>
      ${blockers.length?`<p class="small"><strong>Blockers:</strong> ${esc(blockers.join(' '))}</p>`:''}
      ${warnings.length?`<p class="small"><strong>Review:</strong> ${esc(warnings.join(' '))}</p>`:''}
      <p class="small">Unknown production cost remains visibly unknown. Build 215 never treats missing production-cost evidence as zero and does not execute payment, providers, or order creation.</p></section>`;
  }
  function termsForm(){
    const t=state.data?.terms||{},r=state.data?.request||{};
    return `<form class="card" id="batchQuote215TermsForm"><h3 style="margin-top:0">Batch / corporate / event assumptions</h3>
      <div class="admin-form-grid">
        <label>Requested quantity<input class="input" name="requested_quantity" type="number" min="1" value="${esc(t.requested_quantity??r.quantity??'')}"></label>
        <label>Quote quantity<input class="input" name="quote_quantity" type="number" min="1" required value="${esc(t.quote_quantity??r.quantity??1)}"></label>
        <label>Unit assumption<select class="input" name="unit_assumption_mode">
          ${['single_unit','tiered','mixed','manual'].map(x=>`<option value="${x}" ${String(t.unit_assumption_mode||'single_unit')===x?'selected':''}>${esc(x.replace(/_/g,' '))}</option>`).join('')}
        </select></label>
        <label>Setup charge (CAD)<input class="input" name="setup_charge_dollars" type="number" min="0" step="0.01" value="${dollars(t.setup_charge_cents).toFixed(2)}"></label>
        <label>Prototype / sample charge (CAD)<input class="input" name="prototype_sample_charge_dollars" type="number" min="0" step="0.01" value="${dollars(t.prototype_sample_charge_cents).toFixed(2)}"></label>
        <label>Packaging choice<input class="input" name="packaging_choice" maxlength="240" value="${esc(t.packaging_choice||'')}" placeholder="Gift box, bulk packed, customer-specified…"></label>
        <label>Packaging per unit (CAD)<input class="input" name="packaging_charge_dollars" type="number" min="0" step="0.01" value="${dollars(t.packaging_charge_cents).toFixed(2)}"></label>
        <label>Personalization scope<select class="input" name="personalization_scope">
          ${['unknown','none','fixed','variable','mixed'].map(x=>`<option value="${x}" ${String(t.personalization_scope||'unknown')===x?'selected':''}>${esc(x)}</option>`).join('')}
        </select></label>
        <label>Lead time minimum days<input class="input" name="lead_time_min_days" type="number" min="0" value="${esc(t.lead_time_min_days??'')}"></label>
        <label>Lead time maximum days<input class="input" name="lead_time_max_days" type="number" min="0" value="${esc(t.lead_time_max_days??'')}"></label>
        <label>Handoff<select class="input" name="handoff_method">
          ${['tbd','pickup','shipping','event_handoff','corporate_delivery','other'].map(x=>`<option value="${x}" ${String(t.handoff_method||'tbd')===x?'selected':''}>${esc(x.replace(/_/g,' '))}</option>`).join('')}
        </select></label>
        <label>Quote expiry<input class="input" name="expires_at" type="date" value="${esc(String(t.expires_at||'').slice(0,10))}"></label>
        <label>Production-cost evidence<select class="input" name="production_cost_state">
          ${['unknown','partial','reviewed'].map(x=>`<option value="${x}" ${String(t.production_cost_state||'unknown')===x?'selected':''}>${esc(x)}</option>`).join('')}
        </select></label>
        <label style="grid-column:1/-1">Corporate / event context<textarea class="input" name="corporate_event_context" rows="2">${esc(t.corporate_event_context||r.event_context_structured||r.organization_name||'')}</textarea></label>
        <label style="grid-column:1/-1">Unit / tier assumption notes<textarea class="input" name="unit_assumption_note" rows="2">${esc(t.unit_assumption_note||'')}</textarea></label>
        <label style="grid-column:1/-1">Personalization notes<textarea class="input" name="personalization_notes" rows="2">${esc(t.personalization_notes||'')}</textarea></label>
        <label style="grid-column:1/-1">Lead-time assumption<textarea class="input" name="lead_time_assumption" rows="2">${esc(t.lead_time_assumption||'')}</textarea></label>
        <label style="grid-column:1/-1">Handoff notes<textarea class="input" name="handoff_notes" rows="2">${esc(t.handoff_notes||'')}</textarea></label>
        <label style="grid-column:1/-1">Production-cost note<textarea class="input" name="production_cost_note" rows="2" placeholder="Keep unknown/partial evidence explicit; do not invent cost.">${esc(t.production_cost_note||'')}</textarea></label>
        <label style="grid-column:1/-1">Revision note<textarea class="input" name="revision_note" rows="2" placeholder="What changed in this quote revision?">${esc(t.revision_note||'')}</textarea></label>
      </div><button class="btn primary" type="submit">Save quote assumptions & sync existing quote lines</button></form>`;
  }
  function tiers(){
    const rows=state.data?.tiers||[];
    const editing=rows.find(x=>num(x.custom_request_quote_quantity_tier_id)===state.editingTierId)||{};
    return `<section class="card"><h3 style="margin-top:0">Quantity tiers</h3><p class="small">Tiers are assumptions attached to the existing quote draft. Only the selected tier becomes the active batch-unit line in the customer quote.</p>
      ${rows.length?`<div class="admin-table-wrap"><table><thead><tr><th>Tier</th><th>Quantity</th><th>Unit</th><th>Selected</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.tier_label)}</td><td>${num(x.min_quantity)}${x.max_quantity?'–'+num(x.max_quantity):'+'}</td><td>${x.unit_amount_cents==null?'Unknown':esc((Number(x.unit_amount_cents)/100).toLocaleString('en-CA',{style:'currency',currency:'CAD'}))}</td><td>${Number(x.is_selected||0)===1?'Yes':'No'}</td><td><button class="btn secondary" type="button" data-tier-edit="${num(x.custom_request_quote_quantity_tier_id)}">Edit</button> <button class="btn secondary" type="button" data-tier-delete="${num(x.custom_request_quote_quantity_tier_id)}">Delete</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="small">No quantity tiers yet.</p>'}
      <form id="batchQuote215TierForm" style="margin-top:14px"><div class="admin-form-grid">
        <label>Tier label<input class="input" name="tier_label" required value="${esc(editing.tier_label||'')}"></label>
        <label>Minimum quantity<input class="input" name="min_quantity" type="number" min="1" required value="${esc(editing.min_quantity||1)}"></label>
        <label>Maximum quantity<input class="input" name="max_quantity" type="number" min="1" value="${esc(editing.max_quantity||'')}"></label>
        <label>Unit price (CAD; blank = unknown)<input class="input" name="unit_amount_dollars" type="number" min="0" step="0.01" value="${editing.unit_amount_cents==null?'':dollars(editing.unit_amount_cents).toFixed(2)}"></label>
        <label>Select for this quote<select class="input" name="is_selected"><option value="0" ${Number(editing.is_selected||0)!==1?'selected':''}>No</option><option value="1" ${Number(editing.is_selected||0)===1?'selected':''}>Yes</option></select></label>
        <label>Sort order<input class="input" name="sort_order" type="number" value="${esc(editing.sort_order||100)}"></label>
        <label style="grid-column:1/-1">Assumption note<textarea class="input" name="assumption_note" rows="2">${esc(editing.assumption_note||'')}</textarea></label>
      </div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" type="submit">${state.editingTierId?'Update':'Add'} tier</button>${state.editingTierId?'<button class="btn secondary" id="batchQuote215TierCancel" type="button">Cancel edit</button>':''}</div></form></section>`;
  }
  function quoteSnapshot(){
    const q=state.data?.quote,scope=state.data?.scope_summary||'';
    if(!q)return '';
    return `<section class="card"><h3 style="margin-top:0">Existing quote authority</h3><p class="small"><strong>${esc(q.title||q.quote_key)}</strong> • ${esc(q.quote_status||'draft')} • Current total ${esc((Number(q.quote_total_cents||0)/100).toLocaleString('en-CA',{style:'currency',currency:'CAD'}))}</p>
      <details><summary>Customer-visible batch assumptions preview</summary><pre style="white-space:pre-wrap">${esc(scope||'Save assumptions to generate the structured quote summary.')}</pre></details>
      <p class="small">Normal quote revisions, private quote links, payment gates and order drafts remain owned by the existing Custom Work quote engine.</p></section>`;
  }
  function render(){
    const h=mount();if(!h)return;
    const d=state.data||{};
    h.innerHTML=`<section class="card" style="margin-top:18px"><p class="eyebrow">Release 467 • Build 215</p><h2 style="margin-top:0">Small-batch, corporate & event quoting</h2><p class="small">Structured quantity, tier, setup, sample, personalization, packaging, timing and handoff assumptions over the existing Custom Work quote draft. This does not create a second quote, execute payment, or create an order.</p>
      <label class="small">Custom Request<select class="input" id="batchQuote215Request">${requestOptions()}</select></label>
      <div id="batchQuote215Message" class="small" role="status" aria-live="polite" style="margin-top:8px"></div></section>
      ${state.requestId?(d.quote_required?`<section class="card"><h3 style="margin-top:0">Existing quote draft required</h3><p class="small">Build 215 only extends the existing quote authority. Create that quote draft first, then this workspace will attach the batch/corporate assumptions to it.</p><button class="btn primary" id="batchQuote215CreateQuote" type="button">Create existing quote draft</button></section>`:readiness()+quoteSnapshot()+termsForm()+tiers()):'<section class="card"><p class="small">Choose a Custom Request to load its existing quote.</p></section>'}`;
    bind();
  }
  async function load(requestId=state.requestId){
    state.requestId=num(requestId);
    const qs=state.requestId?`?request_id=${state.requestId}`:'';
    try{
      const r=await apiFetch(ENDPOINT+qs,{cache:'no-store'}),d=await r.json().catch(()=>null);
      if(!r.ok||!d?.ok)throw new Error(d?.error||`Build 215 load failed (${r.status}).`);
      state.data=d;render();msg(state.requestId?(d.quote_required?'Create the existing quote draft to continue.':'Batch quote workspace loaded.'):'Choose a Custom Request.');
    }catch(e){if(mount())mount().innerHTML=`<section class="card" style="margin-top:18px"><h2>Batch quote workspace unavailable</h2><p class="small">${esc(e.message||e)}</p><button class="btn" id="batchQuote215Retry" type="button">Retry</button></section>`;document.getElementById('batchQuote215Retry')?.addEventListener('click',()=>load());}
  }
  async function post(endpoint,payload){
    const r=await apiFetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const d=await r.json().catch(()=>null);if(!r.ok||!d?.ok)throw new Error(d?.error||`Save failed (${r.status}).`);return d;
  }
  async function save(payload){
    try{msg('Saving Build 215 quote evidence…');state.data=await post(ENDPOINT,{custom_request_id:state.requestId,...payload});state.editingTierId=0;render();msg(state.data.message||'Saved.');}
    catch(e){msg(e.message||'Save failed.',true);}
  }
  function bind(){
    document.getElementById('batchQuote215Request')?.addEventListener('change',e=>{state.editingTierId=0;load(e.target.value);});
    document.getElementById('batchQuote215CreateQuote')?.addEventListener('click',async()=>{try{msg('Creating existing quote draft…');await post(OWNER,{action:'create_quote_draft',custom_request_id:state.requestId});await load(state.requestId);}catch(e){msg(e.message||'Quote draft could not be created.',true);}});
    document.getElementById('batchQuote215TermsForm')?.addEventListener('submit',e=>{e.preventDefault();const p=Object.fromEntries(new FormData(e.currentTarget).entries());p.action='save_terms';p.setup_charge_cents=centsFromDollars(p.setup_charge_dollars);p.prototype_sample_charge_cents=centsFromDollars(p.prototype_sample_charge_dollars);p.packaging_charge_cents=centsFromDollars(p.packaging_charge_dollars);delete p.setup_charge_dollars;delete p.prototype_sample_charge_dollars;delete p.packaging_charge_dollars;save(p);});
    document.getElementById('batchQuote215TierForm')?.addEventListener('submit',e=>{e.preventDefault();const p=Object.fromEntries(new FormData(e.currentTarget).entries());p.action='save_tier';p.custom_request_quote_quantity_tier_id=state.editingTierId||null;p.unit_amount_cents=p.unit_amount_dollars===''?null:centsFromDollars(p.unit_amount_dollars);delete p.unit_amount_dollars;save(p);});
    document.querySelectorAll('[data-tier-edit]').forEach(b=>b.addEventListener('click',()=>{state.editingTierId=num(b.dataset.tierEdit);render();document.getElementById('batchQuote215TierForm')?.scrollIntoView({behavior:'smooth',block:'center'});}));
    document.querySelectorAll('[data-tier-delete]').forEach(b=>b.addEventListener('click',()=>save({action:'delete_tier',custom_request_quote_quantity_tier_id:num(b.dataset.tierDelete)})));
    document.getElementById('batchQuote215TierCancel')?.addEventListener('click',()=>{state.editingTierId=0;render();});
  }
  document.addEventListener('DOMContentLoaded',()=>{state.requestId=num(new URLSearchParams(location.search).get('custom_request_id')||new URLSearchParams(location.search).get('request_id'));load(state.requestId);});
})();