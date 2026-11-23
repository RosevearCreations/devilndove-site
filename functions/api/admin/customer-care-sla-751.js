/** Build 751 — original Resend received/sent reply thread, private SLA and manual retention calendar.
 * Admin-initiated read-only provider metadata only. Never send, delete, bill or store email bodies.
 */
import {getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
const KEY='site.admin.customerjourney.provider-sla.v751',WORK='site.admin.customerjourney.workqueue.v749',
 CUSTODY='site.admin.customerjourney.carecustody.v750',CASE=id=>'site.admin.aftersale.v746.'+id;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KINDS={provider_readback:['readback'],provider_review:['pass','hold'],
 sla_close:['close'],sla_reopen:['reopen'],retention_plan:['propose'],
 retention_review:['approve','hold'],retention_check:['reviewed','hold']};
const cut=(v,n)=>String(v??'').trim().slice(0,n+1);
const evidence=(v,min,max)=>{const x=cut(v,max);
 return x.length>=min&&x.length<=max&&!/@|https?:|[<>]|\b(?:\d[ -]*?){9,}\b/i.test(x)?x:null;};
const now=()=>new Date().toISOString();
const day=d=>Math.round((Date.parse(d+'T00:00:00Z')-Date.parse(now().slice(0,10)+'T00:00:00Z'))/86400000);
const dateValid=d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d+'T00:00:00Z'))&&
 new Date(Date.parse(d+'T00:00:00Z')).toISOString().slice(0,10)===d&&day(d)>=-30&&day(d)<=730;
const address=v=>{const s=String(v??'').trim().toLowerCase(),m=s.match(/<([^<>]+)>$/);
 const a=(m?m[1]:s).trim();return a.length<=254&&/^[^\s@<>,;]{1,64}@[^\s@<>,;]+\.[a-z0-9.-]+$/i.test(a)?a:null;};
const mid=x=>String(x??'').trim().replace(/^<|>$/g,'').toLowerCase();
const stamp=x=>typeof x==='string'&&x.length<=40&&x.startsWith('20')&&Number.isFinite(Date.parse(x));
const hash=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x))),
 b=>b.toString(16).padStart(2,'0')).join('');
const reply=(x,status=200)=>jsonResponse({ok:status<400,build:751,...x},status,{
 'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff',
 'X-Robots-Tag':'noindex,nofollow,noarchive','Vary':'Cookie','Referrer-Policy':'no-referrer'});
function authorized(ctx){const admin=verifiedAdminFromModule(ctx),db=getDb(ctx.env);
 if(!admin)return{error:reply({code:'ADMIN_REQUIRED',error:'Active verified Storefront Admin required.'},403)};
 if(!db)return{error:reply({code:'D1_UNAVAILABLE',error:'Private original D1 unavailable.'},503)};
 return{admin,db};}
async function row(db,key){return db.prepare('SELECT setting_value,is_public FROM app_settings WHERE setting_key=? LIMIT 1').bind(key).first();}
function parse(r,schema,cap){if(!r)return{schema,version:0,receipts:[]};
 if(Number(r.is_public)!==0)throw Error('Original private visibility conflict');
 const j=JSON.parse(r.setting_value);
 if(j?.schema!==schema||!Number.isSafeInteger(j.version)||j.version<0||
 !Array.isArray(j.receipts)||j.receipts.length>cap)throw Error('Original private receipt structure invalid');
 return j;}
async function journals(db){const [row751,row749,row750]=await Promise.all([row(db,KEY),row(db,WORK),row(db,CUSTODY)]);
 return{row751,doc:parse(row751,751,110),work:parse(row749,749,120),custody:parse(row750,750,120)};}
