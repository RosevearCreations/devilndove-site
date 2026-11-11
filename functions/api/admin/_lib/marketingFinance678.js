// Build 678 — independent, signed marketing-expense attestation and owner-gated ROI.
const rows = r => Array.isArray(r?.results) ? r.results : [];
const parse = s => { try { return JSON.parse(s || '{}'); } catch { return {}; } };
const clean = (v,n=120) => String(v ?? '').trim().slice(0,n);
const positiveId = v => Number.isSafeInteger(Number(v)) && Number(v)>0 ? Number(v) : 0;
const bytes = b64 => Uint8Array.from(atob(String(b64||'').replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const money = v => Number.isSafeInteger(Number(v)) && Number(v)>0 ? Number(v) : 0;
const canonical = v => JSON.stringify({
  v:1, campaign:v.campaign, queue_id:v.queue_id, receipt_reference:v.receipt_reference,
  vendor:v.vendor, amount_cents:v.amount_cents, currency:'CAD',
  original_document_sha256:v.original_document_sha256, checked_at:v.checked_at
});
export function campaignReturn678(revenueCents,costCents) {
  if (!Number.isSafeInteger(revenueCents)||!Number.isSafeInteger(costCents)||costCents<=0||revenueCents<0) return null;
  return {attributed_sales_cents:revenueCents, verified_ad_cost_cents:costCents,
    marketing_contribution_cents:revenueCents-costCents,
    marketing_roi_percent:Math.round(((revenueCents-costCents)/costCents)*10000)/100,
    basis:'gross_order_receipts_before_product_costs_shipping_taxes_and_overheads'};
}
async function verifiedOriginalCost(db,id,ref) {
  return db.prepare(`SELECT a.social_post_attempt_id,a.social_post_queue_id,a.external_post_id,a.response_json,q.utm_campaign
    FROM social_post_attempts a JOIN social_post_queue q ON q.social_post_queue_id=a.social_post_queue_id
    WHERE a.social_post_queue_id=? AND a.external_post_id=? AND a.platform_key='campaign_cost'
    AND a.attempt_status='campaign_cost_recorded' LIMIT 1`).bind(id,ref).first();
}
export async function expenseAttestation678(db,env,admin,payload,record) {
  const id=positiveId(payload.social_post_queue_id),ref=clean(payload.receipt_reference,100),
    vendor=clean(payload.vendor,100),sha=clean(payload.original_document_sha256,64).toLowerCase(),
    checked=clean(payload.checked_at,40),sig=clean(payload.verifier_signature,500),
    key=clean(env?.MARKETING_EXPENSE_VERIFIER_PUBLIC_KEY,500);
  if (!id||!ref||!vendor||!/^([a-f0-9]{64})$/.test(sha)||!sig||!key||payload.owner_reviewed!==true)
    throw Error('Independent original-document digest, enrolled verifier and owner review are required. HOLD.');
  const date=Date.parse(checked);
  if (!Number.isFinite(date)||date>Date.now()+300000||date<Date.now()-90*86400000)
    throw Error('Verifier observation is outside the accepted 90-day window. HOLD.');
  const cost=await verifiedOriginalCost(db,id,ref);
  const details=parse(cost?.response_json);
  if (!cost||!money(details.cost_cents)||details.currency!=='CAD')throw Error('Matching original owner-recorded CAD expense was not found. HOLD.');
  const claim={campaign:cost.utm_campaign,queue_id:id,receipt_reference:ref,vendor,amount_cents:details.cost_cents,
    original_document_sha256:sha,checked_at:new Date(date).toISOString()};
  let genuine=false;
  try {
    const publicKey=await crypto.subtle.importKey('raw',bytes(key),{name:'Ed25519'},false,['verify']);
    genuine=await crypto.subtle.verify({name:'Ed25519'},publicKey,bytes(sig),new TextEncoder().encode(canonical(claim)));
  } catch { genuine=false; }
  if(!genuine)throw Error('Independent verifier signature failed. HOLD; owner attestation cannot substitute.');
  const dup=await db.prepare(`SELECT social_post_attempt_id FROM social_post_attempts
    WHERE platform_key='campaign_cost_verifier' AND attempt_status='independent_expense_verified'
    AND external_post_id=? LIMIT 1`).bind(ref).first();
  if(dup)throw Error('Receipt has already been independently verified; duplicate blocked.');
  await record(db,admin,id,'campaign_cost_verifier','independent_expense_verified',{
    external_post_id:ref,response:{...claim,provenance:'external_ed25519_expense_verifier',
      source_cost_attempt_id:cost.social_post_attempt_id,verifier_signature:sig,roi_certified:false},
    notes:'Signature checked against separately configured independent verifier public key; no owner-only certification.'});
  return {status:'independent_expense_verified',receipt_reference:ref,roi_certified:false,publication_performed:false};
}
async function reconciledCampaign(db,id){
  const post=await db.prepare('SELECT utm_campaign FROM social_post_queue WHERE social_post_queue_id=?').bind(id).first();
  if(!post?.utm_campaign)throw Error('Named campaign not found.');
  // Include every same-named queue item, not just the selected post; do not truncate expense scan.
  const attempts=rows(await db.prepare(`SELECT a.social_post_queue_id,a.platform_key,a.attempt_status,a.external_post_id,a.response_json
    FROM social_post_attempts a JOIN social_post_queue q ON q.social_post_queue_id=a.social_post_queue_id
    WHERE q.utm_campaign=? AND a.attempt_status IN
    ('campaign_cost_recorded','independent_expense_verified','campaign_revenue_bound','campaign_roi_owner_accepted')`).bind(post.utm_campaign).all());
  const costs=attempts.filter(a=>a.attempt_status==='campaign_cost_recorded');
  const signatures=attempts.filter(a=>a.attempt_status==='independent_expense_verified');
  const revenues=attempts.filter(a=>a.attempt_status==='campaign_revenue_bound');
  const seenCost=new Set(),seenOrder=new Set();
  let costCents=0,revenueCents=0;
  const blockers=[];
  for(const item of costs){
    const ref=String(item.external_post_id),d=parse(item.response_json);
    if(seenCost.has(ref)){blockers.push('duplicate_expense_receipt');continue;}
    seenCost.add(ref);
    const signed=signatures.find(a=>a.external_post_id===ref && a.social_post_queue_id===item.social_post_queue_id);
    const evidence=parse(signed?.response_json);
    if(!signed||evidence.source_cost_attempt_id!==undefined && !positiveId(evidence.source_cost_attempt_id)){
      blockers.push('unverified_expense');continue;
    }
    if(evidence.amount_cents!==d.cost_cents||evidence.campaign!==post.utm_campaign||!money(d.cost_cents)){
      blockers.push('expense_evidence_mismatch');continue;
    }
    costCents+=Number(d.cost_cents);
  }
  for(const item of revenues){
    const d=parse(item.response_json),oid=positiveId(d.order_id);
    if(!oid||seenOrder.has(oid)){blockers.push('duplicate_or_invalid_order');continue;}
    seenOrder.add(oid);
    const order=await db.prepare('SELECT total_cents,currency,payment_status FROM orders WHERE order_id=?').bind(oid).first();
    const pay=await db.prepare(`SELECT COALESCE(SUM(CASE WHEN LOWER(payment_status) IN ('paid','completed','captured') THEN amount_cents ELSE 0 END),0) settled,
      COALESCE(SUM(CASE WHEN LOWER(payment_status) IN ('refunded','partially_refunded') THEN 1 ELSE 0 END),0) refunds
      FROM payments WHERE order_id=? AND UPPER(currency)='CAD'`).bind(oid).first();
    if(!order||order.currency!=='CAD'||!money(order.total_cents)||Number(pay?.refunds)>0||
       ['refunded','partially_refunded','cancelled','failed'].includes(String(order.payment_status||'').toLowerCase())||
       Number(pay?.settled)<Number(order.total_cents)||d.campaign!==post.utm_campaign){
      blockers.push('order_settlement_changed');continue;
    }
    revenueCents+=Number(order.total_cents);
  }
  if(!costs.length)blockers.push('no_cost_receipts');
  if(!revenues.length)blockers.push('no_bound_paid_orders');
  const metrics=campaignReturn678(revenueCents,costCents);
  if(!metrics)blockers.push('invalid_or_missing_verified_cost');
  const accepted=attempts.some(a=>a.attempt_status==='campaign_roi_owner_accepted'&&
    parse(a.response_json).fingerprint===JSON.stringify({costCents,revenueCents,receipts:seenCost.size,orders:seenOrder.size}));
  return {campaign:post.utm_campaign,queue_id:id,metrics,receipt_count:seenCost.size,verified_receipt_count:signatures.length,
    paid_order_count:seenOrder.size,blockers:[...new Set(blockers)],
    signoff: !blockers.length && accepted ? 'OWNER_ACCEPTED_MARKETING_RETURN' : 'HOLD',
    profitability_status:'HOLD_PRODUCT_COSTS_TAXES_AND_OVERHEADS',roi_certified:false};
}
export async function ownerSignoff678(db,admin,payload,record){
  const id=positiveId(payload.social_post_queue_id);
  if(!id||payload.owner_reviewed!==true||payload.confirm_gross_basis!==true)
    throw Error('Explicit owner review and acknowledgement of gross-sales basis required.');
  const view=await reconciledCampaign(db,id);
  if(view.blockers.length)throw Error('Cannot sign off: '+view.blockers.join(', '));
  const fingerprint=JSON.stringify({costCents:view.metrics.verified_ad_cost_cents,revenueCents:view.metrics.attributed_sales_cents,
    receipts:view.receipt_count,orders:view.paid_order_count});
  const ref='owner_roi:'+view.campaign+':'+fingerprint;
  const duplicate=await db.prepare(`SELECT social_post_attempt_id FROM social_post_attempts
    WHERE platform_key='campaign_roi' AND attempt_status='campaign_roi_owner_accepted' AND external_post_id=? LIMIT 1`).bind(ref).first();
  if(duplicate) return {status:'already_owner_accepted',...view,publication_performed:false};
  await record(db,admin,id,'campaign_roi','campaign_roi_owner_accepted',{
    external_post_id:ref,response:{fingerprint,metrics:view.metrics,campaign:view.campaign,
      owner_user_id:admin.user_id,profitability_certified:false},
    notes:'Owner accepts verified ad-spend/gross-order marketing return only. Net profit and independently certified ROI remain HOLD.'});
  return {status:'owner_accepted_marketing_return',...view,publication_performed:false};
}
export async function financialSummary678(db,id){
  if(!positiveId(id))return {status:'HOLD_SELECT_CAMPAIGN',roi_certified:false};
  return reconciledCampaign(db,Number(id));
}
