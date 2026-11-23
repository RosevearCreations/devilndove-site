/** Build 750 — source-bound private reply-artifact custody, escalation, retention review and dual-Admin archival.
 * No outbound transport, provider assertion, automatic reminders or deletion.
 */
import {getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
const KEY='site.admin.customerjourney.carecustody.v750';
const QUEUE='site.admin.customerjourney.workqueue.v749';
const CASE=id=>'site.admin.aftersale.v746.'+id;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA=/^[0-9a-f]{64}$/;
const ACTIONS={
 response_record:['record'],response_review:['pass','hold'],
 escalation_raise:['raise'],escalation_ack:['acknowledge'],escalation_clear:['resolved'],
 retention_hold:['hold'],retention_release:['release'],
 archive_propose:['propose'],archive_review:['approve','hold'],archive_restore:['restore']
};
const cut=(x,n)=>String(x??'').trim().slice(0,n+1);
const numeric=x=>/^[1-9][0-9]{0,9}$/.test(String(x??''))?Number(x):0;
const safe=(x,min,max)=>{
 const s=cut(x,max);
 return s.length>=min&&s.length<=max&&!/@|https?:|[<>]|\b(?:\d[ -]*?){9,}\b/i.test(s)?s:null;
};
const utc=()=>new Date().toISOString().slice(0,10);
const dayDelta=d=>Math.round((Date.parse(d+'T00:00:00Z')-Date.parse(utc()+'T00:00:00Z'))/86400000);
const validReview=d=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return false;
 const time=Date.parse(d+'T00:00:00Z');
 return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===d&&dayDelta(d)>=0&&dayDelta(d)<=1830;
};
const reply=(obj,status=200)=>jsonResponse({ok:status<400,build:750,...obj},status,{
 'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff',
 'X-Robots-Tag':'noindex,nofollow,noarchive','Vary':'Cookie'
});
const deny=(code,error,status=409)=>({error:reply({code,error},status)});
function auth(ctx){
 const admin=verifiedAdminFromModule(ctx),db=getDb(ctx.env);
 if(!admin)return deny('VERIFIED_ADMIN_REQUIRED','Active Storefront Admin session required.',403);
 if(!db)return deny('PRIVATE_DB_UNAVAILABLE','Original D1 unavailable.',503);
 return{admin,db};
}
async function read(db,key){
 return db.prepare('SELECT setting_value,is_public FROM app_settings WHERE setting_key=? LIMIT 1')
  .bind(key).first();
}
function parsed(r,schema,cap){
 if(!r)return{schema,version:0,receipts:[]};
 if(Number(r.is_public)!==0)throw Error('Original private visibility changed');
 const d=JSON.parse(r.setting_value);
 if(d?.schema!==schema||!Number.isSafeInteger(d.version)||d.version<0||
  !Array.isArray(d.receipts)||d.receipts.length>cap)throw Error('Original source journal invalid');
 return d;
}
async function load(db){const row=await read(db,KEY);return{row,doc:parsed(row,750,120)};}
async function queue(db){
 const r=await read(db,QUEUE);
 return parsed(r,749,120);
}
const opening=(q,id)=>q.receipts.find(x=>x.id===id&&x.kind==='task_open')||null;
function sourceProgress(q,id){
 const e=q.receipts.find(x=>x.subject_id===id&&
  ['task_progress','task_reopen','review_followup'].includes(x.kind));
 return e?.kind==='review_followup'&&e.decision==='pass'?e:null;
}
async function original(db,q,taskId){
 const item=opening(q,taskId);
 if(!item)return{code:'ORIGINAL_TASK_REQUIRED',error:'Original Build 749 task not found.',status:404};
 const order=await db.prepare('SELECT order_id,updated_at FROM orders WHERE order_id=? LIMIT 1')
  .bind(item.order_id).first();
 if(!order)return{code:'ORIGINAL_ORDER_REQUIRED',error:'Canonical Order no longer available.',status:409};
 const cases=parsed(await read(db,CASE(item.order_id)),746,30);
 const caseReceipt=cases.receipts.find(x=>x.receipt_id===item.case_id&&x.source_order_id===item.order_id);
 if(!caseReceipt)return{code:'ORIGINAL_CASE_REQUIRED',error:'Original Build 746 case receipt not found.',status:409};
 const current=order.updated_at===item.source_order_updated_at&&
  cases.version===item.source_case_version&&caseReceipt.case_type===item.case_type;
 const reviewed=sourceProgress(q,item.id);
 return{item,source_current:current,order_updated_at:order.updated_at||null,
  source_case_version:cases.version,case_stage:caseReceipt.stage,
  followup_review:reviewed,order_id:item.order_id,case_id:item.case_id,
  source_status:current?'ORIGINAL_ORDER_CASE_CURRENT':'HOLD_ORIGINAL_ORDER_CASE_DRIFT'};
}
const last=(doc,kind,taskId)=>doc.receipts.find(x=>x.kind===kind&&x.task_id===taskId)||null;
function response(doc,id){
 const original=last(doc,'response_record',id);
 const review=original&&doc.receipts.find(x=>x.kind==='response_review'&&x.subject_id===original.id);
 const complete=!!(original&&review&&review.decision==='pass'&&
  review.sha256===original.sha256&&review.actor_user_id!==original.actor_user_id);
 return{state:!original?'HOLD_NO_ORIGINAL_RESPONSE_ARTIFACT':
  complete?'INDEPENDENT_LOCAL_ARTIFACT_HASH_MATCH':
  review?.decision==='hold'?'HOLD_RESPONSE_EVIDENCE_REVIEW':'HOLD_INDEPENDENT_ARTIFACT_REVIEW',
  original,review,complete,external_provider_verified:false,
  customer_message_sent:false};
}
function escalation(doc,id){
 const raised=last(doc,'escalation_raise',id);
 const clear=raised&&doc.receipts.find(x=>x.kind==='escalation_clear'&&x.subject_id===raised.id&&x.decision==='resolved');
 const ack=raised&&doc.receipts.find(x=>x.kind==='escalation_ack'&&x.subject_id===raised.id);
 return{state:!raised?'NONE':clear?'RESOLVED_INTERNAL':
  ack?'ACKNOWLEDGED_INTERNAL_ESCALATION':'OPEN_NEEDS_ADMIN_ACK',
  raised,ack,clear,open:!!raised&&!clear};
}
function hold(doc,id){
 const original=last(doc,'retention_hold',id);
 const release=original&&doc.receipts.find(x=>x.kind==='retention_release'&&x.subject_id===original.id);
 return{state:!original?'NONE':release?'RELEASED_INDEPENDENTLY':'ACTIVE_LEGAL_OR_CUSTOMER_DATA_HOLD',
  active:!!original&&!release,original,release};
}
function archive(doc,id){
 const relevant=doc.receipts.find(x=>x.task_id===id&&
  (x.kind==='archive_review'&&x.decision==='approve'||x.kind==='archive_restore'));
 const proposal=last(doc,'archive_propose',id);
 const review=proposal&&doc.receipts.find(x=>x.kind==='archive_review'&&x.subject_id===proposal.id);
 return{state:!relevant?'ACTIVE':relevant.kind==='archive_restore'?'RESTORED_TO_ACTIVE':
  'ARCHIVED_IMMUTABLE_RECEIPTS',
  archived:relevant?.kind==='archive_review',proposal,review,
  retention_review_on:relevant?.kind==='archive_review'?relevant.retention_review_on||null:null};
}
function view(doc,q,taskId,source=null){
 const item=opening(q,taskId);
 if(!item)return null;
 const rsp=response(doc,taskId),esc=escalation(doc,taskId),legal=hold(doc,taskId),arc=archive(doc,taskId);
 return{task_id:taskId,order_id:item.order_id,case_id:item.case_id,
  response_state:rsp.state,response_receipt_id:rsp.original?.id||null,
  independent_response_review_id:rsp.review?.id||null,
  independent_local_hash_match:rsp.complete,
  external_provider_verified:false,customer_reply_provider_confirmed:false,
  escalation_state:esc.state,escalation_id:esc.raised?.id||null,
  escalation_owner_user_id:esc.raised?.escalation_owner_user_id||null,
  retention_hold_state:legal.state,retention_hold_id:legal.original?.id||null,
  archive_state:arc.state,archive_proposal_id:arc.proposal?.id||null,
  retention_review_on:arc.retention_review_on,
  retention_review_due:!!arc.archived&&!!arc.retention_review_on&&dayDelta(arc.retention_review_on)<=0,
  source_status:source?.source_status||'NOT_RECHECKED_ON_SUMMARY',
  followup_internal_review_id:source?.followup_review?.id||null,
  audit_immutable:true,automatic_deletion:false,
  customer_message_sent:false,refund_executed:false,pickup_completed:false};
}
function safeReceipt(x){return{
 id:x.id,kind:x.kind,decision:x.decision,task_id:x.task_id||null,
 subject_id:x.subject_id||null,order_id:x.order_id||null,
 actor_user_id:x.actor_user_id,recorded_at:x.recorded_at,
 source_reference:x.source_reference,note:x.note,
 sha256:x.sha256||null,source_channel:x.source_channel||null,
 escalation_reason:x.escalation_reason||null,escalation_owner_user_id:x.escalation_owner_user_id||null,
 retention_review_on:x.retention_review_on||null,
 external_provider_verified:false,customer_notified:false,
 proof_file_uploaded:false,deleted:false
};}
export async function onRequestGet(ctx){
 const {db,error}=auth(ctx);if(error)return error;
 const url=new URL(ctx.request.url),taskId=url.searchParams.get('task_id'),
  archiveFilter=url.searchParams.get('view')||'active';
 if(taskId&&!UUID.test(taskId))return reply({code:'BAD_TASK_ID',error:'Original task UUID required.'},400);
 if(!['active','archived','all'].includes(archiveFilter))
  return reply({code:'BAD_VIEW',error:'Active, archived or all only.'},400);
 try{
  const [{doc},q]=await Promise.all([load(db),queue(db)]);
  const all=q.receipts.filter(x=>x.kind==='task_open').slice(0,50)
   .map(x=>view(doc,q,x.id));
  const active=all.filter(x=>x.archive_state!=='ARCHIVED_IMMUTABLE_RECEIPTS');
  const archived=all.filter(x=>x.archive_state==='ARCHIVED_IMMUTABLE_RECEIPTS');
  const list=archiveFilter==='all'?all:archiveFilter==='archived'?archived:active;
  list.sort((a,b)=>
   Number(b.escalation_state==='OPEN_NEEDS_ADMIN_ACK')-Number(a.escalation_state==='OPEN_NEEDS_ADMIN_ACK')||
   a.order_id-b.order_id);
  let selected=null;
  if(taskId){
   const s=await original(db,q,taskId);
   if(s.code)return reply({code:s.code,error:s.error},s.status);
   selected=view(doc,q,taskId,s);
  }
  return reply({version:doc.version,view:archiveFilter,rows:list,
   summary:{active:active.length,archived:archived.length,escalated:active.filter(x=>x.escalation_state!=='NONE'&&x.escalation_state!=='RESOLVED_INTERNAL').length,
    response_hash_matched:all.filter(x=>x.independent_local_hash_match).length,
    retention_review_due:archived.filter(x=>x.retention_review_due).length,
    active_holds:all.filter(x=>x.retention_hold_state==='ACTIVE_LEGAL_OR_CUSTOMER_DATA_HOLD').length},
   selected,receipts:doc.receipts.filter(x=>!taskId||x.task_id===taskId).slice(0,75).map(safeReceipt),
   original_task_count:q.receipts.filter(x=>x.kind==='task_open').length,
   provider_delivery_verified:false,no_message_sent:true,
   no_automatic_archive_or_delete:true,read_only:true});
 }catch{return reply({code:'ORIGINAL_PRIVATE_READ_HOLD',error:'Original private Order/case/queue unavailable. Do not infer a customer response or archive.'},503);}
}
export async function onRequestPost(ctx){
 const {db,admin,error}=auth(ctx);if(error)return error;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)
  return reply({code:'SAME_ORIGIN_REQUIRED',error:'Same-origin verified Admin required.'},403);
 if(!/application\/json/i.test(ctx.request.headers.get('Content-Type')||''))
  return reply({code:'JSON_REQUIRED',error:'JSON receipt required.'},415);
 let body;
 try{const raw=await ctx.request.text();if(raw.length>5000)throw Error('too large');body=JSON.parse(raw);}
 catch{return reply({code:'BAD_JSON',error:'Bounded JSON evidence required.'},400);}
 if(!body||typeof body!=='object'||Array.isArray(body))
  return reply({code:'BAD_JSON_OBJECT',error:'JSON object required.'},400);
 const input={kind:cut(body.kind,35),decision:cut(body.decision,25),
  task_id:cut(body.task_id,80),subject_id:cut(body.subject_id,80),
  sha256:cut(body.sha256,64).toLowerCase(),
  source_channel:cut(body.source_channel,20),
  escalation_reason:cut(body.escalation_reason,20),
  escalation_owner_user_id:numeric(body.escalation_owner_user_id),
  retention_review_on:cut(body.retention_review_on,12),
  source_reference:safe(body.source_reference,8,160),
  note:safe(body.note,20,450)};
 const key=cut(body.request_key,60),version=Number(body.expected_version);
 if(!ACTIONS[input.kind]?.includes(input.decision)||!UUID.test(input.task_id)||!UUID.test(key)||
  !Number.isSafeInteger(version)||version<0||!input.source_reference||!input.note)
  return reply({code:'BAD_EVIDENCE',error:'Current revision, factual original task/evidence and unique request UUID required.'},400);
 const fingerprint=JSON.stringify(input);
 try{
  const [{row,doc},q]=await Promise.all([load(db),queue(db)]);
  const prior=doc.receipts.find(x=>x.request_key===key);
  if(prior)return prior.actor_user_id===admin.user_id&&prior.input_fingerprint===fingerprint?
   reply({replayed:true,receipt:safeReceipt(prior),current_version:doc.version}):
   reply({code:'REQUEST_KEY_CONFLICT',error:'Request UUID belongs to different evidence.'},409);
  if(doc.version!==version)return reply({code:'STALE_VERSION',error:'Private journal changed; reload before saving.'},409);
  if(doc.receipts.length>=120)return reply({code:'CUSTODY_JOURNAL_CAP',error:'Immutable custody history cap reached. Preserve evidence; do not purge automatically.'},409);
  const src=await original(db,q,input.task_id);
  if(src.code)return reply({code:src.code,error:src.error},src.status);
  const {item}=src;
  const arch=archive(doc,item.id),res=response(doc,item.id),
   esc=escalation(doc,item.id),legal=hold(doc,item.id);
  const event={id:crypto.randomUUID(),kind:input.kind,decision:input.decision,
   task_id:item.id,order_id:item.order_id,case_id:item.case_id,
   recorded_at:new Date().toISOString(),actor_user_id:admin.user_id,
   request_key:key,input_fingerprint:fingerprint,
   source_reference:input.source_reference,note:input.note,
   external_provider_verified:false,customer_notified:false,refund_executed:false};
  const subject=doc.receipts.find(x=>x.id===input.subject_id);
  const {kind}=input;
  if(kind!=='archive_restore'&&arch.archived)
   return reply({code:'ARCHIVED_RESTORE_REQUIRED',error:'Immutable archived task must be restored explicitly before new action.'},409);
  if(kind!=='archive_restore'&&kind!=='escalation_raise'&&kind!=='retention_hold'&&!src.source_current)
   return reply({code:'SOURCE_CHANGED_HOLD',error:'Original Order or Build 746 case changed. Resolve original source before new evidence or archival approval.'},409);
  if(kind==='response_record'){
   if(!SHA.test(input.sha256)||!['email','storefront','postal','phone','other'].includes(input.source_channel))
    return reply({code:'ORIGINAL_RESPONSE_ARTIFACT_REQUIRED',error:'Local SHA-256 digest of a real response artifact and channel required; no file upload.'},400);
   const latestAssignment=q.receipts.find(x=>x.kind==='task_assign'&&x.subject_id===item.id);
   const currentAssignee=latestAssignment?.assignee_user_id||item.assignee_user_id;
   if(admin.user_id!==currentAssignee)
    return reply({code:'CURRENT_ASSIGNEE_REQUIRED',error:'Recorded current Admin assignee must attest to original response evidence.'},403);
   event.sha256=input.sha256;event.source_channel=input.source_channel;
   event.source_order_updated_at=src.order_updated_at;event.source_case_version=src.source_case_version;
   event.local_artifact_only=true;event.external_customer_reply_verified=false;
  }else if(kind==='response_review'){
   if(!subject||subject.kind!=='response_record'||subject.task_id!==item.id||res.original?.id!==subject.id)
    return reply({code:'CURRENT_RESPONSE_REQUIRED',error:'Latest original response digest receipt required.'},409);
   if(admin.user_id===subject.actor_user_id)
    return reply({code:'NO_SELF_REVIEW',error:'Original response observer cannot independently review their own evidence.'},403);
   if(input.decision==='pass'&&(!SHA.test(input.sha256)||input.sha256!==subject.sha256))
    return reply({code:'ARTIFACT_HASH_MISMATCH',error:'Independent local artifact SHA-256 must exactly match original custody digest.'},409);
   event.subject_id=subject.id;event.sha256=input.sha256;
   event.local_artifact_hash_matched=input.decision==='pass';
   event.external_provider_verified=false;
  }else if(kind==='escalation_raise'){
   if(esc.open)return reply({code:'EXISTING_ESCALATION',error:'An unresolved escalation already exists for this original task.'},409);
   if(!['overdue','blocked','no_response','source_drift','other'].includes(input.escalation_reason))
    return reply({code:'ESCALATION_REASON_REQUIRED',error:'Choose a grounded escalation reason.'},400);
   if(input.escalation_reason==='source_drift'&&src.source_current||
    input.escalation_reason!=='source_drift'&&!src.source_current)
    return reply({code:'SOURCE_ESCALATION_REASON_MISMATCH',error:'Source drift must use its dedicated escalation reason.'},409);
   if(input.escalation_reason==='overdue'){
    const lastDue=q.receipts.find(x=>x.kind==='task_progress'&&x.subject_id===item.id&&x.due_date);
    const due=lastDue?.due_date||item.due_date;
    if(!due||dayDelta(due)>=0)return reply({code:'NOT_OVERDUE',error:'Original UTC due date is not overdue.'},409);
   }
   if(input.escalation_reason==='no_response'&&res.complete)
    return reply({code:'RESPONSE_ALREADY_REVIEWED',error:'This original response already has matched independent evidence.'},409);
   if(!input.escalation_owner_user_id||
    !await db.prepare("SELECT user_id FROM users WHERE user_id=? AND is_active=1 AND lower(trim(role))='admin' LIMIT 1")
      .bind(input.escalation_owner_user_id).first())
    return reply({code:'REAL_ACTIVE_ESCALATION_ADMIN_REQUIRED',error:'Choose an existing active Admin escalation owner.'},409);
   event.escalation_reason=input.escalation_reason;event.escalation_owner_user_id=input.escalation_owner_user_id;
   event.source_drift_observed=!src.source_current;event.alert_sent=false;
  }else if(kind==='escalation_ack'){
   if(!subject||subject.kind!=='escalation_raise'||subject.task_id!==item.id||esc.raised?.id!==subject.id||!esc.open)
    return reply({code:'ACTIVE_ESCALATION_REQUIRED',error:'Active original escalation receipt required.'},409);
   if(admin.user_id!==subject.escalation_owner_user_id)
    return reply({code:'ASSIGNED_ESCALATION_ADMIN_REQUIRED',error:'Only assigned escalation Admin may acknowledge.'},403);
   if(esc.ack)return reply({code:'ALREADY_ACKNOWLEDGED',error:'This original escalation already has an owner acknowledgment.'},409);
   event.subject_id=subject.id;event.owner_acknowledged=true;
  }else if(kind==='escalation_clear'){
   if(!subject||subject.kind!=='escalation_raise'||subject.task_id!==item.id||esc.raised?.id!==subject.id||!esc.open||!esc.ack)
    return reply({code:'ACKNOWLEDGED_ESCALATION_REQUIRED',error:'Original escalation owner acknowledgment required before independent resolution.'},409);
   if(admin.user_id===subject.actor_user_id||admin.user_id===esc.ack.actor_user_id)
    return reply({code:'INDEPENDENT_ESCALATION_RESOLUTION_REQUIRED',error:'Different Admin must independently resolve acknowledged escalation.'},403);
   event.subject_id=subject.id;event.internal_escalation_only=true;event.customer_notified=false;
  }else if(kind==='retention_hold'){
   if(legal.active)return reply({code:'HOLD_ALREADY_ACTIVE',error:'Original task already has an active retention hold.'},409);
   event.retention_hold=true;event.automatic_deletion=false;
  }else if(kind==='retention_release'){
   if(!subject||subject.kind!=='retention_hold'||subject.task_id!==item.id||legal.original?.id!==subject.id||!legal.active)
    return reply({code:'ACTIVE_HOLD_REQUIRED',error:'Current original retention hold receipt required.'},409);
   if(admin.user_id===subject.actor_user_id)
    return reply({code:'NO_SELF_HOLD_RELEASE',error:'Separate Admin must approve releasing evidence retention hold.'},403);
   event.subject_id=subject.id;event.retention_hold_released_internal=true;
  }else if(kind==='archive_propose'){
   if(!res.complete||!src.followup_review||esc.open||legal.active||!validReview(input.retention_review_on))
    return reply({code:'ARCHIVE_PREREQUISITES_HOLD',error:'Original follow-up review, independently matched response digest, no unresolved escalation/hold, and valid retention review date required.'},409);
   if(arch.proposal&&!arch.review)
    return reply({code:'ARCHIVE_PROPOSAL_PENDING',error:'Existing archive proposal requires independent review before replacement.'},409);
   event.retention_review_on=input.retention_review_on;
   event.response_review_id=res.review.id;event.followup_review_id=src.followup_review.id;
   event.source_order_updated_at=src.order_updated_at;event.source_case_version=src.source_case_version;
   event.no_deletion=true;event.no_financial_action=true;
  }else if(kind==='archive_review'){
   if(!subject||subject.kind!=='archive_propose'||subject.task_id!==item.id||
    arch.proposal?.id!==subject.id||arch.review)
    return reply({code:'CURRENT_ARCHIVE_PROPOSAL_REQUIRED',error:'Current unreviewed archival proposal required.'},409);
   if(admin.user_id===subject.actor_user_id)
    return reply({code:'NO_SELF_ARCHIVE_APPROVAL',error:'Archive proposer cannot approve their own archival.'},403);
   if(input.decision==='approve'&&(!res.complete||!src.followup_review||esc.open||legal.active||
    res.review.id!==subject.response_review_id||
    src.followup_review.id!==subject.followup_review_id||
    src.order_updated_at!==subject.source_order_updated_at||
    src.source_case_version!==subject.source_case_version))
    return reply({code:'ARCHIVE_SOURCE_DRIFT_HOLD',error:'Original response, follow-up review, escalation, hold or source changed. Archival stays HOLD.'},409);
   event.subject_id=subject.id;event.retention_review_on=subject.retention_review_on;
   event.internal_archive_only=true;event.records_deleted=false;
  }else if(kind==='archive_restore'){
   if(!arch.archived)return reply({code:'ORIGINAL_ARCHIVE_REQUIRED',error:'Only a reviewed immutable archived task may be restored.'},409);
   event.subject_id=arch.review?.id;event.original_archive_restored=true;
   event.records_deleted=false;
  }else return reply({code:'ACTION_UNKNOWN',error:'Unsupported custody action.'},400);
  const next={schema:750,version:doc.version+1,receipts:[event,...doc.receipts]};
  const packed=JSON.stringify(next);
  if(packed.length>118000)return reply({code:'CUSTODY_BYTES_CAP',error:'Immutable audit journal is at capacity; do not delete evidence automatically.'},413);
  const result=row?await db.prepare('UPDATE app_settings SET setting_value=?,is_public=0,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE setting_key=? AND is_public=0 AND setting_value=?')
   .bind(packed,admin.user_id,KEY,row.setting_value).run():
   await db.prepare('INSERT INTO app_settings(setting_key,setting_value,is_public,updated_by_user_id,updated_at) VALUES(?,?,0,?,CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO NOTHING')
    .bind(KEY,packed,admin.user_id).run();
  if(Number(result?.meta?.changes)!==1)
   return reply({code:'CONCURRENT_CUSTODY',error:'Concurrent Admin evidence changed. Reload original journal before retrying.'},409);
  const verified=await load(db);
  if(verified.doc.receipts[0]?.id!==event.id)
   return reply({code:'UNCERTAIN_WRITE',error:'Original write readback uncertain. Inspect receipt before retrying.'},503);
  await auditAdminAction(ctx.env,ctx.request,admin,{action_type:'customer_response_custody_750',
   target_type:'order',target_id:item.order_id,
   details:{kind:event.kind,decision:event.decision,receipt_id:event.id}}).catch(()=>null);
  return reply({saved:true,receipt:safeReceipt(event),current_version:next.version,
   external_provider_verified:false,customer_notified:false,refund_executed:false,
   original_evidence_deleted:false,automatic_reminder_sent:false});
 }catch{return reply({code:'CUSTODY_SOURCE_UNAVAILABLE',error:'Original private source or write readback unavailable. Keep HOLD and inspect immutable receipt history.'},503);}
}
