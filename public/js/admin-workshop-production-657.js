/* Build 657: manual Creative Process inspection and private workshop decision.
 * No automatic data reads, source writes, stock/provider calls, or retries. */
(()=>{'use strict';
const API='/api/admin/workshop-production-657',$=id=>document.getElementById(id);
if(!$('dd657Form'))return;
let source=null,version=null,pendingKey=null,pendingProjectId=null,busy=false,uncertain=false;
const status=(t,k='')=>{const el=$('dd657Status');el.textContent=t;el.className=k;};
const add=(parent,tag,s)=>{const el=document.createElement(tag);el.textContent=s;parent.appendChild(el);return el;};
const clearPending=()=>{pendingKey=null;pendingProjectId=null;uncertain=false;$('dd657Check').disabled=true;};
const clearSource=()=>{source=null;version=null;$('dd657Save').disabled=true;
  $('dd657Event').replaceChildren();add($('dd657Event'),'option','No verified source loaded').value='0';
  $('dd657Outputs').replaceChildren();$('dd657History').replaceChildren();
  $('dd657Source').textContent='Original project source is not currently verified.';
  $('dd657Latest').textContent='No current owner review confirmed; all QA approval remains HOLD.';};
async function call(url,options){const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});
  const data=await response.json().catch(()=>({ok:false,error:'Private source response unreadable.'}));
  if(!response.ok||data.ok!==true)throw new Error(data.error||'Source evidence request failed.');return data;}
function showSource(data){clearSource();source=data;version=data.version;
  const p=data.project||{},ev=data.events||[],out=data.outputs||[],history=data.review_history||[];
  $('dd657Source').textContent='Original '+p.project_key+' — '+p.project_title+
    ' | canonical status: '+p.project_status+' | purpose/type: '+p.project_type+
    ' | source privacy: '+p.privacy_status+' | '+(data.total_events??0)+
    ' real active timeline events'+(data.event_list_truncated?' (only latest 40 selectable)':'')+
    '. Owner progress is separate and does not update this status.';
  const event=$('dd657Event');add(event,'option','None — only 0% / not reviewed').value='0';
  for(const e of ev){const opt=add(event,'option','#'+e.creative_work_event_id+' • '+e.event_type+
    ' • '+e.event_title+' • '+e.occurred_at);opt.value=String(e.creative_work_event_id);}
  for(const o of out)add($('dd657Outputs'),'li',(o.output_label||o.output_key)+
    ': '+o.output_status+' / approval '+o.approval_status+' (canonical; not changed here).');
  const latest=data.current_owner_review;
  $('dd657Latest').textContent=latest?'Latest local owner review: '+latest.stage+
    ', '+latest.progress_percent+'% estimated, QA '+latest.qa_decision+' (actor #'+latest.actor_user_id+
    ', '+latest.recorded_at+'). This does not independently certify readiness.':
    'No saved local workshop review; certification and progress remain UNKNOWN / HOLD.';
  for(const h of history)add($('dd657History'),'li',h.recorded_at+' • #'+h.receipt_id+
    ' • '+h.stage+' • '+h.progress_percent+'% estimated • QA '+h.qa_decision+
    ' • event '+h.source_event_id+' • '+h.review_note);
  $('dd657Save').disabled=false;
}
$('dd657LoadProjects').addEventListener('click',async()=>{
  if(busy)return;busy=true;$('dd657LoadProjects').disabled=true;clearSource();status('Reading live source project identities…');
  try{const d=await call(API),select=$('dd657Project'),selected=select.value;select.replaceChildren();
    add(select,'option','Choose a real Creative Project').value='';
    for(const p of d.projects||[]){const o=add(select,'option',p.project_title+' • '+p.project_key+
      ' • '+p.project_status+' • '+p.project_type);o.value=String(p.creative_work_project_id);}
    if((d.projects||[]).some(x=>String(x.creative_work_project_id)===selected))select.value=selected;
    $('dd657LoadSource').disabled=!select.value;
    status(pendingKey?'Project list loaded, but the original uncertain receipt still needs a deliberate check.':
      'Original source project list loaded. Select one and inspect its current details.',pendingKey?'hold':'success');}
  catch(e){$('dd657Project').replaceChildren();$('dd657LoadSource').disabled=true;
    status(e.message+' Source identity remains HOLD.','error');}
  finally{busy=false;$('dd657LoadProjects').disabled=false;}
});
$('dd657Project').addEventListener('change',()=>{clearSource();
  $('dd657LoadSource').disabled=!$('dd657Project').value;
  if(pendingKey){uncertain=true;status('Original request state uncertain. Check it before changing project or submitting.','hold');}
});
$('dd657LoadSource').addEventListener('click',async()=>{
  if(busy||!$('dd657Project').value)return;busy=true;$('dd657LoadSource').disabled=true;clearSource();
  status('Inspecting original project, recent events, outputs and private review history…');
  try{const data=await call(API+'?project_id='+encodeURIComponent($('dd657Project').value));
    showSource(data);clearPending();status('Genuine source loaded. All progress and QA decisions remain private owner attestations.','success');}
  catch(e){clearSource();status(e.message+' No stale review can be saved.','error');}
  finally{busy=false;$('dd657LoadSource').disabled=false;}
});
$('dd657Form').addEventListener('input',()=>{if(!busy&&pendingKey){uncertain=true;
  $('dd657Save').disabled=true;status('A prior save may have committed. Check the original receipt and reload before editing.','hold');}});
