// Release 467 Build 211 — reviewed Manufacturing Triage & Route Proposal UI.
(function(){
  const ENDPOINT='/api/admin/custom-work-triage';
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let data=null;
  const indexBy=(rows,key)=>new Map((rows||[]).map(x=>[Number(x[key]||0),x]));
  function setMessage(text,error=false){
    const el=document.getElementById('customWorkTriage211Message');if(!el)return;
    el.textContent=text||'';el.style.color=error?'#ffb4b4':'';
  }
  function render(){
    const mount=document.getElementById('customWorkTriage211Mount');if(!mount)return;
    if(!data){mount.innerHTML='<section class="card"><p class="small">Loading Manufacturing Triage…</p></section>';return;}
    const triage=indexBy(data.triage,'custom_request_id');
    const routeMap=new Map();
    for(const row of data.route_processes||[]){const id=Number(row.custom_request_id||0);if(!routeMap.has(id))routeMap.set(id,[]);routeMap.get(id).push(row);}
    const processes=Array.isArray(data.processes)?data.processes:[];
    const requests=Array.isArray(data.requests)?data.requests:[];
    mount.innerHTML=`<section class="card" aria-labelledby="triage211Heading">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><p class="small" style="font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin:0">Release 467 Build 211</p>
        <h2 id="triage211Heading" style="margin:4px 0">Manufacturing triage & candidate route</h2>
        <p class="small" style="margin:0">Staff-reviewed planning only. Customer ideas remain requirements; candidate processes are not a feasibility promise.</p></div>
        <button class="btn" id="customWorkTriage211Refresh" type="button">Refresh triage</button>
      </div>
      <div id="customWorkTriage211Message" class="small" role="status" aria-live="polite" style="margin-top:10px"></div>
      <div style="display:grid;gap:14px;margin-top:14px">
      ${requests.length?requests.map(r=>{
        const id=Number(r.custom_request_id||0),t=triage.get(id)||{},selected=new Set((routeMap.get(id)||[]).map(x=>Number(x.inventory_process_id||0)));
        const supplied=Number(r.supplied_item||0)===1;
        return `<form class="card" data-triage211-form="${id}" style="margin:0">
          <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><strong>${esc(r.name||'Customer')} — ${esc(r.product_interest||r.request_type||'Custom request')}</strong><div class="small">#${id} • ${esc(r.status||'new')} • qty ${esc(r.quantity||1)} • intent ${esc(r.project_intent||'unknown')}</div></div><span class="small">${esc(r.requested_capability_key||(Number(r.help_choose_method||0)===1?'help me decide':'no capability preference'))}</span></div>
          <p class="small" style="margin:8px 0"><strong>Requirements:</strong> ${esc([r.intended_use&&`use: ${r.intended_use}`,r.desired_material&&`material: ${r.desired_material}`,r.desired_finish&&`finish: ${r.desired_finish}`,r.tolerance_size_notes&&`size/tolerance: ${r.tolerance_size_notes}`].filter(Boolean).join(' • ')||'No additional structured requirements recorded.')}</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
            <label class="small">Triage status<select name="triage_status"><option value="draft" ${t.triage_status==='draft'?'selected':''}>Draft</option><option value="reviewed" ${t.triage_status==='reviewed'?'selected':''}>Reviewed</option><option value="clarification_required" ${t.triage_status==='clarification_required'?'selected':''}>Clarification required</option><option value="on_hold" ${t.triage_status==='on_hold'?'selected':''}>On hold</option></select></label>
            <label class="small">Feasibility state<select name="feasibility_state"><option value="needs_review">Needs review</option><option value="candidate_route" ${t.feasibility_state==='candidate_route'?'selected':''}>Candidate route</option><option value="feasible_with_review" ${t.feasibility_state==='feasible_with_review'?'selected':''}>Feasible with review</option><option value="clarification_required" ${t.feasibility_state==='clarification_required'?'selected':''}>Clarification required</option><option value="not_feasible" ${t.feasibility_state==='not_feasible'?'selected':''}>Not feasible</option><option value="on_hold" ${t.feasibility_state==='on_hold'?'selected':''}>On hold</option></select></label>
            <label class="small">Supplied-item review<select name="supplied_item_review_state" ${supplied?'':'disabled'}><option value="not_applicable">Not applicable</option><option value="needs_review" ${t.supplied_item_review_state==='needs_review'?'selected':''}>Needs review</option><option value="acceptable_for_assessment" ${t.supplied_item_review_state==='acceptable_for_assessment'?'selected':''}>Acceptable for assessment</option><option value="limitations_required" ${t.supplied_item_review_state==='limitations_required'?'selected':''}>Limitations required</option><option value="declined" ${t.supplied_item_review_state==='declined'?'selected':''}>Declined</option></select></label>
          </div>
          <fieldset style="margin-top:10px"><legend class="small"><strong>Candidate processes</strong> — first selected process becomes primary</legend><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:6px">
            ${processes.map(p=>`<label class="small"><input type="checkbox" name="candidate_process_ids" value="${Number(p.inventory_process_id)}" ${selected.has(Number(p.inventory_process_id))?'checked':''}> ${esc(p.process_name)}</label>`).join('')}
          </div></fieldset>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;margin-top:10px">
            <label class="small"><input type="checkbox" name="specialist_review_required" value="1" ${Number(t.specialist_review_required||0)===1?'checked':''}> Specialist review required<textarea name="specialist_review_notes" rows="2" placeholder="Who/what needs specialist review?">${esc(t.specialist_review_notes||'')}</textarea></label>
            <label class="small"><input type="checkbox" name="proof_sample_required" value="1" ${Number(t.proof_sample_required||0)===1?'checked':''}> Proof/sample required<textarea name="proof_sample_notes" rows="2" placeholder="What proof or sample is needed?">${esc(t.proof_sample_notes||'')}</textarea></label>
            <label class="small">Material unknowns<textarea name="material_unknowns" rows="3" placeholder="Unknown material, finish, compatibility or sourcing facts">${esc(t.material_unknowns||'')}</textarea></label>
            <label class="small">Supplied-item review notes<textarea name="supplied_item_review_notes" rows="3" placeholder="Condition, compatibility or limitations to assess">${esc(t.supplied_item_review_notes||'')}</textarea></label>
            <label class="small">Next clarification question<textarea name="next_clarification_question" rows="3" placeholder="One concrete question to resolve next">${esc(t.next_clarification_question||'')}</textarea></label>
            <label class="small">Route notes<textarea name="route_notes" rows="3" placeholder="Why these candidate processes?">${esc(t.route_notes||'')}</textarea></label>
          </div>
          <div style="margin-top:10px"><button class="btn primary" type="submit">Save reviewed triage</button> <span class="small">No quote, order, stock reservation, provider action or customer promise is created.</span></div>
        </form>`;
      }).join(''):'<p class="small">No open Custom Requests require triage.</p>'}
      </div></section>`;
    document.getElementById('customWorkTriage211Refresh')?.addEventListener('click',load);
    mount.querySelectorAll('[data-triage211-form]').forEach(form=>form.addEventListener('submit',save));
  }
  async function save(event){
    event.preventDefault();const form=event.currentTarget,id=Number(form.getAttribute('data-triage211-form')||0);
    const fd=new FormData(form);const payload=Object.fromEntries(fd.entries());
    payload.action='save_triage';payload.custom_request_id=id;
    payload.specialist_review_required=form.querySelector('[name="specialist_review_required"]')?.checked?1:0;
    payload.proof_sample_required=form.querySelector('[name="proof_sample_required"]')?.checked?1:0;
    payload.candidate_process_ids=[...form.querySelectorAll('[name="candidate_process_ids"]:checked')].map(x=>Number(x.value));
    if(!form.querySelector('[name="supplied_item_review_state"]')?.disabled)payload.supplied_item_review_state=form.querySelector('[name="supplied_item_review_state"]').value;
    try{
      setMessage('Saving reviewed manufacturing triage…');
      const r=await window.DDAuth.apiFetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const d=await r.json().catch(()=>null);if(!r.ok||!d?.ok)throw new Error(d?.error||`Triage save failed (${r.status}).`);
      data=d;render();setMessage(d.message||'Manufacturing triage saved.');
    }catch(e){setMessage(e.message||'Unable to save manufacturing triage.',true);}
  }
  async function load(){
    const mount=document.getElementById('customWorkTriage211Mount');if(!mount||!window.DDAuth?.apiFetch)return;
    try{const r=await window.DDAuth.apiFetch(ENDPOINT,{headers:{Accept:'application/json'},cache:'no-store'});const d=await r.json().catch(()=>null);if(!r.ok||!d?.ok)throw new Error(d?.error||`Triage read failed (${r.status}).`);data=d;render();}
    catch(e){mount.innerHTML=`<section class="card"><h2>Manufacturing triage unavailable</h2><p class="small">${esc(e.message||'Read failed.')}</p><p class="small">No mutation or customer promise was attempted.</p><button class="btn" id="customWorkTriage211Retry" type="button">Retry</button></section>`;document.getElementById('customWorkTriage211Retry')?.addEventListener('click',load);}
  }
  document.addEventListener('DOMContentLoaded',load);
})();
