// Release 467 Build 212 — Hybrid Creative Project Operations UI.
// Planning-only surface embedded in the existing Creative Process workspace.
(() => {
  const ENDPOINT='/api/admin/creative-project-operations';
  const state={data:null,projectId:0,editingOperationId:0,inventoryMatches:[]};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(v||0)||0;
  const mount=()=>document.getElementById('creativeOperations212Mount');
  const msg=(text,error=false)=>{const el=document.getElementById('creativeOperations212Message');if(el){el.textContent=text||'';el.style.color=error?'#ffb4b4':'';}};
  const apiFetch=(...args)=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(...args):fetch(...args);

  async function request(payload){
    const r=await apiFetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const d=await r.json().catch(()=>null);if(!r.ok||!d?.ok)throw new Error(d?.error||`Build 212 request failed (${r.status}).`);return d;
  }
  function operationById(id){return (state.data?.operations||[]).find(x=>num(x.creative_project_operation_id)===num(id))||null;}
  function processOptions(selected=0){return (state.data?.processes||[]).map(p=>`<option value="${num(p.inventory_process_id)}" ${num(p.inventory_process_id)===num(selected)?'selected':''}>${esc(p.process_name)}</option>`).join('');}
  function projectOptions(){
    const rows=state.data?.projects||[];
    return `<option value="">Choose a Creative Project…</option>${rows.map(p=>`<option value="${num(p.creative_work_project_id)}" ${num(p.creative_work_project_id)===state.projectId?'selected':''}>${esc(p.project_title||p.project_key)} — ${esc(p.project_status||'')}</option>`).join('')}`;
  }
  function operationSelectOptions(selected=0,exclude=0,earlierThan=Infinity){
    return `<option value="">Choose operation…</option>${(state.data?.operations||[]).filter(o=>num(o.creative_project_operation_id)!==num(exclude)&&num(o.operation_order)<earlierThan).map(o=>`<option value="${num(o.creative_project_operation_id)}" ${num(o.creative_project_operation_id)===num(selected)?'selected':''}>#${num(o.operation_order)} ${esc(o.operation_title||o.process_name)}</option>`).join('')}`;
  }
  function operationForm(){
    const op=operationById(state.editingOperationId)||{};
    return `<form id="creativeOperation212Form" class="card" style="margin:0">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap">
        <div><h3 style="margin:0">${state.editingOperationId?'Edit operation':'Add operation'}</h3><p class="small" style="margin:4px 0 0">Sequence is controlled separately; actual usage/time/evidence is not written here.</p></div>
        ${state.editingOperationId?'<button class="btn secondary" type="button" id="creativeOperation212New">New operation</button>':''}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:10px">
        <label class="small">Canonical process<select name="inventory_process_id" required><option value="">Choose process…</option>${processOptions(op.inventory_process_id)}</select></label>
        <label class="small">Operation title<input name="operation_title" maxlength="180" value="${esc(op.operation_title||'')}" placeholder="e.g. Laser-cut acrylic blank"></label>
        <label class="small">Plan status<select name="plan_status">
          ${['draft','planned','ready','blocked','retired'].map(v=>`<option value="${v}" ${String(op.plan_status||'planned')===v?'selected':''}>${v.replace(/_/g,' ')}</option>`).join('')}
        </select></label>
        <label class="small">Responsible workspace<input name="responsible_workspace" value="${esc(op.responsible_workspace||'')}" placeholder="Laser bench, resin station…"></label>
        <label class="small">Planned duration (minutes)<input name="planned_duration_minutes" type="number" min="0" step="1" value="${op.planned_duration_minutes??''}"></label>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;margin-top:10px">
        <label class="small">Planned setup<textarea name="planned_setup_notes" rows="3" placeholder="Fixtures, prep, machine setup…">${esc(op.planned_setup_notes||'')}</textarea></label>
        <label class="small">Output / evidence requirement<textarea name="output_evidence_requirement" rows="3" placeholder="What output or CAIP evidence should exist after this operation?">${esc(op.output_evidence_requirement||'')}</textarea></label>
        <label class="small">Planning notes<textarea name="notes" rows="3">${esc(op.notes||'')}</textarea></label>
      </div>
      <div style="margin-top:10px"><button class="btn primary" type="submit">${state.editingOperationId?'Save operation':'Add operation'}</button></div>
    </form>`;
  }
  function operationCards(){
    const ops=state.data?.operations||[],deps=state.data?.dependencies||[],res=state.data?.resources||[];
    if(!ops.length)return '<section class="card"><p class="small">No hybrid operation plan yet. Add the first canonical workshop process above.</p></section>';
    return ops.map((o,index)=>{
      const oid=num(o.creative_project_operation_id);
      const od=deps.filter(d=>num(d.creative_project_operation_id)===oid);
      const or=res.filter(r=>num(r.creative_project_operation_id)===oid);
      return `<article class="card" style="margin:0" data-operation-id="${oid}">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
          <div><p class="small" style="margin:0">Operation #${num(o.operation_order)} • ${esc(o.plan_status)}</p><h3 style="margin:3px 0">${esc(o.operation_title||o.process_name)}</h3><p class="small" style="margin:0"><strong>Process:</strong> ${esc(o.process_name)}${o.responsible_workspace?` • <strong>Workspace:</strong> ${esc(o.responsible_workspace)}`:''}${o.planned_duration_minutes!=null?` • <strong>Planned:</strong> ${num(o.planned_duration_minutes)} min`:''}</p></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn secondary" type="button" data-op-edit="${oid}">Edit</button>
            <button class="btn secondary" type="button" data-op-up="${oid}" ${index===0?'disabled':''}>↑</button>
            <button class="btn secondary" type="button" data-op-down="${oid}" ${index===ops.length-1?'disabled':''}>↓</button>
            <button class="btn secondary" type="button" data-op-retire="${oid}" ${o.plan_status==='retired'?'disabled':''}>Retire</button>
          </div>
        </div>
        ${o.planned_setup_notes?`<p class="small"><strong>Setup:</strong> ${esc(o.planned_setup_notes)}</p>`:''}
        ${o.output_evidence_requirement?`<p class="small"><strong>Output/evidence:</strong> ${esc(o.output_evidence_requirement)}</p>`:''}
        ${o.notes?`<p class="small"><strong>Notes:</strong> ${esc(o.notes)}</p>`:''}
        <div class="grid cols-2" style="gap:10px;margin-top:10px">
          <div><strong class="small">Dependencies</strong>${od.length?od.map(d=>{const pred=operationById(d.predecessor_operation_id);return `<div class="small" style="margin-top:5px">#${pred?.operation_order||'?'} ${esc(pred?.operation_title||pred?.process_name||'operation')} • ${esc(d.dependency_type)} <button class="btn secondary" type="button" data-dep-remove="${num(d.creative_project_operation_dependency_id)}">Remove</button></div>`;}).join(''):'<p class="small">None.</p>'}</div>
          <div><strong class="small">Planned materials / tools</strong>${or.length?or.map(r=>`<div class="small" style="margin-top:5px">${esc(r.resource_role)} • ${esc(r.item_name)}${r.planned_quantity!=null?` • ${esc(r.planned_quantity)} ${esc(r.planned_unit||r.usage_unit_label||'')}`:''} <button class="btn secondary" type="button" data-resource-remove="${num(r.creative_project_operation_resource_id)}">Remove</button></div>`).join(''):'<p class="small">None. Inventory remains unchanged.</p>'}</div>
        </div>
      </article>`;
    }).join('');
  }
  function dependencyForm(){
    const ops=state.data?.operations||[];
    return `<form id="creativeOperation212DependencyForm" class="card" style="margin:0">
      <h3 style="margin-top:0">Add operation dependency</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
        <label class="small">Operation<select name="creative_project_operation_id" required>${operationSelectOptions()}</select></label>
        <label class="small">Predecessor<select name="predecessor_operation_id" required>${operationSelectOptions()}</select></label>
        <label class="small">Dependency type<select name="dependency_type"><option value="finish_to_start">Finish to start</option><option value="review_before_start">Review before start</option><option value="material_output">Material/output dependency</option><option value="evidence_required">Evidence required</option></select></label>
        <label class="small">Notes<input name="dependency_notes" maxlength="800"></label>
      </div><button class="btn" type="submit" style="margin-top:10px" ${ops.length<2?'disabled':''}>Save dependency</button>
    </form>`;
  }
  function resourceForm(){
    const matches=state.inventoryMatches||[];
    return `<form id="creativeOperation212ResourceForm" class="card" style="margin:0">
      <h3 style="margin-top:0">Plan material / tool reference</h3>
      <p class="small">This is a planning reference only. Saving here never consumes, reserves or edits Inventory.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><input id="creativeOperation212InventorySearch" placeholder="Search Inventory by name or key" style="min-width:260px"><button class="btn secondary" id="creativeOperation212InventorySearchButton" type="button">Search Inventory</button></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;margin-top:10px">
        <label class="small">Operation<select name="creative_project_operation_id" required>${operationSelectOptions()}</select></label>
        <label class="small">Inventory item<select name="site_item_inventory_id" required><option value="">${matches.length?'Choose search result…':'Search Inventory first…'}</option>${matches.map(i=>`<option value="${num(i.site_item_inventory_id)}">${esc(i.item_name)} • ${esc(i.source_type||'item')}${i.assigned_process_name?` • ${esc(i.assigned_process_name)}`:''}</option>`).join('')}</select></label>
        <label class="small">Role<select name="resource_role"><option value="material">Material</option><option value="tool">Tool</option><option value="consumable">Consumable</option><option value="fixture">Fixture</option><option value="other">Other</option></select></label>
        <label class="small">Planned quantity<input name="planned_quantity" type="number" min="0" step="0.001"></label>
        <label class="small">Planned unit<input name="planned_unit" maxlength="80" placeholder="g, mL, piece, pass…"></label>
        <label class="small">Requirement notes<input name="requirement_notes" maxlength="800"></label>
      </div><button class="btn" type="submit" style="margin-top:10px">Save planned resource</button>
    </form>`;
  }
  function render(){
    const host=mount();if(!host)return;
    const project=state.data?.project||null;
    host.innerHTML=`<section class="card" style="margin-top:18px">
      <div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap">
        <div><p class="eyebrow">Release 467 • Build 212</p><h2 style="margin:0">Hybrid Creative Project operations</h2><p class="small">Ordered multi-process planning over the existing Creative Process project. Inventory, CAIP media, actual events and Finance remain separate authorities.</p></div>
      </div>
      <label class="small" style="display:block;margin-top:10px">Creative Project<select id="creativeOperations212Project">${projectOptions()}</select></label>
      <div id="creativeOperations212Message" class="small" role="status" aria-live="polite" style="margin-top:8px"></div>
      ${project?`<p class="small"><strong>Selected:</strong> ${esc(project.project_title||project.project_key)} • ${esc(project.project_type||'project')} • ${esc(project.project_status||'')}</p>`:''}
    </section>
    ${project?`<div style="display:grid;gap:14px;margin-top:14px">${operationForm()}<section><div style="display:grid;gap:12px">${operationCards()}</div></section><div class="grid cols-2" style="gap:14px">${dependencyForm()}${resourceForm()}</div></div>`:''}`;
    bind();
  }
  async function load(projectId=state.projectId,inventoryQ=''){
    try{
      const qs=new URLSearchParams();if(projectId)qs.set('project_id',projectId);if(inventoryQ)qs.set('inventory_q',inventoryQ);
      const r=await apiFetch(`${ENDPOINT}?${qs.toString()}`,{cache:'no-store'});const d=await r.json().catch(()=>null);
      if(!r.ok||!d?.ok)throw new Error(d?.error||`Build 212 load failed (${r.status}).`);
      state.data=d;state.projectId=num(d.project?.creative_work_project_id||projectId||0);state.inventoryMatches=d.inventory_matches||[];render();
      msg(projectId?'Hybrid operation plan loaded.':'Choose an existing Creative Project.');
    }catch(e){if(mount())mount().innerHTML=`<section class="card" style="margin-top:18px"><h2>Hybrid operations unavailable</h2><p class="small">${esc(e.message||e)}</p><button class="btn" id="creativeOperations212Retry" type="button">Retry</button></section>`;document.getElementById('creativeOperations212Retry')?.addEventListener('click',()=>load());}
  }
  async function save(payload){
    try{msg('Saving Build 212 planning evidence…');const d=await request({project_id:state.projectId,...payload});state.data={...state.data,...d};state.inventoryMatches=[];state.editingOperationId=0;render();msg(d.message||'Saved.');}
    catch(e){msg(e.message||'Save failed.',true);}
  }
  async function move(id,direction){
    const ids=(state.data?.operations||[]).map(o=>num(o.creative_project_operation_id));const from=ids.indexOf(num(id)),to=from+direction;if(from<0||to<0||to>=ids.length)return;
    [ids[from],ids[to]]=[ids[to],ids[from]];await save({action:'save_sequence',operation_ids:ids});
  }
  function bind(){
    document.getElementById('creativeOperations212Project')?.addEventListener('change',e=>{state.projectId=num(e.target.value);state.editingOperationId=0;state.inventoryMatches=[];load(state.projectId);});
    document.getElementById('creativeOperation212New')?.addEventListener('click',()=>{state.editingOperationId=0;render();});
    document.getElementById('creativeOperation212Form')?.addEventListener('submit',e=>{e.preventDefault();save({action:'save_operation',creative_project_operation_id:state.editingOperationId||null,...Object.fromEntries(new FormData(e.currentTarget).entries())});});
    document.querySelectorAll('[data-op-edit]').forEach(b=>b.addEventListener('click',()=>{state.editingOperationId=num(b.dataset.opEdit);render();document.getElementById('creativeOperation212Form')?.scrollIntoView({behavior:'smooth',block:'center'});}));
    document.querySelectorAll('[data-op-up]').forEach(b=>b.addEventListener('click',()=>move(b.dataset.opUp,-1)));
    document.querySelectorAll('[data-op-down]').forEach(b=>b.addEventListener('click',()=>move(b.dataset.opDown,1)));
    document.querySelectorAll('[data-op-retire]').forEach(b=>b.addEventListener('click',()=>save({action:'retire_operation',creative_project_operation_id:num(b.dataset.opRetire)})));
    document.getElementById('creativeOperation212DependencyForm')?.addEventListener('submit',e=>{e.preventDefault();const p=Object.fromEntries(new FormData(e.currentTarget).entries());const op=operationById(p.creative_project_operation_id),pred=operationById(p.predecessor_operation_id);if(!op||!pred||num(pred.operation_order)>=num(op.operation_order)){msg('Choose a predecessor that appears earlier in the operation sequence.',true);return;}save({action:'save_dependency',...p});});
    document.querySelectorAll('[data-dep-remove]').forEach(b=>b.addEventListener('click',()=>save({action:'remove_dependency',creative_project_operation_dependency_id:num(b.dataset.depRemove)})));
    document.getElementById('creativeOperation212InventorySearchButton')?.addEventListener('click',()=>{const q=document.getElementById('creativeOperation212InventorySearch')?.value||'';if(q.trim().length<2){msg('Enter at least two characters to search Inventory.',true);return;}load(state.projectId,q);});
    document.getElementById('creativeOperation212ResourceForm')?.addEventListener('submit',e=>{e.preventDefault();save({action:'save_resource',...Object.fromEntries(new FormData(e.currentTarget).entries())});});
    document.querySelectorAll('[data-resource-remove]').forEach(b=>b.addEventListener('click',()=>save({action:'remove_resource',creative_project_operation_resource_id:num(b.dataset.resourceRemove)})));
  }
  document.addEventListener('DOMContentLoaded',()=>load(num(new URLSearchParams(location.search).get('project_id')||0)));
})();
