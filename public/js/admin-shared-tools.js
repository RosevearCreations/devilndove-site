// Release 467 Build 448 — reviewed, human-owned shared Tool scheduling and checks.
document.addEventListener('DOMContentLoaded',()=>{
 const $=id=>document.getElementById(id);
 const api=(url,opts={})=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(url,opts):fetch(url,{credentials:'same-origin',...opts});
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const key=()=>Array.from(crypto.getRandomValues(new Uint8Array(18)),x=>x.toString(16).padStart(2,'0')).join('');
 const utc=v=>{const d=new Date(v);return Number.isFinite(d.getTime())?d.toISOString().slice(0,19)+'Z':null};
 const local=d=>{const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,16)};
 const opt=(v,label)=>'<option value="'+esc(v)+'">'+esc(label)+'</option>';
 const post=(endpoint,body)=>api(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 async function read(response){const data=await response.json();if(!response.ok||!data.ok)throw Error((data.code?data.code+': ':'')+(data.error||'Action not confirmed.'));return data}
 let data=null,reviewKey=key(),bookingFingerprint='',reviewKeys=new Map(),checkKey=null,booked=false;
 const status=(target,message,error=false)=>{target.textContent=message;target.className=error?'st-danger':'st-good'};
 const current=()=>({tool_id:Number($('stTool').value||0),project_id:Number($('stProject').value||0),starts_at_utc:utc($('stFrom').value),ends_at_utc:utc($('stTo').value)});
 const fingerprint=()=>JSON.stringify(current());
 function invalidate(){if(bookingFingerprint!==fingerprint()){reviewKey=key();reviewKeys=new Map();bookingFingerprint=fingerprint();booked=false;data=null;$('stConflicts').textContent='Window changed. Check conflicts again; earlier approvals only apply to the prior exact window.';$('stDecisionActions').innerHTML='';}}
 function fill(el,items,id,label){const old=el.value;el.innerHTML='<option value="">Choose '+label+'…</option>'+items.map(t=>opt(t[id],t.item_name||t.project_title)).join('');if([...el.options].some(o=>o.value===old))el.value=old;}
 function toolTruth(){const t=data?.selected_tool;if(!t){$('stToolTruth').innerHTML='<p>Choose an active Tool to see verified Inventory, workstation and lifecycle links.</p>';return;}
  const issues=data.tool_blocker;
  $('stToolTruth').innerHTML='<div class="st-grid"><p><strong>Tool:</strong> '+esc(t.item_name)+' #'+t.site_item_inventory_id+'</p><p><strong>Shared workstations:</strong> '+esc(t.workstation_names||'None assigned')+'</p><p><strong>Current recorded location:</strong> '+esc(t.current_location_name||'Not recorded')+'</p><p><strong>Lifecycle:</strong> '+esc(t.lifecycle_status||'No lifecycle review')+' / '+esc(t.condition_status||'unverified')+'</p><p><strong>Next service:</strong> '+esc(t.next_service_at||'Unknown')+'</p><p><strong>Last human check:</strong> '+esc(t.latest_check_result||'NONE')+' '+esc(t.latest_check_at||'')+'</p></div>'+
  '<p class="'+(issues?'st-danger':'st-good')+'">'+esc(issues||'No recorded equipment block. Physical availability and safety are not certified.')+'</p>';
  $('stSafetyHistory').innerHTML='<h3>Historical checks</h3><div class="st-table"><table><thead><tr><th>Date</th><th>Check</th><th>Outcome</th><th>Actual note</th></tr></thead><tbody>'+((data.checks||[]).map(c=>'<tr><td>'+esc(c.created_at)+'</td><td>'+esc(c.check_kind)+'</td><td>'+esc(c.result)+'</td><td>'+esc(c.check_note)+'</td></tr>').join('')||'<tr><td colspan="4">No check has been recorded. We cannot infer a pass.</td></tr>')+'</tbody></table></div>';
 }
 function conflicts(){const list=data?.conflicts||[],hard=list.filter(c=>c.entry_kind==='maintenance'||c.entry_kind==='resource_hold'),project=list.filter(c=>c.entry_kind==='project_booking');
  const approved=new Set(data?.approvals||[]);
  $('stConflicts').innerHTML='<h3>Exact recorded overlaps: '+list.length+'</h3>'+
   (data?.conflicts_truncated?'<p class="st-danger">More than 30 conflicts! Narrow the interval; no booking can be certified.</p>':'')+
   (hard.length?'<p class="st-danger">Maintenance/hold is present. We must reschedule, never override this block.</p>':'')+
   (!list.length?'<p>No recorded overlap. This does not prove physical availability or safety.</p>':'')+
   '<div class="st-table"><table><thead><tr><th>Calendar ID</th><th>Kind</th><th>Project</th><th>UTC window</th><th>Decision</th></tr></thead><tbody>'+list.map(e=>'<tr><td>#'+e.creative_resource_calendar_entry_id+'</td><td>'+esc(e.entry_kind)+'</td><td>'+esc(e.project_title||'Maintenance / hold')+'</td><td>'+esc(e.starts_at_utc)+' → '+esc(e.ends_at_utc)+'</td><td>'+(
    approved.has(e.creative_resource_calendar_entry_id)?'<span class="st-good">Exact owner approval recorded</span>':hard.includes(e)?'<span class="st-danger">Hard block</span>':'Decision required')+'</td></tr>').join('')+'</tbody></table></div>';
  $('stDecisionActions').innerHTML=project.map(e=>'<p>Existing project booking <strong>#'+e.creative_resource_calendar_entry_id+'</strong>: <button type="button" data-review="'+e.creative_resource_calendar_entry_id+'"'+(approved.has(e.creative_resource_calendar_entry_id)?' disabled':'')+'>Record explicit overlap approval</button></p>').join('')||'<p>No overlapping project booking requires approval in the checked window.</p>';
  $('stDecisionActions').querySelectorAll('[data-review]').forEach(b=>b.addEventListener('click',()=>approve(Number(b.dataset.review),b)));
 }
 async function load(refreshChoices=false){const p=current(),query=new URLSearchParams();if(p.tool_id)query.set('tool_id',String(p.tool_id));if(p.project_id)query.set('project_id',String(p.project_id));
  if(p.tool_id&&p.starts_at_utc&&p.ends_at_utc&&p.starts_at_utc<p.ends_at_utc){query.set('starts_at_utc',p.starts_at_utc);query.set('ends_at_utc',p.ends_at_utc);query.set('calendar_request_key',reviewKey)}
  try{const result=await read(await api('/api/admin/shared-tool-readiness?'+query,{cache:'no-store'}));data=result;
   if(refreshChoices){fill($('stTool'),result.tools||[],'site_item_inventory_id','Tool');fill($('stProject'),result.projects||[],'creative_work_project_id','project');}
   toolTruth();conflicts();status($('stStatus'),result.selected_tool?'Verified '+result.selected_tool.item_name+'.':'Select a Tool and project to begin.');
   if(result.tools_truncated||result.projects_truncated)status($('stStatus'),'Selection limited; not all Tool or project IDs are visible.',true);
  }catch(e){status($('stStatus'),'Read failed: '+e.message,true);$('stToolTruth').textContent='Read unavailable. No availability or safety may be inferred.';}
 }
 async function approve(conflictingId,button){const p=current(),note=$('stConflictNote').value.trim();
  if(!p.tool_id||!p.project_id||!p.starts_at_utc||!p.ends_at_utc||note.length<20){status($('stDecisionStatus'),'Choose the Tool/project/time and provide at least 20 characters of true human review notes.',true);return;}
  if(!confirm('Record your accountable approval for this exact conflicting calendar booking? This review is permanent.'))return;
  const payload={action:'review_conflict',...p,conflicting_entry_id:conflictingId,calendar_request_key:reviewKey,decision:'approved_overlap',note};
  const finger=JSON.stringify(payload),saved=reviewKeys.get(conflictingId);payload.request_key=saved?.finger===finger?saved.key:key();reviewKeys.set(conflictingId,{finger,key:payload.request_key});
  button.disabled=true;status($('stDecisionStatus'),'Saving original exact-conflict review…');
  try{const out=await read(await post('/api/admin/shared-tool-readiness',payload));reviewKeys.delete(conflictingId);status($('stDecisionStatus'),(out.replayed?'Original':'New')+' exact conflict decision verified (#'+out.receipt_id+').');await load();}
  catch(e){status($('stDecisionStatus'),'Decision not confirmed: '+e.message+' Refresh before retrying; request key preserved.',true);button.disabled=false;}
 }
 async function safetyCheck(event){event.preventDefault();const p=current(),form=$('stSafetyForm'),values=Object.fromEntries(new FormData(form).entries());
  const body={action:'safety_check',tool_id:p.tool_id,project_id:p.project_id||null,...values};
  if(!p.tool_id||!values.check_kind||!values.result||(values.note||'').trim().length<12){status($('stSafetyStatus'),'Choose a Tool, actual check, explicit outcome and factual notes.',true);return;}
  const finger=JSON.stringify(body);body.request_key=checkKey?.finger===finger?checkKey.key:key();checkKey={finger,key:body.request_key};
  if(!confirm('Record this actual inspection outcome permanently? It will not change lifecycle or Inventory.'))return;
  const button=form.querySelector('button[type=submit]');button.disabled=true;
  try{const result=await read(await post('/api/admin/shared-tool-readiness',body));checkKey=null;form.reset();status($('stSafetyStatus'),'Human check #'+result.receipt_id+' verified. It is evidence, not an automatic maintenance release.');await load();}
  catch(e){status($('stSafetyStatus'),'Check not confirmed: '+e.message+'. Refresh before retrying; request key preserved.',true)}
  finally{button.disabled=false;}
 }
 async function book(){const p=current(),note=$('stBookingNote').value.trim(),title=$('stTitle').value.trim(),list=data?.conflicts||[],approvals=new Set(data?.approvals||[]);
  if(!p.tool_id||!p.project_id||!p.starts_at_utc||!p.ends_at_utc||p.starts_at_utc>=p.ends_at_utc||note.length<20||title.length<3){status($('stBookingStatus'),'Choose tool, project, valid window, descriptive title and at least 20 characters of accountable booking notes.',true);return;}
  if(!data||bookingFingerprint!==fingerprint()){status($('stBookingStatus'),'Refresh the exact window before booking.',true);return;}
  if(data.tool_blocker||data.conflicts_truncated||list.some(c=>['maintenance','resource_hold'].includes(c.entry_kind))||list.some(c=>c.entry_kind==='project_booking'&&!approvals.has(c.creative_resource_calendar_entry_id))){status($('stBookingStatus'),'Source equipment block or unapproved calendar collision. Booking is not permitted.',true);return;}
  if(!confirm('Create a canonical calendar booking for this exact Tool, project and UTC window? No machine will start.'))return;
  const body={action:'schedule',kind:'project_booking',resource_id:p.tool_id,project_id:p.project_id,operation_id:null,
   starts_at_utc:p.starts_at_utc,ends_at_utc:p.ends_at_utc,title,note,override_conflict:list.length>0,
   override_reason:list.length?note:'',override_maintenance_ack:false,request_key:reviewKey};
  const b=$('stBook');b.disabled=true;status($('stBookingStatus'),'Saving independently reviewed canonical calendar booking…');
  try{const response=await read(await post('/api/admin/project-resource-calendar',body));status($('stBookingStatus'),'Calendar booking #'+response.entry_id+' verified! Tool is not physically certified.');booked=true;reviewKey=key();reviewKeys.clear();await load();}
  catch(e){status($('stBookingStatus'),'Booking NOT confirmed: '+e.message+'. Preserve this request key and check the calendar first.',true)}
  finally{b.disabled=false;}
 }
 const tomorrow=new Date(Date.now()+86400000);$('stFrom').value=local(tomorrow);$('stTo').value=local(new Date(tomorrow.getTime()+3600000));bookingFingerprint=fingerprint();
 ['stTool','stProject','stFrom','stTo'].forEach(name=>$(name).addEventListener('change',()=>{invalidate();load()}));
 $('stReload').addEventListener('click',()=>load(true));$('stPreview').addEventListener('click',()=>{invalidate();load()});$('stSafetyForm').addEventListener('submit',safetyCheck);$('stBook').addEventListener('click',book);
 load(true);
});
