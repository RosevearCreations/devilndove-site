// Build 379: manual, authenticated, append-only actions only.
document.addEventListener('DOMContentLoaded',()=>{
const $=id=>document.getElementById(id),root=$('woMount'),select=$('woProject');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const api=(url,opt={})=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(url,opt):fetch(url,{...opt,credentials:'same-origin'});
const states={not_started:['ready','blocked','cancelled'],ready:['in_progress','blocked','cancelled'],in_progress:['paused','blocked','completed'],paused:['in_progress','blocked','cancelled'],blocked:['ready','cancelled'],completed:[],cancelled:[]};
let data=null;
async function loadList(){try{const r=await api('/api/admin/project-work-orders');const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Read unavailable');select.innerHTML='<option value="">Choose project</option>'+d.projects.map(p=>'<option value="'+Number(p.creative_work_project_id)+'">'+esc(p.project_title)+'</option>').join('');if(d.projects_truncated)root.textContent='Project picker limited to first 100.';}catch(e){root.textContent=e.message;}}
function draw(){
const byId=new Map(data.operations.map(o=>[Number(o.creative_project_operation_id),o]));
root.innerHTML='<p><strong>'+esc(data.project.project_title)+'</strong> — '+data.operations.length+' real operation plans</p>'+
'<div class="admin-table-wrap"><table><thead><tr><th>Order / task</th><th>Status</th><th>Dependencies</th><th>Actual time</th></tr></thead><tbody>'+
data.operations.map(o=>'<tr><td>'+Number(o.operation_order)+'. '+esc(o.operation_title)+'</td><td>'+esc(o.status)+'</td><td>'+
(data.dependencies.filter(d=>Number(d.creative_project_operation_id)===Number(o.creative_project_operation_id)).map(d=>esc(byId.get(Number(d.predecessor_operation_id))?.operation_title||'Prior task')).join(', ')||'None')+
'</td><td>'+Number(o.actual_minutes)+' min / '+Number(o.milestone_count)+' evidence links</td></tr>').join('')+'</tbody></table></div>'+
'<p><a href="/admin/creative-process/?project_id='+Number(data.project.creative_work_project_id)+'">Edit operation sequence and dependencies in Creative Process</a></p>'+
'<div class="card"><h2>Record operator action</h2><label>Task <select id="woTask">'+data.operations.map(o=>'<option value="'+Number(o.creative_project_operation_id)+'">'+esc(o.operation_title)+'</option>').join('')+'</select></label>'+
'<label>Action <select id="woAction"><option value="transition">Change work status</option><option value="time">Log actual minutes</option><option value="milestone">Link real milestone event</option></select></label><div id="woInputs"></div>'+
'<label>Factual notes (12 or more characters) <textarea id="woNotes" rows="3"></textarea></label><button class="btn" id="woSave" type="button">Record operator action</button><p id="woMessage" role="status"></p></div>'+
'<h2>Recent audit history</h2>'+(data.history_has_more?'<p>Newest 100 shown; older records are retained.</p>':'')+
'<div class="admin-table-wrap"><table><thead><tr><th>Timestamp</th><th>Kind</th><th>Detail</th><th>Actor ID</th></tr></thead><tbody>'+
data.history.map(x=>'<tr><td>'+esc(x.created_at)+'</td><td>'+esc(x.event_kind)+'</td><td>'+esc(x.to_status||x.minutes_worked||x.creative_work_event_id)+' — '+esc(x.notes)+'</td><td>'+Number(x.actor_user_id)+'</td></tr>').join('')+'</tbody></table></div>';
const task=$('woTask'),action=$('woAction'),input=$('woInputs');
const fields=()=>{const o=byId.get(Number(task.value));input.innerHTML=action.value==='transition'?'<label>Next status <select id="woNext">'+(states[o?.status]||[]).map(s=>'<option value="'+s+'">'+s+'</option>').join('')+'</select></label>':action.value==='time'?'<label>Minutes (1–720) <input id="woMinutes" type="number" min="1" max="720" step="1"></label><label>Date worked <input id="woDate" type="date"></label>':'<label>Existing real Creative Process event ID <input id="woEvent" type="number" min="1"></label>';};
task.addEventListener('change',fields);action.addEventListener('change',fields);fields();
$('woSave').addEventListener('click',async()=>{
const o=byId.get(Number(task.value)),notes=$('woNotes').value.trim(),message=$('woMessage');
if(notes.length<12){message.textContent='Record at least 12 characters of factual notes.';return;}
const body={action:action.value,project_id:Number(data.project.creative_work_project_id),operation_id:Number(task.value),title:o.operation_title||'Operator work log',notes};
if(body.action==='transition'){body.expected_status=o.status;body.to_status=$('woNext').value;}
if(body.action==='time'){body.minutes=Number($('woMinutes').value);body.work_date=$('woDate').value;}
if(body.action==='milestone')body.creative_work_event_id=Number($('woEvent').value);
if(!confirm('Append this action permanently to the operator history?'))return;
$('woSave').disabled=true;message.textContent='Recording…';
try{const r=await api('/api/admin/project-work-orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Unconfirmed write');data=d;draw();$('woMessage').textContent='Recorded successfully';}catch(e){message.textContent='Not recorded: '+e.message;$('woSave').disabled=false;}
});
}
async function load(){if(!select.value){root.textContent='Choose a project.';return;}root.textContent='Loading authentic plan…';try{const r=await api('/api/admin/project-work-orders?project_id='+encodeURIComponent(select.value));const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Read unavailable');data=d;draw();}catch(e){root.textContent=e.message;}}
$('woRefresh').addEventListener('click',load);select.addEventListener('change',load);
const initial=new URLSearchParams(location.search).get('project_id');loadList().then(()=>{if(initial&&[...select.options].some(o=>o.value===initial)){select.value=initial;load();}});
});