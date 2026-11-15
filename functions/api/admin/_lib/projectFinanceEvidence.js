// Build 383. Pure conservative math; source ledger amounts must never be summed into booked revenue.
export const TYPES=['revenue_source','material_consumption','labour_cost','production_cost','tax_source','payment_refund','variance_resolution','overall_readiness'];
export const RESULTS=['evidence_missing','needs_reconciliation','reviewed_with_caveat','source_verified'];
export const SOURCES=['creative_project_profitability','creative_work_events','creative_work_order_events','creative_project_inventory_posts','creative_project_production_cost_evidence','orders_payments_refunds','operator_review'];
export const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
export const rows=r=>Array.isArray(r?.results)?r.results:[];
export const moneyOrNull=v=>v===null||v===undefined?null:Number.isFinite(Number(v))?Math.round(Number(v)):null;
export function deriveOrders(orderRows){
 const orders=orderRows||[];return {order_count:orders.length,
  recorded_order_totals_cents:orders.length?orders.reduce((a,o)=>a+Number(o.total_cents||0),0):null,
  recorded_order_tax_cents:orders.length?orders.reduce((a,o)=>a+Number(o.tax_cents||0),0):null,
  gross_paid_cents:orders.length?orders.reduce((a,o)=>a+Number(o.gross_paid_cents||0),0):null,
  refund_cents:orders.length?orders.reduce((a,o)=>a+Number(o.refund_cents||0),0):null,
  net_paid_cents:orders.length?orders.reduce((a,o)=>a+Math.max(0,Number(o.gross_paid_cents||0)-Number(o.refund_cents||0)),0):null,
  revenue_posted_by_these_payments:false,deposit_is_paid_inferred:false};
}
export function evidenceFlags({finance,work,production,inventory,orders,links}){
 const missing=[];
 if(!finance)missing.push('No Finance project-profitability source record');
 if(!work||Number(work.time_rows||0)===0)missing.push('No actual work-order time evidence');
 if(!inventory||Number(inventory.post_count||0)===0)missing.push('No posted project inventory usage; reservations are not consumption');
 if(!production||Number(production.evidence_rows||0)===0)missing.push('No active manufacturing cost-evidence rows');
 if(!links)missing.push('No explicitly linked custom request/order source');
 if(!orders?.order_count)missing.push('No linked order/payment/refund reconciliation');
 return missing;
}

/* Build 718: consolidated bounded pure original-finance source claims and read-only continuity
 * evaluation in an existing finance evidence helper. No new runtime file or schema. */
export function claimIndependentNinth716(c){
 return {v:1,purpose:'devilndove_independent_ninth_source_reattest_716',
  queue_id:c.queue_id,original_706_review_receipt_id:c.original_706_review_receipt_id,
  original_711_renewal_receipt_id:c.original_711_renewal_receipt_id,
  original_712_owner_custody_receipt_id:c.original_712_owner_custody_receipt_id,
  original_710_provenance_sha256:c.original_710_provenance_sha256,
  original_711_renewal_sha256:c.original_711_renewal_sha256,
  source_revision:c.source_revision,fingerprint_sha256:c.fingerprint_sha256,
  independent_reviewer_id:c.independent_reviewer_id,
  disposition:c.disposition,nonce:c.nonce,issued_at:c.issued_at};
}

export function claimExternalCustodySla717(c){
 return {v:1,purpose:'devilndove_external_custody_sla_confirmation_717',
  queue_id:c.queue_id,
  original_706_ninth_review_receipt_id:c.original_706_ninth_review_receipt_id,
  original_711_renewal_receipt_id:c.original_711_renewal_receipt_id,
  original_712_owner_custody_receipt_id:c.original_712_owner_custody_receipt_id,
  original_716_independent_ninth_receipt_id:c.original_716_independent_ninth_receipt_id,
  original_710_provenance_sha256:c.original_710_provenance_sha256,
  original_711_renewal_sha256:c.original_711_renewal_sha256,
  source_revision:c.source_revision,fingerprint_sha256:c.fingerprint_sha256,
  external_verifier_id:c.external_verifier_id,
  disposition:c.disposition,nonce:c.nonce,issued_at:c.issued_at};
}

