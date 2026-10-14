// Build 394: explicit source-attested product price review with durable admin audit receipts.
// GET is one-Product read and optional latest approval. POST never modifies products, tax, stock, or Etsy.
import {getDb,jsonResponse,getAdminUserFromRequest} from '../_lib/adminAudit.js';
import {normalizeSourceReview,safeCents,sourcePriceOutcome} from '../_lib/priceSourceReview394.mjs';
const out=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store','X-DD-Price-Review':'operator-source-only'});
const receiptSql="SELECT admin_action_audit_id, actor_user_id, details_json, created_at FROM admin_action_audit WHERE action_type='product_price_source_approved' AND target_type='product' AND target_id=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const keySql="SELECT admin_action_audit_id, details_json, created_at FROM admin_action_audit WHERE action_type='product_price_source_approved' AND target_type='product' AND actor_user_id=? AND target_id=? AND json_extract(details_json,'$.request_key')=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const productSql="SELECT product_id,name,sku,price_cents,currency,updated_at FROM products WHERE product_id=? LIMIT 1";
async function access(context) {
 const user=context?.data?.ddModuleAccess?.user;
 if(!user||String(user.role||'').toLowerCase()!=='admin')return {error:out({ok:false,error:'Administrator access required.'},401)};
 const admin=await getAdminUserFromRequest(context.request,context.env);
 if(!admin?.user_id)return {error:out({ok:false,error:'Verified administrator session required.'},401)};
 const db=getDb(context.env);
 return db?{admin,db}:{error:out({ok:false,error:'Database unavailable.'},503)};
}
function safeReceipt(row) {
 if(!row)return null;
 let details=null;try{details=JSON.parse(row.details_json||'null');}catch{return null;}
 if(!details||!safeCents(details.approved_price_cents))return null;
 return {receipt_id:Number(row.admin_action_audit_id),reviewer_user_id:Number(row.actor_user_id),
  reviewed_at:row.created_at,source_type:details.source_type,source_reference:details.source_reference,
  approved_price_cents:details.approved_price_cents,observed_price_cents:details.observed_price_cents,
  evidence_state:'OPERATOR_ATTESTED_SOURCE_NOT_INDEPENDENTLY_VERIFIED'};
}
async function product(db,id){return db.prepare(productSql).bind(id).first();}
async function latest(db,id){return safeReceipt(await db.prepare(receiptSql).bind(id).first());}
function view(p,receipt) {
 const current=Number(p.price_cents);
 const state=receipt?sourcePriceOutcome(current,receipt.approved_price_cents):'source_evidence_required';
 return {ok:true,product:{product_id:Number(p.product_id),name:p.name,sku:p.sku,
  price_cents:current,currency:p.currency,updated_at:p.updated_at},
  receipt,review_outcome:state,read_only:true,price_mutation:false,
  provider_execution:false,automatic_price_repair:false,
  note:'A source reference is operator-attested, not independently authenticated against the originating document. A discrepancy is not proof of accidental price drift.'};
}
export async function onRequestGet(context) {
 const a=await access(context);if(a.error)return a.error;
 const id=Number(new URL(context.request.url).searchParams.get('product_id'));
 if(!Number.isSafeInteger(id)||id<1)return out({ok:false,error:'Valid product_id required.'},400);
 try{
  const p=await product(a.db,id);if(!p)return out({ok:false,error:'Product not found.'},404);
  return out(view(p,await latest(a.db,id)));
 }catch{return out({ok:false,error:'Price source review could not be loaded. No prices changed.',retry_automatically:false},503);}
}
export async function onRequestPost(context) {
 const a=await access(context);if(a.error)return a.error;
 let body;try{body=await context.request.json();}catch{return out({ok:false,error:'Invalid JSON request.'},400);}
 const review=normalizeSourceReview(body);
 if(!review)return out({ok:false,error:'Select an approved source type, enter a real source identifier and exact CAD cents, and confirm review.'},400);
 const {product_id:id,request_key:key}=review;
 try{
  const prior=await a.db.prepare(keySql).bind(a.admin.user_id,id,key).first();
  if(prior){
   let old;try{old=JSON.parse(prior.details_json);}catch{old=null;}
   const match=old&&Object.keys(review).every(k=>old[k]===review[k]);
   return match?out({ok:true,already_recorded:true,receipt_id:Number(prior.admin_action_audit_id),price_mutation:false,automatic_retry:false}):
    out({ok:false,code:'review_request_key_conflict',error:'This request key belongs to a different review. Reload before retrying.'},409);
  }
  const p=await product(a.db,id);
  if(!p)return out({ok:false,error:'Product not found.'},404);
  if(String(p.currency||'').toUpperCase()!=='CAD')return out({ok:false,error:'Only CAD source comparisons are supported.'},422);
  if(!safeCents(Number(p.price_cents)))return out({ok:false,error:'Stored product cents are invalid.'},409);
  if(Number(p.price_cents)!==review.observed_price_cents)return out({ok:false,code:'price_changed_since_review',error:'The Product price changed since it was loaded. Refresh before any review.',retry_automatically:false},409);
  const details=JSON.stringify({...review,build:394,source_independently_verified:false,
   product_price_written:false,etsy_listing_written:false});
  const request=context.request;
  const insert=await a.db.prepare(
   "INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_id,target_key,request_method,request_path,details_json,created_at) "+
   "SELECT ?, 'product_price_source_approved','product', ?, ?, 'POST', ?, ?, CURRENT_TIMESTAMP "+
   "WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE actor_user_id=? AND action_type='product_price_source_approved' AND target_type='product' AND target_id=? AND json_extract(details_json,'$.request_key')=?)"
  ).bind(a.admin.user_id,id,String(p.sku||p.name||'').slice(0,100),new URL(request.url).pathname,
   details,a.admin.user_id,id,key).run();
  const committed=await a.db.prepare(keySql).bind(a.admin.user_id,id,key).first();
  if(!committed)return out({ok:false,code:'review_receipt_unconfirmed',error:'Approval receipt could not be confirmed. Check audit history before retrying.',retry_automatically:false},409);
  return out({...view(p,safeReceipt(committed)),receipt_id:Number(committed.admin_action_audit_id),
   created_now:Number(insert?.meta?.changes||0)>0,already_recorded:Number(insert?.meta?.changes||0)===0,
   success_message:'Source approval receipt saved; Product price unchanged.',automatic_retry:false});
 }catch{return out({ok:false,code:'review_save_unknown',error:'Source review outcome unknown. Reload the existing receipt before retrying.',retry_automatically:false},503);}
}
