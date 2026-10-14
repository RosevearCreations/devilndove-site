// Release 467 Build 397 — pure stored-evidence connection and price-review outcomes.
// No provider traffic, secret access, inferred historic values, product mutation or background jobs.
import {classifyEtsyConnection} from './etsyConnectionObservability.mjs';
import {safeCents,sourcePriceOutcome} from './priceSourceReview394.mjs';
import {validKey,cleanReference} from './etsyOperatorExceptions395.mjs';
const MAX_ID=2147483647;
export const OUTCOME_ACTIONS=Object.freeze(['record_source_needed','record_discrepancy_review','confirm_approved_price_match']);
const safeText=(v,max=60)=>String(v??'').slice(0,max).replace(/[\u0000-\u001f]/g,'');
export function connectionEvidence397(conn,shop,attempt,now=Date.now()){
 const health=classifyEtsyConnection(conn,shop,now);
 const raw=String(attempt?.terminal_status||'').toLowerCase();
 const callback=['completed','success','succeeded'].includes(raw)?'historical_completed':
  ['failed','error','denied','expired'].includes(raw)?'historical_failure':
  raw?'historical_outcome_unknown':'no_recent_callback_evidence';
 const priority=health.status==='connected_verified'?'informational':
  ['reauthorization_required','disconnected'].includes(health.status)?'requires_operator_attention':'review_required';
 return {health_status:health.status,verification_age_days:health.verification_age_days,
  last_verified_at:health.last_verified_at||null,last_connection_change_at:health.last_connection_change_at||null,
  callback_outcome:callback,callback_recorded_at:safeText(attempt?.completed_at||attempt?.created_at||'',40)||null,
  priority,manual_review_required:health.manual_review_required,
  connection_verified_from_stored_evidence:health.status==='connected_verified',
  real_time_etsy_check_performed:false,callback_outcome_not_current_connection_truth:true,
  token_values_emitted:false,automatic_reconnect:false,listing_writes:false};
}
export function priceEvidence397(product,source){
 if(!product)return null;
 const id=Number(product.product_id),price=Number(product.price_cents),currency=String(product.currency||'').toUpperCase();
 const approved=source&&safeCents(source.approved_price_cents)?source.approved_price_cents:null;
 const sourceId=source&&Number.isSafeInteger(Number(source.receipt_id))?Number(source.receipt_id):null;
 const status=currency!=='CAD'||!safeCents(price)?'unsupported_current_price':
  approved===null?'approved_source_missing':
  sourcePriceOutcome(price,approved)==='matches_approved_source'?'approved_source_matches':
  'approved_source_discrepancy';
 return {product_id:id,currency,current_price_cents:safeCents(price)?price:null,
  approved_price_cents:approved,source_receipt_id:sourceId,outcome:status,
  operator_attested_source_not_independently_verified:sourceId!==null,
  price_mutation_performed:false,etsy_listing_written:false,
  fingerprint:[id,currency,safeCents(price)?price:'invalid',approved===null?'no_source':approved,sourceId||'no_receipt',safeText(product.updated_at,40)||'no_update'].join('|')};
}
export function normalizePriceOutcomeDecision(input){
 const productId=Number(input?.product_id),action=String(input?.action||'');
 const fingerprint=String(input?.fingerprint||''),requestKey=String(input?.request_key||'');
 const reference=cleanReference(input?.operator_reference);
 if(!Number.isSafeInteger(productId)||productId<1||productId>MAX_ID||
  !OUTCOME_ACTIONS.includes(action)||!validKey(requestKey)||!reference||
  fingerprint.length<8||fingerprint.length>240||/[\r\n\u0000-\u001f]/.test(fingerprint)||
  input?.operator_confirmed!==true)return null;
 return {product_id:productId,action,fingerprint,operator_reference:reference,
  request_key:requestKey,operator_confirmed:true};
}
export function decisionAllowed397(action,evidence){
 if(!evidence)return false;
 return (action==='record_source_needed'&&evidence.outcome==='approved_source_missing')||
 (action==='record_discrepancy_review'&&evidence.outcome==='approved_source_discrepancy')||
 (action==='confirm_approved_price_match'&&evidence.outcome==='approved_source_matches');
}
export function outcomeReviewState397(evidence,last){
 if(!evidence)return 'unknown';
 if(!last)return 'unreviewed_'+evidence.outcome;
 if(last.fingerprint!==evidence.fingerprint)return 'review_stale_recheck_required';
 if(!decisionAllowed397(last.action,evidence))return 'review_conflicts_with_source_evidence';
 return last.action==='confirm_approved_price_match'?'match_reviewed_by_operator':
  last.action==='record_discrepancy_review'?'discrepancy_investigation_recorded':'awaiting_source_document';
}
