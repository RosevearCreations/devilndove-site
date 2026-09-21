// Release 467 Build 217 — Production Cost Evidence v2 UI.
(()=>{
  const ENDPOINT='/api/admin/production-cost-evidence',state={data:null,projectId:0};
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(v||0)||0;
  const money=v=>v===null||v===undefined?'Unknown':new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(v||0)/100);
  const apiFetch=(...args)=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(...args):fetch(...args);
  const mount=()=>$('productionCostEvidence217Mount');
  const cents=v=>{if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(v);return Number.isFinite(n)&&n>=0?Math.round(n*100):null;};

  function projectOptions(){
    return '<option value="">Choose a Creative Project…</option>'+((state.data?.projects||[]).map(p=>`<option value="${num(p.creative_work_project_id)}" ${num(p.creative_work_project_id)===state.projectId?'selected':''}>${esc(p.project_title||p.project_key)} — ${esc(p.project_status||'')}</option>`).join(''));
  }
  function operationOptions(){
    return '<option value="">Project-wide / not operation-specific</option>'+((state.data?.operations||[]).map(o=>`<option value="${num(o.creative_project_operation_id)}">#${num(o.operation_order)} ${esc(o.operation_title||o.process_name||'operation')}</option>`).join(''));
  }
  function summary(){
    const s=state.data?.summary||{};
    return `<div class="grid cols-3" style="gap:10px">
      <div class="card"><strong>${esc(s.active_evidence_rows||0)}</strong><div class="small">active evidence rows</div></div>
      <div class="card"><strong>${esc(s.cost_evidence_state||'unknown')}</strong><div class="small">cost evidence state</div></div>
      <div class="card"><strong>${esc(money(s.known_direct_cost_cents))}</strong><div class="small">known direct components only</div></div>
      <div class="card"><strong>${esc((s.design_setup_minutes||0)+(s.machine_minutes||0)+(s.hands_on_labour_minutes||0)+(s.rework_minutes||0))} min</strong><div class="small">evidenced time</div></div>
      <div class="card"><strong>${s.quantity_produced==null?'Unknown':esc(s.quantity_produced)}</strong><div class="small">quantity produced</div></div>
      <div class="card"><strong>${s.quantity_accepted==null?'Unknown':esc(s.quantity_accepted)}</strong><div class="small">quantity accepted</div></div>
    </div>`;
  }
  function form(){
    return `<form id="productionCostEvidence217Form" class="card">
      <h3 style="margin-top:0">Record manufacturing source evidence</h3>
      <p class="small">Blank cost fields stay <strong>unknown</strong>; they are never converted to zero. Material usage remains owned by Inventory below.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px">
        <label class="small">Operation<select name="creative_project_operation_id">${operationOptions()}</select></label>
        <label class="small">Evidence state<select name="cost_evidence_state"><option value="unknown">Unknown</option><option value="partial" selected>Partial</option><option value="reviewed">Reviewed</option></select></label>
        <label class="small">Design/setup minutes<input type="number" min="0" step="1" name="design_setup_minutes"></label>
        <label class="small">Machine minutes<input type="number" min="0" step="1" name="machine_minutes"></label>
        <label class="small">Hands-on labour minutes<input type="number" min="0" step="1" name="hands_on_labour_minutes"></label>
        <label class="small">Rework minutes<input type="number" min="0" step="1" name="rework_minutes"></label>
        <label class="small">Consumables (CAD)<input type="number" min="0" step="0.01" name="consumables_cost"></label>
        <label class="small">Packaging (CAD)<input type="number" min="0" step="0.01" name="packaging_cost"></label>
        <label class="small">Prototype waste (CAD)<input type="number" min="0" step="0.01" name="prototype_waste_cost"></label>
        <label class="small">Rework cost (CAD)<input type="number" min="0" step="0.01" name="rework_cost"></label>
        <label class="small">Finishing (CAD)<input type="number" min="0" step="0.01" name="finishing_cost"></label>
        <label class="small">Outside service (CAD)<input type="number" min="0" step="0.01" name="outside_service_cost"></label>
        <label class="small">Failed prototypes<input type="number" min="0" step="1" name="failed_prototype_count"></label>
        <label class="small">Quantity produced<input type="number" min="0" step="0.001" name="quantity_produced"></label>
        <label class="small">Quantity accepted<input type="number" min="0" step="0.001" name="quantity_accepted"></label>
      </div>
      <label class="small" style="display:block;margin-top:10px">Evidence notes<textarea name="notes" rows="3" placeholder="What happened, what was measured, what remains unknown?"></textarea></label>
      <button class="btn primary" type="submit" style="margin-top:10px">Record evidence</button>
      <span class="small" id="productionCostEvidence217Message" role="status" aria-live="polite"></span>
    </form>`;
  }
  function evidence(){
    const ops=new Map((state.data?.operations||[]).map(o=>[num(o.creative_project_operation_id),o]));
    const rows=state.data?.evidence||[];
    if(!rows.length)return '<div class="card"><p class="small">No Production Cost Evidence v2 rows yet.</p></div>';
    return rows.map(r=>{
      const op=ops.get(num(r.creative_project_operation_id));
      const costs=[['Consumables',r.consumables_cost_cents],['Packaging',r.packaging_cost_cents],['Prototype waste',r.prototype_waste_cost_cents],['Rework',r.rework_cost_cents],['Finishing',r.finishing_cost_cents],['Outside service',r.outside_service_cost_cents]];
      return `<article class="card" style="margin:0">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><strong>${esc(op?('#'+op.operation_order+' '+(op.operation_title||op.process_name)):'Project-wide evidence')}</strong>
        <div class="small">${esc(r.cost_evidence_state)} • ${esc(r.evidence_status)} • ${esc(r.recorded_at||'')}</div></div>
        ${r.evidence_status==='active'?'<button class="btn secondary" type="button" data-void-evidence="'+num(r.creative_project_production_cost_evidence_id)+'">Void</button>':''}</div>
        <p class="small"><strong>Time:</strong> setup ${esc(r.design_setup_minutes??'—')} • machine ${esc(r.machine_minutes??'—')} • labour ${esc(r.hands_on_labour_minutes??'—')} • rework ${esc(r.rework_minutes??'—')} min</p>
        <p class="small"><strong>Quantities:</strong> produced ${esc(r.quantity_produced??'—')} • accepted ${esc(r.quantity_accepted??'—')} • failed prototypes ${esc(r.failed_prototype_count??'—')}</p>
        <p class="small"><strong>Direct components:</strong> ${costs.map(([k,v])=>esc(k)+': '+esc(money(v))).join(' • ')}</p>
        ${r.notes?'<p class="small">'+esc(r.notes)+'</p>':''}${r.void_reason?'<p class="small"><strong>Void reason:</strong> '+esc(r.void_reason)+'</p>':''}
      </article>`;
    }).join('');
  }
  function materials(){
    const rows=state.data?.inventory_material_usage||[];
    if(!rows.length)return '<p class="small">No posted Inventory material usage is linked to this project yet.</p>';
    return '<div style="display:grid;gap:8px">'+rows.map(r=>`<div class="card" style="margin:0"><strong>${esc(r.item_name||'Inventory item')}</strong><div class="small">${esc(r.usage_quantity_consumed??r.stock_quantity_consumed??'—')} ${esc(r.posted_usage_unit_label||'')} • cost evidence ${esc(money(r.allocated_cost_cents))}</div></div>`).join('')+'</div>';
  }
  function render(){
    const host=mount();if(!host)return;const p=state.data?.project;
    host.innerHTML=`<section class="card" id="production-cost-evidence-v2" style="margin-top:18px">
      <p class="eyebrow">Release 467 • Build 217</p><h2 style="margin-top:0">Production Cost Evidence v2</h2>
      <p class="small">Manufacturing source evidence for setup, machine time, hands-on labour, consumables, finishing, failed prototypes, waste, rework and actual quantities. Finance/Accounting remains the profitability owner.</p>
      <label class="small">Creative Project<select id="productionCostEvidence217Project">${projectOptions()}</select></label>
      <p class="small"><a href="/admin/project-profitability-reconciliation/">Open Creator ↔ Finance profitability reconciliation</a></p>
    </section>${p?summary()+form()+'<section style="margin-top:14px"><h3>Evidence history</h3><div style="display:grid;gap:10px">'+evidence()+'</div></section><section class="card" style="margin-top:14px"><h3 style="margin-top:0">Inventory-owned material usage</h3><p class="small">Read-only here. Correct material use through the existing Creative Process / Inventory posting authority.</p>'+materials()+'</section>':''}`;
    bind();
  }
  async function load(projectId=state.projectId){
    const qs=new URLSearchParams();if(projectId)qs.set('project_id',projectId);
    try{
      const r=await apiFetch(ENDPOINT+'?'+qs.toString(),{cache:'no-store'}),d=await r.json();
      if(!r.ok||!d.ok)throw new Error(d.error||'Build 217 load failed.');
      state.data=d;state.projectId=num(d.project?.creative_work_project_id||projectId);render();
    }catch(e){
      if(mount())mount().innerHTML='<section class="card" style="margin-top:18px"><h2>Production Cost Evidence v2 unavailable</h2><p class="small">'+esc(e.message||e)+'</p></section>';
    }
  }
  async function post(payload){
    try{
      const r=await apiFetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project_id:state.projectId,...payload})}),d=await r.json();
      if(!r.ok||!d.ok)throw new Error(d.error||'Save failed.');
      state.data={...state.data,...d};render();
    }catch(e){
      const m=$('productionCostEvidence217Message');if(m)m.textContent=e.message||'Save failed.';
    }
  }
  function bind(){
    $('productionCostEvidence217Project')?.addEventListener('change',e=>{state.projectId=num(e.target.value);load(state.projectId);});
    $('productionCostEvidence217Form')?.addEventListener('submit',e=>{
      e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget).entries());
      post({action:'record_evidence',creative_project_operation_id:f.creative_project_operation_id||null,cost_evidence_state:f.cost_evidence_state,
        design_setup_minutes:f.design_setup_minutes||null,machine_minutes:f.machine_minutes||null,hands_on_labour_minutes:f.hands_on_labour_minutes||null,rework_minutes:f.rework_minutes||null,
        consumables_cost_cents:cents(f.consumables_cost),packaging_cost_cents:cents(f.packaging_cost),prototype_waste_cost_cents:cents(f.prototype_waste_cost),
        rework_cost_cents:cents(f.rework_cost),finishing_cost_cents:cents(f.finishing_cost),outside_service_cost_cents:cents(f.outside_service_cost),
        failed_prototype_count:f.failed_prototype_count||null,quantity_produced:f.quantity_produced||null,quantity_accepted:f.quantity_accepted||null,notes:f.notes||''});
    });
    document.querySelectorAll('[data-void-evidence]').forEach(b=>b.addEventListener('click',()=>{
      const reason=window.prompt('Why should this evidence row be voided? History will be retained.');
      if(reason?.trim())post({action:'void_evidence',evidence_id:num(b.dataset.voidEvidence),void_reason:reason.trim()});
    }));
  }
  document.addEventListener('DOMContentLoaded',()=>load(num(new URLSearchParams(location.search).get('project_id')||0)));
})();