$('dd657Form').addEventListener('submit',async event=>{
  event.preventDefault();if(busy||uncertain||!source||version===null||!$('dd657Confirm').checked||!$('dd657Personal').checked)return;
  const when=new Date($('dd657Observed').value);if(Number.isNaN(when.getTime())){status('Enter a real observation time.','error');return;}
  const request={action:'record_review',project_id:Number(source.project.creative_work_project_id),
    expected_source_revision:source.source_revision,stage:$('dd657Stage').value,
    progress_percent:Number($('dd657Progress').value),purpose:$('dd657Purpose').value,
    qa_decision:$('dd657Qa').value,source_event_id:Number($('dd657Event').value),
    observed_at:when.toISOString(),review_note:$('dd657Note').value.trim(),
    personally_observed:$('dd657Personal').checked,owner_confirmation:$('dd657Confirm').checked,
    expected_version:version,request_key:pendingKey||crypto.randomUUID()};
  pendingKey=request.request_key;pendingProjectId=request.project_id;busy=true;$('dd657Save').disabled=true;$('dd657Check').disabled=false;
  status('Recording this exact private owner review once…');
  try{const data=await call(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)});
    status(data.warning||'Private workshop review saved. Source project status, inventory, Products, publication and completion certification were unchanged.','success');
    $('dd657Note').value='';$('dd657Confirm').checked=false;$('dd657Personal').checked=false;
    clearSource();clearPending();}
  catch(e){uncertain=true;status(e.message+' Inspect the original request key before any new attempt.','error');}
  finally{busy=false;$('dd657Save').disabled=uncertain||version===null;}
});
$('dd657Check').addEventListener('click',async()=>{
  if(!pendingKey||!pendingProjectId||busy)return;busy=true;$('dd657Check').disabled=true;
  try{const d=await call(API+'?project_id='+encodeURIComponent(pendingProjectId)+
    '&request_key='+encodeURIComponent(pendingKey));
    status(d.found?'Original receipt '+d.receipt.receipt_id+' exists. Explicitly reload the live project before any further review.':
      'No stored receipt was found in this project. Review current source before deciding whether to submit again.','hold');}
  catch(e){status(e.message+' Original request outcome remains unknown.','error');}
  finally{busy=false;$('dd657Check').disabled=!pendingKey;}
});
})();