const originalTime718=x=>Date.parse(String(x||'').replace(/^([0-9]{4}-[0-9]{2}-[0-9]{2}) ([0-9]{2}:[0-9]{2}:[0-9]{2})$/,'$1T$2Z'));

/* Build 718: receipt chronology and renewal horizons are inspected on demand,
 * after original 716 and 717 independently verified Ed25519 readbacks. This
 * audit does not issue fresh signatures or contact an outside verifier. */
export function reviewOriginalExternalSlaContinuity718(a717,a716,a715,a712,current,now=Date.now()){
 const nth=Array.isArray(a716?.receipts)?a716.receipts:[],
  outside=Array.isArray(a717?.receipts)?a717.receipts:[],
  owner=Array.isArray(a715?.items)?a715.items:[],
  original=Array.isArray(a712?.items)?a712.items:[],
  valid=a717?.history_complete===true&&a716?.history_complete===true&&
   a715?.history_complete===true&&a712?.history_complete===true&&
   Number(a717?.invalid_count)===0&&Number(a716?.invalid_count)===0&&
   current?.master_fresh===true&&current?.history_complete===true&&
   Array.isArray(current.open_cases)&&current.open_cases.length===0&&
   Number.isSafeInteger(Number(current.queue_id))&&Number(current.queue_id)>0&&
   a717.campaign_queue_id===current.queue_id&&
   a716.campaign_queue_id===current.queue_id&&
   a715.campaign_queue_id===current.queue_id&&
   a712.campaign_queue_id===current.queue_id;
 let invalid=0,renewal24=0,renewal48=0,renewal72=0,
  outsideAged=0,pendingOutside=0,confirmed=0,unresolved=0;
 const ids=new Set(),seenOutside=new Set(),items=[];
 const ageHours=at=>{
  const t=originalTime718(at);
  return Number.isFinite(t)&&t<=now+300000?
   Math.max(0,Math.floor((now-t)/3600000)):null;
 };
 for(const row of nth.slice(0,40)){
  const renewal=Number(row.original_711_renewal_receipt_id),
   src=original.find(x=>Number(x.renewal_receipt_id_711)===renewal),
   own=owner.find(x=>Number(x.renewal_receipt_id_711)===renewal),
   age=ageHours(row.received_at),
   external=outside.filter(x=>Number(x.original_711_renewal_receipt_id)===renewal),
   ext=external[0],extAge=ageHours(ext?.received_at),
   extIssued=originalTime718(ext?.signed_issued_at),
   ninthTime=originalTime718(row.received_at),
   due=age===null?'INVALID':age>=72?'72H':age>=48?'48H':
    age>=24?'24H':'UNDER_24H',
   source=valid&&Number.isSafeInteger(renewal)&&renewal>0&&
    !ids.has(renewal)&&!!src&&!!own&&
    row.independent_signature_verified===true&&
    Number.isSafeInteger(Number(row.receipt_id))&&
    Number(row.receipt_id)>Number(row.original_712_owner_custody_receipt_id)&&
    own.owner_followup_evidence_verified===true&&
    Number(own.original_custody_evidence_receipt_id)===
     Number(row.original_712_owner_custody_receipt_id)&&
    Number(own.original_ninth_receipt_id)===Number(src.review_706_receipt_id)&&
    age!==null&&ageHours(src.original_711_renewal_recorded_at)!==null&&
    ninthTime>=originalTime718(src.original_711_renewal_recorded_at);
  ids.add(renewal);
  if(!source)invalid++;
  if(source&&age>=24)renewal24++;
  if(source&&age>=48)renewal48++;
  if(source&&age>=72)renewal72++;
  let externalValid=false;
  if(external.length>1)invalid++;
  if(ext){
   externalValid=source&&a717.independent_external_verifier_configured===true&&
    external.length===1&&ext.independent_external_signature_verified===true&&
    Number.isSafeInteger(Number(ext.receipt_id))&&
    Number(ext.receipt_id)>Number(row.receipt_id)&&
    Number(ext.original_716_ninth_receipt_id)===Number(row.receipt_id)&&
    Number(ext.original_712_custody_receipt_id)===
     Number(row.original_712_owner_custody_receipt_id)&&
    !!ext.external_verifier_id&&extAge!==null&&
    Number.isFinite(extIssued)&&extIssued>=ninthTime&&
    extIssued<=originalTime718(ext.received_at)&&
    !seenOutside.has(Number(ext.receipt_id));
   if(!externalValid)invalid++;
   else{
    seenOutside.add(Number(ext.receipt_id));
    if(extAge>=72)outsideAged++;
    if(ext.custody_sla_followup_attested===true)confirmed++;
    else unresolved++;
   }
  }else if(source)pendingOutside++;
  items.push({original_711_renewal_receipt_id:renewal,
   original_716_signed_ninth_receipt_id:Number(row.receipt_id||0),
   original_717_signed_outside_receipt_id:Number(ext?.receipt_id||0)||null,
   ninth_signature_age_hours:age,
   ninth_renewal_horizon:due,
   external_signed_source_age_hours:extAge,
   status:!source||ext&&!externalValid?
    'HOLD_718_ORIGINAL_NINTH_OR_EXTERNAL_SIGNED_SOURCE_DRIFT':
    !ext?'ORIGINAL_NINTH_SIGNED_RENEWAL_OUTSIDE_SLA_SOURCE_HOLD_718':
    ext.custody_sla_followup_attested===true?
     'ORIGINAL_OUTSIDE_SIGNED_SLA_FOLLOWUP_CONTINUITY_CONFIRMED_BOOKS_HOLD_718':
     'ORIGINAL_OUTSIDE_SIGNED_SLA_EXCEPTION_UNRESOLVED_BOOKS_HOLD_718',
   renewal_owner_review_due:source&&age>=24,
   external_followup_independently_signed:!!externalValid,
   independent_external_sla_followup_attested:!!externalValid&&
    ext.custody_sla_followup_attested===true,
   actual_financial_close:false});
 }
 const outstandingNinth=owner.filter(x=>
  !nth.some(row=>Number(row.original_711_renewal_receipt_id)===
   Number(x.renewal_receipt_id_711))).length;
 if(nth.length>40||outside.length>40||owner.length>40)invalid++;
 for(const ext of outside){
  if(!ids.has(Number(ext.original_711_renewal_receipt_id)))invalid++;
 }
 const complete=valid&&invalid===0;
 return {status:!complete?'HOLD_718_EXTERNAL_SLA_ORIGINAL_SIGNATURE_CONTINUITY_DRIFT':
   !a717.independent_external_verifier_configured?
    'HOLD_718_DISTINCT_OUTSIDE_VERIFIER_NOT_CONFIGURED':
   outstandingNinth?'HOLD_718_ORIGINAL_NINTH_INDEPENDENT_SIGNATURE_PENDING':
   pendingOutside?'ORIGINAL_NINTH_RENEWAL_OUTSIDE_SLA_PENDING_HOLD_718':
   !items.length?'HOLD_718_ORIGINAL_SIGNED_NINTH_RENEWAL_REQUIRED':
   renewal72||outsideAged?'ORIGINAL_SIGNED_SOURCE_RENEWAL_AGED_OWNER_REVIEW_DUE_718':
   'ORIGINAL_INDEPENDENT_SIGNED_CONTINUITY_RECONCILED_BOOKS_HOLD_718',
  campaign_queue_id:complete?current.queue_id:null,
  history_complete:complete,items,invalid_count:invalid,
  original_ninth_signed_24h_review_due:renewal24,
  original_ninth_signed_48h_review_due:renewal48,
  original_ninth_signed_72h_review_due:renewal72,
  independently_signed_outside_72h_review_due:outsideAged,
  outside_sla_signed_followup_confirmation_count:confirmed,
  outside_sla_signed_unresolved_exception_count:unresolved,
  outstanding_original_ninth_signed_source_count:outstandingNinth,
  outstanding_outside_signed_source_count:pendingOutside,
  distinct_external_verifier_configured:!!a717?.independent_external_verifier_configured,
  new_ninth_signature_generated:false,
  independent_outside_contact_sent:false,
  actual_bookkeeping_closed:false,continuous_background_monitoring:false};
}

