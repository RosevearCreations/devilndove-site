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
   '. Resend confirms mailbox records/thread metadata, not independent proof of the human sender.');
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

/* Build 752 — original-source retention operations. Independent of Build751 state; manual only. */
(()=>{'use strict';
const $=id=>document.getElementById(id),API='/api/admin/customer-care-retention-ops-752';
if(!$('a752Load'))return;
let doc=null,busy=false;
const say=(id,text)=>{const e=$(id);if(e)e.textContent=String(text??'');};
const error=e=>String(e?.message||'Original private source unavailable').slice(0,210);
function lock(on){busy=on;for(const b of document.querySelectorAll('#a752Workflow button'))b.disabled=on;}
async function call(method,body=null){
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),12000);
 try{
  const url=new URL(API,location.origin);
  if(method==='GET')url.searchParams.set('view',$('a752View').value);
  const options={method,credentials:'same-origin',cache:'no-store',signal:abort.signal,
   headers:{Accept:'application/json'}};
  if(method==='POST'){options.headers['Content-Type']='application/json';options.body=JSON.stringify(body);}
  const response=await fetch(url.pathname+url.search,options);
  const result=await response.json().catch(()=>({code:'BAD_RESPONSE'}));
  if(!response.ok||!result.ok)throw Error((result.code||'ORIGINAL_SOURCE_HOLD')+' '+(result.error||response.status));
  return result;
 }finally{clearTimeout(timer);}
}
function render(){
 if(!doc)return;
 const s=doc.summary;
 say('a752Summary',s.visible+' original tasks · '+s.due+' due reviews · '+s.legal_holds+
  ' legal holds · '+s.independent_provider_readbacks+' independent provider thread reviews · '+
  s.waiting_provider+' provider enrollment holds · '+s.independently_confirmed_operations+
  ' confirmed internal operations. Evaluated on click '+doc.scheduled_queue_evaluated_at+'.');
 const list=$('a752Rows');list.replaceChildren();
 for(const item of doc.rows){
  const li=document.createElement('li'),description=document.createElement('span');
  description.textContent='Order '+item.order_id+' · '+item.retention_status+
   ' · '+item.provider_enrollment_status+' · scheduled '+(item.review_on||'not approved')+
   (item.legal_hold?' · LEGAL HOLD':'')+
   (item.escalated?' · ESCALATED':'')+' · '+item.task_id+' ';
  const select=document.createElement('button');select.type='button';select.textContent='Select original due review';
  select.addEventListener('click',()=>{
   $('a752Task').value=item.task_id;$('a752Plan').value=item.plan_id||'';
   $('a752Subject').value=item.operator_ack_id||'';
   say('a752Status',item.due?'Selected genuine due-date source. Review holds and original evidence before recording.':
    'Source selected, but no due/approved retention review available for an operations receipt.');
  });
  li.append(description,select);list.append(li);
 }
 if(!doc.rows.length){const li=document.createElement('li');
  li.textContent='No matching original-source tasks. No customer or provider reply has been inferred.';list.append(li);}
}
async function load(){
 if(busy)return;lock(true);
 say('a752Status','Reading original private D1 receipt sources; no provider fetch or external customer notification.');
 try{doc=await call('GET');render();say('a752Status','Original source loaded. Actions require an explicit owner/Admin submission.');}
 catch(e){doc=null;say('a752Status','HOLD: '+error(e));}
 finally{lock(false);}
}
$('a752Load').addEventListener('click',()=>void load());
$('a752ReviewForm').addEventListener('submit',e=>{e.preventDefault();void (async()=>{
 if(!doc||busy){say('a752Status','HOLD: Load original retention worklist first.');return;}
 const payload={kind:$('a752Kind').value,task_id:$('a752Task').value.trim(),
  plan_id:$('a752Plan').value.trim(),subject_id:$('a752Subject').value.trim(),
  note:$('a752Note').value.trim(),expected_version:doc.version,request_key:crypto.randomUUID()};
 lock(true);say('a752Status','Saving only private original due-review custody. No outgoing messages or purge.');
 try{const saved=await call('POST',payload);doc=await call('GET');render();
  say('a752Status','Original Build752 receipt '+saved.receipt_id+' saved and independently read back. No customer contact or deletion.');
 }catch(err){say('a752Status','HOLD: '+error(err)+'. Check fresh private receipts before attempting a new request.');}
 finally{lock(false);}
 })();});
})();


