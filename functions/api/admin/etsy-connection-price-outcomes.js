import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
// Release 467 Build 397 — admin-only, bounded Etsy connection observability & Product price review outcomes.
// GET cannot mutate. POST records idempotent operator audit only, never changes Products or Etsy.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {safeCents} from '../_lib/priceSourceReview394.mjs';
import {connectionEvidence397,priceEvidence397,normalizePriceOutcomeDecision,decisionAllowed397,outcomeReviewState397} from '../_lib/etsyPriceOutcomes397.mjs';
const out=(body,status=200)=>jsonResponse(body,status,{'Cache-Control':'no-store','X-DD-Outcome-Mode':'operator-evidence-only'});
const connSql="SELECT connection_status,access_expires_at,refresh_expires_at,updated_at FROM oauth_provider_connections WHERE provider_key='etsy' LIMIT 1";
const shopSql="SELECT acceptance_status,verified_at FROM etsy_oauth_shop_connections WHERE provider_key='etsy' LIMIT 1";
const attemptSql="SELECT terminal_status,created_at,completed_at FROM oauth_authorization_transactions WHERE provider_key='etsy' ORDER BY transaction_id DESC LIMIT 1";
const prodSql="SELECT product_id,name,sku,price_cents,currency,updated_at FROM products WHERE product_id=? LIMIT 1";
const sourceSql="SELECT admin_action_audit_id,details_json,created_at FROM admin_action_audit WHERE action_type='product_price_source_approved' AND target_type='product' AND target_id=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const lastSql="SELECT admin_action_audit_id,actor_user_id,details_json,created_at FROM admin_action_audit WHERE action_type='product_price_outcome_reviewed' AND target_type='product' AND target_id=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const keySql="SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='product_price_outcome_reviewed' AND target_type='product' AND target_id=? AND actor_user_id=? AND json_extract(details_json,'$.request_key')=? ORDER BY admin_action_audit_id DESC LIMIT 1";
async function access({request,env,data}){
 if(!data?.ddModuleAccess?.user||String(data.ddModuleAccess.user.role||'').toLowerCase()!=='admin')
  return {error:out({ok:false,error:'Administrator access required.'},401)};
 const admin=verifiedAdminFromModule({request,env,data});
 if(!admin?.user_id)return {error:out({ok:false,error:'Verified administrator session required.'},401)};
 const db=getDb(env);return db?{admin,db}:{error:out({ok:false,error:'Database unavailable.'},503)};
}
function decode(row){if(!row)return null;let d;try{d=JSON.parse(row.details_json||'null');}catch{return null;}
 if(!d||!['record_source_needed','record_discrepancy_review','confirm_approved_price_match'].includes(d.action))return null;
 return {receipt_id:Number(row.admin_action_audit_id),reviewer_user_id:Number(row.actor_user_id||0),
  reviewed_at:row.created_at||null,action:d.action,fingerprint:d.fingerprint,operator_reference:d.operator_reference};}