const latest=(doc,kind,id)=>doc.receipts.find(x=>x.kind===kind&&x.task_id===id)||null;
const task=(work,id)=>work.receipts.find(x=>x.kind==='task_open'&&x.id===id)||null;
function custodyState(c,id){
 const h=latest(c,'retention_hold',id),release=h&&c.receipts.find(x=>x.kind==='retention_release'&&x.subject_id===h.id);
 const esc=latest(c,'escalation_raise',id),clear=esc&&c.receipts.find(x=>x.kind==='escalation_clear'&&x.subject_id===esc.id);
 const archive=c.receipts.find(x=>x.task_id===id&&(x.kind==='archive_restore'||x.kind==='archive_review'&&x.decision==='approve'));
 return{held:!!h&&!release,escalated:!!esc&&!clear,archived:archive?.kind==='archive_review',
  archive_id:archive?.id||null,original_review_on:archive?.kind==='archive_review'?archive.retention_review_on:null};}
function followup(w,id){const e=w.receipts.find(x=>x.subject_id===id&&
 ['review_followup','task_progress','task_reopen'].includes(x.kind));
 return e?.kind==='review_followup'&&e.decision==='pass'?e:null;}
async function original(db,w,id){
 const t=task(w,id);if(!t)return{code:'TASK_NOT_FOUND',error:'Original Build 749 task absent.',status:404};
 const order=await db.prepare('SELECT order_id,updated_at,customer_email FROM orders WHERE order_id=? LIMIT 1').bind(t.order_id).first();
 if(!order)return{code:'ORDER_NOT_FOUND',error:'Original canonical Order absent.',status:409};
 const cases=parse(await row(db,CASE(t.order_id)),746,30),
 source=cases.receipts.find(x=>x.receipt_id===t.case_id&&x.source_order_id===t.order_id);
 if(!source)return{code:'CASE_NOT_FOUND',error:'Original Build 746 case absent.',status:409};
 return{t,order,source_current:order.updated_at===t.source_order_updated_at&&
 cases.version===t.source_case_version&&source.case_type===t.case_type,followup:followup(w,id)};}
const cfg=e=>({key:String(e?.RESEND_API_KEY||'').trim(),inbox:address(e?.CARE_INBOUND_EMAIL_751)});
async function providerGet(env,path){
 const {key,inbox}=cfg(env);if(!key||!inbox)throw Error('PROVIDER_UNENROLLED');
 const ac=new AbortController(),timeout=setTimeout(()=>ac.abort(),7500);
 try{const res=await fetch('https://api.resend.com/'+path,{
  method:'GET',redirect:'error',headers:{Authorization:'Bearer '+key,Accept:'application/json'},signal:ac.signal});
  if(!res.ok||Number(res.headers.get('content-length')||'0')>550000)throw Error('PROVIDER_UNAVAILABLE');
  const raw=await res.text();if(raw.length>550000)throw Error('PROVIDER_OVERSIZE');
  return JSON.parse(raw);
 }finally{clearTimeout(timeout);}}
