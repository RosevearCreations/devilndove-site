/* Build 751 — protected click-only Resend readback, original care SLA & manual retention review.
 * No automatic private reads, provider writes, customer messages, raw email body or deletion.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id),API='/api/admin/customer-care-sla-751';
if(!$('a751Load'))return;
let data=null,busy=false,taskId=null,key=null;
const say=(id,t)=>{if($(id))$(id).textContent=String(t??'');};
const fail=e=>String(e?.message||'Original private source unavailable').slice(0,230);
function lock(yes){busy=yes;for(const x of document.querySelectorAll('#a751Workflow button'))x.disabled=yes;}
function add(list,text){const el=document.createElement('li');el.textContent=text;list.append(el);return el;}
async function request(method,payload=null,selected=null){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),11000);
 try{const url=new URL(API,location.origin);
  if(method==='GET'){url.searchParams.set('view',$('a751View').value);
   if(selected)url.searchParams.set('task_id',selected);}
  const opts={method,credentials:'same-origin',cache:'no-store',
   signal:ctrl.signal,headers:{Accept:'application/json'}};
  if(method==='POST'){opts.headers['Content-Type']='application/json';
   opts.body=JSON.stringify(payload);}
  const res=await fetch(url.pathname+url.search,opts);
  const result=await res.json().catch(()=>({error:'Original provider source returned invalid JSON.'}));
  if(!res.ok||!result.ok)throw Error((result.code?result.code+': ':'')+(result.error||'HTTP '+res.status));
  return result;
 }finally{clearTimeout(timer);}
}
function render(){
 if(!data)return;
 const s=data.summary;
 say('a751Summary',s.tasks+' original tasks · '+s.provider_threads_reviewed+
  ' independently reviewed provider email threads · '+s.internally_closed+
  ' internally closed · '+s.retention_due+' retention reviews due · '+s.retention_soon+
  ' due within 7 days. Provider configured: '+(data.provider_configured?'yes':'NO — HOLD'));
 const rows=$('a751Rows');rows.replaceChildren();
 for(const t of data.rows){
  const li=document.createElement('li'),title=document.createElement('span');
  title.textContent='Order '+t.order_id+' · '+t.provider_state+
   ' · reply SLA '+t.reply_sla+' · retention '+(t.retention_review_on||'none')+
   (t.retention_due?' · REVIEW DUE':'')+' · '+t.task_id+' ';
  li.append(title);
  const button=document.createElement('button');button.type='button';
  button.textContent='Inspect original task';button.addEventListener('click',()=>void load(t.task_id));
  li.append(button);rows.append(li);
 }
 if(!data.rows.length)add(rows,'No matching original tasks; no provider/customer reply has been invented.');
 if(data.selected){
  const x=data.selected;taskId=x.task_id;
  say('a751Detail','Order '+x.order_id+' · '+x.original_source+
   ' · '+x.provider_state+' · Reply SLA: '+x.reply_sla+
   (x.first_reply_minutes!==null?' ('+x.first_reply_minutes+' minutes)':'')+
   ' · Internal closure SLA: '+x.close_sla+
   ' · retention '+(x.retention_review_on||'not scheduled')+
   (x.retention_due?' (DUE)':'')+
   '. Resend confirms mailbox records/thread metadata, NOT a person's independent identity.');
  for(const id of ['a751ReadTask','a751ReviewTask','a751CloseTask','a751ReopenTask',
    'a751PlanTask','a751ApproveTask','a751CheckTask'])$(id).value=x.task_id;
  if(x.provider_receipt_id)$('a751ReviewSubject').value=x.provider_receipt_id;
  if(x.closed_receipt_id)$('a751ReopenSubject').value=x.closed_receipt_id;
  if(x.retention_schedule_id){
   $('a751ApproveSubject').value=x.retention_schedule_id;
   $('a751CheckSubject').value=x.retention_schedule_id;
  }
 }else{taskId=null;say('a751Detail','Inspect an original Build 749 task before saving any original provider/retention evidence.');}
 const history=$('a751History');history.replaceChildren();
 for(const x of data.receipts.slice(0,45))
  add(history,x.id+' · '+x.kind+'/'+x.decision+' · Admin #'+x.actor_user_id+
   ' · '+x.recorded_at+' · '+x.source_reference);
 if(!data.receipts.length)add(history,'No original Build 751 receipts yet.');
}
async function load(selected=null){
 if(busy)return;
 lock(true);say('a751Status','Reading protected D1 only. Provider API is NOT contacted by loading this page.');
 try{data=await request('GET',null,selected);key=null;render();
  say('a751Status','Original private revision '+data.version+
   ' loaded. Provider readback requires an explicit separate button click.');
 }catch(e){data=null;taskId=null;say('a751Status','HOLD: '+fail(e)+'. No original evidence was changed.');}
 finally{lock(false);}
}
async function save(kind,additional={}){
 if(!data||busy){say('a751Status','HOLD: Load genuine original source first.');return;}
 const prefix=({provider_readback:'a751Read',provider_review:'a751Review',
  sla_close:'a751Close',sla_reopen:'a751Reopen',retention_plan:'a751Plan',
  retention_review:'a751Approve',retention_check:'a751Check'})[kind];
 const payload={kind,decision:$(prefix+'Decision').value,
  task_id:$(prefix+'Task').value.trim(),
  source_reference:$(prefix+'Ref').value.trim(),note:$(prefix+'Note').value.trim(),...additional};
 const requestKey=key||crypto.randomUUID();key=requestKey;lock(true);
 say('a751Status',kind==='provider_readback'||kind==='provider_review'?
  'Reading original Resend provider metadata with server-side key; no outgoing customer message.':
  'Saving a private Admin receipt; no notification or deletion.');
 try{const x=await request('POST',{...payload,request_key:requestKey,expected_version:data.version});
  key=null;data=await request('GET',null,taskId||payload.task_id);render();
  say('a751Status',x.replayed?'Existing exact request receipt recovered.':
   'Original '+kind+' receipt saved and read back. No provider send, customer notification or purge occurred.');
 }catch(e){say('a751Status','HOLD: '+fail(e)+
  '. Review private receipts before retrying; an uncertain save may already exist.');}
 finally{lock(false);}
}
$('a751Load').addEventListener('click',()=>void load());
$('a751Find').addEventListener('click',()=>{
 const id=$('a751TaskId').value.trim();
 if(!id){say('a751Detail','Enter the original Build 749 UUID.');return;}void load(id);
});
$('a751ReadForm').addEventListener('submit',e=>{e.preventDefault();
 if(!$('a751ReadConsent').checked){say('a751Status','HOLD: Explicit read-only provider consent required.');return;}
 void save('provider_readback',{inbound_id:$('a751InboundId').value.trim().toLowerCase(),
  outbound_id:$('a751OutboundId').value.trim().toLowerCase(),owner_clicked_readback:true});
});
const forms=[
 ['provider_review','a751ReviewForm','a751ReviewSubject'],
 ['sla_close','a751CloseForm',null],['sla_reopen','a751ReopenForm','a751ReopenSubject'],
 ['retention_plan','a751PlanForm',null],
 ['retention_review','a751ApproveForm','a751ApproveSubject'],
 ['retention_check','a751CheckForm','a751CheckSubject']
];
for(const [kind,id,subject]of forms){
 $(id).addEventListener('submit',e=>{e.preventDefault();
  const extra=subject?{subject_id:$(subject).value.trim()}:{};
  if(kind==='retention_plan')extra.review_on=$('a751PlanDate').value;
  void save(kind,extra);
 });
}
})();
