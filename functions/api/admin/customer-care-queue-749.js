/** Build 749 — private original-source customer-care work queue and owner Firefox acknowledgment.
 * Admin-only D1 app_settings CAS. Never sends customer/provider messages or modifies Orders.
 */
import {getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
const KEY='site.admin.customerjourney.workqueue.v749';
const ARCHIVE='site.admin.customerjourney.carecustody.v750';
const FIREFOX='site.admin.customerjourney.v748';
const CASE=id=>'site.admin.aftersale.v746.'+id;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KINDS=['owner_ack_firefox','task_open','task_assign','task_progress','review_followup','task_reopen'];
const DECISIONS={
 owner_ack_firefox:['acknowledged'],task_open:['open'],task_assign:['assign'],
 task_progress:['attempted','blocked','ready_review'],review_followup:['pass','hold'],
 task_reopen:['reopen']
};
const respond=(o,status=200)=>jsonResponse({ok:status<400,build:749,...o},status,{
 'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff',
 'X-Robots-Tag':'noindex,nofollow,noarchive','Vary':'Cookie'
});
const cut=(v,n)=>String(v??'').trim().slice(0,n+1);
const idNumber=v=>/^[1-9][0-9]{0,9}$/.test(String(v??''))?Number(v):0;
const actorId=v=>Number.isSafeInteger(Number(v))&&Number(v)>0&&Number(v)<1000000000?Number(v):0;
const safe=(v,min,max)=>{
 const text=cut(v,max);
 return text.length>=min&&text.length<=max&&!/@|https?:|[<>]|\b(?:\d[ -]*?){9,}\b/i.test(text)?text:null;
};
const today=()=>new Date().toISOString().slice(0,10);
const days=date=>Math.round((Date.parse(date+'T00:00:00Z')-Date.parse(today()+'T00:00:00Z'))/86400000);
function validDue(date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const ms=Date.parse(date+'T00:00:00Z');
 return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===date&&days(date)>=-30&&days(date)<=365;
}
function permitted(ctx){
 const admin=verifiedAdminFromModule(ctx),db=getDb(ctx.env);
 if(!admin)return{error:respond({code:'VERIFIED_STORE_ADMIN_REQUIRED',error:'Verified active Storefront Admin required.'},403)};
 if(!db)return{error:respond({code:'PRIVATE_DB_UNAVAILABLE',error:'Original private source database unavailable.'},503)};
 return{admin,db};
}
async function getRow(db,key){
 return db.prepare('SELECT setting_value,is_public FROM app_settings WHERE setting_key=? LIMIT 1')
  .bind(key).first();
}
function parse(r,schema,cap){
 if(!r)return{schema,version:0,receipts:[]};
 if(Number(r.is_public)!==0)throw Error('Private source visibility conflict');
 const d=JSON.parse(r.setting_value);
 if(d?.schema!==schema||!Number.isSafeInteger(d.version)||d.version<0||
  !Array.isArray(d.receipts)||d.receipts.length>cap)throw Error('Original receipt journal invalid');
 return d;
}
async function work(db){
 const r=await getRow(db,KEY);return{r,doc:parse(r,749,120)};
}
async function archivedTaskIds(db){
 const r=await getRow(db,ARCHIVE),doc=parse(r,750,120);
 const seen=new Set(),archived=new Set();
 for(const receipt of doc.receipts){
  if((receipt.kind==='archive_review'&&receipt.decision==='approve')||
     receipt.kind==='archive_restore'){
   if(seen.has(receipt.task_id))continue;
   seen.add(receipt.task_id);
   if(receipt.kind==='archive_review')archived.add(receipt.task_id);
  }
 }
 return archived;
}
async function firefox(db){
 const row=await getRow(db,FIREFOX),doc=parse(row,748,100);
 const original=doc.receipts.find(x=>x.kind==='firefox_observation');
 const review=original&&doc.receipts.find(x=>x.kind==='review_firefox'&&x.subject_id===original.id);
 const accepted=Boolean(original?.decision==='observed'&&original?.static_hold===0&&
  original?.static_pass===7&&original?.client_reported_firefox===true&&
  review?.decision==='pass'&&review.actor_user_id!==original.actor_user_id);
 return{valid:accepted,original,review,source_version:doc.version};
}
function firefoxStatus(doc,src){
 const acknowledgment=doc.receipts.find(x=>x.kind==='owner_ack_firefox');
 const current=src.valid&&acknowledgment?.observation_id===src.original.id&&
  acknowledgment?.review_id===src.review.id&&acknowledgment.actor_user_id===src.original.actor_user_id;
 return{state:current?'OWNER_ACKNOWLEDGED_REVIEWED_FIREFOX_EVIDENCE':
  src.valid?'HOLD_OWNER_ACKNOWLEDGMENT_REQUIRED':'HOLD_ORIGINAL_INDEPENDENT_FIREFOX_EVIDENCE',
  source_observation_id:src.original?.id||null,
  source_review_id:src.review?.id||null,
  source_version:src.source_version,
  owner_ack_receipt_id:current?acknowledgment.id:null,
  independently_verified_physical_device:false,
  source_client_reported_only:true};
}
async function validAssignee(db,id){
 if(!id)return false;
 const user=await db.prepare("SELECT user_id FROM users WHERE user_id=? AND is_active=1 AND lower(trim(role))='admin' LIMIT 1")
  .bind(id).first();
 return Number(user?.user_id)===id;
}
async function source(db,orderId,caseId){
 const order=await db.prepare('SELECT order_id,updated_at FROM orders WHERE order_id=? LIMIT 1')
  .bind(orderId).first();
 if(!order)return{code:'ORIGINAL_ORDER_REQUIRED',status:404,error:'Canonical original Order not found.'};
 const cRow=await getRow(db,CASE(orderId));
 if(!cRow||Number(cRow.is_public)!==0)return{code:'ORIGINAL_CASE_REQUIRED',status:409,error:'Original Build 746 private case journal not found.'};
 const cases=parse(cRow,746,30);
 const receipt=cases.receipts.find(x=>x.receipt_id===caseId&&x.source_order_id===orderId);
 if(!receipt||!['customer_support','return_request','pickup_coordination'].includes(receipt.case_type))
  return{code:'SOURCE_CASE_MISMATCH',status:409,error:'Original case is missing or belongs to another Order.'};
 return{order_id:orderId,case_id:caseId,case_type:receipt.case_type,
  case_stage:receipt.stage,order_updated_at:order.updated_at||null,
  case_version:cases.version,original_author_user_id:receipt.owner_user_id};
}
function taskOpen(doc,id){return doc.receipts.find(x=>x.kind==='task_open'&&x.id===id)||null;}
function taskEvents(doc,id){return doc.receipts.filter(x=>x.subject_id===id);}
function taskDetails(doc,opening){
 const events=taskEvents(doc,opening.id);
 const current=events.find(x=>['task_progress','review_followup','task_reopen'].includes(x.kind));
 const assignment=events.find(x=>x.kind==='task_assign');
 const dueUpdate=events.find(x=>x.kind==='task_progress'&&x.due_date);
 const due=dueUpdate?.due_date||opening.due_date;
 let status='OPEN_SOURCE_UNRECHECKED';
 if(current?.kind==='task_progress'){
  status=current.decision==='ready_review'?'WAIT_INDEPENDENT_FOLLOWUP_REVIEW':
   current.decision==='blocked'?'HOLD_BLOCKED':'IN_PROGRESS';
 }else if(current?.kind==='review_followup'){
  status=current.decision==='pass'?'INTERNAL_FOLLOWUP_REVIEW_RECORDED_SOURCE_UNRECHECKED':'HOLD_REVIEW';
 }else if(current?.kind==='task_reopen')status='REOPENED_FOLLOWUP_REQUIRED';
 const settled=status==='INTERNAL_FOLLOWUP_REVIEW_RECORDED_SOURCE_UNRECHECKED';
 const until=days(due);
 return{task_id:opening.id,order_id:opening.order_id,case_id:opening.case_id,
  case_type:opening.case_type,opened_by:opening.actor_user_id,
  assignee_user_id:assignment?.assignee_user_id||opening.assignee_user_id,
  priority:opening.priority,due_date:due,
  days_until_due:until,overdue:!settled&&until<0,
  due_soon:!settled&&until>=0&&until<=2,
  state:status,latest_event_id:current?.id||opening.id,
  latest_progress_id:events.find(x=>x.kind==='task_progress')?.id||null,
  last_actor_user_id:current?.actor_user_id||opening.actor_user_id,
  source_check:'NOT_REVALIDATED_IN_QUEUE_LIST',
  external_reply_or_provider_outcome_verified:false,
  payment_or_refund_executed:false};
}
function queue(doc,filterOrder){
 const entries=doc.receipts.filter(x=>x.kind==='task_open'&&(!filterOrder||x.order_id===filterOrder))
  .slice(0,35).map(x=>taskDetails(doc,x));
 entries.sort((a,b)=>{
  const rank=x=>x.overdue?0:x.state.startsWith('HOLD')?1:x.due_soon?2:3;
  return rank(a)-rank(b)||a.due_date.localeCompare(b.due_date)||a.task_id.localeCompare(b.task_id);
 });
 return{version:doc.version,today_utc:today(),
  tasks:entries,total:entries.length,
  overdue:entries.filter(x=>x.overdue).length,
  due_soon:entries.filter(x=>x.due_soon).length,
  held:entries.filter(x=>x.state.startsWith('HOLD')).length,
  original_source_each_task_requires_detail_revalidation:true,
  automatic_reminders_or_customer_contact:false};
}
function safeReceipt(x){
 return{id:x.id,kind:x.kind,decision:x.decision,recorded_at:x.recorded_at,
  actor_user_id:x.actor_user_id,order_id:x.order_id||null,
  subject_id:x.subject_id||null,case_id:x.case_id||null,
  assignee_user_id:x.assignee_user_id||null,
  source_reference:x.source_reference,note:x.note,
  observation_id:x.observation_id||null,review_id:x.review_id||null,
  external_customer_action:false};
}
async function details(db,doc,taskId){
 const opening=taskOpen(doc,taskId);
 if(!opening)return{code:'ORIGINAL_TASK_REQUIRED',status:404,error:'Private original task ID not found.'};
 const current=taskDetails(doc,opening);
 const fresh=await source(db,opening.order_id,opening.case_id);
 if(fresh.code)return{task:{...current,state:'HOLD_ORIGINAL_SOURCE_UNAVAILABLE',source_check:fresh.code}};
 const newest=taskEvents(doc,opening.id).find(x=>x.kind==='task_source_reconcile');
 const snapshot=newest||opening;
 const same=fresh.order_updated_at===snapshot.source_order_updated_at&&
  fresh.case_version===snapshot.source_case_version&&fresh.case_type===opening.case_type;
 return{task:{...current,state:same?current.state:'HOLD_SOURCE_CHANGED',
  source_check:same?'ORIGINAL_ORDER_CASE_CURRENT':'ORIGINAL_SOURCE_CHANGED',
  last_original_case_stage:fresh.case_stage,
  external_customer_action_confirmed:false}};
}
export async function onRequestGet(ctx){
 const {db,admin,error}=permitted(ctx);if(error)return error;
 const url=new URL(ctx.request.url),orderRaw=url.searchParams.get('order_id'),
  id=orderRaw? idNumber(orderRaw):0,taskId=url.searchParams.get('task_id');
 if(orderRaw!==null&&!id)return respond({code:'INVALID_ORDER',error:'Original numeric Order ID required.'},400);
 if(taskId&&!UUID.test(taskId))return respond({code:'INVALID_TASK_ID',error:'Original receipt UUID required.'},400);
 try{
  const {doc}=await work(db),src=await firefox(db),view=queue(doc,id),
   archived=await archivedTaskIds(db);
  view.tasks=view.tasks.filter(x=>!archived.has(x.task_id));
  view.total=view.tasks.length;
  view.overdue=view.tasks.filter(x=>x.overdue).length;
  view.due_soon=view.tasks.filter(x=>x.due_soon).length;
  view.held=view.tasks.filter(x=>x.state.startsWith('HOLD')).length;
  view.archived_hidden=archived.size;
  const selected=taskId?await details(db,doc,taskId):null;
  if(selected?.task&&archived.has(taskId))selected.task.state='ARCHIVED_IMMUTABLE_RECEIPTS';
  if(selected?.code)return respond({code:selected.code,error:selected.error},selected.status);
  return respond({queue:view,firefox:firefoxStatus(doc,src),
   viewer_admin_user_id:admin.user_id,
   selected_task:selected?.task||null,
   receipts:doc.receipts.slice(0,50).map(safeReceipt),
   read_only:true,refund_executed:false,customer_notified:false,provider_action:false});
 }catch{return respond({code:'PRIVATE_SOURCE_HOLD',error:'Original source is unavailable or inconsistent. Do not assume acceptance or task completion.'},503);}
}
export async function onRequestPost(ctx){
 const {db,admin,error}=permitted(ctx);if(error)return error;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)
  return respond({code:'SAME_ORIGIN_REQUIRED',error:'Same-origin verified Admin interaction required.'},403);
 if(!/application\/json/i.test(ctx.request.headers.get('Content-Type')||''))
  return respond({code:'JSON_REQUIRED',error:'JSON original evidence required.'},415);
 let payload;
 try{const raw=await ctx.request.text();if(raw.length>5000)throw Error('Too long');payload=JSON.parse(raw);}
 catch{return respond({code:'INVALID_JSON',error:'Bounded JSON receipt required.'},400);}
 if(!payload||typeof payload!=='object'||Array.isArray(payload))
  return respond({error:'JSON object required.'},400);
 const input={
  kind:cut(payload.kind,32),decision:cut(payload.decision,24),
  order_id:idNumber(payload.order_id),case_id:cut(payload.case_id,80),
  subject_id:cut(payload.subject_id,80),assignee_user_id:actorId(payload.assignee_user_id),
  priority:cut(payload.priority,12),due_date:cut(payload.due_date,12),
  observation_id:cut(payload.observation_id,80),review_id:cut(payload.review_id,80),
  source_reference:safe(payload.source_reference,8,160),
  note:safe(payload.note,20,450)
 };
 const key=cut(payload.request_key,60),version=Number(payload.expected_version);
 if(!KINDS.includes(input.kind)||!DECISIONS[input.kind]?.includes(input.decision)||
  !UUID.test(key)||!input.source_reference||!input.note||!Number.isSafeInteger(version)||version<0)
  return respond({code:'INVALID_EVIDENCE',error:'Current version, request UUID, factual nonpersonal note/reference and valid task action required.'},400);
 const fingerprint=JSON.stringify({...input,owner_clicked_confirmation:payload.owner_clicked_confirmation===true});
 try{
  const {r,doc}=await work(db),archived=await archivedTaskIds(db);
  const prior=doc.receipts.find(x=>x.request_key===key);
  if(prior)return prior.actor_user_id===admin.user_id&&prior.input_fingerprint===fingerprint?
   respond({replayed:true,receipt:safeReceipt(prior),current_version:doc.version}):
   respond({code:'REQUEST_CONFLICT',error:'That request UUID already belongs to different original evidence.'},409);
  if(version!==doc.version)return respond({code:'STALE',error:'Original private queue changed. Reload before saving.'},409);
  if(doc.receipts.length>=120)return respond({code:'JOURNAL_CAP',error:'Queue journal is full; retention review required before further writes.'},409);
  const event={id:crypto.randomUUID(),request_key:key,input_fingerprint:fingerprint,
   kind:input.kind,decision:input.decision,recorded_at:new Date().toISOString(),
   actor_user_id:admin.user_id,source_reference:input.source_reference,note:input.note};
  const {kind}=input;
  if(kind==='owner_ack_firefox'){
   const src=await firefox(db);
   if(!src.valid||input.observation_id!==src.original.id||input.review_id!==src.review.id)
    return respond({code:'INDEPENDENT_FIREFOX_REQUIRED',error:'Latest original Build 748 Firefox observation and distinct-Admin PASS review are required.'},409);
   if(payload.browser_family!=='firefox'||!/Firefox\/\d+/i.test(ctx.request.headers.get('User-Agent')||''))
    return respond({code:'ORIGINAL_FIREFOX_BROWSER_REQUIRED',error:'Open the original Admin workspace in Firefox before acknowledging an original Firefox observation.'},403);
   if(admin.user_id!==src.original.actor_user_id||payload.owner_clicked_confirmation!==true)
    return respond({code:'OWNER_ACK_REQUIRED',error:'The genuine original Firefox observer must personally acknowledge their reviewed evidence.'},403);
   if(doc.receipts.some(x=>x.kind===kind&&x.observation_id===input.observation_id&&x.review_id===input.review_id))
    return respond({code:'ALREADY_ACKNOWLEDGED',error:'This original Firefox evidence is already acknowledged; do not duplicate.'},409);
   event.observation_id=input.observation_id;event.review_id=input.review_id;
   event.client_reported_browser_only=true;event.independent_physical_device_attested=false;
  }else if(kind==='task_open'){
   if(!input.order_id||!UUID.test(input.case_id)||!input.assignee_user_id||
    !['normal','urgent'].includes(input.priority)||!validDue(input.due_date))
    return respond({code:'TASK_INPUT_REQUIRED',error:'Original Order/case, Admin assignee, due date within -30/+365 days, and priority required.'},400);
   const count=doc.receipts.filter(x=>x.kind==='task_open'&&!archived.has(x.id)).length;
   if(count>=35)return respond({code:'ACTIVE_QUEUE_CAP',error:'Work queue capacity reached; archive or reconcile first.'},409);
   if(!await validAssignee(db,input.assignee_user_id))
    return respond({code:'REAL_ADMIN_ASSIGNEE_REQUIRED',error:'Selected assignee must be an existing active Admin user.'},409);
   if(doc.receipts.some(x=>x.kind==='task_open'&&x.order_id===input.order_id&&x.case_id===input.case_id))
    return respond({code:'EXISTING_TASK',error:'This original Order/case already has a work item. Open that task rather than duplicating.'},409);
   const snapshot=await source(db,input.order_id,input.case_id);
   if(snapshot.code)return respond({code:snapshot.code,error:snapshot.error},snapshot.status);
   Object.assign(event,{order_id:input.order_id,case_id:input.case_id,
    case_type:snapshot.case_type,priority:input.priority,assignee_user_id:input.assignee_user_id,
    due_date:input.due_date,source_order_updated_at:snapshot.order_updated_at,
    source_case_version:snapshot.case_version,external_contact:false});
  }else{
   if(!UUID.test(input.subject_id))return respond({code:'TASK_ID_REQUIRED',error:'Original work task UUID required.'},400);
   if(archived.has(input.subject_id))
    return respond({code:'ARCHIVED_RESTORE_IN_750',error:'Immutable archived task must be restored in Build 750 custody before operational queue edits.'},409);
   const opening=taskOpen(doc,input.subject_id);
   if(!opening)return respond({code:'ORIGINAL_TASK_REQUIRED',error:'Original private case work item not found.'},404);
   const d=taskDetails(doc,opening),existing=taskEvents(doc,opening.id);
   const fresh=await source(db,opening.order_id,opening.case_id);
   if(fresh.code)return respond({code:fresh.code,error:fresh.error},fresh.status);
   if(fresh.order_updated_at!==opening.source_order_updated_at||
    fresh.case_version!==opening.source_case_version||
    fresh.case_type!==opening.case_type)
    return respond({code:'SOURCE_DRIFT_HOLD',error:'Original Order or case source changed. Do not mark follow-up verified; review source and open a new approved workflow.'},409);
   Object.assign(event,{subject_id:opening.id,order_id:opening.order_id,
    case_id:opening.case_id,case_type:opening.case_type});
   const finished=d.state==='INTERNAL_FOLLOWUP_REVIEW_RECORDED_SOURCE_UNRECHECKED';
   if(kind==='task_assign'){
    if(finished)return respond({code:'REOPEN_FIRST',error:'Reopen independently reviewed work before assigning again.'},409);
    if(!input.assignee_user_id)return respond({code:'ASSIGNEE_REQUIRED',error:'An existing numeric Admin user ID is required.'},400);
    if(admin.user_id!==opening.actor_user_id&&admin.user_id!==d.assignee_user_id)
     return respond({code:'ASSIGN_AUTHORITY_REQUIRED',error:'Only opening or assigned Admin may reassign this work.'},403);
    if(!await validAssignee(db,input.assignee_user_id))
     return respond({code:'REAL_ADMIN_ASSIGNEE_REQUIRED',error:'New assignee must exist as an active Admin.'},409);
    if(input.assignee_user_id===d.assignee_user_id)
     return respond({code:'SAME_ASSIGNEE',error:'Current assignee already owns this work.'},409);
    event.assignee_user_id=input.assignee_user_id;
   }else if(kind==='task_progress'){
    if(finished)return respond({code:'REOPEN_FIRST',error:'Reopen completed internal work before recording another attempt.'},409);
    if(admin.user_id!==d.assignee_user_id)
     return respond({code:'ASSIGNEE_REQUIRED',error:'Only the recorded assignee may report follow-up work.'},403);
    if(input.due_date&&!validDue(input.due_date))
     return respond({code:'DUE_DATE_INVALID',error:'New due date must be a valid bounded UTC calendar date.'},400);
    if(input.due_date)event.due_date=input.due_date;
    event.internal_attempt_only=true;event.external_customer_response_verified=false;
   }else if(kind==='review_followup'){
    if(d.state!=='WAIT_INDEPENDENT_FOLLOWUP_REVIEW')
     return respond({code:'NOT_READY_FOR_REVIEW',error:'Assigned operator must record ready-for-review evidence first.'},409);
    const latest=existing.find(x=>x.kind==='task_progress');
    if(!latest||latest.decision!=='ready_review'||latest.id!==d.latest_progress_id)
     return respond({code:'ORIGINAL_PROGRESS_REQUIRED',error:'Current ready-for-review original receipt unavailable.'},409);
    if(admin.user_id===latest.actor_user_id||admin.user_id===opening.actor_user_id)
     return respond({code:'NO_SELF_REVIEW',error:'Opening operator and latest progress author cannot independently approve follow-up.'},403);
    event.progress_id=latest.id;event.internal_evidence_only=true;
    event.external_customer_outcome_verified=false;
   }else if(kind==='task_reopen'){
    if(!finished)return respond({code:'REVIEWED_TASK_REQUIRED',error:'Only an independently internally reviewed work item may be reopened.'},409);
    event.followup_reopened=true;
   }else return respond({code:'UNSUPPORTED_TASK_KIND',error:'Unsupported task action.'},400);
  }
  const next={schema:749,version:doc.version+1,receipts:[event,...doc.receipts]};
  const packed=JSON.stringify(next);
  if(packed.length>105000)return respond({code:'JOURNAL_BYTES',error:'Private work queue reached evidence storage cap.'},413);
  const saved=r?await db.prepare('UPDATE app_settings SET setting_value=?,is_public=0,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE setting_key=? AND is_public=0 AND setting_value=?')
   .bind(packed,admin.user_id,KEY,r.setting_value).run():
   await db.prepare('INSERT INTO app_settings(setting_key,setting_value,is_public,updated_by_user_id,updated_at) VALUES(?,?,0,?,CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO NOTHING')
    .bind(KEY,packed,admin.user_id).run();
  if(Number(saved?.meta?.changes)!==1)
   return respond({code:'CONCURRENT',error:'Another Admin saved evidence first; reload original queue before retry.'},409);
  const actual=await work(db);
  if(actual.doc.receipts[0]?.id!==event.id)
   return respond({code:'UNCERTAIN_WRITE',error:'Save readback uncertain. Inspect private history before retrying.'},503);
  await auditAdminAction(ctx.env,ctx.request,admin,{action_type:'customer_care_private_queue_749',
   target_type:event.order_id?'order':'storefront',target_id:event.order_id||0,
   details:{kind:event.kind,decision:event.decision,receipt_id:event.id}}).catch(()=>null);
  return respond({saved:true,receipt:safeReceipt(event),current_version:next.version,
   independent_external_customer_reply:false,refund_executed:false,
   pickup_completed:false,provider_notification:false});
 }catch{return respond({code:'PRIVATE_SOURCE_HOLD',error:'Original source/database unavailable or uncertain. Inspect private receipts before retrying.'},503);}
}
