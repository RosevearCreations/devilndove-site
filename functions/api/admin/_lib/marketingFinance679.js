// Build 679: verified per-order cost allocations, tax-excluded net contribution and read-only Master evidence.
const list=r=>Array.isArray(r?.results)?r.results:[];
const unpack=s=>{try{return JSON.parse(s||'{}')}catch{return {}}};
const str=(s,n=120)=>String(s??'').trim().slice(0,n);
const num=n=>Number.isSafeInteger(Number(n))?Number(n):NaN;
const validId=n=>Number.isSafeInteger(num(n))&&num(n)>0;
const axes=['product_cogs','shipping_fulfilment','payment_processing','overhead_allocated'];
const u8=b=>Uint8Array.from(atob(str(b,500).replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const identity=v=>JSON.stringify({version:1,order_id:v.order_id,campaign:v.campaign,axis:v.axis,
  reference:v.reference,issuer:v.issuer,amount_cents:v.amount_cents,currency:'CAD',
  source_sha256:v.source_sha256,observed_at:v.observed_at});
export function netContribution679({total_cents,tax_cents,verified_ad_cost_cents,verified_operating_cost_cents}){
  const values=[total_cents,tax_cents,verified_ad_cost_cents,verified_operating_cost_cents].map(num);
  if(values.some(x=>!Number.isSafeInteger(x)||x<0)||values[1]>values[0])return null;
  const revenue=values[0]-values[1],net=revenue-values[2]-values[3];
  return {tax_excluded_receipts_cents:revenue,verified_ad_cost_cents:values[2],
    verified_operating_cost_cents:values[3],net_contribution_cents:net,
    net_margin_percent:revenue>0?Math.round(net/revenue*10000)/100:null,
    status:'VERIFIED_SOURCE_BASIS_NOT_AUDITED_FINANCIAL_STATEMENT'};
}
async function campaignRows(db,queueId){
  const queue=await db.prepare('SELECT utm_campaign FROM social_post_queue WHERE social_post_queue_id=?').bind(queueId).first();
  if(!queue?.utm_campaign)throw Error('Named source campaign required.');
  const rows=list(await db.prepare(`SELECT a.social_post_attempt_id,a.social_post_queue_id,a.platform_key,a.attempt_status,
    a.external_post_id,a.response_json FROM social_post_attempts a
    JOIN social_post_queue q ON q.social_post_queue_id=a.social_post_queue_id
    WHERE q.utm_campaign=? AND a.attempt_status IN
    ('campaign_revenue_bound','campaign_cost_recorded','independent_expense_verified',
     'verified_order_cost_679','net_campaign_owner_accepted_679')`).bind(queue.utm_campaign).all());
  return {name:queue.utm_campaign,rows};
}
async function settledOrder(db,id){
  const order=await db.prepare('SELECT order_id,total_cents,tax_cents,currency,payment_status FROM orders WHERE order_id=?').bind(id).first();
  if(!order||order.currency!=='CAD'||!validId(order.total_cents)||num(order.tax_cents)<0||
     num(order.tax_cents)>num(order.total_cents)||
     ['refunded','partially_refunded','cancelled','failed'].includes(String(order.payment_status).toLowerCase()))
    throw Error('Order currency, settlement or tax source unsafe. HOLD.');
  const paid=await db.prepare(`SELECT COALESCE(SUM(CASE WHEN LOWER(payment_status) IN
    ('paid','completed','captured') THEN amount_cents ELSE 0 END),0) paid,
    COALESCE(SUM(CASE WHEN LOWER(payment_status) IN
    ('refunded','partially_refunded') THEN 1 ELSE 0 END),0) refunds
    FROM payments WHERE order_id=? AND UPPER(currency)='CAD'`).bind(id).first();
  if(num(paid?.paid)<num(order.total_cents)||num(paid?.refunds)!==0)
    throw Error('Order no longer fully paid or refund detected. HOLD.');
  return order;
}
export async function verifyCost679(db,env,admin,payload,record){
  const queueId=num(payload.social_post_queue_id),id=num(payload.order_id),axis=str(payload.axis,60),
    reference=str(payload.reference,100),issuer=str(payload.issuer,120),
    cents=num(payload.amount_cents),digest=str(payload.source_sha256,64).toLowerCase(),
    date=Date.parse(str(payload.observed_at,50)),signature=str(payload.verifier_signature,500),
    publicKey=str(env?.PRODUCT_COST_VERIFIER_PUBLIC_KEY,500);
  if(!validId(queueId)||!validId(id)||!axes.includes(axis)||!reference||!issuer||
     !Number.isSafeInteger(cents)||cents<0||!(/^[a-f0-9]{64}$/).test(digest)||
     !signature||!publicKey||payload.owner_reviewed!==true)
    throw Error('Signed independent original cost source, CAD allocation and owner review required. HOLD.');
  if(!Number.isFinite(date)||date>Date.now()+300000||date<Date.now()-90*86400000)
    throw Error('Cost evidence observation outside freshness bounds. HOLD.');
  const source=await campaignRows(db,queueId);
  const linked=source.rows.filter(x=>x.attempt_status==='campaign_revenue_bound'&&
    String(unpack(x.response_json).order_id)===String(id));
  if(linked.length!==1)throw Error('Exactly one first-party campaign-bound paid order required. HOLD.');
  await settledOrder(db,id);
  const claim={order_id:id,campaign:source.name,axis,reference,issuer,
    amount_cents:cents,source_sha256:digest,observed_at:new Date(date).toISOString()};
  let genuine=false;
  try {const key=await crypto.subtle.importKey('raw',u8(publicKey),{name:'Ed25519'},false,['verify']);
    genuine=await crypto.subtle.verify('Ed25519',key,u8(signature),new TextEncoder().encode(identity(claim)));
  }catch{}
  if(!genuine)throw Error('Independent signed cost evidence failed verification. HOLD.');
  const existing=await db.prepare(`SELECT social_post_attempt_id FROM social_post_attempts WHERE
    platform_key='order_cost_679' AND attempt_status='verified_order_cost_679'
    AND external_post_id=? LIMIT 1`).bind(reference).first();
  if(existing)throw Error('Cost receipt reference already allocated. Duplicate blocked.');
  await record(db,admin,queueId,'order_cost_679','verified_order_cost_679',{
    external_post_id:reference,response:{...claim,source_order_binding_id:linked[0].social_post_attempt_id,
      signature,provenance:'independent_ed25519_product_cost',net_profit_certified:false},
    notes:'Original independent signed order-cost allocation; not audited accounting.'});
  const written=await db.prepare(`SELECT social_post_attempt_id FROM social_post_attempts WHERE
    platform_key='order_cost_679' AND attempt_status='verified_order_cost_679'
    AND external_post_id=? LIMIT 1`).bind(reference).first();
  if(!written)throw Error('Verified cost evidence not durably saved. HOLD.');
  return {status:'verified_order_cost_recorded',axis,order_id:id,publication_performed:false};
}
export async function campaignNet679(db,queueId){
  if(!validId(queueId))return {status:'HOLD_SELECT_CAMPAIGN',certified:false,master_handoff:'HOLD'};
  const {name,rows}=await campaignRows(db,Number(queueId));
  const orders=rows.filter(r=>r.attempt_status==='campaign_revenue_bound');
  const costs=rows.filter(r=>r.attempt_status==='campaign_cost_recorded');
  const attest=rows.filter(r=>r.attempt_status==='independent_expense_verified');
  const allocations=rows.filter(r=>r.attempt_status==='verified_order_cost_679');
  const blockers=[],seenOrders=new Set(),seenReceipts=new Set(),seenAllocations=new Set();
  let taxExcluded=0,taxCents=0,gross=0,adSpend=0,operations=0;
  for(const o of orders){
    const id=num(unpack(o.response_json).order_id);
    if(!validId(id)||seenOrders.has(id)){blockers.push('duplicate_or_missing_order');continue;}
    seenOrders.add(id);
    let current;
    try{current=await settledOrder(db,id)}catch{blockers.push('order_settlement_or_refund_changed');continue;}
    gross+=num(current.total_cents);taxCents+=num(current.tax_cents);
    taxExcluded+=num(current.total_cents)-num(current.tax_cents);
    for(const axis of axes){
      const matching=allocations.filter(a=>{const v=unpack(a.response_json);return num(v.order_id)===id&&v.axis===axis});
      if(!matching.length){blockers.push('missing_'+axis+'_for_order_'+id);continue;}
      for(const a of matching){
        const v=unpack(a.response_json);
        if(seenAllocations.has(a.external_post_id)||v.campaign!==name||!Number.isSafeInteger(num(v.amount_cents))||
           num(v.amount_cents)<0||num(v.source_order_binding_id)!==num(o.social_post_attempt_id)){
          blockers.push('invalid_or_duplicate_cost_allocation');continue;
        }
        seenAllocations.add(a.external_post_id);operations+=num(v.amount_cents);
      }
    }
  }
  for(const c of costs){
    const ref=String(c.external_post_id),v=unpack(c.response_json);
    if(seenReceipts.has(ref)){blockers.push('duplicate_marketing_receipt');continue;}
    seenReceipts.add(ref);
    const witnesses=attest.filter(a=>a.external_post_id===ref && num(unpack(a.response_json).source_cost_attempt_id)===num(c.social_post_attempt_id));
    if(witnesses.length!==1||!validId(v.cost_cents)){blockers.push('marketing_expense_unverified');continue;}
    adSpend+=num(v.cost_cents);
  }
  if(!orders.length)blockers.push('missing_attributed_paid_orders');
  if(!costs.length)blockers.push('missing_verified_marketing_spend');
  const financial=netContribution679({total_cents:gross,tax_cents:taxCents,
    verified_ad_cost_cents:adSpend,verified_operating_cost_cents:operations});
  if(!financial)blockers.push('invalid_financial_reconciliation');
  const fingerprint=JSON.stringify({campaign:name,order_ids:[...seenOrders].sort((a,b)=>a-b),
    signed_cost_references:[...seenAllocations].sort(),verified_ad_receipts:[...seenReceipts].sort(),
    gross,taxCents,adSpend,operations});
  const ownerAccepted=rows.some(x=>x.attempt_status==='net_campaign_owner_accepted_679'&&
    unpack(x.response_json).fingerprint===fingerprint);
  return {status:blockers.length?'HOLD_SOURCE_EVIDENCE':ownerAccepted?'OWNER_SIGNED_SOURCE_NET_CONTRIBUTION':'READY_OWNER_REVIEW',
    campaign:name,queue_id:Number(queueId),currency:'CAD',financial,blockers:[...new Set(blockers)],
    orders_seen:seenOrders.size,expense_receipts_seen:seenReceipts.size,product_cost_receipts_seen:seenAllocations.size,
    fingerprint,owner_accepted:!blockers.length&&ownerAccepted,
    certified:false,master_handoff:'HOLD_INDEPENDENT_MASTER_SIGNER_ENROLLMENT',
    note:'Excludes sales tax; signed cost allocation is source evidence, not audited consolidated net profit.'};
}
export async function ownerNetSignoff679(db,admin,payload,record){
  if(payload.owner_reviewed!==true||payload.confirm_scope!==true)throw Error('Explicit scoped owner approval required.');
  const v=await campaignNet679(db,payload.social_post_queue_id);
  if(v.blockers?.length||!v.financial)throw Error('Unverified source cost or paid order. Net signoff HOLD.');
  const sha=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v.fingerprint)));
  const digest=Array.from(sha,b=>b.toString(16).padStart(2,'0')).join('');
  const ref='net679:'+digest;
  const prior=await db.prepare(`SELECT social_post_attempt_id FROM social_post_attempts WHERE
    attempt_status='net_campaign_owner_accepted_679' AND external_post_id=? LIMIT 1`).bind(ref).first();
  if(prior)return {status:'already_owner_accepted',master_handoff:v.master_handoff,publication_performed:false};
  await record(db,admin,Number(payload.social_post_queue_id),'campaign_net_679','net_campaign_owner_accepted_679',{
    external_post_id:ref,response:{fingerprint:v.fingerprint,campaign:v.campaign,financial:v.financial,
      signer_user_id:admin.user_id,master_handoff:v.master_handoff,independently_certified:false},
    notes:'Explicit owner approval of source-net contribution; independent audit and master admission HOLD.'});
  const saved=await db.prepare(`SELECT social_post_attempt_id FROM social_post_attempts
    WHERE attempt_status='net_campaign_owner_accepted_679' AND external_post_id=? LIMIT 1`).bind(ref).first();
  if(!saved)throw Error('Owner acceptance could not be persisted; HOLD.');
  return {status:'owner_signed_source_net_contribution',master_handoff:v.master_handoff,publication_performed:false};
}
