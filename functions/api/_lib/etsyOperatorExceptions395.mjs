// Build 395 — pure exception projection and operator decision boundaries. No provider calls or mutations.
import {classifyEtsyConnection} from './etsyConnectionObservability.mjs';
import {sourcePriceOutcome,safeCents} from './priceSourceReview394.mjs';
const TOKEN_FILTER=/token|secret|password|bearer|access.key|authorization.code|refresh.key|pkce/i;
export function cleanReference(value){
 const s=String(value??'').trim();
 return s.length>=6&&s.length<=120&&!/[\r\n\u0000-\u001f]/.test(s)&&!TOKEN_FILTER.test(s)?s:null;
}
export function validKey(value){return /^[a-zA-Z0-9_-]{16,100}$/.test(String(value??''));}
export function etsyException(connection,shop,attempt,now=Date.now()){
 const health=classifyEtsyConnection(connection,shop,now);
 const states={not_connected:['connection_not_verified','Complete a fresh Connect Etsy authorization.',true],
  disconnected:['connection_disconnected','Review the connection and authorize again if required.',true],
  reauthorization_required:['authorization_expired','Start a fresh Etsy authorization; never reuse a consumed grant.',true],
  refresh_due:['access_refresh_due','Review the stored access expiry; no automatic retry was attempted.',true],
  verification_unknown:['verification_unknown','Review shop verification and the most recent OAuth callback.',true],
  verification_review_due:['verification_stale','Reverify the Etsy shop through the authorized operator workflow.',true],
  connected_verified:['connection_verified','No current connection exception based on stored evidence.',false]};
 const [code,action,active]=states[health.status]||states.verification_unknown;
 // Never reflect the provider's untrusted diagnostic_code, tokens, or OAuth state into an exception.
 const terminal=String(attempt?.terminal_status||'').toLowerCase().slice(0,40);
 const failedCallback=terminal==='failed'||terminal==='error'||terminal==='denied';
 const kind=active?code:(failedCallback?'historical_callback_review':'connection_verified');
 return {scope:'etsy',code:kind,health_status:health.status,
  evidence_time:String(shop?.verified_at||connection?.updated_at||'').slice(0,40)||null,
  callback_outcome:failedCallback?'historical_failed_callback':'not_active_error',
  active,action:active?action:(failedCallback?'Historical callback failure is not proof the currently verified shop is disconnected.':action),
  manually_verified:false,provider_called:false,listing_written:false,
  fingerprint:['etsy',kind,health.status,health.last_verified_at||'none',connection?.updated_at||'none'].join('|')};
}
export function productPriceException(product,approval){
 const cents=Number(product?.price_cents);
 const approved=approval?.approved_price_cents;
 const currency=String(product?.currency||'').toUpperCase();
 const hasApproval=approval&&safeCents(approved);
 const outcome=currency!=='CAD'||!safeCents(cents)?'unsupported_price_state':
  hasApproval?sourcePriceOutcome(cents,approved):'source_evidence_required';
 const active=outcome!=='matches_approved_source';
 const code=outcome==='matches_approved_source'?'price_matches_approved_source':
 outcome==='source_discrepancy_requires_manual_review'?'source_price_discrepancy':
 outcome==='source_evidence_required'?'source_evidence_required':'unsupported_price_state';
 return {scope:'product',product_id:Number(product?.product_id),code,
  review_outcome:outcome,active,
  action:active?'Review the original approved selling-price source before any separate Product Editor save.':'Current CAD cents match the recorded operator-approved source.',
  manually_verified:false,price_written:false,etsy_listing_written:false,
  fingerprint:['product',Number(product?.product_id),code,String(cents),approval?.receipt_id||'none'].join('|')};
}
export function normalizeOperatorDecision(input){
 const scope=String(input?.scope||''),decision=String(input?.decision||'');
 const productId=Number(input?.product_id||0),fingerprint=String(input?.fingerprint||'');
 const reference=cleanReference(input?.operator_reference);
 if(!['etsy','product'].includes(scope)||!['acknowledge','resolution_reviewed'].includes(decision)||
 !validKey(input?.request_key)||!reference||!fingerprint||fingerprint.length>320||
 /[\r\n\u0000-\u001f]/.test(fingerprint))return null;
 if(scope==='product'&&(!Number.isSafeInteger(productId)||productId<=0))return null;
 if(input?.operator_confirmed!==true)return null;
 return {scope,product_id:scope==='product'?productId:null,decision,
  fingerprint,operator_reference:reference,request_key:String(input.request_key),
  operator_confirmed:true};
}