/* Build 721 — derive source-bound owner REVIEW eligibility from original
 * Build 718's independently reverified ninth and outside Ed25519 records.
 * A D1 owner note is NOT an outside signature or financial book approval. */
export function sourceVerifiedOwnerReview721(original,current){
 const n=Number(original?.campaign_queue_id),items=Array.isArray(original?.items)?original.items:[],
  sane=Number.isSafeInteger(n)&&n>0&&original?.history_complete===true&&
   Number(original?.invalid_count)===0&&current?.queue_id===n&&
   current?.master_fresh===true&&current?.history_complete===true&&
   Array.isArray(current.open_cases)&&current.open_cases.length===0&&
   typeof current.source_revision==='string'&&current.source_revision.length>0&&
   typeof current.fingerprint_sha256==='string'&&/^[a-f0-9]{64}$/i.test(current.fingerprint_sha256)&&
   Number(original.outstanding_original_ninth_signed_source_count)===0&&
   Number(original.outstanding_outside_signed_source_count)===0&&
   Number(original.outside_sla_signed_unresolved_exception_count)===0&&
   original.distinct_external_verifier_configured===true;
 const approved=[];
 const seen=new Set();
 for(const row of items.slice(0,40)){
  const renewal=Number(row.original_711_renewal_receipt_id),
   ninth=Number(row.original_716_signed_ninth_receipt_id),
   external=Number(row.original_717_signed_outside_receipt_id),
   ninthAge=row.ninth_signature_age_hours,outsideAge=row.external_signed_source_age_hours;
  const verified=sane&&Number.isSafeInteger(renewal)&&renewal>0&&
   Number.isSafeInteger(ninth)&&ninth>0&&Number.isSafeInteger(external)&&external>ninth&&
   !seen.has(renewal)&&row.external_followup_independently_signed===true&&
   row.independent_external_sla_followup_attested===true&&
   row.actual_financial_close===false&&
   Number.isSafeInteger(ninthAge)&&ninthAge>=0&&ninthAge<72&&
   Number.isSafeInteger(outsideAge)&&outsideAge>=0&&outsideAge<72;
  seen.add(renewal);
  if(verified)approved.push({renewal_receipt_id:renewal,
   ninth_signed_receipt_id:ninth,outside_signed_receipt_id:external});
 }
 const ready=!!sane&&items.length>0&&items.length<=40&&approved.length===items.length;
 return {build:721,ready,queue_id:ready?n:null,
  status:ready?'SOURCE_VERIFIED_OWNER_REVIEW_ELIGIBLE_BOOKS_HOLD_721':
   'HOLD_ORIGINAL_INDEPENDENT_SIGNER_SOURCE_OR_FRESHNESS_721',
  eligible_items:ready?approved:[],owner_approval_recorded_by_this_read:false,
  external_signature_generated:false,external_contact_performed:false,
  financial_books_closed:false,provider_execution:false};
}

