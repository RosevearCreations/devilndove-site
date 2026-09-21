// Release 467 Build 220 — Production Run, QA, Rework & Scrap Evidence.
document.addEventListener('DOMContentLoaded',()=>{
  const mount=document.getElementById('customWorkProductionRun220Mount');if(!mount)return;
  const apiFetch=(...args)=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(...args):fetch(...args);
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
  const val=(id)=>document.getElementById(id)?.value??'';
  const num=(id)=>{const v=val(id);return v===''?null:Number(v);};
  let state={choices:[],selected:null};
  const choiceLabel=(x)=>[x.request_key,x.project_title,x.product_interest,x.current_stage].filter(Boolean).join(' • ');
  const dt=(v)=>v?String(v).replace(' ','T').slice(0,16):'';
  function qaStatusOptions(){return '<option value="">Choose…</option><option value="pass">Pass</option><option value="rework">Rework</option><option value="fail">Fail</option><option value="not_applicable">Not applicable</option>';}
  function outcomeOptions(){return '<option value="not_run">Not run in this packet</option><option value="pass">Completed / pass</option><option value="rework">Completed / rework</option><option value="fail">Failed</option>';}
  function wire(){
    document.getElementById('run220Refresh')?.addEventListener('click',()=>load(state.selected?.lifecycle?.creative_project_manufacturing_lifecycle_id||''));
    document.getElementById('run220Lifecycle')?.addEventListener('change',(e)=>load(e.target.value));
    document.getElementById('run220Record')?.addEventListener('click',recordRun);
    mount.querySelectorAll('[data-run220-void]').forEach((button)=>button.addEventListener('click',()=>voidRun(button.dataset.run220Void)));
  }
  function render(){
    const s=state.selected,r=s?.readiness||{blockers:[],warnings:[]},source=s?.source||{},traveler=source.traveler||null;
    let html='<section class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><p class="eyebrow">Release 467 Build 220</p><h2>Production Run, QA, Rework &amp; Scrap Evidence</h2><p class="small">Record reviewed run outcomes against the exact Build 219 traveler used. Inventory postings, order records and Finance/Accounting remain owned by their existing workspaces; this surface records evidence and references only.</p></div><button class="btn secondary" id="run220Refresh" type="button">Refresh sources</button></div>';
    html+='<label class="small" for="run220Lifecycle">Manufacturing lifecycle / job</label><select id="run220Lifecycle"><option value="">Choose a production job…</option>'+state.choices.map((x)=>'<option value="'+esc(x.creative_project_manufacturing_lifecycle_id)+'" '+(s&&Number(s.lifecycle?.creative_project_manufacturing_lifecycle_id)===Number(x.creative_project_manufacturing_lifecycle_id)?'selected':'')+'>'+esc(choiceLabel(x))+'</option>').join('')+'</select>';
    if(!s){html+='<p class="small" style="margin-top:12px">Choose a production-authorized/run/QA lifecycle to review run evidence.</p></section>';mount.innerHTML=html;wire();return;}
    const status=r.blockers.length?'BLOCKED':r.warnings.length?'REVIEW':'READY';
    html+='<div class="card" style="margin-top:12px"><strong>Run evidence readiness: '+esc(status)+'</strong><p class="small"><strong>Lifecycle:</strong> '+esc(s.lifecycle.current_stage)+' • <strong>Project:</strong> '+esc(source.project?.project_title||source.project?.project_key||'Unknown')+'</p><p class="small"><strong>Traveler:</strong> '+(traveler?'v'+esc(traveler.version_number)+' • <code>'+esc(String(traveler.snapshot_sha256||'').slice(0,16))+'…</code>':'No reviewed traveler')+'</p></div>';
    if(r.blockers.length)html+='<div class="card" style="margin-top:12px"><h3>Blocking source facts</h3>'+r.blockers.map((x)=>'<p class="small">• '+esc(x)+'</p>').join('')+'</div>';
    if(r.warnings.length)html+='<div class="card" style="margin-top:12px"><h3>Review warnings</h3>'+r.warnings.map((x)=>'<p class="small">• '+esc(x)+'</p>').join('')+'</div>';

    html+='<section class="card" style="margin-top:12px"><h3>Run identity &amp; quantity outcome</h3><div class="grid cols-2" style="gap:10px"><label class="small">Run identifier<input id="run220Identifier" value="'+esc(s.suggested_run_identifier||'')+'"></label><label class="small">Planned quantity<input id="run220Planned" type="number" min="0" step="0.001" value="'+esc(s.suggested_planned_quantity??'')+'"></label><label class="small">Actual quantity<input id="run220Actual" type="number" min="0" step="0.001"></label><label class="small">Accepted quantity<input id="run220Accepted" type="number" min="0" step="0.001" value="0"></label><label class="small">Rework quantity<input id="run220Rework" type="number" min="0" step="0.001" value="0"></label><label class="small">Scrap / failure quantity<input id="run220Scrap" type="number" min="0" step="0.001" value="0"></label><label class="small">Run started<input id="run220Started" type="datetime-local"></label><label class="small">Run completed<input id="run220Completed" type="datetime-local"></label></div><label class="small">Reasoned deviations<textarea id="run220Deviation" rows="3" placeholder="Required when rework/scrap exists or actual quantity is not fully reconciled."></textarea></label></section>';

    html+='<section class="card" style="margin-top:12px"><h3>Operation timestamps, outcomes &amp; checkpoints</h3><p class="small">Each current Creative Project operation is represented. Mark operations not performed in this run as “Not run in this packet”; performed operations require start/completion timestamps.</p>'+(source.operations||[]).map((op)=>'<div class="card" data-run220-operation="'+esc(op.creative_project_operation_id)+'" style="margin-top:10px"><strong>'+esc(op.operation_order)+'. '+esc(op.operation_title||op.process_name)+'</strong><p class="small">'+esc(op.process_name||'')+' • '+esc(op.plan_status||'')+'</p><div class="grid cols-2" style="gap:8px"><label class="small">Outcome<select data-op-outcome>'+outcomeOptions()+'</select></label><label class="small">Started<input data-op-start type="datetime-local"></label><label class="small">Completed<input data-op-end type="datetime-local"></label><label class="small">Checkpoint note<input data-op-checkpoint placeholder="'+esc(op.output_evidence_requirement||'Observed output / checkpoint')+'"></label></div><label class="small">Deviation / rework reason<textarea data-op-deviation rows="2"></textarea></label></div>').join('')+'</section>';

    html+='<section class="card" style="margin-top:12px"><h3>QA checkpoints</h3><p class="small">Statuses are deliberately blank until a reviewer records the observed result.</p>'+(s.qa_templates||[]).map((q)=>'<div class="card" data-run220-qa="'+esc(q.checkpoint_key)+'" data-operation-id="'+esc(q.creative_project_operation_id||'')+'" style="margin-top:8px"><strong>'+esc(q.checkpoint_label)+'</strong><p class="small">Authority: '+esc(q.authority||'reviewed source')+'</p><div class="grid cols-2" style="gap:8px"><label class="small">QA status<select data-qa-status>'+qaStatusOptions()+'</select></label><label class="small">Observed result<input data-qa-note placeholder="Observation, measurement or reason"></label></div></div>').join('')+'</section>';

    const posts=source.material_posts||[];
    html+='<section class="card" style="margin-top:12px"><h3>Actual material usage reconciliation</h3><p class="small">Select only existing Inventory-owned Creative postings that belong to this run. Build 220 does not create, edit or reverse Inventory movements.</p>'+(posts.length?posts.map((p)=>'<label class="small" style="display:block;margin:7px 0"><input type="checkbox" data-run220-material="'+esc(p.creative_project_inventory_post_id)+'"> <strong>'+esc(p.item_name||('Inventory '+p.site_item_inventory_id))+'</strong> — '+esc(p.usage_quantity_consumed??p.stock_quantity_consumed??'Unknown')+' '+esc(p.posted_usage_unit_label||p.usage_unit_label||p.stock_unit_label||'unit')+' • post '+esc(p.creative_project_inventory_post_id)+'</label>').join(''):'<p class="small">No active Inventory-owned Creative material postings are currently available.</p>')+'<label class="small">Material reconciliation note<textarea id="run220MaterialNote" rows="3" placeholder="Which postings belong to this run, or why no Inventory posting applies yet?"></textarea></label></section>';

    const draft=source.order_draft,order=source.order;
    html+='<section class="card" style="margin-top:12px"><h3>Finished inventory / order handoff evidence</h3><p class="small">Reference an existing handoff target only. No Inventory receipt, order conversion, fulfillment or payment action is executed here.</p><div class="grid cols-2" style="gap:8px"><label class="small">Handoff kind<select id="run220HandoffKind"><option value="pending">Pending</option><option value="custom_order_draft" '+(draft?'selected':'')+'>Custom Work order draft</option><option value="order" '+(!draft&&order?'selected':'')+'>Order</option><option value="inventory">Finished Inventory item</option><option value="other">Other reviewed handoff</option></select></label><label class="small">Inventory item ID<input id="run220HandoffInventory" type="number" min="1"></label><label class="small">Order draft ID<input id="run220HandoffDraft" type="number" min="1" value="'+esc(draft?.custom_request_order_draft_id||'')+'"></label><label class="small">Order ID<input id="run220HandoffOrder" type="number" min="1" value="'+esc(order?.order_id||draft?.order_id||'')+'"></label></div><label class="small">Handoff evidence note<textarea id="run220HandoffNote" rows="3" placeholder="What is the resulting handoff state, or why is it still pending?"></textarea></label></section>';

    html+='<section class="card" style="margin-top:12px"><h3>Review &amp; record run evidence</h3><label class="small">Review note<textarea id="run220ReviewNote" rows="3" placeholder="What was reviewed before this run packet was frozen?"></textarea></label><button class="btn primary" id="run220Record" type="button" '+(r.blockers.length?'disabled':'')+'>Record reviewed production run</button><p class="small" id="run220Message" aria-live="polite">Corrections are void-and-replace. Inventory, order and Finance/Accounting source records are never rewritten here.</p></section>';

    if((s.run_history||[]).length)html+='<section class="card" style="margin-top:12px"><h3>Reviewed run history</h3>'+(s.run_history||[]).map((x)=>'<div style="padding:9px 0;border-bottom:1px solid var(--border)"><strong>#'+esc(x.run_sequence)+' '+esc(x.run_identifier)+'</strong> • '+esc(x.run_status)+'<p class="small">Actual '+esc(x.actual_quantity)+' • accepted '+esc(x.accepted_quantity)+' • rework '+esc(x.rework_quantity)+' • scrap/failure '+esc(x.scrap_quantity)+' • QA '+esc(x.qa_check_count)+' • material links '+esc(x.material_evidence_count)+' • handoff '+esc(x.handoff_kind||'pending')+'</p>'+(String(x.run_status)!=='void'?'<button class="btn secondary small" type="button" data-run220-void="'+esc(x.creative_project_production_run_id)+'">Void reviewed run</button>':'<p class="small">Void reason: '+esc(x.void_reason||'')+'</p>')+'</div>').join('')+'</section>';
    html+='</section>';mount.innerHTML=html;wire();
  }
  function gatherOperations(){
    return [...mount.querySelectorAll('[data-run220-operation]')].map((row)=>({
      creative_project_operation_id:Number(row.dataset.run220Operation),
      operation_outcome:row.querySelector('[data-op-outcome]')?.value||'not_run',
      started_at:row.querySelector('[data-op-start]')?.value||null,
      completed_at:row.querySelector('[data-op-end]')?.value||null,
      checkpoint_note:row.querySelector('[data-op-checkpoint]')?.value||'',
      deviation_note:row.querySelector('[data-op-deviation]')?.value||''
    }));
  }
  function gatherQa(){
    return [...mount.querySelectorAll('[data-run220-qa]')].map((row)=>({
      checkpoint_key:row.dataset.run220Qa,
      creative_project_operation_id:Number(row.dataset.operationId||0)||null,
      qa_status:row.querySelector('[data-qa-status]')?.value||'',
      observed_result:row.querySelector('[data-qa-note]')?.value||''
    }));
  }
  async function recordRun(){
    const msg=document.getElementById('run220Message');if(!state.selected)return;
    const body={
      action:'record_run',lifecycle_id:state.selected.lifecycle.creative_project_manufacturing_lifecycle_id,
      run_identifier:val('run220Identifier'),planned_quantity:num('run220Planned'),actual_quantity:num('run220Actual'),accepted_quantity:num('run220Accepted'),rework_quantity:num('run220Rework'),scrap_quantity:num('run220Scrap'),
      started_at:val('run220Started')||null,completed_at:val('run220Completed')||null,deviation_summary:val('run220Deviation'),
      operations:gatherOperations(),qa_checks:gatherQa(),
      material_post_ids:[...mount.querySelectorAll('[data-run220-material]:checked')].map((x)=>Number(x.dataset.run220Material)),
      material_reconciliation_note:val('run220MaterialNote'),
      handoff:{kind:val('run220HandoffKind'),site_item_inventory_id:num('run220HandoffInventory'),custom_request_order_draft_id:num('run220HandoffDraft'),order_id:num('run220HandoffOrder'),evidence_note:val('run220HandoffNote')},
      review_note:val('run220ReviewNote')
    };
    try{
      msg.textContent='Recording reviewed run evidence…';
      const response=await apiFetch('/api/admin/production-run-evidence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||'Run evidence save failed.');
      state={choices:data.lifecycle_choices||state.choices,selected:data.selected||null};render();
      document.getElementById('run220Message').textContent=data.message||'Reviewed run evidence recorded.';
    }catch(error){msg.textContent=String(error.message||error);}
  }
  async function voidRun(runId){
    if(!state.selected)return;
    const reason=window.prompt('Why should this reviewed run evidence be voided? The Inventory/order/Finance source records will not be changed.','');
    if(!reason)return;
    try{
      const response=await apiFetch('/api/admin/production-run-evidence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'void_run',creative_project_production_run_id:Number(runId),lifecycle_id:state.selected.lifecycle.creative_project_manufacturing_lifecycle_id,void_reason:reason})});
      const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||'Void failed.');
      state={choices:data.lifecycle_choices||state.choices,selected:data.selected||null};render();
    }catch(error){window.alert(String(error.message||error));}
  }
  async function load(lifecycleId=''){
    mount.innerHTML='<section class="card"><p class="small">Loading Build 220 production-run evidence sources…</p></section>';
    try{
      const suffix=lifecycleId?'?lifecycle_id='+encodeURIComponent(lifecycleId):'';
      const response=await apiFetch('/api/admin/production-run-evidence'+suffix,{cache:'no-store'}),body=await response.json();
      if(!response.ok||!body.ok)throw new Error(body.error||'Production-run evidence authority failed.');
      state={choices:body.lifecycle_choices||[],selected:body.selected||null};render();
    }catch(error){mount.innerHTML='<section class="card"><h2>Production-run evidence unavailable</h2><p class="small">'+esc(error.message||error)+'</p></section>';}
  }
  void load();
});
