// Build 395 — on-demand admin-only Etsy exception review. No provider calls, Product writes or automatic recovery.
import {getDb,getAdminUserFromRequest,jsonResponse} from '../_lib/adminAudit.js';
import {etsyException,productPriceException,normalizeOperatorDecision} from '../_lib/etsyOperatorExceptions395.mjs';
import {safeCents} from '../_lib/priceSourceReview394.mjs';
const out=(d,status=200)=>jsonResponse(d,status,{'Cache-Control':'no-store','X-DD-Exception-Mode':'on-demand-operator-only'});
const recentSql="SELECT admin_action_audit_id, actor_user_id, details_json, created_at FROM admin_action_audit WHERE action_type='etsy_exception_operator_decision' AND target_type=? AND target_id=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const keySql="SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='etsy_exception_operator_decision' AND target_type=? AND target_id=? AND actor_user_id=? AND json_extract(details_json,'$.request_key')=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const historySql="SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='etsy_exception_operator_decision' AND target_type=? AND target_id=? AND json_extract(details_json,'$.decision')='acknowledge' ORDER BY admin_action_audit_id DESC LIMIT 1";
const receiptSql="SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='product_price_source_approved' AND target_type='product' AND target_id=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const sqlProduct="SELECT product_id,price_cents,currency FROM products WHERE product_id=? LIMIT 1";
const sqlConn="SELECT connection_status,access_expires_at,refresh_expires_at,updated_at FROM oauth_provider_connections WHERE provider_key='etsy' LIMIT 1";
const sqlShop="SELECT acceptance_status,verified_at FROM etsy_oauth_shop_connections WHERE provider_key='etsy' LIMIT 1";
const sqlAttempt="SELECT terminal_status,created_at,completed_at FROM oauth_authorization_transactions WHERE provider_key='etsy' ORDER BY transaction_id DESC LIMIT 1";
async function authorize(context){
 const guard=context?.data?.ddModuleAccess?.user;
 if(!guard||String(guard.role||'').toLowerCase()!=='admin')return {error:out({ok:false,error:'Admin access required.'},401)};
 const admin=await getAdminUserFromRequest(context.request,context.env);
 if(!admin?.user_id)return {error:out({ok:false,error:'Verified administrator session required.'},401)};
 const db=getDb(context.env);
 return db?{admin,db}:{error:out({ok:false,error:'Database unavailable.'},503)};
}
function scopeArgs(request,body=null){
 const q=new URL(request.url).searchParams,scope=String(body?.scope||q.get('scope')||'etsy');
 const id=scope==='etsy'?1:Number(body?.product_id||q.get('product_id'));
 if(!['etsy','product'].includes(scope)||!Number.isSafeInteger(id)||id<1)return null;
 return {scope,id,targetType:scope==='etsy'?'etsy_monitoring_exception':'product_price_exception'};
}
function decodeReceipt(row){
 if(!row)return null;
 let details;try{details=JSON.parse(row.details_json||'null');}catch{return null;}
 if(!details||!['acknowledge','resolution_reviewed'].includes(details.decision))return null;
 return {receipt_id:Number(row.admin_action_audit_id),actor_user_id:Number(row.actor_user_id||0),
  decision:details.decision,exception_code:details.exception_code,operator_reference:details.operator_reference,
  created_at:row.created_at||null,operator_confirmed:true};
}
async function exception(db,scope,id){
 if(scope==='etsy'){
  // Fail closed on read errors: missing/unavailable D1 cannot masquerade as disconnected.
  const connection=await db.prepare(sqlConn).first(),shop=await db.prepare(sqlShop).first();
  const attempt=await db.prepare(sqlAttempt).first();
  return etsyException(connection,shop,attempt);
 }
 const product=await db.prepare(sqlProduct).bind(id).first();
 if(!product)return null;
 const row=await db.prepare(receiptSql).bind(id).first();
 let approval=null;if(row){try{
  const d=JSON.parse(row.details_json||'null');
  if(safeCents(d?.approved_price_cents))approval={receipt_id:Number(row.admin_action_audit_id),approved_price_cents:d.approved_price_cents};
 }catch{}}
 return productPriceException(product,approval);
}
export async function onRequestGet(context){
 const a=await authorize(context);if(a.error)return a.error;
 const scope=scopeArgs(context.request);if(!scope)return out({ok:false,error:'Valid scope or Product ID required.'},400);
 try{
  const item=await exception(a.db,scope.scope,scope.id);
  if(!item)return out({ok:false,error:'Product not found.'},404);
  const last=decodeReceipt(await a.db.prepare(recentSql).bind(scope.targetType,scope.id).first());
  return out({ok:true,exception:item,last_operator_decision:last,
    review_mode:'manual_on_demand',remote_provider_called:false,price_write_performed:false,
    no_automatic_resolution:true,provider_publication_allowed:false});
 }catch{return out({ok:false,code:'exception_evidence_unavailable',error:'Exception evidence unavailable; status unknown. No automatic retry or resolution.',retry_automatically:false},503);}
}
export async function onRequestPost(context){
 const a=await authorize(context);if(a.error)return a.error;
 let body;try{body=await context.request.json();}catch{return out({ok:false,error:'Invalid JSON.'},400);}
 const input=normalizeOperatorDecision(body),scope=scopeArgs(context.request,body);
 if(!input||!scope||input.scope!==scope.scope)return out({ok:false,error:'Confirmed operator decision, request key, reference and exact exception evidence are required.'},400);
 try{
  const existing=await a.db.prepare(keySql).bind(scope.targetType,scope.id,a.admin.user_id,input.request_key).first();
  if(existing){
   let old=null;try{old=JSON.parse(existing.details_json||'null');}catch{}
   if(!old||Object.keys(input).some(k=>old[k]!==input[k]))return out({ok:false,code:'request_key_conflict',error:'Request key already belongs to another decision.'},409);
   return out({ok:true,already_recorded:true,receipt_id:Number(existing.admin_action_audit_id),business_data_written:false,automatic_retry:false});
  }
  const current=await exception(a.db,scope.scope,scope.id);
  if(!current)return out({ok:false,error:'Product not found.'},404);
  if(current.fingerprint!==input.fingerprint)return out({ok:false,code:'evidence_changed',error:'Exception evidence changed. Refresh before recording a decision.',retry_automatically:false},409);
  if(input.decision==='acknowledge'&&!current.active)return out({ok:false,code:'no_active_exception',error:'There is no active issue to acknowledge.'},409);
  if(input.decision==='resolution_reviewed'){
   if(current.active)return out({ok:false,code:'unresolved_exception',error:'The underlying condition is still active. Acknowledge it; do not label it resolved.'},409);
   const prior=await a.db.prepare(historySql).bind(scope.targetType,scope.id).first();
   if(!prior)return out({ok:false,code:'no_prior_exception',error:'No earlier acknowledged exception exists for manual resolution.'},409);
  }
  const details=JSON.stringify({...input,build:395,exception_code:current.code,was_active:current.active,
    etsy_listing_written:false,product_price_written:false,provider_calls_performed:false});
  const statement="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_id,target_key,request_method,request_path,details_json,created_at) "+
  "SELECT ?, 'etsy_exception_operator_decision',?,?,?, 'POST',?,?,CURRENT_TIMESTAMP "+
  "WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE actor_user_id=? AND action_type='etsy_exception_operator_decision' AND target_type=? AND target_id=? AND json_extract(details_json,'$.request_key')=?)";
  const wr=await a.db.prepare(statement).bind(a.admin.user_id,scope.targetType,scope.id,current.code,
    new URL(context.request.url).pathname,details,a.admin.user_id,scope.targetType,scope.id,input.request_key).run();
  const stored=await a.db.prepare(keySql).bind(scope.targetType,scope.id,a.admin.user_id,input.request_key).first();
  if(!stored)return out({ok:false,code:'decision_receipt_unknown',error:'Decision outcome unknown. Read audit history before retrying.',retry_automatically:false},409);
  return out({ok:true,receipt_id:Number(stored.admin_action_audit_id),already_recorded:Number(wr?.meta?.changes||0)===0,
    decision:input.decision,exception_code:current.code,operator_confirmation_recorded:true,
    business_data_written:false,listing_written:false,automatic_retry:false});
 }catch{return out({ok:false,code:'decision_outcome_unknown',error:'Operator decision outcome unknown. Refresh evidence and audit before retrying.',retry_automatically:false},503);}
}