/* Build 722: external-issuer *signature* verification; no provider API calls or
 * claim that a currently deployed credential is valid. An enrolled authority is
 * a separate, owner-approved external custodian, never an app or Master key. */
const issuerProviders722=['etsy','meta','pinterest','youtube','tiktok','x','stripe','paypal','square'];
const credentialKinds722=['api_token','client_secret','oauth_token','webhook_secret'];
const receiptFields722=['v','purpose','provider','issuer_id','rotation_event_id',
 'provider_origin_ref','credential_kind','environment','audience','topology_id',
 'issued_at','rotated_at','expires_at','nonce'];
const b64url722=s=>{
 if(typeof s!=='string'||!/^[A-Za-z0-9_-]+$/.test(s))return null;
 try{return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))}
 catch{return null}
};
export function canonicalRotationClaim722(c){
 return Object.fromEntries(receiptFields722.map(k=>[k,c[k]]));
}
export async function verifyIndependentRotationReceipt722(envelope,authority={},now=Date.now()){
 const HOLD=reason=>({build:722,status:'HOLD_'+reason,independent_issuer_signature_verified:false,
  provider_origin_currently_verified:false,deployed_credential_verified:false,
  provider_api_called:false,secret_exposed:false,rotation_performed:false});
 const c=envelope?.claim,sign=envelope?.signature;
 if(!c||typeof c!=='object'||Array.isArray(c)||Object.keys(c).length!==receiptFields722.length||
  receiptFields722.some(k=>!Object.hasOwn(c,k)))return HOLD('CANONICAL_CLAIM_REQUIRED');
 if(c.v!==1||c.purpose!=='devilndove_independent_issuer_credential_rotation_722'||
  !issuerProviders722.includes(c.provider)||!credentialKinds722.includes(c.credential_kind)||
  c.environment!=='production'||c.audience!=='devilndove'||
  c.topology_id!=='rosevear-master-shell-seven-apps.v1'||
  typeof c.rotation_event_id!=='string'||!/^[A-Za-z0-9_.:-]{12,120}$/.test(c.rotation_event_id)||
  typeof c.provider_origin_ref!=='string'||!/^[A-Za-z0-9_.:-]{12,120}$/.test(c.provider_origin_ref)||
  typeof c.nonce!=='string'||!/^[a-f0-9-]{36}$/i.test(c.nonce))
  return HOLD('INVALID_SCOPE_OR_ORIGIN_REFERENCE');
 if(!authority?.issuer_id||c.issuer_id!==authority.issuer_id||
  c.provider!==authority.provider||typeof authority.public_key!=='string'||
  !authority.distinct_external_issuer_enrolled)
  return HOLD('INDEPENDENT_ISSUER_AUTHORITY_NOT_ENROLLED');
 const issued=Date.parse(c.issued_at),rotated=Date.parse(c.rotated_at),expires=Date.parse(c.expires_at);
 if(![issued,rotated,expires].every(Number.isFinite)||issued>now+300000||
  issued<now-900000||rotated>issued||rotated<issued-2592000000||
  expires<=now||expires<=issued||expires-issued>7776000000)
  return HOLD('ISSUER_RECEIPT_TIME_OR_EXPIRY');
 const sig=b64url722(sign),keyBytes=b64url722(authority.public_key);
 if(!sig||sig.length!==64||!keyBytes||keyBytes.length!==32)return HOLD('SIGNATURE_OR_KEY_ENCODING');
 try{
  const key=await crypto.subtle.importKey('raw',keyBytes,{name:'Ed25519'},false,['verify']);
  const valid=await crypto.subtle.verify({name:'Ed25519'},key,sig,
   new TextEncoder().encode(JSON.stringify(canonicalRotationClaim722(c))));
  if(!valid)return HOLD('SIGNATURE_INVALID');
 }catch{return HOLD('SIGNATURE_VERIFICATION_UNAVAILABLE')}
 return {build:722,status:'EXTERNAL_ISSUER_SIGNATURE_VERIFIED_PROVIDER_LIVE_VALIDITY_HOLD',
  provider:c.provider,credential_kind:c.credential_kind,
  rotation_event_id:c.rotation_event_id,issued_at:c.issued_at,expires_at:c.expires_at,
  independent_issuer_signature_verified:true,
  provider_origin_currently_verified:false,deployed_credential_verified:false,
  provider_api_called:false,secret_exposed:false,rotation_performed:false};
}
/* Owner D1 review entries are historical. Re-check against the current
 * independently signed Build 718 source; duplicate/stale events must HOLD. */