/* Build 753 — original private SLA exception dashboard. No background fetch or external mutation. */
(()=>{'use strict';
const $=id=>document.getElementById(id),API='/api/admin/customer-care-retention-ops-752';
if(!$('a753Load'))return;
let doc=null,busy=false,selected=null;
const say=(id,value)=>{if($(id))$(id).textContent=String(value??'');};
const fail=e=>String(e?.message||'Original source unavailable').slice(0,210);
function lock(on){busy=on;for(const button of document.querySelectorAll('#a753Workflow button'))button.disabled=on;}
async function call(method,body=null){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
 try{
  const url=new URL(API,location.origin);url.searchParams.set('dashboard753','1');
  if(method==='GET')url.searchParams.set('view753',$('a753View').value);
  const opts={method,credentials:'same-origin',cache:'no-store',signal:ctrl.signal,headers:{Accept:'application/json'}};
  if(method==='POST'){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body);}
  const res=await fetch(url.pathname+url.search,opts);
  const data=await res.json().catch(()=>({code:'INVALID_RESPONSE'}));
  if(!res.ok||!data.ok)throw Error((data.code||'SOURCE_HOLD')+' '+(data.error||res.status));
  return data;
 }finally{clearTimeout(timer);}
}
function select(item,exception){
 selected={task_id:item.task_id,code:exception.code,subject_id:exception.raise_receipt_id||''};
 $('a753Task').value=selected.task_id;$('a753Code').value=selected.code;
 $('a753Subject').value=selected.subject_id;
 say('a753Selected','Order '+item.order_id+' · '+exception.code+' · '+exception.status+
  '. A second verified Admin must review any original raise receipt.');
}
function render(){
 if(!doc)return;const s=doc.summary;
 say('a753Summary',s.tasks_scanned+' original cases · '+s.tasks_with_exceptions+
  ' cases needing review · '+s.reply_sla_exceptions+' reply SLA exceptions · '+
  s.closure_sla_exceptions+' closure SLA exceptions · '+s.retention_escalations+
  ' due retention escalations · '+s.independent_reviewed+' independent original reviews.');
 const list=$('a753Rows');list.replaceChildren();
 for(const item of doc.rows){
  const li=document.createElement('li');
  const title=document.createElement('span');
  title.textContent='Order '+item.order_id+' · '+(item.age_hours??'?')+' hours since original case · '+
   (item.provider_thread_independently_reviewed?'Provider thread reviewed':'Provider evidence HOLD')+
   ' · '+(item.closed_internal?'Internally closed':'Internal care open')+' · '+item.task_id;
  li.append(title);
  for(const e of item.exceptions){
   const button=document.createElement('button');button.type='button';
   button.textContent=e.code+' — '+e.status+' — select';
   button.addEventListener('click',()=>select(item,e));li.append(button);
  }
  list.append(li);
 }
 if(!doc.rows.length){const item=document.createElement('li');item.textContent='No original cases match this view.';list.append(item);}
 const history=$('a753History');history.replaceChildren();
 for(const r of doc.receipts){const li=document.createElement('li');
  li.textContent=r.recorded_at+' · '+r.kind+' · '+r.exception_code+
   ' · '+r.decision+' · Admin #'+r.actor_user_id+' · '+r.id;history.append(li);}
 if(!doc.receipts.length){const li=document.createElement('li');li.textContent='No recorded Build 753 exception receipt.';history.append(li);}
}
async function load(){
 if(busy)return;lock(true);say('a753Status','Reading original private journal sources only; no provider call.');
 try{doc=await call('GET');selected=null;render();
  say('a753Status','Original source loaded. Independent live production acceptance remains separately required.');}
 catch(e){doc=null;selected=null;say('a753Status','HOLD: '+fail(e));}
 finally{lock(false);}
}
async function save(kind){
 if(busy||!doc||!selected){say('a753Status','HOLD: Load and select an original exception first.');return;}
 const payload={kind,task_id:selected.task_id,exception_code:selected.code,
  subject_id:selected.subject_id,decision:kind==='exception_review'?$('a753Decision').value:'raise',
  note:$('a753Note').value.trim(),request_key:crypto.randomUUID(),expected_version:doc.version};
 lock(true);say('a753Status','Saving private human-reviewed exception. No external messages or deletion.');
 try{const r=await call('POST',payload);doc=await call('GET');selected=null;render();
  say('a753Status','Original '+kind+' receipt '+r.receipt_id+' saved and read back. Production witness remains separate.');}
 catch(e){say('a753Status','HOLD: '+fail(e)+'. Reload the original journal before retrying an uncertain write.');}
 finally{lock(false);}
}
$('a753Load').addEventListener('click',()=>void load());
$('a753Raise').addEventListener('click',()=>void save('exception_raise'));
$('a753Review').addEventListener('click',()=>void save('exception_review'));
})();


