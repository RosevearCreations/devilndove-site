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
