// Release 467 Build 214 — Prototype → Sample → Production Run UI.
(() => {
  const ENDPOINT='/api/admin/manufacturing-lifecycle';
  const state={data:null,projectId:0,requestId:0};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(v||0)||0;
  const mounts=()=>[document.getElementById('manufacturingLifecycle214Mount'),document.getElementById('customWorkLifecycle214Mount')].filter(Boolean);
  const apiFetch=(...args)=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(...args):fetch(...args);
  const label=s=>state.data?.stage_labels?.[s]||String(s||'').replace(/_/g,' ');
  function msg(text,error=false){document.querySelectorAll('[data-maturity214-message]').forEach(el=>{el.textContent=text||'';el.style.color=error?'#ffb4b4':'';});}
  async function call(payload){
    const r=await apiFetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const d=await r.json().catch(()=>null);if(!r.ok||!d?.ok){const extra=(d?.blockers||[]).join(' ');throw new Error([d?.error||`Build 214 request failed (${r.status}).`,extra].filter(Boolean).join(' '));}return d;
  }
  function projectOptions(){
    return '<option value="">No Creative Project selected</option>'+(state.data?.projects||[]).map(p=>`<option value="${num(p.creative_work_project_id)}" ${num(p.creative_work_project_id)===state.projectId?'selected':''}>${esc(p.project_title||p.project_key)} • ${esc(p.project_status||'')}</option>`).join('');
  }
  function requestOptions(){
    return '<option value="">No Custom Request selected</option>'+(state.data?.requests||[]).map(r=>`<option value="${num(r.custom_request_id)}" ${num(r.custom_request_id)===state.requestId?'selected':''}>#${num(r.custom_request_id)} ${esc(r.product_interest||r.request_type||r.request_key)} • ${esc(r.status||'')}</option>`).join('');
  }
  function proofOptions(){
    return '<option value="">Choose approved proof version…</option>'+(state.data?.proof_versions||[]).map(p=>`<option value="${num(p.custom_request_proof_version_id)}" ${String(p.proof_status||'')==='approved'?'':'disabled'}>v${Number(p.version_number||0)} • ${esc(p.proof_title||'proof')} • ${esc(p.proof_status||'')}</option>`).join('');
  }
  function eventOptions(){
    return '<option value="">Choose Creative Process event…</option>'+(state.data?.creative_events||[]).map(e=>`<option value="${num(e.creative_work_event_id)}">#${num(e.creative_work_event_id)} • ${esc(e.event_title||e.event_type||'event')} • ${esc(e.occurred_at||'')}</option>`).join('');
  }
  function history(){
    const rows=state.data?.history||[];if(!rows.length)return '<p class="small">No lifecycle transitions yet.</p>';
    return `<div class="admin-table-wrap"><table><thead><tr><th>When</th><th>Transition</th><th>Evidence</th><th>Note</th></tr></thead><tbody>${rows.map(e=>`<tr><td class="small">${esc(e.created_at||'')}</td><td><strong>${esc(label(e.from_stage)||'Created')}</strong> → <strong>${esc(label(e.to_stage))}</strong><br><span class="small">${esc(e.transition_kind||'')}</span></td><td class="small">${e.proof_version_id?`Proof #${num(e.proof_version_id)}`:e.creative_work_event_id?`Creative event #${num(e.creative_work_event_id)}`:'—'}</td><td class="small">${esc(e.event_note||'')}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function lifecyclePanel(){
    const l=state.data?.lifecycle,r=state.data?.readiness;if(!l)return '<section class="card"><h3 style="margin-top:0">Start / link manufacturing maturity</h3><p class="small">Choose an existing Creative Project, Custom Request, or both. This creates only a lifecycle evidence record; it does not create another project or customer request.</p><button class="btn primary" type="button" data-maturity214-link>Link selected authorities</button></section>';
    const next=r?.allowed_next_stages||[];
    const proofReady=r?.custom_request_proof_readiness;
    return `<section class="card"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><p class="eyebrow">Current manufacturing maturity</p><h3 style="margin:0">${esc(label(l.current_stage))}</h3></div><span class="status-note">Lifecycle #${num(l.creative_project_manufacturing_lifecycle_id)}</span></div>
      <p class="small"><strong>Creative Project:</strong> ${esc(state.data?.project?.project_title||'Not linked')} • <strong>Custom Request:</strong> ${esc(state.data?.custom_request?.request_key||'Not linked')}</p>
      ${l.approved_sample_at?`<p class="small"><strong>Approved sample:</strong> ${esc(l.approved_sample_evidence_kind||'')} • ${esc(l.approved_sample_at)}<br>${esc(l.approved_sample_note||'')}</p>`:''}
      ${l.production_authorized_at?`<p class="small"><strong>Production authorization:</strong> ${esc(l.production_authorized_at)}<br>${esc(l.production_authorization_note||'')}</p>`:''}
      ${proofReady?`<p class="small"><strong>Build 213 proof gate:</strong> ${proofReady.proof_required?(proofReady.production_ready?'READY':'BLOCKED'):'Not required by triage'}${(proofReady.blockers||[]).length?' • '+esc(proofReady.blockers.join(' ')):''}</p>`:''}
      <p class="small">Production authorization is evidence only. It does not start production, consume Inventory, create a Product production run, charge a customer, or publish media.</p>
    </section>
    ${next.length?`<form class="card" data-maturity214-transition><h3 style="margin-top:0">Record next maturity transition</h3><div class="admin-form-grid">
      <label>Next stage<select class="input" name="to_stage" required>${next.map(s=>`<option value="${esc(s)}">${esc(label(s))}</option>`).join('')}</select></label>
      <label>Approved-sample evidence type<select class="input" name="approved_sample_evidence_kind"><option value="">Only required for Approved sample</option><option value="proof_version">Approved Build 213 proof version</option><option value="creative_work_event">Creative Process event</option></select></label>
      <label>Approved proof version<select class="input" name="approved_sample_proof_version_id">${proofOptions()}</select></label>
      <label>Creative Process evidence<select class="input" name="approved_sample_creative_work_event_id">${eventOptions()}</select></label>
      <label style="grid-column:1/-1">Evidence / decision note<textarea class="input" name="event_note" rows="3" placeholder="Required for failed/rework and QA/rework; useful for every transition."></textarea></label>
    </div><button class="btn primary" type="submit">Record transition</button></form>`:''}
    <section class="card"><h3 style="margin-top:0">Append-only maturity history</h3>${history()}</section>`;
  }
  function renderOne(host){
    const context=host.id==='customWorkLifecycle214Mount'?'Custom Work':'Creative Process';
    host.innerHTML=`<section class="card" style="margin-top:18px"><p class="eyebrow">Release 467 • Build 214</p><h2 style="margin-top:0">Prototype → sample → production run</h2><p class="small">Explicit manufacturing maturity evidence over the existing ${context} authority. Failed prototypes and rework remain in history; approved samples point to exact evidence.</p>
      <div class="admin-form-grid"><label>Creative Project<select class="input" data-maturity214-project>${projectOptions()}</select></label><label>Custom Request<select class="input" data-maturity214-request>${requestOptions()}</select></label></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn" type="button" data-maturity214-load>Load selected lifecycle</button>${state.data?.lifecycle?'<button class="btn secondary" type="button" data-maturity214-link>Attach missing selected authority</button>':''}</div>
      <div class="small" data-maturity214-message role="status" aria-live="polite" style="margin-top:8px"></div></section>${lifecyclePanel()}`;
  }
  function render(){mounts().forEach(renderOne);bind();}
  async function load(){
    try{
      const qs=new URLSearchParams();if(state.projectId)qs.set('project_id',state.projectId);if(state.requestId)qs.set('request_id',state.requestId);
      const r=await apiFetch(`${ENDPOINT}?${qs.toString()}`,{cache:'no-store'});const d=await r.json().catch(()=>null);
      if(!r.ok||!d?.ok)throw new Error(d?.error||`Build 214 load failed (${r.status}).`);
      state.data=d;state.projectId=num(d.project?.creative_work_project_id||state.projectId);state.requestId=num(d.custom_request?.custom_request_id||state.requestId);render();
      msg(d.lifecycle?'Manufacturing maturity loaded.':'Choose existing authority records and create/link the lifecycle.');
    }catch(e){mounts().forEach(h=>h.innerHTML=`<section class="card" style="margin-top:18px"><h2>Manufacturing maturity unavailable</h2><p class="small">${esc(e.message||e)}</p><button class="btn" data-maturity214-retry type="button">Retry</button></section>`);document.querySelectorAll('[data-maturity214-retry]').forEach(b=>b.onclick=()=>load());}
  }
  async function save(payload){
    try{msg('Saving Build 214 lifecycle evidence…');state.data=await call(payload);state.projectId=num(state.data.project?.creative_work_project_id||state.projectId);state.requestId=num(state.data.custom_request?.custom_request_id||state.requestId);render();msg(state.data.message||'Saved.');}
    catch(e){msg(e.message||'Save failed.',true);}
  }
  function bind(){
    document.querySelectorAll('[data-maturity214-project]').forEach(el=>el.onchange=e=>{state.projectId=num(e.target.value);});
    document.querySelectorAll('[data-maturity214-request]').forEach(el=>el.onchange=e=>{state.requestId=num(e.target.value);});
    document.querySelectorAll('[data-maturity214-load]').forEach(b=>b.onclick=()=>load());
    document.querySelectorAll('[data-maturity214-link]').forEach(b=>b.onclick=()=>save({action:'save_link',creative_work_project_id:state.projectId||null,custom_request_id:state.requestId||null}));
    document.querySelectorAll('[data-maturity214-transition]').forEach(form=>form.onsubmit=e=>{e.preventDefault();const p=Object.fromEntries(new FormData(e.currentTarget).entries());save({action:'transition',creative_project_manufacturing_lifecycle_id:num(state.data?.lifecycle?.creative_project_manufacturing_lifecycle_id),...p});});
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const q=new URLSearchParams(location.search);state.projectId=num(q.get('project_id'));state.requestId=num(q.get('request_id'));load();
  });
})();