/** Build 746 — original-order after-sale coordination, not a replacement returns ledger.
 * User-triggered, Server-verified Storefront Admin, single-order source, private
 * case journal with idempotency. Does not execute returns, shipping, email, refund,
 * inventory, product, accounting or provider calls.
 */
import {getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
const ROOT='site.admin.aftersale.v746.';
const respond=(x,status=200)=>jsonResponse({ok:status<400,build:746,...x},status,{
 'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff',
 'X-Robots-Tag':'noindex,nofollow,noarchive','Vary':'Cookie'
});
const orderId=x=>/^[1-9][0-9]{0,9}$/.test(String(x??''))?Number(x):0;
const small=(v,n)=>String(v??'').trim().slice(0,n);
const requestKey=x=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(x??''));
const cases=['customer_support','return_request','pickup_coordination'];
const stages=['received','needs_original_evidence','working','handoff_recorded'];
const statusText={
 customer_support:'Support contact recorded; original reply evidence not confirmed.',
 return_request:'Return request recorded; no return authorization or refund issued.',
 pickup_coordination:'Pickup request recorded; no collection date, fulfilment or release confirmed.'
};
function auth(ctx){
 const admin=verifiedAdminFromModule(ctx),db=getDb(ctx.env);
 if(!admin)return {error:respond({code:'VERIFIED_STOREFRONT_ADMIN_REQUIRED',error:'Active Storefront Admin account required.'},403)};
 if(!db)return {error:respond({code:'CANONICAL_DB_UNAVAILABLE',error:'Original order database unavailable; no action taken.'},503)};
 return {admin,db};
}
async function source(db,id){
 const row=await db.prepare(`SELECT order_id, order_number, order_status, payment_status,
  fulfillment_type, currency, total_cents, created_at, updated_at FROM orders
  WHERE order_id=? LIMIT 1`).bind(id).first();
 if(!row)return null;
 return {
  order_id:Number(row.order_id),order_number:small(row.order_number,80),
  order_status:small(row.order_status,60),payment_status:small(row.payment_status,60),
  fulfillment_type:small(row.fulfillment_type,60),currency:small(row.currency,8),
  total_cents:Number.isSafeInteger(Number(row.total_cents))?Number(row.total_cents):null,
  created_at:row.created_at||null,updated_at:row.updated_at||null,
  customer_data_excluded:true,provider_delivery_unverified:true
 };
}
function blank(){return {schema:746,version:0,receipts:[]};}
function unpack(row){
 if(!row)return blank();
 if(Number(row.is_public)!==0)throw Error('Private after-sale record exposed');
 const document=JSON.parse(row.setting_value);
 if(document?.schema!==746||!Number.isSafeInteger(document.version)||document.version<0||
  !Array.isArray(document.receipts)||document.receipts.length>30)throw Error('Private journal invalid');
 return document;
}
async function getOne(db,id){
 const row=await db.prepare('SELECT setting_value,is_public FROM app_settings WHERE setting_key=? LIMIT 1')
  .bind(ROOT+id).first();
 return {row,document:unpack(row)};
}
function summary(item){
 const latest=item.receipts[0]||null;
 return {version:item.version,latest,
  history:item.receipts.map(x=>({
   receipt_id:x.receipt_id,case_type:x.case_type,stage:x.stage,
   request_key:x.request_key,recorded_at:x.recorded_at,
   source_order_updated_at:x.source_order_updated_at,
   notes:x.notes,evidence_reference:x.evidence_reference,owner_user_id:x.owner_user_id,
   provider_verified:false,return_approved:false,refund_issued:false,pickup_completed:false
  })),
  support_response_verified:false,refund_settlement_verified:false,carrier_delivered_verified:false,
  pickup_completion_verified:false,external_independent_acceptance:false};
}
export async function onRequestGet(ctx){
 const {db,error}=auth(ctx);if(error)return error;
 const id=orderId(new URL(ctx.request.url).searchParams.get('order_id'));
 if(!id)return respond({error:'Choose one original positive Order ID.'},400);
 try{
  const original=await source(db,id);
  if(!original)return respond({error:'No original Order with that ID.'},404);
  const {document}=await getOne(db,id);
  return respond({order:original,case_journal:summary(document),
   can_record_private_note:true,provider_actions_executed:false,
   customer_email_or_address_exposed:false});
 }catch{return respond({error:'Original Order or private evidence unavailable. Remains HOLD.'},503);}
}
export async function onRequestPost(ctx){
 const {db,admin,error}=auth(ctx);if(error)return error;
 const expected=new URL(ctx.request.url).origin;
 if(ctx.request.headers.get('Origin')!==expected)
  return respond({code:'SAME_ORIGIN_REQUIRED',error:'Same-origin Admin form required.'},403);
 if(!/application\/json/i.test(ctx.request.headers.get('Content-Type')||''))
  return respond({error:'JSON case record required.'},415);
 let raw,body;
 try{
  raw=await ctx.request.text();
  if(raw.length>6500)throw Error('Record too long');
  body=JSON.parse(raw);
 }catch{return respond({error:'Invalid short JSON case record.'},400);}
 const id=orderId(body.order_id),version=Number(body.expected_version);
 const key=small(body.request_key,60);
 const case_type=small(body.case_type,40),stage=small(body.stage,40),
  notes=small(body.notes,800),evidence_reference=small(body.evidence_reference,220);
 if(!id||!Number.isSafeInteger(version)||version<0||!requestKey(key)||
    !cases.includes(case_type)||!stages.includes(stage)||notes.length<20||
    (stage==='handoff_recorded'&&evidence_reference.length<8))
  return respond({error:'Choose an actual Order, a case type, stage and factual note (20+ characters). Handoff needs source evidence.'},400);
 try{
  const original=await source(db,id);
  if(!original)return respond({error:'Cannot record a case for an Order that does not exist.'},404);
  const {row,document}=await getOne(db,id);
  const candidate={case_type,stage,notes,evidence_reference};
  const previous=document.receipts.find(x=>x.request_key===key);
  if(previous){
   const exact=Object.keys(candidate).every(k=>previous[k]===candidate[k])&&
    previous.owner_user_id===admin.user_id;
   return exact?respond({replayed:true,receipt:previous,current_version:document.version,
     no_duplicate_case_created:true}):
    respond({code:'IDEMPOTENCY_KEY_CONFLICT',error:'That request key already belongs to a different case.'},409);
  }
  if(version!==document.version)
   return respond({code:'STALE_CASE',error:'Case history changed. Reload the Order before saving.'},409);
  if(document.receipts.length>=30)return respond({code:'HISTORY_CAP',error:'Private case history limit reached; archive before saving again.'},409);
  const receipt={receipt_id:crypto.randomUUID(),request_key:key,owner_user_id:admin.user_id,
   recorded_at:new Date().toISOString(),source_order_updated_at:original.updated_at,
   ...candidate,source_order_id:id,external_approval:false,refund_issued:false,
   pickup_completed:false,shipping_label_created:false,
   finance_posted:false,customer_notified:false};
  const next={schema:746,version:document.version+1,
   receipts:[receipt,...document.receipts]};
  const packed=JSON.stringify(next);
  if(packed.length>64000)return respond({error:'Private evidence record too large.'},413);
  const result=row?
   await db.prepare('UPDATE app_settings SET setting_value=?,is_public=0,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE setting_key=? AND is_public=0 AND setting_value=?')
    .bind(packed,admin.user_id,ROOT+id,row.setting_value).run():
   await db.prepare('INSERT INTO app_settings(setting_key,setting_value,is_public,updated_by_user_id,updated_at) VALUES(?,?,0,?,CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO NOTHING')
    .bind(ROOT+id,packed,admin.user_id).run();
  if(Number(result?.meta?.changes)!==1)
   return respond({code:'CONCURRENT_CASE',error:'Concurrent save; reload before creating a new case.'},409);
  const verify=await getOne(db,id);
  if(verify.document.receipts[0]?.receipt_id!==receipt.receipt_id)
   return respond({code:'UNKNOWN_SAVE',error:'Case save result unclear; reload history and check the request key before retrying.'},503);
  await auditAdminAction(ctx.env,ctx.request,admin,{
   action_type:'after_sale_private_case_record_746',target_type:'order',target_id:id,
   details:{receipt_id:receipt.receipt_id,case_type,stage}
  }).catch(()=>null);
  return respond({saved:true,receipt,current_version:next.version,
   next_action:statusText[case_type],provider_actions_executed:false,
   customer_notified:false,return_approved:false,refund_issued:false,
   pickup_completed:false,finance_posted:false});
 }catch{return respond({code:'AFTERSALE_EVIDENCE_UNAVAILABLE',error:'Original or private case store unavailable. Verify before retrying.'},503);}
}
