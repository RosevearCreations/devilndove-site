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

/* Build 724 — strict, offline read-only Master metadata authentication.
 * This Admin review is NOT a network Master transport handshake or T4 grant.
 * No private signing key is held by this application. */
const app724='devilndove',topology724='rosevear-master-shell-seven-apps.v1';
const masterSources724=['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub'];
const emptySha724='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const envelopeFields724=['v','schema','topology_id','source_app','destination_app','audience',
 'environment','method','path','channel','issuer_id','key_id','issued_at',
 'expires_at','nonce','body_sha256','source_main_sha'];
const rotationFields724=['v','schema','topology_id','source_app','destination_app',
 'old_issuer_id','old_key_id','new_key_id','new_public_key','rotation_event_ref',
 'reviewer_id','issued_at','expires_at','nonce'];
const exact724=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&
 Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const key724=(b)=>{if(typeof b!=='string'||!/^[a-zA-Z0-9_-]{43}$/.test(b))return null;
 try{const bytes=Uint8Array.from(atob(b.replace(/-/g,'+').replace(/_/g,'/')+'='),x=>x.charCodeAt(0));
 return bytes.length===32?bytes:null;}catch{return null;}};
const sig724=(b)=>{if(typeof b!=='string'||!/^[a-zA-Z0-9_-]{86}$/.test(b))return null;
 try{const bytes=Uint8Array.from(atob(b.replace(/-/g,'+').replace(/_/g,'/')+'=='),x=>x.charCodeAt(0));
 return bytes.length===64?bytes:null;}catch{return null;}};
const hold724=reason=>({build:724,status:'HOLD_'+reason,
 signature_verified:false,local_d1_receipt_recorded:false,
 cryptographic_transport_connected:false,service_to_service_accepted:false,
 master_t4_authorized:false,receiver_t5_activated:false,
 provider_write:false,financial_books_closed:false});
