/* Build 749: click-only private care queue, owner Firefox acknowledgment and follow-up receipts.
 * Nothing is read until the verified Admin clicks. No customer contact, provider, order or financial actions.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id),API='/api/admin/customer-care-queue-749';
if(!$('a749Load'))return;
let data=null,pendingKey=null,busy=false,selectedTask=null;
const say=(id,t)=>{const el=$(id);if(el)el.textContent=String(t??'');};
const failure=e=>String(e?.message||'Original private record unavailable').slice(0,210);
const item=(parent,message)=>{
 const li=document.createElement('li');li.textContent=String(message);parent.append(li);return li;
};
function buttons(disabled){
 busy=disabled;
 for(const id of ['a749Load','a749Find','a749OpenSave','a749ProgressSave','a749AssignSave',
  'a749ReviewSave','a749ReopenSave','a749AckSave'])if($(id))$(id).disabled=disabled;
}
async function query(method,body=null,taskId=null){
 const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),9000);
 try{
  const u=new URL(API,location.origin);
  if(method==='GET'&&taskId)u.searchParams.set('task_id',taskId);
  if(method==='GET'&&!taskId){
   const id=$('a749Filter').value.trim();
   if(id)u.searchParams.set('order_id',id);
  }
  const opt={method,credentials:'same-origin',cache:'no-store',
   headers:{Accept:'application/json'},signal:ctrl.signal};
  if(method==='POST'){opt.headers['Content-Type']='application/json';opt.body=JSON.stringify(body);}
  const res=await fetch(u.pathname+u.search,opt);
  const json=await res.json().catch(()=>({error:'Original source returned unreadable JSON'}));
  if(!res.ok||!json.ok)throw Error((json.code?json.code+': ':'')+(json.error||'HTTP '+res.status));
  return json;
 }finally{clearTimeout(timeout);}
}
function statusColorText(task){
 return task.state+(task.overdue?' · OVERDUE '+Math.abs(task.days_until_due)+' day(s)':
  task.due_soon?' · due soon':'');
}
function render(){
 if(!data)return;
 const q=data.queue,ff=data.firefox;
 say('a749Summary','UTC '+q.today_utc+' · '+q.total+' original work items · '+
  q.overdue+' overdue · '+q.due_soon+' due soon · '+q.held+' held. '+
  'The list does not independently recheck every original Order until a task is opened.');
 say('a749FirefoxStatus',ff.state+'. Original 748 source observation: '+
  (ff.source_observation_id||'none')+' · independent review: '+
  (ff.source_review_id||'none')+'. Physical device remains client-reported, not independently certified.');
 const list=$('a749Rows');list.replaceChildren();
 if(!q.tasks.length)item(list,'No original private queue entries yet. No customer case was fabricated.');
 for(const t of q.tasks){
  const row=document.createElement('li');
  const label=document.createElement('span');
  label.textContent='Order '+t.order_id+' · '+t.case_type+' · '+t.priority.toUpperCase()+
   ' · due '+t.due_date+' · assignee Admin #'+t.assignee_user_id+
   ' · '+statusColorText(t)+' · '+t.task_id+' ';
  row.append(label);
  const btn=document.createElement('button');
  btn.type='button';btn.textContent='Inspect original source';btn.addEventListener('click',()=>void load(t.task_id));
  row.append(btn);list.append(row);
 }
 const receipts=$('a749History');receipts.replaceChildren();
 for(const x of data.receipts.slice(0,35))
  item(receipts,x.id+' · '+x.kind+' · '+x.decision+' · Admin #'+x.actor_user_id+
   ' · '+(x.order_id?'Order '+x.order_id:'Firefox evidence')+' · '+x.recorded_at);
 if(data.selected_task){
  const t=data.selected_task;selectedTask=t.task_id;
  say('a749TaskStatus','Original task '+t.task_id+' · '+t.state+' · '+t.source_check+
   ' · due '+t.due_date+' · current Admin assignee #'+t.assignee_user_id+
   '. No customer or provider outcome verified.');
  for(const id of ['a749ProgressId','a749AssignId','a749ReviewId','a749ReopenId'])
   if($(id))$(id).value=t.task_id;
 }else{
  selectedTask=null;
  say('a749TaskStatus','Select Inspect original source on a queue item to verify the canonical Order and Build 746 source before reviewing.');
 }
 if(data.viewer_admin_user_id&&!$('a749Assignee').value)
  $('a749Assignee').value=data.viewer_admin_user_id;
}
async function load(taskId=null){
 if(busy)return;buttons(true);
 say('a749Status','Reading bounded private Admin evidence. Nothing is sent to customers.');
 try{data=await query('GET',null,taskId);pendingKey=null;render();
  say('a749Status','Private queue revision '+data.queue.version+
   ' loaded. Original source checks are available per task. No automatic contact or transaction occurred.');
 }catch(e){data=null;selectedTask=null;say('a749Status','HOLD: '+failure(e)+'. No private work item was changed.');}
 finally{buttons(false);}
}
async function save(kind,fields){
 if(busy||!data){say('a749Status','HOLD: Load current original private queue before saving.');return;}
 const key=pendingKey||crypto.randomUUID();pendingKey=key;buttons(true);
 say('a749Status','Saving only a private Admin evidence receipt; no customer or provider action.');
 try{
  const source=await query('POST',{kind,expected_version:data.queue.version,
   request_key:key,...fields});
  pendingKey=null;
  const next=await query('GET',null,selectedTask);
  data=next;render();
  say('a749Status',source.replayed?'Original receipt replay confirmed.':
   'Private '+kind+' receipt saved and re-read. Customer contact and external outcomes remain unverified.');
 }catch(e){say('a749Status','HOLD: '+failure(e)+'. Inspect original history before retrying; an uncertain write may already exist.');}
 finally{buttons(false);}
}
const common=(prefix,decisionId)=>({
 note:$(prefix+'Note').value.trim(),
 source_reference:$(prefix+'Ref').value.trim(),
 decision:$(decisionId).value
});
$('a749Load').addEventListener('click',()=>void load());
$('a749Find').addEventListener('click',()=>{const uuid=$('a749FindId').value.trim();
 if(!uuid){say('a749TaskStatus','Enter an original task UUID to verify.');return;}void load(uuid);});
$('a749OpenForm').addEventListener('submit',e=>{e.preventDefault();
 void save('task_open',{...common('a749Open','a749OpenDecision'),
  order_id:$('a749Order').value.trim(),case_id:$('a749Case').value.trim(),
  assignee_user_id:$('a749Assignee').value.trim(),priority:$('a749Priority').value,
  due_date:$('a749Due').value});});
$('a749ProgressForm').addEventListener('submit',e=>{e.preventDefault();
 void save('task_progress',{...common('a749Progress','a749ProgressDecision'),
  subject_id:$('a749ProgressId').value.trim(),due_date:$('a749NextDue').value});});
$('a749AssignForm').addEventListener('submit',e=>{e.preventDefault();
 void save('task_assign',{...common('a749Assign','a749AssignDecision'),
  subject_id:$('a749AssignId').value.trim(),assignee_user_id:$('a749NewAssignee').value.trim()});});
$('a749ReviewForm').addEventListener('submit',e=>{e.preventDefault();
 void save('review_followup',{...common('a749Review','a749ReviewDecision'),
  subject_id:$('a749ReviewId').value.trim()});});
$('a749ReopenForm').addEventListener('submit',e=>{e.preventDefault();
 void save('task_reopen',{...common('a749Reopen','a749ReopenDecision'),
  subject_id:$('a749ReopenId').value.trim()});});
$('a749AckForm').addEventListener('submit',e=>{e.preventDefault();
 if(!/Firefox\/\d+/i.test(navigator.userAgent)||/Seamonkey/i.test(navigator.userAgent)){
  say('a749Status','HOLD: Firefox owner acknowledgement must be performed in an actual Firefox browser session.');return;
 }
 if(!data?.firefox||data.firefox.state!=='HOLD_OWNER_ACKNOWLEDGMENT_REQUIRED'){
  say('a749Status','HOLD: Latest original Build 748 Firefox observation requires independent second-Admin PASS review before owner acknowledgment.');return;
 }
 if(!$('a749AckConfirm').checked){
  say('a749Status','HOLD: Original Firefox observer must personally confirm the acknowledgment.');return;
 }
 void save('owner_ack_firefox',{...common('a749Ack','a749AckDecision'),
  observation_id:data.firefox.source_observation_id,review_id:data.firefox.source_review_id,
  owner_clicked_confirmation:true,browser_family:'firefox'});
});
})();
