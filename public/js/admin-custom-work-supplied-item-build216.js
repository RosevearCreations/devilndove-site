// Release 467 Build 216 — Customer-Supplied Item Intake & Suitability Review UI.
(() => {
  const ENDPOINT='/api/admin/custom-work-supplied-item';
  const state={data:null,requestId:0,itemId:0,lastShareUrl:''};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(v||0)||0;
  const apiFetch=(...args)=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(...args):fetch(...args);
  const mount=()=>document.getElementById('customWorkSuppliedItem216Mount');
  const msg=(text,error=false)=>{const e=document.getElementById('suppliedItem216Message');if(e){e.textContent=text||'';e.style.color=error?'#b00020':'';}};
  const request=()=> (state.data?.requests||[]).find(x=>num(x.custom_request_id)===state.requestId)||null;
  const items=()=> (state.data?.items||[]).filter(x=>num(x.custom_request_id)===state.requestId);
  const item=()=> (state.data?.items||[]).find(x=>num(x.custom_request_supplied_item_id)===state.itemId)||null;
  const triage=()=> (state.data?.triage||[]).find(x=>num(x.custom_request_id)===state.requestId)||null;
  const reviews=()=> (state.data?.reviews||[]).filter(x=>num(x.custom_request_supplied_item_id)===state.itemId);
  const evidence=()=> (state.data?.evidence||[]).filter(x=>num(x.custom_request_supplied_item_id)===state.itemId);
  const acks=()=> (state.data?.acknowledgements||[]).filter(x=>num(x.custom_request_supplied_item_id)===state.itemId);
  const readiness=()=> (state.data?.readiness||[]).find(x=>num(x.custom_request_supplied_item_id)===state.itemId)||null;
  const requestOptions=()=>'<option value="">Choose a customer-supplied request…</option>'+(state.data?.requests||[]).map(r=>`<option value="${num(r.custom_request_id)}" ${num(r.custom_request_id)===state.requestId?'selected':''}>#${num(r.custom_request_id)} ${esc(r.product_interest||r.request_type||r.request_key)} • ${esc(r.name||'')}</option>`).join('');
  const badge=x=>`<span class="status-note">${esc(x||'')}</span>`;
  function itemTabs(){
    const list=items();
    return `<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">${list.map(x=>`<button class="btn ${num(x.custom_request_supplied_item_id)===state.itemId?'primary':'secondary'}" type="button" data-supplied-item-select="${num(x.custom_request_supplied_item_id)}">${esc(x.item_label||x.item_key)}</button>`).join('')}<button class="btn secondary" type="button" id="suppliedItem216Add">+ Add item</button></div>`;
  }
  function itemForm(){
    const x=item()||{},r=request()||{};
    return `<form class="card" id="suppliedItem216ItemForm"><h3 style="margin-top:0">${state.itemId?'Item intake & condition':'Add supplied item'}</h3>
      <div class="admin-form-grid">
        <label>Item label<input class="input" name="item_label" required value="${esc(x.item_label||r.product_interest||'')}"></label>
        <label>Workflow<select class="input" name="workflow_status">${['intake','reviewing','accepted','limitations_pending','limitations_acknowledged','declined','work_complete','returned','closed'].map(v=>`<option value="${v}" ${String(x.workflow_status||'intake')===v?'selected':''}>${esc(v.replace(/_/g,' '))}</option>`).join('')}</select></label>
        <label>Ownership / authority<select class="input" name="ownership_status">${[['unconfirmed','Unconfirmed'],['customer_owned','Customer owns item'],['authorized_agent','Customer is authorized by owner'],['unknown','Unknown / discuss']].map(([v,l])=>`<option value="${v}" ${String(x.ownership_status||'unconfirmed')===v?'selected':''}>${l}</option>`).join('')}</select></label>
        <label>Ownership note<input class="input" name="ownership_notes" value="${esc(x.ownership_notes||'')}"></label>
        <label>Material status<select class="input" name="material_status">${['unknown','customer_stated','staff_observed'].map(v=>`<option value="${v}" ${String(x.material_status||'unknown')===v?'selected':''}>${esc(v.replace(/_/g,' '))}</option>`).join('')}</select></label>
        <label>Material description<input class="input" name="material_description" value="${esc(x.material_description||'')}"></label>
        <label>Finish status<select class="input" name="finish_status">${['unknown','customer_stated','staff_observed'].map(v=>`<option value="${v}" ${String(x.finish_status||'unknown')===v?'selected':''}>${esc(v.replace(/_/g,' '))}</option>`).join('')}</select></label>
        <label>Finish / coating<input class="input" name="finish_description" value="${esc(x.finish_description||'')}"></label>
        <label style="grid-column:1/-1">Item description<textarea class="input" name="item_description" rows="2">${esc(x.item_description||'')}</textarea></label>
        <label style="grid-column:1/-1">Requested modification<textarea class="input" name="requested_modification" rows="2">${esc(x.requested_modification||'')}</textarea></label>
        <label style="grid-column:1/-1">Condition-at-intake notes<textarea class="input" name="intake_condition_notes" rows="2">${esc(x.intake_condition_notes||'')}</textarea></label>
      </div><button class="btn primary" type="submit">Save supplied item</button></form>`;
  }
  function readinessCard(){
    const rr=readiness(),t=triage(),rv=reviews()[0]||null;if(!state.itemId)return '';
    return `<section class="card"><h3 style="margin-top:0">Suitability readiness</h3><p>${badge(rr?.state||'not reviewed')} ${badge('Build 211 triage: '+(t?.supplied_item_review_state||'missing'))}</p>
      ${rr?.blockers?.length?`<p class="small"><strong>Blockers:</strong> ${esc(rr.blockers.join(' '))}</p>`:''}
      ${rr?.warnings?.length?`<p class="small"><strong>Review:</strong> ${esc(rr.warnings.join(' '))}</p>`:''}
      <p class="small">Intake evidence: <strong>${num(rr?.intake_evidence_count)}</strong> • Post-work evidence: <strong>${num(rr?.post_work_evidence_count)}</strong> • Latest decision: <strong>${esc(rv?.decision||'none')}</strong></p>
      <p class="small">Unknown material/process/safety facts stay unknown. Build 216 does not start production, reserve stock, alter media, collect payment or call providers.</p></section>`;
  }
  function evidenceCard(){
    if(!state.itemId)return '';
    const refs=(state.data?.reference_uploads||[]).filter(x=>num(x.custom_request_id)===state.requestId);
    const photos=(state.data?.stage_photos||[]).filter(x=>num(x.custom_request_id)===state.requestId);
    const list=evidence();
    return `<section class="card"><h3 style="margin-top:0">Condition evidence</h3>
      <p class="small">Link existing private Custom Work uploads for intake condition and existing stage photos for post-work condition. Build 216 stores references only; it does not copy or delete media.</p>
      ${list.length?`<div class="admin-table-wrap"><table><thead><tr><th>Role</th><th>Source</th><th>Status</th><th>Note</th><th></th></tr></thead><tbody>${list.map(e=>`<tr><td>${esc(e.evidence_role)}</td><td>${e.reference_url?`Reference: ${esc(e.reference_filename||e.reference_url)}`:`Stage: ${esc(e.stage_key||e.stage_photo_caption||e.stage_photo_url||'photo')}`}</td><td>${esc(e.evidence_status||'active')}</td><td>${esc(e.evidence_note||e.void_reason||'')}</td><td>${String(e.evidence_status||'active')==='active'?`<button class="btn secondary" type="button" data-evidence-void="${num(e.custom_request_supplied_item_evidence_id)}">Void link</button>`:''}</td></tr>`).join('')}</tbody></table></div>`:'<p class="small">No linked condition evidence yet.</p>'}
      <form id="suppliedItem216EvidenceForm" style="margin-top:12px"><div class="admin-form-grid">
        <label>Evidence role<select class="input" name="evidence_role"><option value="intake_condition">Condition at intake</option><option value="post_work_condition">Post-work condition</option><option value="other">Other supporting evidence</option></select></label>
        <label>Existing source<select class="input" name="evidence_source" required><option value="">Choose media…</option>
          <optgroup label="Customer reference uploads">${refs.map(x=>`<option value="reference_upload:${num(x.custom_request_reference_upload_id)}">Reference • ${esc(x.original_filename||x.public_url)}</option>`).join('')}</optgroup>
          <optgroup label="Order / process stage photos">${photos.map(x=>`<option value="stage_photo:${num(x.custom_order_stage_photo_id)}">Stage • ${esc(x.stage_key||x.image_caption||x.image_url)}</option>`).join('')}</optgroup>
        </select></label>
        <label style="grid-column:1/-1">Evidence note<input class="input" name="evidence_note"></label>
      </div><button class="btn primary" type="submit">Link existing evidence</button></form></section>`;
  }
  function reviewCard(){
    if(!state.itemId)return '';
    const t=triage(),rv=reviews()[0]||null;
    return `<section class="card"><h3 style="margin-top:0">Staff suitability review</h3>
      <p class="small"><strong>Build 211 supplied-item state:</strong> ${esc(t?.supplied_item_review_state||'No triage yet')}. Final Build 216 decisions must agree with that owner state: acceptable_for_assessment → accepted, limitations_required → accepted_with_limitations, declined → declined.</p>
      ${rv?`<details><summary>Latest review — ${esc(rv.decision)}</summary><p class="small">${esc(rv.process_compatibility_notes||'')}</p><p class="small"><strong>Limitations:</strong> ${esc(rv.limitations_text||'None recorded')}</p><p class="small"><strong>Material unknowns:</strong> ${esc(rv.material_unknowns||'None recorded')}</p><p class="small"><strong>Safety/process unknowns:</strong> ${esc(rv.safety_unknowns||'None recorded')}</p></details>`:''}
      <form id="suppliedItem216ReviewForm"><div class="admin-form-grid">
        <label>Decision<select class="input" name="decision"><option value="needs_review">Needs review</option><option value="accepted">Accept</option><option value="accepted_with_limitations">Accept with limitations</option><option value="declined">Decline</option></select></label>
        <label style="grid-column:1/-1">Reviewed process / suitability basis<textarea class="input" name="process_compatibility_notes" rows="2" placeholder="State what was reviewed. Do not invent unknown compatibility or safety facts."></textarea></label>
        <label style="grid-column:1/-1">Material unknowns<textarea class="input" name="material_unknowns" rows="2"></textarea></label>
        <label style="grid-column:1/-1">Safety / process unknowns<textarea class="input" name="safety_unknowns" rows="2"></textarea></label>
        <label style="grid-column:1/-1">Limitations<textarea class="input" name="limitations_text" rows="3" placeholder="Required for accept-with-limitations."></textarea></label>
        <label style="grid-column:1/-1">Review note<textarea class="input" name="review_note" rows="2"></textarea></label>
      </div><button class="btn primary" type="submit">Record append-only review</button></form></section>`;
  }
  function acknowledgementCard(){
    if(!state.itemId)return '';
    const rv=reviews()[0]||null,list=acks();
    if(String(rv?.decision||'')!=='accepted_with_limitations'&&!list.length)return '';
    return `<section class="card"><h3 style="margin-top:0">Customer limitation acknowledgement</h3>
      <p class="small">Required only for the current accepted-with-limitations review. Acknowledgement records that the customer received the stated limitations; it does not start production or charge the customer.</p>
      ${state.lastShareUrl?`<p><a href="${esc(state.lastShareUrl)}" target="_blank" rel="noopener">Open private acknowledgement link</a><br><code>${esc(state.lastShareUrl)}</code></p>`:''}
      ${list.length?`<div class="admin-table-wrap"><table><thead><tr><th>Status</th><th>Expires</th><th>Response</th></tr></thead><tbody>${list.map(a=>`<tr><td>${esc(a.acknowledgement_status)}</td><td>${esc(a.expires_at||'')}</td><td>${esc(a.customer_response_note||'')}</td></tr>`).join('')}</tbody></table></div>`:''}
      ${String(rv?.decision||'')==='accepted_with_limitations'?'<button class="btn primary" type="button" id="suppliedItem216CreateAck">Create / show active private acknowledgement</button>':''}</section>`;
  }
  function render(){
    const h=mount();if(!h)return;
    h.innerHTML=`<section class="card" style="margin-top:18px"><p class="eyebrow">Release 467 • Build 216</p><h2>Customer-supplied item intake & suitability</h2>
      <p class="small">Item-specific ownership, condition, reviewed suitability, limitations, acknowledgement and before/after evidence over the existing Custom Work journey.</p>
      <label>Customer-supplied Custom Request<select class="input" id="suppliedItem216Request">${requestOptions()}</select></label>
      <div id="suppliedItem216Message" class="small" role="status" aria-live="polite" style="margin-top:8px"></div></section>
      ${state.requestId?itemTabs()+itemForm()+readinessCard()+evidenceCard()+reviewCard()+acknowledgementCard():'<section class="card"><p class="small">Choose a customer-supplied request.</p></section>'}`;
    bind();
  }
  async function load(){
    try{
      const r=await apiFetch(ENDPOINT,{cache:'no-store'}),d=await r.json().catch(()=>null);
      if(!r.ok||!d?.ok)throw new Error(d?.error||`Build 216 load failed (${r.status}).`);
      state.data=d;
      if(state.requestId&&!d.requests.some(x=>num(x.custom_request_id)===state.requestId)){state.requestId=0;state.itemId=0;}
      if(state.requestId&&state.itemId&&!d.items.some(x=>num(x.custom_request_supplied_item_id)===state.itemId)){state.itemId=0;}
      if(state.requestId&&!state.itemId){const first=d.items.find(x=>num(x.custom_request_id)===state.requestId);if(first)state.itemId=num(first.custom_request_supplied_item_id);}
      render();
    }catch(e){if(mount())mount().innerHTML=`<section class="card" style="margin-top:18px"><h2>Supplied-item workspace unavailable</h2><p class="small">${esc(e.message||e)}</p><button class="btn" id="suppliedItem216Retry" type="button">Retry</button></section>`;document.getElementById('suppliedItem216Retry')?.addEventListener('click',load);}
  }
  async function post(payload){
    const r=await apiFetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const d=await r.json().catch(()=>null);if(!r.ok||!d?.ok)throw new Error(d?.error||`Build 216 save failed (${r.status}).`);return d;
  }
  async function save(payload){
    try{msg('Saving…');const d=await post(payload);if(d.share_url)state.lastShareUrl=d.share_url;if(d.saved_item_id)state.itemId=num(d.saved_item_id);state.data=d;if(state.requestId&&!state.itemId){const first=d.items.find(x=>num(x.custom_request_id)===state.requestId);if(first)state.itemId=num(first.custom_request_supplied_item_id);}render();msg(d.message||'Saved.');}
    catch(e){msg(e.message||'Save failed.',true);}
  }
  function bind(){
    document.getElementById('suppliedItem216Request')?.addEventListener('change',e=>{state.requestId=num(e.target.value);state.itemId=0;state.lastShareUrl='';const first=(state.data?.items||[]).find(x=>num(x.custom_request_id)===state.requestId);if(first)state.itemId=num(first.custom_request_supplied_item_id);render();});
    document.querySelectorAll('[data-supplied-item-select]').forEach(b=>b.addEventListener('click',()=>{state.itemId=num(b.dataset.suppliedItemSelect);state.lastShareUrl='';render();}));
    document.getElementById('suppliedItem216Add')?.addEventListener('click',()=>{state.itemId=0;state.lastShareUrl='';render();});
    document.getElementById('suppliedItem216ItemForm')?.addEventListener('submit',e=>{e.preventDefault();save({action:'save_item',custom_request_id:state.requestId,custom_request_supplied_item_id:state.itemId||null,...Object.fromEntries(new FormData(e.currentTarget).entries())});});
    document.getElementById('suppliedItem216EvidenceForm')?.addEventListener('submit',e=>{e.preventDefault();const p=Object.fromEntries(new FormData(e.currentTarget).entries()),[source_type,source_id]=String(p.evidence_source||'').split(':');delete p.evidence_source;save({action:'link_evidence',custom_request_supplied_item_id:state.itemId,source_type,...p,[source_type==='reference_upload'?'custom_request_reference_upload_id':'custom_order_stage_photo_id']:num(source_id)});});
    document.querySelectorAll('[data-evidence-void]').forEach(b=>b.addEventListener('click',()=>{const reason=window.prompt('Reason for voiding this evidence link? The media and history will be retained.','Linked to the wrong item or evidence role.');if(reason)save({action:'void_evidence',custom_request_supplied_item_evidence_id:num(b.dataset.evidenceVoid),void_reason:reason});}));
    document.getElementById('suppliedItem216ReviewForm')?.addEventListener('submit',e=>{e.preventDefault();save({action:'record_review',custom_request_supplied_item_id:state.itemId,...Object.fromEntries(new FormData(e.currentTarget).entries())});});
    document.getElementById('suppliedItem216CreateAck')?.addEventListener('click',()=>save({action:'create_acknowledgement_link',custom_request_supplied_item_id:state.itemId}));
  }
  document.addEventListener('DOMContentLoaded',()=>{const q=new URLSearchParams(location.search);state.requestId=num(q.get('custom_request_id')||q.get('request_id'));void load();});
})();