const timestamp724=(issued,expires,now,maxAge=120000)=>{
 const a=Date.parse(issued),b=Date.parse(expires);
 return Number.isFinite(a)&&Number.isFinite(b)&&issued===new Date(a).toISOString()&&
  expires===new Date(b).toISOString()&&a<=now+5000&&a>=now-maxAge&&
  b>now&&b>a&&b-a<=300000;
};
async function edVerify724(publicKey,signature,claim){
 const keyBytes=key724(publicKey),signatureBytes=sig724(signature);
 if(!keyBytes||!signatureBytes)return false;
 try{const imported=await crypto.subtle.importKey('raw',keyBytes,{name:'Ed25519'},false,['verify']);
  return await crypto.subtle.verify({name:'Ed25519'},imported,signatureBytes,
   new TextEncoder().encode(JSON.stringify(claim)));}
 catch{return false;}
}
export const masterEnvelopeFields724=Object.freeze([...envelopeFields724]);
export const custodyRotationFields724=Object.freeze([...rotationFields724]);
export function canonicalMasterEnvelope724(c){
 return Object.fromEntries(envelopeFields724.map(k=>[k,c[k]]));
}
export function canonicalCustodyRotation724(c){
 return Object.fromEntries(rotationFields724.map(k=>[k,c[k]]));
}
export function masterTrustStatus724(env={}){
 const has=k=>typeof env[k]==='string'&&env[k].trim().length>0;
 const p=['DND724_MASTER_SOURCE_APP','DND724_MASTER_ISSUER_ID','DND724_MASTER_KEY_ID',
  'DND724_MASTER_PUBLIC_KEY','DND724_MASTER_SOURCE_SHA',
  'DND724_CUSTODY_REVIEWER_ID','DND724_CUSTODY_REVIEWER_PUBLIC_KEY'];
 const filled=p.filter(has),missing=p.filter(k=>!has(k));
 return {build:724,topology_id:topology724,source_contract:'rosevear.master-communications.v1',
  source_pin_names_present:filled,source_pin_names_missing:missing,
  configured_pin_names_count:filled.length,
  pinned_source_is_master:masterSources724.includes(env.DND724_MASTER_SOURCE_APP),
  independent_custody_source_originally_verified:false,
  signed_transport_runtime_connected:false,zero_trust_service_route_enabled:false,
  owner_original_source_handoff_only:true,d1_replay_receipt_uniqueness_enforced:false,
  replay_admission_policy:'NO_RUNTIME_ADMISSION_UNTIL_UNIQUE_D1_KEY_AND_OWNER_SIGNED_SOURCE',
  routing_mode:'SOURCE_METADATA_ONLY_NO_NETWORK_SEND',
  receiver_t5:'UNKNOWN_HOLD',auth_t4:'SIGNED_SOURCE_NOT_ENROLLED',
  master_apps:[...masterSources724],channels:['SECURITY_EVIDENCE','HEALTH_EVIDENCE'],
  no_direct_peer_database_writes:true,no_secret_bearer_forwarding:true,
  actual_seven_app_connected:false,owner_completion_measured:false};
}
export async function verifyMasterEnvelope724(envelope,pin={},now=Date.now()){
 const c=envelope?.claim;
 if(!exact724(c,envelopeFields724))return hold724('CANONICAL_ENVELOPE_REQUIRED');
 if(c.v!==1||c.schema!=='rosevear.dnd.master.readonly-envelope.v1'||
  c.topology_id!==topology724||!masterSources724.includes(c.source_app)||
  c.destination_app!==app724||c.audience!=='devilndove:health-security:source-only'||
  c.environment!=='TEST'||c.method!=='GET'||
  !['/api/integration/v1/health','/api/integration/v1/capabilities'].includes(c.path)||
  !['SECURITY_EVIDENCE','HEALTH_EVIDENCE'].includes(c.channel)||
  c.body_sha256!==emptySha724||!timestamp724(c.issued_at,c.expires_at,now)||
  !/^[a-f0-9]{40}$/.test(c.source_main_sha||'')||
  !/^[a-f0-9]{32}$/.test(c.nonce||'')||
  !/^[A-Za-z0-9._:-]{8,100}$/.test(c.issuer_id||'')||
  !/^[A-Za-z0-9._:-]{6,100}$/.test(c.key_id||''))
  return hold724('SOURCE_AUDIENCE_OR_FRESHNESS');
 if(pin.revoked===true||pin.owner_independent_signer_enrolled!==true||
  c.source_app!==pin.source_app||c.issuer_id!==pin.issuer_id||
  c.key_id!==pin.key_id||c.source_main_sha!==pin.source_main_sha||
  !key724(pin.public_key))
  return hold724('SOURCE_ISSUER_OR_REVOCATION_NOT_PROVEN');
 if(!await edVerify724(pin.public_key,envelope.signature,canonicalMasterEnvelope724(c)))
  return hold724('ED25519_SIGNATURE_INVALID');
 return {...hold724('DURABLE_REPLAY_AND_MASTER_HANDSHAKE_NOT_ADMITTED'),
  signature_verified:true,source_app:c.source_app,key_id:c.key_id,
  nonce:c.nonce,source_main_sha:c.source_main_sha,
  metadata_only:true,private_key_exported:false,
  provider_live_operation:false};
}
export async function verifyKeyCustodyRotation724(rotation,pin={},now=Date.now()){
 const c=rotation?.claim;
 if(!exact724(c,rotationFields724))return hold724('CANONICAL_ROTATION_REQUIRED');
 if(c.v!==1||c.schema!=='rosevear.dnd.master.key-rotation.v1'||
  c.topology_id!==topology724||!masterSources724.includes(c.source_app)||
  c.destination_app!==app724||!timestamp724(c.issued_at,c.expires_at,now)||
  !/^[a-f0-9]{32}$/.test(c.nonce||'')||
  !/^[A-Za-z0-9._:-]{12,120}$/.test(c.rotation_event_ref||'')||
  !/^[A-Za-z0-9._:-]{6,100}$/.test(c.new_key_id||''))
  return hold724('INVALID_ROTATION_METADATA_OR_AGE');
 if(pin.revoked===true||pin.owner_independent_signer_enrolled!==true||
  pin.independent_reviewer_enrolled!==true||c.source_app!==pin.source_app||
  c.old_issuer_id!==pin.issuer_id||c.old_key_id!==pin.key_id||
  c.reviewer_id!==pin.reviewer_id||c.reviewer_id===c.old_issuer_id||
  c.new_key_id===c.old_key_id||!key724(c.new_public_key)||
  !key724(pin.public_key)||!key724(pin.reviewer_public_key)||
  c.new_public_key===pin.public_key||
  pin.public_key===pin.reviewer_public_key)
  return hold724('INDEPENDENT_REVIEWER_OR_OLD_NEW_KEY_SEPARATION');
 const canonical=canonicalCustodyRotation724(c);
 const [oldValid,reviewValid]=await Promise.all([
  edVerify724(pin.public_key,rotation.old_signature,canonical),
  edVerify724(pin.reviewer_public_key,rotation.reviewer_signature,canonical)]);
 if(!oldValid||!reviewValid)return hold724('DUAL_INDEPENDENT_SIGNATURE_INVALID');
 return {...hold724('ROTATION_SIGNED_BUT_NOT_ENROLLED_OR_REPLAY_ADMITTED'),
  signature_verified:true,dual_independent_signatures_verified:true,
  rotation_event_ref:c.rotation_event_ref,source_app:c.source_app,
  old_key_id:c.old_key_id,new_key_id:c.new_key_id,
  new_key_automatically_enrolled:false,private_key_received:false};
}
/* Local D1 admin review receipt uses the preexisting audit table. Its
 * NOT EXISTS guard handles a sequential replay but there is NO unique D1
 * constraint. The resulting receipt NEVER grants runtime transport. */