export function reconcileOwnerReviewDrift722(ledger,now=Date.now()){
 const entries=Array.isArray(ledger?.receipts)?ledger.receipts:[],
  eligible=new Set((Array.isArray(ledger?.eligible_items)?ledger.eligible_items:[])
   .map(x=>Number(x.renewal_receipt_id)));
 const seen=new Set();let current=0,stale=0,replayed=0,invalid=0;
 for(const row of entries.slice(0,40)){
  const id=Number(row.receipt_id),renewal=Number(row.renewal_receipt_id);
  const when=Date.parse(String(row.recorded_at||'').replace(
   /^([0-9]{4}-[0-9]{2}-[0-9]{2}) ([0-9]{2}:[0-9]{2}:[0-9]{2})$/,'$1T$2Z'));
  if(!Number.isSafeInteger(id)||id<1||!Number.isSafeInteger(renewal)||renewal<1||
   !Number.isFinite(when)||when>now+300000){invalid++;continue}
  if(seen.has(renewal)){replayed++;continue}seen.add(renewal);
  if(row.verified_current===true&&eligible.has(renewal)&&now-when<259200000&&
   now>=when)current++;else stale++;
 }
 const clean=ledger?.ready===true&&entries.length<=40&&replayed===0&&invalid===0&&stale===0;
 return {build:722,status:!ledger?.ready?'HOLD_INDEPENDENT_ORIGINAL_SOURCE':
  replayed||invalid?'HOLD_LEDGER_DUPLICATE_OR_INVALID':
  stale?'HOLD_OWNER_REVIEW_OR_SOURCE_DRIFT':
  !entries.length?'HOLD_NO_OWNER_REVIEW_RECEIPT':
  clean?'OWNER_REVIEW_LEDGER_CURRENT_BOOKS_HOLD':'HOLD_LEDGER_EVIDENCE',
  current_review_count:current,stale_review_count:stale,duplicate_review_count:replayed,
  invalid_review_count:invalid,owner_financial_close_allowed:false,
  record_mutated:false,cross_app_connection_enabled:false};
}
/* The authenticated cross-app envelope transport is not enrolled yet.
 * Validate a proposed route without ever upgrading source metadata to CONNECTED. */
