// Release 467 Build 227 — read-only Manufacturing Adoption Command Centre UI.
(function(){
  const ENDPOINT='/api/admin/manufacturing-adoption-command-centre';
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const n=v=>Number(v||0).toLocaleString('en-CA');
  function badge(state){
    const s=String(state||'').replace(/_/g,' ');
    return '<span class="small" style="display:inline-block;padding:3px 8px;border:1px solid currentColor;border-radius:999px">'+esc(s)+'</span>';
  }
  function metric(label,value,note=''){
    return '<div class="card" style="margin:0"><div class="small">'+esc(label)+'</div><div style="font-size:1.55rem;font-weight:800;margin-top:4px">'+n(value)+'</div>'+(note?'<div class="small" style="margin-top:4px">'+esc(note)+'</div>':'')+'</div>';
  }
  function render(data){
    const mount=document.getElementById('manufacturingAdoption227Mount');if(!mount)return;
    const c=data.counts||{};
    const classText=String(data.classification||'UNKNOWN').replace(/_/g,' ');
    const noWork=data.classification==='NO_REAL_WORK_YET';
    mount.innerHTML=`
      <section class="card" aria-labelledby="adoption227Status">
        <div style="display:flex;gap:12px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap">
          <div><p class="small" style="font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin:0">Release 467 Build 227</p>
          <h2 id="adoption227Status" style="margin:4px 0">Adoption state: ${esc(classText)}</h2>
          <p class="small" style="margin:0;max-width:860px">${esc(data.interpretation||'')}</p></div>
          <button class="btn" id="manufacturingAdoption227Refresh" type="button">Refresh evidence</button>
        </div>
        ${noWork?'<div class="card" style="margin-top:14px"><strong>No real work yet is not a failure.</strong><p class="small" style="margin-bottom:0">Build 227 will not seed fake customers, projects, quotes, proofs, travelers or production runs. Use the first legitimate job when one is available.</p></div>':''}
        <div style="margin-top:14px"><strong>Next valid action</strong><div style="margin-top:8px"><a class="btn primary" href="${esc(data.next_valid_action?.href||'/admin/custom-request/')}">${esc(data.next_valid_action?.label||'Open Custom Work')}</a></div></div>
      </section>
      <section class="card" style="margin-top:18px"><h2 style="margin-top:0">Measured adoption evidence</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
          ${metric('Active Custom Requests',c.active_custom_requests)}
          ${metric('Reviewed triage',c.reviewed_triage)}
          ${metric('Hybrid projects',c.hybrid_projects)}
          ${metric('Proof versions',c.proof_versions)}
          ${metric('Quote drafts',c.quote_drafts)}
          ${metric('Manufacturing lifecycles',c.manufacturing_lifecycles)}
          ${metric('Reviewed travelers',c.reviewed_travelers)}
          ${metric('Reviewed production runs',c.reviewed_runs)}
          ${metric('QA checks',c.qa_checks)}
          ${metric('Production cost evidence',c.production_cost_evidence)}
        </div>
      </section>
      <section class="card" style="margin-top:18px"><h2 style="margin-top:0">Existing workflow path</h2>
        <p class="small">Every action below opens the existing owner surface. Build 227 is read-only and creates no parallel record authority.</p>
        <div style="display:grid;gap:10px">
          ${(data.adoption_path||[]).map((s,i)=>`<div class="card" style="margin:0;display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><div><strong>${i+1}. ${esc(s.label)}</strong><div class="small">Build ${esc(s.build)} • ${badge(s.state)}</div></div><a class="btn" href="${esc(s.href)}">Open owner surface</a></div>`).join('')}
        </div>
      </section>
      <section class="card" style="margin-top:18px"><h2 style="margin-top:0">Real Custom Work adoption queue</h2>
        ${(data.requests||[]).length?'<div style="display:grid;gap:10px">'+data.requests.map(r=>`<div class="card" style="margin:0"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><strong>${esc(r.name||'Customer')} — ${esc(r.product_interest||r.request_key||('Request #'+r.custom_request_id))}</strong><div class="small">status ${esc(r.status||'new')} • intent ${esc(r.project_intent||'unknown')} • qty ${esc(r.quantity||1)}</div></div><a class="btn" href="${esc(r.next_action?.href||'/admin/custom-request/')}">Open next action</a></div><div class="small" style="margin-top:8px"><strong>Next:</strong> ${esc(r.next_action?.label||'Continue reviewed workflow')}</div></div>`).join('')+'</div>':'<p class="small">No active Custom Requests are available. The command centre is ready and will remain empty rather than fabricating adoption evidence.</p>'}
      </section>
      <section class="card" style="margin-top:18px"><h2 style="margin-top:0">Workflow attention checks</h2>
        <div class="small">Requests missing triage: <strong>${n(c.requests_missing_triage)}</strong> • reviewed triage missing a route: <strong>${n(c.reviewed_triage_missing_route)}</strong> • production-stage lifecycles missing a reviewed traveler: <strong>${n(c.production_stage_missing_traveler)}</strong> • reviewed runs missing QA evidence: <strong>${n(c.reviewed_run_missing_qa)}</strong></div>
        <p class="small" style="margin-bottom:0">Missing canonical tables are reported separately as <strong>BROKEN EXISTING AUTHORITY</strong>. Zero operational records are reported as <strong>NO REAL WORK YET</strong>.</p>
      </section>`;
    document.getElementById('manufacturingAdoption227Refresh')?.addEventListener('click',load);
  }
  async function load(){
    const mount=document.getElementById('manufacturingAdoption227Mount');if(!mount||!window.DDAuth?.apiFetch)return;
    mount.innerHTML='<section class="card"><p class="small">Reading existing manufacturing adoption evidence…</p></section>';
    try{
      const r=await window.DDAuth.apiFetch(ENDPOINT,{headers:{Accept:'application/json'},cache:'no-store'});
      const d=await r.json().catch(()=>null);
      if(!r.ok||!d?.ok)throw new Error(d?.error||('Command-centre read failed ('+r.status+').'));
      render(d);
    }catch(e){
      mount.innerHTML='<section class="card"><h2>Manufacturing adoption evidence unavailable</h2><p class="small">'+esc(e.message||'Read failed.')+'</p><p class="small">No business record, Inventory quantity, customer fact or provider action was changed.</p><button class="btn" id="manufacturingAdoption227Retry" type="button">Retry</button></section>';
      document.getElementById('manufacturingAdoption227Retry')?.addEventListener('click',load);
    }
  }
  document.addEventListener('DOMContentLoaded',load);
})();