export async function recordMasterReplayReview724(db,actor,verified,rotation){
 const deny=reason=>({...hold724(reason),receipt_id:null,
  durable_review_receipt:false,db_unique_replay_constraint:false});
 if(!db||!actor||!Number.isSafeInteger(actor.user_id)||actor.user_id<1||
  verified?.signature_verified!==true||rotation?.dual_independent_signatures_verified!==true||
  verified.source_app!==rotation.source_app||verified.key_id!==rotation.old_key_id)
  return deny('ORIGINAL_SOURCE_CUSTODY_OR_D1_REQUIRED');
 const basis=[verified.source_app,verified.key_id,verified.nonce,rotation.rotation_event_ref].join(':');
 let digest;
 try{const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(basis)));
 digest=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');}
 catch{return deny('DIGEST_UNAVAILABLE')}
 try{
  const detail=JSON.stringify({build:724,source:verified.source_app,
   key_id:verified.key_id,old_rotation_key_id:rotation.old_key_id,
   new_rotation_key_id:rotation.new_key_id,rotation_event_ref:rotation.rotation_event_ref,
   receipt_scope:'ADMIN_SOURCE_REVIEW_ONLY',runtime_handshake:false,
   independent_transport_ack:false,receiver_enabled:false});
  const receipt=await db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,'dnd_master_source_review_724','signed_source_nonce',?,'POST','/api/admin/production-variable-audit-406',?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='dnd_master_source_review_724' AND target_type='signed_source_nonce' AND target_key=?)")
   .bind(actor.user_id,digest,detail,digest).run();
  if(!receipt?.success||Number(receipt.meta?.changes)!==1)return deny('REPLAY_OR_ORIGINAL_D1_WRITE_FAILED');
  const count=await db.prepare("SELECT COUNT(*) AS n, MIN(admin_action_audit_id) AS first_id FROM admin_action_audit WHERE action_type='dnd_master_source_review_724' AND target_type='signed_source_nonce' AND target_key=?")
   .bind(digest).first();
  if(Number(count?.n)!==1||!Number.isSafeInteger(Number(count?.first_id))||Number(count.first_id)<1)
   return deny('D1_REPLAY_RECEIPT_READBACK_AMBIGUOUS');
  return {...hold724('D1_REPLAY_REVIEW_ONLY_TRANSPORT_NOT_CONNECTED'),
   durable_review_receipt:true,receipt_id:Number(count.first_id),
   db_unique_replay_constraint:false,review_recorded_not_network_sent:true};
 }catch{return deny('D1_LEDGER_SCHEMA_OR_READBACK_UNAVAILABLE')}
}