/* Build 754 — manual genuine production-origin witness. Never poll or auto-accept. */
(()=>{'use strict';
const $=id=>document.getElementById(id),API='/api/admin/customer-care-retention-ops-752';
if(!$('a754Load'))return;
let doc=null,busy=false,selected=null;
const say=(id,value)=>{if($(id))$(id).textContent=String(value??'');};
const err=e=>String(e?.message||'Original production witness unavailable').slice(0,210);
function lock(on){busy=on;for(const b of document.querySelectorAll('#a754Workflow button'))b.disabled=on;}
async function call(method,body=null){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
 try{
  const url=new URL(API,location.origin);
  if(method==='GET')url.searchParams.set('witness754','1');
  const options={method,credentials:'same-origin',cache:'no-store',signal:ctrl.signal,
   headers:{Accept:'application/json'}};
  if(method==='POST'){options.headers['Content-Type']='application/json';options.body=JSON.stringify(body);}
  const res=await fetch(url.pathname+url.search,options);
  const json=await res.json().catch(()=>({code:'INVALID_ORIGINAL_RESPONSE'}));
  if(!res.ok||!json.ok)throw Error((json.code||'ORIGINAL_SOURCE_HOLD')+' '+(json.error||res.status));
  return json;
 }finally{clearTimeout(timer);}
}
function choose(row){
 selected=row;
 $('a754Task').value=row.task_id;$('a754Code').value=row.exception_code;
 $('a754Subject').value=row.second_witness_receipt_id||row.first_witness_receipt_id||'';
 say('a754Selected','Original Order '+row.order_id+' · '+row.exception_code+
  ' · second-Admin certificate '+(row.two_admin_live_certified?'RECORDED':'HOLD')+
  ' · internal retention closure '+(row.retention_review_closure_ready?'READY':'HOLD'));
}
function render(){
 if(!doc)return;
 const s=doc.summary,m=doc.production_marker;
 say('a754Sha',m?.ok?m.source_sha:'');
 say('a754Summary',s.source_exceptions+' original exceptions · '+s.independent_original_reviews+
  ' independent Build 753 source reviews · '+s.two_admin_field_certificates+' two-Admin live certificates · '+
  s.retention_closure_ready+' independently verified retention reviews ready · '+
  s.original_internal_retention_closed+' completed internal retention-review closures. '+
  'Production asset proof: '+(m?.ok?'SOURCE-BOUND':'HOLD')+'.');
 const list=$('a754Rows');list.replaceChildren();
 for(const row of doc.rows){
  const li=document.createElement('li'),label=document.createElement('span');
  label.textContent='Order '+row.order_id+' · '+row.exception_code+' · '+
   (row.original_independent_review_id?'Original escalation independently reviewed':'Original review HOLD')+
   ' · '+(row.two_admin_live_certified?'TWO-ADMIN CERTIFIED':'WITNESS HOLD')+
   ' · '+(row.original_internal_retention_closure_id?'INTERNAL REVIEW CLOSED':
    row.retention_review_closure_ready?'INTERNAL CLOSURE ELIGIBLE':'INTERNAL CLOSURE HOLD')+' ';
  const button=document.createElement('button');button.type='button';
  button.textContent='Select original source';button.addEventListener('click',()=>choose(row));
  li.append(label,button);list.append(li);
 }
 if(!doc.rows.length){const li=document.createElement('li');
  li.textContent='No genuine original Build 753 escalation to certify. No evidence has been invented.';list.append(li);}
 const hist=$('a754History');hist.replaceChildren();
 for(const r of doc.receipts){
  const li=document.createElement('li');
  li.textContent=r.recorded_at+' · '+r.kind+' · '+r.exception_code+
   ' · verified Admin #'+r.actor_user_id+' · '+r.source_sha+' · '+r.id;
  hist.append(li);
 }
 if(!doc.receipts.length){const li=document.createElement('li');
  li.textContent='No original Build 754 production witness receipts.';hist.append(li);}
}
async function load(){
 if(busy)return;lock(true);
 say('a754Status','Reading original private D1 source and production release asset. No outbound provider request.');
 try{doc=await call('GET');selected=null;render();
  say('a754Status',doc.production_marker?.ok?
   'Original source is production-bound. Actual Admin certification remains controlled by the original receipts.':
   'HOLD: '+(doc.production_marker?.code||'Original deployment marker unavailable')+'. No false live certificate.');}
 catch(e){doc=null;selected=null;say('a754Status','HOLD: '+err(e));}
 finally{lock(false);}
}
async function save(kind){
 if(busy||!doc||!selected){say('a754Status','HOLD: Load and select genuine original source first.');return;}
 if(!doc.production_marker?.ok){say('a754Status','HOLD: Not an original, source-bound production deployment.');return;}
 const subjectId=kind==='witness_confirm'?selected.first_witness_receipt_id:
  kind==='retention_closure'?selected.second_witness_receipt_id:'';
 const payload={kind,task_id:selected.task_id,exception_code:selected.exception_code,
  subject_id:subjectId,note:$('a754Note').value.trim(),
  request_key:crypto.randomUUID(),expected_version:doc.version};
 lock(true);say('a754Status','Recording one original private Admin witness. No automatic or external mutation.');
 try{const result=await call('POST',payload);doc=await call('GET');selected=null;render();
  say('a754Status','Private original '+kind+' receipt '+result.receipt_id+
   ' saved and read back. No customer contact, provider write, statutory closure or purge.');}
 catch(e){say('a754Status','HOLD: '+err(e)+'. Reload original receipts before retrying an uncertain write.');}
 finally{lock(false);}
}
$('a754Load').addEventListener('click',()=>void load());
$('a754Open').addEventListener('click',()=>void save('witness_open'));
$('a754Confirm').addEventListener('click',()=>void save('witness_confirm'));
$('a754Close').addEventListener('click',()=>void save('retention_closure'));
})();


