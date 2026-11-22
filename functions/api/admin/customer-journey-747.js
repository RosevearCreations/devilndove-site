/** Build 747: private Customer Journey device evidence and independent after-sale handover.
 * No payment/refund, inventory, shipping, customer notification or provider actions.
 */
import {getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
const KEY='site.admin.customerjourney.v747';
const AFTERSALE='site.admin.aftersale.v746.';
const ROUTES=['/shop/','/cart/','/checkout/','/pickup/','/contact/','/terms/','/help/'];
const DEVICES=['desktop','tablet','mobile'];
const BROWSERS=['firefox','chromium','safari','other'];
const DECISIONS=['pass','hold'];
const KINDS=['device','review_device','review_handover'];
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const respond=(payload,status=200)=>jsonResponse({ok:status<400,build:747,...payload},status,{
 'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff',
 'X-Robots-Tag':'noindex,nofollow,noarchive','Vary':'Cookie'
});
const short=(value,max)=>String(value??'').trim().slice(0,max);
const orderId=value=>/^[1-9][0-9]{0,9}$/.test(String(value??''))?Number(value):0;
const privateText=(value,min,max)=>{
 const s=short(value,max+1);
 return s.length>=min&&s.length<=max&&!/@|https?:|[<>]|\b(?:\d[ -]*?){9,}\b/i.test(s)?s:null;
};
function authorized(ctx){
 const admin=verifiedAdminFromModule(ctx),db=getDb(ctx.env);
 if(!admin)return{error:respond({code:'ADMIN_REQUIRED',error:'Verified active Storefront Admin required.'},403)};
 if(!db)return{error:respond({code:'DB_UNAVAILABLE',error:'Private original evidence unavailable.'},503)};
 return{admin,db};
}
function empty(){return{schema:747,version:0,receipts:[]};}
function unpack(row){
 if(!row)return empty();
 if(Number(row.is_public)!==0)throw Error('Private evidence flag invalid');
 const d=JSON.parse(row.setting_value);
 if(d.schema!==747||!Number.isSafeInteger(d.version)||d.version<0||!Array.isArray(d.receipts)||d.receipts.length>80)
  throw Error('Invalid original evidence');
 return d;
}
async function load(db){
 const row=await db.prepare('SELECT setting_value,is_public FROM app_settings WHERE setting_key=? LIMIT 1')
  .bind(KEY).first();
 return{row,doc:unpack(row)};
}
function latestReview(doc,subject,kind){
 return doc.receipts.find(x=>x.kind===kind&&x.subject_id===subject)||null;
}
function summary(doc){
 const observations=doc.receipts.filter(x=>x.kind==='device');
 const routes=ROUTES.map(route=>{
  const reviewed=observations.filter(o=>o.route===route&&o.decision==='pass'&&
   latestReview(doc,o.id,'review_device')?.decision==='pass');
  const devices=[...new Set(reviewed.map(o=>o.device))];
  return{route,independent_device_reviews:reviewed.length,device_classes:devices,
   cross_device_reviewed:devices.length>=2,
   external_customer_or_provider_verified:false};
 });
 return{version:doc.version,receipts:doc.receipts.map(x=>({
  id:x.id,kind:x.kind,actor_user_id:x.actor_user_id,recorded_at:x.recorded_at,
  route:x.route||null,device:x.device||null,browser:x.browser||null,
  decision:x.decision||null,subject_id:x.subject_id||null,
  order_id:x.order_id||null,case_type:x.case_type||null,
  source_reference:x.source_reference,
  note:x.note
 })),routes,provider_payment_verified:false,refund_executed:false,
  customer_notified:false,pickup_completed:false,customer_device_independently_verified:false};
}
export async function onRequestGet(ctx){
 const {db,error}=authorized(ctx);if(error)return error;
 try{return respond({journal:summary((await load(db)).doc),read_only:true});}
 catch{return respond({code:'PRIVATE_EVIDENCE_HOLD',error:'Private evidence read failed; acceptance remains HOLD.'},503);}
}
export async function onRequestPost(ctx){
 const {admin,db,error}=authorized(ctx);if(error)return error;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)
  return respond({code:'ORIGIN_REQUIRED',error:'Same-origin Admin action required.'},403);
 if(!/application\/json/i.test(ctx.request.headers.get('Content-Type')||''))
  return respond({error:'JSON receipt required.'},415);
 let body,raw;
 try{raw=await ctx.request.text();if(raw.length>4500)throw Error('Too long');body=JSON.parse(raw);}
 catch{return respond({error:'Invalid bounded JSON receipt.'},400);}
 if(!body||typeof body!=='object'||Array.isArray(body))return respond({error:'A JSON receipt object is required.'},400);
 const kind=short(body.kind,32),request_key=short(body.request_key,60);
 const note=privateText(body.note,20,450),source_reference=privateText(body.source_reference,8,160);
 const expected_version=Number(body.expected_version),decision=short(body.decision,16);
 if(!KINDS.includes(kind)||!UUID.test(request_key)||!note||!source_reference||
  !Number.isSafeInteger(expected_version)||expected_version<0||!DECISIONS.includes(decision))
  return respond({error:'Original reference, factual note, decision and current private version required. No emails, phone numbers or URLs.'},400);
 try{
  const {row,doc}=await load(db);
  const prior=doc.receipts.find(x=>x.request_key===request_key);
  if(prior){
   const sameSource=kind==='device'?
    prior.route===short(body.route,40)&&prior.device===short(body.device,16)&&
    prior.browser===short(body.browser,16):
    kind==='review_device'?prior.subject_id===short(body.subject_id,80):
    prior.subject_id===short(body.subject_id,80)&&prior.order_id===orderId(body.order_id);
   const exact=prior.actor_user_id===admin.user_id&&prior.kind===kind&&
    prior.source_reference===source_reference&&prior.note===note&&
    prior.decision===decision&&sameSource;
   return exact?respond({replayed:true,receipt:prior,current_version:doc.version}):
    respond({code:'KEY_CONFLICT',error:'That request key was already used for different evidence.'},409);
  }
  if(expected_version!==doc.version)return respond({code:'STALE',error:'Private journal changed. Reload before recording.'},409);
  if(doc.receipts.length>=80)return respond({code:'JOURNAL_CAP',error:'Review/archive private history before recording more evidence.'},409);
  const event={id:crypto.randomUUID(),request_key,kind,actor_user_id:admin.user_id,
   recorded_at:new Date().toISOString(),decision,source_reference,note};
  if(kind==='device'){
   event.route=short(body.route,40);event.device=short(body.device,16);
   event.browser=short(body.browser,16);
   if(!ROUTES.includes(event.route)||!DEVICES.includes(event.device)||!BROWSERS.includes(event.browser))
    return respond({error:'Allowlisted public route, device class and browser required.'},400);
  }else if(kind==='review_device'){
   event.subject_id=short(body.subject_id,80);
   const original=doc.receipts.find(x=>x.id===event.subject_id&&x.kind==='device');
   if(!original)return respond({code:'ORIGINAL_DEVICE_REQUIRED',error:'Original recorded device observation not found.'},404);
   if(original.actor_user_id===admin.user_id)
    return respond({code:'INDEPENDENT_REVIEW_REQUIRED',error:'The observer cannot independently approve their own observation.'},403);
   if(event.decision==='pass'&&original.decision!=='pass')
    return respond({code:'ORIGINAL_DEVICE_HOLD',error:'Cannot pass a HOLD device observation.'},409);
   event.route=original.route;event.device=original.device;event.browser=original.browser;
  }else{
   const id=orderId(body.order_id),subject=short(body.subject_id,80);
   if(!id||!UUID.test(subject))return respond({error:'Actual Order ID and original after-sale handoff receipt required.'},400);
   const original=await db.prepare('SELECT order_id FROM orders WHERE order_id=? LIMIT 1').bind(id).first();
   if(!original)return respond({code:'ORIGINAL_ORDER_REQUIRED',error:'Original Order not found.'},404);
   const caseRow=await db.prepare('SELECT setting_value,is_public FROM app_settings WHERE setting_key=? LIMIT 1')
    .bind(AFTERSALE+id).first();
   if(!caseRow||Number(caseRow.is_public)!==0)
    return respond({code:'HANDOFF_SOURCE_REQUIRED',error:'Private original after-sale journal unavailable.'},409);
   const cases=JSON.parse(caseRow.setting_value);
   if(cases.schema!==746||!Array.isArray(cases.receipts))throw Error('Invalid original case journal');
   const receipt=cases.receipts.find(x=>x.receipt_id===subject&&x.stage==='handoff_recorded'&&
    typeof x.evidence_reference==='string'&&x.evidence_reference.length>=8);
   if(!receipt)return respond({code:'HANDOFF_SOURCE_REQUIRED',error:'Original handoff receipt not found or source evidence missing.'},409);
   if(!Number.isSafeInteger(Number(receipt.owner_user_id))||Number(receipt.owner_user_id)<1)
    return respond({code:'ORIGINAL_AUTHOR_REQUIRED',error:'Original case author identity missing.'},409);
   if(Number(receipt.owner_user_id)===admin.user_id)
    return respond({code:'INDEPENDENT_REVIEW_REQUIRED',error:'Original handoff author cannot independently review their own work.'},403);
   event.order_id=id;event.subject_id=subject;event.case_type=receipt.case_type;
   event.original_author_user_id=Number(receipt.owner_user_id);
   event.external_refund_or_pickup_confirmed=false;
  }
  const next={schema:747,version:doc.version+1,receipts:[event,...doc.receipts]};
  const packed=JSON.stringify(next);
  if(packed.length>80000)return respond({code:'PRIVATE_HISTORY_SIZE',error:'Private receipt history reached capacity.'},413);
  const result=row?await db.prepare('UPDATE app_settings SET setting_value=?,is_public=0,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE setting_key=? AND is_public=0 AND setting_value=?')
   .bind(packed,admin.user_id,KEY,row.setting_value).run():
   await db.prepare('INSERT INTO app_settings(setting_key,setting_value,is_public,updated_by_user_id,updated_at) VALUES(?,?,0,?,CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO NOTHING')
    .bind(KEY,packed,admin.user_id).run();
  if(Number(result?.meta?.changes)!==1)
   return respond({code:'CONCURRENT',error:'Another operator saved evidence. Reload; no duplicate recorded.'},409);
  const verified=await load(db);
  if(verified.doc.receipts[0]?.id!==event.id)
   return respond({code:'UNCERTAIN',error:'Save result uncertain; reload before retrying.'},503);
  await auditAdminAction(ctx.env,ctx.request,admin,{action_type:'customer_journey_private_evidence_747',
   target_type:kind==='review_handover'?'order':'storefront',target_id:event.order_id||0,
   details:{receipt_id:event.id,kind,decision}}).catch(()=>null);
  return respond({saved:true,receipt:event,current_version:next.version,
   external_acceptance:false,refund_executed:false,customer_notified:false,pickup_completed:false});
 }catch{return respond({code:'PRIVATE_EVIDENCE_HOLD',error:'Original source/database unavailable. No acceptance may be inferred; inspect history before retrying.'},503);}
}
