/** Build 748: Owner-attested Firefox observations and two-Admin internal care closure.
 * No original Order/Payment/Product/Inventory writes or external provider/customer actions.
 */
import {getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
const KEY='site.admin.customerjourney.v748';
const K746=id=>'site.admin.aftersale.v746.'+id;
const K747='site.admin.customerjourney.v747';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KINDS=['firefox_observation','review_firefox','propose_closure','review_closure','reopen_closure'];
const DEVICE=['desktop','tablet','mobile'];
const DECISIONS={firefox_observation:['observed','hold'],review_firefox:['pass','hold'],
 propose_closure:['request'],review_closure:['pass','hold'],reopen_closure:['reopen']};
const reply=(o,status=200)=>jsonResponse({ok:status<400,build:748,...o},status,{
 'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff',
 'X-Robots-Tag':'noindex,nofollow,noarchive','Vary':'Cookie'
});
const trim=(v,n)=>String(v??'').trim().slice(0,n+1);
const orderId=v=>/^[1-9][0-9]{0,9}$/.test(String(v??''))?Number(v):0;
const safeText=(s,min,max)=>{
 const v=trim(s,max);
 return v.length>=min&&v.length<=max&&!/@|https?:|[<>]|\b(?:\d[ -]*?){9,}\b/i.test(v)?v:null;
};
const problem=(code,error,status=409)=>({error:reply({code,error},status)});
function auth(ctx){
 const admin=verifiedAdminFromModule(ctx),db=getDb(ctx.env);
 if(!admin)return problem('VERIFIED_ADMIN_REQUIRED','Active Storefront Admin session required.',403);
 if(!db)return problem('ORIGINAL_DB_UNAVAILABLE','Private source database unavailable.',503);
 return{admin,db};
}
async function row(db,key){
 return db.prepare('SELECT setting_value,is_public FROM app_settings WHERE setting_key=? LIMIT 1')
  .bind(key).first();
}
function parsed(r,schema,cap){
 if(!r)return{schema,version:0,receipts:[]};
 if(Number(r.is_public)!==0)throw Error('Private evidence access flag changed');
 const d=JSON.parse(r.setting_value);
 if(d?.schema!==schema||!Number.isSafeInteger(d.version)||d.version<0||
  !Array.isArray(d.receipts)||d.receipts.length>cap)throw Error('Original private journal invalid');
 return d;
}
async function load(db){
 const r=await row(db,KEY);
 return{r,doc:parsed(r,748,100)};
}
function summary(doc){
 const latestFirefox=doc.receipts.find(x=>x.kind==='firefox_observation');
 const review=latestFirefox&&doc.receipts.find(x=>x.kind==='review_firefox'&&x.subject_id===latestFirefox.id);
 return{version:doc.version,firefox_review_state:!latestFirefox?'HOLD_NO_OWNER_OBSERVATION':
  review?.decision==='pass'&&latestFirefox.decision==='observed'?'INDEPENDENTLY_REVIEWED_OWNER_ATTESTATION':
  'HOLD_INDEPENDENT_FIREFOX_REVIEW',
  receipts:doc.receipts.map(x=>({
   id:x.id,kind:x.kind,recorded_at:x.recorded_at,actor_user_id:x.actor_user_id,
   decision:x.decision,subject_id:x.subject_id||null,order_id:x.order_id||null,
   case_id:x.case_id||null,case_type:x.case_type||null,
   device_class:x.device_class||null,client_reported_firefox:x.client_reported_firefox===true,
   static_pass:x.static_pass??null,static_hold:x.static_hold??null,
   source_reference:x.source_reference,note:x.note,
   external_payment_verified:false,customer_reply_verified:false,
   refund_executed:false,pickup_completed:false
  }))};
}
async function canonical(db,id){
 const o=await db.prepare('SELECT order_id,order_number,order_status,updated_at FROM orders WHERE order_id=? LIMIT 1')
  .bind(id).first();
 if(!o)return null;
 return{order_id:Number(o.order_id),order_number:trim(o.order_number,80),
  order_status:trim(o.order_status,50),updated_at:o.updated_at||null};
}
async function sourceSnapshot(db,id,caseId){
 const order=await canonical(db,id);
 if(!order)return{code:'ORIGINAL_ORDER_REQUIRED',error:'Canonical Order ID not found.',status:404};
 const cRow=await row(db,K746(id)),rRow=await row(db,K747);
 if(!cRow||Number(cRow.is_public)!==0||!rRow||Number(rRow.is_public)!==0)
  return{code:'SOURCE_JOURNAL_REQUIRED',error:'Original private Build 746/747 journals unavailable.',status:409};
 const cases=parsed(cRow,746,30),reviewed=parsed(rRow,747,80);
 const receipt=cases.receipts.find(x=>x.receipt_id===caseId&&
  x.source_order_id===id&&x.stage==='handoff_recorded'&&
  typeof x.evidence_reference==='string'&&x.evidence_reference.length>=8);
 if(!receipt)return{code:'ORIGINAL_HANDOFF_REQUIRED',error:'Original Order-bound handoff with source evidence required.',status:409};
 const latestReview=reviewed.receipts.find(x=>x.kind==='review_handover'&&
  x.subject_id===caseId&&x.order_id===id);
 if(latestReview?.decision!=='pass'||Number(latestReview.actor_user_id)===Number(receipt.owner_user_id))
  return{code:'INDEPENDENT_HANDOFF_REQUIRED',error:'Latest original Build 747 independent handoff approval is absent or HOLD.',status:409};
 return{order,case_id:caseId,case_type:receipt.case_type,original_author_user_id:Number(receipt.owner_user_id),
  handoff_recorded_at:receipt.recorded_at||null,case_version:cases.version,review_id:latestReview.id,
  reviewed_by:latestReview.actor_user_id,order_updated_at:order.updated_at,
  external_approval:false,refund_verified:false,customer_reply_verified:false};
}
async function candidateHandoffs(db,id){
 const order=await canonical(db,id);
 if(!order)return{code:'ORIGINAL_ORDER_REQUIRED',error:'Original Order not found.',status:404};
 const cRow=await row(db,K746(id)),rRow=await row(db,K747);
 if(!cRow||!rRow||Number(cRow.is_public)!==0||Number(rRow.is_public)!==0)
  return{order,eligible_handoffs:[],source_status:'HOLD_SOURCE_JOURNAL'};
 const cases=parsed(cRow,746,30),reviews=parsed(rRow,747,80);
 const eligible_handoffs=cases.receipts.filter(x=>x.source_order_id===id&&x.stage==='handoff_recorded')
  .slice(0,20).map(x=>{
   const latest=reviews.receipts.find(y=>y.kind==='review_handover'&&y.subject_id===x.receipt_id&&y.order_id===id);
   return{case_id:x.receipt_id,case_type:x.case_type,review_id:latest?.id||null,
    internal_handoff_verified:latest?.decision==='pass'&&Number(latest.actor_user_id)!==Number(x.owner_user_id),
    external_customer_response_verified:false};
  });
 return{order,eligible_handoffs,source_status:'ORIGINAL_ORDER_AND_PRIVATE_JOURNALS_READ'};
}
function orderClosure(doc,id){
 const relevant=doc.receipts.filter(x=>x.order_id===id&&['propose_closure','reopen_closure'].includes(x.kind));
 const latest=relevant[0];
 if(!latest)return{state:'HOLD_NO_CLOSURE_PROPOSAL',proposal_id:null,review_id:null};
 if(latest.kind==='reopen_closure')return{state:'REOPENED_FOLLOWUP_REQUIRED',proposal_id:latest.subject_id,review_id:null};
 const review=doc.receipts.find(x=>x.kind==='review_closure'&&x.subject_id===latest.id);
 return{state:review?.decision==='pass'?'INTERNAL_CARE_CLOSURE_REVIEWED':review?.decision==='hold'?
  'HOLD_REVIEW_REJECTED':'HOLD_INDEPENDENT_REVIEW_PENDING',
  proposal_id:latest.id,review_id:review?.id||null,
  external_customer_reply_verified:false,external_refund_verified:false,pickup_completed:false};
}
export async function onRequestGet(ctx){
 const {db,error}=auth(ctx);if(error)return error;
 const idRaw=new URL(ctx.request.url).searchParams.get('order_id');
 const id=idRaw===null?0:orderId(idRaw);
 if(idRaw!==null&&!id)return reply({code:'INVALID_ORDER_ID',error:'Original numeric Order ID required.'},400);
 try{
  const {doc}=await load(db);
  if(!id)return reply({journal:summary(doc),external_outcomes_verified:false,read_only:true});
  const candidates=await candidateHandoffs(db,id);
  if(candidates.code)return reply({code:candidates.code,error:candidates.error},candidates.status);
  let closure=orderClosure(doc,id);
  if(closure.state==='INTERNAL_CARE_CLOSURE_REVIEWED'){
   const proposal=doc.receipts.find(x=>x.id===closure.proposal_id);
   const source=await sourceSnapshot(db,id,proposal.case_id);
   if(source.code||source.order_updated_at!==proposal.source_order_updated_at||
    source.case_version!==proposal.source_case_version||source.review_id!==proposal.source_review_id)
    closure={...closure,state:'HOLD_SOURCE_DRIFT_REOPEN_REVIEW_REQUIRED'};
  }
  return reply({journal:summary(doc),original:candidates,closure,
   customer_reply_verified:false,provider_refund_verified:false,pickup_completion_verified:false});
 }catch{return reply({code:'ORIGINAL_SOURCE_HOLD',error:'Private original source read unavailable; do not infer closure.'},503);}
}
export async function onRequestPost(ctx){
 const {db,admin,error}=auth(ctx);if(error)return error;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)
  return reply({code:'SAME_ORIGIN_REQUIRED',error:'Same-origin Admin form required.'},403);
 if(!/application\/json/i.test(ctx.request.headers.get('Content-Type')||''))
  return reply({code:'JSON_REQUIRED',error:'JSON receipt required.'},415);
 let body;
 try{const raw=await ctx.request.text();if(raw.length>4800)throw Error('Too long');body=JSON.parse(raw);}
 catch{return reply({code:'INVALID_JSON',error:'Bounded JSON record required.'},400);}
 if(!body||typeof body!=='object'||Array.isArray(body))return reply({error:'JSON object required.'},400);
 const kind=trim(body.kind,40),decision=trim(body.decision,16),
  note=safeText(body.note,20,450),source_reference=safeText(body.source_reference,8,160),
  key=trim(body.request_key,60),version=Number(body.expected_version);
 if(!KINDS.includes(kind)||!DECISIONS[kind]?.includes(decision)||!UUID.test(key)||!note||
  !source_reference||!Number.isSafeInteger(version)||version<0)
  return reply({code:'INVALID_EVIDENCE',error:'Current revision, unique key, factual nonpersonal evidence and decision required.'},400);
 try{
  const {r,doc}=await load(db);
  const subject=trim(body.subject_id,80),id=orderId(body.order_id),caseId=trim(body.case_id,80);
  const device=trim(body.device_class,16),pass=Number(body.static_pass),hold=Number(body.static_hold);
  const prior=doc.receipts.find(x=>x.request_key===key);
  if(prior){
   const exact=prior.actor_user_id===admin.user_id&&prior.kind===kind&&prior.decision===decision&&
    prior.note===note&&prior.source_reference===source_reference&&
    (prior.subject_id||'')===(subject||'')&&(prior.order_id||0)===id&&
    (kind==='propose_closure'?prior.case_id===caseId:true)&&
    (kind==='firefox_observation'?prior.device_class===device:true)&&
    (prior.static_pass??0)===(kind==='firefox_observation'?pass:0)&&
    (prior.static_hold??0)===(kind==='firefox_observation'?hold:0);
   return exact?reply({replayed:true,receipt:prior,current_version:doc.version}):
    reply({code:'REQUEST_KEY_CONFLICT',error:'Request key already belongs to different original evidence.'},409);
  }
  if(doc.version!==version)return reply({code:'STALE_VERSION',error:'Private journal changed. Reload original evidence before retrying.'},409);
  if(doc.receipts.length>=100)return reply({code:'JOURNAL_CAP',error:'Original private evidence history full; archive first.'},409);
  const event={id:crypto.randomUUID(),kind,decision,request_key:key,source_reference,note,
   actor_user_id:admin.user_id,recorded_at:new Date().toISOString()};
  if(kind==='firefox_observation'){
   if(body.browser_family!=='firefox'||!DEVICE.includes(device)||!Number.isInteger(pass)||!Number.isInteger(hold)||
    pass<0||hold<0||pass+hold!==7||body.owner_clicked_confirmation!==true)
    return reply({code:'FIREFOX_OWNER_OBSERVATION_REQUIRED',error:'An explicit client-reported Firefox session and seven-route diagnostics are required.'},400);
   event.device_class=device;event.client_reported_firefox=true;
   event.static_pass=pass;event.static_hold=hold;event.observer_attested=true;
   event.actual_device_independently_verified=false;
  }else if(kind==='review_firefox'){
   const original=doc.receipts.find(x=>x.id===subject&&x.kind==='firefox_observation');
   if(!original)return reply({code:'FIREFOX_SOURCE_REQUIRED',error:'Original owner Firefox observation not found.'},404);
   if(original.actor_user_id===admin.user_id)
    return reply({code:'NO_SELF_REVIEW',error:'Owner cannot independently review their own Firefox evidence.'},403);
   if(decision==='pass'&&(original.decision!=='observed'||original.static_hold!==0))
    return reply({code:'FIREFOX_SOURCE_HOLD',error:'Original Firefox diagnostic has unverified route steps.'},409);
   event.subject_id=subject;event.device_class=original.device_class;
   event.client_reported_firefox=true;event.actual_device_independently_verified=false;
  }else if(kind==='propose_closure'){
   if(!id||!UUID.test(caseId))return reply({code:'CASE_SOURCE_REQUIRED',error:'Original Order and Build 746 case receipt required.'},400);
   const source=await sourceSnapshot(db,id,caseId);
   if(source.code)return reply({code:source.code,error:source.error},source.status);
   event.order_id=id;event.case_id=caseId;event.case_type=source.case_type;
   event.source_order_updated_at=source.order_updated_at;
   event.source_case_version=source.case_version;
   event.source_review_id=source.review_id;
   event.customer_reply_verified=false;event.external_refund_verified=false;event.pickup_completed=false;
  }else if(kind==='review_closure'){
   const proposal=doc.receipts.find(x=>x.kind==='propose_closure'&&x.id===subject);
   if(!proposal)return reply({code:'ORIGINAL_CLOSURE_PROPOSAL_REQUIRED',error:'Private original care closure proposal absent.'},404);
   if(proposal.actor_user_id===admin.user_id)
    return reply({code:'NO_SELF_REVIEW',error:'Closure author cannot independently approve their own proposal.'},403);
   const latestIntent=doc.receipts.find(x=>x.order_id===proposal.order_id&&
    ['propose_closure','reopen_closure'].includes(x.kind));
   if(latestIntent?.id!==proposal.id)
    return reply({code:'SUPERSEDED_CLOSURE',error:'That closure proposal was superseded or reopened.'},409);
   const source=await sourceSnapshot(db,proposal.order_id,proposal.case_id);
   if(source.code)return reply({code:source.code,error:source.error},source.status);
   if(source.order_updated_at!==proposal.source_order_updated_at||
    source.case_version!==proposal.source_case_version||source.review_id!==proposal.source_review_id)
    return reply({code:'SOURCE_CHANGED',error:'Order, case, or independent handoff changed: internal closure stays HOLD.'},409);
   event.subject_id=subject;event.order_id=proposal.order_id;event.case_id=proposal.case_id;
   event.case_type=source.case_type;
   event.internal_closure_only=true;event.external_provider_verified=false;
  }else{
   const proposal=doc.receipts.find(x=>x.kind==='propose_closure'&&x.id===subject);
   if(!proposal||proposal.order_id!==id)
    return reply({code:'ORIGINAL_CLOSURE_REQUIRED',error:'Reopen requires an original Order-bound closure proposal.'},404);
   const state=orderClosure(doc,id);
   if(state.proposal_id!==proposal.id||state.state!=='INTERNAL_CARE_CLOSURE_REVIEWED')
    return reply({code:'NOT_INTERNALLY_CLOSED',error:'Original independently reviewed internal closure required before reopen.'},409);
   event.subject_id=subject;event.order_id=id;event.case_id=proposal.case_id;
   event.customer_reply_verified=false;
  }
  const next={schema:748,version:doc.version+1,receipts:[event,...doc.receipts]};
  const packed=JSON.stringify(next);
  if(packed.length>90000)return reply({code:'PRIVATE_HISTORY_SIZE',error:'Private history size limit reached.'},413);
  const write=r?await db.prepare('UPDATE app_settings SET setting_value=?,is_public=0,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE setting_key=? AND is_public=0 AND setting_value=?')
   .bind(packed,admin.user_id,KEY,r.setting_value).run():
   await db.prepare('INSERT INTO app_settings(setting_key,setting_value,is_public,updated_by_user_id,updated_at) VALUES(?,?,0,?,CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO NOTHING')
    .bind(KEY,packed,admin.user_id).run();
  if(Number(write?.meta?.changes)!==1)
   return reply({code:'CONCURRENT_WRITE',error:'A concurrent Admin changed evidence; reload before saving.'},409);
  const verified=await load(db);
  if(verified.doc.receipts[0]?.id!==event.id)
   return reply({code:'UNCERTAIN_WRITE',error:'Save receipt readback uncertain. Check history; do not retry blindly.'},503);
  await auditAdminAction(ctx.env,ctx.request,admin,{action_type:'customer_journey_private_evidence_748',
   target_type:id?'order':'storefront',target_id:id||0,
   details:{kind,decision,receipt_id:event.id}}).catch(()=>null);
  return reply({saved:true,receipt:event,current_version:next.version,
   internal_closure_only:true,external_refund_executed:false,customer_message_sent:false,
   shipping_action_executed:false,pickup_completed:false});
 }catch{return reply({code:'ORIGINAL_SOURCE_UNAVAILABLE',error:'Original evidence unavailable or write unclear; inspect private history before retry.'},503);}
}
