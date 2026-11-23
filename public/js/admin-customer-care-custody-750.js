/* Build 750: private original source response evidence and case custody.
 * No automatic GET, outbound messaging, file upload, archive purge, provider or finance actions.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id),API='/api/admin/customer-care-custody-750';
if(!$('a750Load'))return;
let state=null,pending=null,busy=false,taskId=null;
const show=(id,t)=>{if($(id))$(id).textContent=String(t??'');};
const error=e=>String(e?.message||'Original source unavailable').slice(0,180);
const item=(parent,text)=>{const li=document.createElement('li');li.textContent=String(text);parent.append(li);};
function disabled(v){
 busy=v;
 for(const el of document.querySelectorAll('#a750Custody button'))el.disabled=v;
}
async function request(method,data=null,selected=null){
 const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),10000);
 try{
  const url=new URL(API,location.origin);
  if(method==='GET'){
   url.searchParams.set('view',$('a750View').value);
   if(selected)url.searchParams.set('task_id',selected);
  }
  const options={method,credentials:'same-origin',cache:'no-store',signal:ctl.signal,
   headers:{Accept:'application/json'}};
  if(method==='POST'){options.headers['Content-Type']='application/json';options.body=JSON.stringify(data);}
  const res=await fetch(url.pathname+url.search,options);
  const obj=await res.json().catch(()=>({error:'Original private response unreadable'}));
  if(!res.ok||!obj.ok)throw Error((obj.code?obj.code+': ':'')+(obj.error||'HTTP '+res.status));
  return obj;
 }finally{clearTimeout(timeout);}
}
function render(){
 if(!state)return;
 const s=state.summary,rows=$('a750Rows');rows.replaceChildren();
 show('a750Summary',s.active+' active · '+s.archived+' archived · '+
  s.escalated+' escalations · '+s.response_hash_matched+' independently matched local artifacts · '+
  s.retention_review_due+' retention reviews due · '+s.active_holds+' active holds. Provider delivery remains unverified.');
 for(const r of state.rows){
  const li=document.createElement('li'),label=document.createElement('span');
  label.textContent='Order '+r.order_id+' · '+r.response_state+' · '+r.escalation_state+
   ' · '+r.retention_hold_state+' · '+r.archive_state+' · '+r.task_id+' ';
  const btn=document.createElement('button');btn.type='button';btn.textContent='Inspect case source';
  btn.addEventListener('click',()=>void load(r.task_id));li.append(label,btn);rows.append(li);
 }
 if(!state.rows.length)item(rows,'No original matching tasks. No customer, response or archived case was fabricated.');
 if(state.selected){
  const s=state.selected;taskId=s.task_id;
  show('a750Task',s.task_id+' · Original Order '+s.order_id+' · '+s.source_status+
   ' · response '+s.response_state+' · escalation '+s.escalation_state+
   ' · retention '+s.retention_hold_state+' · '+s.archive_state+
   '. Independent matching of a local file is NOT provider delivery verification.');
  for(const id of ['a750ResponseTask','a750ReviewTask','a750EscTask',
   'a750AckTask','a750ClearTask','a750HoldTask','a750ReleaseTask',
   'a750ArchiveTask','a750ApproveTask','a750RestoreTask'])if($(id))$(id).value=s.task_id;
  if(s.response_receipt_id)$('a750ReviewSubject').value=s.response_receipt_id;
  if(s.escalation_id){$('a750AckSubject').value=s.escalation_id;$('a750ClearSubject').value=s.escalation_id;}
  if(s.retention_hold_id)$('a750ReleaseSubject').value=s.retention_hold_id;
  if(s.archive_proposal_id)$('a750ApproveSubject').value=s.archive_proposal_id;
 }else{
  taskId=null;
  show('a750Task','Select Inspect case source before submitting original case evidence.');
 }
 const list=$('a750Receipts');list.replaceChildren();
 for(const e of state.receipts.slice(0,45))
  item(list,e.id+' · '+e.kind+'/'+e.decision+' · Admin #'+e.actor_user_id+
   ' · '+e.recorded_at+' · '+(e.sha256?'SHA-256 '+e.sha256.slice(0,14)+'…':'no file digest')+
   ' · '+e.source_reference);
 if(!state.receipts.length)item(list,'No private Build 750 receipts yet.');
}
async function load(selected=null){
 if(busy)return;
 disabled(true);show('a750Status','Checking original private source; no customer or provider actions.');
 try{state=await request('GET',null,selected);pending=null;render();
  show('a750Status','Original private custody version '+state.version+' loaded. No external action or deletion.');
 }catch(e){state=null;taskId=null;show('a750Status','HOLD: '+error(e)+'. No evidence mutated.');}
 finally{disabled(false);}
}
async function save(kind,fields){
 if(!state||busy){show('a750Status','HOLD: Load original private custody evidence first.');return;}
 const key=pending||crypto.randomUUID();pending=key;disabled(true);
 try{
  const result=await request('POST',{
   kind,request_key:key,expected_version:state.version,...fields
  });
  pending=null;
  state=await request('GET',null,taskId||fields.task_id);
  render();
  show('a750Status',result.replayed?'Exact original request key readback confirmed.':
   'Private '+kind+' receipt saved and read back. Customer/provider response NOT independently confirmed.');
 }catch(e){show('a750Status','HOLD: '+error(e)+'. Check original receipt history before retrying this request.');}
 finally{disabled(false);}
}
function base(prefix,decisionId){
 return{
  task_id:$(prefix+'Task').value.trim(),
  source_reference:$(prefix+'Ref').value.trim(),note:$(prefix+'Note').value.trim(),
  decision:$(decisionId).value
 };
}
async function hashFile(fileId,digestId){
 const file=$(fileId).files?.[0];
 if(!file){show('a750Status','Select the actual original local evidence artifact before hashing.');return;}
 if(file.size<1||file.size>8*1024*1024){show('a750Status','HOLD: Local file must be between 1 byte and 8 MB. The file is not uploaded.');return;}
 disabled(true);
 try{
  if(!crypto?.subtle)throw Error('Secure browser SHA-256 unavailable');
  const raw=await file.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',raw);
  const text=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  $(digestId).value=text;
  show('a750Status','Local SHA-256 calculated. File content remains on this device and is NOT uploaded. '+
   'A second Admin must independently hash the same artifact before approval.');
 }catch(e){$(digestId).value='';show('a750Status','HOLD: '+error(e));}
 finally{disabled(false);}
}
$('a750Load').addEventListener('click',()=>void load());
$('a750Lookup').addEventListener('click',()=>{
 const id=$('a750TaskId').value.trim();
 if(!id){show('a750Task','Enter an original UUID before looking up source.');return;}void load(id);
});
$('a750Export').addEventListener('click',()=>{
 if(!state){show('a750Status','Load original private custody first.');return;}
 const safe={build:750,exported_at:new Date().toISOString(),view:state.view,
  summary:state.summary,selected:state.selected,receipts:state.receipts,
  file_content_exported:false,customer_identifiers_exported:false,provider_delivery_verified:false,
  automatic_data_deletion:false};
 const u=URL.createObjectURL(new Blob([JSON.stringify(safe,null,2)+'\n'],{type:'application/json'}));
 const anchor=document.createElement('a');anchor.href=u;
 anchor.download='devilndove-care-custody-750-redacted.json';
 anchor.hidden=true;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);
});
$('a750HashResponse').addEventListener('click',()=>void hashFile('a750ResponseFile','a750ResponseSha'));
$('a750HashReview').addEventListener('click',()=>void hashFile('a750ReviewFile','a750ReviewSha'));
const bindings=[
 ['response_record','a750ResponseForm','a750Response','a750ResponseDecision',
  ()=>({sha256:$('a750ResponseSha').value.trim(),source_channel:$('a750ResponseChannel').value})],
 ['response_review','a750ReviewForm','a750Review','a750ReviewDecision',
  ()=>({subject_id:$('a750ReviewSubject').value.trim(),sha256:$('a750ReviewSha').value.trim()})],
 ['escalation_raise','a750EscForm','a750Esc','a750EscDecision',
  ()=>({escalation_reason:$('a750EscReason').value,
   escalation_owner_user_id:$('a750EscOwner').value.trim()})],
 ['escalation_ack','a750AckForm','a750Ack','a750AckDecision',
  ()=>({subject_id:$('a750AckSubject').value.trim()})],
 ['escalation_clear','a750ClearForm','a750Clear','a750ClearDecision',
  ()=>({subject_id:$('a750ClearSubject').value.trim()})],
 ['retention_hold','a750HoldForm','a750Hold','a750HoldDecision',()=>({})],
 ['retention_release','a750ReleaseForm','a750Release','a750ReleaseDecision',
  ()=>({subject_id:$('a750ReleaseSubject').value.trim()})],
 ['archive_propose','a750ArchiveForm','a750Archive','a750ArchiveDecision',
  ()=>({retention_review_on:$('a750ArchiveDate').value})],
 ['archive_review','a750ApproveForm','a750Approve','a750ApproveDecision',
  ()=>({subject_id:$('a750ApproveSubject').value.trim()})],
 ['archive_restore','a750RestoreForm','a750Restore','a750RestoreDecision',()=>({})]
];
for(const [kind,form,prefix,decision,extra]of bindings)
 $(form).addEventListener('submit',e=>{e.preventDefault();void save(kind,{...base(prefix,decision),...extra()});});
})();
