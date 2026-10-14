// Release 467 Build 396 — internal admin queue only. No email/SMS, Etsy provider call or Product mutation.
import {getDb,getAdminUserFromRequest,jsonResponse} from '../_lib/adminAudit.js';
import {etsyException,productPriceException} from '../_lib/etsyOperatorExceptions395.mjs';
import {safeCents} from '../_lib/priceSourceReview394.mjs';
import {validateAlertDecision,lifecycle,mayWriteAlert,ALERT_CHANNEL} from '../_lib/etsyAlertLifecycle396.mjs';
const out=(v,status=200)=>jsonResponse(v,status,{'Cache-Control':'no-store','X-DD-Etsy-Alert-Delivery':'internal-admin-only'});
const ledgerSql="SELECT admin_action_audit_id,details_json,created_at FROM admin_action_audit WHERE action_type='etsy_monitoring_internal_alert' AND target_type=? AND target_id=? ORDER BY admin_action_audit_id DESC LIMIT 16";
const keySql="SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='etsy_monitoring_internal_alert' AND target_type=? AND target_id=? AND actor_user_id=? AND json_extract(details_json,'$.request_key')=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const inboxSql="SELECT admin_action_audit_id,target_type,target_id,details_json,created_at FROM admin_action_audit WHERE action_type='etsy_monitoring_internal_alert' AND json_extract(details_json,'$.action')='route' ORDER BY admin_action_audit_id DESC LIMIT 20";
const productSql="SELECT product_id,price_cents,currency FROM products WHERE product_id=? LIMIT 1";
const approvalSql="SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='product_price_source_approved' AND target_type='product' AND target_id=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const connSql="SELECT connection_status,access_expires_at,refresh_expires_at,updated_at FROM oauth_provider_connections WHERE provider_key='etsy' LIMIT 1";
const shopSql="SELECT acceptance_status,verified_at FROM etsy_oauth_shop_connections WHERE provider_key='etsy' LIMIT 1";
const attemptSql="SELECT terminal_status,created_at,completed_at FROM oauth_authorization_transactions WHERE provider_key='etsy' ORDER BY transaction_id DESC LIMIT 1";
async function authorize(context){
 const guard=context?.data?.ddModuleAccess?.user;
 if(!guard||String(guard.role||'').toLowerCase()!=='admin')return {error:out({ok:false,error:'Admin access required.'},401)};
 const admin=await getAdminUserFromRequest(context.request,context.env);
 if(!admin?.user_id)return {error:out({ok:false,error:'Verified admin session required.'},401)};
 const db=getDb(context.env);return db?{admin,db}:{error:out({ok:false,error:'Database unavailable.'},503)};
}
function argumentsFor(scope,productId){
 if(!['etsy','product'].includes(scope))return null;
 const id=scope==='etsy'?1:Number(productId);
 if(!Number.isSafeInteger(id)||id<=0)return null;
 return {scope,id,type:scope==='etsy'?'etsy_connection_alert':'product_price_source_alert'};
}
async function currentException(db,s){
 if(s.scope==='etsy'){
  const conn=await db.prepare(connSql).first(),shop=await db.prepare(shopSql).first();
  const attempt=await db.prepare(attemptSql).first();
  return etsyException(conn,shop,attempt);
 }
 const row=await db.prepare(productSql).bind(s.id).first();if(!row)return null;
 const receipt=await db.prepare(approvalSql).bind(s.id).first();
 let approval=null;try{
  const details=receipt?JSON.parse(receipt.details_json||'null'):null;
  if(safeCents(details?.approved_price_cents))approval={receipt_id:Number(receipt.admin_action_audit_id),approved_price_cents:details.approved_price_cents};
 }catch{}
 return productPriceException(row,approval);
}
async function projection(db,s){
 const exception=await currentException(db,s);
 if(!exception)return null;
 const result=await db.prepare(ledgerSql).bind(s.type,s.id).all();
 const rows=Array.isArray(result?.results)?result.results:[];
 return {exception,history:lifecycle(rows,exception)};
}
export async function onRequestGet(context){
 const a=await authorize(context);if(a.error)return a.error;
 const url=new URL(context.request.url);
 try{
  if(url.searchParams.get('view')==='inbox'){
   const query=await a.db.prepare(inboxSql).all(),items=[];
   for(const row of (Array.isArray(query?.results)?query.results:[])){
    let d;try{d=JSON.parse(row.details_json||'null');}catch{continue;}
    if(d?.channel!==ALERT_CHANNEL||d?.action!=='route')continue;
    items.push({receipt_id:Number(row.admin_action_audit_id),scope:d.scope,product_id:d.product_id||null,
      severity:d.severity,created_at:row.created_at,channel:ALERT_CHANNEL,
      state:'routed_at_time_of_receipt_not_current_status'});
   }
   return out({ok:true,items,read_only:true,bounded_to:20,live_status_not_inferred:true,external_delivery:false});
  }
  const s=argumentsFor(url.searchParams.get('scope')||'etsy',url.searchParams.get('product_id'));
  if(!s)return out({ok:false,error:'Select Etsy or a valid Product ID.'},400);
  const p=await projection(a.db,s);if(!p)return out({ok:false,error:'Product not found.'},404);
  return out({ok:true,...p,channel:ALERT_CHANNEL,bounded_audit_rows:16,alert_delivery:'internal_admin_queue_only',
   external_notification_sent:false,no_automatic_retry:true,no_automatic_close:true,provider_calls_performed:false});
 }catch{return out({ok:false,code:'alert_evidence_unavailable',error:'Alert evidence is unavailable. Do not assume a healthy connection or retry automatically.',retry_automatically:false},503);}
}
export async function onRequestPost(context){
 const a=await authorize(context);if(a.error)return a.error;
 let body;try{body=await context.request.json();}catch{return out({ok:false,error:'Invalid JSON request.'},400);}
 const input=validateAlertDecision(body),s=input?argumentsFor(input.scope,input.product_id):null;
 if(!input||!s)return out({ok:false,error:'Explicit reviewed action, source reference and exact current evidence are required.'},400);
 try{
  const existing=await a.db.prepare(keySql).bind(s.type,s.id,a.admin.user_id,input.request_key).first();
  if(existing){
   let d;try{d=JSON.parse(existing.details_json||'null');}catch{}
   if(!d||Object.keys(input).some(key=>input[key]!==d[key]))
    return out({ok:false,code:'idempotency_conflict',error:'Request key is already bound to another action.'},409);
   return out({ok:true,already_recorded:true,receipt_id:Number(existing.admin_action_audit_id),no_automatic_retry:true});
  }
  const p=await projection(a.db,s);if(!p)return out({ok:false,error:'Product not found.'},404);
  if(input.fingerprint!==p.exception.fingerprint)return out({ok:false,code:'evidence_changed',error:'Evidence changed since review; refresh before routing or closing.',retry_automatically:false},409);
  const allowed=mayWriteAlert(input.action,p.exception,p.history,input);
  if(!allowed.ok)return out({ok:false,code:allowed.code,error:'Operator action blocked by current alert lifecycle. Reload evidence.',retry_automatically:false},409);
  const details=JSON.stringify({...input,build:396,exception_code:p.exception.code,
   provider_calls_performed:false,external_notification_sent:false,product_price_written:false,
   etsy_listing_written:false});
  const sql="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_id,target_key,request_method,request_path,details_json,created_at) "+
   "SELECT ?, 'etsy_monitoring_internal_alert', ?, ?, ?, 'POST', ?, ?, CURRENT_TIMESTAMP "+
   "WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE actor_user_id=? AND action_type='etsy_monitoring_internal_alert' "+
   "AND target_type=? AND target_id=? AND json_extract(details_json,'$.request_key')=?)";
  const written=await a.db.prepare(sql).bind(a.admin.user_id,s.type,s.id,p.exception.code,
   new URL(context.request.url).pathname,details,a.admin.user_id,s.type,s.id,input.request_key).run();
  const stored=await a.db.prepare(keySql).bind(s.type,s.id,a.admin.user_id,input.request_key).first();
  if(!stored)return out({ok:false,code:'alert_receipt_unconfirmed',error:'Alert receipt outcome unknown. Inspect the queue before retrying.',retry_automatically:false},409);
  return out({ok:true,receipt_id:Number(stored.admin_action_audit_id),action:input.action,
   already_recorded:Number(written?.meta?.changes||0)===0,alert_delivery:'internal_admin_queue_only',
   external_notification_sent:false,provider_calls_performed:false,product_price_written:false,
   etsy_listing_written:false,automatic_retry:false});
 }catch{return out({ok:false,code:'alert_write_unknown',error:'Alert outcome unknown; reload its receipt before retrying.',retry_automatically:false},503);}
}
