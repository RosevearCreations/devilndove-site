/** Build 752 — private scheduled retention-operations worklist and independent operator acknowledgements.
 * Read-only customer/provider custody: no outbound mail, purge, billing, or unattended cron.
 * Source-of-truth: original Build 749/750/751 immutable private journals.
 */
import {getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
const KEY='site.admin.customerjourney.retention-ops.v752';
const WORK='site.admin.customerjourney.workqueue.v749';
const CUSTODY='site.admin.customerjourney.carecustody.v750';
const SLA='site.admin.customerjourney.provider-sla.v751';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const response=(payload,status=200)=>jsonResponse({ok:status<400,build:752,...payload},status,{
 'Cache-Control':'private, no-store, max-age=0','X-Robots-Tag':'noindex,nofollow,noarchive',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Vary':'Cookie'});
const latest=(doc,kind,id)=>doc.receipts.find(r=>r.kind===kind&&r.task_id===id);
function auth(ctx){
 const admin=verifiedAdminFromModule(ctx),db=getDb(ctx.env);
 if(!admin)return {error:response({code:'ADMIN_REQUIRED'},403)};
 if(!db)return {error:response({code:'D1_UNAVAILABLE'},503)};
 return {admin,db};
}
async function raw(db,key){
 const r=await db.prepare('SELECT setting_value,is_public FROM app_settings WHERE setting_key=? LIMIT 1').bind(key).first();
 if(!r)return null;
 if(Number(r.is_public)!==0)throw Error('private visibility mismatch');
 return r.setting_value;
}
function unpack(value,schema,cap){
 if(!value)return {schema,version:0,receipts:[]};
 const doc=JSON.parse(value);
 if(doc?.schema!==schema||!Number.isSafeInteger(doc.version)||doc.version<0||
 !Array.isArray(doc.receipts)||doc.receipts.length>cap)throw Error('invalid private journal');
 return doc;
}
async function sources(db){
 const raws=await Promise.all([raw(db,WORK),raw(db,CUSTODY),raw(db,SLA),raw(db,KEY)]);
 return {work:unpack(raws[0],749,120),custody:unpack(raws[1],750,120),
  sla:unpack(raws[2],751,110),ops:unpack(raws[3],752,160),opsRaw:raws[3]};
}
function state(custody,id){
 const hold=latest(custody,'retention_hold',id),released=hold&&custody.receipts.some(r=>r.kind==='retention_release'&&r.subject_id===hold.id);
 const escalation=latest(custody,'escalation_raise',id),cleared=escalation&&custody.receipts.some(r=>r.kind==='escalation_clear'&&r.subject_id===escalation.id);
 const archive=custody.receipts.find(r=>r.task_id===id&&(r.kind==='archive_restore'||r.kind==='archive_review'&&r.decision==='approve'));
 return {hold:!!hold&&!released,escalation:!!escalation&&!cleared,archived:archive?.kind==='archive_review'};
}
function queue(s){
 const today=new Date().toISOString().slice(0,10);
 return s.work.receipts.filter(r=>r.kind==='task_open').map(task=>{
  const id=task.id,c=state(s.custody,id);
  const plan=latest(s.sla,'retention_plan',id);
  const review=plan&&s.sla.receipts.find(r=>r.kind==='retention_review'&&r.subject_id===plan.id);
  const active=review?.decision==='approve'&&c.archived;
  const completed=active&&s.sla.receipts.some(r=>r.kind==='retention_check'&&r.subject_id===plan.id&&r.decision==='reviewed');
  const date=active?plan.review_on:null;
  const due=!!date&&date<=today&&!completed;
  const proof=latest(s.sla,'provider_readback',id);
  const witness=proof&&s.sla.receipts.find(r=>r.kind==='provider_review'&&r.subject_id===proof.id);
  const verified=!!(witness?.decision==='pass'&&witness.metadata_sha256===proof.metadata_sha256&&witness.actor_user_id!==proof.actor_user_id);
  const ack=s.ops.receipts.find(r=>r.kind==='review_ack'&&r.task_id===id&&r.plan_id===plan?.id);
  const confirm=ack&&s.ops.receipts.find(r=>r.kind==='review_confirm'&&r.subject_id===ack.id);
  return {task_id:id,order_id:task.order_id,plan_id:active?plan.id:null,
   review_on:date,due,legal_hold:c.hold,escalated:c.escalation,
   provider_original_verified:verified,provider_enrollment_status:proof?verified?'INDEPENDENT_READBACK_RECORDED':'SECOND_ADMIN_REQUIRED':'ORIGINAL_PROVIDER_REPLY_REQUIRED',
   retention_status:!active?'NO_APPROVED_SCHEDULE':completed?'ORIGINAL_REVIEW_COMPLETED':due?c.hold?'DUE_LEGAL_HOLD':'DUE_OWNER_ACTION':'SCHEDULED',
   operator_ack_id:ack?.id||null,independent_confirmation:!!(confirm&&confirm.actor_user_id!==ack.actor_user_id),
   no_automatic_customer_contact:true,no_auto_delete:true};
 }).filter(x=>x.plan_id||x.provider_enrollment_status!=='INDEPENDENT_READBACK_RECORDED')
 .sort((a,b)=>Number(b.due)-Number(a.due)||Number(b.legal_hold)-Number(a.legal_hold)||
  String(a.review_on||'9999').localeCompare(String(b.review_on||'9999'))).slice(0,60);
}
const note=x=>typeof x==='string'&&x.length>=20&&x.length<=350&&!/@|https?:|[<>]/i.test(x);
export async function onRequestGet(ctx){
 const {db,error}=auth(ctx);if(error)return error;
 if(new URL(ctx.request.url).searchParams.has('dashboard753'))return exceptionGet(ctx,db);
 if(new URL(ctx.request.url).searchParams.has('witness754'))return witnessGet754(ctx,db);
 try{
  const s=await sources(db),all=queue(s);
  const view=new URL(ctx.request.url).searchParams.get('view')||'all';
  if(!['all','due','hold','enrollment'].includes(view))return response({code:'INVALID_VIEW'},400);
  const rows=all.filter(x=>view==='all'||view==='due'&&x.due||
   view==='hold'&&(x.legal_hold||x.escalated)||
   view==='enrollment'&&x.provider_enrollment_status!=='INDEPENDENT_READBACK_RECORDED');
  return response({version:s.ops.version,source_versions:{work:s.work.version,custody:s.custody.version,sla:s.sla.version},
   summary:{visible:all.length,due:all.filter(x=>x.due).length,legal_holds:all.filter(x=>x.legal_hold).length,
    independent_provider_readbacks:all.filter(x=>x.provider_original_verified).length,
    waiting_provider:all.filter(x=>x.provider_enrollment_status!=='INDEPENDENT_READBACK_RECORDED').length,
    independently_confirmed_operations:all.filter(x=>x.independent_confirmation).length},
   rows,receipts:s.ops.receipts.slice(0,50).map(r=>({id:r.id,task_id:r.task_id,plan_id:r.plan_id,
    kind:r.kind,subject_id:r.subject_id||null,recorded_at:r.recorded_at,actor_user_id:r.actor_user_id})),
   scheduled_queue_evaluated_at:new Date().toISOString(),scheduler_type:'OWNER_OPENED_PRIVATE_QUEUE',
   unattended_cron:false,notification_sent:false,provider_write:false,purge:false});
 }catch{return response({code:'PRIVATE_SOURCE_HOLD',error:'Original custody source unavailable.'},503);}
}
export async function onRequestPost(ctx){
 const {db,admin,error}=auth(ctx);if(error)return error;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)
  return response({code:'SAME_ORIGIN_REQUIRED'},403);
 if(!/application\/json/i.test(ctx.request.headers.get('Content-Type')||''))
  return response({code:'JSON_REQUIRED'},415);
 let p;
 try{const body=await ctx.request.text();if(body.length>2000)throw Error();p=JSON.parse(body);}catch{return response({code:'BAD_JSON'},400);}
 if(['exception_raise','exception_review'].includes(p?.kind))return exceptionPost(ctx,db,admin,p);
 if(['witness_open','witness_confirm','retention_closure'].includes(p?.kind))return witnessPost754(ctx,db,admin,p);
 const kind=p?.kind,taskId=p?.task_id,planId=p?.plan_id,subjectId=p?.subject_id,requestId=p?.request_key;
 if(!['review_ack','review_confirm'].includes(kind)||!UUID.test(taskId||'')||
 !UUID.test(planId||'')||!UUID.test(requestId||'')||!note(p.note)||
 !Number.isSafeInteger(p.expected_version)||p.expected_version<0)
  return response({code:'INVALID_EVIDENCE'},400);
 try{
  const s=await sources(db),old=s.ops.receipts.find(r=>r.request_key===requestId);
  if(old)return response({code:'REQUEST_ALREADY_USED',receipt_id:old.id},409);
  if(s.ops.version!==p.expected_version)return response({code:'STALE_VERSION'},409);
  if(s.ops.receipts.length>=160)return response({code:'JOURNAL_FULL'},409);
  const item=queue(s).find(x=>x.task_id===taskId&&x.plan_id===planId);
  if(!item||!item.due)return response({code:'ORIGINAL_DUE_SCHEDULE_REQUIRED'},409);
  const approval=s.sla.receipts.find(r=>r.kind==='retention_review'&&r.subject_id===planId&&r.decision==='approve');
  if(!approval)return response({code:'INDEPENDENT_APPROVAL_REQUIRED'},409);
  const ack=s.ops.receipts.find(r=>r.kind==='review_ack'&&r.task_id===taskId&&r.plan_id===planId);
  if(kind==='review_ack'&&ack)return response({code:'ACK_ALREADY_RECORDED'},409);
  if(kind==='review_confirm'&&(!ack||subjectId!==ack.id||ack.actor_user_id===admin.user_id||
   s.ops.receipts.some(r=>r.kind==='review_confirm'&&r.subject_id===ack.id)))
   return response({code:'INDEPENDENT_CONFIRM_REQUIRED'},409);
  if(kind==='review_ack'&&admin.user_id===approval.actor_user_id)
   return response({code:'DISTINCT_REVIEWER_REQUIRED'},403);
  // Revalidate the original Order and Build 746 case revision before accepting custody.
  const task=s.work.receipts.find(r=>r.kind==='task_open'&&r.id===taskId);
  const currentOrder=await db.prepare('SELECT order_id,updated_at FROM orders WHERE order_id=? LIMIT 1').bind(item.order_id).first();
  if(!task||!currentOrder||currentOrder.updated_at!==task.source_order_updated_at)
   return response({code:'ORIGINAL_ORDER_CHANGED'},409);
  const caseDoc=unpack(await raw(db,'site.admin.aftersale.v746.'+item.order_id),746,30);
  if(caseDoc.version!==task.source_case_version||
   !caseDoc.receipts.some(r=>r.receipt_id===task.case_id&&r.source_order_id===item.order_id&&r.case_type===task.case_type))
   return response({code:'ORIGINAL_CASE_CHANGED'},409);
  // Fail closed if any underlying source journal changed during manual review.
  const snapshot=await sources(db);
  if(snapshot.work.version!==s.work.version||snapshot.custody.version!==s.custody.version||
   snapshot.sla.version!==s.sla.version)
   return response({code:'ORIGINAL_SOURCE_CHANGED'},409);
  const receipt={id:crypto.randomUUID(),kind,task_id:taskId,plan_id:planId,
   subject_id:kind==='review_confirm'?ack.id:null,actor_user_id:admin.user_id,
   request_key:requestId,note:p.note,recorded_at:new Date().toISOString(),
   source_versions:{work:s.work.version,custody:s.custody.version,sla:s.sla.version},
   legal_hold_at_review:item.legal_hold,escalation_at_review:item.escalated,
   operation_only:true,no_customer_message:true,no_purge:true};
  const next=JSON.stringify({schema:752,version:s.ops.version+1,receipts:[receipt,...s.ops.receipts]});
  if(next.length>110000)return response({code:'BYTES_CAP'},413);
  const result=s.opsRaw?
   await db.prepare("UPDATE app_settings SET setting_value=?,is_public=0,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE setting_key=? AND is_public=0 AND setting_value=?")
    .bind(next,admin.user_id,KEY,s.opsRaw).run():
   await db.prepare("INSERT INTO app_settings(setting_key,setting_value,is_public,updated_by_user_id,updated_at) VALUES(?,?,0,?,CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO NOTHING")
    .bind(KEY,next,admin.user_id).run();
  if(Number(result?.meta?.changes)!==1)return response({code:'CONCURRENT_CHANGE'},409);
  const readback=unpack(await raw(db,KEY),752,160);
  if(readback.receipts[0]?.id!==receipt.id)return response({code:'UNCERTAIN_WRITE'},503);
  await auditAdminAction(ctx.env,ctx.request,admin,{action_type:'retention_operations_752',
   target_type:'order',target_id:item.order_id,details:{kind,receipt_id:receipt.id}}).catch(()=>null);
  return response({saved:true,version:readback.version,receipt_id:receipt.id,
   no_external_send:true,no_purge:true,source_driven_due_review:true});
 }catch{return response({code:'PRIVATE_SOURCE_HOLD'},503);}
}


/** Build 753 — private source-derived care SLA exceptions and independent manual review.
 * All results are original D1 journal projections; no external provider call, send, deletion
 * or assertion of human sender identity. Production acceptance requires separate live proof.
 */
const EXCEPTIONS_KEY='site.admin.customerjourney.sla-exceptions.v753';
const hours=48*3600000,closeHours=72*3600000;
const isIso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x));
const exceptionDoc=async db=>{const original=await raw(db,EXCEPTIONS_KEY);
 return {original,doc:unpack(original,753,120)};};