async function providerRead(db,env,order,inboundId,outboundId){
 const {key,inbox}=cfg(env),customer=address(order.customer_email);
 if(!key||!inbox)return{code:'PROVIDER_NOT_ENROLLED',error:'Resend API key and CARE_INBOUND_EMAIL_751 must be configured before readback.'};
 if(!customer)return{code:'ORDER_EMAIL_REQUIRED',error:'Original Order has no valid customer email.'};
 const original=await db.prepare("SELECT notification_outbox_id,provider_message_id,status FROM notification_outbox WHERE related_order_id=? AND provider_message_id=? AND channel='email' AND status='sent' AND LOWER(TRIM(destination))=? LIMIT 1")
  .bind(order.order_id,outboundId,customer).first();
 if(!original)return{code:'ORIGINAL_OUTBOUND_REQUIRED',error:'Original genuinely sent notification linked to this Order and customer is missing.'};
 let incoming,sent;
 try{[incoming,sent]=await Promise.all([providerGet(env,'emails/receiving/'+inboundId),providerGet(env,'emails/'+outboundId)]);}
 catch{return{code:'PROVIDER_UNAVAILABLE',error:'Live read-only provider fetch failed. No provider evidence accepted.'};}
 if(incoming?.id!==inboundId||sent?.id!==outboundId||
 address(incoming.from)!==customer||!Array.isArray(incoming.to)||!incoming.to.some(x=>address(x)===inbox)||
 !Array.isArray(sent.to)||!sent.to.some(x=>address(x)===customer)||!address(sent.from))
 return{code:'ORIGINAL_PARTIES_MISMATCH',error:'Original Order, sender, controlled inbox or provider outbound recipient mismatch.'};
 const replyId=incoming.headers?.['in-reply-to']||incoming.headers?.['In-Reply-To'];
 if(!replyId||!sent.message_id||mid(replyId)!==mid(sent.message_id)||
 !incoming.message_id||!stamp(incoming.created_at)||!stamp(sent.created_at))
 return{code:'ORIGINAL_THREAD_MISMATCH',error:'Received email does not reference the exact Resend sent Message-ID.'};
 if(String(incoming.authentication?.dmarc||'').toLowerCase()!=='pass')
 return{code:'DMARC_HOLD',error:'Incoming original provider email must have DMARC pass; identity remains separately unproven.'};
 const recv=Date.parse(incoming.created_at),sentTime=Date.parse(sent.created_at);
 if(recv<sentTime||recv>Date.now()+300000)
 return{code:'ORIGINAL_CHRONOLOGY_HOLD',error:'Provider timestamps inconsistent; hold original reply claim.'};
 const fingerprint=[order.order_id,original.notification_outbox_id,inboundId,outboundId,
 mid(sent.message_id),mid(incoming.message_id),new Date(sentTime).toISOString(),
 new Date(recv).toISOString(),customer,inbox,'dmarc-pass'].join('|');
 return{ok:true,received_email_id:inboundId,outbound_email_id:outboundId,
  notification_outbox_id:original.notification_outbox_id,
  received_at:new Date(recv).toISOString(),sent_at:new Date(sentTime).toISOString(),
  metadata_sha256:await hash(fingerprint),customer_hash:await hash(customer),
  inbox_hash:await hash(inbox),provider_thread_metadata_authentic:true,
  independently_proven_human_sender:false,provider_send_performed:false};
}
function providerState(doc,id){
 const proof=latest(doc,'provider_readback',id);
 const review=proof&&doc.receipts.find(x=>x.kind==='provider_review'&&x.subject_id===proof.id);
 const verified=!!(review?.decision==='pass'&&review?.metadata_sha256===proof?.metadata_sha256&&
  review.actor_user_id!==proof.actor_user_id);
 const close=doc.receipts.find(x=>x.kind==='sla_close'&&x.task_id===id);
 const reopen=close&&doc.receipts.find(x=>x.kind==='sla_reopen'&&x.subject_id===close.id);
 return{proof,review,verified,close,closed:!!close&&!reopen};}
function retentionState(doc,id,ct){
 const plan=latest(doc,'retention_plan',id),review=plan&&doc.receipts.find(x=>x.kind==='retention_review'&&x.subject_id===plan.id);
 const active=review?.decision==='approve',reviewOn=active?plan.review_on:ct.original_review_on;
 const check=active&&doc.receipts.find(x=>x.kind==='retention_check'&&x.subject_id===plan.id);
 return{plan,review,active,reviewOn,check,due:!!reviewOn&&day(reviewOn)<=0,soon:!!reviewOn&&day(reviewOn)>=0&&day(reviewOn)<=7};}