/* Build 726 — original DND-only source events, NOT remote message sending.
 * Canonical migration 0051 enforces atomic dedupe + immutable one terminal
 * local review/externally signed ACK-review. Source is all non-personal metadata. */
const _families726=new Set(['DND_HEALTH_EVIDENCE','DND_SECURITY_EVIDENCE']);
const _masters726=new Set(['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub']);
const _empty726='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const _sha726=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const _commit726=v=>typeof v==='string'&&/^[a-f0-9]{40}$/.test(v);
const _uuid726=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v);
const _receiptFields726=['v','schema_id','topology_id','from_app','to_app',
 'event_id','source_main_sha','peer_main_sha','dedupe_sha256','issued_at','expires_at','nonce','outcome'];
const _hold726=(reason)=>({build:726,status:'HOLD_'+reason,
 durable_event_inserted:false,independent_peer_delivery_verified:false,
 network_message_sent:false,master_connected:false,receiver_activated:false,
 peer_database_written:false,financial_books_closed:false});
const _digest726=async data=>{
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(data));
 return Array.from(new Uint8Array(digest),c=>c.toString(16).padStart(2,'0')).join('');
};
export function eventEnvelopeContract726(){
 return {build:726,schema_id:'rosevear.dnd.event.v2',
  protocol:{major:1,minor:1},backward_compatible_with:'1.0',
  legacy_1_0_health_capabilities_unchanged:true,
  topology_id:'rosevear-master-shell-seven-apps.v1',
  source_app:'devilndove',approved_source_event_families:[..._families726],
  approved_target_masters:[..._masters726],body_sha256:_empty726,
  private_payload_in_event:false,
  db_schema:'0051_release467_event_outbox_dedupe_ack_deadletter.sql',
  unique_dedupe_enforced_by_d1_migration:true,
  terminal_dispositions:['LOCAL_DEAD_LETTER','SIGNED_ACK_REVIEW'],
  original_ack_source_custody_verified:false,operator_inbox_local_only:true,
  network_sender_enabled:false,automatic_retry_enabled:false,
  live_master_ack_verified:false,connected:false,original_host_t5_enabled:false};
}
export function validateSourceEvent726(p){
 const keys=['request_key','target_app','event_type','source_main_sha',
  'tenant_scope_sha256','consent_scope_sha256','owner_review_confirmed'];
 if(!exact724(p,keys))return _hold726('EXACT_NONPRIVATE_SOURCE_METADATA_ONLY');
 if(!/^[A-Za-z0-9._:-]{16,80}$/.test(p.request_key||'')||
  !_masters726.has(p.target_app)||!_families726.has(p.event_type)||
  !_commit726(p.source_main_sha)||!_sha726(p.tenant_scope_sha256)||
  !_sha726(p.consent_scope_sha256)||p.owner_review_confirmed!==true)
  return _hold726('SOURCE_SCOPE_OR_EXPLICIT_OWNER_REVIEW');
 return {build:726,valid_local_source_proposal:true,source_review_only:true,
  original_peer_witness_verified:false,remote_ack_verified:false};
}
export async function queueSourceEvent726(db,admin,p){
 const valid=validateSourceEvent726(p);
 if(!valid.valid_local_source_proposal||!db||!Number.isSafeInteger(Number(admin?.user_id))||
  Number(admin.user_id)<1)return _hold726('INVALID_SOURCE_OR_D1_ADMIN');
 try{
  const id=crypto.randomUUID();
  const dedupe=await _digest726(JSON.stringify([p.request_key,p.target_app,p.event_type,
    p.source_main_sha,p.tenant_scope_sha256,p.consent_scope_sha256]));
  const result=await db.prepare("INSERT INTO dnd_event_outbox_726(event_id,dedupe_sha256,event_type,target_app,source_main_sha,tenant_scope_sha256,consent_scope_sha256,created_by_user_id) VALUES(?,?,?,?,?,?,?,?)")
   .bind(id,dedupe,p.event_type,p.target_app,p.source_main_sha,p.tenant_scope_sha256,
    p.consent_scope_sha256,Number(admin.user_id)).run();
  if(result?.success!==true||Number(result.meta?.changes)!==1)
   return _hold726('D1_EVENT_INSERT_NOT_CONFIRMED');
  const row=await db.prepare("SELECT event_id FROM dnd_event_outbox_726 WHERE dedupe_sha256=? LIMIT 1")
   .bind(dedupe).first();
  if(row?.event_id!==id)return _hold726('ORIGINAL_D1_EVENT_READBACK_MISMATCH');
  return {..._hold726('LOCAL_EVENT_HELD_NO_TRANSPORT'),durable_event_inserted:true,
   event_id:id,local_source_review:true,db_unique_dedupe_constraint:true,
   source_main_sha:p.source_main_sha};
 }catch{
  return _hold726('D1_DUPLICATE_OR_SCHEMA_UNAVAILABLE_REVIEW_BEFORE_RETRY');
 }
}
export async function inspectSourceEvents726(db,limit=15){
 if(!db)return {..._hold726('D1_UNAVAILABLE'),events:[]};
 try{
  const q=await db.prepare("SELECT e.event_id,e.event_type,e.target_app,e.source_main_sha,e.created_at,d.decision,d.disposition_id,d.created_at AS disposition_at FROM dnd_event_outbox_726 e LEFT JOIN dnd_event_dispositions_726 d ON d.event_id=e.event_id ORDER BY e.created_at DESC,e.event_id DESC LIMIT ?").bind(Math.min(20,Math.max(1,Number(limit)||15))).all();
  return {build:726,source:'ORIGINAL_DND_D1_LOCAL_SOURCE_ONLY',events:(q?.results||[]).map(x=>({
   event_id:x.event_id,event_type:x.event_type,target_app:x.target_app,
   source_main_sha:x.source_main_sha,created_at:x.created_at,
   local_disposition:x.decision||'HELD_UNSENT',
   disposition_id:x.disposition_id||null,disposition_at:x.disposition_at||null,
   real_peer_ack_verified:false,network_delivery_verified:false
  })),cross_app_connected:false,external_peer_writes:false};
 }catch{return {..._hold726('D1_SCHEMA_OR_READBACK_UNAVAILABLE'),events:[]}}
}
export async function localDeadLetterReview726(db,admin,p){
 if(!db||!Number.isSafeInteger(Number(admin?.user_id))||Number(admin.user_id)<1||
  !_uuid726(p?.event_id)||p.owner_review_confirmed!==true||
  typeof p.note!=='string'||p.note.trim().length<24||p.note.trim().length>400)
  return _hold726('ORIGINAL_ADMIN_DEAD_LETTER_REVIEW_REQUIRED');
 try{
  const evidence=await _digest726(JSON.stringify(['LOCAL_DEAD_LETTER',p.event_id,p.note.trim()]));
  const insert=await db.prepare("INSERT INTO dnd_event_dispositions_726(event_id,decision,evidence_sha256,original_peer_signature_valid,note,created_by_user_id) VALUES(?,'LOCAL_DEAD_LETTER',?,0,?,?)")
   .bind(p.event_id,evidence,p.note.trim(),Number(admin.user_id)).run();
  if(insert?.success!==true||Number(insert.meta?.changes)!==1)
   return _hold726('D1_DEAD_LETTER_WRITE_NOT_CONFIRMED');
  const row=await db.prepare("SELECT disposition_id,decision FROM dnd_event_dispositions_726 WHERE event_id=?")
   .bind(p.event_id).first();
  if(row?.decision!=='LOCAL_DEAD_LETTER'||Number(row?.disposition_id)<1)
   return _hold726('D1_DEAD_LETTER_READBACK_MISMATCH');
  return {..._hold726('LOCAL_DEAD_LETTER_ONLY_NO_REMOTE_DELIVERY'),
   durable_local_dead_letter:true,disposition_id:Number(row.disposition_id),
   event_id:p.event_id,remediation_requires_original_owner_gate:true};
 }catch{return _hold726('D1_TERMINAL_DISPOSITION_DUPLICATE_OR_SCHEMA_UNAVAILABLE')}
}
export const peerAckCanonicalFields726=Object.freeze([..._receiptFields726]);
export function canonicalPeerAck726(c){
 return Object.fromEntries(_receiptFields726.map(k=>[k,c[k]]));
}
export async function verifyPeerAckReview726(envelope,event,pin,now=Date.now()){
 const c=envelope?.claim;
 if(!exact724(c,_receiptFields726)||!event||c.v!==2||
  c.schema_id!=='rosevear.dnd.event.ack.v2'||
  c.topology_id!=='rosevear-master-shell-seven-apps.v1'||
  !_masters726.has(c.from_app)||c.to_app!=='devilndove'||c.outcome!=='ACK'||
  c.event_id!==event.event_id||c.from_app!==event.target_app||
  c.source_main_sha!==event.source_main_sha||!_commit726(c.peer_main_sha)||
  c.dedupe_sha256!==event.dedupe_sha256||!_uuid726(c.event_id)||
  !/^[a-f0-9]{32}$/.test(c.nonce||'')||
  !timestamp724(c.issued_at,c.expires_at,now,120000))
  return {..._hold726('WRONG_EVENT_AUDIENCE_OR_FRESHNESS'),signature_verified:false};
 if(pin?.source_app!==c.from_app||pin?.revoked===true||
  pin?.peer_main_sha!==c.peer_main_sha||
  pin?.original_source_enrollment_verified!==true||
  !key724(pin?.public_key))
  return {..._hold726('SOURCE_KEY_OR_INDEPENDENT_ENROLLMENT_MISSING'),signature_verified:false};
 const passed=await edVerify724(pin.public_key,envelope.signature,canonicalPeerAck726(c));
 return {..._hold726(passed?'SIGNED_RECEIPT_CANDIDATE_ONLY_ORIGINAL_PEER_DELIVERY_NOT_PROVEN':
   'PEER_ED25519_ACK_SIGNATURE_INVALID'),signature_verified:passed,
  original_source_enrollment_claimed:passed,
  original_peer_delivery_verified:false,source_app:passed?c.from_app:null,
  event_id:passed?c.event_id:null,receipt_sha256:passed?await _digest726(JSON.stringify(c)):null};
}
export async function signedPeerAckReview726(db,admin,proof,p){
 if(!db||!Number.isSafeInteger(Number(admin?.user_id))||Number(admin.user_id)<1||
  proof?.signature_verified!==true||!_uuid726(proof.event_id)||
  !_sha726(proof.receipt_sha256)||p?.owner_review_confirmed!==true||
  typeof p.note!=='string'||p.note.trim().length<24||p.note.trim().length>400)
  return _hold726('ORIGINAL_SIGNED_PEER_ACK_ADMIN_REVIEW_REQUIRED');
 try{
  const result=await db.prepare("INSERT INTO dnd_event_dispositions_726(event_id,decision,evidence_sha256,original_peer_signature_valid,note,created_by_user_id) VALUES(?,'SIGNED_ACK_REVIEW',?,1,?,?)")
   .bind(proof.event_id,proof.receipt_sha256,p.note.trim(),Number(admin.user_id)).run();
  if(result?.success!==true||Number(result.meta?.changes)!==1)
   return _hold726('SIGNED_ACK_D1_WRITE_NOT_CONFIRMED');
  const row=await db.prepare("SELECT disposition_id,decision FROM dnd_event_dispositions_726 WHERE event_id=?")
   .bind(proof.event_id).first();
  if(row?.decision!=='SIGNED_ACK_REVIEW'||Number(row?.disposition_id)<1)
   return _hold726('SIGNED_ACK_READBACK_MISMATCH');
  return {..._hold726('SIGNED_ACK_REVIEW_RECORDED_REAL_PEER_ACK_NOT_PROVEN'),
   local_signed_ack_review_recorded:true,disposition_id:Number(row.disposition_id),
   event_id:proof.event_id};
 }catch{return _hold726('D1_ACK_DISPOSITION_DUPLICATE_OR_SCHEMA_UNAVAILABLE')}
}