export function projectCareExceptions753(s,receipts,clock=Date.now()){
 const dueByTask=new Map(queue(s).map(x=>[x.task_id,x]));
 return s.work.receipts.filter(r=>r.kind==='task_open').slice(0,60).map(t=>{
  const opened=isIso(t.recorded_at)?Date.parse(t.recorded_at):NaN;
  const proof=latest(s.sla,'provider_readback',t.id);
  const review=proof&&s.sla.receipts.find(r=>r.kind==='provider_review'&&r.subject_id===proof.id);
  const verified=!!(review?.decision==='pass'&&review.metadata_sha256===proof.metadata_sha256&&
   review.actor_user_id!==proof.actor_user_id);
  const received=verified&&isIso(proof.received_at)?Date.parse(proof.received_at):NaN;
  const close=s.sla.receipts.find(r=>r.kind==='sla_close'&&r.task_id===t.id);
  const reopen=close&&s.sla.receipts.find(r=>r.kind==='sla_reopen'&&r.subject_id===close.id);
  const closed=!!close&&!reopen,closedAt=closed&&isIso(close.recorded_at)?Date.parse(close.recorded_at):NaN;
  const retention=dueByTask.get(t.id),codes=[];
  if(!Number.isFinite(opened)||opened>clock+300000)codes.push('ORIGINAL_CLOCK_HOLD');
  else {
   if(!Number.isFinite(received)?clock-opened>hours:received-opened>hours)codes.push('REPLY_SLA_EXCEPTION');
   if(!Number.isFinite(closedAt)?clock-opened>closeHours:closedAt-opened>closeHours)codes.push('CLOSURE_SLA_EXCEPTION');
  }
  if(retention?.due&&!retention.independent_confirmation)codes.push('RETENTION_REVIEW_ESCALATION');
  if(retention?.legal_hold)codes.push('LEGAL_HOLD_REVIEW');
  if(retention?.escalated)codes.push('ORIGINAL_CUSTODY_ESCALATION');
  const actions=codes.map(code=>{
   const raised=receipts.find(r=>r.kind==='exception_raise'&&r.task_id===t.id&&r.exception_code===code);
   const inspected=raised&&receipts.find(r=>r.kind==='exception_review'&&r.subject_id===raised.id);
   return {code,status:!raised?'UNESCALATED':!inspected?'AWAITING_INDEPENDENT_REVIEW':
    inspected.decision==='pass'?'INDEPENDENTLY_REVIEWED':'INDEPENDENT_HOLD',
    raise_receipt_id:raised?.id||null,review_receipt_id:inspected?.id||null};
  });
  return {task_id:t.id,order_id:t.order_id,age_hours:Number.isFinite(opened)?
   Math.max(0,Math.floor((clock-opened)/3600000)):null,
   provider_thread_independently_reviewed:verified,closed_internal:closed,
   retention_due:!!retention?.due,retention_legal_hold:!!retention?.legal_hold,
   retention_original_confirmed:!!retention?.independent_confirmation,
   exceptions:actions,exception_count:codes.length};
 }).sort((a,b)=>b.exception_count-a.exception_count||(b.age_hours??0)-(a.age_hours??0));
}
const exceptionRows=projectCareExceptions753;
async function exceptionGet(ctx,db){
 const view=new URL(ctx.request.url).searchParams.get('view753')||'all';
 if(!['all','open','reviewed','retention'].includes(view))
  return response({build:753,code:'INVALID_EXCEPTION_VIEW'},400);
 try{
  const s=await sources(db),{doc}=await exceptionDoc(db),all=exceptionRows(s,doc.receipts);
  const rows=all.filter(r=>view==='all'||view==='retention'&&r.exceptions.some(e=>
   ['RETENTION_REVIEW_ESCALATION','LEGAL_HOLD_REVIEW'].includes(e.code))||
   view==='open'&&r.exceptions.some(e=>e.status!=='INDEPENDENTLY_REVIEWED')||
   view==='reviewed'&&r.exceptions.some(e=>e.status==='INDEPENDENTLY_REVIEWED')).slice(0,60);
  return response({build:753,version:doc.version,
   original_source_versions:{work:s.work.version,custody:s.custody.version,sla:s.sla.version,retention_ops:s.ops.version},
   summary:{tasks_scanned:all.length,tasks_with_exceptions:all.filter(r=>r.exception_count).length,
    reply_sla_exceptions:all.filter(r=>r.exceptions.some(e=>e.code==='REPLY_SLA_EXCEPTION')).length,
    closure_sla_exceptions:all.filter(r=>r.exceptions.some(e=>e.code==='CLOSURE_SLA_EXCEPTION')).length,
    retention_escalations:all.filter(r=>r.exceptions.some(e=>e.code==='RETENTION_REVIEW_ESCALATION')).length,
    independent_reviewed:doc.receipts.filter(r=>r.kind==='exception_review'&&r.decision==='pass').length},
   rows,receipts:doc.receipts.slice(0,60).map(r=>({id:r.id,kind:r.kind,task_id:r.task_id,
    exception_code:r.exception_code,decision:r.decision,subject_id:r.subject_id||null,
    recorded_at:r.recorded_at,actor_user_id:r.actor_user_id})),
   source_only:true,production_acceptance:'REQUIRES_INDEPENDENT_LIVE_WITNESS',
   human_sender_identity_verified:false,notification_sent:false,auto_purge:false});
 }catch{return response({build:753,code:'ORIGINAL_SOURCE_HOLD',error:'Private original evidence unavailable.'},503);}
}
async function exceptionPost(ctx,db,admin,p){
 const kind=p.kind,taskId=p.task_id,code=p.exception_code,key=p.request_key;
 const decision=kind==='exception_raise'?'raise':p.decision;
 if(!UUID.test(taskId||'')||!UUID.test(key||'')||
 !['REPLY_SLA_EXCEPTION','CLOSURE_SLA_EXCEPTION','RETENTION_REVIEW_ESCALATION',
   'LEGAL_HOLD_REVIEW','ORIGINAL_CUSTODY_ESCALATION','ORIGINAL_CLOCK_HOLD'].includes(code)||
 !note(p.note)||!Number.isSafeInteger(p.expected_version)||p.expected_version<0||
 (kind==='exception_review'&&!['pass','hold'].includes(decision)))
  return response({build:753,code:'INVALID_EXCEPTION_EVIDENCE'},400);
 if(kind==='exception_review'&&!UUID.test(p.subject_id||''))
  return response({build:753,code:'SUBJECT_REQUIRED'},400);
 try{
  const s=await sources(db),{doc,original}=await exceptionDoc(db);
  if(doc.receipts.some(r=>r.request_key===key))
   return response({build:753,code:'REQUEST_ALREADY_USED'},409);
  if(doc.version!==p.expected_version)return response({build:753,code:'STALE_VERSION'},409);
  if(doc.receipts.length>=120)return response({build:753,code:'JOURNAL_FULL'},409);
  const current=exceptionRows(s,doc.receipts).find(r=>r.task_id===taskId);
  if(!current?.exceptions.some(e=>e.code===code))
   return response({build:753,code:'ORIGINAL_EXCEPTION_NOT_ACTIVE'},409);
  const raised=doc.receipts.find(r=>r.kind==='exception_raise'&&r.task_id===taskId&&r.exception_code===code);
  if(kind==='exception_raise'&&raised)return response({build:753,code:'EXCEPTION_ALREADY_RAISED'},409);
  if(kind==='exception_review'&&(!raised||p.subject_id!==raised.id||
   raised.actor_user_id===admin.user_id||
   doc.receipts.some(r=>r.kind==='exception_review'&&r.subject_id===raised.id)))
   return response({build:753,code:'INDEPENDENT_REVIEW_REQUIRED'},409);
  const sourceTask=s.work.receipts.find(r=>r.kind==='task_open'&&r.id===taskId);
  const order=await db.prepare('SELECT order_id,updated_at FROM orders WHERE order_id=? LIMIT 1')
   .bind(sourceTask?.order_id).first();
  if(!order||order.updated_at!==sourceTask.source_order_updated_at)
   return response({build:753,code:'ORIGINAL_ORDER_CHANGED'},409);
  const caseDoc=unpack(await raw(db,'site.admin.aftersale.v746.'+sourceTask.order_id),746,30);
  if(caseDoc.version!==sourceTask.source_case_version||
   !caseDoc.receipts.some(r=>r.receipt_id===sourceTask.case_id&&
    r.source_order_id===sourceTask.order_id&&r.case_type===sourceTask.case_type))
   return response({build:753,code:'ORIGINAL_CASE_CHANGED'},409);
  const refreshed=await sources(db),pdoc=await exceptionDoc(db);
  if(refreshed.work.version!==s.work.version||refreshed.custody.version!==s.custody.version||
   refreshed.sla.version!==s.sla.version||refreshed.ops.version!==s.ops.version||
   pdoc.doc.version!==doc.version)
   return response({build:753,code:'SOURCE_CHANGED_RELOAD'},409);
  const receipt={id:crypto.randomUUID(),kind,task_id:taskId,exception_code:code,decision,
   subject_id:kind==='exception_review'?raised.id:null,actor_user_id:admin.user_id,
   request_key:key,note:p.note,recorded_at:new Date().toISOString(),
   source_versions:{work:s.work.version,custody:s.custody.version,sla:s.sla.version,retention_ops:s.ops.version},
   private_custody_only:true,no_customer_message:true,no_purge:true};
  const next=JSON.stringify({schema:753,version:doc.version+1,receipts:[receipt,...doc.receipts]});
  if(next.length>105000)return response({build:753,code:'EVIDENCE_BYTES_CAP'},413);
  const result=original?
   await db.prepare('UPDATE app_settings SET setting_value=?,is_public=0,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE setting_key=? AND is_public=0 AND setting_value=?')
    .bind(next,admin.user_id,EXCEPTIONS_KEY,original).run():
   await db.prepare('INSERT INTO app_settings(setting_key,setting_value,is_public,updated_by_user_id,updated_at) VALUES(?,?,0,?,CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO NOTHING')
    .bind(EXCEPTIONS_KEY,next,admin.user_id).run();
  if(Number(result?.meta?.changes)!==1)return response({build:753,code:'CONCURRENT_SOURCE_CHANGE'},409);
  const saved=await exceptionDoc(db);
  if(saved.doc.receipts[0]?.id!==receipt.id)return response({build:753,code:'UNCERTAIN_WRITE'},503);
  await auditAdminAction(ctx.env,ctx.request,admin,{action_type:'customer_care_sla_exception_753',
   target_type:'order',target_id:sourceTask.order_id,
   details:{kind,code,receipt_id:receipt.id}}).catch(()=>null);
  return response({build:753,saved:true,version:saved.doc.version,receipt_id:receipt.id,
   independent_review:kind==='exception_review',no_external_send:true,no_purge:true});
 }catch{return response({build:753,code:'ORIGINAL_SOURCE_HOLD'},503);}
}