function state(doc,work,custody,id,src=null){
 const t=task(work,id);if(!t)return null;
 const p=providerState(doc,id),ct=custodyState(custody,id),rs=retentionState(doc,id,ct);
 const begin=Date.parse(t.recorded_at||''),at=Date.parse(p.proof?.received_at||'');
 const minutes=Number.isFinite(begin)&&Number.isFinite(at)&&at>=begin?Math.floor((at-begin)/60000):null;
 const closedAt=Date.parse(p.close?.recorded_at||'');
 const closeMinutes=p.closed&&Number.isFinite(begin)&&Number.isFinite(closedAt)&&closedAt>=begin?
  Math.floor((closedAt-begin)/60000):null;
 return{task_id:id,order_id:t.order_id,provider_state:!p.proof?'HOLD_NO_NATIVE_READBACK':
  !p.verified?'HOLD_SECOND_ADMIN_READBACK_REVIEW':p.closed?'INTERNALLY_CLOSED_PROVIDER_LINKED_CASE':
  'REVIEWED_PROVIDER_THREAD_FOLLOWUP_OPEN',
  provider_receipt_id:p.proof?.id||null,provider_review_id:p.review?.id||null,
  independently_reviewed_provider_thread:p.verified,internally_closed:p.closed,
  closed_receipt_id:p.close?.id||null,first_reply_minutes:minutes,
  reply_target_minutes:2880,reply_sla:minutes===null?'HOLD_MISSING_TIME':
   minutes<=2880?'WITHIN_TARGET':'BEYOND_TARGET',
  closed_loop_minutes:closeMinutes,close_target_minutes:4320,
  close_sla:closeMinutes===null?'HOLD_NOT_CLOSED':closeMinutes<=4320?'WITHIN_TARGET':'BEYOND_TARGET',
  retention_review_on:rs.reviewOn,retention_due:rs.due,retention_soon:rs.soon,
  retention_schedule_id:rs.plan?.id||null,retention_approval_id:rs.review?.id||null,
  retention_last_check_id:rs.check?.id||null,archived:ct.archived,
  legal_hold:ct.held,unresolved_escalation:ct.escalated,
  original_source:src?src.source_current?'CURRENT':'HOLD_CHANGED':'NOT_RECHECKED_IN_SUMMARY',
  followup_review_id:src?.followup?.id||null,
  provider_cannot_verify_human_identity:true,customer_reply_body_not_stored:true,
  reminders_sent:false,auto_purge:false};}
const safeReceipt=x=>({id:x.id,kind:x.kind,decision:x.decision,task_id:x.task_id,
 subject_id:x.subject_id||null,actor_user_id:x.actor_user_id,recorded_at:x.recorded_at,
 received_email_id:x.received_email_id||null,outbound_email_id:x.outbound_email_id||null,
 metadata_sha256:x.metadata_sha256||null,received_at:x.received_at||null,
 review_on:x.review_on||null,source_reference:x.source_reference,note:x.note,
 raw_email_stored:false,customer_notified:false,deleted:false});
