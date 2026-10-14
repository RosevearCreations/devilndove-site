// Build 394 — exact-cent source-backed operator price review; pure validation only.
export const SOURCE_TYPES=Object.freeze([
 'prior_approved_catalog','approved_pricing_decision','prior_price_export','customer_approved_quote'
]);
export function safeCents(value) {
 return Number.isSafeInteger(value)&&value>=0&&value<=999999999;
}
export function normalizeSourceReview(input={}) {
 const productId=Number(input.product_id),observed=Number(input.observed_price_cents);
 const approved=Number(input.approved_price_cents);
 const type=String(input.source_type||'').trim();
 const reference=String(input.source_reference||'').trim();
 const key=String(input.request_key||'').trim();
 if(!Number.isSafeInteger(productId)||productId<1||!safeCents(observed)||!safeCents(approved))return null;
 if(!SOURCE_TYPES.includes(type)||reference.length<6||reference.length>160||/[\r\n\u0000-\u001f]/.test(reference))return null;
 if(!/^[a-zA-Z0-9_-]{16,100}$/.test(key)||input.operator_confirmed_source!==true)return null;
 return {product_id:productId,observed_price_cents:observed,approved_price_cents:approved,
  source_type:type,source_reference:reference,request_key:key,operator_confirmed_source:true};
}
export function sourcePriceOutcome(current,approved) {
 if(!safeCents(current)||!safeCents(approved))return 'source_evidence_required';
 return current===approved?'matches_approved_source':'source_discrepancy_requires_manual_review';
}
export function parseCadInput(input) {
 const m=/^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(String(input??'').trim());
 if(!m)return null;
 const cents=Number(m[1])*100+Number((m[2]||'').padEnd(2,'0'));
 return safeCents(cents)?cents:null;
}