/** Build 754 — production-origin field witness, two verified-Admin certification and
 * internal retention-review closure. No provider sends, customer messages, legal
 * determination, D1 schema change or data deletion. Source of truth is original D1.
 */
const WITNESS754='site.admin.customerjourney.production-witness.v754';
const WITNESS_CODES=new Set(['REPLY_SLA_EXCEPTION','CLOSURE_SLA_EXCEPTION',
 'RETENTION_REVIEW_ESCALATION','LEGAL_HOLD_REVIEW','ORIGINAL_CUSTODY_ESCALATION','ORIGINAL_CLOCK_HOLD']);
const versions754=(s,e)=>({work:s.work.version,custody:s.custody.version,
 sla:s.sla.version,retention_ops:s.ops.version,exceptions:e.version});
const sameVersions754=(a,b)=>!!a&&!!b&&Object.keys(a).length===Object.keys(b).length&&
 Object.keys(a).every(k=>Number.isSafeInteger(a[k])&&a[k]===b[k]);
export async function productionMarker754(ctx){
 if(ctx?.env?.DND_ENVIRONMENT!=='production'||typeof ctx?.env?.ASSETS?.fetch!=='function')
  return {ok:false,code:'ORIGINAL_PRODUCTION_BINDING_REQUIRED'};
 try{
  const u=new URL('/release-version.json',ctx.request.url);
  const resp=await ctx.env.ASSETS.fetch(new Request(u.toString(),{method:'GET'}));
  if(!resp.ok)return {ok:false,code:'IMMUTABLE_SOURCE_MARKER_MISSING'};
  const txt=await resp.text();
  if(txt.length>1000)return {ok:false,code:'SOURCE_MARKER_TOO_LARGE'};
  const marker=JSON.parse(txt);
  if(marker.branch!=='main'||!/^[0-9a-f]{40}$/.test(String(marker.source_sha||''))||
   !/^[1-9][0-9]{0,15}$/.test(String(marker.workflow_run_id||'')))
   return {ok:false,code:'LIVE_MAIN_COMMIT_UNVERIFIED'};
  return {ok:true,source_sha:marker.source_sha,workflow_run_id:String(marker.workflow_run_id),
   proof_kind:'SERVER_BOUND_PRODUCTION_RELEASE_ASSET',cloudflare_control_plane_verified_here:false};
 }catch{return {ok:false,code:'IMMUTABLE_SOURCE_READ_FAILED'};}
}
const receiptDoc754=async db=>{const original=await raw(db,WITNESS754);
 return {original,doc:unpack(original,754,100)};};
