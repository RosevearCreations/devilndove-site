// Build 379: manual, authenticated, append-only actions only.
document.addEventListener('DOMContentLoaded',()=>{
const $=id=>document.getElementById(id),root=$('woMount'),select=$('woProject');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const api=(url,opt={})=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(url,opt):fetch(url,{...opt,credentials:'same-origin'});
const states={not_started:['ready','blocked','cancelled'],ready:['in_progress','blocked','cancelled'],in_progress:['paused','blocked','completed'],paused:['in_progress','blocked','cancelled'],blocked:['ready','cancelled'],completed:[],cancelled:[]};
let data=null,pending=null,taskFilter='all';
const minutesLabel=n=>Math.floor((Number(n)||0)/60)+'h '+((Number(n)||0)%60)+'m';
async function loadList(){try{const r=await api('/api/admin/project-work-orders');const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Read unavailable');select.innerHTML='<option value="">Choose project</option>'+d.projects.map(p=>'<option value="'+Number(p.creative_work_project_id)+'">'+esc(p.project_title)+'</option>').join('');if(d.projects_truncated)root.textContent='Project picker limited to first 100.';}catch(e){root.textContent=e.message;}}
function draw(){
const byId=new Map(data.operations.map(o=>[Number(o.creative_project_operation_id),o]));
root.innerHTML='<p><strong>'+esc(data.project.project_title)+'</strong> — '+data.operations.length+' real operation plans</p>'+
'<div class="wo662-authority" role="note"><h2>Worker roles &amp; handoff boundary</h2><p><strong>Only a verified Admin may access or record original work orders here.</strong> Actor IDs identify the recorder, not an assigned employee. Separate worker/customer access, distinct worker-device signoff and payroll are unverified and remain HOLD.</p><p>A handoff uses a documented <strong>pause</strong> by an authorized Admin and a reviewed <strong>resume</strong> by an authorized Admin. This records genuine source status and notes; it does not allocate a worker or approve labour costs. <a href="/admin/module-acceptance/">Review original worker-device checkpoints</a>.</p></div>'+
'<div class="wo662-summary"><span><strong>'+data.operations.length+'</strong> real tasks</span><span><strong>'+minutesLabel(data.operations.reduce((n,o)=>n+Number(o.actual_minutes||0),0))+'</strong> original time</span><span><strong>'+data.operations.filter(o=>["paused","blocked"].includes(o.status)).length+'</strong> paused / blocked</span></div>'+
'<label class="wo662-filter">Review task status <select id="woFilter"><option value="all">All original tasks</option><option value="handoff">Paused / blocked handoffs</option>'+Object.keys(states).map(x=>'<option value="'+x+'">'+x.replaceAll('_',' ')+'</option>').join('')+'</select></label>'+
'<div class="wo662-task-cards">'+data.operations.filter(o=>taskFilter==='all'||(taskFilter==='handoff'?['paused','blocked'].includes(o.status):o.status===taskFilter)).map(o=>'<article class="wo662-task"><h3>'+Number(o.operation_order)+'. '+esc(o.operation_title)+'</h3><p><strong>Source state:</strong> '+esc(o.status)+' <strong>Original minutes:</strong> '+minutesLabel(o.actual_minutes)+'</p><p><strong>Source milestones:</strong> '+Number(o.milestone_count)+'</p><button class="btn secondary wo662-select-task" type="button" data-operation="'+Number(o.creative_project_operation_id)+'">Use this original task</button></article>').join('')+'</div>'+
'<div class="admin-table-wrap wo662-desktop-table"><table><thead><tr><th>Order / task</th><th>Status</th><th>Dependencies</th><th>Actual time</th></tr></thead><tbody>'+
data.operations.map(o=>'<tr><td>'+Number(o.operation_order)+'. '+esc(o.operation_title)+'</td><td>'+esc(o.status)+'</td><td>'+
(data.dependencies.filter(d=>Number(d.creative_project_operation_id)===Number(o.creative_project_operation_id)).map(d=>esc(byId.get(Number(d.predecessor_operation_id))?.operation_title||'Prior task')).join(', ')||'None')+
'</td><td>'+Number(o.actual_minutes)+' min / '+Number(o.milestone_count)+' evidence links</td></tr>').join('')+'</tbody></table></div>'+
'<p><a href="/admin/creative-process/?project_id='+Number(data.project.creative_work_project_id)+'">Edit operation sequence and dependencies in Creative Process</a></p>'+
'<div class="card wo662-form"><h2>Record actual work / documented handoff</h2><p>Admin-only, append-only. To hand off, pause with factual notes. The receiving Admin reviews the notes and resumes the task. No worker assignment or payroll action occurs.</p><label>Task <select id="woTask">'+data.operations.map(o=>'<option value="'+Number(o.creative_project_operation_id)+'">'+esc(o.operation_title)+'</option>').join('')+'</select></label>'+
'<label>Action <select id="woAction"><option value="transition">Change work status</option><option value="time">Log actual minutes</option><option value="milestone">Link real milestone event</option></select></label><div id="woInputs"></div>'+
'<label>Factual notes (12 or more characters) <textarea id="woNotes" rows="4" placeholder="Describe real work, pause reason, next operator review. Do not enter customer or health information."></textarea></label><button class="btn" id="woSave" type="button">Record original action</button> <button class="btn secondary" id="woDiscard" type="button">Discard pending draft</button><p id="woMessage" role="status" aria-live="polite"></p></div>'+
'<h2>Original audit, time &amp; handoff history</h2><p>Actor is the authenticated Admin who entered an event, not proof of a distinct assigned worker.</p>'+(data.history_has_more?'<p>Newest 100 shown; older records are retained.</p>':'')+
'<div class="admin-table-wrap"><table><thead><tr><th>Timestamp</th><th>Kind</th><th>Detail</th><th>Actor ID</th></tr></thead><tbody>'+
data.history.map(x=>'<tr><td>'+esc(x.created_at)+'</td><td>'+esc(x.event_kind)+'</td><td>'+esc(x.to_status||x.minutes_worked||x.creative_work_event_id)+' — '+esc(x.notes)+'</td><td>'+Number(x.actor_user_id)+' ('+esc(x.actor_role||'role unknown')+')</td></tr>').join('')+'</tbody></table></div>';
const task=$('woTask'),action=$('woAction'),input=$('woInputs');
$('woFilter').value=taskFilter;$('woFilter').addEventListener('change',()=>{taskFilter=$('woFilter').value;draw();});
root.querySelectorAll('.wo662-select-task').forEach(b=>b.addEventListener('click',()=>{task.value=b.dataset.operation;fields();$('woNotes').focus();}));
$('woDiscard').addEventListener('click',()=>{pending=null;$('woSave').textContent='Record original action';$('woMessage').textContent='Draft discarded; original work history unchanged.';});
const fields=()=>{const o=byId.get(Number(task.value));input.innerHTML=action.value==='transition'?'<label>Next status <select id="woNext">'+(states[o?.status]||[]).map(s=>'<option value="'+s+'">'+s+'</option>').join('')+'</select></label>':action.value==='time'?'<label>Minutes (1–720) <input id="woMinutes" type="number" min="1" max="720" step="1"></label><label>Date worked <input id="woDate" type="date"></label>':'<label>Existing real Creative Process event ID <input id="woEvent" type="number" min="1"></label>';};
task.addEventListener('change',()=>{pending=null;fields();});action.addEventListener('change',()=>{pending=null;fields();});fields();
$('woSave').addEventListener('click',async()=>{
const o=byId.get(Number(task.value)),message=$('woMessage');
if(!pending){
 const notes=$('woNotes').value.trim();
 if(!o||notes.length<12){message.textContent='Record a real task and 12 or more characters of factual notes.';return;}
 const body={action:action.value,project_id:Number(data.project.creative_work_project_id),operation_id:Number(task.value),title:o.operation_title||'Operator work log',notes};
 if(body.action==='transition'){body.expected_status=o.status;body.to_status=$('woNext')?.value;if(!body.to_status){message.textContent='This task has no allowed next state.';return;}}
 if(body.action==='time'){body.minutes=Number($('woMinutes')?.value);body.work_date=$('woDate')?.value;if(!Number.isInteger(body.minutes)||body.minutes<1||body.minutes>720||!/^\d{4}-\d{2}-\d{2}$/.test(body.work_date||'')){message.textContent='Enter 1–720 actual whole minutes and a valid work date.';return;}}
 if(body.action==='milestone'){body.creative_work_event_id=Number($('woEvent')?.value);if(!Number.isSafeInteger(body.creative_work_event_id)||body.creative_work_event_id<1){message.textContent='Choose an existing same-project Creative Process event.';return;}}
 if(!globalThis.crypto?.randomUUID){message.textContent='Secure browser required to issue a unique original receipt key.';return;}
 body.request_key='wo662_'+crypto.randomUUID().replaceAll('-','');
 if(!confirm('Append this original action permanently? No stock, customer, payroll or staff-role changes.'))return;
 pending=body;
}
$('woSave').disabled=true;message.textContent='Submitting original receipt '+pending.request_key+'…';
try{
 const r=await api('/api/admin/project-work-orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pending)});
 const d=await r.json();
 if(!r.ok||!d.ok)throw Error((d.code?d.code+': ':'')+(d.error||'Unconfirmed original write'));
 const key=pending.request_key;pending=null;data=d;draw();
 $('woMessage').textContent='Saved with original receipt '+key+'. Refresh to verify.';
}catch(e){
 message.textContent='Not confirmed: '+e.message+'. Check original source and retry SAME receipt; never create a duplicate.';
 $('woSave').textContent='Retry same original receipt';$('woSave').disabled=false;
}
});
}
async function load(){pending=null;if(!select.value){root.textContent='Choose a project.';return;}root.textContent='Loading authentic plan…';try{const r=await api('/api/admin/project-work-orders?project_id='+encodeURIComponent(select.value));const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Read unavailable');data=d;draw();}catch(e){root.textContent=e.message;}}
$('woRefresh').addEventListener('click',load);select.addEventListener('change',load);
const initial=new URLSearchParams(location.search).get('project_id');loadList().then(()=>{if(initial&&[...select.options].some(o=>o.value===initial)){select.value=initial;load();}});
});