async function evidence(db,id){
 const p=await db.prepare(prodSql).bind(id).first();
 if(!p)return null;
 const src=await db.prepare(sourceSql).bind(id).first();
 let source=null;
 if(src){try{const d=JSON.parse(src.details_json||'null');
  if(safeCents(d?.approved_price_cents))source={receipt_id:Number(src.admin_action_audit_id),approved_price_cents:d.approved_price_cents};
 }catch{}}
 return {product:{product_id:Number(p.product_id),name:String(p.name||'').slice(0,160),
  sku:String(p.sku||'').slice(0,80)},evidence:priceEvidence397(p,source)};
}
export async function onRequestGet(context){
 const a=await access(context);if(a.error)return a.error;
 const url=new URL(context.request.url),rawId=url.searchParams.get('product_id');
 try{
  const connection=await a.db.prepare(connSql).first(),
    shop=await a.db.prepare(shopSql).first(),
    attempt=await a.db.prepare(attemptSql).first();
  const observability=connectionEvidence397(connection,shop,attempt);
  if(rawId===null)return out({ok:true,observability,product:null,
   evidence_source:'stored_database_only',unverified_remote_status:false,provider_calls_performed:false,
   product_price_mutations:false,listing_writes:false});
  const id=Number(rawId);
  if(!/^[1-9]\d{0,9}$/.test(rawId)||!Number.isSafeInteger(id)||id>2147483647)return out({ok:false,error:'Valid Product ID required.'},400);
  const p=await evidence(a.db,id);if(!p)return out({ok:false,error:'Product not found.'},404);
  const last=decode(await a.db.prepare(lastSql).bind(id).first());
  return out({ok:true,observability,...p,last_operator_outcome:last,
    outcome_review_state:outcomeReviewState397(p.evidence,last),
    price_source_independently_verified:false,price_mutation_performed:false,
    provider_calls_performed:false,listing_writes:false});
 }catch{return out({ok:false,code:'evidence_unavailable',error:'Stored evidence unavailable. Health/outcome is unknown; no automatic retry.',retry_automatically:false},503);}
}
export async function onRequestPost(context){
 const a=await access(context);if(a.error)return a.error;
 let body;try{body=await context.request.json();}catch{return out({ok:false,error:'Invalid JSON.'},400);}
 const input=normalizePriceOutcomeDecision(body);
 if(!input)return out({ok:false,error:'Explicit Product, outcome, evidence reference and acknowledgement required.'},400);
 try{
  const prior=await a.db.prepare(keySql).bind(input.product_id,a.admin.user_id,input.request_key).first();
  if(prior){
   let d;try{d=JSON.parse(prior.details_json||'null');}catch{}
   if(!d||Object.keys(input).some(k=>d[k]!==input[k]))return out({ok:false,code:'request_key_conflict',error:'Request key already used for different evidence.'},409);
   return out({ok:true,already_recorded:true,receipt_id:Number(prior.admin_action_audit_id),product_price_mutated:false,automatic_retry:false});
  }
  const current=await evidence(a.db,input.product_id);
  if(!current)return out({ok:false,error:'Product not found.'},404);
  if(current.evidence.fingerprint!==input.fingerprint)return out({ok:false,code:'source_changed',error:'Product or source evidence changed. Refresh review first.',retry_automatically:false},409);
  if(!decisionAllowed397(input.action,current.evidence))return out({ok:false,code:'invalid_outcome_for_evidence',error:'Requested outcome is not supported by the current original source evidence.',retry_automatically:false},409);
  const before=await a.db.prepare(lastSql).bind(input.product_id).first(),beforeId=Number(before?.admin_action_audit_id||0);
  const detail=JSON.stringify({...input,build:397,independent_source_verification:false,
    product_price_mutated:false,listing_writes:false,provider_calls_performed:false});
  // The conditional insert prevents duplicate receipts when a second operator submits after the same audit head.
  // Source/price changes after the read must also be detected by rechecking the current D1 Product and approved receipt in the insert.
  const sql="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_id,target_key,request_method,request_path,details_json,created_at) "+
    "SELECT ?, 'product_price_outcome_reviewed','product',?,'price_source_outcome','POST',?,?,CURRENT_TIMESTAMP "+
    "WHERE EXISTS (SELECT 1 FROM products WHERE product_id=? AND price_cents=? AND UPPER(currency)=?) "+
    "AND (SELECT COALESCE(MAX(admin_action_audit_id),0) FROM admin_action_audit WHERE action_type='product_price_source_approved' AND target_type='product' AND target_id=?)=? "+
    "AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='product_price_outcome_reviewed' AND target_type='product' AND target_id=? AND admin_action_audit_id>?) "+
    "AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='product_price_outcome_reviewed' AND target_type='product' AND target_id=? AND actor_user_id=? AND json_extract(details_json,'$.request_key')=?)";
  const run=await a.db.prepare(sql).bind(a.admin.user_id,input.product_id,new URL(context.request.url).pathname,detail,
    input.product_id,current.evidence.current_price_cents,current.evidence.currency,
    input.product_id,current.evidence.source_receipt_id||0,
    input.product_id,beforeId,input.product_id,a.admin.user_id,input.request_key).run();
  const stored=await a.db.prepare(keySql).bind(input.product_id,a.admin.user_id,input.request_key).first();
  if(!stored)return out({ok:false,code:'outcome_receipt_unknown',error:'Review changed or receipt outcome unknown. Check the ledger before retrying.',retry_automatically:false},409);
  return out({ok:true,receipt_id:Number(stored.admin_action_audit_id),action:input.action,
    already_recorded:Number(run?.meta?.changes||0)===0,source_operator_attested:true,
    product_price_mutated:false,provider_calls_performed:false,listing_writes:false,automatic_retry:false});
 }catch{return out({ok:false,code:'outcome_save_unknown',error:'Review status unknown. Reload the audit before another action; no automatic retry.',retry_automatically:false},503);}
}