export function assessCareWitness754(s,e,w,taskId,code,marker){
 const task=s.work.receipts.find(r=>r.kind==='task_open'&&r.id===taskId);
 const original=e.receipts.find(r=>r.kind==='exception_raise'&&r.task_id===taskId&&r.exception_code===code);
 const reviewer=original&&e.receipts.find(r=>r.kind==='exception_review'&&r.subject_id===original.id);
 const independentlyReviewed=!!(reviewer?.decision==='pass'&&reviewer.actor_user_id!==original.actor_user_id);
 const opened=w.receipts.find(r=>r.kind==='witness_open'&&r.task_id===taskId&&r.exception_code===code);
 const confirm=opened&&w.receipts.find(r=>r.kind==='witness_confirm'&&r.subject_id===opened.id);
 const versions=versions754(s,e);
 const validWitness=!!(opened&&confirm&&confirm.actor_user_id!==opened.actor_user_id&&
  opened.source_sha===marker?.source_sha&&confirm.source_sha===marker?.source_sha&&
  sameVersions754(opened.source_versions,versions)&&sameVersions754(confirm.source_versions,versions));
 const c=state(s.custody,taskId);
 const plan=latest(s.sla,'retention_plan',taskId);
 const approval=plan&&s.sla.receipts.find(r=>r.kind==='retention_review'&&r.subject_id===plan.id&&r.decision==='approve');
 const completed=plan&&s.sla.receipts.find(r=>r.kind==='retention_check'&&r.subject_id===plan.id&&r.decision==='reviewed');
 const ack=plan&&s.ops.receipts.find(r=>r.kind==='review_ack'&&r.task_id===taskId&&r.plan_id===plan.id);
 const second=ack&&s.ops.receipts.find(r=>r.kind==='review_confirm'&&r.subject_id===ack.id&&r.actor_user_id!==ack.actor_user_id);
 const legalHold=!!c.hold||!!c.escalation;
 const retentionReady=!!(marker?.ok&&task&&independentlyReviewed&&validWitness&&
  ['RETENTION_REVIEW_ESCALATION','LEGAL_HOLD_REVIEW'].includes(code)&&
  plan&&approval&&completed&&ack&&second&&c.archived&&!legalHold);
 const closure=w.receipts.find(r=>r.kind==='retention_closure'&&r.task_id===taskId&&r.subject_id===confirm?.id);
 const closureValid=!!(closure&&retentionReady&&closure.source_sha===marker.source_sha&&
  sameVersions754(closure.source_versions,versions));
 return {task_id:taskId,order_id:task?.order_id||null,exception_code:code,
  original_exception_id:original?.id||null,original_independent_review_id:independentlyReviewed?reviewer?.id:null,
  first_witness_receipt_id:opened?.id||null,second_witness_receipt_id:confirm?.id||null,
  two_admin_live_certified:validWitness&&independentlyReviewed,
  source_versions:versions,source_current:validWitness,
  retention_plan_id:plan?.id||null,original_retention_check_id:completed?.id||null,
  original_retention_ack_id:ack?.id||null,original_retention_confirmation_id:second?.id||null,
  legal_hold:!!c.hold,custody_escalation:!!c.escalation,
  retention_review_closure_ready:retentionReady,
  original_internal_retention_closure_id:closureValid?closure.id:null,
  production_source_status:marker?.ok?'PRODUCTION_SOURCE_BOUND':'HOLD_ORIGINAL_PRODUCTION',
  no_legal_purge_authority:true,human_sender_unproven:true};
}
function candidates754(s,e,w,marker){
 return e.receipts.filter(r=>r.kind==='exception_raise'&&WITNESS_CODES.has(r.exception_code))
  .slice(0,60).map(r=>assessCareWitness754(s,e,w,r.task_id,r.exception_code,marker));
}
async function witnessGet754(ctx,db){
 try{
  const marker=await productionMarker754(ctx),[s,{doc:e},{doc:w}]=await Promise.all([
   sources(db),exceptionDoc(db),receiptDoc754(db)]);
  const rows=candidates754(s,e,w,marker);
  return response({build:754,version:w.version,production_marker:marker,source_versions:versions754(s,e),
   summary:{source_exceptions:rows.length,independent_original_reviews:rows.filter(r=>r.original_independent_review_id).length,
    two_admin_field_certificates:rows.filter(r=>r.two_admin_live_certified).length,
    retention_closure_ready:rows.filter(r=>r.retention_review_closure_ready).length,
    original_internal_retention_closed:rows.filter(r=>r.original_internal_retention_closure_id).length},
   rows,receipts:w.receipts.slice(0,60).map(r=>({id:r.id,kind:r.kind,task_id:r.task_id,
    exception_code:r.exception_code,subject_id:r.subject_id||null,actor_user_id:r.actor_user_id,
    recorded_at:r.recorded_at,source_sha:r.source_sha})),
   field_certification:marker.ok?'REQUIRES_ORIGINAL_TWO_ADMIN_RECEIPTS':'HOLD_NO_LIVE_SOURCE',
   statutory_retention_compliance_not_certified:true,provider_write:false,notification_sent:false,records_deleted:false});
 }catch{return response({build:754,code:'ORIGINAL_SOURCE_HOLD'},503);}
}
async function witnessPost754(ctx,db,admin,p){
 const kind=p.kind,taskId=p.task_id,code=p.exception_code,key=p.request_key;
 if(!UUID.test(taskId||'')||!WITNESS_CODES.has(code)||!UUID.test(key||'')||!note(p.note)||
  !Number.isSafeInteger(p.expected_version)||p.expected_version<0||
  (kind!=='witness_open'&&!UUID.test(p.subject_id||'')))
  return response({build:754,code:'INVALID_ORIGINAL_WITNESS_EVIDENCE'},400);
 const marker=await productionMarker754(ctx);
 if(!marker.ok)return response({build:754,code:marker.code,error:'Original main production source not proved.'},409);
 try{
  const s=await sources(db),{doc:e}=await exceptionDoc(db),{doc:w,original}=await receiptDoc754(db);
  if(w.receipts.some(r=>r.request_key===key))return response({build:754,code:'REQUEST_ALREADY_USED'},409);
  if(w.version!==p.expected_version)return response({build:754,code:'STALE_WITNESS_VERSION'},409);
  if(w.receipts.length>=100)return response({build:754,code:'WITNESS_JOURNAL_FULL'},409);
  const status=assessCareWitness754(s,e,w,taskId,code,marker);
  if(!status.order_id||!status.original_independent_review_id)
   return response({build:754,code:'INDEPENDENT_ORIGINAL_753_REVIEW_REQUIRED'},409);
  const opened=w.receipts.find(r=>r.kind==='witness_open'&&r.task_id===taskId&&r.exception_code===code);
  const confirmed=opened&&w.receipts.find(r=>r.kind==='witness_confirm'&&r.subject_id===opened.id);
  if(kind==='witness_open'&&opened)return response({build:754,code:'WITNESS_ALREADY_OPENED'},409);
  if(kind==='witness_confirm'&&(!opened||confirmed||p.subject_id!==opened.id||
   opened.actor_user_id===admin.user_id||opened.source_sha!==marker.source_sha||
   !sameVersions754(opened.source_versions,versions754(s,e))))
   return response({build:754,code:'SECOND_ORIGINAL_ADMIN_OR_FRESH_SOURCE_REQUIRED'},409);
  if(kind==='retention_closure'&&(!status.retention_review_closure_ready||!confirmed||
   p.subject_id!==confirmed.id||w.receipts.some(r=>r.kind==='retention_closure'&&
   r.task_id===taskId&&r.subject_id===confirmed.id)))
   return response({build:754,code:'ORIGINAL_RETENTION_CLOSURE_HOLD'},409);
  const t=s.work.receipts.find(r=>r.kind==='task_open'&&r.id===taskId);
  const order=await db.prepare('SELECT order_id,updated_at FROM orders WHERE order_id=? LIMIT 1')
   .bind(t.order_id).first();
  if(!order||order.updated_at!==t.source_order_updated_at)
   return response({build:754,code:'ORIGINAL_ORDER_CHANGED'},409);
  const caseDoc=unpack(await raw(db,'site.admin.aftersale.v746.'+t.order_id),746,30);
  if(caseDoc.version!==t.source_case_version||!caseDoc.receipts.some(r=>
   r.receipt_id===t.case_id&&r.source_order_id===t.order_id&&r.case_type===t.case_type))
   return response({build:754,code:'ORIGINAL_CASE_CHANGED'},409);
  const fresh=await sources(db),ee=await exceptionDoc(db),ww=await receiptDoc754(db);
  const observed=await productionMarker754(ctx);
  if(!observed.ok||observed.source_sha!==marker.source_sha||
   !sameVersions754(versions754(fresh,ee.doc),versions754(s,e))||ww.doc.version!==w.version)
   return response({build:754,code:'ORIGINAL_SOURCE_CHANGED_RELOAD'},409);
  const receipt={id:crypto.randomUUID(),kind,task_id:taskId,exception_code:code,
   subject_id:kind==='witness_open'?null:p.subject_id,actor_user_id:admin.user_id,
   request_key:key,note:p.note,recorded_at:new Date().toISOString(),
   source_sha:marker.source_sha,workflow_run_id:marker.workflow_run_id,
   source_versions:versions754(s,e),original_exception_id:status.original_exception_id,
   original_independent_review_id:status.original_independent_review_id,
   operation_only:true,provider_write:false,customer_notified:false,records_deleted:false};
  const next=JSON.stringify({schema:754,version:w.version+1,receipts:[receipt,...w.receipts]});
  if(next.length>100000)return response({build:754,code:'WITNESS_BYTES_CAP'},413);
  const result=original?
   await db.prepare('UPDATE app_settings SET setting_value=?,is_public=0,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE setting_key=? AND is_public=0 AND setting_value=?')
    .bind(next,admin.user_id,WITNESS754,original).run():
   await db.prepare('INSERT INTO app_settings(setting_key,setting_value,is_public,updated_by_user_id,updated_at) VALUES(?,?,0,?,CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO NOTHING')
    .bind(WITNESS754,next,admin.user_id).run();
  if(Number(result?.meta?.changes)!==1)return response({build:754,code:'CONCURRENT_SOURCE_CHANGE'},409);
  const readback=await receiptDoc754(db);
  if(readback.doc.receipts[0]?.id!==receipt.id)
   return response({build:754,code:'UNCERTAIN_WITNESS_WRITE'},503);
  await auditAdminAction(ctx.env,ctx.request,admin,{action_type:'customer_care_original_field_witness_754',
   target_type:'order',target_id:status.order_id,
   details:{kind,receipt_id:receipt.id,source_sha:marker.source_sha}}).catch(()=>null);
  return response({build:754,saved:true,version:readback.doc.version,receipt_id:receipt.id,
   live_source_sha:marker.source_sha,no_customer_contact:true,no_provider_write:true,no_purge:true,
   legal_retention_determination:false});
 }catch{return response({build:754,code:'ORIGINAL_SOURCE_HOLD'},503);}
}