/* Build 755 — explicit, read-only original audit export and source-matched human review. */
(()=>{'use strict';
const $=id=>document.getElementById(id),API='/api/admin/customer-care-retention-ops-752';
if(!$('a755Load'))return;
let data=null,detail=null,choice=null,busy=false;
const say=(id,value)=>{if($(id))$(id).textContent=String(value??'');};
const fail=e=>String(e?.message||'Original private evidence unavailable').slice(0,230);
function lock(on){busy=on;for(const b of document.querySelectorAll('#a755Workflow button'))b.disabled=on;}
async function readOrWrite(method,body=null,selection=null){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
 try{
  const url=new URL(API,location.origin);
  if(method==='GET'){url.searchParams.set('audit755','1');
   if(selection){url.searchParams.set('task_id',selection.task_id);
    url.searchParams.set('exception_code',selection.exception_code);}}
  const opt={method,credentials:'same-origin',cache:'no-store',signal:ctrl.signal,headers:{Accept:'application/json'}};
  if(method==='POST'){opt.headers['Content-Type']='application/json';opt.body=JSON.stringify(body);}
  const response=await fetch(url.pathname+url.search,opt);
  const item=await response.json().catch(()=>({code:'INVALID_PRIVATE_RESPONSE'}));
  if(!response.ok||!item.ok)throw Error((item.code||'ORIGINAL_SOURCE_HOLD')+' '+(item.error||response.status));
  return item;
 }finally{clearTimeout(timer);}
}
function render(){
 if(!data)return;
 const s=data.summary;
 say('a755Summary',s.original_exceptions+' original exception sources · '+
  s.first_audit_receipts+' first-Admin audit receipts · '+
  s.independent_audit_receipts+' second-Admin audit receipts · production source '+
  (data.production_marker?.ok?'AVAILABLE':'HOLD')+'. Only current, genuinely witnessed cases can be accepted.');
 const list=$('a755Rows');list.replaceChildren();
 for(const item of data.rows){
  const li=document.createElement('li'),span=document.createElement('span'),button=document.createElement('button');
  span.textContent='Order '+item.order_id+' · '+item.exception_code+' · '+
   (item.two_admin_754_source_certified?'Build 754 source-certified':'Build 754 HOLD')+
   ' · '+(item.original_retention_closed?'Internal retention review closed':'No original retention review closure')+' ';
  button.type='button';button.textContent='Select original evidence';button.addEventListener('click',()=>{
   choice=item;detail=null;$('a755Task').value=item.task_id;$('a755Code').value=item.exception_code;
   $('a755Subject').value=item.first_audit_review_id||'';$('a755Hash').value='';
   say('a755Selected','Selected '+item.task_id+'. Press Revalidate selected original case to read current evidence.');
  });
  li.append(span,button);list.append(li);
 }
 if(!data.rows.length){const li=document.createElement('li');
  li.textContent='No original Build 754 exception source. No fictional record was generated.';list.append(li);}
}
async function load(){
 if(busy)return;lock(true);
 say('a755Status','Reading original D1 private journal metadata only; no provider transaction.');
 try{data=await readOrWrite('GET');detail=null;choice=null;render();
  say('a755Status','Original source list loaded. Select and revalidate one case for the private export.');}
 catch(e){data=null;detail=null;choice=null;say('a755Status','HOLD: '+fail(e));}
 finally{lock(false);}
}
async function inspect(){
 if(busy||!choice){say('a755Status','HOLD: Load and select an original case first.');return;}
 lock(true);say('a755Status','Revalidating original Order, case, SLA, retention, two-Admin receipts and production release SHA.');
 try{detail=await readOrWrite('GET',null,choice);
  const a=detail.selected_acceptance,source=detail.selected_audit;
  $('a755Hash').value=detail.selected_sha256||'';
  $('a755Subject').value=a?.first_audit_review_id||'';
  say('a755Selected',(a?.status||'ORIGINAL_HOLD')+' · original field: '+
   (source?.original?.production_field_source_accepted?'VERIFIED':'HOLD')+
   ' · provider thread: '+(source?.sla?.provider_thread_revalidated?'INDEPENDENT':'HOLD')+
   ' · retention: '+(source?.retention?.independent_review_closure_verified?'INTERNAL REVIEW CLOSED':'NOT PROVEN')+
   '. Original source is not a human identity or legal retention certificate.');
  say('a755Status','Private report revalidated. SHA-256 '+detail.selected_sha256+
   '. Export is manual and not sent to any provider.');}
 catch(e){detail=null;say('a755Status','HOLD: '+fail(e));}
 finally{lock(false);}
}
function download(){
 if(!detail?.selected_audit||!detail.selected_sha256||!choice){say('a755Status','HOLD: Revalidate and select original evidence before export.');return;}
 const report={...detail.selected_audit,evidence_sha256:detail.selected_sha256,
  selected_acceptance:detail.selected_acceptance,
  checked_on_server_at:detail.server_clock,
  digest_scope:'selected_audit only, UTF-8 JSON serialization; audit metadata outside digest',
  no_customer_email_or_message_body:true,private_owner_export:true};
 const blob=new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json'});
 const href=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=href;link.download='devilndove-build755-private-audit-'+choice.task_id+'.json';
 link.style.display='none';document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(href),1500);
 say('a755Status','Private audit JSON download requested. Treat the file as private business evidence; do not publish it.');
}
async function submit(kind){
 if(busy||!detail||!choice){say('a755Status','HOLD: Revalidate one source before recording an audit.');return;}
 const p=detail.selected_audit;
 if(!p?.original?.production_field_source_accepted||!p.source?.production_source_verified){
  say('a755Status','HOLD: Original Build 754 two-Admin field acceptance and live main source are required.');return;}
 const payload={kind,task_id:choice.task_id,exception_code:choice.exception_code,
  subject_id:detail.selected_acceptance?.first_audit_review_id||'',
  snapshot_sha256:detail.selected_sha256,expected_version:detail.version,
  request_key:crypto.randomUUID(),note:$('a755Note').value.trim()};
 lock(true);say('a755Status','Saving one authenticated private original audit receipt, no external send.');
 try{const receipt=await readOrWrite('POST',payload);
  data=await readOrWrite('GET');render();
  choice=data.rows.find(x=>x.task_id===payload.task_id&&x.exception_code===payload.exception_code)||choice;
  detail=await readOrWrite('GET',null,choice);
  $('a755Task').value=choice.task_id;$('a755Code').value=choice.exception_code;
  $('a755Hash').value=detail.selected_sha256||'';
  $('a755Subject').value=detail.selected_acceptance?.first_audit_review_id||'';
  say('a755Selected',detail.selected_acceptance?.status||'HOLD');
  say('a755Status','Original '+kind+' receipt '+receipt.receipt_id+
   ' saved and read back. No provider write, customer email or retention purge.');}
 catch(e){detail=null;say('a755Status','HOLD: '+fail(e)+'. Reload original receipts before retrying an uncertain save.');}
 finally{lock(false);}
}
$('a755Load').addEventListener('click',()=>void load());
$('a755Inspect').addEventListener('click',()=>void inspect());
$('a755Download').addEventListener('click',download);
$('a755Open').addEventListener('click',()=>void submit('audit_open'));
$('a755Certify').addEventListener('click',()=>void submit('audit_certify'));
})();