export function reviewSevenAppHandoff722(handoff,controllerMainSha){
 const order=['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub',
  'icamp','yw','devilndove','rosiedazzlers'];
 const sha=x=>typeof x==='string'&&/^[a-f0-9]{40}$/i.test(x);
 const good=handoff?.topology_id==='rosevear-master-shell-seven-apps.v1'&&
  handoff?.source_app==='devilndove'&&handoff?.previous_hop==='yw'&&
  handoff?.next_hop==='rosiedazzlers'&&handoff?.authority_transfer===false&&
  handoff?.payload_class==='PUBLIC_SOURCE_METADATA_ONLY'&&
  handoff?.tenant_data_included===false&&handoff?.private_credentials_included===false&&
  sha(handoff?.source_main_sha)&&sha(controllerMainSha)&&
  handoff?.controller_main_sha===controllerMainSha&&
  /^[A-Za-z0-9_.:-]{16,96}$/.test(String(handoff?.correlation_id||''));
 return {build:722,topology_id:'rosevear-master-shell-seven-apps.v1',
  application_order:order,source_metadata_valid:!!good,
  status:good?'ROUTE_METADATA_VALID_SIGNED_TRANSPORT_HOLD':
   'HOLD_INVALID_SEVEN_APP_ROUTING_OR_AUTHORITY',
  signed_transport_attested:false,receiver_activated:false,
  cross_app_connected:false,owner_signoff_received:false,
  data_transfer_performed:false,tenant_data_copied:false};
}
