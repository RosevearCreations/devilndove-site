// Build 381: UTC data authority with human-entered project/maintenance/deadline booking.
document.addEventListener('DOMContentLoaded',()=>{
 const $=id=>document.getElementById(id),root=$('calendarRecords'),api=(url,opt={})=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(url,opt):fetch(url,{credentials:'same-origin',...opt});
 if(!root)return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const utc=v=>{const ms=Date.parse(v);return Number.isFinite(ms)?new Date(ms).toISOString().slice(0,19)+'Z':null;};
 const local=utcValue=>{if(!utcValue)return '';const d=new Date(utcValue);if(!Number.isFinite(d.valueOf()))return '';const n=new Date(d.getTime()-d.getTimezoneOffset()*60000);return n.toISOString().slice(0,16);};
 const display=utcValue=>utcValue?new Date(utcValue).toLocaleString('en-CA',{dateStyle:'medium',timeStyle:'short'}):'—';
 let snapshot=null,key=null;
 const now=new Date(),tomorrow=new Date(now.getTime()+86400000);
 $('calendarFrom').value=local(now.toISOString());$('calendarTo').value=local(new Date(now.getTime()+14*86400000).toISOString());
 $('calendarStart').value=local(tomorrow.toISOString());$('calendarEnd').value=local(new Date(tomorrow.getTime()+3600000).toISOString());
 function fill(el,items,label,id){
  const previous=el.value;el.innerHTML='<option value="">'+esc(label)+'</option>'+
    items.map(x=>'<option value="'+Number(x[id])+'">'+esc(x.item_name||x.project_title||x.operation_title||'Unknown')+
      (x.role==='station'?' (workstation)':'')+'</option>').join('');
  if([...el.options].some(x=>x.value===previous))el.value=previous;
 }
 const sourceWindow=()=>{const from=utc($('calendarFrom').value),to=utc($('calendarTo').value);return {from,to}};
 function render(){
  if(!snapshot)return;
  const items=snapshot.events||[],resourceList=snapshot.resources||[];
  fill($('calendarResourceFilter'),resourceList,'All tools and workstations','site_item_inventory_id');
  fill($('calendarProjectFilter'),snapshot.projects||[],'All projects','creative_work_project_id');
  fill($('calendarResource'),resourceList,'Choose active tool','site_item_inventory_id');
  fill($('calendarProject'),snapshot.projects||[],'Choose project','creative_work_project_id');
  const warnings=(snapshot.events_truncated||snapshot.projects_truncated||snapshot.resources_truncated||snapshot.operations_truncated);
  root.innerHTML='<p><strong>'+items.length+'</strong> loaded calendar entries · '+items.filter(e=>e.entry_status==='active').length+' active · '+items.filter(e=>e.entry_kind==='maintenance'&&e.entry_status==='active').length+' active maintenance blocks.</p>'+
  '<p class="small">Calendar windows use the local device timezone when editing; storage and conflict evaluation use UTC. No conflicting entry is not proof of real-world availability.</p>'+
  (warnings?'<p><strong>Results are incomplete due to read limits.</strong> Narrow filters; do not infer resource availability.</p>':'')+
  '<div class="admin-table-wrap"><table><thead><tr><th>Time window</th><th>Resource / project</th><th>Booking</th><th>Status</th><th>Operator</th></tr></thead><tbody>'+
  (items.map(e=>'<tr><td>'+esc(display(e.starts_at_utc))+' – '+esc(display(e.ends_at_utc))+'</td><td>'+esc(e.resource_name||'No resource')+
   '<div>'+esc(e.project_title||'')+'</div></td><td><strong>'+esc(e.title)+'</strong><div class="small">'+esc(e.entry_kind)+
   (e.override_conflict?' · Manual conflict override':'')+(e.override_maintenance_ack?' · Maintenance acknowledged':'')+'</div></td><td>'+esc(e.entry_status)+'</td><td>'+
   (e.entry_status==='active'?'<button type="button" class="btn secondary" data-cancel="'+Number(e.creative_resource_calendar_entry_id)+'">Cancel entry</button>':'Cancelled '+esc(e.cancellation_reason||''))+
   '</td></tr>').join('')||'<tr><td colspan="5">No recorded calendar entries in this window.</td></tr>')+'</tbody></table></div>';
  root.querySelectorAll('[data-cancel]').forEach(b=>b.addEventListener('click',async()=>{
   const id=Number(b.dataset.cancel),note=prompt('Enter an accountable cancellation reason (at least 12 characters):');
   if(!note||note.trim().length<12)return;
   if(!confirm('Cancel this calendar entry and retain the historical record?'))return;
   try{const r=await api('/api/admin/project-resource-calendar',{method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({action:'cancel',entry_id:id,note:note.trim()})});const d=await r.json();
     if(!r.ok||!d.ok)throw Error(d.error||'Cancellation failed');await load();
   }catch(e){alert('Cancellation not confirmed: '+e.message);}
  }));
 }
 const entrySelects=()=>{const kind=$('calendarKind').value;
  const projectAllowed=kind==='project_booking'||kind==='project_deadline';
  const resourceAllowed=kind!=='project_deadline';
  $('calendarProject').disabled=!projectAllowed;$('calendarOperation').disabled=!projectAllowed;
  $('calendarResource').disabled=!resourceAllowed;
  if(!projectAllowed){$('calendarProject').value='';$('calendarOperation').innerHTML='<option value="">Project-wide</option>';}
  if(!resourceAllowed)$('calendarResource').value='';
 };
 $('calendarKind').addEventListener('change',entrySelects);
 $('calendarProject').addEventListener('change',()=>loadOperations());
 async function loadOperations(){
  const project=$('calendarProject').value,op=$('calendarOperation');op.innerHTML='<option value="">Project-wide</option>';
  if(!project)return;
  const {from,to}=sourceWindow();
  try{const q='?project_id='+encodeURIComponent(project)+'&from='+encodeURIComponent(from)+'&to='+encodeURIComponent(to);
   const r=await api('/api/admin/project-resource-calendar'+q);const d=await r.json();
   if(!r.ok||!d.ok)throw Error(d.error||'Cannot load project operations');
   fill(op,d.operations||[],'Project-wide','creative_project_operation_id');
   if(d.operations_truncated)$('calendarResult').textContent='This project exceeds 100 operations; choose a smaller work plan.';
  }catch(e){$('calendarResult').textContent=e.message;}
 }
 async function load(){
  const {from,to}=sourceWindow();
  if(!from||!to||from>=to){root.textContent='Enter a valid positive date/time range.';return;}
  root.textContent='Checking saved resource schedule…';
  const parts=['from='+encodeURIComponent(from),'to='+encodeURIComponent(to)];
  if($('calendarResourceFilter').value)parts.push('resource_id='+encodeURIComponent($('calendarResourceFilter').value));
  if($('calendarProjectFilter').value)parts.push('project_id='+encodeURIComponent($('calendarProjectFilter').value));
  try{const r=await api('/api/admin/project-resource-calendar?'+parts.join('&'),{cache:'no-store'});const d=await r.json();
   if(!r.ok||!d.ok)throw Error(d.error||'Read unavailable');snapshot=d;render();
  }catch(e){root.textContent='Calendar unavailable: '+e.message;}
 }
 $('calendarRefresh').addEventListener('click',load);
 $('calendarRecord').addEventListener('click',async()=>{
  const kind=$('calendarKind').value,start=utc($('calendarStart').value),end=utc($('calendarEnd').value),note=$('calendarNote').value.trim();
  const resource=Number($('calendarResource').value)||null,project=Number($('calendarProject').value)||null,operation=Number($('calendarOperation').value)||null;
  const body={action:'schedule',kind,resource_id:resource,project_id:project,operation_id:operation,
   starts_at_utc:start,ends_at_utc:end,title:$('calendarTitle').value.trim(),note,
   override_conflict:$('calendarOverride').checked,override_reason:$('calendarOverrideReason').value.trim(),
   override_maintenance_ack:$('calendarMaintenanceAck').checked,request_key:key||crypto.randomUUID()};
  if(note.length<12||!start||!end||start>=end){$('calendarResult').textContent='Enter a real start/end time and a meaningful operator note.';return;}
  if(!confirm('Save this booking in the authoritative resource calendar? Conflicting bookings require an explicit manual override.'))return;
  key=body.request_key;
  $('calendarRecord').disabled=true;$('calendarResult').textContent='Checking source conflicts and recording…';
  try{const response=await api('/api/admin/project-resource-calendar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   const d=await response.json();if(!response.ok||!d.ok)throw Error(d.error||'Booking was not recorded');
   key=null;$('calendarResult').textContent='Saved calendar entry #'+Number(d.entry_id)+'. Recorded conflicts: '+Number(d.recorded_conflicts||0)+'.';
   await load();
  }catch(e){$('calendarResult').textContent='Not confirmed: '+e.message;}
  finally{$('calendarRecord').disabled=false;}
 });
 entrySelects();load();
});