export async function onRequestGet(ctx){
 const {db,error}=authorized(ctx);if(error)return error;
 const url=new URL(ctx.request.url),taskId=url.searchParams.get('task_id'),view=url.searchParams.get('view')||'all';
 if(taskId&&!UUID.test(taskId))return reply({code:'TASK_ID_REQUIRED',error:'Original UUID required.'},400);
 if(!['all','due','open','closed'].includes(view))return reply({code:'INVALID_VIEW',error:'All, due, open or closed only.'},400);
 try{const {doc,work,custody}=await journals(db);
  const all=work.receipts.filter(x=>x.kind==='task_open').slice(0,35).map(x=>state(doc,work,custody,x.id));
  const rows=all.filter(x=>view==='all'||view==='due'&&x.retention_due||
   view==='open'&&!x.internally_closed||view==='closed'&&x.internally_closed);
  rows.sort((a,b)=>Number(b.retention_due)-Number(a.retention_due)||
   Number(b.unresolved_escalation)-Number(a.unresolved_escalation)||a.order_id-b.order_id);
  let selected=null;
  if(taskId){const src=await original(db,work,taskId);
   if(src.code)return reply({code:src.code,error:src.error},src.status);
   selected=state(doc,work,custody,taskId,src);}
  return reply({version:doc.version,provider_configured:!!cfg(ctx.env).key&&!!cfg(ctx.env).inbox,
   rows,selected,summary:{tasks:all.length,provider_threads_reviewed:all.filter(x=>x.independently_reviewed_provider_thread).length,
    internally_closed:all.filter(x=>x.internally_closed).length,
    retention_due:all.filter(x=>x.retention_due).length,
    retention_soon:all.filter(x=>x.retention_soon).length},
   receipts:doc.receipts.filter(x=>!taskId||x.task_id===taskId).slice(0,65).map(safeReceipt),
   no_provider_fetch_on_get:true,no_auto_reminders:true,customer_notified:false,
   human_sender_independently_identified:false});}
 catch{return reply({code:'PRIVATE_SOURCE_HOLD',error:'Original source unavailable. No provider outcome presumed.'},503);}
}
export async function onRequestPost(ctx){
 const {db,admin,error}=authorized(ctx);if(error)return error;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)
  return reply({code:'SAME_ORIGIN_REQUIRED',error:'Verified same-origin Admin required.'},403);
 if(!/application\/json/i.test(ctx.request.headers.get('Content-Type')||''))
  return reply({code:'JSON_REQUIRED',error:'JSON original evidence required.'},415);
 let body;
 try{const raw=await ctx.request.text();if(raw.length>4000)throw Error('too large');body=JSON.parse(raw);}
 catch{return reply({code:'BAD_JSON',error:'Bounded JSON source required.'},400);}
 if(!body||typeof body!=='object'||Array.isArray(body))return reply({code:'BAD_INPUT',error:'JSON object required.'},400);
 const input={kind:cut(body.kind,30),decision:cut(body.decision,20),
  task_id:cut(body.task_id,80),subject_id:cut(body.subject_id,80),
  inbound_id:cut(body.inbound_id,60).toLowerCase(),outbound_id:cut(body.outbound_id,60).toLowerCase(),
  review_on:cut(body.review_on,12),
  source_reference:evidence(body.source_reference,8,160),note:evidence(body.note,20,450)};
 const key=cut(body.request_key,60),version=Number(body.expected_version);
 if(!KINDS[input.kind]?.includes(input.decision)||!UUID.test(input.task_id)||!UUID.test(key)||
 !Number.isSafeInteger(version)||version<0||!input.source_reference||!input.note)
  return reply({code:'INVALID_EVIDENCE',error:'Current source/version, unique request UUID and factual references required.'},400);
 const fingerprint=JSON.stringify({...input,owner_clicked_readback:body.owner_clicked_readback===true});
 try{const {row751,doc,work,custody}=await journals(db);
  const prior=doc.receipts.find(x=>x.request_key===key);
  if(prior)return prior.actor_user_id===admin.user_id&&prior.fingerprint===fingerprint?
   reply({replayed:true,receipt:safeReceipt(prior),current_version:doc.version}):
   reply({code:'REQUEST_CONFLICT',error:'Request UUID reused for different source.'},409);
  if(doc.version!==version)return reply({code:'STALE',error:'Private journal changed; reload before save.'},409);
  if(doc.receipts.length>=110)return reply({code:'JOURNAL_FULL',error:'Immutable journal cap reached; no deletion.'},409);
  const src=await original(db,work,input.task_id);
  if(src.code)return reply({code:src.code,error:src.error},src.status);
  if(!src.source_current)return reply({code:'SOURCE_CHANGED',error:'Original Order/case changed; care outcome HOLD.'},409);
  const ct=custodyState(custody,input.task_id),p=providerState(doc,input.task_id),
   rt=retentionState(doc,input.task_id,ct);
  const subj=doc.receipts.find(x=>x.id===input.subject_id);
  const ev={id:crypto.randomUUID(),kind:input.kind,decision:input.decision,
   task_id:input.task_id,order_id:src.t.order_id,case_id:src.t.case_id,
   request_key:key,fingerprint,recorded_at:now(),actor_user_id:admin.user_id,
   source_reference:input.source_reference,note:input.note,
   raw_email_saved:false,customer_notified:false,refund_executed:false,record_deleted:false};
  if(input.kind==='provider_readback'){
   if(!UUID.test(input.inbound_id)||!UUID.test(input.outbound_id)||body.owner_clicked_readback!==true)
    return reply({code:'EXPLICIT_PROVIDER_CONSENT',error:'Explicit owner click and real inbound/outbound Resend UUIDs required.'},400);
   if(p.closed)return reply({code:'REOPEN_FIRST',error:'Reopen original SLA before replacing provider readback.'},409);
   if(doc.receipts.some(x=>x.kind==='provider_readback'&&x.received_email_id===input.inbound_id&&x.task_id!==input.task_id))
    return reply({code:'PROVIDER_RECEIPT_DUPLICATE',error:'This received provider ID is linked to another original task.'},409);
   const proof=await providerRead(db,ctx.env,src.order,input.inbound_id,input.outbound_id);
   if(!proof.ok)return reply({code:proof.code,error:proof.error},409);
   Object.assign(ev,proof);
  }else if(input.kind==='provider_review'){
   if(!p.proof||!subj||subj.id!==p.proof.id||subj.kind!=='provider_readback')
    return reply({code:'CURRENT_READBACK_REQUIRED',error:'Latest original provider receipt required.'},409);
   if(admin.user_id===subj.actor_user_id)
    return reply({code:'NO_SELF_REVIEW',error:'Independent Admin must review original provider evidence.'},403);
   if(input.decision==='pass'){
    const proof=await providerRead(db,ctx.env,src.order,subj.received_email_id,subj.outbound_email_id);
    if(!proof.ok||proof.metadata_sha256!==subj.metadata_sha256)
     return reply({code:'PROVIDER_SOURCE_DRIFT',error:'Independent native provider readback no longer matches.'},409);
   }
   ev.subject_id=subj.id;ev.metadata_sha256=subj.metadata_sha256;
  }else if(input.kind==='sla_close'){
   if(!p.verified||!src.followup||ct.held||ct.escalated||p.closed||
    admin.user_id===p.proof.actor_user_id||admin.user_id===src.t.actor_user_id)
    return reply({code:'SLA_CLOSE_HOLD',error:'Independent provider review, original internal follow-up, distinct Admin and no hold/escalation required.'},409);
   if(!stamp(src.t.recorded_at)||!stamp(p.proof.received_at)||
    Date.parse(p.proof.received_at)<Date.parse(src.t.recorded_at))
    return reply({code:'SLA_TIME_HOLD',error:'Original task opening must predate genuine provider reply.'},409);
   ev.provider_review_id=p.review.id;ev.followup_review_id=src.followup.id;
   ev.original_started_at=src.t.recorded_at;ev.received_at=p.proof.received_at;
   ev.first_reply_minutes=Math.floor((Date.parse(p.proof.received_at)-Date.parse(src.t.recorded_at))/60000);
   ev.internal_only=true;
  }else if(input.kind==='sla_reopen'){
   if(!p.closed||!subj||subj.id!==p.close.id||subj.kind!=='sla_close')
    return reply({code:'ORIGINAL_CLOSED_CASE_REQUIRED',error:'Original current SLA closure required.'},409);
   ev.subject_id=subj.id;ev.reopened=true;
  }else if(input.kind==='retention_plan'){
   if(!ct.archived||ct.held||!dateValid(input.review_on))
    return reply({code:'ARCHIVED_REVIEW_DATE_REQUIRED',error:'Original approved archive and valid UTC review date required.'},409);
   if(ct.original_review_on&&input.review_on<ct.original_review_on)
    return reply({code:'RETENTION_BASELINE_HOLD',error:'Review plan cannot shorten original approved retention baseline.'},409);
   if(rt.plan&&(!rt.review||rt.review.decision==='hold'))
    return reply({code:'PENDING_PLAN',error:'Resolve original schedule proposal before creating another.'},409);
   ev.review_on=input.review_on;ev.original_review_on=ct.original_review_on;
  }else if(input.kind==='retention_review'){
   if(!ct.archived||!rt.plan||!subj||subj.id!==rt.plan.id||subj.kind!=='retention_plan'||rt.review)
    return reply({code:'ORIGINAL_PLAN_REQUIRED',error:'Unreviewed genuine archive plan required.'},409);
   if(admin.user_id===subj.actor_user_id)
    return reply({code:'NO_SELF_RETENTION_APPROVAL',error:'Different Admin must approve retention schedule.'},403);
   if(input.decision==='approve'&&ct.held)
    return reply({code:'LEGAL_HOLD',error:'Active retention hold prevents review schedule approval.'},409);
   ev.subject_id=subj.id;ev.review_on=subj.review_on;
  }else if(input.kind==='retention_check'){
   if(!ct.archived||!rt.active||!subj||subj.id!==rt.plan.id)
    return reply({code:'APPROVED_SCHEDULE_REQUIRED',error:'Approved original retention review schedule required.'},409);
   if(!rt.due)return reply({code:'NOT_DUE',error:'UTC scheduled retention review date not yet reached.'},409);
   if(input.decision==='reviewed'&&ct.held)
    return reply({code:'LEGAL_HOLD',error:'Active hold prevents completion; record HOLD.'},409);
   if(rt.check?.decision==='reviewed')
    return reply({code:'ALREADY_REVIEWED',error:'This original due review is already completed.'},409);
   ev.subject_id=subj.id;ev.review_on=rt.reviewOn;ev.no_deletion=true;
  }else return reply({code:'UNKNOWN_ACTION',error:'Unsupported original care action.'},400);
  const next={schema:751,version:doc.version+1,receipts:[ev,...doc.receipts]};
  const packed=JSON.stringify(next);
  if(packed.length>115000)return reply({code:'BYTES_CAP',error:'Immutable custody reached storage cap.'},413);
  const saved=row751?await db.prepare("UPDATE app_settings SET setting_value=?,is_public=0,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE setting_key=? AND is_public=0 AND setting_value=?")
   .bind(packed,admin.user_id,KEY,row751.setting_value).run():
   await db.prepare("INSERT INTO app_settings(setting_key,setting_value,is_public,updated_by_user_id,updated_at) VALUES(?,?,0,?,CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO NOTHING")
    .bind(KEY,packed,admin.user_id).run();
  if(Number(saved?.meta?.changes)!==1)
   return reply({code:'CONCURRENT_UPDATE',error:'Another Admin saved original evidence; reload before retrying.'},409);
  const verified=parse(await row(db,KEY),751,110);
  if(verified.receipts[0]?.id!==ev.id)return reply({code:'UNCERTAIN_WRITE',error:'D1 write readback uncertain; inspect private journal first.'},503);
  await auditAdminAction(ctx.env,ctx.request,admin,{action_type:'customer_provider_sla_751',
   target_type:'order',target_id:src.t.order_id,
   details:{kind:ev.kind,decision:ev.decision,receipt_id:ev.id}}).catch(()=>null);
  return reply({saved:true,current_version:next.version,receipt:safeReceipt(ev),
   provider_fetch_only:ev.kind==='provider_readback'||ev.kind==='provider_review',
   external_send:false,customer_notified:false,refund_executed:false,auto_purge:false});
 }catch{return reply({code:'PRIVATE_SOURCE_HOLD',error:'Original D1/provider source unavailable or uncertain; acceptance not recorded.'},503);}
}
