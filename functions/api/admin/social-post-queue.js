// File: /functions/api/admin/social-post-queue.js
// Brief description: Admin-only social posting queue for job/process photos and summaries.
// This is review-first. It prepares platform-ready captions and records manual/API posting status,
// but does not auto-post until official OAuth/API keys are configured and approved for each platform.

import{ auditAdminAction,captureRuntimeIncident,getAdminUserFromRequest,getDb,jsonResponse,normalizeText } from '../_lib/adminAudit.js';


const finance678=(()=>{
// Build 678 — independent, signed marketing-expense attestation and owner-gated ROI.
const rows=r=> Array.isArray(r?.results) ? r.results :[];
const parse=s=>{ try{ return JSON.parse(s || '{}');} catch{ return{};} };
const clean=(v,n=120)=> String(v ?? '').trim().slice(0,n);
const positiveId=v=> Number.isSafeInteger(Number(v)) && Number(v)>0 ? Number(v) :0;
const bytes=b64=> Uint8Array.from(atob(String(b64||'').replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const money=v=> Number.isSafeInteger(Number(v)) && Number(v)>0 ? Number(v) :0;
const canonical=v=> JSON.stringify({
v:1,campaign:v.campaign,queue_id:v.queue_id,receipt_reference:v.receipt_reference,
vendor:v.vendor,amount_cents:v.amount_cents,currency:'CAD',
original_document_sha256:v.original_document_sha256,checked_at:v.checked_at
});
function campaignReturn678(revenueCents,costCents){
if (!Number.isSafeInteger(revenueCents)||!Number.isSafeInteger(costCents)||costCents<=0||revenueCents<0) return null;
return{attributed_sales_cents:revenueCents,verified_ad_cost_cents:costCents,
marketing_contribution_cents:revenueCents-costCents,
marketing_roi_percent:Math.round(((revenueCents-costCents)/costCents)*10000)/100,
basis:'gross_order_receipts_before_product_costs_shipping_taxes_and_overheads'};
}
async function verifiedOriginalCost(db,id,ref){
return db.prepare(`SELECT a.social_post_attempt_id,a.social_post_queue_id,a.external_post_id,a.response_json,q.utm_campaign
    FROM social_post_attempts a JOIN social_post_queue q ON q.social_post_queue_id=a.social_post_queue_id
    WHERE a.social_post_queue_id=? AND a.external_post_id=? AND a.platform_key='campaign_cost'
    AND a.attempt_status='campaign_cost_recorded' LIMIT 1`).bind(id,ref).first();
}
async function expenseAttestation678(db,env,admin,payload,record){
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
try{
const publicKey=await crypto.subtle.importKey('raw',bytes(key),{name:'Ed25519'},false,['verify']);
genuine=await crypto.subtle.verify({name:'Ed25519'},publicKey,bytes(sig),new TextEncoder().encode(canonical(claim)));
} catch{ genuine=false;}
if(!genuine)throw Error('Independent verifier signature failed. HOLD; owner attestation cannot substitute.');
const dup=await db.prepare(`SELECT social_post_attempt_id FROM social_post_attempts
    WHERE platform_key='campaign_cost_verifier' AND attempt_status='independent_expense_verified'
    AND external_post_id=? LIMIT 1`).bind(ref).first();
if(dup)throw Error('Receipt has already been independently verified; duplicate blocked.');
await record(db,admin,id,'campaign_cost_verifier','independent_expense_verified',{
external_post_id:ref,response:{...claim,provenance:'external_ed25519_expense_verifier',
source_cost_attempt_id:cost.social_post_attempt_id,verifier_signature:sig,roi_certified:false},
notes:'Signature checked against separately configured independent verifier public key; no owner-only certification.'});
const saved=await db.prepare(`SELECT social_post_attempt_id FROM social_post_attempts WHERE
    platform_key='campaign_cost_verifier' AND attempt_status='independent_expense_verified'
    AND external_post_id=? AND social_post_queue_id=? LIMIT 1`).bind(ref,id).first();
if(!saved)throw Error('Independent verification could not be durably recorded. HOLD.');
return{status:'independent_expense_verified',receipt_reference:ref,roi_certified:false,publication_performed:false};
}
async function reconciledCampaign(db,id){
const post=await db.prepare('SELECT utm_campaign FROM social_post_queue WHERE social_post_queue_id=?').bind(id).first();
if(!post?.utm_campaign)throw Error('Named campaign not found.');
// Include every same-named queue item, not just the selected post; do not truncate expense scan.
const attempts=rows(await db.prepare(`SELECT a.social_post_attempt_id,a.social_post_queue_id,a.platform_key,a.attempt_status,a.external_post_id,a.response_json
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
if(!signed||Number(evidence.source_cost_attempt_id)!==Number(item.social_post_attempt_id)){
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
return{campaign:post.utm_campaign,queue_id:id,metrics,receipt_count:seenCost.size,verified_receipt_count:signatures.length,
paid_order_count:seenOrder.size,blockers:[...new Set(blockers)],
signoff:!blockers.length && accepted ? 'OWNER_ACCEPTED_MARKETING_RETURN':'HOLD',
profitability_status:'HOLD_PRODUCT_COSTS_TAXES_AND_OVERHEADS',roi_certified:false};
}
async function ownerSignoff678(db,admin,payload,record){
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
if(duplicate) return{status:'already_owner_accepted',...view,publication_performed:false};
await record(db,admin,id,'campaign_roi','campaign_roi_owner_accepted',{
external_post_id:ref,response:{fingerprint,metrics:view.metrics,campaign:view.campaign,
owner_user_id:admin.user_id,profitability_certified:false},
notes:'Owner accepts verified ad-spend/gross-order marketing return only. Net profit and independently certified ROI remain HOLD.'});
const saved=await db.prepare(`SELECT social_post_attempt_id FROM social_post_attempts WHERE
    platform_key='campaign_roi' AND attempt_status='campaign_roi_owner_accepted'
    AND external_post_id=? LIMIT 1`).bind(ref).first();
if(!saved)throw Error('Owner signoff could not be durably recorded. HOLD.');
return{status:'owner_accepted_marketing_return',...view,publication_performed:false};
}
async function financialSummary678(db,id){
if(!positiveId(id))return{status:'HOLD_SELECT_CAMPAIGN',roi_certified:false};
return reconciledCampaign(db,Number(id));
}

return{campaignReturn678,expenseAttestation678,ownerSignoff678,financialSummary678};
})();
const{campaignReturn678,expenseAttestation678,ownerSignoff678,financialSummary678}=finance678;

const finance679=(()=>{
// Build 679: verified per-order cost allocations, tax-excluded net contribution and read-only Master evidence.
const list=r=>Array.isArray(r?.results)?r.results:[];
const unpack=s=>{try{return JSON.parse(s||'{}')}catch{return{}}};
const str=(s,n=120)=>String(s??'').trim().slice(0,n);
const num=n=>Number.isSafeInteger(Number(n))?Number(n):NaN;
const validId=n=>Number.isSafeInteger(num(n))&&num(n)>0;
const axes=['product_cogs','shipping_fulfilment','payment_processing','overhead_allocated'];
const u8=b=>Uint8Array.from(atob(str(b,500).replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const identity=v=>JSON.stringify({version:1,order_id:v.order_id,campaign:v.campaign,axis:v.axis,
reference:v.reference,issuer:v.issuer,amount_cents:v.amount_cents,currency:'CAD',
source_sha256:v.source_sha256,observed_at:v.observed_at});
function netContribution679({total_cents,tax_cents,verified_ad_cost_cents,verified_operating_cost_cents}){
const values=[total_cents,tax_cents,verified_ad_cost_cents,verified_operating_cost_cents].map(num);
if(values.some(x=>!Number.isSafeInteger(x)||x<0)||values[1]>values[0])return null;
const revenue=values[0]-values[1],net=revenue-values[2]-values[3];
return{tax_excluded_receipts_cents:revenue,verified_ad_cost_cents:values[2],
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
return{name:queue.utm_campaign,rows};
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
async function verifyCost679(db,env,admin,payload,record){
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
try{const key=await crypto.subtle.importKey('raw',u8(publicKey),{name:'Ed25519'},false,['verify']);
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
return{status:'verified_order_cost_recorded',axis,order_id:id,publication_performed:false};
}
async function campaignNet679(db,queueId){
if(!validId(queueId))return{status:'HOLD_SELECT_CAMPAIGN',certified:false,master_handoff:'HOLD'};
const{name,rows}=await campaignRows(db,Number(queueId));
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
return{status:blockers.length?'HOLD_SOURCE_EVIDENCE':ownerAccepted?'OWNER_SIGNED_SOURCE_NET_CONTRIBUTION':'READY_OWNER_REVIEW',
campaign:name,queue_id:Number(queueId),currency:'CAD',financial,blockers:[...new Set(blockers)],
orders_seen:seenOrders.size,expense_receipts_seen:seenReceipts.size,product_cost_receipts_seen:seenAllocations.size,
fingerprint,owner_accepted:!blockers.length&&ownerAccepted,
certified:false,master_handoff:'HOLD_INDEPENDENT_MASTER_SIGNER_ENROLLMENT',
note:'Excludes sales tax; signed cost allocation is source evidence, not audited consolidated net profit.'};
}
async function ownerNetSignoff679(db,admin,payload,record){
if(payload.owner_reviewed!==true||payload.confirm_scope!==true)throw Error('Explicit scoped owner approval required.');
const v=await campaignNet679(db,payload.social_post_queue_id);
if(v.blockers?.length||!v.financial)throw Error('Unverified source cost or paid order. Net signoff HOLD.');
const sha=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v.fingerprint)));
const digest=Array.from(sha,b=>b.toString(16).padStart(2,'0')).join('');
const ref='net679:'+digest;
const prior=await db.prepare(`SELECT social_post_attempt_id FROM social_post_attempts WHERE
    attempt_status='net_campaign_owner_accepted_679' AND external_post_id=? LIMIT 1`).bind(ref).first();
if(prior)return{status:'already_owner_accepted',master_handoff:v.master_handoff,publication_performed:false};
await record(db,admin,Number(payload.social_post_queue_id),'campaign_net_679','net_campaign_owner_accepted_679',{
external_post_id:ref,response:{fingerprint:v.fingerprint,campaign:v.campaign,financial:v.financial,
signer_user_id:admin.user_id,master_handoff:v.master_handoff,independently_certified:false},
notes:'Explicit owner approval of source-net contribution; independent audit and master admission HOLD.'});
const saved=await db.prepare(`SELECT social_post_attempt_id FROM social_post_attempts
    WHERE attempt_status='net_campaign_owner_accepted_679' AND external_post_id=? LIMIT 1`).bind(ref).first();
if(!saved)throw Error('Owner acceptance could not be persisted; HOLD.');
return{status:'owner_signed_source_net_contribution',master_handoff:v.master_handoff,publication_performed:false};
}

return{netContribution679,verifyCost679,campaignNet679,ownerNetSignoff679};
})();
const{netContribution679,verifyCost679,campaignNet679,ownerNetSignoff679}=finance679;

export{ campaignReturn678,netContribution679 };
const PLATFORM_DEFINITIONS=[
{
platform_key:'facebook',
display_name:'Facebook Page',
connection_status:'manual_ready',
api_ready:0,
requires_oauth:1,
required_scopes:'pages_manage_posts,pages_read_engagement,pages_show_list',
notes:'Manual-ready now. API posting later requires a Meta app, Page access token, permissions, and review where applicable.'
},
{
platform_key:'instagram',
display_name:'Instagram Business/Creator',
connection_status:'manual_ready',
api_ready:0,
requires_oauth:1,
required_scopes:'instagram_business_content_publish,pages_show_list',
notes:'Manual-ready now. API publishing later requires an Instagram professional account connected to Meta and the Content Publishing API flow.'
},
{
platform_key:'tiktok',
display_name:'TikTok',
connection_status:'manual_ready',
api_ready:0,
requires_oauth:1,
required_scopes:'video.upload,video.publish',
notes:'Manual-ready now. API posting later requires TikTok developer app approval, creator info query, and verified media URL/domain rules.'
},
{
platform_key:'x',
display_name:'X',
connection_status:'manual_ready',
api_ready:0,
requires_oauth:1,
required_scopes:'tweet.write,users.read,offline.access',
notes:'Manual-ready now. API posting later requires X API access and OAuth tokens; posting links may have platform costs/limits.'
},
{
platform_key:'youtube',
display_name:'YouTube Shorts/Community',
connection_status:'manual_ready',
api_ready:0,
requires_oauth:1,
required_scopes:'youtube.upload,youtube.force-ssl',
notes:'Manual-ready now. API upload/posting later requires Google OAuth/app configuration.'
},
{
platform_key:'pinterest',
display_name:'Pinterest',
connection_status:'manual_ready',
api_ready:0,
requires_oauth:1,
required_scopes:'pins:write,boards:read',
notes:'Manual-ready now. Useful for finished products and workshop inspiration boards once OAuth is configured.'
}
];

const CAPTION_TEMPLATES=[
{
template_key:'making_story',
display_name:'Making story / in progress',
content_pillar:'behind_the_scenes',
default_platforms_json:JSON.stringify(['facebook','instagram','tiktok','x']),
default_hashtags:'#DevilnDove #HandmadeOntario #WorkshopMade #SmallBusinessCanada',
body_template:'{title}\n\n{summary}\n\n{cta}\n\n{link}\n\n{hashtags}',
call_to_action:'Follow along as we turn shop experiments into one-of-a-kind pieces.',
notes:'Use while a crafting job or workshop experiment is in progress.'
},
{
template_key:'finished_product',
display_name:'Finished product / shop-ready',
content_pillar:'finished_goods',
default_platforms_json:JSON.stringify(['facebook','instagram','pinterest','x']),
default_hashtags:'#DevilnDove #HandmadeGifts #OntarioMaker #ShopSmallCanada',
body_template:'{title}\n\n{summary}\n\n{cta}\n\n{link}\n\n{hashtags}',
call_to_action:'See the finished piece, details, and availability here:',
notes:'Use for product launches, gallery items, vintage finds, and ready-to-sell pieces.'
},
{
template_key:'shop_oops',
display_name:'Funny shop moment / oops',
content_pillar:'human_story',
default_platforms_json:JSON.stringify(['facebook','instagram','tiktok','x']),
default_hashtags:'#DevilnDove #MakerLife #WorkshopOops #CreativeProcess',
body_template:'{title}\n\n{summary}\n\n{cta}\n\n{hashtags}',
call_to_action:'We are calling this one “learning with character.”',
notes:'Use for light, human, therapy-workshop moments that should not sound too polished.'
},
{
template_key:'local_market',
display_name:'Local Ontario update / event',
content_pillar:'local_presence',
default_platforms_json:JSON.stringify(['facebook','instagram','x']),
default_hashtags:'#DevilnDove #SouthernOntario #TillsonburgOntario #OntarioSmallBusiness',
body_template:'{title}\n\n{summary}\n\n{cta}\n\n{link}\n\n{hashtags}',
call_to_action:'Local friends can message us with questions or pickup ideas.',
notes:'Use when relevance to Southern Ontario/Tillsonburg/local shoppers matters.'
},
{
template_key:'laser_engraving',
display_name:'Laser engraving / personalized gift',
content_pillar:'custom_work',
default_platforms_json:JSON.stringify(['facebook','instagram','pinterest','x']),
default_hashtags:'#DevilnDove #LaserEngravingOntario #CustomGiftsOntario #WorkshopMade',
body_template:'{title}\n\n{summary}\n\n{cta}\n\n{link}\n\n{hashtags}',
call_to_action:'Ask us about making something similar with your own wording or idea.',
notes:'Use for engraving jobs, custom gift ideas, and personalized workshop updates.'
},
{
template_key:'vintage_find',
display_name:'Vintage find / collected item',
content_pillar:'vintage_collectibles',
default_platforms_json:JSON.stringify(['facebook','instagram','pinterest','x']),
default_hashtags:'#DevilnDove #VintageFindsOntario #CollectiblesCanada #ShopSmallCanada',
body_template:'{title}\n\n{summary}\n\n{cta}\n\n{link}\n\n{hashtags}',
call_to_action:'Condition, story, and availability details are listed here:',
notes:'Use for sourced vintage/collectible/antiquity items.'
}
];

function rows(result){ return Array.isArray(result?.results) ? result.results :[];}
function safeJson(value,fallback){ try{ return JSON.parse(value || '');} catch{ return fallback;} }
function slugKey(value){ return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');}
function trimTo(value,limit){
const clean=normalizeText(value);
if (clean.length <=limit) return clean;
return `${clean.slice(0, Math.max(0, limit - 1)).trim()}…`;
}
function splitList(value){
if (Array.isArray(value)) return value.map((item)=> normalizeText(item)).filter(Boolean);
return String(value || '').split(/\r?\n|,|\|/).map((item)=> normalizeText(item)).filter(Boolean);
}
function normalizePlatforms(value){
const allowed=new Set(PLATFORM_DEFINITIONS.map((row)=> row.platform_key));
const incoming=splitList(value).map((item)=> slugKey(item)).map((item)=> item==='twitter'? 'x':item);
const unique=[...new Set(incoming.filter((item)=> allowed.has(item)))];
return unique.length ? unique :['facebook','instagram'];
}
function normalizeHashtags(value){
const tags=splitList(value)
.map((tag)=> tag.replace(/^#+/,'').replace(/[^a-zA-Z0-9_]/g,''))
.filter(Boolean)
.slice(0,20);
return [...new Set(tags)].map((tag)=> `#${tag}`).join(' ');
}
function buildQueueKey(seed){
const raw=normalizeText(seed) || `${Date.now()}-${crypto.randomUUID()}`;
let hash=0;
for (let index=0;index < raw.length;index +=1){
hash=((hash << 5) - hash) + raw.charCodeAt(index);
hash |=0;
}
return `social_${Math.abs(hash)}_${Date.now().toString(36)}`;
}
function safeUrl(value){
const clean=normalizeText(value);
if (!clean) return '';
try{ return new URL(clean).toString();} catch{ return clean;}
}
function buildCaption({ title,summary,hashtags,linkUrl }){
const parts=[];
if (title) parts.push(title);
if (summary) parts.push(summary);
if (linkUrl) parts.push(`More: ${linkUrl}`);
if (hashtags) parts.push(hashtags);
return trimTo(parts.filter(Boolean).join('\n\n'),2200);
}

function envText(env,...names){
for (const name of names){
const value=normalizeText(env?.[name]);
if (value) return value;
}
return '';
}
function getPlatformReadiness(env={}){
const facebookReady=!!(envText(env,'FACEBOOK_PAGE_ID','META_PAGE_ID') && envText(env,'FACEBOOK_PAGE_ACCESS_TOKEN','META_PAGE_ACCESS_TOKEN'));
const instagramReady=!!(envText(env,'INSTAGRAM_USER_ID','IG_USER_ID','INSTAGRAM_BUSINESS_ACCOUNT_ID') && envText(env,'INSTAGRAM_ACCESS_TOKEN','META_PAGE_ACCESS_TOKEN','FACEBOOK_PAGE_ACCESS_TOKEN'));
const xReady=!!envText(env,'X_USER_ACCESS_TOKEN','TWITTER_USER_ACCESS_TOKEN');
const pinterestReady=!!(envText(env,'PINTEREST_ACCESS_TOKEN') && envText(env,'PINTEREST_BOARD_ID'));
const tiktokReady=!!envText(env,'TIKTOK_ACCESS_TOKEN');
const youtubeReady=!!envText(env,'YOUTUBE_ACCESS_TOKEN');
return{
facebook:{
platform_key:'facebook',api_ready:facebookReady ? 1 :0,publish_mode:facebookReady ? 'api_ready':'manual_ready',
missing_env:facebookReady ? [] :['FACEBOOK_PAGE_ID','FACEBOOK_PAGE_ACCESS_TOKEN'],
notes:facebookReady ? 'API publishing can be attempted through the Facebook Page feed/photos endpoints.':'Manual/copy-paste ready. Add Page ID and Page access token as Cloudflare environment variables to attempt API publishing.'
},
instagram:{
platform_key:'instagram',api_ready:instagramReady ? 1 :0,publish_mode:instagramReady ? 'api_ready':'manual_ready',
missing_env:instagramReady ? [] :['INSTAGRAM_USER_ID','INSTAGRAM_ACCESS_TOKEN or FACEBOOK_PAGE_ACCESS_TOKEN'],
notes:instagramReady ? 'API image publishing can be attempted through the Instagram Content Publishing media/container flow.':'Manual/copy-paste ready. Instagram API publishing also requires a professional Instagram account connected through Meta.'
},
x:{
platform_key:'x',api_ready:xReady ? 1 :0,publish_mode:xReady ? 'api_ready':'manual_ready',
missing_env:xReady ? [] :['X_USER_ACCESS_TOKEN'],
notes:xReady ? 'API text/link publishing can be attempted through POST /2/tweets.':'Manual/copy-paste ready. Add an OAuth user access token with write permission to attempt API publishing.'
},
pinterest:{
platform_key:'pinterest',api_ready:pinterestReady ? 1 :0,publish_mode:pinterestReady ? 'api_ready':'manual_ready',
missing_env:pinterestReady ? [] :['PINTEREST_ACCESS_TOKEN','PINTEREST_BOARD_ID'],
notes:pinterestReady ? 'API image pin publishing can be attempted for public image URLs.':'Manual/copy-paste ready. Add access token and board ID for API pin publishing.'
},
tiktok:{
platform_key:'tiktok',api_ready:0,publish_mode:tiktokReady ? 'credentials_detected_manual_review':'manual_ready',
missing_env:tiktokReady ? [] :['TIKTOK_ACCESS_TOKEN'],
notes:'Kept manual/review-first in this build. TikTok direct publishing needs the platform upload/publish flow and app approval before we should automate it.'
},
youtube:{
platform_key:'youtube',api_ready:0,publish_mode:youtubeReady ? 'credentials_detected_manual_review':'manual_ready',
missing_env:youtubeReady ? [] :['YOUTUBE_ACCESS_TOKEN'],
notes:'Kept manual/review-first in this build. YouTube upload/community posting needs Google OAuth upload handling before we should automate it.'
}
};
}
async function tableColumnSet(db,tableName){
try{
const result=await db.prepare(`PRAGMA table_info(${tableName})`).all();
return new Set(rows(result).map((row)=> String(row.name || '').toLowerCase()).filter(Boolean));
} catch{
return new Set();
}
}
async function ensureColumn(db,tableName,columnName,sql){
const columns=await tableColumnSet(db,tableName);
if (!columns.has(String(columnName || '').toLowerCase())){
await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${sql}`).run().catch(()=> null);
}
}
async function tableExists(db,tableName){
try{
const row=await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(tableName).first();
return !!row?.name;
} catch{ return false;}
}
async function ensureUtmAnalyticsColumns(db){
for (const tableName of ['site_visitor_sessions','site_page_views','custom_requests']){
if (!(await tableExists(db,tableName))) continue;
await ensureColumn(db,tableName,'utm_source','utm_source TEXT');
await ensureColumn(db,tableName,'utm_medium','utm_medium TEXT');
await ensureColumn(db,tableName,'utm_campaign','utm_campaign TEXT');
await ensureColumn(db,tableName,'utm_content','utm_content TEXT');
await ensureColumn(db,tableName,'utm_term','utm_term TEXT');
}
}
function safeResponseJson(text){
try{ return JSON.parse(text || '{}');} catch{ return{ raw:text || ''};}
}
async function fetchJson(url,options={}){
const response=await fetch(url,options);
const text=await response.text().catch(()=> '');
return{ response,body:safeResponseJson(text),text };
}
function absolutePostUrl(row,platform){
const utmUrl=safeUrl(row?.utm_url || '');
if (utmUrl) return utmUrl;
const url=safeUrl(row?.link_url || '');
if (url) return url;
const key=normalizeText(row?.social_post_key || '');
return key ? `https://devilndove.com/?social=${encodeURIComponent(key)}&platform=${encodeURIComponent(platform)}`:'';
}
function platformCaption(row,platform){
const overrides=safeJson(row?.platform_caption_overrides_json,{});
const override=normalizeText(overrides?.[platform] || overrides?.[String(platform || '').toLowerCase()] || '');
const caption=override || normalizeText(row?.caption || buildCaption({
title:row?.title || '',
summary:row?.summary || '',
hashtags:row?.hashtags || '',
linkUrl:absolutePostUrl(row,platform)
}));
const link=absolutePostUrl(row,platform);
if (platform==='x') return trimTo([caption,link && !caption.includes(link) ? link :''].filter(Boolean).join('\n'),280);
if (platform==='pinterest') return trimTo(caption,500);
return trimTo(caption,2200);
}
function stableHash(value){
const raw=normalizeText(value);
let hash=0;
for (let index=0;index < raw.length;index +=1){
hash=((hash << 5) - hash) + raw.charCodeAt(index);
hash |=0;
}
return Math.abs(hash).toString(36);
}

async function templateByKey(db,key){
const clean=slugKey(key || '');
if (!clean) return null;
const stored=await db.prepare(`SELECT * FROM social_caption_templates WHERE template_key = ? AND COALESCE(is_active,1)=1 LIMIT 1`).bind(clean).first().catch(()=> null);
return stored || CAPTION_TEMPLATES.find((template)=> template.template_key===clean) || null;
}
function fillCaptionTemplate(template,values={}){
if (!template) return '';
const map={
title:normalizeText(values.title || ''),
summary:normalizeText(values.summary || ''),
cta:normalizeText(values.call_to_action || template.call_to_action || ''),
link:safeUrl(values.link_url || values.utm_url || ''),
hashtags:normalizeText(values.hashtags || template.default_hashtags || '')
};
return trimTo(String(template.body_template || '')
.replace(/\{title\}/g,map.title)
.replace(/\{summary\}/g,map.summary)
.replace(/\{cta\}/g,map.cta)
.replace(/\{link\}/g,map.link)
.replace(/\{hashtags\}/g,map.hashtags)
.replace(/\n{3,}/g,'\n\n')
.trim(),2200);
}
function buildUtmUrl(linkUrl,payload={},platforms=[]){
const clean=safeUrl(linkUrl || '');
if (!clean) return '';
try{
const url=new URL(clean,'https://devilndove.com');
const source=normalizeText(payload.utm_source || 'devilndove_social');
const medium=normalizeText(payload.utm_medium || 'social');
const campaign=slugKey(payload.utm_campaign || payload.caption_template_key || payload.source_type || 'workshop_update');
const content=normalizePlatforms(platforms || payload.target_platforms || payload.platforms || []).join('-') || 'social';
if (source && !url.searchParams.has('utm_source')) url.searchParams.set('utm_source',source);
if (medium && !url.searchParams.has('utm_medium')) url.searchParams.set('utm_medium',medium);
if (campaign && !url.searchParams.has('utm_campaign')) url.searchParams.set('utm_campaign',campaign);
if (content && !url.searchParams.has('utm_content')) url.searchParams.set('utm_content',content);
return url.toString();
} catch{
return clean;
}
}

function normalizeCaptionOverrides(payload={},platforms=[]){
const source=typeof payload.platform_captions==='object'&& payload.platform_captions ? payload.platform_captions :{};
const aliases={ facebook:'facebook_caption',instagram:'instagram_caption',tiktok:'tiktok_caption',x:'x_caption',youtube:'youtube_caption',pinterest:'pinterest_caption'};
const result={};
for (const platform of platforms){
const value=normalizeText(source[platform] || payload[aliases[platform]] || '');
if (!value) continue;
const limit=platform==='x'? 280 :platform==='pinterest'? 500 :2200;
result[platform]=trimTo(value,limit);
}
return result;
}
function buildDuplicateSignature({ title,caption,imageUrls,platforms,linkUrl }){
return stableHash(JSON.stringify({
title:normalizeText(title).toLowerCase(),
caption:normalizeText(caption).toLowerCase(),
image_urls:[...new Set((imageUrls || []).map(safeUrl).filter(Boolean))].sort(),
platforms:[...new Set((platforms || []).map(slugKey).filter(Boolean))].sort(),
link_url:safeUrl(linkUrl || '')
}));
}
function parseScheduledAt(value){
const clean=normalizeText(value);
if (!clean) return '';
const parsed=new Date(clean);
if (Number.isNaN(parsed.getTime())) return clean;
return parsed.toISOString().replace(/\.\d{3}Z$/,'Z');
}
function isScheduledInFuture(value){
const clean=normalizeText(value);
if (!clean) return false;
const parsed=new Date(clean);
return Number.isFinite(parsed.getTime()) && parsed.getTime() > Date.now() + 60_000;
}
function buildMediaWarnings({ platforms=[],imageUrls=[],videoUrl='',caption=''}){
const warnings=[];
const imageCount=imageUrls.length;
const needsImage=platforms.some((platform)=> ['instagram','pinterest','tiktok'].includes(platform));
if (needsImage && !imageCount) warnings.push('Instagram, Pinterest, and TikTok-style posts should have at least one public image URL before publishing.');
if (imageCount > 10) warnings.push('More than 10 images were supplied; only the first 10 are retained for the queue.');
for (const url of imageUrls){
if (!/^https:\/\//i.test(url)) warnings.push(`Image URL is not HTTPS/public: ${url}`);
if (/localhost|127\.0\.0\.1|file:/i.test(url)) warnings.push(`Image URL looks private/local and will not work for social platforms: ${url}`);
}
if (platforms.includes('x') && normalizeText(caption).length > 280) warnings.push('The X caption will be trimmed to 280 characters during payload generation.');
if (videoUrl && !/^https:\/\//i.test(videoUrl)) warnings.push('Video URL is not HTTPS/public; video-first platforms may reject it.');
return [...new Set(warnings)];
}
function platformPayload(row,platform,env={}){
const images=safeJson(row.image_urls_json,[]).map(safeUrl).filter(Boolean);
const caption=platformCaption(row,platform);
const link=absolutePostUrl(row,platform);
const readiness=getPlatformReadiness(env)[platform] ||{ api_ready:0,missing_env:[] };
const base={ platform,api_ready:!!readiness.api_ready,missing_env:readiness.missing_env || [],caption,link_url:link || '',image_count:images.length,first_image_url:images[0] || ''};
if (platform==='facebook') return{ ...base,method:'POST',endpoint_template:'https://graph.facebook.com/v25.0/{FACEBOOK_PAGE_ID}/feed or /photos',body_preview:{ message:caption,link:link || undefined,url:images[0] || undefined } };
if (platform==='instagram') return{ ...base,method:'POST',endpoint_template:'https://graph.facebook.com/v25.0/{INSTAGRAM_USER_ID}/media then /media_publish',body_preview:{ image_url:images[0] || '',caption } };
if (platform==='x') return{ ...base,method:'POST',endpoint_template:'https://api.x.com/2/tweets',body_preview:{ text:caption } };
if (platform==='pinterest') return{ ...base,method:'POST',endpoint_template:'https://api.pinterest.com/v5/pins',body_preview:{ board_id:'{PINTEREST_BOARD_ID}',title:trimTo(row.title || 'Devil n Dove workshop update',100),description:caption,link:link || undefined,media_source:images[0] ?{ source_type:'image_url',url:images[0] } :undefined } };
return{ ...base,method:'manual',endpoint_template:'manual/copy-paste for now',body_preview:{ caption,media:images,video_url:row.video_url || ''} };
}
function buildDryRunPayload(row,selectedPlatforms,env={}){
const platforms=normalizePlatforms(selectedPlatforms || safeJson(row.target_platforms_json,[]));
const images=safeJson(row.image_urls_json,[]).map(safeUrl).filter(Boolean);
const warnings=buildMediaWarnings({ platforms,imageUrls:images,videoUrl:row.video_url || '',caption:row.caption || ''});
return{
social_post_queue_id:Number(row.social_post_queue_id || 0),
scheduled_at:row.scheduled_at || null,
blocked_until_schedule:isScheduledInFuture(row.scheduled_at),
do_not_repost:Number(row.do_not_repost || 0)===1,
media_quality_warnings:warnings,
platform_payloads:platforms.map((platform)=> platformPayload(row,platform,env))
};
}
async function ensureSchema(db){
await db.prepare(`CREATE TABLE IF NOT EXISTS social_platform_connections (
    social_platform_connection_id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    profile_url TEXT,
    connection_status TEXT NOT NULL DEFAULT 'manual_ready',
    api_ready INTEGER NOT NULL DEFAULT 0,
    requires_oauth INTEGER NOT NULL DEFAULT 1,
    required_scopes TEXT,
    notes TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
await db.prepare(`CREATE TABLE IF NOT EXISTS social_post_queue (
    social_post_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
    social_post_key TEXT NOT NULL UNIQUE,
    source_type TEXT NOT NULL DEFAULT 'job_update',
    source_id TEXT,
    title TEXT NOT NULL,
    summary TEXT,
    caption TEXT,
    hashtags TEXT,
    target_platforms_json TEXT NOT NULL DEFAULT '[]',
    image_urls_json TEXT NOT NULL DEFAULT '[]',
    video_url TEXT,
    link_url TEXT,
    approval_status TEXT NOT NULL DEFAULT 'needs_review',
    post_status TEXT NOT NULL DEFAULT 'draft',
    scheduled_at TEXT,
    published_at TEXT,
    created_by_user_id INTEGER,
    updated_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
  )`).run();
await db.prepare(`CREATE TABLE IF NOT EXISTS social_post_attempts (
    social_post_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
    social_post_queue_id INTEGER NOT NULL,
    platform_key TEXT NOT NULL,
    attempt_status TEXT NOT NULL DEFAULT 'manual_ready',
    external_post_url TEXT,
    external_post_id TEXT,
    response_json TEXT,
    attempted_by_user_id INTEGER,
    attempted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (social_post_queue_id) REFERENCES social_post_queue(social_post_queue_id)
  )`).run();
await db.prepare(`CREATE TABLE IF NOT EXISTS social_caption_templates (
    social_caption_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    content_pillar TEXT,
    default_platforms_json TEXT NOT NULL DEFAULT '[]',
    default_hashtags TEXT,
    body_template TEXT NOT NULL,
    call_to_action TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
await db.prepare(`CREATE INDEX IF NOT EXISTS idx_social_caption_templates_active ON social_caption_templates(is_active, content_pillar)`).run().catch(()=> null);
for (const template of CAPTION_TEMPLATES){
await db.prepare(`INSERT INTO social_caption_templates (
      template_key, display_name, content_pillar, default_platforms_json, default_hashtags,
      body_template, call_to_action, is_active, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(template_key) DO NOTHING`).bind(
template.template_key,
template.display_name,
template.content_pillar,
template.default_platforms_json,
template.default_hashtags,
template.body_template,
template.call_to_action,
template.notes
).run().catch(()=> null);
}
await db.prepare(`CREATE INDEX IF NOT EXISTS idx_social_post_queue_status ON social_post_queue(post_status, approval_status, scheduled_at)`).run().catch(()=> null);
await db.prepare(`CREATE INDEX IF NOT EXISTS idx_social_post_queue_source ON social_post_queue(source_type, source_id)`).run().catch(()=> null);
await db.prepare(`CREATE INDEX IF NOT EXISTS idx_social_post_attempts_queue ON social_post_attempts(social_post_queue_id, platform_key)`).run().catch(()=> null);
await ensureColumn(db,'social_post_queue','last_publish_attempt_at','last_publish_attempt_at TEXT');
await ensureColumn(db,'social_post_queue','api_publish_mode',"api_publish_mode TEXT DEFAULT 'review_first'");
await ensureColumn(db,'social_post_attempts','request_mode','request_mode TEXT');
await ensureColumn(db,'social_post_attempts','http_status','http_status INTEGER');
await ensureColumn(db,'social_post_attempts','platform_response_id','platform_response_id TEXT');
await ensureColumn(db,'social_post_attempts','published_url','published_url TEXT');
await ensureColumn(db,'social_post_queue','platform_caption_overrides_json',"platform_caption_overrides_json TEXT DEFAULT '{}'");
await ensureColumn(db,'social_post_queue','media_quality_warnings_json',"media_quality_warnings_json TEXT DEFAULT '[]'");
await ensureColumn(db,'social_post_queue','duplicate_signature','duplicate_signature TEXT');
await ensureColumn(db,'social_post_queue','do_not_repost','do_not_repost INTEGER DEFAULT 0');
await ensureColumn(db,'social_post_queue','schedule_timezone','schedule_timezone TEXT');
await ensureColumn(db,'social_post_queue','dry_run_payload_json',"dry_run_payload_json TEXT DEFAULT '{}'");
await ensureColumn(db,'social_post_queue','last_dry_run_at','last_dry_run_at TEXT');
await ensureColumn(db,'social_post_queue','caption_template_key','caption_template_key TEXT');
await ensureColumn(db,'social_post_queue','content_pillar','content_pillar TEXT');
await ensureColumn(db,'social_post_queue','call_to_action','call_to_action TEXT');
await ensureColumn(db,'social_post_queue','utm_source','utm_source TEXT');
await ensureColumn(db,'social_post_queue','utm_medium','utm_medium TEXT');
await ensureColumn(db,'social_post_queue','utm_campaign','utm_campaign TEXT');
await ensureColumn(db,'social_post_queue','utm_url','utm_url TEXT');
await ensureColumn(db,'social_post_queue','privacy_status',"privacy_status TEXT DEFAULT 'needs_review'");
await ensureColumn(db,'social_post_queue','privacy_notes','privacy_notes TEXT');
await ensureColumn(db,'social_post_queue','media_consent_required','media_consent_required INTEGER DEFAULT 1');
await ensureColumn(db,'social_post_queue','customer_media_present','customer_media_present INTEGER DEFAULT 0');
await ensureColumn(db,'social_post_queue','approved_for_public_post','approved_for_public_post INTEGER DEFAULT 0');
await db.prepare(`CREATE INDEX IF NOT EXISTS idx_social_post_queue_duplicate ON social_post_queue(duplicate_signature, do_not_repost)`).run().catch(()=> null);

for (const platform of PLATFORM_DEFINITIONS){
await db.prepare(`INSERT INTO social_platform_connections (
      platform_key, display_name, connection_status, api_ready, requires_oauth, required_scopes, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(platform_key) DO UPDATE SET
      display_name = excluded.display_name,
      required_scopes = excluded.required_scopes,
      notes = COALESCE(social_platform_connections.notes, excluded.notes),
      updated_at = CURRENT_TIMESTAMP`).bind(
platform.platform_key,
platform.display_name,
platform.connection_status,
platform.api_ready,
platform.requires_oauth,
platform.required_scopes,
platform.notes
).run().catch(()=> null);
}
}
async function summarize(db,env={}){
// Build 197: dashboard reads do not run a large DDL/seed pass. The deployment migration owns schema changes.
const summary=await db.prepare(`SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN post_status IN ('draft','ready') THEN 1 ELSE 0 END) AS open_count,
    SUM(CASE WHEN approval_status='needs_review' THEN 1 ELSE 0 END) AS needs_review_count,
    SUM(CASE WHEN post_status='posted' THEN 1 ELSE 0 END) AS posted_count,
    SUM(CASE WHEN COALESCE(scheduled_at,'') <> '' AND datetime(scheduled_at) > datetime('now') AND post_status IN ('draft','ready') THEN 1 ELSE 0 END) AS scheduled_count,
    SUM(CASE WHEN COALESCE(scheduled_at,'') <> '' AND datetime(scheduled_at) <= datetime('now') AND post_status='ready' AND approval_status='approved' THEN 1 ELSE 0 END) AS due_count,
    SUM(CASE WHEN COALESCE(do_not_repost,0)=1 AND post_status IN ('draft','ready') THEN 1 ELSE 0 END) AS duplicate_warning_count
    FROM social_post_queue`).first().catch(()=> ({ total:0,open_count:0,needs_review_count:0,posted_count:0,scheduled_count:0,due_count:0,duplicate_warning_count:0 }));
const queue=rows(await db.prepare(`SELECT * FROM social_post_queue ORDER BY datetime(updated_at) DESC, social_post_queue_id DESC LIMIT 50`).all().catch(()=> ({ results:[] })));
const platforms=rows(await db.prepare(`SELECT * FROM social_platform_connections ORDER BY platform_key`).all().catch(()=> ({ results:[] })));
const attempts=rows(await db.prepare(`SELECT a.*, q.social_post_key FROM social_post_attempts a INNER JOIN social_post_queue q ON q.social_post_queue_id = a.social_post_queue_id ORDER BY datetime(a.attempted_at) DESC LIMIT 30`).all().catch(()=> ({ results:[] })));
const templates=rows(await db.prepare(`SELECT * FROM social_caption_templates WHERE COALESCE(is_active,1)=1 ORDER BY content_pillar, display_name`).all().catch(()=> ({ results:[] })));
const calendar=rows(await db.prepare(`SELECT
      substr(COALESCE(scheduled_at, created_at), 1, 10) AS calendar_date,
      COUNT(*) AS total,
      SUM(CASE WHEN post_status='ready' AND approval_status='approved' THEN 1 ELSE 0 END) AS ready_count,
      SUM(CASE WHEN post_status='posted' THEN 1 ELSE 0 END) AS posted_count,
      SUM(CASE WHEN COALESCE(do_not_repost,0)=1 THEN 1 ELSE 0 END) AS duplicate_warning_count
    FROM social_post_queue
    WHERE datetime(COALESCE(scheduled_at, created_at, datetime('now'))) >= datetime('now','-7 days')
      AND datetime(COALESCE(scheduled_at, created_at, datetime('now'))) <= datetime('now','+45 days')
      AND COALESCE(post_status,'draft') <> 'archived'
    GROUP BY calendar_date
    ORDER BY calendar_date ASC
    LIMIT 60`).all().catch(()=> ({ results:[] })));
await ensureUtmAnalyticsColumns(db);
const hasPageViews=await tableExists(db,'site_page_views');
const hasSessions=await tableExists(db,'site_visitor_sessions');
const hasCustomRequests=await tableExists(db,'custom_requests');
const utm_rollups=rows(await db.prepare(`${hasPageViews || hasSessions || hasCustomRequests ? `WITH
q AS (
SELECT COALESCE(NULLIF(utm_source,''),'unknown') AS utm_source,
COALESCE(NULLIF(utm_medium,''),'social') AS utm_medium,
COALESCE(NULLIF(utm_campaign,''),'uncategorized') AS utm_campaign,
COUNT(*) AS total_posts,
SUM(CASE WHEN post_status='posted'THEN 1 ELSE 0 END) AS posted_count,
SUM(CASE WHEN post_status IN ('draft','ready') THEN 1 ELSE 0 END) AS open_count,
SUM(CASE WHEN approval_status='approved'THEN 1 ELSE 0 END) AS approved_count
FROM social_post_queue
WHERE COALESCE(post_status,'draft') <> 'archived'
GROUP BY utm_source,utm_medium,utm_campaign
),
v AS (${hasPageViews ? `SELECT COALESCE(NULLIF(utm_source,''),'unknown') AS utm_source, COALESCE(NULLIF(utm_medium,''),'social') AS utm_medium, COALESCE(NULLIF(utm_campaign,''),'uncategorized') AS utm_campaign, COUNT(*) AS page_views, COUNT(DISTINCT site_visitor_session_id) AS visitor_sessions, SUM(CASE WHEN path LIKE '/checkout%' THEN 1 ELSE 0 END) AS checkout_views FROM site_page_views WHERE COALESCE(utm_campaign,'') <> '' GROUP BY utm_source, utm_medium, utm_campaign`:`SELECT 'none' AS utm_source, 'none' AS utm_medium, 'none' AS utm_campaign, 0 AS page_views, 0 AS visitor_sessions, 0 AS checkout_views WHERE 0`}),
s AS (${hasSessions ? `SELECT COALESCE(NULLIF(utm_source,''),'unknown') AS utm_source, COALESCE(NULLIF(utm_medium,''),'social') AS utm_medium, COALESCE(NULLIF(utm_campaign,''),'uncategorized') AS utm_campaign, COUNT(*) AS session_count, SUM(CASE WHEN is_checkout_started=1 THEN 1 ELSE 0 END) AS checkout_starts, SUM(CASE WHEN is_abandoned_cart=1 THEN 1 ELSE 0 END) AS abandoned_carts FROM site_visitor_sessions WHERE COALESCE(utm_campaign,'') <> '' GROUP BY utm_source, utm_medium, utm_campaign`:`SELECT 'none' AS utm_source, 'none' AS utm_medium, 'none' AS utm_campaign, 0 AS session_count, 0 AS checkout_starts, 0 AS abandoned_carts WHERE 0`}),
cr AS (${hasCustomRequests ? `SELECT COALESCE(NULLIF(utm_source,''),'unknown') AS utm_source, COALESCE(NULLIF(utm_medium,''),'social') AS utm_medium, COALESCE(NULLIF(utm_campaign,''),'uncategorized') AS utm_campaign, COUNT(*) AS custom_request_count FROM custom_requests WHERE COALESCE(utm_campaign,'') <> '' GROUP BY utm_source, utm_medium, utm_campaign`:`SELECT 'none' AS utm_source, 'none' AS utm_medium, 'none' AS utm_campaign, 0 AS custom_request_count WHERE 0`})
SELECT q.*,COALESCE(v.page_views,0) AS page_views,COALESCE(v.visitor_sessions,0) AS visitor_sessions,COALESCE(v.checkout_views,0) AS checkout_views,COALESCE(s.session_count,0) AS session_count,COALESCE(s.checkout_starts,0) AS checkout_starts,COALESCE(s.abandoned_carts,0) AS abandoned_carts,COALESCE(cr.custom_request_count,0) AS custom_request_count
FROM q
LEFT JOIN v ON v.utm_source=q.utm_source AND v.utm_medium=q.utm_medium AND v.utm_campaign=q.utm_campaign
LEFT JOIN s ON s.utm_source=q.utm_source AND s.utm_medium=q.utm_medium AND s.utm_campaign=q.utm_campaign
LEFT JOIN cr ON cr.utm_source=q.utm_source AND cr.utm_medium=q.utm_medium AND cr.utm_campaign=q.utm_campaign` : `SELECT
COALESCE(NULLIF(utm_source,''),'unknown') AS utm_source,
COALESCE(NULLIF(utm_medium,''),'social') AS utm_medium,
COALESCE(NULLIF(utm_campaign,''),'uncategorized') AS utm_campaign,
COUNT(*) AS total_posts,
SUM(CASE WHEN post_status='posted'THEN 1 ELSE 0 END) AS posted_count,
SUM(CASE WHEN post_status IN ('draft','ready') THEN 1 ELSE 0 END) AS open_count,
SUM(CASE WHEN approval_status='approved'THEN 1 ELSE 0 END) AS approved_count,
0 AS page_views,0 AS visitor_sessions,0 AS checkout_views,0 AS session_count,0 AS checkout_starts,0 AS abandoned_carts,0 AS custom_request_count
FROM social_post_queue
WHERE COALESCE(post_status,'draft') <> 'archived'
GROUP BY utm_source,utm_medium,utm_campaign`}
    ORDER BY total_posts DESC, posted_count DESC, page_views DESC, custom_request_count DESC, utm_campaign ASC
    LIMIT 40`).all().catch(()=> ({ results:[] })));
const platform_readiness=getPlatformReadiness(env);
const platformRows=platforms.map((platform)=> ({
...platform,
...(platform_readiness[platform.platform_key] ||{}),
stored_api_ready:platform.api_ready
}));
return{ summary,queue,platforms:platformRows,attempts,templates,calendar,utm_rollups,platform_readiness };
}
function normalizeQueueRow(row={}){
return{
...row,
target_platforms:safeJson(row.target_platforms_json,[]),
image_urls:safeJson(row.image_urls_json,[]),
platform_caption_overrides:safeJson(row.platform_caption_overrides_json,{}),
media_quality_warnings:safeJson(row.media_quality_warnings_json,[]),
dry_run_payload:safeJson(row.dry_run_payload_json,{})
};
}
async function createQueuedPost(db,adminUser,payload={}){
const title=trimTo(payload.title || payload.job_title || payload.process_title || 'Workshop update',140);
const summary=trimTo(payload.summary || payload.description || '',1200);
const templateKey=slugKey(payload.caption_template_key || payload.template_key || '');
const template=await templateByKey(db,templateKey);
const templatePlatforms=template ? safeJson(template.default_platforms_json,[]) :[];
const hashtags=normalizeHashtags(payload.hashtags || template?.default_hashtags || 'DevilnDove,HandmadeOntario,WorkshopMade,SmallBusinessCanada');
const imageUrls=splitList(payload.image_urls || payload.image_url || payload.images).map(safeUrl).filter(Boolean).slice(0,10);
const videoUrl=safeUrl(payload.video_url || '');
const linkUrl=safeUrl(payload.link_url || payload.product_url || '');
const platforms=normalizePlatforms(payload.target_platforms || payload.platforms || templatePlatforms);
const sourceType=slugKey(payload.source_type || 'job_update') || 'job_update';
const sourceId=normalizeText(payload.source_id || payload.job_id || '');
const contentPillar=slugKey(payload.content_pillar || template?.content_pillar || sourceType || 'workshop_update');
const callToAction=normalizeText(payload.call_to_action || template?.call_to_action || 'Follow along with the Devil n Dove workshop.');
const utmSource=normalizeText(payload.utm_source || 'devilndove_social');
const utmMedium=normalizeText(payload.utm_medium || 'social');
const utmCampaign=slugKey(payload.utm_campaign || templateKey || contentPillar || sourceType || 'workshop_update');
const utmUrl=buildUtmUrl(linkUrl,{ ...payload,utm_source:utmSource,utm_medium:utmMedium,utm_campaign:utmCampaign,caption_template_key:templateKey,source_type:sourceType },platforms);
const templatedCaption=template ? fillCaptionTemplate(template,{ title,summary,call_to_action:callToAction,link_url:utmUrl || linkUrl,hashtags }) :'';
const caption=trimTo(payload.caption || templatedCaption || buildCaption({ title,summary,hashtags,linkUrl:utmUrl || linkUrl }),2200);
const platformCaptionOverrides=normalizeCaptionOverrides(payload,platforms);
const notes=normalizeText(payload.notes || '');
const scheduledAt=parseScheduledAt(payload.scheduled_at || '');
const scheduleTimezone=normalizeText(payload.schedule_timezone || payload.timezone || 'America/Toronto');
const status=['draft','ready'].includes(slugKey(payload.post_status)) ? slugKey(payload.post_status) :'draft';
const approval=status==='ready'? 'approved':'needs_review';
const mediaWarnings=buildMediaWarnings({ platforms,imageUrls,videoUrl,caption });
const duplicateSignature=buildDuplicateSignature({ title,caption,imageUrls,platforms,linkUrl });
const existingDuplicate=await db.prepare(`SELECT social_post_queue_id, title, post_status FROM social_post_queue WHERE duplicate_signature = ? AND COALESCE(post_status,'draft') <> 'archived' ORDER BY datetime(created_at) DESC LIMIT 1`).bind(duplicateSignature).first().catch(()=> null);
const doNotRepost=existingDuplicate ? 1 :0;
const socialPostKey=buildQueueKey(`${sourceType}|${sourceId}|${title}|${summary}`);
const mergedNotes=[notes,existingDuplicate ? `Possible duplicate of social queue #${existingDuplicate.social_post_queue_id}; review before reposting.`:''].filter(Boolean).join(' | ');

const insert=await db.prepare(`INSERT INTO social_post_queue (
    social_post_key, source_type, source_id, title, summary, caption, hashtags,
    target_platforms_json, image_urls_json, video_url, link_url, approval_status,
    post_status, scheduled_at, created_by_user_id, updated_by_user_id, notes,
    platform_caption_overrides_json, media_quality_warnings_json, duplicate_signature, do_not_repost, schedule_timezone,
    caption_template_key, content_pillar, call_to_action, utm_source, utm_medium, utm_campaign, utm_url,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
socialPostKey,
sourceType,
sourceId || null,
title,
summary || null,
caption || null,
hashtags || null,
JSON.stringify(platforms),
JSON.stringify(imageUrls),
videoUrl || null,
linkUrl || null,
approval,
status,
scheduledAt || null,
adminUser.user_id,
adminUser.user_id,
mergedNotes || null,
JSON.stringify(platformCaptionOverrides),
JSON.stringify(mediaWarnings),
duplicateSignature,
doNotRepost,
scheduleTimezone || null,
templateKey || null,
contentPillar || null,
callToAction || null,
utmSource || null,
utmMedium || null,
utmCampaign || null,
utmUrl || null
).run();
const socialPostQueueId=Number(insert?.meta?.last_row_id || 0);

for (const platform of platforms){
await db.prepare(`INSERT INTO social_post_attempts (
      social_post_queue_id, platform_key, attempt_status, attempted_by_user_id, notes, attempted_at
    ) VALUES (?, ?, 'manual_ready', ?, ?, CURRENT_TIMESTAMP)`).bind(
socialPostQueueId,
platform,
adminUser.user_id,
doNotRepost ? 'Prepared but flagged as possible duplicate; review before publishing.':'Prepared for manual publishing/copy-paste.'
).run().catch(()=> null);
}

return{ social_post_queue_id:socialPostQueueId,social_post_key:socialPostKey,duplicate_warning:!!existingDuplicate,media_warnings:mediaWarnings };
}
async function updateStatus(db,adminUser,payload={}){
const id=Number(payload.social_post_queue_id || 0);
if (!id) throw new Error('A social_post_queue_id is required.');
const postStatus=slugKey(payload.post_status || '');
const approvalStatus=slugKey(payload.approval_status || '');
const allowedPost=new Set(['draft','ready','posted','failed','archived']);
const allowedApproval=new Set(['needs_review','approved','rejected']);
const fields=[];
const bindings=[];
if (allowedPost.has(postStatus)){ fields.push('post_status = ?');bindings.push(postStatus);}
if (allowedApproval.has(approvalStatus)){ fields.push('approval_status = ?');bindings.push(approvalStatus);}
if (payload.notes !==undefined){ fields.push('notes = ?');bindings.push(normalizeText(payload.notes) || null);}
if (payload.scheduled_at !==undefined){ fields.push('scheduled_at = ?');bindings.push(parseScheduledAt(payload.scheduled_at) || null);}
if (payload.schedule_timezone !==undefined){ fields.push('schedule_timezone = ?');bindings.push(normalizeText(payload.schedule_timezone) || null);}
if (payload.do_not_repost !==undefined){ fields.push('do_not_repost = ?');bindings.push(Number(payload.do_not_repost) ? 1 :0);}
if (postStatus==='posted'){ fields.push('published_at = COALESCE(published_at, CURRENT_TIMESTAMP)');}
if (!fields.length) throw new Error('No valid status change was provided.');
fields.push('updated_by_user_id = ?');bindings.push(adminUser.user_id);
fields.push('updated_at = CURRENT_TIMESTAMP');
bindings.push(id);
await db.prepare(`UPDATE social_post_queue SET ${fields.join(', ')} WHERE social_post_queue_id = ?`).bind(...bindings).run();
}
async function recordManualPost(db,adminUser,payload={}){
const id=Number(payload.social_post_queue_id || 0);
const platform=slugKey(payload.platform_key || payload.platform || '');
if (!id || !platform) throw new Error('social_post_queue_id and platform_key are required.');
const externalUrl=safeUrl(payload.external_post_url || '');
const externalId=normalizeText(payload.external_post_id || '');
await db.prepare(`INSERT INTO social_post_attempts (
    social_post_queue_id, platform_key, attempt_status, external_post_url, external_post_id,
    response_json, attempted_by_user_id, attempted_at, notes
  ) VALUES (?, ?, 'posted_manual', ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`).bind(
id,
platform,
externalUrl || null,
externalId || null,
JSON.stringify({ mode:'manual_record',recorded_at:new Date().toISOString() }),
adminUser.user_id,
normalizeText(payload.notes || 'Manual post recorded.')
).run();
await db.prepare(`UPDATE social_post_queue SET post_status='posted', approval_status='approved', published_at=COALESCE(published_at,CURRENT_TIMESTAMP), updated_by_user_id=?, updated_at=CURRENT_TIMESTAMP WHERE social_post_queue_id=?`).bind(adminUser.user_id,id).run();
}
async function generateFromRecentMedia(db,adminUser){
const mediaRows=rows(await db.prepare(`SELECT public_url, original_filename, variant_role, annotation_notes, created_at FROM media_assets WHERE COALESCE(public_url,'') <> '' ORDER BY datetime(created_at) DESC LIMIT 6`).all().catch(()=> ({ results:[] })));
if (!mediaRows.length) throw new Error('No recent media assets with public URLs were found. Upload job/process images first.');
const imageUrls=mediaRows.map((row)=> row.public_url).filter(Boolean);
return createQueuedPost(db,adminUser,{
source_type:'recent_media',
title:'Fresh from the Devil n Dove workshop',
summary:'A quick behind-the-scenes look at what we are making, testing, repairing, or learning in the shop today.',
image_urls:imageUrls,
hashtags:'DevilnDove,WorkshopMade,HandmadeOntario,SmallBusinessCanada,BehindTheScenes',
target_platforms:['facebook','instagram','tiktok','x'],
notes:`Generated from ${imageUrls.length} recent media asset(s). Review and edit before posting.`
});
}

async function publishToFacebook(env,row,images){
const pageId=envText(env,'FACEBOOK_PAGE_ID','META_PAGE_ID');
const token=envText(env,'FACEBOOK_PAGE_ACCESS_TOKEN','META_PAGE_ACCESS_TOKEN');
if (!pageId || !token) throw new Error('Facebook API credentials are missing. Add FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN.');
const caption=platformCaption(row,'facebook');
const version=envText(env,'META_GRAPH_API_VERSION') || 'v25.0';
const url=images[0]
? `https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}/photos`
:`https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}/feed`;
const body=new URLSearchParams();
body.set('access_token',token);
if (images[0]){
body.set('url',images[0]);
body.set('caption',caption);
} else{
body.set('message',caption);
}
const{ response,body:responseBody,text }=await fetchJson(url,{ method:'POST',body });
if (!response.ok) throw new Error(`Facebook publish failed (${response.status}): ${responseBody?.error?.message || text || 'unknown error'}`);
return{ id:responseBody.post_id || responseBody.id || '',url:responseBody.post_id ? `https://www.facebook.com/${responseBody.post_id}`:'',response:responseBody,http_status:response.status };
}
async function publishToInstagram(env,row,images){
const igUserId=envText(env,'INSTAGRAM_USER_ID','IG_USER_ID','INSTAGRAM_BUSINESS_ACCOUNT_ID');
const token=envText(env,'INSTAGRAM_ACCESS_TOKEN','META_PAGE_ACCESS_TOKEN','FACEBOOK_PAGE_ACCESS_TOKEN');
if (!igUserId || !token) throw new Error('Instagram API credentials are missing. Add INSTAGRAM_USER_ID and INSTAGRAM_ACCESS_TOKEN or FACEBOOK_PAGE_ACCESS_TOKEN.');
if (!images[0]) throw new Error('Instagram publishing needs at least one public image URL.');
const version=envText(env,'META_GRAPH_API_VERSION') || 'v25.0';
const createBody=new URLSearchParams();
createBody.set('access_token',token);
createBody.set('image_url',images[0]);
createBody.set('caption',platformCaption(row,'instagram'));
const createResult=await fetchJson(`https://graph.facebook.com/${version}/${encodeURIComponent(igUserId)}/media`,{ method:'POST',body:createBody });
if (!createResult.response.ok || !createResult.body?.id) throw new Error(`Instagram media container failed (${createResult.response.status}): ${createResult.body?.error?.message || createResult.text || 'unknown error'}`);
const publishBody=new URLSearchParams();
publishBody.set('access_token',token);
publishBody.set('creation_id',createResult.body.id);
const publishResult=await fetchJson(`https://graph.facebook.com/${version}/${encodeURIComponent(igUserId)}/media_publish`,{ method:'POST',body:publishBody });
if (!publishResult.response.ok) throw new Error(`Instagram publish failed (${publishResult.response.status}): ${publishResult.body?.error?.message || publishResult.text || 'unknown error'}`);
return{ id:publishResult.body?.id || createResult.body.id || '',url:'',response:{ create:createResult.body,publish:publishResult.body },http_status:publishResult.response.status };
}
async function publishToX(env,row){
const token=envText(env,'X_USER_ACCESS_TOKEN','TWITTER_USER_ACCESS_TOKEN');
if (!token) throw new Error('X API token is missing. Add X_USER_ACCESS_TOKEN with post/write permission.');
const text=platformCaption(row,'x');
if (!text) throw new Error('X post text is empty. Add a caption before publishing.');
const{ response,body,text:raw }=await fetchJson('https://api.x.com/2/tweets',{
method:'POST',
headers:{ Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
body:JSON.stringify({ text })
});
if (!response.ok) throw new Error(`X publish failed (${response.status}): ${body?.detail || body?.title || body?.errors?.[0]?.message || raw || 'unknown error'}`);
const id=body?.data?.id || '';
return{ id,url:id ? `https://x.com/i/web/status/${id}`:'',response:body,http_status:response.status };
}
async function publishToPinterest(env,row,images){
const token=envText(env,'PINTEREST_ACCESS_TOKEN');
const boardId=envText(env,'PINTEREST_BOARD_ID');
if (!token || !boardId) throw new Error('Pinterest API credentials are missing. Add PINTEREST_ACCESS_TOKEN and PINTEREST_BOARD_ID.');
if (!images[0]) throw new Error('Pinterest publishing needs at least one public image URL.');
const payload={
board_id:boardId,
title:trimTo(row.title || 'Devil n Dove workshop update',100),
description:platformCaption(row,'pinterest'),
link:absolutePostUrl(row,'pinterest') || undefined,
media_source:{ source_type:'image_url',url:images[0] }
};
const{ response,body,text }=await fetchJson('https://api.pinterest.com/v5/pins',{
method:'POST',
headers:{ Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
body:JSON.stringify(payload)
});
if (!response.ok) throw new Error(`Pinterest publish failed (${response.status}): ${body?.message || text || 'unknown error'}`);
return{ id:body?.id || '',url:body?.link || '',response:body,http_status:response.status };
}
async function recordApiAttempt(db,adminUser,id,platform,status,details={}){
await db.prepare(`INSERT INTO social_post_attempts (
    social_post_queue_id, platform_key, attempt_status, external_post_url, external_post_id,
    platform_response_id, published_url, request_mode, http_status, response_json,
    attempted_by_user_id, attempted_at, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, 'api', ?, ?, ?, CURRENT_TIMESTAMP, ?)`).bind(
id,
platform,
status,
details.external_post_url || details.url || null,
details.external_post_id || details.id || null,
details.platform_response_id || details.id || null,
details.published_url || details.url || null,
details.http_status || null,
JSON.stringify(details.response || details.error || details ||{}),
adminUser.user_id,
details.notes || null
).run().catch(async ()=>{
await db.prepare(`INSERT INTO social_post_attempts (
      social_post_queue_id, platform_key, attempt_status, external_post_url, external_post_id,
      response_json, attempted_by_user_id, attempted_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`).bind(
id,
platform,
status,
details.external_post_url || details.url || null,
details.external_post_id || details.id || null,
JSON.stringify(details.response || details.error || details ||{}),
adminUser.user_id,
details.notes || null
).run().catch(()=> null);
});
}


async function saveCaptionTemplate(db,payload={}){
const templateKey=slugKey(payload.template_key || payload.caption_template_key || payload.display_name || '');
const displayName=trimTo(payload.display_name || templateKey.replace(/_/g,' '),120);
const bodyTemplate=trimTo(payload.body_template || '',2200);
if (!templateKey) throw new Error('Template key is required.');
if (!displayName) throw new Error('Template display name is required.');
if (!bodyTemplate) throw new Error('Template body is required.');
const platforms=normalizePlatforms(payload.default_platforms || payload.platforms || payload.default_platforms_json || ['facebook','instagram']);
const hashtags=normalizeHashtags(payload.default_hashtags || payload.hashtags || 'DevilnDove,HandmadeOntario,WorkshopMade');
const contentPillar=slugKey(payload.content_pillar || 'workshop_update');
const callToAction=trimTo(payload.call_to_action || '',280);
const notes=trimTo(payload.notes || '',1200);
const isActive=payload.is_active===false || String(payload.is_active || '').toLowerCase()==='0'? 0 :1;

await db.prepare(`INSERT INTO social_caption_templates (
    template_key, display_name, content_pillar, default_platforms_json, default_hashtags,
    body_template, call_to_action, is_active, notes, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT(template_key) DO UPDATE SET
    display_name = excluded.display_name,
    content_pillar = excluded.content_pillar,
    default_platforms_json = excluded.default_platforms_json,
    default_hashtags = excluded.default_hashtags,
    body_template = excluded.body_template,
    call_to_action = excluded.call_to_action,
    is_active = excluded.is_active,
    notes = excluded.notes,
    updated_at = CURRENT_TIMESTAMP`).bind(
templateKey,displayName,contentPillar,JSON.stringify(platforms),hashtags,
bodyTemplate,callToAction || null,isActive,notes || null
).run();

return{ template_key:templateKey,display_name:displayName,is_active:isActive };
}

async function archiveCaptionTemplate(db,payload={}){
const templateKey=slugKey(payload.template_key || payload.caption_template_key || '');
if (!templateKey) throw new Error('Template key is required.');
await db.prepare(`UPDATE social_caption_templates SET is_active=0, updated_at=CURRENT_TIMESTAMP WHERE template_key = ?`).bind(templateKey).run();
return{ template_key:templateKey,archived:true };
}

async function previewCaptionTemplate(db,payload={}){
const template=await templateByKey(db,payload.caption_template_key || payload.template_key || '');
if (!template) throw new Error('Choose a valid caption template.');
const platforms=normalizePlatforms(payload.target_platforms || payload.platforms || safeJson(template.default_platforms_json,[]));
const hashtags=normalizeHashtags(payload.hashtags || template.default_hashtags || 'DevilnDove,HandmadeOntario,WorkshopMade,SmallBusinessCanada');
const linkUrl=safeUrl(payload.link_url || payload.product_url || '');
const utmUrl=buildUtmUrl(linkUrl,{ ...payload,caption_template_key:template.template_key },platforms);
const caption=fillCaptionTemplate(template,{
title:payload.title || 'Fresh from the Devil n Dove workshop',
summary:payload.summary || 'A quick behind-the-scenes update from our making table.',
call_to_action:payload.call_to_action || template.call_to_action,
link_url:utmUrl || linkUrl,
hashtags
});
return{ template_key:template.template_key,display_name:template.display_name,platforms,hashtags,utm_url:utmUrl,caption };
}

async function dryRunQueuedPost(context,db,adminUser,payload={}){
const id=Number(payload.social_post_queue_id || 0);
if (!id) throw new Error('A social_post_queue_id is required.');
const row=await db.prepare(`SELECT * FROM social_post_queue WHERE social_post_queue_id = ? LIMIT 1`).bind(id).first();
if (!row) throw new Error('Queued social post not found.');
const selected=normalizePlatforms(payload.platform_keys || payload.platforms || safeJson(row.target_platforms_json,[]));
const dryRun=buildDryRunPayload(row,selected,context.env);
await db.prepare(`UPDATE social_post_queue SET dry_run_payload_json=?, last_dry_run_at=CURRENT_TIMESTAMP, updated_by_user_id=?, updated_at=CURRENT_TIMESTAMP WHERE social_post_queue_id=?`).bind(
JSON.stringify(dryRun),
adminUser.user_id,
id
).run().catch(()=> null);
for (const item of dryRun.platform_payloads || []){
await recordApiAttempt(db,adminUser,id,item.platform,'dry_run_preview',{ platform:item.platform,response:item,notes:'Dry-run payload preview only; nothing was posted.'});
}
return dryRun;
}
async function publishQueuedPost(context,db,adminUser,payload={}){
const id=Number(payload.social_post_queue_id || 0);
if (!id) throw new Error('A social_post_queue_id is required.');
const row=await db.prepare(`SELECT * FROM social_post_queue WHERE social_post_queue_id = ? LIMIT 1`).bind(id).first();
if (!row) throw new Error('Queued social post not found.');
const queuedPlatforms=safeJson(row.target_platforms_json,[]);
const selected=normalizePlatforms(payload.platform_keys || payload.platforms || queuedPlatforms);
const images=safeJson(row.image_urls_json,[]).map(safeUrl).filter(Boolean);
const readiness=getPlatformReadiness(context.env);
const results=[];
// Build 673: a successful provider acknowledgement belongs to its channel.
// Force and partial-channel retries cannot publish that channel a second time.
const priorSuccess=rows(await db.prepare(`SELECT DISTINCT platform_key FROM social_post_attempts
    WHERE social_post_queue_id=? AND attempt_status IN ('api_posted','receipt_verified','posted_manual')`).bind(id).all().catch(()=>({results:[]})));
const alreadyPublished=new Set(priorSuccess.map(item=>item.platform_key));

// Build 672: a tagged CAIP original is not a public derivative. Never let
// force=true bypass the per-URL, per-project owner approval for this source.
if (row.source_type==='caip_project'){
const approved=images.length > 0 && await Promise.all(images.map(async (url)=>{
const receipt=await db.prepare(`SELECT consent_record_id FROM media_consent_records
        WHERE source_type='caip_project' AND source_id=? AND media_url=?
          AND consent_status='approved' AND public_use_allowed=1 AND social_use_allowed=1
          AND (expires_at IS NULL OR datetime(expires_at)>CURRENT_TIMESTAMP)
        ORDER BY consent_record_id DESC LIMIT 1`).bind(String(row.source_id||''),url).first().catch(()=>null);
return !!receipt;
})).then(flags=>flags.every(Boolean));
if (!approved) return{social_post_queue_id:id,attempted_platforms:selected,
results:selected.map(platform=>({platform,status:'blocked_caip_derivative_approval',notes:'Exact public derivative and owner consent receipt required; force cannot override.'}))};
}

await db.prepare(`UPDATE social_post_queue SET last_publish_attempt_at=CURRENT_TIMESTAMP, updated_by_user_id=?, updated_at=CURRENT_TIMESTAMP WHERE social_post_queue_id=?`).bind(adminUser.user_id,id).run().catch(()=> null);

const privacyStatus=slugKey(row.privacy_status || 'needs_review');
const privacyApproved=Number(row.approved_for_public_post || 0)===1 || ['approved','no_private_media'].includes(privacyStatus);
if (!privacyApproved && (row.source_type==='caip_project'|| payload.force !==true)){
for (const platform of selected){
const blocked={ platform,status:'blocked_privacy_review',privacy_status:privacyStatus,notes:'Review Social Media Privacy Guard before API publishing this post.'};
await recordApiAttempt(db,adminUser,id,platform,'blocked_privacy_review',blocked);
results.push(blocked);
}
return{ social_post_queue_id:id,attempted_platforms:selected,results };
}

if (Number(row.do_not_repost || 0)===1 && payload.force !==true){
for (const platform of selected){
const blocked={ platform,status:'blocked_duplicate_suspected',notes:'Possible duplicate/repost detected. Clear the duplicate warning or force publish only after review.'};
await recordApiAttempt(db,adminUser,id,platform,'blocked_duplicate_suspected',blocked);
results.push(blocked);
}
return{ social_post_queue_id:id,attempted_platforms:selected,results };
}

if (isScheduledInFuture(row.scheduled_at) && payload.force !==true){
for (const platform of selected){
const blocked={ platform,status:'blocked_scheduled',scheduled_at:row.scheduled_at,notes:'This post is scheduled for the future. Use dry run/preview now or wait until it is due.'};
await recordApiAttempt(db,adminUser,id,platform,'blocked_scheduled',blocked);
results.push(blocked);
}
return{ social_post_queue_id:id,attempted_platforms:selected,results };
}

const verified672=row.source_type==='caip_project'? await verifyAccounts672(context.env) :[];
for (const platform of selected){
if (alreadyPublished.has(platform)){
results.push({platform,status:'already_published',notes:'An earlier provider receipt exists; duplicate publishing is blocked.'});
continue;
}
if (row.approval_status !=='approved'&& (row.source_type==='caip_project'|| payload.force !==true)){
const blocked={ platform,status:'blocked_needs_approval',notes:'Approve/ready the queue item before API publishing.'};
await recordApiAttempt(db,adminUser,id,platform,'blocked_needs_approval',blocked);
results.push(blocked);
continue;
}
if (['tiktok','youtube'].includes(platform)){
const manual={ platform,status:'manual_pending',notes:readiness[platform]?.notes || 'This platform remains manual/review-first in this build.'};
await recordApiAttempt(db,adminUser,id,platform,'manual_pending',manual);
results.push(manual);
continue;
}
if (row.source_type==='caip_project'&& !verified672.some(account=>account.platform===platform && account.verified)){
const held={platform,status:'blocked_account_unverified',notes:'Destination identity must be verified with its provider before owner-supervised CAIP publishing.'};
await recordApiAttempt(db,adminUser,id,platform,'blocked_account_unverified',held);
results.push(held);
continue;
}
if (!readiness[platform]?.api_ready){
const missing={ platform,status:'credentials_missing',notes:readiness[platform]?.notes || 'Missing platform credentials.',missing_env:readiness[platform]?.missing_env || [] };
await recordApiAttempt(db,adminUser,id,platform,'credentials_missing',missing);
results.push(missing);
continue;
}
try{
let published;
if (platform==='facebook') published=await publishToFacebook(context.env,row,images);
else if (platform==='instagram') published=await publishToInstagram(context.env,row,images);
else if (platform==='x') published=await publishToX(context.env,row,images);
else if (platform==='pinterest') published=await publishToPinterest(context.env,row,images);
else throw new Error(`API publishing is not implemented for ${platform}.`);
await recordApiAttempt(db,adminUser,id,platform,'api_posted',{
platform,
id:published.id,
url:published.url,
external_post_id:published.id,
external_post_url:published.url,
published_url:published.url,
http_status:published.http_status,
response:published.response,
notes:'Published through configured platform API.'
});
results.push({ platform,status:'api_posted',external_post_id:published.id,external_post_url:published.url,http_status:published.http_status });
} catch (error){
const failure={ platform,status:'api_failed',error:error?.message || String(error || 'Publish failed.') };
await recordApiAttempt(db,adminUser,id,platform,'api_failed',failure);
results.push(failure);
}
}
if(results.length && results.every(item=>item.status==='already_published')){
return{social_post_queue_id:id,attempted_platforms:selected,results,publication_performed:false};
}
const postedCount=results.filter((row)=> ['api_posted','already_published'].includes(row.status)).length;
const failedCount=results.filter((row)=> row.status==='api_failed').length;
const terminal=postedCount && !failedCount && results.every((row)=> ['api_posted','already_published','manual_pending'].includes(row.status)) ? 'posted':postedCount ? 'ready':failedCount ? 'failed':'ready';
await db.prepare(`UPDATE social_post_queue
    SET post_status = ?, published_at = CASE WHEN ?='posted' THEN COALESCE(published_at,CURRENT_TIMESTAMP) ELSE published_at END,
        updated_by_user_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE social_post_queue_id = ?`).bind(terminal,terminal,adminUser.user_id,id).run().catch(()=> null);
return{ social_post_queue_id:id,attempted_platforms:selected,results };
}

// Build 673: receipts are provider acknowledgements until a separate read-only
// provider lookup independently confirms the same published ID.
async function receipts673(db){
const records=rows(await db.prepare(`SELECT a.social_post_attempt_id,a.social_post_queue_id,a.platform_key,
    a.attempt_status,a.external_post_id,a.external_post_url,a.attempted_at,a.notes,q.title
    FROM social_post_attempts a JOIN social_post_queue q ON q.social_post_queue_id=a.social_post_queue_id
    WHERE a.attempt_status IN ('api_posted','receipt_verified','api_failed','blocked_account_unverified','posted_manual','recovery_requested')
    ORDER BY a.social_post_attempt_id DESC LIMIT 150`).all().catch(()=>({results:[]})));
const latest=new Map();
for(const item of records){const key=item.social_post_queue_id+':'+item.platform_key;if(!latest.has(key))latest.set(key,item);}
const channels=[...latest.values()];
return{channels,totals:{
provider_acknowledged:channels.filter(x=>x.attempt_status==='api_posted').length,
independently_verified:channels.filter(x=>x.attempt_status==='receipt_verified').length,
failed:channels.filter(x=>x.attempt_status==='api_failed').length,
on_hold:channels.filter(x=>['blocked_account_unverified','recovery_requested'].includes(x.attempt_status)).length,
manually_recorded:channels.filter(x=>x.attempt_status==='posted_manual').length
},interpretation:'Latest recorded channel outcome, not a provider-wide reach or engagement measurement.'};
}
// Build 674: campaign planning only; approval is reset and no provider is called.
async function scheduleCampaign674(db,adminUser,payload){
const id=Number(payload.social_post_queue_id);
const campaign=trimTo(payload.campaign_name||'',60).trim();
const date=parseScheduledAt(payload.scheduled_at);
if(!Number.isSafeInteger(id)||id<1||!campaign||!date||!Number.isFinite(new Date(date).getTime()))throw Error('Choose an existing draft, campaign and valid schedule.');
const row=await db.prepare('SELECT post_status FROM social_post_queue WHERE social_post_queue_id=?').bind(id).first();
if(!row||['posted','archived'].includes(row.post_status))throw Error('Posted or archived content cannot be rescheduled.');
await db.prepare(`UPDATE social_post_queue SET utm_campaign=?,scheduled_at=?,schedule_timezone=?,
    post_status='draft',approval_status='needs_review',updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP
    WHERE social_post_queue_id=?`).bind(campaign,date,trimTo(payload.schedule_timezone||'UTC',64),adminUser.user_id,id).run();
return{social_post_queue_id:id,campaign_name:campaign,scheduled_at:date,approval_reset:true,publication_performed:false};
}
// Build 675: provider metrics are accepted only from a fresh, authenticated
// read-only lookup of a previously acknowledged publication ID.
async function verifyEngagement675(context,db,adminUser,payload){
const queueId=Number(payload.social_post_queue_id),platform=slugKey(payload.platform_key||'');
if(!Number.isSafeInteger(queueId)||queueId<1||!['facebook','x'].includes(platform))
return{verified:false,status:'provider_metrics_unsupported',publication_performed:false};
const receipt=await db.prepare(`SELECT external_post_id FROM social_post_attempts WHERE social_post_queue_id=?
    AND platform_key=? AND attempt_status IN ('api_posted','receipt_verified') AND COALESCE(external_post_id,'')<>''
    ORDER BY social_post_attempt_id DESC LIMIT 1`).bind(queueId,platform).first();
if(!receipt)return{verified:false,status:'publication_receipt_missing',publication_performed:false};
const id=String(receipt.external_post_id),env=context.env,meta=platform==='x'
?{url:`https://api.x.com/2/tweets/${encodeURIComponent(id)}?tweet.fields=public_metrics`,token:envText(env,'X_USER_ACCESS_TOKEN','TWITTER_USER_ACCESS_TOKEN')}
:{url:`https://graph.facebook.com/${envText(env,'META_GRAPH_API_VERSION')||'v22.0'}/${encodeURIComponent(id)}?fields=id,reactions.limit(0).summary(true),comments.limit(0).summary(true)`,token:envText(env,'FACEBOOK_PAGE_ACCESS_TOKEN','META_PAGE_ACCESS_TOKEN')};
if(!meta.token)return{verified:false,status:'provider_credentials_missing',publication_performed:false};
try{
const res=await fetch(meta.url,{headers:{Authorization:`Bearer ${meta.token}`},signal:AbortSignal.timeout(6000)});
const json=await res.json().catch(()=>({})),item=json.data||json;
if(!res.ok||String(item.id||'')!==id)return{verified:false,status:'provider_metrics_hold',publication_performed:false};
const values=platform==='x'?{likes:item.public_metrics?.like_count,replies:item.public_metrics?.reply_count,
shares:item.public_metrics?.retweet_count,quotes:item.public_metrics?.quote_count}
:{likes:item.reactions?.summary?.total_count,replies:item.comments?.summary?.total_count};
const metrics={};for(const [key,value] of Object.entries(values))
if(Number.isSafeInteger(value)&&value>=0)metrics[key]=value;
if(!Object.keys(metrics).length)return{verified:false,status:'provider_metrics_missing',publication_performed:false};
const observedAt=new Date().toISOString();
await recordApiAttempt(db,adminUser,queueId,platform,'engagement_verified',{
external_post_id:id,response:{provider_id:id,metrics,observed_at:observedAt,provenance:'read_only_provider_api'},
notes:'Verified source-scoped engagement snapshot; not sales or ROI.'
});
return{verified:true,status:'engagement_verified',platform,metrics,observed_at:observedAt,publication_performed:false};
}catch{return{verified:false,status:'provider_metrics_unavailable',publication_performed:false};}
}
async function engagement675(db){
const data=rows(await db.prepare(`SELECT a.social_post_queue_id,a.platform_key,a.external_post_id,a.response_json,a.attempted_at,
    q.utm_campaign FROM social_post_attempts a JOIN social_post_queue q ON q.social_post_queue_id=a.social_post_queue_id
    WHERE a.attempt_status='engagement_verified' ORDER BY a.social_post_attempt_id DESC LIMIT 100`).all().catch(()=>({results:[]})));
const seen=new Set(),snapshots=[];
for(const item of data){const key=item.social_post_queue_id+':'+item.platform_key;if(seen.has(key))continue;seen.add(key);
const evidence=safeJson(item.response_json,{});if(evidence.provenance!=='read_only_provider_api')continue;
snapshots.push({social_post_queue_id:item.social_post_queue_id,platform:item.platform_key,campaign:item.utm_campaign,
provider_id:item.external_post_id,metrics:evidence.metrics,observed_at:evidence.observed_at});}
return{snapshots,roi_status:'UNAVAILABLE_NO_VERIFIED_ATTRIBUTED_REVENUE_AND_SPEND',financial_claims:false};
}
// Build 676: order settlement and campaign attribution are separate evidence
// axes. The current order schema has no authoritative UTM/session foreign key.
async function recordFinancialEvidence676(db,adminUser,payload){
const id=Number(payload.social_post_queue_id),kind=slugKey(payload.kind||'');
const post=await db.prepare('SELECT utm_campaign FROM social_post_queue WHERE social_post_queue_id=?').bind(id).first();
if(!Number.isSafeInteger(id)||id<1||!post?.utm_campaign||payload.owner_reviewed!==true)
throw Error('An existing named campaign and explicit owner review are required.');
if(kind==='cost'){
const cents=Number(payload.cost_cents),ref=trimTo(payload.receipt_reference||'',100).trim();
if(!Number.isSafeInteger(cents)||cents<=0||!ref||payload.currency!=='CAD')
throw Error('Provide a positive CAD amount and authentic expense receipt reference.');
const duplicate=await db.prepare(`SELECT social_post_attempt_id FROM social_post_attempts WHERE
      attempt_status='campaign_cost_recorded' AND platform_key='campaign_cost' AND external_post_id=? LIMIT 1`).bind(ref).first();
if(duplicate)throw Error('Expense receipt already recorded; duplicate cost blocked.');
await recordApiAttempt(db,adminUser,id,'campaign_cost','campaign_cost_recorded',{
external_post_id:ref,response:{campaign:post.utm_campaign,cost_cents:cents,currency:'CAD',receipt_reference:ref,
provenance:'owner_attested_expense_receipt',roi_certified:false},
notes:'Owner-recorded expense evidence, not independent vendor verification.'});
return{status:'cost_evidence_recorded',roi_certified:false,publication_performed:false};
}
if(kind==='revenue'){
const orderId=Number(payload.order_id);
if(!Number.isSafeInteger(orderId)||orderId<1)throw Error('A real order ID is required.');
const order=await db.prepare('SELECT order_id,currency,total_cents,payment_status FROM orders WHERE order_id=?').bind(orderId).first();
if(!order||String(order.currency).toUpperCase()!=='CAD'||['refunded','partially_refunded','cancelled','failed'].includes(String(order.payment_status||'').toLowerCase()))throw Error('Order unavailable, not CAD or has an unsafe payment state.');
const payment=await db.prepare(`SELECT COALESCE(SUM(CASE WHEN LOWER(payment_status) IN
      ('paid','completed','captured') THEN amount_cents ELSE 0 END),0) AS settled_cents,
      SUM(CASE WHEN LOWER(payment_status) IN ('refunded','partially_refunded') THEN 1 ELSE 0 END) AS refund_rows
      FROM payments WHERE order_id=? AND UPPER(currency)='CAD'`).bind(orderId).first();
if(!payment||Number(payment.refund_rows)>0||Number(payment.settled_cents)<Number(order.total_cents)||Number(order.total_cents)<=0)
throw Error('Payment is not fully settled or a refund prevents revenue certification.');
const binding=await db.prepare(`SELECT a.response_json,q.utm_campaign FROM social_post_attempts a
      JOIN social_post_queue q ON q.social_post_queue_id=a.social_post_queue_id
      WHERE a.platform_key='checkout_attribution' AND a.attempt_status='checkout_session_bound'
      AND a.external_post_id=? ORDER BY a.social_post_attempt_id ASC LIMIT 1`).bind(String(orderId)).first();
const bound=safeJson(binding?.response_json,{});
if(!binding||binding.utm_campaign!==post.utm_campaign||!Number.isSafeInteger(Number(bound.site_visitor_session_id)))
throw Error('Paid order has no matching recorded checkout campaign identity. Attribution HOLD.');
const duplicate=await db.prepare(`SELECT social_post_attempt_id FROM social_post_attempts WHERE
      attempt_status IN ('campaign_revenue_candidate_hold','campaign_revenue_bound') AND platform_key='campaign_revenue'
      AND external_post_id=? LIMIT 1`).bind(String(orderId)).first();
if(duplicate)throw Error('This order already has a campaign-attribution candidate.');
await recordApiAttempt(db,adminUser,id,'campaign_revenue','campaign_revenue_bound',{
external_post_id:String(orderId),response:{campaign:post.utm_campaign,order_id:orderId,
settled_cents:Number(payment.settled_cents),currency:'CAD',settlement_verified:true,
attribution_verified:true,site_visitor_session_id:Number(bound.site_visitor_session_id),
provenance:'server_observed_checkout_campaign',roi_certified:false},
notes:'Paid order and first-party campaign session matched; expense verification still required for certified ROI.'});
return{status:'paid_order_bound_to_campaign',roi_certified:false,publication_performed:false};
}
throw Error('Choose cost or revenue evidence.');
}
async function financial676(db){
const result=rows(await db.prepare(`SELECT a.attempt_status,a.external_post_id,a.response_json,a.attempted_at,
    q.utm_campaign FROM social_post_attempts a JOIN social_post_queue q ON q.social_post_queue_id=a.social_post_queue_id
    WHERE a.attempt_status IN ('campaign_cost_recorded','campaign_revenue_candidate_hold','campaign_revenue_bound')
    ORDER BY a.social_post_attempt_id DESC LIMIT 150`).all().catch(()=>({results:[]})));
const items=result.map(row=>{const detail=safeJson(row.response_json,{});return{kind:row.attempt_status,
campaign:row.utm_campaign,reference:row.external_post_id,amount_cents:row.attempt_status==='campaign_cost_recorded'?
detail.cost_cents:detail.settled_cents,observed_at:row.attempted_at,
attribution_verified:row.attempt_status==='campaign_revenue_bound',roi_certified:false};});
return{items,certification:items.some(i=>i.attribution_verified)?'HOLD_VENDOR_COST_VERIFICATION':'HOLD_CHECKOUT_SESSION_AND_PAID_ORDER_PROOF',currency:'CAD',
cost_evidence:'OWNER_ATTESTED_NOT_VENDOR_VERIFIED',roi_percent:null,roi_certified:false};
}
async function verifyPublication673(context,db,adminUser,payload){
const id=Number(payload.social_post_queue_id),platform=slugKey(payload.platform_key||'');
if(!Number.isSafeInteger(id)||id<1||!['facebook','instagram','pinterest','x'].includes(platform))throw Error('Select a valid queue and supported social channel.');
const receipt=await db.prepare(`SELECT * FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key=?
    AND attempt_status IN ('api_posted','receipt_verified') AND COALESCE(external_post_id,'')<>''
    ORDER BY social_post_attempt_id DESC LIMIT 1`).bind(id,platform).first();
if(!receipt)throw Error('No provider-acknowledged receipt exists. HOLD.');
const idOnProvider=String(receipt.external_post_id);
const env=context.env;
const provider=platform==='facebook'
?{url:`https://graph.facebook.com/${envText(env,'META_GRAPH_API_VERSION')||'v22.0'}/${encodeURIComponent(idOnProvider)}?fields=id,permalink_url`,token:envText(env,'FACEBOOK_PAGE_ACCESS_TOKEN','META_PAGE_ACCESS_TOKEN')}
:platform==='instagram'
?{url:`https://graph.facebook.com/${envText(env,'META_GRAPH_API_VERSION')||'v22.0'}/${encodeURIComponent(idOnProvider)}?fields=id,permalink`,token:envText(env,'INSTAGRAM_ACCESS_TOKEN','META_PAGE_ACCESS_TOKEN','FACEBOOK_PAGE_ACCESS_TOKEN')}
:platform==='pinterest'
?{url:`https://api.pinterest.com/v5/pins/${encodeURIComponent(idOnProvider)}`,token:envText(env,'PINTEREST_ACCESS_TOKEN')}
:{url:`https://api.x.com/2/tweets/${encodeURIComponent(idOnProvider)}`,token:envText(env,'X_USER_ACCESS_TOKEN','TWITTER_USER_ACCESS_TOKEN')};
if(!provider.token)return{verified:false,status:'provider_credentials_missing',publication_performed:false};
try{
const res=await fetch(provider.url,{headers:{Authorization:`Bearer ${provider.token}`},signal:AbortSignal.timeout(6000)});
const body=await res.json().catch(()=>({}));
const returned=String((body.data||body).id||'');
if(!res.ok||returned!==idOnProvider)return{verified:false,status:'provider_lookup_hold',publication_performed:false};
await recordApiAttempt(db,adminUser,id,platform,'receipt_verified',{
external_post_id:idOnProvider,external_post_url:receipt.external_post_url,
notes:'Independent read-only provider ID lookup matched prior acknowledgement.',
response:{verified_at:new Date().toISOString(),provider_id:idOnProvider,http_status:res.status}
});
return{verified:true,status:'receipt_verified',platform,provider_id:idOnProvider,publication_performed:false};
}catch{return{verified:false,status:'provider_lookup_unavailable',publication_performed:false};}
}
async function retryFailed673(context,db,adminUser,payload){
const id=Number(payload.social_post_queue_id),platform=slugKey(payload.platform_key||'');
if(!Number.isSafeInteger(id)||id<1||!['facebook','instagram','pinterest','x'].includes(platform))throw Error('Select one supported failed channel.');
if(payload.owner_checked_no_duplicate!==true)throw Error('Owner must independently check the destination for an existing post before retry.');
const attempt=await db.prepare(`SELECT attempt_status FROM social_post_attempts
    WHERE social_post_queue_id=? AND platform_key=? ORDER BY social_post_attempt_id DESC LIMIT 1`).bind(id,platform).first();
if(attempt?.attempt_status!=='api_failed')throw Error('Only a channel whose latest attempt failed may be retried.');
const success=await db.prepare(`SELECT social_post_attempt_id FROM social_post_attempts WHERE social_post_queue_id=?
    AND platform_key=? AND attempt_status IN ('api_posted','receipt_verified','posted_manual')
    LIMIT 1`).bind(id,platform).first();
if(success)throw Error('Existing publication receipt; retry blocked.');
const queue=await db.prepare('SELECT approval_status FROM social_post_queue WHERE social_post_queue_id=?').bind(id).first();
if(queue?.approval_status!=='approved')throw Error('Queue no longer has publication approval.');
await recordApiAttempt(db,adminUser,id,platform,'recovery_requested',{notes:'Owner attested manual duplicate check before one-channel retry.'});
return publishQueuedPost(context,db,adminUser,{social_post_queue_id:id,platform_keys:[platform],force:false});
}

// Read-only account identity check. A configured token alone is not a verified account.
async function verifyAccounts672(env){
const checks=[
['facebook',envText(env,'FACEBOOK_PAGE_ID','META_PAGE_ID'),envText(env,'FACEBOOK_PAGE_ACCESS_TOKEN','META_PAGE_ACCESS_TOKEN'),id=>`https://graph.facebook.com/${envText(env,'META_GRAPH_API_VERSION')||'v22.0'}/${encodeURIComponent(id)}?fields=id,name`],
['instagram',envText(env,'INSTAGRAM_USER_ID','IG_USER_ID','INSTAGRAM_BUSINESS_ACCOUNT_ID'),envText(env,'INSTAGRAM_ACCESS_TOKEN','META_PAGE_ACCESS_TOKEN','FACEBOOK_PAGE_ACCESS_TOKEN'),id=>`https://graph.facebook.com/${envText(env,'META_GRAPH_API_VERSION')||'v22.0'}/${encodeURIComponent(id)}?fields=id,username`],
['pinterest','user_account',envText(env,'PINTEREST_ACCESS_TOKEN'),()=> 'https://api.pinterest.com/v5/user_account'],
['x','me',envText(env,'X_USER_ACCESS_TOKEN','TWITTER_USER_ACCESS_TOKEN'),()=> 'https://api.x.com/2/users/me']
];
return Promise.all(checks.map(async ([platform,id,token,url])=>{
if (!id||!token)return{platform,verified:false,status:'credentials_missing'};
try{const response=await fetch(url(id),{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(6000)});
const body=await response.json().catch(()=>({}));const user=body.data||body;
const identity=String(user.id||'');const verified=response.ok&&!!identity&&(platform==='pinterest'||platform==='x'||identity===String(id));
return{platform,verified,status:verified?'account_verified':'account_unverified',account_id:verified?identity:null,account_name:verified?String(user.name||user.username||user.business_name||'').slice(0,100):null};
}catch{return{platform,verified:false,status:'verification_unavailable'};}
})).then(rows=>[...rows,{platform:'tiktok',verified:false,status:'manual_only'},{platform:'youtube',verified:false,status:'manual_only'}]);
}

async function approveCaipDerivative672(db,adminUser,payload){
const queueId=Number(payload.social_post_queue_id),assetId=Number(payload.creative_asset_id);
const url=String(payload.public_url||'').trim();
if (!Number.isSafeInteger(queueId)||queueId<1||!Number.isSafeInteger(assetId)||assetId<1||!/^https:\/\//i.test(url))throw Error('Choose a real queue, CAIP asset and HTTPS public derivative URL.');
if (payload.owner_confirmed!==true||payload.exact_media_reviewed!==true)throw Error('Explicit owner confirmation of the exact public media and caption is required.');
const post=await db.prepare('SELECT source_type,source_id,post_status FROM social_post_queue WHERE social_post_queue_id=?').bind(queueId).first();
if(post?.source_type!=='caip_project'||!/^\d+$/.test(String(post.source_id||''))||post.post_status==='posted')throw Error('Choose an unposted CAIP-linked draft.');
const asset=await db.prepare(`SELECT ca.creative_asset_id,ca.rights_status,ma.public_url,f.consent_state,f.privacy_state,f.rights_status AS upload_rights
    FROM creative_assets ca JOIN caip_media_upload_files f ON f.creative_asset_id=ca.creative_asset_id AND f.creative_project_id=ca.creative_project_id
    LEFT JOIN media_assets ma ON ma.media_asset_id=ca.media_asset_id
    WHERE ca.creative_project_id=? AND ca.creative_asset_id=? AND f.upload_status='uploaded'
    ORDER BY f.caip_media_upload_file_id DESC LIMIT 1`).bind(Number(post.source_id),assetId).first();
if(!asset||asset.consent_state!=='public_allowed'||asset.upload_rights!=='public_allowed'||asset.privacy_state!=='public_approved'||asset.rights_status!=='public_allowed'||asset.public_url!==url)
throw Error('CAIP source rights, consent, public-approval state or canonical derivative URL are not independently verified. HOLD.');
await db.prepare(`INSERT INTO media_consent_records(consent_key,subject_label,source_type,source_id,media_url,consent_status,consent_scope,public_use_allowed,social_use_allowed,privacy_notes,reviewed_by_user_id,updated_at)
    VALUES(?,?,'caip_project',?,?,'approved','all_public',1,1,?, ?,CURRENT_TIMESTAMP)
    ON CONFLICT(consent_key) DO UPDATE SET media_url=excluded.media_url,consent_status='approved',public_use_allowed=1,social_use_allowed=1,reviewed_by_user_id=excluded.reviewed_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(`caip672:${queueId}:${assetId}`,`CAIP asset ${assetId}`,String(post.source_id),url,'Owner reviewed exact public derivative; source rights and consent checked.',adminUser.user_id).run();
await db.prepare(`UPDATE social_post_queue SET image_urls_json=?,approval_status='needs_review',post_status='draft',updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE social_post_queue_id=?`).bind(JSON.stringify([url]),adminUser.user_id,queueId).run();
return{social_post_queue_id:queueId,creative_asset_id:assetId,public_derivative_approved:true,publication_performed:false};
}


// Build 680: evidence age, independently signed Master receipt and owner exceptions (read-only by default).
async function finance680(db,env,id){
const source=await campaignNet679(db,id);
if(!source?.campaign)return{status:'HOLD_SELECT_CAMPAIGN',ack:'HOLD',exceptions:[]};
const all=rows(await db.prepare(`SELECT a.attempt_status,a.external_post_id,a.response_json,a.attempted_at
    FROM social_post_attempts a JOIN social_post_queue q ON q.social_post_queue_id=a.social_post_queue_id
    WHERE q.utm_campaign=? AND a.platform_key IN ('campaign_cost_verifier','order_cost_679','master_ack_680','profit_exception_680')
    ORDER BY a.social_post_attempt_id DESC LIMIT 500`).bind(source.campaign).all());
const evidence=all.filter(x=>['independent_expense_verified','verified_order_cost_679'].includes(x.attempt_status));
const now=Date.now(),ttl=30*86400000;
const stale=evidence.filter(x=>{const d=safeJson(x.response_json,{});const t=Date.parse(d.observed_at||d.checked_at||x.attempted_at);return !Number.isFinite(t)||t>now+300000||now-t>ttl;});
const receipts=all.filter(x=>x.attempt_status==='master_signed_ack_680');
const latest=receipts[0],claim=safeJson(latest?.response_json,{});
const ackValid=!!latest&&claim.fingerprint===source.fingerprint&&claim.source_revision===normalizeText(env?.DEVILNDOVE_SOURCE_REVISION)&&
Number.isFinite(Date.parse(claim.ack_at))&&now-Date.parse(claim.ack_at)<=86400000&&Date.parse(claim.ack_at)<=now+300000;
const exceptions=all.filter(x=>['profit_exception_open_680','profit_exception_resolved_680'].includes(x.attempt_status));
const byRef=new Map();for(const e of exceptions)if(!byRef.has(e.external_post_id))byRef.set(e.external_post_id,e);
const open=[...byRef.values()].filter(x=>x.attempt_status==='profit_exception_open_680').map(x=>({
reference:x.external_post_id,notes:safeJson(x.response_json,{}).reason||'Owner follow-up required',
created_at:x.attempted_at}));
const blockers=[...(source.blockers||[])];
if(all.length===500)blockers.push('evidence_scan_limit_reached');
if(!evidence.length)blockers.push('no_independent_cost_evidence');
if(stale.length)blockers.push('stale_or_future_dated_cost_evidence');
if(!ackValid)blockers.push('no_current_matching_independent_master_ack');
if(open.length)blockers.push('open_owner_profitability_exception');
return{campaign:source.campaign,source_status:source.status,ack:ackValid?'SIGNED_RECEIPT_MATCH_ONLY':'HOLD',
connection:'HOLD_INDEPENDENT_RUNTIME_TRANSPORT_AND_MASTER_ADMISSION',
evidence_count:evidence.length,stale_count:stale.length,
exceptions:open,blockers:[...new Set(blockers)],as_of:new Date(now).toISOString(),
profitability_certified:false,publication_performed:false};
}
async function masterAck680(db,env,user,p){
const id=Number(p.social_post_queue_id),source=await campaignNet679(db,id);
const key=normalizeText(env?.AI_DATA_MASTER_ACK_PUBLIC_KEY),revision=normalizeText(env?.DEVILNDOVE_SOURCE_REVISION);
const ackAt=normalizeText(p.ack_at),nonce=normalizeText(p.nonce),master=normalizeText(p.master_revision);
const signature=normalizeText(p.signature);
if(!source?.fingerprint||source.blockers?.length||!source.owner_accepted||!key||!revision||
!/^[-a-zA-Z0-9_]{16,100}$/.test(nonce)||!master||!signature||
!Number.isFinite(Date.parse(ackAt))||Math.abs(Date.now()-Date.parse(ackAt))>300000)
throw Error('Current source review, exact revision and independently signed Master ACK are required. HOLD.');
const claim={version:1,campaign:source.campaign,fingerprint:source.fingerprint,
source_revision:revision,master_revision:master,nonce,ack_at:new Date(ackAt).toISOString()};
let genuine=false;try{
const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const pub=await crypto.subtle.importKey('raw',decode(key),{name:'Ed25519'},false,['verify']);
genuine=await crypto.subtle.verify('Ed25519',pub,decode(signature),new TextEncoder().encode(JSON.stringify(claim)));
}catch{}
if(!genuine)throw Error('Master ACK signature invalid. HOLD.');
const replay=await db.prepare(`SELECT social_post_attempt_id FROM social_post_attempts
    WHERE platform_key='master_ack_680' AND external_post_id=? LIMIT 1`).bind(nonce).first();
if(replay)throw Error('Master ACK nonce already admitted. Replay refused.');
await recordApiAttempt(db,user,id,'master_ack_680','master_signed_ack_680',{
external_post_id:nonce,response:{...claim,signature,source:'external_master_signature',
runtime_transport_verified:false,master_admission_verified:false},
notes:'Independent signature verified; Master runtime transport/connection remain HOLD.'});
const saved=await db.prepare(`SELECT social_post_attempt_id FROM social_post_attempts
    WHERE platform_key='master_ack_680' AND external_post_id=? LIMIT 1`).bind(nonce).first();
if(!saved)throw Error('Master ACK not durably stored. HOLD.');
return{status:'signed_master_ack_recorded',connection:'HOLD',publication_performed:false};
}
async function exception680(db,user,p){
const id=Number(p.social_post_queue_id),source=await campaignNet679(db,id);
const ref=normalizeText(p.exception_reference),reason=normalizeText(p.reason),resolution=normalizeText(p.resolution);
if(!source?.campaign||p.owner_reviewed!==true||!/^[a-zA-Z0-9_-]{6,80}$/.test(ref))
throw Error('Real campaign, scoped reference and explicit owner review required.');
const last=await db.prepare(`SELECT attempt_status FROM social_post_attempts
    WHERE platform_key='profit_exception_680' AND external_post_id=? AND social_post_queue_id=?
    ORDER BY social_post_attempt_id DESC LIMIT 1`).bind(ref,id).first();
if(p.kind==='open'&&(!reason||last?.attempt_status==='profit_exception_open_680'))
throw Error('Provide a new issue and avoid duplicate open exceptions.');
if(p.kind==='resolve'&&(!resolution||last?.attempt_status!=='profit_exception_open_680'))
throw Error('Only an open exception with a documented owner resolution can be closed.');
if(!['open','resolve'].includes(p.kind))throw Error('Unsupported exception decision.');
const status=p.kind==='open'?'profit_exception_open_680':'profit_exception_resolved_680';
await recordApiAttempt(db,user,id,'profit_exception_680',status,{
external_post_id:ref,response:{campaign:source.campaign,reason:reason||null,
resolution:resolution||null,owner_user_id:user.user_id,profitability_certified:false},
notes:'Owner exception record only; no independent financial certification.'});
const saved=await db.prepare(`SELECT social_post_attempt_id FROM social_post_attempts
WHERE platform_key='profit_exception_680' AND external_post_id=? AND social_post_queue_id=? AND attempt_status=?
ORDER BY social_post_attempt_id DESC LIMIT 1`).bind(ref,id,status).first();
if(!saved)throw Error('Owner exception evidence was not durably saved. HOLD.');
return{status,exception_reference:ref,profitability_certified:false,publication_performed:false};
}


const parseUtc681=x=>{const v=String(x??'');return Date.parse(/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(v)?v.replace(' ','T')+'Z':v);};
export function exceptionSla681(e,now=Date.now()){
const opened=parseUtc681(e.opened_at),ack=parseUtc681(e.ack_at),closed=parseUtc681(e.resolved_at);
return{...e,age_hours:Number.isFinite(opened)?Math.max(0,Math.floor((now-opened)/3600000)):null,
acknowledgement_due_at:Number.isFinite(opened)?new Date(opened+24*3600000).toISOString():null,
resolution_due_at:Number.isFinite(opened)?new Date(opened+72*3600000).toISOString():null,
sla:!Number.isFinite(opened)?'HOLD_INVALID_CLOCK':Number.isFinite(closed)?'RESOLVED':
now>opened+72*3600000&&!Number.isFinite(ack)?'ACK_AND_RESOLUTION_OVERDUE':
now>opened+72*3600000?'RESOLUTION_OVERDUE':
!Number.isFinite(ack)&&now>opened+24*3600000?'ACK_OVERDUE':Number.isFinite(ack)?'ACKNOWLEDGED_OPEN':'AWAITING_ACK'};
}

async function finance681(db,env,id){
const source=await campaignNet679(db,id);
if(!source?.campaign)return{status:'HOLD_SELECT_CAMPAIGN',exceptions:[],master_receipts:[],owner_history:[]};
const audit=rows(await db.prepare(`SELECT a.social_post_attempt_id,a.social_post_queue_id,a.platform_key,a.attempt_status,a.external_post_id,a.attempted_at,a.response_json
 FROM social_post_attempts a JOIN social_post_queue q ON q.social_post_queue_id=a.social_post_queue_id
 WHERE q.utm_campaign=? AND a.attempt_status IN
 ('profit_exception_open_680','profit_exception_resolved_680','owner_exception_acknowledged_681',
 'master_signed_ack_680','campaign_roi_owner_accepted','net_campaign_owner_accepted_679')
 ORDER BY a.social_post_attempt_id ASC LIMIT 251`).bind(source.campaign).all());
const now=Date.now(),issues=new Map(),masters=[],history=[];
for(const a of audit.slice(0,250)){
const d=safeJson(a.response_json,{}),key=a.social_post_queue_id+':'+a.external_post_id;
if(a.attempt_status==='profit_exception_open_680')issues.set(key,{reference:a.external_post_id,queue_id:a.social_post_queue_id,reason:d.reason||'',opened_at:a.attempted_at,ack_at:null,resolved_at:null});
if(a.attempt_status==='owner_exception_acknowledged_681'){
const e=issues.get(key);if(e&&!e.resolved_at)e.ack_at=a.attempted_at;
history.push({receipt_id:Number(a.social_post_attempt_id),kind:'exception_acknowledgement',recorded_at:a.attempted_at});
}
if(a.attempt_status==='profit_exception_resolved_680'){const e=issues.get(key);if(e)e.resolved_at=a.attempted_at;}
if(['campaign_roi_owner_accepted','net_campaign_owner_accepted_679'].includes(a.attempt_status))
history.push({receipt_id:Number(a.social_post_attempt_id),kind:a.attempt_status,recorded_at:a.attempted_at});
if(a.attempt_status==='master_signed_ack_680'){
const t=Date.parse(d.ack_at),same=d.fingerprint===source.fingerprint&&
d.source_revision===normalizeText(env?.DEVILNDOVE_SOURCE_REVISION);
masters.push({receipt_id:Number(a.social_post_attempt_id),recorded_at:a.attempted_at,master_revision:d.master_revision||null,
source_revision:d.source_revision||null,
state:!same?'SUPERSEDED_OR_SOURCE_MISMATCH':!Number.isFinite(t)||now-t>86400000||t>now+300000?'EXPIRED_OR_INVALID_TIME':'SIGNED_AT_INTAKE_RECEIPT_ONLY'});
}
}
const exceptions=[...issues.values()].map(e=>exceptionSla681(e,now));
return{campaign:source.campaign,status:audit.length>250?'HOLD_INCOMPLETE_AUDIT':'READ_ONLY',as_of:new Date(now).toISOString(),
exception_sla:{acknowledge_hours:24,resolve_hours:72,policy:'PROVISIONAL_OWNER_REVIEW_TARGETS'},
exceptions,master_receipts:masters.slice(-25).reverse(),owner_history:history.slice(-25).reverse(),
scan_complete:audit.length<=250,connection:'HOLD_INDEPENDENT_RUNTIME_TRANSPORT_AND_MASTER_ADMISSION',
master_accepted:false,profitability_certified:false};
}
async function ownerExceptionAck681(db,user,p){
const id=Number(p.social_post_queue_id),ref=normalizeText(p.exception_reference);
if(!Number.isSafeInteger(id)||id<1||!/^[-a-zA-Z0-9_]{6,80}$/.test(ref)||p.owner_reviewed!==true)
throw Error('Select a real campaign exception and explicitly confirm owner review.');
const source=await campaignNet679(db,id);
if(!source?.campaign)throw Error('Campaign not found. HOLD.');
const last=await db.prepare(`SELECT attempt_status FROM social_post_attempts WHERE social_post_queue_id=?
 AND platform_key='profit_exception_680' AND external_post_id=?
 ORDER BY social_post_attempt_id DESC LIMIT 1`).bind(id,ref).first();
if(last?.attempt_status!=='profit_exception_open_680')throw Error('Only an open exception may be acknowledged.');
const earlier=await finance681(db,{},id);
if(!earlier.scan_complete)throw Error('Audit window incomplete; owner review HOLD.');
const match=earlier.exceptions?.find(e=>e.queue_id===id&&e.reference===ref&&!e.resolved_at);
if(!match||match.ack_at)throw Error('Exception acknowledgement already recorded or no open episode.');
const prior=await db.prepare(`SELECT COALESCE(MAX(social_post_attempt_id),0) AS last_id
 FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='profit_exception_review_681'
 AND external_post_id=?`).bind(id,ref).first();
await recordApiAttempt(db,user,id,'profit_exception_review_681','owner_exception_acknowledged_681',{
external_post_id:ref,response:{campaign:source.campaign,owner_user_id:user.user_id,decision:'acknowledged_for_review',
profitability_certified:false},notes:'Owner acknowledgement only, not resolution or Master acceptance.'});
const saved=await db.prepare(`SELECT social_post_attempt_id FROM social_post_attempts
 WHERE social_post_queue_id=? AND platform_key='profit_exception_review_681'
 AND external_post_id=? AND attempt_status='owner_exception_acknowledged_681'
 AND social_post_attempt_id>? ORDER BY social_post_attempt_id DESC LIMIT 1`).bind(id,ref,Number(prior?.last_id||0)).first();
if(!saved)throw Error('Owner acceptance history was not durably saved. HOLD.');
return{status:'owner_exception_acknowledged_681',connection:'HOLD',publication_performed:false};
}



// Build 683: signed financial provenance; Master CONNECTED remains HOLD.
export function financialClaim683(kind,x){
if(kind==='source')return{version:1,source:'devilndove',campaign:x.campaign,queue_id:x.queue_id,
source_revision:x.source_revision,fingerprint_sha256:x.fingerprint_sha256,signer_id:x.signer_id,nonce:x.nonce,issued_at:x.issued_at};
if(kind==='master')return{version:1,source:'devilndove',campaign:x.campaign,queue_id:x.queue_id,
source_revision:x.source_revision,fingerprint_sha256:x.fingerprint_sha256,
source_signer_receipt_id:x.source_signer_receipt_id,source_signer_nonce:x.source_signer_nonce,
master_revision:x.master_revision,nonce:x.nonce,issued_at:x.issued_at};
throw Error('Unsupported financial claim');
}
const fresh683=(t,age=86400000)=>typeof t==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(t)&&
Number.isFinite(Date.parse(t))&&Date.now()-Date.parse(t)<=age&&Date.now()-Date.parse(t)>=-300000;
const nonce683=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{16,100}$/.test(v);
async function signed683(key,claim,signature){
if(!key||!signature||typeof key!=='string'||typeof signature!=='string')return false;
try{
const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const pk=decode(key),sig=decode(signature);
if(pk.length!==32||sig.length!==64)return false;
const verifier=await crypto.subtle.importKey('raw',pk,{name:'Ed25519'},false,['verify']);
return await crypto.subtle.verify('Ed25519',verifier,sig,new TextEncoder().encode(JSON.stringify(claim)));
}catch{return false}
}
async function financial683(db,env,id){
const n=Number(id);
if(!Number.isSafeInteger(n)||n<1)return{status:'HOLD_SELECT_CAMPAIGN',signer:{status:'HOLD'},master:{status:'HOLD'},master_correlated:false};
const baseline=await finance682(db,env,n),rev=normalizeText(env?.DEVILNDOVE_SOURCE_REVISION);
const data=rows(await db.prepare("SELECT social_post_attempt_id,platform_key,external_post_id,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key IN ('finance_signer_683','finance_master_683','finance_closure_683') ORDER BY social_post_attempt_id DESC LIMIT 121").bind(n).all());
const complete=baseline.complete&&data.length<=120;
const source=data.find(r=>r.platform_key==='finance_signer_683'),proof=safeJson(source?.response_json,{}),claim=proof.claim||{};
const sourceOK=!!complete&&!!rev&&claim.source_revision===rev&&claim.campaign===baseline.campaign&&claim.queue_id===n&&
claim.fingerprint_sha256===baseline.fingerprint_sha256&&claim.signer_id===normalizeText(env?.FINANCIAL_EVIDENCE_SIGNER_ID_683)&&
nonce683(claim.nonce)&&fresh683(claim.issued_at)&&
await signed683(normalizeText(env?.FINANCIAL_EVIDENCE_SIGNER_PUBLIC_KEY_683),financialClaim683('source',claim),proof.signature);
const master=data.find(r=>r.platform_key==='finance_master_683'),mp=safeJson(master?.response_json,{}),mc=mp.claim||{};
const masterOK=!!sourceOK&&mc.campaign===baseline.campaign&&mc.queue_id===n&&mc.source_revision===rev&&
mc.fingerprint_sha256===baseline.fingerprint_sha256&&mc.source_signer_receipt_id===Number(source.social_post_attempt_id)&&
mc.source_signer_nonce===claim.nonce&&!!mc.master_revision&&nonce683(mc.nonce)&&fresh683(mc.issued_at)&&
await signed683(normalizeText(env?.AI_DATA_MASTER_ACK_PUBLIC_KEY),financialClaim683('master',mc),mp.signature);
return{status:!complete?'HOLD_INCOMPLETE_AUDIT':masterOK?'SOURCE_MASTER_SIGNED_RECEIPTS_CORRELATED':'HOLD_INDEPENDENT_SIGNED_PROOF',
complete,queue_id:n,campaign:baseline.campaign,source_revision:rev||null,fingerprint_sha256:baseline.fingerprint_sha256,
signer:{status:sourceOK?'INDEPENDENT_SIGNER_ADMITTED':'HOLD',signer_id:normalizeText(env?.FINANCIAL_EVIDENCE_SIGNER_ID_683)||null,
receipt_id:sourceOK?Number(source.social_post_attempt_id):null,nonce:sourceOK?claim.nonce:null},
master:{status:masterOK?'SIGNED_MASTER_RECEIPT_CORRELATED':'HOLD',receipt_id:masterOK?Number(master.social_post_attempt_id):null,
master_revision:masterOK?mc.master_revision:null},master_correlated:!!masterOK,
closed_cases:data.filter(r=>r.platform_key==='finance_closure_683').slice(0,25).map(r=>{
const d=safeJson(r.response_json,{});return{case_code:r.external_post_id,receipt_id:r.social_post_attempt_id,
current_source:d.fingerprint_sha256===baseline.fingerprint_sha256,
current_master:!!masterOK&&d.master_receipt_id===Number(master.social_post_attempt_id),recorded_at:r.attempted_at};}),
master_connection:'HOLD_INDEPENDENT_RUNTIME_TRANSPORT_AND_MASTER_ADMISSION',
master_accepted:false,profitability_certified:false,publication_performed:false};
}
async function admission683(db,env,user,p){
const id=Number(p.social_post_queue_id),v=await finance682(db,env,id),
revision=normalizeText(env?.DEVILNDOVE_SOURCE_REVISION),signer=normalizeText(env?.FINANCIAL_EVIDENCE_SIGNER_ID_683);
if(p.owner_reviewed!==true||!v.complete||!v.source_owner_accepted||!v.financial||!revision||!signer||
v.cases.some(c=>!c.code.startsWith('MASTER_')))throw Error('Independent signer admission requires complete fresh owner-reviewed source finances. HOLD.');
const nonce=normalizeText(p.nonce),issued_at=normalizeText(p.issued_at),signature=normalizeText(p.signature);
if(!nonce683(nonce)||!fresh683(issued_at,300000))throw Error('Fresh unique source nonce and UTC timestamp required.');
const claim=financialClaim683('source',{campaign:v.campaign,queue_id:id,source_revision:revision,
fingerprint_sha256:v.fingerprint_sha256,signer_id:signer,nonce,issued_at});
if(!await signed683(normalizeText(env?.FINANCIAL_EVIDENCE_SIGNER_PUBLIC_KEY_683),claim,signature))
throw Error('Independently enrolled signer did not verify the exact financial source. HOLD.');
const duplicate=await db.prepare("SELECT social_post_attempt_id FROM social_post_attempts WHERE platform_key='finance_signer_683' AND external_post_id=? LIMIT 1").bind(nonce).first();
if(duplicate)throw Error('Source signer nonce replay rejected.');
await recordApiAttempt(db,user,id,'finance_signer_683','independent_financial_signer_admitted_683',{
external_post_id:nonce,response:{claim,signature,verified_at:new Date().toISOString()},
notes:'External Ed25519 verified; no private key, connected status or financial certification.'});
const saved=rows(await db.prepare("SELECT social_post_attempt_id FROM social_post_attempts WHERE platform_key='finance_signer_683' AND external_post_id=? LIMIT 2").bind(nonce).all());
if(saved.length!==1)throw Error('Unique durable signer evidence could not be confirmed. HOLD.');
return{status:'independent_financial_signer_admitted_683',receipt_id:saved[0].social_post_attempt_id,
master_accepted:false,publication_performed:false};
}
async function masterCorrelation683(db,env,user,p){
const id=Number(p.social_post_queue_id),v=await financial683(db,env,id);
if(p.owner_reviewed!==true||!v.complete||v.signer?.status!=='INDEPENDENT_SIGNER_ADMITTED')
throw Error('Current independent financial signer evidence must be admitted first. HOLD.');
const nonce=normalizeText(p.nonce),issued_at=normalizeText(p.issued_at),
master_revision=normalizeText(p.master_revision),signature=normalizeText(p.signature);
if(!nonce683(nonce)||!fresh683(issued_at,300000)||!master_revision||master_revision.length>120)
throw Error('Fresh Master nonce, revision and UTC timestamp required.');
const claim=financialClaim683('master',{campaign:v.campaign,queue_id:id,source_revision:v.source_revision,
fingerprint_sha256:v.fingerprint_sha256,source_signer_receipt_id:v.signer.receipt_id,
source_signer_nonce:v.signer.nonce,master_revision,nonce,issued_at});
if(!await signed683(normalizeText(env?.AI_DATA_MASTER_ACK_PUBLIC_KEY),claim,signature))
throw Error('External Master did not sign the exact independent source receipt. HOLD.');
const duplicate=await db.prepare("SELECT social_post_attempt_id FROM social_post_attempts WHERE platform_key='finance_master_683' AND external_post_id=? LIMIT 1").bind(nonce).first();
if(duplicate)throw Error('Master receipt nonce replay rejected.');
await recordApiAttempt(db,user,id,'finance_master_683','master_financial_receipt_correlated_683',{
external_post_id:nonce,response:{claim,signature,verified_at:new Date().toISOString()},
notes:'Independent signed Master receipt matched source signer; runtime CONNECTED still unverified.'});
const saved=rows(await db.prepare("SELECT social_post_attempt_id FROM social_post_attempts WHERE platform_key='finance_master_683' AND external_post_id=? LIMIT 2").bind(nonce).all());
if(saved.length!==1)throw Error('Unique durable Master correlation could not be confirmed. HOLD.');
return{status:'master_financial_receipt_correlated_683',receipt_id:saved[0].social_post_attempt_id,
connection:'HOLD',master_accepted:false,publication_performed:false};
}
async function ownerClosure683(db,env,user,p){
const id=Number(p.social_post_queue_id),case_code=normalizeText(p.case_code),
note=normalizeText(p.resolution_note),v=await financial683(db,env,id),baseline=await finance682(db,env,id);
if(p.owner_reviewed!==true||!/^[-A-Z0-9_]{6,100}$/.test(case_code)||note.length<20||note.length>400||
!v.complete||!v.master_correlated||p.expected_fingerprint_sha256!==v.fingerprint_sha256)
throw Error('Exact source fingerprint, signed independent Master receipt and owner evidence review required. HOLD.');
if(baseline.cases.some(c=>!c.code.startsWith('MASTER_'))||
baseline.cases.some(c=>c.code===case_code&&!c.code.startsWith('MASTER_')))
throw Error('Source discrepancy still active; independent closure HOLD.');
const prior=await db.prepare("SELECT social_post_attempt_id FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_discrepancy_682' AND external_post_id=? AND attempt_status IN ('owner_escalated_682','owner_reviewed_682') ORDER BY social_post_attempt_id DESC LIMIT 1").bind(id,case_code).first();
if(!prior)throw Error('A prior owner-reviewed discrepancy is required before closure.');
const last=await db.prepare("SELECT response_json FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_closure_683' AND external_post_id=? ORDER BY social_post_attempt_id DESC LIMIT 1").bind(id,case_code).first();
const old=safeJson(last?.response_json,{});
if(old.fingerprint_sha256===v.fingerprint_sha256&&old.master_receipt_id===v.master.receipt_id)
throw Error('Duplicate closure for exact source and Master receipts refused.');
await recordApiAttempt(db,user,id,'finance_closure_683','owner_discrepancy_evidence_closed_683',{
external_post_id:case_code,response:{fingerprint_sha256:v.fingerprint_sha256,
source_signer_receipt_id:v.signer.receipt_id,master_receipt_id:v.master.receipt_id,
original_review_receipt_id:prior.social_post_attempt_id,owner_user_id:user.user_id,resolution_note:note,
master_accepted:false,profitability_certified:false},
notes:'Owner case evidence closed; runtime Master CONNECTED and accounting certification remain HOLD.'});
const saved=await db.prepare("SELECT social_post_attempt_id FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_closure_683' AND external_post_id=? ORDER BY social_post_attempt_id DESC LIMIT 1").bind(id,case_code).first();
if(!saved)throw Error('Durable owner discrepancy closure record missing. HOLD.');
return{status:'owner_discrepancy_evidence_closed_683',receipt_id:saved.social_post_attempt_id,
master_accepted:false,connection:'HOLD',publication_performed:false};
}


// Build 684: only externally controlled signing keys and a pinned, authenticated receiver are trusted.
export function claim684(kind,c){
if(kind==='enrollment')return{v:1,purpose:'devilndove_finance_signer_runtime_684',source:'devilndove',
queue_id:c.queue_id,campaign:c.campaign,source_revision:c.source_revision,fingerprint_sha256:c.fingerprint_sha256,
source_signer_receipt_id:c.source_signer_receipt_id,signer_id:c.signer_id,nonce:c.nonce,issued_at:c.issued_at};
if(kind==='acceptance')return{v:1,purpose:'ai_data_finance_master_acceptance_684',source:'devilndove',
queue_id:c.queue_id,campaign:c.campaign,source_revision:c.source_revision,fingerprint_sha256:c.fingerprint_sha256,
source_signer_receipt_id:c.source_signer_receipt_id,enrollment_receipt_id:c.enrollment_receipt_id,
master_signed_receipt_id:c.master_signed_receipt_id,master_revision:c.master_revision,
receiver_receipt_id:c.receiver_receipt_id,request_nonce:c.request_nonce,decision:'accepted',issued_at:c.issued_at};
throw Error('Unknown financial evidence claim');
}
export const nonce684=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{16,100}$/.test(x);
export const fresh684=(x,max=300000,now=Date.now())=>typeof x==='string'&&
/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(x)&&Number.isFinite(Date.parse(x))&&
now-Date.parse(x)>=-300000&&now-Date.parse(x)<=max;
const decode684=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export async function verify684(key,claim,signature){
if(typeof key!=='string'||typeof signature!=='string'||!key||!signature)return false;
try{
const pub=decode684(key),sig=decode684(signature);if(pub.length!==32||sig.length!==64)return false;
const k=await crypto.subtle.importKey('raw',pub,'Ed25519',false,['verify']);
return !!await crypto.subtle.verify('Ed25519',k,sig,new TextEncoder().encode(JSON.stringify(claim)));
}catch{return false;}
}
export function same684(a,b){return a?.queue_id===b?.queue_id&&a?.campaign===b?.campaign&&
a?.source_revision===b?.source_revision&&a?.fingerprint_sha256===b?.fingerprint_sha256&&
a?.source_signer_receipt_id===b?.source_signer_receipt_id;}
export function endpoint684(env){
const urlText=env?.FINANCIAL_MASTER_ACCEPTANCE_URL_684,origin=env?.FINANCIAL_MASTER_ACCEPTANCE_ORIGIN_684,
token=env?.FINANCIAL_MASTER_ACCEPTANCE_TOKEN_684;
if(typeof urlText!=='string'||typeof origin!=='string'||typeof token!=='string'||
!/^[A-Za-z0-9_.~+/-]{24,4096}$/.test(token))return null;
try{const url=new URL(urlText),pin=new URL(origin);
if(url.protocol!=='https:'||pin.protocol!=='https:'||url.origin!==pin.origin||
pin.pathname!=='/'||pin.search||pin.hash||url.username||url.password||url.hash||
!/^\/[A-Za-z0-9_./-]{1,240}$/.test(url.pathname))return null;
return{url:url.href,token};}catch{return null;}
}
export async function lookup684(env,identity,fetchImpl=fetch){
const server=endpoint684(env);if(!server)throw Error('Pinned authenticated Master receiver not enrolled. HOLD.');
const request_nonce=crypto.randomUUID()+'-'+crypto.randomUUID();
const response=await fetchImpl(server.url,{method:'GET',redirect:'error',cache:'no-store',headers:{
'Authorization':'Bearer '+server.token,'Accept':'application/json','X-Finance-Queue-Id':String(identity.queue_id),
'X-Finance-Fingerprint':identity.fingerprint_sha256,
'X-Finance-Source-Receipt':String(identity.source_signer_receipt_id),
'X-Finance-Master-Receipt':String(identity.master_signed_receipt_id),
'X-Finance-Request-Nonce':request_nonce}});
if(!response?.ok||response.status!==200||!(response.headers?.get('content-type')||'').toLowerCase().includes('application/json'))
throw Error('Independent Master receiver did not return authenticated JSON acceptance. HOLD.');
if(Number(response.headers.get('content-length')||0)>16384)throw Error('Master receipt evidence too large. HOLD.');
const raw=await response.text();if(raw.length>16384)throw Error('Master receipt exceeded evidence limit. HOLD.');
let evidence;try{evidence=JSON.parse(raw)}catch{throw Error('Malformed independent Master receipt. HOLD.')}
const c=evidence?.claim;
if(!c||c.request_nonce!==request_nonce||c.decision!=='accepted'||!same684(c,identity)||
c.enrollment_receipt_id!==identity.enrollment_receipt_id||
c.master_signed_receipt_id!==identity.master_signed_receipt_id||
c.master_revision!==identity.master_revision||typeof c.receiver_receipt_id!=='string'||
!/^[A-Za-z0-9_.:-]{10,120}$/.test(c.receiver_receipt_id)||!fresh684(c.issued_at)||
!await verify684(env.AI_DATA_MASTER_ACK_PUBLIC_KEY,claim684('acceptance',c),evidence.signature))
throw Error('Independent Master acceptance signature, nonce, receipt or freshness mismatch. HOLD.');
return{claim:claim684('acceptance',c),signature:evidence.signature,checked_at:new Date().toISOString()};
}

// Build 684: append-only D1 receipts; no browser-supplied CONNECTED or Master acceptance claim.
async function append684(db,user,id,platform,status,nonce,data){
const result=await db.prepare("INSERT INTO social_post_attempts (social_post_queue_id,platform_key,attempt_status,external_post_id,response_json,attempted_by_user_id,notes) SELECT ?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM social_post_attempts WHERE platform_key=? AND external_post_id=?)")
.bind(id,platform,status,nonce,JSON.stringify(data),user.user_id,['finance_owner_review_695','finance_owner_review_696'].includes(platform)?'Protected original owner review; source repair and certification HOLD.':'Exact external signed financial evidence; independent runtime telemetry separate.',platform,nonce).run();
if(!result?.success||Number(result?.meta?.changes)!==1)throw Error('Duplicate, uncommitted or replayed signed receipt. HOLD.');
const found=rows(await db.prepare("SELECT social_post_attempt_id FROM social_post_attempts WHERE platform_key=? AND external_post_id=? LIMIT 2").bind(platform,nonce).all());
if(found.length!==1)throw Error('Durable unique financial receipt not confirmed. HOLD.');
return Number(found[0].social_post_attempt_id);
}
const pin684=v=>({queue_id:v.queue_id,campaign:v.campaign,source_revision:v.source_revision,
fingerprint_sha256:v.fingerprint_sha256,source_signer_receipt_id:v.signer?.receipt_id});
async function financial684(db,env,id){
const n=Number(id);if(!Number.isSafeInteger(n)||n<1)return{status:'HOLD_SELECT_CAMPAIGN',signer_enrolled:false,master_accepted:false,connection:'HOLD'};
const source=await financial683(db,env,n),base=await finance682(db,env,n);
const data=rows(await db.prepare("SELECT social_post_attempt_id,platform_key,external_post_id,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key IN ('finance_enrollment_684','finance_acceptance_684','finance_continuity_684') ORDER BY social_post_attempt_id DESC LIMIT 121").bind(n).all());
const complete=source.complete&&base.complete&&data.length<=120;
const er=data.find(x=>x.platform_key==='finance_enrollment_684'),e=safeJson(er?.response_json,{}),ec=e.claim||{};
const pinned=pin684(source),enrolled=!!complete&&base.source_owner_accepted&&!base.cases.some(c=>!c.code.startsWith('MASTER_'))&&source.signer?.status==='INDEPENDENT_SIGNER_ADMITTED'&&
same684(ec,pinned)&&ec.signer_id===normalizeText(env?.FINANCIAL_EVIDENCE_SIGNER_ID_683)&&
nonce684(ec.nonce)&&fresh684(ec.issued_at,30*86400000)&&
await verify684(normalizeText(env?.FINANCIAL_EVIDENCE_SIGNER_PUBLIC_KEY_683),claim684('enrollment',ec),e.signature);
const ar=data.find(x=>x.platform_key==='finance_acceptance_684'),a=safeJson(ar?.response_json,{}),ac=a.claim||{};
const accepted=!!enrolled&&source.master_correlated&&same684(ac,pinned)&&
ac.enrollment_receipt_id===Number(er.social_post_attempt_id)&&
ac.master_signed_receipt_id===source.master.receipt_id&&
ac.master_revision===source.master.master_revision&&ac.decision==='accepted'&&
nonce684(ac.request_nonce)&&fresh684(ac.issued_at,1200000)&&fresh684(a.checked_at,1200000)&&
typeof ac.receiver_receipt_id==='string'&&/^[A-Za-z0-9_.:-]{10,120}$/.test(ac.receiver_receipt_id)&&
await verify684(normalizeText(env?.AI_DATA_MASTER_ACK_PUBLIC_KEY),claim684('acceptance',ac),a.signature);
const closures=data.filter(x=>x.platform_key==='finance_continuity_684').slice(0,25).map(x=>{
const c=safeJson(x.response_json,{});
return{case_code:c.case_code,receipt_id:x.social_post_attempt_id,recorded_at:x.attempted_at,
current:!!accepted&&c.fingerprint_sha256===source.fingerprint_sha256&&
c.source_signer_receipt_id===source.signer.receipt_id&&
c.enrollment_receipt_id===Number(er?.social_post_attempt_id)&&
c.master_signed_receipt_id===source.master.receipt_id&&
c.master_acceptance_receipt_id===Number(ar?.social_post_attempt_id)};
});
return{status:!complete?'HOLD_AUDIT_INCOMPLETE':accepted?'INDEPENDENT_MASTER_ACCEPTANCE_VERIFIED':'HOLD_MASTER_RUNTIME_ACCEPTANCE',
campaign:source.campaign,queue_id:n,source_revision:source.source_revision,
fingerprint_sha256:source.fingerprint_sha256,source_signer_receipt_id:source.signer?.receipt_id||null,
signer_id:source.signer?.signer_id||null,signer_nonce:source.signer?.nonce||null,
master_signed_receipt_id:source.master?.receipt_id||null,master_revision:source.master?.master_revision||null,
signer_enrolled:!!enrolled,enrollment_receipt_id:enrolled?Number(er.social_post_attempt_id):null,
master_accepted:!!accepted,master_acceptance_receipt_id:accepted?Number(ar.social_post_attempt_id):null,
receiver_receipt_id:accepted?ac.receiver_receipt_id:null,
receiver_configured:!!endpoint684(env),source_owner_accepted:!!base.source_owner_accepted,
source_blockers:base.cases.filter(c=>!c.code.startsWith('MASTER_')).map(c=>c.code),
closed_cases:closures,connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
profitability_certified:false,publication_performed:false};
}
async function enroll684(db,env,user,p){
const id=Number(p.social_post_queue_id),v=await financial684(db,env,id),nonce=normalizeText(p.nonce),
issued_at=normalizeText(p.issued_at),signature=normalizeText(p.signature);
if(p.owner_reviewed!==true||!v.source_owner_accepted||v.source_blockers?.length||
!v.source_signer_receipt_id||!v.signer_id||!v.source_revision||!nonce684(nonce)||!fresh684(issued_at))
throw Error('Owner-accepted exact source, independent existing signer, nonce and current time required. HOLD.');
if(p.expected_fingerprint_sha256!==v.fingerprint_sha256)throw Error('Source fingerprint changed. Refresh before signer enrollment.');
const claim=claim684('enrollment',{...pin684({queue_id:id,campaign:v.campaign,source_revision:v.source_revision,
fingerprint_sha256:v.fingerprint_sha256,signer:{receipt_id:v.source_signer_receipt_id}}),signer_id:v.signer_id,nonce,issued_at});
if(!await verify684(normalizeText(env?.FINANCIAL_EVIDENCE_SIGNER_PUBLIC_KEY_683),claim,signature))
throw Error('Original independent financial signer did not sign exact runtime enrollment. HOLD.');
const receipt_id=await append684(db,user,id,'finance_enrollment_684','independent_signer_runtime_enrolled_684',nonce,{claim,signature,checked_at:new Date().toISOString()});
return{status:'independent_signer_runtime_enrolled_684',receipt_id,master_accepted:false,publication_performed:false};
}
async function accept684(db,env,user,p){
const id=Number(p.social_post_queue_id),v=await financial684(db,env,id);
if(p.owner_reviewed!==true||!v.signer_enrolled||!v.master_signed_receipt_id||
v.source_blockers?.length||p.expected_fingerprint_sha256!==v.fingerprint_sha256)
throw Error('Fresh independent signer, exact signed Master receipt and owner review required. HOLD.');
const evidence=await lookup684(env,{queue_id:id,campaign:v.campaign,source_revision:v.source_revision,
fingerprint_sha256:v.fingerprint_sha256,source_signer_receipt_id:v.source_signer_receipt_id,
enrollment_receipt_id:v.enrollment_receipt_id,master_signed_receipt_id:v.master_signed_receipt_id,
master_revision:v.master_revision});
const receipt_id=await append684(db,user,id,'finance_acceptance_684','independent_master_runtime_accepted_684',
evidence.claim.request_nonce,evidence);
return{status:'independent_master_runtime_accepted_684',receipt_id,master_accepted:true,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',publication_performed:false};
}
async function continuity684(db,env,user,p){
const id=Number(p.social_post_queue_id),v=await financial684(db,env,id),base=await finance682(db,env,id),
code=normalizeText(p.case_code),note=normalizeText(p.resolution_note);
if(p.owner_reviewed!==true||!v.master_accepted||!v.signer_enrolled||!v.source_owner_accepted||
v.source_blockers?.length||p.expected_fingerprint_sha256!==v.fingerprint_sha256||
!['MASTER_RECEIPT_NOT_CURRENT','MASTER_INDEPENDENT_ADMISSION_UNVERIFIED'].includes(code)||
note.length<20||note.length>400||!base.cases.some(c=>c.code===code))
throw Error('Current independent Master acceptance and exactly reviewed discrepancy required for owner closure. HOLD.');
const old=base.reviews.find(x=>x.case_code===code&&x.current_evidence);
if(!old)throw Error('Original fingerprint-pinned owner discrepancy review missing. HOLD.');
const earlier=v.closed_cases.find(x=>x.case_code===code&&x.current);
if(earlier)throw Error('Current discrepancy already closed; replay refused.');
const nonce='case-'+crypto.randomUUID()+'-'+crypto.randomUUID();
const receipt_id=await append684(db,user,id,'finance_continuity_684','owner_finance_continuity_closed_684',nonce,{
case_code:code,fingerprint_sha256:v.fingerprint_sha256,source_signer_receipt_id:v.source_signer_receipt_id,
enrollment_receipt_id:v.enrollment_receipt_id,master_signed_receipt_id:v.master_signed_receipt_id,
master_acceptance_receipt_id:v.master_acceptance_receipt_id,
prior_owner_review_receipt_id:old.receipt_id,owner_user_id:user.user_id,resolution_note:note,
master_accepted:true,profitability_certified:false});
return{status:'owner_finance_continuity_closed_684',receipt_id,master_accepted:true,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',publication_performed:false};
}


// Build 685 — read-only receipt aging, signed Master revalidation and owner-controlled recovery.
// No background receiver calls, unverified CONNECTED flag, private keys, or financial certification.
export function assess685(v,evidence,now=Date.now()){
const c=evidence?.claim||{},checked=evidence?.checked_at;
const checkedMs=typeof checked==='string'?Date.parse(checked):NaN;
const issuedMs=typeof c.issued_at==='string'?Date.parse(c.issued_at):NaN;
const age=Number.isFinite(checkedMs)?Math.max(0,now-checkedMs):null;
const exact=!!(c&&same684(c,v)&&c.enrollment_receipt_id===v.enrollment_receipt_id&&
c.master_signed_receipt_id===v.master_signed_receipt_id&&c.master_revision===v.master_revision);
const validTime=Number.isFinite(checkedMs)&&Number.isFinite(issuedMs)&&
checkedMs<=now+300000&&issuedMs<=now+300000&&checkedMs>=issuedMs-300000;
let issue='VERIFIED_CURRENT';
if(!v?.queue_id)issue='HOLD_SELECT_CAMPAIGN';
else if(!v.source_owner_accepted||v.source_blockers?.length)issue='HOLD_SOURCE_REVIEW';
else if(!v.signer_enrolled)issue='HOLD_SIGNER_ENROLLMENT';
else if(!v.receiver_configured)issue='HOLD_MASTER_RECEIVER';
else if(!evidence?.signature||!evidence?.claim)issue='HOLD_MISSING_MASTER_RECEIPT';
else if(!exact)issue='HOLD_SOURCE_RECEIPT_DRIFT';
else if(!validTime)issue='HOLD_INVALID_RECEIPT_CLOCK';
else if(age>1200000||now-issuedMs>1200000)issue='HOLD_EXPIRED_MASTER_RECEIPT';
else if(!v.master_accepted)issue='HOLD_SIGNATURE_REVALIDATION';
return{status:issue,master_fresh:issue==='VERIFIED_CURRENT',age_seconds:age===null?null:Math.floor(age/1000),
last_checked_at:Number.isFinite(checkedMs)?new Date(checkedMs).toISOString():null,
expires_at:validTime?new Date(Math.min(checkedMs,issuedMs)+1200000).toISOString():null,
source_match:exact};
}
async function financial685(db,env,id){
const v=await financial684(db,env,id),n=Number(id);
if(!Number.isSafeInteger(n)||n<1)return{...assess685(v,null),connection:'HOLD',exceptions:[]};
const ar=await db.prepare("SELECT social_post_attempt_id,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_acceptance_684' ORDER BY social_post_attempt_id DESC LIMIT 1").bind(n).first();
const evidence=safeJson(ar?.response_json,{}),state=assess685(v,evidence);
const all=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_exception_685' ORDER BY social_post_attempt_id DESC LIMIT 121").bind(n).all());
const seen=new Set(),exceptions=[];
for(const row of all){
const d=safeJson(row.response_json,{});
if(!/^incident-[A-Za-z0-9_-]{16,100}$/.test(d.case_id||'')||seen.has(d.case_id))continue;
seen.add(d.case_id);
exceptions.push({case_id:d.case_id,issue_code:d.issue_code,status:row.attempt_status,
receipt_id:Number(row.social_post_attempt_id),recorded_at:row.attempted_at,
opened_acceptance_receipt_id:Number(d.opened_acceptance_receipt_id||0),
fingerprint_sha256:d.fingerprint_sha256||null});
}
const bounded=all.length<=120;
const current={...state,status:bounded?state.status:'HOLD_EXCEPTION_HISTORY_LIMIT',
master_fresh:bounded&&state.master_fresh,queue_id:n,campaign:v.campaign,
source_revision:v.source_revision,fingerprint_sha256:v.fingerprint_sha256,
signer_enrolled:v.signer_enrolled,receiver_configured:v.receiver_configured,
last_master_receipt_id:Number(ar?.social_post_attempt_id||0),
verified_master_receipt_id:bounded&&state.master_fresh?v.master_acceptance_receipt_id:null,
source_signer_receipt_id:v.source_signer_receipt_id,master_signed_receipt_id:v.master_signed_receipt_id,
open_cases:exceptions.filter(x=>x.status==='owner_exception_opened_685'),
exceptions:exceptions.slice(0,40),history_complete:bounded,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
profitability_certified:false,publication_performed:false};
return{...current,alerts686:prioritizeFinance686(current)};
}
async function revalidate685(db,env,user,p){
const id=Number(p.social_post_queue_id),before=await financial685(db,env,id);
if(!before.history_complete||p.owner_reviewed!==true||!before.signer_enrolled||
p.expected_fingerprint_sha256!==before.fingerprint_sha256)
throw Error('Current independent signer, exact source revision and owner approval required. HOLD.');
const receipt=await accept684(db,env,user,p); // independently signed nonce-bound HTTPS receiver evidence
const after=await financial685(db,env,id);
if(!after.master_fresh||after.verified_master_receipt_id!==receipt.receipt_id)
throw Error('New Master acceptance was not durably and independently reverified. HOLD.');
return{status:'independent_master_revalidated_685',receipt_id:receipt.receipt_id,
expires_at:after.expires_at,open_exceptions:after.open_cases.length,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',publication_performed:false};
}
async function recovery685(db,env,user,p){
const id=Number(p.social_post_queue_id),v=await financial685(db,env,id);
const decision=normalizeText(p.decision),note=normalizeText(p.resolution_note),caseId=normalizeText(p.case_id);
if(p.owner_reviewed!==true||!v.history_complete||!v.queue_id||!v.fingerprint_sha256||
p.expected_fingerprint_sha256!==v.fingerprint_sha256||note.length<20||note.length>400)
throw Error('Owner review, current source fingerprint and substantial recovery note required. HOLD.');
let payload,status;
if(decision==='open'){
if(v.master_fresh||p.issue_code!==v.status||v.open_cases.some(x=>x.issue_code===v.status))
throw Error('No new independently observed issue or an active case already exists. HOLD.');
payload={case_id:'incident-'+crypto.randomUUID(),issue_code:v.status,
fingerprint_sha256:v.fingerprint_sha256,source_revision:v.source_revision,
opened_acceptance_receipt_id:v.last_master_receipt_id,
source_signer_receipt_id:v.source_signer_receipt_id,owner_user_id:user.user_id,
resolution_note:note,master_accepted:false,profitability_certified:false};
status='owner_exception_opened_685';
}else if(decision==='close'){
const original=v.open_cases.find(x=>x.case_id===caseId);
if(!original||!v.master_fresh||!v.verified_master_receipt_id||
v.verified_master_receipt_id<=original.opened_acceptance_receipt_id||
Number(p.expected_master_acceptance_receipt_id)!==v.verified_master_receipt_id)
throw Error('Closure requires an open exception and a newer, current independently signed Master receipt. HOLD.');
payload={case_id:original.case_id,issue_code:original.issue_code,
fingerprint_sha256:v.fingerprint_sha256,source_revision:v.source_revision,
opened_acceptance_receipt_id:original.opened_acceptance_receipt_id,
verified_master_acceptance_receipt_id:v.verified_master_receipt_id,
source_signer_receipt_id:v.source_signer_receipt_id,owner_user_id:user.user_id,
resolution_note:note,master_accepted:true,profitability_certified:false};
status='owner_exception_evidence_closed_685';
}else throw Error('Unsupported owner exception recovery decision.');
const nonce='finance-recovery-'+crypto.randomUUID()+'-'+crypto.randomUUID();
const receipt_id=await append684(db,user,id,'finance_exception_685',status,nonce,payload);
const readback=await financial685(db,env,id);
const recorded=readback.exceptions.find(x=>x.receipt_id===receipt_id&&x.case_id===payload.case_id);
if(!recorded||recorded.status!==status)throw Error('Recovery decision not verified in durable readback. HOLD.');
return{status,receipt_id,case_id:payload.case_id,issue_code:payload.issue_code,
master_accepted:status==='owner_exception_evidence_closed_685'&&readback.master_fresh,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',publication_performed:false};
}

// Build 686: read-only, server-clock receipt alerts and prioritized owner recovery.
// This is a triage projection, NOT a signed receipt or a CONNECTED/financial certification.
export function prioritizeFinance686(v,now=Date.now()){
const status=String(v?.status||'HOLD_UNAVAILABLE');
const drift=status==='HOLD_SOURCE_RECEIPT_DRIFT'||status==='HOLD_SIGNATURE_REVALIDATION';
const critical=['HOLD_SOURCE_RECEIPT_DRIFT','HOLD_INVALID_RECEIPT_CLOCK','HOLD_EXCEPTION_HISTORY_LIMIT'].includes(status);
const expiry=Date.parse(v?.expires_at||''),left=Number.isFinite(expiry)?Math.floor((expiry-now)/1000):null;
const alerts=[];
if(critical)alerts.push({level:'CRITICAL',code:status,action:'Review exact source fingerprint, signer and Master receipt; escalate with an owner evidence note.'});
else if(!v?.master_fresh)alerts.push({level:'HIGH',code:status,action:'Resolve the stated evidence gate before requesting an independent signed Master recheck.'});
else if(left!==null&&left<=300)alerts.push({level:'WARNING',code:'MASTER_RECEIPT_EXPIRING',action:'Request a fresh signed Master recheck before expiry; do not assume automatic renewal.'});
const pending=(Array.isArray(v?.open_cases)?v.open_cases:[]).map(x=>{
const age=Date.parse(x.recorded_at||''),age_minutes=Number.isFinite(age)?Math.max(0,Math.floor((now-age)/60000)):null;
const severity=x.issue_code==='HOLD_SOURCE_RECEIPT_DRIFT'||x.issue_code==='HOLD_INVALID_RECEIPT_CLOCK'?'CRITICAL':'HIGH';
return{case_id:x.case_id,issue_code:x.issue_code,receipt_id:x.receipt_id,
recorded_at:x.recorded_at,age_minutes,priority:severity,action:'OWNER_REVIEW_AND_NEWER_INDEPENDENT_RECEIPT_REQUIRED'};
}).sort((a,b)=>(a.priority==='CRITICAL'?0:1)-(b.priority==='CRITICAL'?0:1)||
(b.age_minutes??-1)-(a.age_minutes??-1)||a.receipt_id-b.receipt_id).slice(0,25);
if(pending.length)alerts.push({level:'HIGH',code:'OPEN_OWNER_EXCEPTIONS',count:pending.length,
action:'Review highest priority cases; close only with newer independently verified signed Master acceptance.'});
const level=alerts.some(x=>x.level==='CRITICAL')?'CRITICAL':
alerts.some(x=>x.level==='HIGH')?'HIGH':alerts.length?'WARNING':'CURRENT';
return{observed_at:new Date(now).toISOString(),level,alerts,source_drift:drift,
seconds_to_expiry:left,open_case_count:pending.length,recovery_queue:pending,
master_accepted_now:!!v?.master_fresh,connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
profitability_certified:false,automated_master_polling:false};
}
async function globalFinanceQueue686(db,now=Date.now()){
// One bounded append-only scan. Other campaigns' Master freshness is never inferred.
const recent=rows(await db.prepare(`SELECT a.social_post_attempt_id,a.social_post_queue_id,
a.attempt_status,a.response_json,a.attempted_at,q.utm_campaign
FROM social_post_attempts a JOIN social_post_queue q
ON q.social_post_queue_id=a.social_post_queue_id
WHERE a.platform_key='finance_exception_685'
ORDER BY a.social_post_attempt_id DESC LIMIT 121`).all());
const seen=new Set(),open=[];
for(const r of recent){
const d=safeJson(r.response_json,{});
if(!/^incident-[A-Za-z0-9_-]{16,100}$/.test(d.case_id||'')||seen.has(d.case_id))continue;
seen.add(d.case_id);
if(r.attempt_status!=='owner_exception_opened_685')continue;
const drift=d.issue_code==='HOLD_SOURCE_RECEIPT_DRIFT'||d.issue_code==='HOLD_INVALID_RECEIPT_CLOCK';
const age=Date.parse(r.attempted_at||'');
open.push({case_id:d.case_id,queue_id:Number(r.social_post_queue_id),
campaign:r.utm_campaign||'Unlabelled campaign',issue_code:d.issue_code,
opened_receipt_id:Number(r.social_post_attempt_id),opened_at:r.attempted_at,
age_minutes:Number.isFinite(age)?Math.max(0,Math.floor((now-age)/60000)):null,
priority:drift?'CRITICAL':'HIGH',evidence_status:'OWNER_RECHECK_REQUIRED',
master_accepted:false});
}
open.sort((a,b)=>(a.priority==='CRITICAL'?0:1)-(b.priority==='CRITICAL'?0:1)||
(b.age_minutes??-1)-(a.age_minutes??-1)||a.opened_receipt_id-b.opened_receipt_id);
return{observed_at:new Date(now).toISOString(),history_complete:recent.length<=120,
status:recent.length<=120?'OWNER_RECOVERY_REVIEW_ONLY':'HOLD_GLOBAL_HISTORY_INCOMPLETE',
total_visible_open:open.length,cases:open.slice(0,30),
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',automated_escalation:false};
}

// Build 687: bounded, read-only owner SLA and historical financial receipt analytics.
// The two-hour target is advisory, not an enforceable SLA. Historical D1 entries are
// NOT independently reverified current Master acceptance; only financial685 can do that.
export function assessFinance687(current,incidentRows,acceptanceRows,now=Date.now(),targetMinutes=120){
const minutes=(value)=>{const t=Date.parse(value||'');return Number.isFinite(t)&&t<=now+300000?
Math.max(0,Math.floor((now-t)/60000)):null;};
const valid=Number.isSafeInteger(Number(current?.queue_id))&&Number(current.queue_id)>0;
const target=Number.isSafeInteger(targetMinutes)&&targetMinutes>=30&&targetMinutes<=1440?targetMinutes:120;
const rawCases=Array.isArray(incidentRows)?incidentRows:[],rawReceipts=Array.isArray(acceptanceRows)?acceptanceRows:[];
const complete=!!current?.history_complete&&rawCases.length<=120&&rawReceipts.length<=80;
const cases=new Map();
for(const r of rawCases.slice().reverse()){
const d=safeJson(r.response_json,{});
if(!/^incident-[A-Za-z0-9_-]{16,100}$/.test(d.case_id||''))continue;
if(!['owner_exception_opened_685','owner_exception_evidence_closed_685'].includes(r.attempt_status))continue;
const old=cases.get(d.case_id)||{case_id:d.case_id};
if(r.attempt_status==='owner_exception_opened_685'){
old.opened_at=r.attempted_at;old.issue_code=d.issue_code;
old.opened_acceptance_receipt_id=Number(d.opened_acceptance_receipt_id||0);
old.fingerprint_sha256=d.fingerprint_sha256||null;old.open_id=Number(r.social_post_attempt_id);
old.status='OPEN';
}else{
old.closed_at=r.attempted_at;old.close_id=Number(r.social_post_attempt_id);
old.closed_fingerprint=d.fingerprint_sha256||null;
old.newer_master_receipt_id=Number(d.verified_master_acceptance_receipt_id||0);
old.closed_opened_acceptance_id=Number(d.opened_acceptance_receipt_id||0);
old.status='OWNER_CLOSURE_RECORDED';
}
cases.set(d.case_id,old);
}
const open=[],closed=[];let invalid=0;
for(const c of cases.values()){
const opening=minutes(c.opened_at),closing=minutes(c.closed_at);
if(!c.opened_at||!Number.isFinite(opening)){invalid++;continue;}
if(c.status==='OPEN'){
const state=opening>=target?'OVERDUE':opening>=Math.floor(target*0.75)?'DUE_SOON':'WITHIN_TARGET';
open.push({case_id:c.case_id,issue_code:c.issue_code,opened_at:c.opened_at,
open_receipt_id:c.open_id,age_minutes:opening,sla_state:state,
due_at:new Date(Date.parse(c.opened_at)+target*60000).toISOString()});
}else if(c.status==='OWNER_CLOSURE_RECORDED'&&Number.isFinite(closing)&&
closing<=opening&&c.closed_fingerprint===c.fingerprint_sha256&&
c.closed_opened_acceptance_id===c.opened_acceptance_receipt_id&&
c.newer_master_receipt_id>c.opened_acceptance_receipt_id){
closed.push({case_id:c.case_id,open_receipt_id:c.open_id,closure_receipt_id:c.close_id,
fingerprint_sha256:c.fingerprint_sha256,issue_code:c.issue_code,
newer_master_receipt_id:c.newer_master_receipt_id,elapsed_minutes:opening-closing,
within_advisory_target:opening-closing<=target,
historical_status:'OWNER_CLOSURE_RECORDED_NOT_CURRENT_MASTER_PROOF'});
}else invalid++;
}
open.sort((a,b)=>(a.sla_state==='OVERDUE'?0:a.sla_state==='DUE_SOON'?1:2)-
(b.sla_state==='OVERDUE'?0:b.sla_state==='DUE_SOON'?1:2)||
b.age_minutes-a.age_minutes);
const receipts=rawReceipts.map(r=>{const d=safeJson(r.response_json,{});
return{receipt_id:Number(r.social_post_attempt_id),
recorded_at:r.attempted_at,issued_at:d.claim?.issued_at||null,
state:Number(r.social_post_attempt_id)===Number(current?.verified_master_receipt_id)&&current.master_fresh?
'CURRENT_INDEPENDENT_SIGNATURE_REVERIFIED':'RECORDED_HISTORY_NOT_CURRENTLY_REVERIFIED'};
});
const last=receipts[0]||null;
return{status:!valid?'HOLD_SELECT_CAMPAIGN':!complete||invalid>0?'HOLD_BOUNDED_HISTORY_INCOMPLETE':'OWNER_REVIEW_ANALYTICS_ONLY',
campaign_queue_id:valid?Number(current.queue_id):null,observed_at:new Date(now).toISOString(),
history_complete:complete&&invalid===0,partial_history:!complete||invalid>0,
advisory_target_minutes:target,advisory_only:true,
open_count:open.length,overdue_count:open.filter(x=>x.sla_state==='OVERDUE').length,
due_soon_count:open.filter(x=>x.sla_state==='DUE_SOON').length,
closed_count:closed.length,closed_within_target_count:closed.filter(x=>x.within_advisory_target).length,
closed_cases:closed.slice(0,25),
mean_recorded_closure_minutes:closed.length?Math.round(closed.reduce((s,x)=>s+x.elapsed_minutes,0)/closed.length):null,
invalid_or_unpaired_history_count:invalid,owner_followups:open.slice(0,25),
renewal:{recorded_receipt_count:receipts.length,recorded_renewal_count:Math.max(0,receipts.length-1),
history_complete:rawReceipts.length<=80,latest_recorded_receipt_id:last?.receipt_id||null,
current_verified_receipt_id:current?.master_fresh?current.verified_master_receipt_id:null,
current_status:current?.master_fresh?'CURRENT_SIGNED_MASTER_EVIDENCE':'HOLD_INDEPENDENT_MASTER_RECHECK',
expires_at:current?.master_fresh?current.expires_at:null,
receipts:receipts.slice(0,8),background_renewal:false},
master_accepted_now:!!current?.master_fresh&&complete&&invalid===0,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
profitability_certified:false,automatic_case_closure:false};
}
async function finance687(db,env,id){
const n=Number(id);
if(!Number.isSafeInteger(n)||n<1)return assessFinance687({queue_id:0,history_complete:false},[],[]);
const current=await financial685(db,env,n);
const incidents=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_exception_685' ORDER BY social_post_attempt_id DESC LIMIT 121").bind(n).all());
const receipts=rows(await db.prepare("SELECT social_post_attempt_id,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_acceptance_684' ORDER BY social_post_attempt_id DESC LIMIT 81").bind(n).all());
return assessFinance687(current,incidents,receipts);
}

// Build 688 — owner-triggered SLA breach escalation, historical Master renewal chain,
// and independent-evidence-gated owner signoff. All historical entries are audit
// observations, never proof of a currently accepted Master receiver or connectivity.
export function assessFinance688(current,sla,rawReceipts,rawReviews,now=Date.now()){
const selected=Number.isSafeInteger(Number(current?.queue_id))&&Number(current.queue_id)>0;
const receipts=Array.isArray(rawReceipts)?rawReceipts:[],reviews=Array.isArray(rawReviews)?rawReviews:[];
const bounded=!!sla?.history_complete&&receipts.length<=80&&reviews.length<=80;
let chainComplete=receipts.length>0&&receipts.length<=80,previousId=Infinity,previousAt=Infinity;
const history=[];
for(const r of receipts){
const id=Number(r.social_post_attempt_id),d=safeJson(r.response_json,{}),claim=d.claim||{};
const recorded=Date.parse(r.attempted_at||''),issued=Date.parse(claim.issued_at||'');
const exact=Number.isSafeInteger(id)&&id>0&&id<previousId&&Number.isFinite(recorded)&&
recorded<=previousAt&&recorded<=now+300000&&Number.isFinite(issued)&&issued<=now+300000&&
issued<=recorded+300000&&d.signature&&
claim.queue_id===Number(current.queue_id)&&
claim.fingerprint_sha256===current.fingerprint_sha256&&
claim.source_revision===current.source_revision&&
claim.source_signer_receipt_id===current.source_signer_receipt_id&&
typeof claim.receiver_receipt_id==='string'&&claim.receiver_receipt_id.length>=10;
if(!exact)chainComplete=false;
history.push({receipt_id:id,recorded_at:r.attempted_at,issued_at:claim.issued_at||null,
lineage_pin_matches:!!exact,currently_reverified:!!current.master_fresh&&
id===Number(current.verified_master_receipt_id)});
previousId=id;previousAt=recorded;
}
const open=Array.isArray(sla?.owner_followups)?sla.owner_followups:[],
closed=Array.isArray(sla?.closed_cases)?sla.closed_cases:[],
breaches=open.filter(x=>x.sla_state==='OVERDUE').map(x=>({...x,
severity:['HOLD_SOURCE_RECEIPT_DRIFT','HOLD_INVALID_RECEIPT_CLOCK'].includes(x.issue_code)?'CRITICAL':'HIGH',
action:'OWNER_BREACH_ESCALATION_REVIEW_REQUIRED'}));
const due=open.filter(x=>x.sla_state==='DUE_SOON');
const validCases=new Map([...open.map(x=>['escalate_breach|'+x.case_id,x.open_receipt_id]),
...closed.map(x=>['signoff_closure|'+x.case_id,x.closure_receipt_id])]);
let badReviews=0;const seen=new Set(),signoffs=[];
for(const r of reviews){
const d=safeJson(r.response_json,{}),key=d.decision+'|'+d.case_id,
id=Number(r.social_post_attempt_id);
const matched=Number.isSafeInteger(id)&&id>0&&
['owner_sla_breach_escalated_688','owner_recovery_signoff_recorded_688'].includes(r.attempt_status)&&
((d.decision==='escalate_breach'&&r.attempt_status==='owner_sla_breach_escalated_688')||
(d.decision==='signoff_closure'&&r.attempt_status==='owner_recovery_signoff_recorded_688'))&&
validCases.get(key)===Number(d.evidence_receipt_id)&&
d.fingerprint_sha256===current.fingerprint_sha256&&d.source_revision===current.source_revision&&
(d.decision!=='signoff_closure'||Number(d.independent_master_receipt_id)===
Number(closed.find(x=>x.case_id===d.case_id)?.newer_master_receipt_id))&&
d.owner_user_id&&d.owner_reviewed===true&&typeof d.resolution_note==='string'&&
d.resolution_note.length>=20&&d.resolution_note.length<=400&&
!seen.has(key)&&Number.isFinite(Date.parse(r.attempted_at||''));
if(!matched){badReviews++;continue;}
seen.add(key);
signoffs.push({decision:d.decision,case_id:d.case_id,receipt_id:id,
evidence_receipt_id:Number(d.evidence_receipt_id),recorded_at:r.attempted_at,
source_revision:d.source_revision,owner_user_id:Number(d.owner_user_id),
resolution_note:d.resolution_note,
state:'OWNER_REVIEW_RECORDED_NOT_EXTERNAL_MASTER_ACCEPTANCE'});
}
const historyComplete=selected&&bounded&&badReviews===0;
return{status:!selected?'HOLD_SELECT_CAMPAIGN':!bounded||badReviews?
'HOLD_REVIEW_HISTORY_INCOMPLETE':!chainComplete?'HOLD_RECEIPT_RENEWAL_LINEAGE':
breaches.length?'OWNER_SLA_BREACH_REVIEW_REQUIRED':'OWNER_SIGNOFF_REVIEW_ONLY',
observed_at:new Date(now).toISOString(),campaign_queue_id:selected?Number(current.queue_id):null,
advisory_target_minutes:sla?.advisory_target_minutes||120,
history_complete:!!historyComplete,breach_count:breaches.length,due_soon_count:due.length,
unreviewed_breach_count:breaches.filter(b=>!signoffs.some(s=>s.decision==='escalate_breach'&&s.case_id===b.case_id)).length,
breaches:breaches.slice(0,25).map(b=>({...b,
owner_reviewed:signoffs.some(s=>s.decision==='escalate_breach'&&s.case_id===b.case_id)})),
due_soon:due.slice(0,25),closed_case_count:closed.length,
signoff_count:signoffs.filter(s=>s.decision==='signoff_closure').length,
pending_closure_signoff_count:closed.filter(c=>!signoffs.some(s=>s.decision==='signoff_closure'&&s.case_id===c.case_id)).length,
closed_cases:closed.slice(0,25).map(c=>({...c,
owner_signed_off:signoffs.some(s=>s.decision==='signoff_closure'&&s.case_id===c.case_id)})),
owner_reviews:signoffs.slice(0,30),invalid_or_stale_review_count:badReviews,
renewal_audit:{lineage_complete:bounded&&chainComplete,record_count:history.length,
historical_renewal_count:Math.max(0,history.length-1),
latest_history_receipt_id:history[0]?.receipt_id||null,
current_independently_reverified_receipt_id:current?.master_fresh&&chainComplete?
Number(current.verified_master_receipt_id):null,
records:history.slice(0,12),bounded_receipt_ids:history.map(x=>x.receipt_id),historical_signature_reverification:false,
automatic_renewal:false},
master_accepted_now:!!current?.master_fresh&&historyComplete&&chainComplete,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
financial_certified:false,auto_escalation:false,auto_signoff:false,publication_performed:false};
}
async function finance688(db,env,id){
const n=Number(id);
if(!Number.isSafeInteger(n)||n<1)return assessFinance688({queue_id:0},
{history_complete:false},[],[]);
const current=await financial685(db,env,n);
const incidentRows=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_exception_685' ORDER BY social_post_attempt_id DESC LIMIT 121").bind(n).all());
const receiptRows=rows(await db.prepare("SELECT social_post_attempt_id,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_acceptance_684' ORDER BY social_post_attempt_id DESC LIMIT 81").bind(n).all());
const reviewRows=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_review_688' ORDER BY social_post_attempt_id DESC LIMIT 81").bind(n).all());
return assessFinance688(current,assessFinance687(current,incidentRows,receiptRows),receiptRows,reviewRows);
}
async function ownerReview688(db,env,user,p){
const n=Number(p.social_post_queue_id),v=await financial685(db,env,n),
report=await finance688(db,env,n);
const decision=normalizeText(p.decision),caseId=normalizeText(p.case_id),
note=normalizeText(p.resolution_note);
if(!v.queue_id||!v.history_complete||!report.history_complete||
p.owner_reviewed!==true||p.expected_fingerprint_sha256!==v.fingerprint_sha256||
!v.fingerprint_sha256||note.length<20||note.length>400)
throw Error('Exact current fingerprint, bounded owner history and substantial owner review required. HOLD.');
let status,target;
if(decision==='escalate_breach'){
target=report.breaches.find(x=>x.case_id===caseId&&!x.owner_reviewed&&
Number(p.expected_evidence_receipt_id)===x.open_receipt_id);
status='owner_sla_breach_escalated_688';
}else if(decision==='signoff_closure'){
target=report.closed_cases.find(x=>x.case_id===caseId&&!x.owner_signed_off&&
Number(p.expected_evidence_receipt_id)===x.closure_receipt_id&&
x.fingerprint_sha256===v.fingerprint_sha256&&v.master_fresh&&
v.verified_master_receipt_id===x.newer_master_receipt_id);
status='owner_recovery_signoff_recorded_688';
}else throw Error('Unsupported Build 688 owner decision. HOLD.');
if(!target)throw Error('Case is stale, already reviewed, or lacks exact signed Master closure evidence. HOLD.');
const receipt=Number(p.expected_evidence_receipt_id);
const payload={decision,case_id:caseId,evidence_receipt_id:receipt,
fingerprint_sha256:v.fingerprint_sha256,source_revision:v.source_revision,
owner_user_id:user.user_id,owner_reviewed:true,resolution_note:note,
independent_master_receipt_id:decision==='signoff_closure'?v.verified_master_receipt_id:null,
master_accepted:decision==='signoff_closure'&&v.master_fresh,
financial_certified:false,connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
const key='finance688-'+decision+'-'+caseId+'-'+receipt;
const receipt_id=await append684(db,user,n,'finance_owner_review_688',status,key,payload);
const later=await finance688(db,env,n);
if(!later.owner_reviews.some(r=>r.receipt_id===receipt_id&&r.case_id===caseId&&r.decision===decision))
throw Error('Owner audit receipt not confirmed by durable exact-case readback. HOLD.');
return{status,receipt_id,case_id:caseId,source_evidence_receipt_id:receipt,
master_accepted_now:later.master_accepted_now,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
financial_certified:false,publication_performed:false};
}

// Build 689: replay the owner audit ledger without replaying external financial actions.
// A historical D1 signature cannot establish current Master acceptance; only the
// current exact-source Build 685/688 independently verified receiver proof can do that.
export function assessFinance689(current,report,reviewRows,auditRows,now=Date.now()){
const selected=Number.isSafeInteger(Number(current?.queue_id))&&Number(current.queue_id)>0;
const reviews=Array.isArray(reviewRows)?reviewRows:[],audits=Array.isArray(auditRows)?auditRows:[];
const bounded=!!report?.history_complete&&reviews.length<=30&&audits.length<=50;
const masterNow=!!current?.master_fresh&&!!report?.master_accepted_now&&
!!report?.renewal_audit?.lineage_complete&&
Number(report?.renewal_audit?.current_independently_reverified_receipt_id)===
Number(current?.verified_master_receipt_id)&&Number(current?.verified_master_receipt_id)>0;
const byReceipt=new Map((report?.owner_reviews||[]).map(x=>[Number(x.receipt_id),x]));
let invalid=0,previous=Infinity,previousTime=Infinity;
const replay=[];
for(const row of reviews){
const id=Number(row.social_post_attempt_id),d=safeJson(row.response_json,{}),
at=Date.parse(row.attempted_at||''),matching=byReceipt.get(id);
const valid=Number.isSafeInteger(id)&&id>0&&id<previous&&
Number.isFinite(at)&&at<=now+300000&&at<=previousTime&&
!!matching&&matching.case_id===d.case_id&&matching.decision===d.decision&&
matching.evidence_receipt_id===Number(d.evidence_receipt_id)&&
matching.source_revision===d.source_revision&&
matching.owner_user_id===Number(d.owner_user_id)&&
d.fingerprint_sha256===current?.fingerprint_sha256&&
d.source_revision===current?.source_revision&&
d.owner_reviewed===true&&
((d.decision==='escalate_breach'&&row.attempt_status==='owner_sla_breach_escalated_688')||
(d.decision==='signoff_closure'&&row.attempt_status==='owner_recovery_signoff_recorded_688'));
if(!valid)invalid++;
replay.push({receipt_id:id,decision:d.decision||null,case_id:d.case_id||null,
evidence_receipt_id:Number(d.evidence_receipt_id||0),
recorded_at:row.attempted_at,owner_user_id:Number(d.owner_user_id||0),
replay_state:valid?'HISTORICAL_OWNER_ACTION_REPLAY_MATCH':'HOLD_OWNER_ACTION_REPLAY_DRIFT'});
previous=id;previousTime=at;
}
if(byReceipt.size!==reviews.length)invalid++;
const driftCases=(report?.closed_cases||[]).filter(x=>x.owner_signed_off&&
['HOLD_SOURCE_RECEIPT_DRIFT','HOLD_INVALID_RECEIPT_CLOCK','HOLD_SIGNATURE_REVALIDATION',
'HOLD_EXPIRED_MASTER_RECEIPT'].includes(x.issue_code)&&
x.fingerprint_sha256===current?.fingerprint_sha256&&
Number(x.newer_master_receipt_id)===Number(current?.verified_master_receipt_id));
const refs=new Map(replay.filter(x=>x.replay_state==='HISTORICAL_OWNER_ACTION_REPLAY_MATCH')
.map(x=>[x.receipt_id,x]));
const signedOffCases=(report?.closed_cases||[]).filter(x=>x.owner_signed_off&&
Number(x.newer_master_receipt_id)===Number(current?.verified_master_receipt_id));
const caseFor=(decision,caseId,masterReceipt)=>{
if(decision==='replay_escalation')return (report?.breaches||[]).find(x=>x.case_id===caseId&&x.owner_reviewed);
const historical=(report?.closed_cases||[]).find(x=>x.case_id===caseId&&x.owner_signed_off&&
Number(x.newer_master_receipt_id)===Number(masterReceipt));
if(decision==='resolve_renewal_drift')return historical&&
['HOLD_SOURCE_RECEIPT_DRIFT','HOLD_INVALID_RECEIPT_CLOCK','HOLD_SIGNATURE_REVALIDATION',
'HOLD_EXPIRED_MASTER_RECEIPT'].includes(historical.issue_code)?historical:null;
if(decision==='accept_owner_audit')return historical;
return null;
};
const accepted=[],seen=new Set();
for(const row of audits){
const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
at=Date.parse(row.attempted_at||''),source=refs.get(Number(d.reference_receipt_id)),
matchCase=caseFor(d.decision,d.case_id,d.current_master_receipt_id),
expectedDecision=({replay_escalation:'owner_escalation_replay_689',
resolve_renewal_drift:'owner_master_renewal_drift_resolved_689',
accept_owner_audit:'owner_audit_acceptance_689'})[d.decision],
token=d.decision+'|'+d.case_id+'|'+d.reference_receipt_id;
const valid=Number.isSafeInteger(id)&&id>0&&
Number.isFinite(at)&&at<=now+300000&&row.attempt_status===expectedDecision&&
!!source&&id>Number(d.reference_receipt_id)&&at>=Date.parse(source.recorded_at||'')&&
source.case_id===d.case_id&&
source.decision===(d.decision==='replay_escalation'?'escalate_breach':'signoff_closure')&&
!!matchCase&&
d.fingerprint_sha256===current?.fingerprint_sha256&&
d.source_revision===current?.source_revision&&
(report?.renewal_audit?.bounded_receipt_ids||[]).includes(Number(d.current_master_receipt_id))&&
d.owner_reviewed===true&&Number.isSafeInteger(Number(d.owner_user_id))&&
Number(d.owner_user_id)>0&&typeof d.resolution_note==='string'&&
d.resolution_note.length>=20&&d.resolution_note.length<=400&&!seen.has(token);
if(!valid){invalid++;continue;}
seen.add(token);
accepted.push({receipt_id:id,decision:d.decision,case_id:d.case_id,
reference_receipt_id:Number(d.reference_receipt_id),recorded_at:row.attempted_at,
state:'OWNER_AUDIT_DECISION_RECORDED_NOT_EXTERNAL_MASTER_CERTIFICATION'});
}
const complete=selected&&bounded&&invalid===0;
const resolveCandidates=driftCases.map(c=>({...c,
reference_receipt_id:replay.find(x=>x.case_id===c.case_id&&x.decision==='signoff_closure')?.receipt_id||null,
owner_resolution_recorded:accepted.some(x=>x.decision==='resolve_renewal_drift'&&x.case_id===c.case_id)}));
const auditCandidates=signedOffCases.map(c=>({...c,
reference_receipt_id:replay.find(x=>x.case_id===c.case_id&&x.decision==='signoff_closure')?.receipt_id||null,
owner_audit_accepted:accepted.some(x=>x.decision==='accept_owner_audit'&&x.case_id===c.case_id)}));
return{status:!selected?'HOLD_SELECT_CAMPAIGN':!bounded?'HOLD_REPLAY_WINDOW_INCOMPLETE':
invalid?'HOLD_REPLAY_EVIDENCE_MISMATCH':!masterNow?'HOLD_MASTER_RENEWAL_REVALIDATION':
'OWNER_REPLAY_READY_FOR_REVIEW',
campaign_queue_id:selected?Number(current.queue_id):null,observed_at:new Date(now).toISOString(),
history_complete:!!complete,exact_replay_count:replay.filter(x=>x.replay_state==='HISTORICAL_OWNER_ACTION_REPLAY_MATCH').length,
invalid_replay_count:invalid,owner_action_history:replay.slice(0,30),
renewal:{status:masterNow?'CURRENT_EXACT_MASTER_RECEIPT_REVERIFIED':'HOLD_RENEWAL_DRIFT_OR_EXPIRY',
latest_recorded_receipt_id:report?.renewal_audit?.latest_history_receipt_id||null,
current_reverified_receipt_id:masterNow?current.verified_master_receipt_id:null,
historical_lineage_complete:!!report?.renewal_audit?.lineage_complete,
historical_signatures_reverified:false,auto_master_renewal:false,
source_drift:current?.status==='HOLD_SOURCE_RECEIPT_DRIFT'||!report?.renewal_audit?.lineage_complete},
drift_resolution_candidates:resolveCandidates.slice(0,25),
audit_acceptance_candidates:auditCandidates.slice(0,25),
owner_audit_receipts:accepted.slice(0,30),
owner_audit_receipt_count:accepted.length,
master_accepted_now:masterNow&&complete,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
profitability_certified:false,external_replay_performed:false,
auto_drift_resolution:false,auto_owner_acceptance:false};
}
async function finance689(db,env,id){
const n=Number(id);
if(!Number.isSafeInteger(n)||n<1)
return assessFinance689({queue_id:0},{history_complete:false},[],[]);
const current=await financial685(db,env,n),report=await finance688(db,env,n);
const reviews=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_review_688' ORDER BY social_post_attempt_id DESC LIMIT 31").bind(n).all());
const audits=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_audit_689' ORDER BY social_post_attempt_id DESC LIMIT 51").bind(n).all());
return assessFinance689(current,report,reviews,audits);
}
async function ownerAudit689(db,env,user,p){
const n=Number(p.social_post_queue_id),v=await financial685(db,env,n),
report=await finance689(db,env,n),
decision=normalizeText(p.decision),caseId=normalizeText(p.case_id),
note=normalizeText(p.resolution_note),id=Number(p.reference_receipt_id);
if(!v.queue_id||!report.history_complete||!report.master_accepted_now||
report.status!=='OWNER_REPLAY_READY_FOR_REVIEW'||p.owner_reviewed!==true||
p.expected_fingerprint_sha256!==v.fingerprint_sha256||
Number(p.expected_master_receipt_id)!==v.verified_master_receipt_id||
!v.fingerprint_sha256||note.length<20||note.length>400)
throw Error('Exact independently reverified current Master, source and complete replay audit required. HOLD.');
const source=report.owner_action_history.find(x=>x.receipt_id===id&&x.case_id===caseId&&
x.replay_state==='HISTORICAL_OWNER_ACTION_REPLAY_MATCH');
let candidate=null,status='';
if(decision==='replay_escalation'&&source?.decision==='escalate_breach'&&
report.renewal.historical_lineage_complete){
candidate=source;status='owner_escalation_replay_689';
}else if(decision==='resolve_renewal_drift'&&source?.decision==='signoff_closure'){
candidate=report.drift_resolution_candidates.find(x=>x.case_id===caseId&&
x.reference_receipt_id===id&&!x.owner_resolution_recorded);
status='owner_master_renewal_drift_resolved_689';
}else if(decision==='accept_owner_audit'&&source?.decision==='signoff_closure'){
candidate=report.audit_acceptance_candidates.find(x=>x.case_id===caseId&&
x.reference_receipt_id===id&&!x.owner_audit_accepted);
status='owner_audit_acceptance_689';
}
if(!candidate||report.owner_audit_receipts.some(x=>x.decision===decision&&
x.reference_receipt_id===id))
throw Error('Owner replay is stale, duplicated, unpaired or has no current signed Master. HOLD.');
const payload={decision,case_id:caseId,reference_receipt_id:id,
fingerprint_sha256:v.fingerprint_sha256,source_revision:v.source_revision,
current_master_receipt_id:v.verified_master_receipt_id,
owner_user_id:user.user_id,owner_reviewed:true,resolution_note:note,
external_replay_performed:false,master_accepted:v.master_fresh,
financial_certified:false};
const nonce='finance689-'+decision+'-'+id+'-'+v.verified_master_receipt_id;
const receipt_id=await append684(db,user,n,'finance_owner_audit_689',status,nonce,payload);
const refreshed=await finance689(db,env,n);
if(!refreshed.owner_audit_receipts.some(x=>x.receipt_id===receipt_id&&
x.reference_receipt_id===id&&x.decision===decision))
throw Error('Durable owner replay readback missing or inconsistent. HOLD.');
return{status,receipt_id,reference_receipt_id:id,case_id:caseId,
master_accepted_now:refreshed.master_accepted_now,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
financial_certified:false,external_replay_performed:false};
}

// Build 690 — bounded sampled renewal continuity, replay exception owner disposition,
// and independently reverified owner audit closure reconciliation. No external replay.
export function assessFinance690(current,replay,ownerRows,receiptRows,now=Date.now()){
const n=Number(current?.queue_id),selected=Number.isSafeInteger(n)&&n>0;
const rows690=Array.isArray(ownerRows)?ownerRows:[],receipts=Array.isArray(receiptRows)?receiptRows:[];
const bounded=rows690.length<=60&&receipts.length<=80&&!!current?.history_complete;
const expires=Date.parse(current?.expires_at||''),seconds=Number.isFinite(expires)?
Math.floor((expires-now)/1000):null;
const verifiedNow=!!current?.master_fresh&&!!replay?.master_accepted_now&&
Number.isFinite(expires)&&expires>now&&
Number(replay?.renewal?.current_reverified_receipt_id)===Number(current?.verified_master_receipt_id)&&
Number(current?.verified_master_receipt_id)>0;
const monitor=verifiedNow?(seconds<=300?'RENEWAL_DUE_SOON':'VERIFIED_CURRENT_ON_REFRESH'):
'HOLD_INDEPENDENT_RENEWAL_RECHECK';
const replayHistory=Array.isArray(replay?.owner_action_history)?replay.owner_action_history:[],
replayed=Array.isArray(replay?.owner_audit_receipts)?replay.owner_audit_receipts:[];
const exceptions=replayHistory.filter(x=>x.replay_state==='HOLD_OWNER_ACTION_REPLAY_DRIFT')
.map(x=>({case_id:x.case_id,reference_receipt_id:Number(x.receipt_id),
issue_code:'HOLD_OWNER_ACTION_REPLAY_DRIFT',recorded_at:x.recorded_at||null,
disposition:'REQUIRES_EXACT_OWNER_INVESTIGATION'}));
const totalBad=Number(replay?.invalid_replay_count||0);
if(totalBad>exceptions.length)exceptions.push({case_id:null,reference_receipt_id:null,
issue_code:'HOLD_UNPAIRED_OWNER_AUDIT_OR_HISTORY',recorded_at:null,
disposition:'MISSING_EXACT_EVIDENCE_REQUIRES_SOURCE_RECOVERY'});
let historicalIntegrity=receipts.length>0&&receipts.length<=80,
prevId=Infinity,prevTime=Infinity;
const renewalHistory=[];
for(const r of receipts){
const id=Number(r.social_post_attempt_id),d=safeJson(r.response_json,{}),c=d.claim||{},
time=Date.parse(r.attempted_at||''),issued=Date.parse(c.issued_at||'');
const valid=Number.isSafeInteger(id)&&id>0&&id<prevId&&
Number.isFinite(time)&&time<=now+300000&&time<=prevTime&&
Number.isFinite(issued)&&issued<=now+300000&&issued<=time+300000&&
c.queue_id===n&&c.fingerprint_sha256===current?.fingerprint_sha256&&
c.source_revision===current?.source_revision&&
c.source_signer_receipt_id===current?.source_signer_receipt_id&&
typeof c.receiver_receipt_id==='string'&&c.receiver_receipt_id.length>=10&&!!d.signature;
if(!valid)historicalIntegrity=false;
renewalHistory.push({receipt_id:id,recorded_at:r.attempted_at,
observed_source_pin_match:!!valid,previous_interval_minutes:Number.isFinite(prevTime)&&
Number.isFinite(time)?Math.max(0,Math.floor((prevTime-time)/60000)):null,
historical_only:id!==Number(current?.verified_master_receipt_id)});
prevId=id;prevTime=time;
}
const currentReceiptPresent=renewalHistory.some(x=>x.receipt_id===
Number(current?.verified_master_receipt_id)&&x.observed_source_pin_match);
const closureSource=new Map(replayed.filter(x=>x.decision==='accept_owner_audit')
.map(x=>[Number(x.receipt_id),x]));
const exceptionByReceipt=new Map(exceptions.filter(x=>x.reference_receipt_id)
.map(x=>[x.reference_receipt_id,x]));
const receiptSet=new Set(renewalHistory.map(x=>x.receipt_id));
let invalidOwner=0,previousOwnerId=Infinity,previousOwnerTime=Infinity;
const seen=new Set(),ownerHistory=[];
for(const r of rows690){
const id=Number(r.social_post_attempt_id),d=safeJson(r.response_json,{}),
time=Date.parse(r.attempted_at||''),ref=Number(d.reference_receipt_id),
prior=closureSource.get(ref),exception=exceptionByReceipt.get(ref);
const type=d.decision==='review_replay_exception'?'owner_replay_exception_reviewed_690':
d.decision==='reconcile_owner_closure'?'owner_financial_closure_reconciled_690':null;
const key=d.decision+'|'+ref;
const related=d.decision==='review_replay_exception'?
!!exception&&exception.case_id===d.case_id&&d.issue_code===exception.issue_code:
!!prior&&prior.case_id===d.case_id&&
receiptSet.has(Number(d.master_receipt_id))&&
Number(d.master_receipt_id)>0;
const valid=Number.isSafeInteger(id)&&id>0&&id>ref&&id<previousOwnerId&&
Number.isFinite(time)&&time<=now+300000&&time<=previousOwnerTime&&
type===r.attempt_status&&related&&
d.fingerprint_sha256===current?.fingerprint_sha256&&
d.source_revision===current?.source_revision&&
Number.isSafeInteger(Number(d.owner_user_id))&&Number(d.owner_user_id)>0&&
d.owner_reviewed===true&&typeof d.resolution_note==='string'&&
d.resolution_note.length>=20&&d.resolution_note.length<=400&&
!seen.has(key);
if(valid)seen.add(key);else invalidOwner++;
ownerHistory.push({receipt_id:id,decision:d.decision||null,case_id:d.case_id||null,
reference_receipt_id:ref,recorded_at:r.attempted_at,
state:valid?'OWNER_REVIEW_RECORDED_NOT_INDEPENDENT_CERTIFICATION':'HOLD_INVALID_OWNER_HISTORY'});
previousOwnerId=id;previousOwnerTime=time;
}
const reviewedExceptions=new Set(ownerHistory.filter(x=>x.state!=='HOLD_INVALID_OWNER_HISTORY'&&
x.decision==='review_replay_exception').map(x=>x.reference_receipt_id));
const reconciled=new Set(ownerHistory.filter(x=>x.state!=='HOLD_INVALID_OWNER_HISTORY'&&
x.decision==='reconcile_owner_closure').map(x=>x.reference_receipt_id));
const closureCandidates=[...closureSource.values()].map(x=>({...x,
owner_reconciled:reconciled.has(Number(x.receipt_id)),
status:verifiedNow&&historicalIntegrity&&currentReceiptPresent&&
!!replay?.history_complete?'CURRENT_REVIEW_ELIGIBLE':'HOLD_CURRENT_MASTER_OR_REPLAY_EVIDENCE'}));
const ownerHistoryComplete=selected&&bounded&&invalidOwner===0;
const ledgerComplete=ownerHistoryComplete&&historicalIntegrity&&currentReceiptPresent;
return{status:!selected?'HOLD_SELECT_CAMPAIGN':!bounded||invalidOwner?
'HOLD_OWNER_EVIDENCE_HISTORY':!historicalIntegrity?'HOLD_HISTORICAL_RENEWAL_LINEAGE':
!replay?.history_complete||totalBad?'HOLD_REPLAY_EXCEPTIONS':
!verifiedNow||!currentReceiptPresent?'HOLD_MASTER_RENEWAL_RECHECK':
'OWNER_CLOSURE_RECONCILIATION_REVIEW_ONLY',
observed_at:new Date(now).toISOString(),campaign_queue_id:selected?n:null,
history_complete:ownerHistoryComplete,ledger_complete:ledgerComplete,
replay_exception_count:exceptions.length,
unreviewed_replay_exception_count:exceptions.filter(x=>x.reference_receipt_id&&
!reviewedExceptions.has(x.reference_receipt_id)).length,
replay_exceptions:exceptions.map(x=>({...x,owner_reviewed:
x.reference_receipt_id?reviewedExceptions.has(x.reference_receipt_id):false})).slice(0,30),
renewal:{status:monitor,expires_at:Number.isFinite(expires)?new Date(expires).toISOString():null,
seconds_to_expiry:seconds,observed_at:new Date(now).toISOString(),
current_independently_reverified_receipt_id:verifiedNow?current.verified_master_receipt_id:null,
current_receipt_in_bounded_history:currentReceiptPresent,
historical_chain_pin_matches:historicalIntegrity,
record_count:renewalHistory.length,
source_pinned_receipt_ids:renewalHistory.filter(x=>x.observed_source_pin_match).map(x=>x.receipt_id),
renewal_gap_evidence:renewalHistory.flatMap((x,i)=>x.previous_interval_minutes>20&&i>0?
[{older_receipt_id:x.receipt_id,newer_receipt_id:renewalHistory[i-1].receipt_id,
older_recorded_at:x.recorded_at,newer_recorded_at:renewalHistory[i-1].recorded_at,
gap_minutes:x.previous_interval_minutes,source_pins_match:!!x.observed_source_pin_match&&
!!renewalHistory[i-1].observed_source_pin_match}]:[]),
historical_gap_over_20_minutes_count:renewalHistory.filter(x=>
x.previous_interval_minutes!==null&&x.previous_interval_minutes>20).length,
recent_history:renewalHistory.slice(0,12),background_polling:false,
historical_signatures_reverified:false},
closure_candidates:closureCandidates.slice(0,30),
eligible_closure_count:verifiedNow&&ledgerComplete&&!!replay?.history_complete?
closureCandidates.filter(x=>!x.owner_reconciled).length:0,
reconciled_closure_count:reconciled.size,owner_history:ownerHistory.slice(0,40),
invalid_owner_history_count:invalidOwner,
master_accepted_now:verifiedNow&&ledgerComplete&&!!replay?.history_complete&&totalBad===0,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
financial_certified:false,auto_exception_resolution:false,auto_closure:false,
external_replay_performed:false};
}
async function finance690(db,env,id){
const n=Number(id);
if(!Number.isSafeInteger(n)||n<1)
return assessFinance690({queue_id:0},{history_complete:false},[],[]);
const current=await financial685(db,env,n),replay=await finance689(db,env,n);
const reviews=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_reconcile_690' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
const renewals=rows(await db.prepare("SELECT social_post_attempt_id,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_acceptance_684' ORDER BY social_post_attempt_id DESC LIMIT 81").bind(n).all());
return assessFinance690(current,replay,reviews,renewals);
}
async function ownerReconcile690(db,env,user,p){
const n=Number(p.social_post_queue_id),v=await financial685(db,env,n),
state=await finance690(db,env,n),
decision=normalizeText(p.decision),caseId=normalizeText(p.case_id),
note=normalizeText(p.resolution_note),ref=Number(p.reference_receipt_id);
if(!v.queue_id||!v.history_complete||!state.history_complete||
p.owner_reviewed!==true||
p.expected_fingerprint_sha256!==v.fingerprint_sha256||
p.expected_source_revision!==v.source_revision||
!v.fingerprint_sha256||note.length<20||note.length>400||
!Number.isSafeInteger(ref)||ref<=0)
throw Error('Complete bounded audit, exact source and explicit owner review required. HOLD.');
let target=null,status='',issue_code=null;
if(decision==='review_replay_exception'){
target=state.replay_exceptions.find(x=>x.case_id===caseId&&
x.reference_receipt_id===ref&&!x.owner_reviewed);
issue_code=target?.issue_code||null;
status='owner_replay_exception_reviewed_690';
}else if(decision==='reconcile_owner_closure'){
if(!state.ledger_complete||!state.master_accepted_now||state.status!=='OWNER_CLOSURE_RECONCILIATION_REVIEW_ONLY'||
Number(p.expected_master_receipt_id)!==v.verified_master_receipt_id)
throw Error('Current fresh independently signed Master receipt and unbroken replay lineage required. HOLD.');
target=state.closure_candidates.find(x=>x.case_id===caseId&&
Number(x.receipt_id)===ref&&!x.owner_reconciled&&x.status==='CURRENT_REVIEW_ELIGIBLE');
status='owner_financial_closure_reconciled_690';
}else throw Error('Unsupported owner reconciliation decision. HOLD.');
if(!target)throw Error('No matching unreviewed exact receipt; duplicate or stale evidence. HOLD.');
const payload={decision,case_id:caseId,reference_receipt_id:ref,
issue_code,fingerprint_sha256:v.fingerprint_sha256,source_revision:v.source_revision,
master_receipt_id:decision==='reconcile_owner_closure'?v.verified_master_receipt_id:null,
owner_user_id:user.user_id,owner_reviewed:true,resolution_note:note,
independent_master_connected:false,financial_certified:false,
historical_replay_repaired:false,auto_closure:false};
const nonce='finance690-'+decision+'-'+ref;
const receipt_id=await append684(db,user,n,'finance_owner_reconcile_690',status,nonce,payload);
const after=await finance690(db,env,n);
if(!after.owner_history.some(x=>x.receipt_id===receipt_id&&x.decision===decision&&
x.reference_receipt_id===ref&&x.state==='OWNER_REVIEW_RECORDED_NOT_INDEPENDENT_CERTIFICATION'))
throw Error('Exact owner reconciliation not confirmed by durable readback. HOLD.');
return{status,receipt_id,reference_receipt_id:ref,case_id:caseId,
master_accepted_now:after.master_accepted_now,
exception_evidence_repaired:false,financial_certified:false,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}

// Build 691: GET-only server-clock exception aging and bounded Master renewal gap
// inspection. Owner actions are append-only acknowledgments, NOT evidence repair.
export function assessFinance691(current,prior,ownerRows,now=Date.now()){
const selected=Number.isSafeInteger(Number(current?.queue_id))&&Number(current.queue_id)>0;
const rows691=Array.isArray(ownerRows)?ownerRows:[],
bounded=!!prior?.history_complete&&rows691.length<=60;
const dated=value=>{const t=Date.parse(value||'');return Number.isFinite(t)&&t<=now+300000?t:null;};
const age=value=>{const t=dated(value);return t===null?null:Math.max(0,Math.floor((now-t)/60000));};
const acceptedNow=!!prior?.master_accepted_now&&!!prior?.ledger_complete&&
!!current?.master_fresh&&
Number(prior?.renewal?.current_independently_reverified_receipt_id)===
Number(current?.verified_master_receipt_id)&&Number(current?.verified_master_receipt_id)>0;
const exceptions=(prior?.replay_exceptions||[]).map(x=>{
const minutes=age(x.recorded_at);
return{case_id:x.case_id||null,reference_receipt_id:x.reference_receipt_id||null,
issue_code:x.issue_code,recorded_at:x.recorded_at||null,age_minutes:minutes,
age_status:minutes===null?'HOLD_UNKNOWN_AGE':minutes>=240?'CRITICAL_AGED':
minutes>=120?'OVERDUE_OWNER_REVIEW':minutes>=90?'DUE_SOON':'WITHIN_ADVISORY_TARGET',
original_investigation_recorded:!!x.owner_reviewed};
});
const gaps=(prior?.renewal?.renewal_gap_evidence||[]).map(x=>({
older_receipt_id:Number(x.older_receipt_id),newer_receipt_id:Number(x.newer_receipt_id),
older_recorded_at:x.older_recorded_at,newer_recorded_at:x.newer_recorded_at,
gap_minutes:Number(x.gap_minutes),source_pins_match:!!x.source_pins_match,
kind:'RECORDED_RECEIPT_INTERVAL_NOT_PROVEN_RUNTIME_OUTAGE'}));
const reconciliation=(prior?.closure_candidates||[]).filter(x=>x.owner_reconciled)
.map(x=>({case_id:x.case_id,reference_receipt_id:Number(x.receipt_id),
source_owner_review_state:'PRIOR_OWNER_CLOSURE_RECONCILIATION_RECORDED',
source_revision:current?.source_revision||null,
prior_owner_recorded_at:x.recorded_at||null}));
const historicalMaster=new Set(prior?.renewal?.source_pinned_receipt_ids||[]);
const validSource=(d)=>d.fingerprint_sha256===current?.fingerprint_sha256&&
d.source_revision===current?.source_revision;
const validOwner=(d)=>d.owner_reviewed===true&&
Number.isSafeInteger(Number(d.owner_user_id))&&Number(d.owner_user_id)>0&&
typeof d.resolution_note==='string'&&d.resolution_note.length>=20&&
d.resolution_note.length<=400;
const reviewOf=(decision,ref,second,caseId)=>{
if(decision==='escalate_replay_aging')return exceptions.find(x=>
x.reference_receipt_id===ref&&x.case_id===caseId&&
x.age_minutes!==null&&x.age_minutes>=120);
if(decision==='escalate_renewal_gap')return gaps.find(x=>
x.older_receipt_id===ref&&x.newer_receipt_id===second&&
x.source_pins_match&&x.gap_minutes>20);
if(decision==='accept_closure_continuity')return reconciliation.find(x=>
x.reference_receipt_id===ref&&x.case_id===caseId);
return null;
};
let invalid=0,previousId=Infinity,previousTime=Infinity;
const used=new Set(),history=[];
for(const row of rows691){
const id=Number(row.social_post_attempt_id),d=safeJson(row.response_json,{}),
ref=Number(d.reference_receipt_id),second=Number(d.newer_receipt_id),
time=dated(row.attempted_at),candidate=reviewOf(d.decision,ref,second,d.case_id||null),
status=({escalate_replay_aging:'owner_replay_aging_escalated_691',
escalate_renewal_gap:'owner_master_gap_escalated_691',
accept_closure_continuity:'owner_closure_continuity_accepted_691'})[d.decision],
key=d.decision+'|'+ref;
const sourceTime=dated(d.decision==='escalate_replay_aging'?candidate?.recorded_at:
d.decision==='escalate_renewal_gap'?candidate?.newer_recorded_at:
candidate?.prior_owner_recorded_at);
const historicalClosure=d.decision!=='accept_closure_continuity'||
historicalMaster.has(Number(d.verified_master_receipt_id))&&
Number(d.verified_master_receipt_id)>0;
const valid=Number.isSafeInteger(id)&&id>0&&id>ref&&id<previousId&&
time!==null&&time<=previousTime&&row.attempt_status===status&&
!!candidate&&validSource(d)&&validOwner(d)&&
sourceTime!==null&&time>=sourceTime&&
(d.decision!=='escalate_renewal_gap'||d.newer_receipt_id===candidate.newer_receipt_id)&&
historicalClosure&&!used.has(key);
if(valid)used.add(key);else invalid++;
history.push({receipt_id:id,decision:d.decision||null,
case_id:d.case_id||null,reference_receipt_id:ref,
newer_receipt_id:Number.isSafeInteger(second)&&second>0?second:null,
recorded_at:row.attempted_at,
state:valid?'OWNER_ACKNOWLEDGMENT_RECORDED_NO_EXTERNAL_CERTIFICATION':'HOLD_OWNER_RECEIPT_DRIFT'});
previousId=id;previousTime=time===null?-Infinity:time;
}
const marked=decision=>new Set(history.filter(x=>
x.decision===decision&&x.state==='OWNER_ACKNOWLEDGMENT_RECORDED_NO_EXTERNAL_CERTIFICATION')
.map(x=>x.reference_receipt_id));
const agedEscalated=marked('escalate_replay_aging'),
gapEscalated=marked('escalate_renewal_gap'),
closureAccepted=marked('accept_closure_continuity');
const aged=exceptions.map(x=>({...x,
escalation_recorded:x.reference_receipt_id?
agedEscalated.has(x.reference_receipt_id):false,
evidence_repaired:false}));
const gapCases=gaps.map(x=>({...x,owner_escalation_recorded:
gapEscalated.has(x.older_receipt_id),historical_gap_resolved:false}));
const closures=reconciliation.map(x=>({...x,owner_continuity_accepted:
closureAccepted.has(x.reference_receipt_id),current_master_rechecked:acceptedNow}));
const unknownAges=aged.filter(x=>x.age_minutes===null).length;
const unresolvedAged=aged.filter(x=>
x.age_minutes!==null&&x.age_minutes>=120&&
x.reference_receipt_id&&!x.escalation_recorded).length;
const unresolvedGaps=gapCases.filter(x=>
x.source_pins_match&&!x.owner_escalation_recorded).length;
const full=selected&&bounded&&invalid===0;
const lineage=!!prior?.renewal?.historical_chain_pin_matches&&
!!prior?.renewal?.current_receipt_in_bounded_history;
return{status:!selected?'HOLD_SELECT_CAMPAIGN':!bounded||invalid?
'HOLD_FINANCIAL_CONTINUITY_HISTORY':!lineage?'HOLD_RENEWAL_SOURCE_PIN':unknownAges?'HOLD_REPLAY_AGE_UNVERIFIABLE':
unresolvedAged?'OWNER_REPLAY_AGING_ESCALATION_REQUIRED':
unresolvedGaps?'OWNER_MASTER_RENEWAL_GAP_REVIEW_REQUIRED':
!acceptedNow?'HOLD_CURRENT_SIGNED_MASTER':
'OWNER_CLOSURE_EVIDENCE_REVIEW_ONLY',
campaign_queue_id:selected?Number(current.queue_id):null,
observed_at:new Date(now).toISOString(),history_complete:full,
replay_exception_count:exceptions.length,unverifiable_age_count:unknownAges,
critical_aged_count:aged.filter(x=>x.age_status==='CRITICAL_AGED').length,
overdue_count:aged.filter(x=>['CRITICAL_AGED','OVERDUE_OWNER_REVIEW'].includes(x.age_status)).length,
unreviewed_overdue_count:unresolvedAged,
replay_exception_aging:aged.slice(0,30),
renewal:{status:prior?.renewal?.status||'HOLD_RENEWAL_STATUS',
sampled_at:prior?.renewal?.observed_at||null,
expires_at:prior?.renewal?.expires_at||null,
seconds_to_expiry:prior?.renewal?.seconds_to_expiry??null,
current_verified_receipt_id:acceptedNow?current.verified_master_receipt_id:null,
historical_source_pin_matches:!!prior?.renewal?.historical_chain_pin_matches,
historical_source_receipt_ids:(prior?.renewal?.source_pinned_receipt_ids||[]).slice(0,80),
gap_count:gaps.length,unreviewed_gap_count:unresolvedGaps,
gap_evidence:gapCases.slice(0,40),
historical_signatures_reverified:false,background_polling:false,
gap_is_proof_of_outage:false},
closure_count:closures.length,
pending_owner_closure_acceptance:closures.filter(x=>!x.owner_continuity_accepted).length,
owner_closure_evidence:closures.slice(0,30),
owner_actions:history.slice(0,40),invalid_owner_receipts:invalid,
master_accepted_now:acceptedNow&&full&&lineage,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
financial_certified:false,automatic_escalation:false,
automatic_owner_closure:false,external_replay_performed:false};
}
async function finance691(db,env,id){
const n=Number(id);
if(!Number.isSafeInteger(n)||n<1)
return assessFinance691({queue_id:0},{history_complete:false},[]);
const current=await financial685(db,env,n),base=await finance690(db,env,n);
const ownerRows=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_continuity_691' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
return assessFinance691(current,base,ownerRows);
}
async function ownerContinuity691(db,env,user,p){
const id=Number(p.social_post_queue_id),current=await financial685(db,env,id),
report=await finance691(db,env,id),
decision=normalizeText(p.decision),caseId=normalizeText(p.case_id)||null,
ref=Number(p.reference_receipt_id),newer=Number(p.newer_receipt_id),
note=normalizeText(p.resolution_note);
if(!current.queue_id||!report.history_complete||
p.owner_reviewed!==true||!current.fingerprint_sha256||
p.expected_fingerprint_sha256!==current.fingerprint_sha256||
p.expected_source_revision!==current.source_revision||
!Number.isSafeInteger(ref)||ref<1||note.length<20||note.length>400)
throw Error('Exact signed source identity, bounded history and explicit substantial owner review are required. HOLD.');
let candidate=null,status='',masterId=null;
if(decision==='escalate_replay_aging'){
candidate=report.replay_exception_aging.find(x=>x.case_id===caseId&&
x.reference_receipt_id===ref&&x.age_minutes!==null&&
x.age_minutes>=120&&!x.escalation_recorded);
status='owner_replay_aging_escalated_691';
}else if(decision==='escalate_renewal_gap'){
candidate=report.renewal.gap_evidence.find(x=>x.older_receipt_id===ref&&
x.newer_receipt_id===newer&&x.source_pins_match&&
x.gap_minutes>20&&!x.owner_escalation_recorded);
status='owner_master_gap_escalated_691';
}else if(decision==='accept_closure_continuity'){
if(!report.master_accepted_now||!report.renewal.historical_source_pin_matches||
Number(p.expected_master_receipt_id)!==current.verified_master_receipt_id)
throw Error('A fresh exact-source independently reverified Master receipt is required for owner closure acceptance. HOLD.');
candidate=report.owner_closure_evidence.find(x=>x.case_id===caseId&&
x.reference_receipt_id===ref&&!x.owner_continuity_accepted);
status='owner_closure_continuity_accepted_691';
masterId=current.verified_master_receipt_id;
}else throw Error('Unsupported financial owner continuity action. HOLD.');
if(!candidate)throw Error('Exact unreviewed source evidence is stale, incomplete or already acknowledged. HOLD.');
const payload={decision,case_id:decision==='escalate_renewal_gap'?null:caseId,
reference_receipt_id:ref,newer_receipt_id:decision==='escalate_renewal_gap'?newer:null,
fingerprint_sha256:current.fingerprint_sha256,source_revision:current.source_revision,
verified_master_receipt_id:masterId,owner_user_id:user.user_id,
owner_reviewed:true,resolution_note:note,
external_replay_performed:false,independent_master_connected:false,
financial_certified:false,evidence_repaired:false};
const nonce='finance691-'+decision+'-'+ref;
const receipt_id=await append684(db,user,id,'finance_owner_continuity_691',status,nonce,payload);
const after=await finance691(db,env,id);
if(!after.owner_actions.some(x=>x.receipt_id===receipt_id&&
x.decision===decision&&x.reference_receipt_id===ref&&
x.state==='OWNER_ACKNOWLEDGMENT_RECORDED_NO_EXTERNAL_CERTIFICATION'))
throw Error('Owner continuity receipt missing or inconsistent at exact durable readback. HOLD.');
return{status,receipt_id,reference_receipt_id:ref,case_id:caseId,
master_accepted_now:after.master_accepted_now,
external_replay_performed:false,financial_certified:false,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}

// Build 692 — owner SLA follow-up, historical Master receipt provenance and
// closure audit continuity. A historical source pin is NOT signature revalidation.
export function assessFinance692(current,prior,ownerRows,now=Date.now()){
const selected=Number.isSafeInteger(Number(current?.queue_id))&&Number(current.queue_id)>0;
const rows692=Array.isArray(ownerRows)?ownerRows:[],
bounded=!!prior?.history_complete&&rows692.length<=60;
const dated=value=>{const t=Date.parse(value||'');return Number.isFinite(t)&&t<=now+300000?t:null;};
const minutesSince=value=>{const t=dated(value);return t===null?null:Math.max(0,Math.floor((now-t)/60000));};
const expiry=Date.parse(current?.expires_at||''),currentMaster=Number(current?.verified_master_receipt_id);
const historicalIds=new Set((prior?.renewal?.historical_source_receipt_ids||[])
.filter(x=>Number.isSafeInteger(Number(x))&&Number(x)>0).map(Number));
const masterCurrent=!!current?.master_fresh&&!!prior?.master_accepted_now&&
Number.isFinite(expiry)&&expiry>now&&Number.isSafeInteger(currentMaster)&&currentMaster>0&&
currentMaster===Number(prior?.renewal?.current_verified_receipt_id)&&
historicalIds.has(currentMaster)&&!!prior?.renewal?.historical_source_pin_matches;
const actions=(prior?.owner_actions||[]).filter(x=>
x.state==='OWNER_ACKNOWLEDGMENT_RECORDED_NO_EXTERNAL_CERTIFICATION');
const escalations=actions.filter(x=>
['escalate_replay_aging','escalate_renewal_gap'].includes(x.decision));
const followUps=escalations.map(x=>{
const elapsed=minutesSince(x.recorded_at);
return{case_id:x.case_id||null,escalation_receipt_id:Number(x.receipt_id),
source_receipt_id:Number(x.reference_receipt_id),newer_receipt_id:x.newer_receipt_id||null,
escalation_decision:x.decision,recorded_at:x.recorded_at,
elapsed_minutes:elapsed,sla_state:elapsed===null?'HOLD_UNKNOWN_CLOCK':
elapsed>=240?'CRITICAL':elapsed>=120?'OVERDUE':
elapsed>=90?'DUE_SOON':'WITHIN_ADVISORY_TARGET',
owner_followup_recorded:false,evidence_repaired:false};
});
const gaps=(prior?.renewal?.gap_evidence||[]).map(x=>({
older_receipt_id:Number(x.older_receipt_id),newer_receipt_id:Number(x.newer_receipt_id),
older_recorded_at:x.older_recorded_at,newer_recorded_at:x.newer_recorded_at,
gap_minutes:Number(x.gap_minutes),source_pins_match:!!x.source_pins_match,
provenance_state:!!x.source_pins_match&&
historicalIds.has(Number(x.older_receipt_id))&&historicalIds.has(Number(x.newer_receipt_id))?
'HISTORICAL_SOURCE_RECEIPT_PINS_MATCH_NOT_SIGNATURE_REVERIFIED':'HOLD_SOURCE_PROVENANCE',
owner_provenance_reviewed:false,runtime_outage_proven:false}));
const continuityActions=actions.filter(x=>x.decision==='accept_closure_continuity');
const closureCases=(prior?.owner_closure_evidence||[]).filter(x=>x.owner_continuity_accepted)
.map(x=>{
const original=continuityActions.find(a=>a.case_id===x.case_id&&
Number(a.reference_receipt_id)===Number(x.reference_receipt_id));
return{case_id:x.case_id,original_closure_receipt_id:Number(x.reference_receipt_id),
continuity_receipt_id:original?Number(original.receipt_id):null,
continuity_recorded_at:original?.recorded_at||null,
owner_audit_reconciled:false,
historical_owner_acceptance_recorded:!!original,master_currently_reverified:masterCurrent};
});
const followById=new Map(followUps.map(x=>[x.escalation_receipt_id,x]));
const gapByKey=new Map(gaps.map(x=>[x.older_receipt_id+'|'+x.newer_receipt_id,x]));
const closureById=new Map(closureCases.filter(x=>x.continuity_receipt_id)
.map(x=>[x.continuity_receipt_id,x]));
let invalid=0,previousId=Infinity,previousTime=Infinity;
const seen=new Set(),reviews=[];
for(const r of rows692){
const id=Number(r.social_post_attempt_id),d=safeJson(r.response_json,{}),
ref=Number(d.reference_receipt_id),newer=Number(d.newer_receipt_id),
at=dated(r.attempted_at),key=d.decision+'|'+ref+'|'+(d.decision==='review_master_provenance'?newer:0),
expected=({record_sla_followup:'owner_financial_sla_followup_692',
review_master_provenance:'owner_master_provenance_review_692',
reconcile_closure_audit:'owner_financial_closure_audit_reconciled_692'})[d.decision];
const source=d.decision==='record_sla_followup'?followById.get(ref):
d.decision==='review_master_provenance'?gapByKey.get(ref+'|'+newer):
d.decision==='reconcile_closure_audit'?closureById.get(ref):null;
const sourceAt=dated(d.decision==='record_sla_followup'?source?.recorded_at:
d.decision==='review_master_provenance'?source?.newer_recorded_at:
source?.continuity_recorded_at);
const paired=d.decision==='record_sla_followup'?!!source&&
source.case_id===d.case_id&&
source.elapsed_minutes!==null&&source.elapsed_minutes>=120:
d.decision==='review_master_provenance'?!!source&&
source.provenance_state==='HISTORICAL_SOURCE_RECEIPT_PINS_MATCH_NOT_SIGNATURE_REVERIFIED'&&
d.case_id===null:
d.decision==='reconcile_closure_audit'?!!source&&
source.case_id===d.case_id&&source.historical_owner_acceptance_recorded&&
historicalIds.has(Number(d.master_receipt_id))&&Number(d.master_receipt_id)>0:false;
const valid=Number.isSafeInteger(id)&&id>0&&id>ref&&id<previousId&&
at!==null&&at<=previousTime&&sourceAt!==null&&at>=sourceAt&&
r.attempt_status===expected&&paired&&!seen.has(key)&&
d.fingerprint_sha256===current?.fingerprint_sha256&&
d.source_revision===current?.source_revision&&
d.owner_reviewed===true&&Number.isSafeInteger(Number(d.owner_user_id))&&
Number(d.owner_user_id)>0&&typeof d.resolution_note==='string'&&
d.resolution_note.length>=20&&d.resolution_note.length<=400;
if(valid)seen.add(key);else invalid++;
reviews.push({receipt_id:id,decision:d.decision||null,case_id:d.case_id||null,
reference_receipt_id:ref,newer_receipt_id:Number.isSafeInteger(newer)&&newer>0?newer:null,
recorded_at:r.attempted_at,owner_user_id:Number(d.owner_user_id||0),
state:valid?'OWNER_REVIEW_RECORDED_NO_EXTERNAL_MASTER_CERTIFICATION':'HOLD_OWNER_AUDIT_DRIFT'});
previousId=id;previousTime=at===null?-Infinity:at;
}
const recorded=type=>new Set(reviews.filter(x=>x.decision===type&&
x.state==='OWNER_REVIEW_RECORDED_NO_EXTERNAL_MASTER_CERTIFICATION')
.map(x=>x.reference_receipt_id+'|'+(type==='review_master_provenance'?x.newer_receipt_id:0)));
const doneSla=recorded('record_sla_followup'),doneProv=recorded('review_master_provenance'),
doneClosure=recorded('reconcile_closure_audit');
for(const x of followUps)x.owner_followup_recorded=doneSla.has(x.escalation_receipt_id+'|0');
for(const x of gaps)x.owner_provenance_reviewed=doneProv.has(x.older_receipt_id+'|'+x.newer_receipt_id);
for(const x of closureCases)x.owner_audit_reconciled=!!x.continuity_receipt_id&&
doneClosure.has(x.continuity_receipt_id+'|0');
const unknown=followUps.filter(x=>x.elapsed_minutes===null).length;
const overdue=followUps.filter(x=>x.elapsed_minutes!==null&&x.elapsed_minutes>=120);
const pendingOverdue=overdue.filter(x=>!x.owner_followup_recorded).length;
const provenanceHolds=gaps.filter(x=>x.provenance_state==='HOLD_SOURCE_PROVENANCE').length;
const pendingProvenance=gaps.filter(x=>x.provenance_state!=='HOLD_SOURCE_PROVENANCE'&&
!x.owner_provenance_reviewed).length;
const complete=selected&&bounded&&invalid===0;
return{status:!selected?'HOLD_SELECT_CAMPAIGN':!bounded||invalid?
'HOLD_OWNER_CONTINUITY_HISTORY':unknown?'HOLD_FOLLOWUP_CLOCK':
provenanceHolds?'HOLD_MASTER_PROVENANCE':
pendingOverdue?'OWNER_FINANCIAL_SLA_FOLLOWUP_REQUIRED':
pendingProvenance?'OWNER_MASTER_PROVENANCE_REVIEW_REQUIRED':
!masterCurrent?'HOLD_CURRENT_SIGNED_MASTER':'OWNER_CLOSURE_AUDIT_REVIEW_ONLY',
observed_at:new Date(now).toISOString(),campaign_queue_id:selected?Number(current.queue_id):null,
history_complete:complete,advisory_followup_target_minutes:120,
sla:{followup_count:followUps.length,due_soon_count:followUps.filter(x=>x.sla_state==='DUE_SOON').length,
overdue_count:overdue.length,critical_count:followUps.filter(x=>x.sla_state==='CRITICAL').length,
unreviewed_overdue_count:pendingOverdue,unknown_clock_count:unknown,
followups:followUps.slice(0,40)},
provenance:{current_exact_master_receipt_id:masterCurrent?currentMaster:null,
source_revision:current?.source_revision||null,
source_fingerprint_sha256:current?.fingerprint_sha256||null,
current_signature_verified_independently:masterCurrent,
historical_source_receipt_count:historicalIds.size,
bounded_historical_receipt_ids:[...historicalIds].slice(0,80),
recorded_gap_count:gaps.length,source_provenance_hold_count:provenanceHolds,
pending_owner_provenance_count:pendingProvenance,
historical_receipt_pairs:gaps.slice(0,40),
historical_signatures_reverified:false,runtime_outage_proven:false,
background_renewal:false},
closure:{record_count:closureCases.length,
pending_owner_reconciliation_count:closureCases.filter(x=>!x.owner_audit_reconciled).length,
owner_audit_reconciled_count:closureCases.filter(x=>x.owner_audit_reconciled).length,
evidence:closureCases.slice(0,30)},
owner_reviews:reviews.slice(0,40),invalid_owner_review_count:invalid,
master_accepted_now:masterCurrent&&complete&&provenanceHolds===0,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
financial_certified:false,automatic_sla_followup:false,
automatic_owner_reconciliation:false,external_master_replay_performed:false};
}
async function finance692(db,env,id){
const n=Number(id);
if(!Number.isSafeInteger(n)||n<1)
return assessFinance692({queue_id:0},{history_complete:false},[]);
const current=await financial685(db,env,n),prior=await finance691(db,env,n);
const rows692=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_followup_692' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
return assessFinance692(current,prior,rows692);
}
async function ownerFollowup692(db,env,user,p){
const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
report=await finance692(db,env,n),decision=normalizeText(p.decision),
caseId=normalizeText(p.case_id)||null,ref=Number(p.reference_receipt_id),
newer=Number(p.newer_receipt_id),note=normalizeText(p.resolution_note);
if(!current.queue_id||!report.history_complete||!current.fingerprint_sha256||
p.owner_reviewed!==true||p.expected_fingerprint_sha256!==current.fingerprint_sha256||
p.expected_source_revision!==current.source_revision||
!Number.isSafeInteger(ref)||ref<1||note.length<20||note.length>400)
throw Error('Exact current source, bounded owner history and explicit substantial owner note required. HOLD.');
let candidate=null,status='',masterId=null;
if(decision==='record_sla_followup'){
candidate=report.sla.followups.find(x=>x.case_id===caseId&&
x.escalation_receipt_id===ref&&x.elapsed_minutes!==null&&
x.elapsed_minutes>=120&&!x.owner_followup_recorded);
status='owner_financial_sla_followup_692';
}else if(decision==='review_master_provenance'){
candidate=report.provenance.historical_receipt_pairs.find(x=>x.older_receipt_id===ref&&
x.newer_receipt_id===newer&&
x.provenance_state==='HISTORICAL_SOURCE_RECEIPT_PINS_MATCH_NOT_SIGNATURE_REVERIFIED'&&
!x.owner_provenance_reviewed);
status='owner_master_provenance_review_692';
}else if(decision==='reconcile_closure_audit'){
if(!report.master_accepted_now||
Number(p.expected_master_receipt_id)!==current.verified_master_receipt_id)
throw Error('Fresh independently signed exact-source Master proof required. HOLD.');
candidate=report.closure.evidence.find(x=>x.case_id===caseId&&
x.continuity_receipt_id===ref&&!x.owner_audit_reconciled&&
x.historical_owner_acceptance_recorded);
status='owner_financial_closure_audit_reconciled_692';
masterId=current.verified_master_receipt_id;
}else throw Error('Unsupported Build 692 owner follow-up action. HOLD.');
if(!candidate)throw Error('Stale, already reviewed, unpaired or missing exact owner evidence. HOLD.');
const payload={decision,case_id:decision==='review_master_provenance'?null:caseId,
reference_receipt_id:ref,newer_receipt_id:decision==='review_master_provenance'?newer:null,
master_receipt_id:masterId,
fingerprint_sha256:current.fingerprint_sha256,source_revision:current.source_revision,
owner_user_id:user.user_id,owner_reviewed:true,resolution_note:note,
historical_signatures_reverified:false,evidence_repaired:false,
continuous_connection:false,financial_certified:false};
const nonce='finance692-'+decision+'-'+ref+
(decision==='review_master_provenance'?'-'+newer:'');
const receipt_id=await append684(db,user,n,'finance_owner_followup_692',status,nonce,payload);
const after=await finance692(db,env,n);
if(!after.owner_reviews.some(x=>x.receipt_id===receipt_id&&x.decision===decision&&
x.reference_receipt_id===ref&&x.state==='OWNER_REVIEW_RECORDED_NO_EXTERNAL_MASTER_CERTIFICATION'))
throw Error('Owner follow-up receipt failed exact protected durable readback. HOLD.');
return{status,receipt_id,reference_receipt_id:ref,
master_accepted_now:after.master_accepted_now,
external_master_replay_performed:false,financial_certified:false,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}

// Build 693: bounded owner SLA follow-up aging, source-pinned provenance
// exception recheck and append-only owner acceptance history. No external replay.
export function assessFinance693(current,prior,ownerRows,now=Date.now()){
const selected=Number.isSafeInteger(Number(current?.queue_id))&&Number(current.queue_id)>0;
const rows693=Array.isArray(ownerRows)?ownerRows:[],bounded=!!prior?.history_complete&&rows693.length<=60;
const dated=v=>{const t=Date.parse(v||'');return Number.isFinite(t)&&t<=now+300000?t:null;};
const age=v=>{const t=dated(v);return t===null?null:Math.max(0,Math.floor((now-t)/60000));};
const expiry=Date.parse(current?.expires_at||'');
const currentMaster=Number(current?.verified_master_receipt_id);
const historicalIds=new Set((prior?.provenance?.bounded_historical_receipt_ids||[]).map(Number));
const signedNow=!!current?.master_fresh&&!!prior?.master_accepted_now&&
Number.isFinite(expiry)&&expiry>now&&Number.isSafeInteger(currentMaster)&&currentMaster>0&&
currentMaster===Number(prior?.provenance?.current_exact_master_receipt_id)&&
historicalIds.has(currentMaster)&&
!!prior?.provenance?.current_signature_verified_independently;
const priorReceipts=(prior?.owner_reviews||[]).filter(x=>
x.state==='OWNER_REVIEW_RECORDED_NO_EXTERNAL_MASTER_CERTIFICATION');
const slaSources=priorReceipts.filter(x=>x.decision==='record_sla_followup'&&
x.case_id&&Number(x.reference_receipt_id)>0);
const slaFollowups=slaSources.map(x=>{
const elapsed=age(x.recorded_at);
return{case_id:x.case_id,followup_receipt_id:Number(x.receipt_id),
original_escalation_receipt_id:Number(x.reference_receipt_id),
owner_user_id:Number(x.owner_user_id||0),recorded_at:x.recorded_at,
age_minutes:elapsed,age_status:elapsed===null?'HOLD_UNKNOWN_AGE':
elapsed>=240?'CRITICAL_AGED':elapsed>=120?'OVERDUE_RECHECK':
elapsed>=90?'DUE_SOON':'WITHIN_ADVISORY_TARGET',
repeat_followup_recorded:false,source_exception_repaired:false};
});
const sourcePairs=(prior?.provenance?.historical_receipt_pairs||[]).map(x=>({
older_receipt_id:Number(x.older_receipt_id),
newer_receipt_id:Number(x.newer_receipt_id),
recorded_gap_minutes:Number(x.gap_minutes),
provenance_state:x.provenance_state,
source_pins_match:x.provenance_state===
'HISTORICAL_SOURCE_RECEIPT_PINS_MATCH_NOT_SIGNATURE_REVERIFIED',
older_recorded_at:x.older_recorded_at,
newer_recorded_at:x.newer_recorded_at,
previous_owner_provenance_reviewed:!!x.owner_provenance_reviewed,
revalidation_recorded:false,exception_review_recorded:false,
historical_signatures_reverified:false}));
const review692ByPair=new Map(priorReceipts.filter(x=>x.decision==='review_master_provenance')
.map(x=>[x.reference_receipt_id+'|'+x.newer_receipt_id,x]));
for(const x of sourcePairs){
const old=review692ByPair.get(x.older_receipt_id+'|'+x.newer_receipt_id);
x.previous_owner_receipt_id=old?Number(old.receipt_id):null;
x.revalidation_state=x.source_pins_match?
(signedNow&&!!old?'CURRENT_MASTER_RECHECK_ELIGIBLE':'HOLD_FRESH_MASTER_OR_PRIOR_OWNER_REVIEW'):
'HOLD_SOURCE_RECEIPT_EXCEPTION';
}
const priorClosures=priorReceipts.filter(x=>x.decision==='reconcile_closure_audit'&&x.case_id)
.map(x=>({case_id:x.case_id,prior_owner_audit_receipt_id:Number(x.receipt_id),
original_continuity_receipt_id:Number(x.reference_receipt_id),
recorded_at:x.recorded_at,owner_user_id:Number(x.owner_user_id||0),
owner_acceptance_recorded:false,current_signed_master_rechecked:signedNow}));
const followByReceipt=new Map(slaFollowups.map(x=>[x.followup_receipt_id,x]));
const pairByKey=new Map(sourcePairs.map(x=>[x.older_receipt_id+'|'+x.newer_receipt_id,x]));
const closureByReceipt=new Map(priorClosures.map(x=>[x.prior_owner_audit_receipt_id,x]));
let invalid=0,previousId=Infinity,previousTime=Infinity;
const seen=new Set(),ownerHistory=[];
for(const row of rows693){
const id=Number(row.social_post_attempt_id),
d=safeJson(row.response_json,{}),at=dated(row.attempted_at),
ref=Number(d.reference_receipt_id),newer=Number(d.newer_receipt_id),
status=({repeat_sla_followup:'owner_followup_aging_reviewed_693',
review_provenance_exception:'owner_provenance_exception_reviewed_693',
revalidate_master_provenance:'owner_master_provenance_revalidated_693',
accept_owner_audit_history:'owner_audit_acceptance_recorded_693'})[d.decision],
key=d.decision+'|'+ref+'|'+(d.decision?.includes('provenance')?newer:0),
source=d.decision==='repeat_sla_followup'?followByReceipt.get(ref):
d.decision==='review_provenance_exception'||d.decision==='revalidate_master_provenance'?
pairByKey.get(ref+'|'+newer):
d.decision==='accept_owner_audit_history'?closureByReceipt.get(ref):null,
sourceAt=dated(d.decision==='repeat_sla_followup'?source?.recorded_at:
d.decision==='review_provenance_exception'||d.decision==='revalidate_master_provenance'?
source?.newer_recorded_at:source?.recorded_at);
const paired=d.decision==='repeat_sla_followup'?!!source&&source.case_id===d.case_id&&
source.age_minutes!==null&&source.age_minutes>=120:
d.decision==='review_provenance_exception'?!!source&&!source.source_pins_match&&d.case_id===null:
d.decision==='revalidate_master_provenance'?!!source&&source.source_pins_match&&
!!source.previous_owner_receipt_id&&
Number(d.prior_owner_review_receipt_id)===source.previous_owner_receipt_id&&
d.case_id===null&&Number(d.master_receipt_id)>0:
d.decision==='accept_owner_audit_history'?!!source&&source.case_id===d.case_id&&
Number(d.master_receipt_id)>0:false;
const requiresCurrent=d.decision==='revalidate_master_provenance'||
d.decision==='accept_owner_audit_history';
const valid=Number.isSafeInteger(id)&&id>0&&id>ref&&id<previousId&&
at!==null&&at<=previousTime&&sourceAt!==null&&at>=sourceAt&&
row.attempt_status===status&&paired&&!seen.has(key)&&
(!requiresCurrent||Number.isSafeInteger(Number(d.master_receipt_id))&&
Number(d.master_receipt_id)>0&&historicalIds.has(Number(d.master_receipt_id)))&&
d.fingerprint_sha256===current?.fingerprint_sha256&&
d.source_revision===current?.source_revision&&
d.owner_reviewed===true&&Number.isSafeInteger(Number(d.owner_user_id))&&
Number(d.owner_user_id)>0&&typeof d.resolution_note==='string'&&
d.resolution_note.length>=20&&d.resolution_note.length<=400;
if(valid)seen.add(key);else invalid++;
ownerHistory.push({receipt_id:id,decision:d.decision||null,case_id:d.case_id||null,
reference_receipt_id:ref,newer_receipt_id:Number.isSafeInteger(newer)&&newer>0?newer:null,
master_receipt_id:Number.isSafeInteger(Number(d.master_receipt_id))&&
Number(d.master_receipt_id)>0?Number(d.master_receipt_id):null,
recorded_at:row.attempted_at,owner_user_id:Number(d.owner_user_id||0),
state:valid?'OWNER_REVIEW_RECORDED_HISTORICAL_NOT_EXTERNAL_CERTIFICATION':'HOLD_OWNER_REVIEW_DRIFT'});
previousId=id;previousTime=at===null?-Infinity:at;
}
const done=(decision)=>new Set(ownerHistory.filter(x=>x.decision===decision&&
x.state==='OWNER_REVIEW_RECORDED_HISTORICAL_NOT_EXTERNAL_CERTIFICATION')
.map(x=>x.reference_receipt_id+'|'+(decision.includes('provenance')?x.newer_receipt_id:0)));
const doneSla=done('repeat_sla_followup'),doneException=done('review_provenance_exception'),
doneRecheck=done('revalidate_master_provenance'),doneAudit=done('accept_owner_audit_history');
for(const x of slaFollowups)x.repeat_followup_recorded=doneSla.has(x.followup_receipt_id+'|0');
for(const x of sourcePairs){
x.exception_review_recorded=doneException.has(x.older_receipt_id+'|'+x.newer_receipt_id);
x.revalidation_recorded=doneRecheck.has(x.older_receipt_id+'|'+x.newer_receipt_id);
}
for(const x of priorClosures)x.owner_acceptance_recorded=
doneAudit.has(x.prior_owner_audit_receipt_id+'|0');
const unknownAges=slaFollowups.filter(x=>x.age_minutes===null).length;
const pendingOverdue=slaFollowups.filter(x=>x.age_minutes!==null&&x.age_minutes>=120&&
!x.repeat_followup_recorded).length;
const exceptionHolds=sourcePairs.filter(x=>!x.source_pins_match).length;
const pendingExceptionReview=sourcePairs.filter(x=>!x.source_pins_match&&
!x.exception_review_recorded).length;
const pendingProvenance=sourcePairs.filter(x=>x.source_pins_match&&
!x.revalidation_recorded).length;
const complete=selected&&bounded&&invalid===0;
return{status:!selected?'HOLD_SELECT_CAMPAIGN':!bounded||invalid?
'HOLD_OWNER_AUDIT_HISTORY':unknownAges?'HOLD_FOLLOWUP_AGE_UNVERIFIABLE':
pendingOverdue?'OWNER_SLA_AGING_RECHECK_REQUIRED':
pendingExceptionReview?'HOLD_PROVENANCE_EXCEPTION_OWNER_REVIEW':
exceptionHolds?'HOLD_PROVENANCE_SOURCE_REVALIDATION':
pendingProvenance?'OWNER_MASTER_PROVENANCE_RECHECK_REQUIRED':
!signedNow?'HOLD_CURRENT_INDEPENDENT_MASTER':'OWNER_AUDIT_ACCEPTANCE_REVIEW_ONLY',
campaign_queue_id:selected?Number(current.queue_id):null,
observed_at:new Date(now).toISOString(),history_complete:complete,
followups:{advisory_target_minutes:120,record_count:slaFollowups.length,
overdue_count:slaFollowups.filter(x=>x.age_minutes!==null&&x.age_minutes>=120).length,
critical_count:slaFollowups.filter(x=>x.age_status==='CRITICAL_AGED').length,
pending_overdue_count:pendingOverdue,unknown_age_count:unknownAges,
items:slaFollowups.slice(0,40)},
provenance:{current_master_receipt_id:signedNow?currentMaster:null,
current_master_independently_reverified:signedNow,source_revision:current?.source_revision||null,
source_fingerprint_sha256:current?.fingerprint_sha256||null,
historical_pair_count:sourcePairs.length,
historical_source_receipt_ids:[...historicalIds].filter(x=>Number.isSafeInteger(x)&&x>0).slice(0,80),
source_exception_count:exceptionHolds,
pending_exception_review_count:pendingExceptionReview,
pending_owner_revalidation_count:pendingProvenance,
pairs:sourcePairs.slice(0,40),historical_signatures_reverified:false,
recorded_gap_proves_outage:false,continuous_runtime_verified:false},
audit:{prior_acceptance_count:priorClosures.length,
owner_accepted_count:priorClosures.filter(x=>x.owner_acceptance_recorded).length,
pending_owner_acceptance_count:priorClosures.filter(x=>!x.owner_acceptance_recorded).length,
history:priorClosures.slice(0,30)},
owner_history:ownerHistory.slice(0,40),invalid_owner_history_count:invalid,
master_accepted_now:signedNow&&complete&&exceptionHolds===0,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
financial_certified:false,auto_sla_followup:false,auto_source_repair:false,
auto_owner_acceptance:false,external_master_replay_performed:false};
}
async function finance693(db,env,id){
const n=Number(id);
if(!Number.isSafeInteger(n)||n<1)
return assessFinance693({queue_id:0},{history_complete:false},[]);
const current=await financial685(db,env,n),prior=await finance692(db,env,n);
const audits=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_audit_693' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
return assessFinance693(current,prior,audits);
}
async function ownerAudit693(db,env,user,p){
const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
report=await finance693(db,env,n),
decision=normalizeText(p.decision),caseId=normalizeText(p.case_id)||null,
ref=Number(p.reference_receipt_id),newer=Number(p.newer_receipt_id),
note=normalizeText(p.resolution_note);
if(!current.queue_id||!report.history_complete||!current.fingerprint_sha256||
p.owner_reviewed!==true||p.expected_fingerprint_sha256!==current.fingerprint_sha256||
p.expected_source_revision!==current.source_revision||
!Number.isSafeInteger(ref)||ref<=0||note.length<20||note.length>400)
throw Error('Exact current source, bounded history and substantial explicit owner review required. HOLD.');
let candidate=null,status='',masterId=null,previousReviewId=null;
if(decision==='repeat_sla_followup'){
candidate=report.followups.items.find(x=>x.case_id===caseId&&x.followup_receipt_id===ref&&
x.age_minutes!==null&&x.age_minutes>=120&&!x.repeat_followup_recorded);
status='owner_followup_aging_reviewed_693';
}else if(decision==='review_provenance_exception'){
candidate=report.provenance.pairs.find(x=>x.older_receipt_id===ref&&
x.newer_receipt_id===newer&&!x.source_pins_match&&!x.exception_review_recorded);
status='owner_provenance_exception_reviewed_693';
}else if(decision==='revalidate_master_provenance'){
if(!report.provenance.current_master_independently_reverified||
Number(p.expected_master_receipt_id)!==current.verified_master_receipt_id)
throw Error('Fresh independently reverified current Master acceptance required. HOLD.');
candidate=report.provenance.pairs.find(x=>x.older_receipt_id===ref&&
x.newer_receipt_id===newer&&x.source_pins_match&&
x.previous_owner_receipt_id&&!x.revalidation_recorded);
status='owner_master_provenance_revalidated_693';
masterId=current.verified_master_receipt_id;previousReviewId=candidate?.previous_owner_receipt_id||null;
}else if(decision==='accept_owner_audit_history'){
if(!report.master_accepted_now||
Number(p.expected_master_receipt_id)!==current.verified_master_receipt_id)
throw Error('Current independent Master verification and clear source provenance required. HOLD.');
candidate=report.audit.history.find(x=>x.case_id===caseId&&
x.prior_owner_audit_receipt_id===ref&&!x.owner_acceptance_recorded);
status='owner_audit_acceptance_recorded_693';masterId=current.verified_master_receipt_id;
}else throw Error('Unsupported Build 693 financial owner action. HOLD.');
if(!candidate)throw Error('Owner case is stale, already recorded, unpaired or insufficiently sourced. HOLD.');
const payload={decision,case_id:decision.includes('provenance')?null:caseId,
reference_receipt_id:ref,newer_receipt_id:decision.includes('provenance')?newer:null,
prior_owner_review_receipt_id:previousReviewId,master_receipt_id:masterId,
fingerprint_sha256:current.fingerprint_sha256,source_revision:current.source_revision,
owner_user_id:user.user_id,owner_reviewed:true,resolution_note:note,
historical_signatures_reverified:false,source_exception_repaired:false,
independent_connection_verified:false,financial_certified:false};
const nonce='finance693-'+decision+'-'+ref+
(decision.includes('provenance')?'-'+newer:'');
const receipt_id=await append684(db,user,n,'finance_owner_audit_693',status,nonce,payload);
const after=await finance693(db,env,n);
if(!after.owner_history.some(x=>x.receipt_id===receipt_id&&
x.decision===decision&&x.reference_receipt_id===ref&&
x.state==='OWNER_REVIEW_RECORDED_HISTORICAL_NOT_EXTERNAL_CERTIFICATION'))
throw Error('Exact append-only owner audit was not confirmed by durable readback. HOLD.');
return{status,receipt_id,reference_receipt_id:ref,case_id:caseId,
master_accepted_now:after.master_accepted_now,
historical_signatures_reverified:false,financial_certified:false,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}

// Build 694 — durable exact-source owner resolution ledger. A recorded decision
// does NOT repair a live incident, reverify historical signatures or certify finance.
export function assessFinance694(current,prior,ownerRows,now=Date.now()){
const n=Number(current?.queue_id),selected=Number.isSafeInteger(n)&&n>0;
const rows694=Array.isArray(ownerRows)?ownerRows:[],
bounded=!!prior?.history_complete&&rows694.length<=60;
const dated=value=>{const t=Date.parse(value||'');return Number.isFinite(t)&&t<=now+300000?t:null;};
const age=value=>{const t=dated(value);return t===null?null:Math.max(0,Math.floor((now-t)/60000));};
const expiry=Date.parse(current?.expires_at||''),masterId=Number(current?.verified_master_receipt_id);
const historical=new Set((prior?.provenance?.historical_source_receipt_ids||[])
.map(Number).filter(x=>Number.isSafeInteger(x)&&x>0));
const signedNow=!!current?.master_fresh&&!!prior?.master_accepted_now&&
Number.isFinite(expiry)&&expiry>now&&Number.isSafeInteger(masterId)&&masterId>0&&
historical.has(masterId)&&masterId===Number(prior?.provenance?.current_master_receipt_id)&&
!!prior?.provenance?.current_master_independently_reverified;
const priorOwner=(prior?.owner_history||[]).filter(x=>
x.state==='OWNER_REVIEW_RECORDED_HISTORICAL_NOT_EXTERNAL_CERTIFICATION');
const acceptedAudit=(prior?.audit?.history||[]).filter(x=>x.owner_acceptance_recorded)
.map(x=>{
const proof=priorOwner.find(r=>r.decision==='accept_owner_audit_history'&&
r.case_id===x.case_id&&Number(r.reference_receipt_id)===Number(x.prior_owner_audit_receipt_id));
return{case_id:x.case_id,prior_owner_audit_receipt_id:Number(x.prior_owner_audit_receipt_id),
owner_acceptance_receipt_id:proof?Number(proof.receipt_id):null,
owner_accepted_at:proof?.recorded_at||null,
historically_accepted:!!proof,continuity_acknowledged:false,
current_independent_master_rechecked:signedNow};
});
const auditByCase=new Map(acceptedAudit.filter(x=>x.historically_accepted)
.map(x=>[x.case_id,x]));
const reviewedFollowups=new Map(priorOwner.filter(x=>x.decision==='repeat_sla_followup')
.map(x=>[Number(x.reference_receipt_id),x]));
const resolution=(prior?.followups?.items||[]).filter(x=>x.repeat_followup_recorded).map(x=>{
const proof=reviewedFollowups.get(Number(x.followup_receipt_id)),
accepted=auditByCase.get(x.case_id);
return{case_id:x.case_id,followup_receipt_id:Number(x.followup_receipt_id),
original_escalation_receipt_id:Number(x.original_escalation_receipt_id),
recheck_receipt_id:proof?Number(proof.receipt_id):null,
rechecked_at:proof?.recorded_at||null,
age_minutes:age(proof?.recorded_at),
linked_owner_acceptance_receipt_id:accepted?.owner_acceptance_receipt_id||null,
eligible_for_owner_resolution:!!proof&&!!accepted&&signedNow&&
Number(prior?.provenance?.source_exception_count||0)===0,
owner_resolution_recorded:false,
external_sla_breach_remedied:false,source_incident_repaired:false};
});
const provenance=(prior?.provenance?.pairs||[]).map(x=>{
const recheck=priorOwner.find(y=>y.decision==='revalidate_master_provenance'&&
Number(y.reference_receipt_id)===Number(x.older_receipt_id)&&
Number(y.newer_receipt_id)===Number(x.newer_receipt_id));
const mismatch=!!x.exception_review_recorded&&!x.source_pins_match;
const bothHistorical=historical.has(Number(x.older_receipt_id))&&
historical.has(Number(x.newer_receipt_id));
return{older_receipt_id:Number(x.older_receipt_id),
newer_receipt_id:Number(x.newer_receipt_id),
recorded_gap_minutes:Number(x.recorded_gap_minutes),
older_recorded_at:x.older_recorded_at,newer_recorded_at:x.newer_recorded_at,
source_pins_match:!!x.source_pins_match&&bothHistorical,
exception_review_recorded:!!x.exception_review_recorded,
review_receipt_id:recheck?Number(recheck.receipt_id):null,
revalidated_at:recheck?.recorded_at||null,
eligible_for_owner_provenance_closure:!!x.source_pins_match&&bothHistorical&&
!!x.revalidation_recorded&&!!recheck&&signedNow&&!mismatch,
status:!x.source_pins_match||!bothHistorical?
'HOLD_INDEPENDENT_SOURCE_PROVENANCE_CORRECTION':
!x.revalidation_recorded||!recheck?
'HOLD_PRIOR_INDEPENDENT_MASTER_REVALIDATION':
signedNow?'REVALIDATED_SOURCE_PIN_OWNER_CLOSURE_REVIEW_ONLY':'HOLD_FRESH_SIGNED_MASTER',
owner_provenance_closure_recorded:false,
original_exception_repaired:false,historical_signatures_reverified:false};
});
const resolutionById=new Map(resolution.filter(x=>x.recheck_receipt_id)
.map(x=>[x.recheck_receipt_id,x]));
const provenanceByKey=new Map(provenance.map(x=>[x.older_receipt_id+'|'+x.newer_receipt_id,x]));
const auditByReceipt=new Map(acceptedAudit.filter(x=>x.owner_acceptance_receipt_id)
.map(x=>[x.owner_acceptance_receipt_id,x]));
let invalid=0,priorId=Infinity,priorTime=Infinity;
const seen=new Set(),history=[];
for(const row of rows694){
const id=Number(row.social_post_attempt_id),d=safeJson(row.response_json,{}),
ref=Number(d.reference_receipt_id),second=Number(d.newer_receipt_id),
time=dated(row.attempted_at),type=d.decision;
const expected=({record_sla_resolution:'owner_sla_resolution_recorded_694',
close_revalidated_provenance:'owner_master_provenance_closure_recorded_694',
accept_owner_continuity:'owner_acceptance_continuity_recorded_694'})[type];
const source=type==='record_sla_resolution'?resolutionById.get(ref):
type==='close_revalidated_provenance'?provenanceByKey.get(ref+'|'+second):
type==='accept_owner_continuity'?auditByReceipt.get(ref):null;
const sourceAt=dated(type==='record_sla_resolution'?source?.rechecked_at:
type==='close_revalidated_provenance'?source?.revalidated_at:source?.owner_accepted_at);
const paired=type==='record_sla_resolution'?!!source&&
source.case_id===d.case_id&&
source.linked_owner_acceptance_receipt_id===Number(d.linked_owner_acceptance_receipt_id)&&
!!source.linked_owner_acceptance_receipt_id:
type==='close_revalidated_provenance'?!!source&&d.case_id===null&&
Number(d.prior_revalidation_receipt_id)===source.review_receipt_id&&
!!source.review_receipt_id&&source.source_pins_match:
type==='accept_owner_continuity'?!!source&&
source.case_id===d.case_id&&
Number(d.prior_owner_audit_receipt_id)===source.prior_owner_audit_receipt_id:false;
const key=type+'|'+ref+'|'+(type==='close_revalidated_provenance'?second:0);
const valid=Number.isSafeInteger(id)&&id>0&&id>ref&&id<priorId&&
time!==null&&time<=priorTime&&sourceAt!==null&&time>=sourceAt&&
row.attempt_status===expected&&paired&&!seen.has(key)&&
historical.has(Number(d.master_receipt_id))&&Number(d.master_receipt_id)>0&&
d.fingerprint_sha256===current?.fingerprint_sha256&&
d.source_revision===current?.source_revision&&
d.owner_reviewed===true&&Number.isSafeInteger(Number(d.owner_user_id))&&
Number(d.owner_user_id)>0&&typeof d.resolution_note==='string'&&
d.resolution_note.length>=20&&d.resolution_note.length<=400;
if(valid)seen.add(key);else invalid++;
history.push({receipt_id:id,decision:type||null,reference_receipt_id:ref,
case_id:d.case_id||null,newer_receipt_id:Number.isSafeInteger(second)&&second>0?second:null,
recorded_at:row.attempted_at,master_receipt_id:Number(d.master_receipt_id)||null,
owner_user_id:Number(d.owner_user_id)||null,
state:valid?'OWNER_RESOLUTION_LEDGER_RECORDED_NOT_EXTERNAL_CERTIFICATION':'HOLD_OWNER_RESOLUTION_LEDGER_DRIFT'});
priorId=id;priorTime=time===null?-Infinity:time;
}
const done=decision=>new Set(history.filter(x=>x.decision===decision&&
x.state==='OWNER_RESOLUTION_LEDGER_RECORDED_NOT_EXTERNAL_CERTIFICATION')
.map(x=>x.reference_receipt_id+'|'+(decision==='close_revalidated_provenance'?x.newer_receipt_id:0)));
const doneSla=done('record_sla_resolution'),
doneProvenance=done('close_revalidated_provenance'),
doneAudit=done('accept_owner_continuity');
for(const x of resolution)x.owner_resolution_recorded=!!x.recheck_receipt_id&&
doneSla.has(x.recheck_receipt_id+'|0');
for(const x of provenance)x.owner_provenance_closure_recorded=
doneProvenance.has(x.older_receipt_id+'|'+x.newer_receipt_id);
for(const x of acceptedAudit)x.continuity_acknowledged=!!x.owner_acceptance_receipt_id&&
doneAudit.has(x.owner_acceptance_receipt_id+'|0');
const holdMismatch=provenance.filter(x=>!x.source_pins_match).length;
const unresolvedSla=resolution.filter(x=>x.eligible_for_owner_resolution&&!x.owner_resolution_recorded).length;
const unresolvedProvenance=provenance.filter(x=>x.eligible_for_owner_provenance_closure&&
!x.owner_provenance_closure_recorded).length;
const unresolvedContinuity=acceptedAudit.filter(x=>x.historically_accepted&&
!x.continuity_acknowledged).length;
const complete=selected&&bounded&&invalid===0;
return{status:!selected?'HOLD_SELECT_CAMPAIGN':!bounded||invalid?
'HOLD_OWNER_RESOLUTION_LEDGER_HISTORY':holdMismatch?
'HOLD_INDEPENDENT_PROVENANCE_EXCEPTION_CORRECTION':!signedNow?
'HOLD_FRESH_INDEPENDENT_MASTER_ACCEPTANCE':unresolvedSla?
'OWNER_FINANCIAL_SLA_RESOLUTION_REVIEW_REQUIRED':unresolvedProvenance?
'OWNER_INDEPENDENT_MASTER_PROVENANCE_CLOSURE_REVIEW_REQUIRED':unresolvedContinuity?
'OWNER_AUDIT_CONTINUITY_REVIEW_REQUIRED':'OWNER_RESOLUTION_LEDGER_REVIEW_ONLY',
campaign_queue_id:selected?n:null,observed_at:new Date(now).toISOString(),
history_complete:complete,
resolution:{record_count:resolution.length,pending_owner_resolution_count:unresolvedSla,
owner_resolved_count:resolution.filter(x=>x.owner_resolution_recorded).length,
items:resolution.slice(0,40),external_remediation_proven:false},
provenance:{source_exception_hold_count:holdMismatch,
eligible_owner_closure_count:provenance.filter(x=>x.eligible_for_owner_provenance_closure).length,
pending_owner_closure_count:unresolvedProvenance,
source_pinned_historical_receipt_count:historical.size,
current_independent_master_receipt_id:signedNow?masterId:null,
current_independently_verified:signedNow,
pairs:provenance.slice(0,40),historical_signatures_reverified:false,
external_source_correction_proven:false,recorded_gap_proves_outage:false},
owner_audit:{historical_acceptance_count:acceptedAudit.length,
pending_continuity_count:unresolvedContinuity,
owner_continuity_recorded_count:acceptedAudit.filter(x=>x.continuity_acknowledged).length,
history:acceptedAudit.slice(0,30)},
owner_resolution_history:history.slice(0,40),invalid_owner_history_count:invalid,
master_accepted_now:signedNow&&complete&&holdMismatch===0,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
financial_certified:false,auto_sla_resolution:false,
auto_master_provenance_closure:false,auto_owner_acceptance:false,
external_master_replay_performed:false};
}
async function finance694(db,env,id){
const n=Number(id);
if(!Number.isSafeInteger(n)||n<1)
return assessFinance694({queue_id:0},{history_complete:false},[]);
const current=await financial685(db,env,n),prior=await finance693(db,env,n);
const owner=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_resolution_694' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
return assessFinance694(current,prior,owner);
}
async function ownerResolution694(db,env,user,p){
const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
state=await finance694(db,env,n),decision=normalizeText(p.decision),
caseId=normalizeText(p.case_id)||null,ref=Number(p.reference_receipt_id),
second=Number(p.newer_receipt_id),note=normalizeText(p.resolution_note);
if(!current.queue_id||!state.history_complete||!state.master_accepted_now||
p.owner_reviewed!==true||!current.fingerprint_sha256||
p.expected_fingerprint_sha256!==current.fingerprint_sha256||
p.expected_source_revision!==current.source_revision||
Number(p.expected_master_receipt_id)!==current.verified_master_receipt_id||
!Number.isSafeInteger(ref)||ref<=0||note.length<20||note.length>400)
throw Error('Exact current independent Master acceptance, original source and substantial owner review required. HOLD.');
let match=null,status='',linkedAcceptance=null,revalidation=null,priorOwnerAudit=null;
if(decision==='record_sla_resolution'){
match=state.resolution.items.find(x=>x.case_id===caseId&&
x.recheck_receipt_id===ref&&x.eligible_for_owner_resolution&&
!x.owner_resolution_recorded);
linkedAcceptance=match?.linked_owner_acceptance_receipt_id||null;
status='owner_sla_resolution_recorded_694';
}else if(decision==='close_revalidated_provenance'){
match=state.provenance.pairs.find(x=>x.older_receipt_id===ref&&
x.newer_receipt_id===second&&x.eligible_for_owner_provenance_closure&&
!x.owner_provenance_closure_recorded);
revalidation=match?.review_receipt_id||null;
status='owner_master_provenance_closure_recorded_694';
}else if(decision==='accept_owner_continuity'){
match=state.owner_audit.history.find(x=>x.case_id===caseId&&
x.owner_acceptance_receipt_id===ref&&x.historically_accepted&&
!x.continuity_acknowledged);
priorOwnerAudit=match?.prior_owner_audit_receipt_id||null;
status='owner_acceptance_continuity_recorded_694';
}else throw Error('Unsupported Build 694 owner resolution decision. HOLD.');
if(!match)throw Error('Stale, missing, unpaired, already reviewed or unverified source evidence. HOLD.');
const payload={decision,case_id:decision==='close_revalidated_provenance'?null:caseId,
reference_receipt_id:ref,
newer_receipt_id:decision==='close_revalidated_provenance'?second:null,
linked_owner_acceptance_receipt_id:linkedAcceptance,
prior_revalidation_receipt_id:revalidation,prior_owner_audit_receipt_id:priorOwnerAudit,
master_receipt_id:current.verified_master_receipt_id,
fingerprint_sha256:current.fingerprint_sha256,source_revision:current.source_revision,
owner_user_id:user.user_id,owner_reviewed:true,resolution_note:note,
source_incident_repaired:false,financial_certified:false,
continuous_connection_verified:false,historical_signatures_reverified:false};
const nonce='finance694-'+decision+'-'+ref+
(decision==='close_revalidated_provenance'?'-'+second:'');
const receipt_id=await append684(db,user,n,'finance_owner_resolution_694',status,nonce,payload);
const after=await finance694(db,env,n);
if(!after.owner_resolution_history.some(x=>x.receipt_id===receipt_id&&
x.decision===decision&&x.reference_receipt_id===ref&&
x.state==='OWNER_RESOLUTION_LEDGER_RECORDED_NOT_EXTERNAL_CERTIFICATION'))
throw Error('Exact owner resolution not validated by durable protected readback. HOLD.');
return{status,receipt_id,reference_receipt_id:ref,case_id:caseId,
master_accepted_now:after.master_accepted_now,
external_remediation_proven:false,financial_certified:false,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}


// Build 695 — source-pinned resolution aging, unverified independent correction
// evidence intake, and fresh Master closure revalidation. No automatic repair.
export function assessFinance695(current,prior,ownerRows,now=Date.now()){
const n=Number(current?.queue_id),selected=Number.isSafeInteger(n)&&n>0;
const sourcePairs=prior?.provenance?.pairs||[],rows695=Array.isArray(ownerRows)?ownerRows:[],
bounded=!!prior?.history_complete&&rows695.length<=60;
const dated=x=>{const t=Date.parse(x||'');return Number.isFinite(t)&&t<=now+300000?t:null;};
const age=x=>{const t=dated(x);return t===null?null:Math.max(0,Math.floor((now-t)/60000));};
const currentMaster=Number(current?.verified_master_receipt_id);
const masterNow=!!prior?.master_accepted_now&&!!current?.master_fresh&&
Number.isSafeInteger(currentMaster)&&currentMaster>0&&
currentMaster===Number(prior?.provenance?.current_independent_master_receipt_id);
const resolution=(prior?.resolution?.items||[]).map(x=>{
const owner=prior.owner_resolution_history?.find(y=>y.decision==='record_sla_resolution'&&
y.reference_receipt_id===x.recheck_receipt_id&&
y.state==='OWNER_RESOLUTION_LEDGER_RECORDED_NOT_EXTERNAL_CERTIFICATION');
const since=age(owner?.recorded_at||x.rechecked_at);
return{case_id:x.case_id,source_recheck_receipt_id:x.recheck_receipt_id,
owner_resolution_receipt_id:owner?.receipt_id||null,
age_minutes:since,owner_followup_due:since!==null&&since>=120,
owner_followup_critical:since!==null&&since>=240,
owner_resolution_recorded:x.owner_resolution_recorded,
external_remediation_proven:false};
});
const closure=(sourcePairs||[]).map(x=>{
const owner=prior.owner_resolution_history?.find(y=>y.decision==='close_revalidated_provenance'&&
y.reference_receipt_id===x.older_receipt_id&&y.newer_receipt_id===x.newer_receipt_id&&
y.state==='OWNER_RESOLUTION_LEDGER_RECORDED_NOT_EXTERNAL_CERTIFICATION');
return{older_receipt_id:x.older_receipt_id,newer_receipt_id:x.newer_receipt_id,
original_owner_closure_receipt_id:owner?.receipt_id||null,
source_pins_match:x.source_pins_match,
current_independently_verified:masterNow,
eligible_for_master_revalidation:!!x.source_pins_match&&
!!x.owner_provenance_closure_recorded&&!!owner&&masterNow,
revalidated_for_current_master:false,
last_owner_revalidation_receipt_id:null,
original_source_correction_verified:false};
});
const pairByKey=new Map(closure.map(x=>[x.older_receipt_id+'|'+x.newer_receipt_id,x]));
const seen=new Set(),history=[];
let invalid=0,priorId=Infinity,priorTime=Infinity;
for(const row of rows695){
const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
ref=Number(d.reference_receipt_id),newer=Number(d.newer_receipt_id),
kind=d.decision,pair=pairByKey.get(ref+'|'+newer),time=dated(row.attempted_at),
priorClose=Number(d.prior_owner_closure_receipt_id),
intake=kind==='intake_source_correction',
recheck=kind==='revalidate_master_closure';
const externalObserved=dated(d.external_observed_at),note=d.resolution_note;
const digest=String(d.external_evidence_sha256||'');
const key=kind+'|'+ref+'|'+newer+'|'+(intake?digest:d.master_receipt_id);
const base=!!pair&&id>ref&&id>newer&&id<priorId&&time!==null&&
time<=priorTime&&row.attempt_status===(intake?
'owner_external_correction_intake_695':'owner_master_closure_revalidated_695')&&
!seen.has(key)&&d.fingerprint_sha256===current?.fingerprint_sha256&&
d.source_revision===current?.source_revision&&d.owner_reviewed===true&&
Number.isSafeInteger(Number(d.owner_user_id))&&Number(d.owner_user_id)>0&&
typeof note==='string'&&note.length>=20&&note.length<=400&&
d.external_source_repair_verified===false&&d.financial_certified===false;
const valid=base&&(intake?
/^[a-f0-9]{64}$/.test(digest)&&
/^[A-Za-z0-9][A-Za-z0-9_.:-]{7,119}$/.test(d.external_custodian_id||'')&&
/^[A-Za-z0-9][A-Za-z0-9_.:/#-]{7,159}$/.test(d.external_evidence_reference||'')&&
externalObserved!==null&&externalObserved<=time&&
d.independently_verified===false&&d.original_source_pins_match===false:
recheck&&pair.original_owner_closure_receipt_id===priorClose&&
priorClose>0&&priorClose<id&&Number.isSafeInteger(Number(d.master_receipt_id))&&
Number(d.master_receipt_id)>0&&
d.historical_signature_reverified===false);
if(valid)seen.add(key);else invalid++;
history.push({receipt_id:id,decision:kind||null,older_receipt_id:ref,
newer_receipt_id:newer,recorded_at:row.attempted_at,
master_receipt_id:Number(d.master_receipt_id)||null,
external_custodian_id:intake?d.external_custodian_id:null,
external_evidence_reference:intake?d.external_evidence_reference:null,
external_evidence_sha256:intake?digest:null,
external_observed_at:intake?d.external_observed_at:null,
prior_owner_closure_receipt_id:recheck?priorClose:null,
state:valid?(intake?'SOURCE_CORRECTION_EVIDENCE_INTAKE_UNVERIFIED':
'MASTER_CLOSURE_OWNER_REVALIDATION_RECORDED_NOT_EXTERNAL_REPAIR'):
'HOLD_FINANCIAL_695_HISTORY_DRIFT'});
priorId=id;priorTime=time===null?-Infinity:time;
}
for(const c of closure){
const found=history.find(x=>x.decision==='revalidate_master_closure'&&
x.older_receipt_id===c.older_receipt_id&&x.newer_receipt_id===c.newer_receipt_id&&
x.master_receipt_id===currentMaster&&
x.state==='MASTER_CLOSURE_OWNER_REVALIDATION_RECORDED_NOT_EXTERNAL_REPAIR');
c.revalidated_for_current_master=!!found&&c.eligible_for_master_revalidation;
c.last_owner_revalidation_receipt_id=found?.receipt_id||null;
}
const mismatch=closure.filter(x=>!x.source_pins_match);
const intake=history.filter(x=>x.state==='SOURCE_CORRECTION_EVIDENCE_INTAKE_UNVERIFIED');
const due=resolution.filter(x=>x.owner_followup_due);
const critical=resolution.filter(x=>x.owner_followup_critical);
const pending=closure.filter(x=>x.eligible_for_master_revalidation&&!x.revalidated_for_current_master);
const complete=selected&&bounded&&invalid===0;
return{status:!selected?'HOLD_SELECT_CAMPAIGN':!complete?
'HOLD_FINANCIAL_695_HISTORY_DRIFT':mismatch.length?
'HOLD_EXTERNAL_SOURCE_CORRECTION_VERIFICATION':!masterNow?
'HOLD_FRESH_INDEPENDENT_MASTER_ACCEPTANCE':critical.length?
'OWNER_FINANCIAL_LEDGER_CRITICAL_AGING_REVIEW':due.length?
'OWNER_FINANCIAL_LEDGER_AGING_REVIEW':pending.length?
'OWNER_MASTER_CLOSURE_REVALIDATION_REQUIRED':'OWNER_FINANCIAL_695_REVIEW_ONLY',
campaign_queue_id:selected?n:null,observed_at:new Date(now).toISOString(),
history_complete:complete,master_accepted_now:masterNow&&complete&&mismatch.length===0,
aging:{review_threshold_minutes:120,critical_threshold_minutes:240,
due_count:due.length,critical_count:critical.length,items:resolution.slice(0,40),
automatic_sla_closure:false},
source_correction:{mismatch_count:mismatch.length,
evidence_intake_count:intake.length,external_verification_count:0,
items:closure.filter(x=>!x.source_pins_match),
external_source_repair_verified:false,unverified_evidence_receipts:intake.slice(0,30)},
master_closure:{current_master_receipt_id:masterNow?currentMaster:null,
eligible_count:closure.filter(x=>x.eligible_for_master_revalidation).length,
pending_count:pending.length,
items:closure.slice(0,40),current_runtime_connection_verified:false,
historical_signature_reverified:false},
owner_evidence_history:history.slice(0,40),invalid_owner_history_count:invalid,
external_replay_performed:false,financial_certified:false,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}
async function finance695(db,env,id){
const n=Number(id);
if(!Number.isSafeInteger(n)||n<1)
return assessFinance695({queue_id:0},{history_complete:false},[]);
const current=await financial685(db,env,n),prior=await finance694(db,env,n);
const owner=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_review_695' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
return assessFinance695(current,prior,owner);
}
async function ownerReview695(db,env,user,p){
const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
report=await finance695(db,env,n),decision=normalizeText(p.decision),
ref=Number(p.reference_receipt_id),newer=Number(p.newer_receipt_id),
note=normalizeText(p.resolution_note);
if(!current.queue_id||!report.history_complete||p.owner_reviewed!==true||
!current.fingerprint_sha256||
p.expected_fingerprint_sha256!==current.fingerprint_sha256||
p.expected_source_revision!==current.source_revision||
!Number.isSafeInteger(ref)||ref<1||!Number.isSafeInteger(newer)||newer<1||
note.length<20||note.length>400)
throw Error('Original exact source, bounded ledger and explicit owner evidence review required. HOLD.');
let candidate=null,status='',extra={};
if(decision==='intake_source_correction'){
candidate=report.source_correction.items.find(x=>x.older_receipt_id===ref&&
x.newer_receipt_id===newer&&!x.source_pins_match);
const custodian=normalizeText(p.external_custodian_id),
reference=normalizeText(p.external_evidence_reference),
digest=normalizeText(p.external_evidence_sha256).toLowerCase(),
observed=normalizeText(p.external_observed_at),t=Date.parse(observed);
if(!candidate||!/^[A-Za-z0-9][A-Za-z0-9_.:-]{7,119}$/.test(custodian)||
!/^[A-Za-z0-9][A-Za-z0-9_.:/#-]{7,159}$/.test(reference)||
!/^[a-f0-9]{64}$/.test(digest)||!Number.isFinite(t)||
t>Date.now()+300000)
throw Error('Original mismatched pair and bounded external custodian, reference, SHA-256 and observed time required. HOLD.');
status='owner_external_correction_intake_695';
extra={external_custodian_id:custodian,external_evidence_reference:reference,
external_evidence_sha256:digest,external_observed_at:observed,
original_source_pins_match:false,independently_verified:false};
}else if(decision==='revalidate_master_closure'){
candidate=report.master_closure.items.find(x=>x.older_receipt_id===ref&&
x.newer_receipt_id===newer&&x.eligible_for_master_revalidation&&
!x.revalidated_for_current_master);
if(!candidate||!report.master_accepted_now||
Number(p.expected_master_receipt_id)!==current.verified_master_receipt_id||
Number(p.expected_prior_closure_receipt_id)!==candidate.original_owner_closure_receipt_id)
throw Error('Fresh independently accepted Master and exact prior owner closure required; source mismatch HOLD.');
status='owner_master_closure_revalidated_695';
extra={prior_owner_closure_receipt_id:candidate.original_owner_closure_receipt_id,
historical_signature_reverified:false};
}else throw Error('Unsupported Build 695 financial review decision. HOLD.');
if(!candidate)throw Error('Original correction exception or unreviewed Master closure not found. HOLD.');
const payload={decision,reference_receipt_id:ref,newer_receipt_id:newer,
master_receipt_id:decision==='revalidate_master_closure'?current.verified_master_receipt_id:null,
fingerprint_sha256:current.fingerprint_sha256,source_revision:current.source_revision,
owner_user_id:user.user_id,owner_reviewed:true,resolution_note:note,
external_source_repair_verified:false,financial_certified:false,
...extra};
const nonce='finance695-'+n+'-'+decision+'-'+ref+'-'+newer+'-'+
(decision==='intake_source_correction'?extra.external_evidence_sha256:current.verified_master_receipt_id);
const receipt_id=await append684(db,user,n,'finance_owner_review_695',status,nonce,payload);
const after=await finance695(db,env,n);
if(!after.owner_evidence_history.some(x=>x.receipt_id===receipt_id&&
x.state===(decision==='intake_source_correction'?
'SOURCE_CORRECTION_EVIDENCE_INTAKE_UNVERIFIED':
'MASTER_CLOSURE_OWNER_REVALIDATION_RECORDED_NOT_EXTERNAL_REPAIR')))
throw Error('Durable protected Build 695 owner receipt readback not verified. HOLD.');
return{status,receipt_id,original_source_repair_verified:false,
master_accepted_now:after.master_accepted_now,financial_certified:false,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}


// Build 696: independent Ed25519 custodian *attestation* verification. The
// signature proves who signed the exact intake, NOT that a mismatched source
// has been repaired. Owner escalation and Master continuity remain separate.
export function claim696(c){
return{v:1,purpose:'devilndove_finance_correction_attestation_696',source:'devilndove',
queue_id:c.queue_id,reference_receipt_id:c.reference_receipt_id,
newer_receipt_id:c.newer_receipt_id,original_intake_receipt_id:c.original_intake_receipt_id,
external_evidence_sha256:c.external_evidence_sha256,
external_custodian_id:c.external_custodian_id,
fingerprint_sha256:c.fingerprint_sha256,source_revision:c.source_revision,
signer_id:c.signer_id,nonce:c.nonce,issued_at:c.issued_at,
decision:'source_correction_evidence_authenticated'};
}
export async function assessFinance696(current,prior,ownerRows,signer={},now=Date.now()){
const n=Number(current?.queue_id),selected=Number.isSafeInteger(n)&&n>0;
const rows696=Array.isArray(ownerRows)?ownerRows:[],
bounded=!!prior?.history_complete&&rows696.length<=60;
const validDate=t=>utcAttemptTime698(t,now);
const age=t=>{const i=validDate(t);return i===null?null:Math.max(0,Math.floor((now-i)/60000));};
const masterId=Number(current?.verified_master_receipt_id);
const masterNow=!!current?.master_fresh&&!!prior?.master_accepted_now&&
Number.isSafeInteger(masterId)&&masterId>0&&
masterId===Number(prior?.master_closure?.current_master_receipt_id);
const intakes=(prior?.source_correction?.unverified_evidence_receipts||[]).filter(x=>
x.state==='SOURCE_CORRECTION_EVIDENCE_INTAKE_UNVERIFIED'&&
Number.isSafeInteger(Number(x.receipt_id))&&Number(x.receipt_id)>0);
const mismatch=(prior?.source_correction?.items||[]).filter(x=>!x.source_pins_match);
const mismatchKeys=new Set(mismatch.map(x=>x.older_receipt_id+'|'+x.newer_receipt_id));
const issues=(prior?.aging?.items||[]).filter(x=>x.owner_followup_due).map(x=>({
case_id:x.case_id,original_resolution_receipt_id:Number(x.owner_resolution_receipt_id||x.source_recheck_receipt_id),
age_minutes:age((prior?.owner_evidence_history||[]).find(y=>
y.receipt_id===x.owner_resolution_receipt_id)?.recorded_at)||x.age_minutes,
critical:x.owner_followup_critical===true,
escalation_recorded:false,owner_escalation_receipt_id:null,
original_remediation_proven:false}));
const dueMap=new Map(issues.map(x=>[x.case_id+'|'+x.original_resolution_receipt_id,x]));
const closures=(prior?.master_closure?.items||[]).map(x=>({
older_receipt_id:x.older_receipt_id,newer_receipt_id:x.newer_receipt_id,
prior_owner_closure_receipt_id:Number(x.original_owner_closure_receipt_id)||null,
prior_master_revalidation_receipt_id:Number(x.last_owner_revalidation_receipt_id)||null,
current_master_receipt_id:masterNow?masterId:null,
eligible_for_continuity:!!x.source_pins_match&&!!x.revalidated_for_current_master&&
!!x.last_owner_revalidation_receipt_id&&masterNow,
current_master_continuity_recorded:false,continuity_receipt_id:null,
external_source_repair_proven:false}));
const closureMap=new Map(closures.map(x=>[x.older_receipt_id+'|'+x.newer_receipt_id,x]));
let invalid=0,lastId=Infinity,lastTime=Infinity;
const history=[],seen=new Set();
for(const row of rows696){
const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
type=d.decision,ref=Number(d.reference_receipt_id),
newer=Number(d.newer_receipt_id),time=validDate(row.attempted_at),
key=type+'|'+ref+'|'+newer+'|'+(d.original_intake_receipt_id||d.case_id||d.master_receipt_id||'');
const expected=({verify_correction_attestation:'independent_correction_signature_verified_696',
escalate_aging_followup:'owner_aging_escalation_followup_recorded_696',
recheck_master_continuity:'owner_master_continuity_rechecked_696'})[type];
const base=Number.isSafeInteger(id)&&id>0&&id<lastId&&time!==null&&
time<=lastTime&&!seen.has(key)&&row.attempt_status===expected&&
d.fingerprint_sha256===current?.fingerprint_sha256&&
d.source_revision===current?.source_revision&&d.owner_reviewed===true&&
Number.isSafeInteger(Number(d.owner_user_id))&&Number(d.owner_user_id)>0&&
typeof d.resolution_note==='string'&&d.resolution_note.length>=20&&
d.resolution_note.length<=400&&d.financial_certified===false&&
d.continuous_connection_verified===false&&d.external_source_repair_proven===false;
let signed=false,paired=false;
if(type==='verify_correction_attestation'){
const intake=intakes.find(x=>x.receipt_id===Number(d.original_intake_receipt_id));
const pairKey=ref+'|'+newer,issued=validDate(d.issued_at);
paired=!!intake&&intake.older_receipt_id===ref&&intake.newer_receipt_id===newer&&
mismatchKeys.has(pairKey)&&id>Number(intake.receipt_id)&&
d.external_evidence_sha256===intake.external_evidence_sha256&&
d.external_custodian_id===intake.external_custodian_id&&
d.signer_id===signer.id&&typeof signer.key==='string'&&
/^[A-Za-z0-9_-]{16,100}$/.test(d.nonce||'')&&
issued!==null&&issued<=time&&time-issued<=1200000&&
/^[A-Za-z0-9+/_=-]{80,120}$/.test(d.signature||'');
if(paired) signed=await verify684(signer.key,claim696({
queue_id:n,reference_receipt_id:ref,newer_receipt_id:newer,
original_intake_receipt_id:Number(d.original_intake_receipt_id),
external_evidence_sha256:d.external_evidence_sha256,
external_custodian_id:d.external_custodian_id,
fingerprint_sha256:current.fingerprint_sha256,
source_revision:current.source_revision,signer_id:d.signer_id,
nonce:d.nonce,issued_at:d.issued_at
}),d.signature);
paired=paired&&signed;
}else if(type==='escalate_aging_followup'){
const candidate=dueMap.get(d.case_id+'|'+ref);
paired=!!candidate&&candidate.age_minutes!==null&&candidate.age_minutes>=120&&
newer===0&&Number(d.original_resolution_receipt_id)===ref&&id>ref&&
d.external_correction_verified===false;
}else if(type==='recheck_master_continuity'){
const candidate=closureMap.get(ref+'|'+newer);
paired=!!candidate&&candidate.eligible_for_continuity&&
candidate.prior_master_revalidation_receipt_id===Number(d.prior_master_revalidation_receipt_id)&&
Number(d.master_receipt_id)>0&&
Number(d.master_receipt_id)===masterId&&
id>Number(candidate.prior_master_revalidation_receipt_id)&&
d.historical_signatures_reverified===false;
}
const valid=base&&paired;
if(valid)seen.add(key);else invalid++;
history.push({receipt_id:id,decision:type||null,reference_receipt_id:ref,
newer_receipt_id:newer,case_id:d.case_id||null,
original_intake_receipt_id:Number(d.original_intake_receipt_id)||null,
original_resolution_receipt_id:Number(d.original_resolution_receipt_id)||null,
prior_master_revalidation_receipt_id:Number(d.prior_master_revalidation_receipt_id)||null,
master_receipt_id:Number(d.master_receipt_id)||null,recorded_at:row.attempted_at,
external_custodian_signature_verified:!!(valid&&signed),
state:!valid?'HOLD_FINANCIAL_696_EVIDENCE_DRIFT':
type==='verify_correction_attestation'?'EXTERNAL_CUSTODIAN_SIGNATURE_VERIFIED_SOURCE_MISMATCH_HOLD':
type==='escalate_aging_followup'?'OWNER_AGING_ESCALATION_RECORDED_NO_REMEDIATION':
'OWNER_MASTER_CONTINUITY_RECHECKED_CURRENT_RECEIPT_ONLY'});
lastId=id;lastTime=time===null?-Infinity:time;
}
for(const x of issues){
const match=history.find(h=>h.decision==='escalate_aging_followup'&&
h.case_id===x.case_id&&h.reference_receipt_id===x.original_resolution_receipt_id&&
h.state==='OWNER_AGING_ESCALATION_RECORDED_NO_REMEDIATION');
x.escalation_recorded=!!match;x.owner_escalation_receipt_id=match?.receipt_id||null;
}
for(const x of closures){
const match=history.find(h=>h.decision==='recheck_master_continuity'&&
h.reference_receipt_id===x.older_receipt_id&&h.newer_receipt_id===x.newer_receipt_id&&
h.master_receipt_id===masterId&&
h.state==='OWNER_MASTER_CONTINUITY_RECHECKED_CURRENT_RECEIPT_ONLY');
x.current_master_continuity_recorded=!!match&&x.eligible_for_continuity;
x.continuity_receipt_id=match?.receipt_id||null;
}
const signedHistory=history.filter(x=>x.external_custodian_signature_verified);
const pendingAging=issues.filter(x=>!x.escalation_recorded);
const pendingMaster=closures.filter(x=>x.eligible_for_continuity&&!x.current_master_continuity_recorded);
const complete=selected&&bounded&&invalid===0;
return{status:!selected?'HOLD_SELECT_CAMPAIGN':!complete?
'HOLD_FINANCIAL_696_EVIDENCE_DRIFT':mismatch.length?
'HOLD_INDEPENDENT_SOURCE_CORRECTION_RECONCILIATION':!masterNow?
'HOLD_CURRENT_INDEPENDENT_MASTER_PROOF':pendingAging.length?
'OWNER_FINANCIAL_AGING_ESCALATION_FOLLOWUP_REQUIRED':pendingMaster.length?
'OWNER_MASTER_CLOSURE_CONTINUITY_RECHECK_REQUIRED':'OWNER_FINANCIAL_696_REVIEW_ONLY',
campaign_queue_id:selected?n:null,observed_at:new Date(now).toISOString(),history_complete:complete,
source_verification:{original_mismatch_count:mismatch.length,
unverified_intake_count:intakes.length,unverified_intakes:intakes.slice(0,30),
expected_signer_id:signer.id||null,signer_configured:!!signer.id&&!!signer.key,
authenticated_custodian_signature_count:signedHistory.length,
original_mismatch_items:mismatch.slice(0,40),
verified_attestations:signedHistory.slice(0,30),
original_source_repair_verified:false,independent_reconciliation_proven:false},
aging:{pending_escalation_count:pendingAging.length,
recorded_escalation_count:issues.filter(x=>x.escalation_recorded).length,
items:issues.slice(0,40),automatic_remediation:false},
master_closure:{current_independent_master_receipt_id:masterNow?masterId:null,
eligible_continuity_count:closures.filter(x=>x.eligible_for_continuity).length,
pending_continuity_count:pendingMaster.length,
items:closures.slice(0,40),historical_signatures_reverified:false},
owner_history:history.slice(0,40),invalid_owner_history_count:invalid,
master_accepted_now:complete&&masterNow&&mismatch.length===0,
source_mismatch_cleared:false,financial_certified:false,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
external_replay_performed:false};
}
async function finance696(db,env,id){
const n=Number(id);
if(!Number.isSafeInteger(n)||n<1)
return await assessFinance696({queue_id:0},{history_complete:false},[],{});
const current=await financial685(db,env,n),prior=await finance695(db,env,n);
const rows696=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_review_696' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
return await assessFinance696(current,prior,rows696,{
id:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_SIGNER_ID_696),
key:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_CUSTODIAN_PUBLIC_KEY_696)});
}
async function ownerReview696(db,env,user,p){
const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
state=await finance696(db,env,n),prior=await finance695(db,env,n),
decision=normalizeText(p.decision),ref=Number(p.reference_receipt_id),
newer=Number(p.newer_receipt_id||0),note=normalizeText(p.resolution_note);
if(!current.queue_id||!state.history_complete||!prior.history_complete||
p.owner_reviewed!==true||p.expected_fingerprint_sha256!==current.fingerprint_sha256||
p.expected_source_revision!==current.source_revision||
!Number.isSafeInteger(ref)||ref<1||note.length<20||note.length>400)
throw Error('Exact original source, bounded owner history and substantial review required. HOLD.');
let status='',extra={},candidate=null;
if(decision==='verify_correction_attestation'){
const intakeId=Number(p.original_intake_receipt_id);
candidate=prior.source_correction.unverified_evidence_receipts.find(x=>x.receipt_id===intakeId&&
x.older_receipt_id===ref&&x.newer_receipt_id===newer&&
x.state==='SOURCE_CORRECTION_EVIDENCE_INTAKE_UNVERIFIED'&&
prior.source_correction.items.some(y=>y.older_receipt_id===ref&&
y.newer_receipt_id===newer&&!y.source_pins_match));
const signerId=normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_SIGNER_ID_696),
pub=normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_CUSTODIAN_PUBLIC_KEY_696),
claim={queue_id:n,reference_receipt_id:ref,newer_receipt_id:newer,
original_intake_receipt_id:intakeId,external_evidence_sha256:candidate?.external_evidence_sha256,
external_custodian_id:candidate?.external_custodian_id,
fingerprint_sha256:current.fingerprint_sha256,source_revision:current.source_revision,
signer_id:normalizeText(p.signer_id),nonce:normalizeText(p.nonce),
issued_at:normalizeText(p.issued_at)};
const signature=normalizeText(p.signature);
if(!candidate||!signerId||claim.signer_id!==signerId||
!nonce684(claim.nonce)||!fresh684(claim.issued_at,1200000)||
!/^[A-Za-z0-9+/_=-]{80,120}$/.test(signature)||
!await verify684(pub,claim696(claim),signature))
throw Error('External custodian Ed25519 signature, exact original intake and fresh bounded claim not independently verified. HOLD.');
status='independent_correction_signature_verified_696';
extra={...claim,signature};
}else if(decision==='escalate_aging_followup'){
const caseId=normalizeText(p.case_id);
candidate=state.aging.items.find(x=>x.case_id===caseId&&
x.original_resolution_receipt_id===ref&&x.age_minutes>=120&&
!x.escalation_recorded);
if(!candidate||newer!==0)throw Error('Exact aged owner resolution not eligible or already escalated. HOLD.');
status='owner_aging_escalation_followup_recorded_696';
extra={case_id:caseId,original_resolution_receipt_id:ref,
external_correction_verified:false};
}else if(decision==='recheck_master_continuity'){
candidate=state.master_closure.items.find(x=>x.older_receipt_id===ref&&
x.newer_receipt_id===newer&&x.eligible_for_continuity&&
!x.current_master_continuity_recorded);
if(!candidate||!state.master_accepted_now||
Number(p.expected_master_receipt_id)!==current.verified_master_receipt_id||
Number(p.prior_master_revalidation_receipt_id)!==candidate.prior_master_revalidation_receipt_id)
throw Error('Current independently signed Master and exact original closure revalidation required. HOLD.');
status='owner_master_continuity_rechecked_696';
extra={prior_master_revalidation_receipt_id:candidate.prior_master_revalidation_receipt_id,
master_receipt_id:current.verified_master_receipt_id,
historical_signatures_reverified:false};
}else throw Error('Unsupported Build 696 owner review decision. HOLD.');
if(!candidate)throw Error('Original source/owner witness unavailable. HOLD.');
const payload={decision,reference_receipt_id:ref,newer_receipt_id:newer,
fingerprint_sha256:current.fingerprint_sha256,source_revision:current.source_revision,
owner_user_id:user.user_id,owner_reviewed:true,resolution_note:note,
financial_certified:false,continuous_connection_verified:false,
external_source_repair_proven:false,...extra};
const nonce='finance696-'+n+'-'+decision+'-'+ref+'-'+newer+'-'+
(decision==='verify_correction_attestation'?extra.original_intake_receipt_id:
decision==='escalate_aging_followup'?extra.case_id:extra.master_receipt_id);
const receipt_id=await append684(db,user,n,'finance_owner_review_696',status,nonce,payload);
const after=await finance696(db,env,n);
const accepted=after.owner_history.some(x=>x.receipt_id===receipt_id&&
x.state!=='HOLD_FINANCIAL_696_EVIDENCE_DRIFT'&&x.decision===decision);
if(!accepted)throw Error('Durable original custodian or owner continuity readback failed. HOLD.');
return{status,receipt_id,external_source_repair_verified:false,
financial_certified:false,master_accepted_now:after.master_accepted_now,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}


// Build 697 — independent second-party reconciliation of authenticated evidence,
// owner SLA escalation resolution review, and fresh Master attestation continuity.
// Independent signature attests evidence correlation only; actual source repair is HOLD.
export function claim697(c){
return{v:1,purpose:'devilndove_finance_independent_reconciliation_697',source:'devilndove',
queue_id:c.queue_id,older_receipt_id:c.older_receipt_id,
newer_receipt_id:c.newer_receipt_id,
custodian_attestation_receipt_id:c.custodian_attestation_receipt_id,
fingerprint_sha256:c.fingerprint_sha256,source_revision:c.source_revision,
reconciler_id:c.reconciler_id,nonce:c.nonce,issued_at:c.issued_at,
decision:'evidence_pair_reconciled_not_source_repair'};
}
export async function assessFinance697(current,prior,reviewRows,signer={},now=Date.now()){
const n=Number(current?.queue_id),selected=Number.isSafeInteger(n)&&n>0;
const rows697=Array.isArray(reviewRows)?reviewRows:[],bounded=!!prior?.history_complete&&rows697.length<=60;
const validDate=t=>utcAttemptTime698(t,now);
const currentMasterId=Number(current?.verified_master_receipt_id);
const currentMaster=!!current?.master_fresh&&!!prior?.master_accepted_now&&
Number.isSafeInteger(currentMasterId)&&currentMasterId>0&&
currentMasterId===Number(prior?.master_closure?.current_independent_master_receipt_id);
const pairSet=new Set((prior?.source_verification?.original_mismatch_items||[])
.map(x=>x.older_receipt_id+'|'+x.newer_receipt_id));
const verified=(prior?.source_verification?.verified_attestations||[]).filter(x=>
x.external_custodian_signature_verified===true&&
x.state==='EXTERNAL_CUSTODIAN_SIGNATURE_VERIFIED_SOURCE_MISMATCH_HOLD'&&
pairSet.has(x.reference_receipt_id+'|'+x.newer_receipt_id));
const attestations=verified.map(x=>({
custodian_attestation_receipt_id:Number(x.receipt_id),
older_receipt_id:x.reference_receipt_id,newer_receipt_id:x.newer_receipt_id,
independent_reconciliation_recorded:false,reconciliation_receipt_id:null,
source_repair_proven:false}));
const correctionMap=new Map(attestations.map(x=>[x.older_receipt_id+'|'+x.newer_receipt_id+'|'+x.custodian_attestation_receipt_id,x]));
const cases=(prior?.aging?.items||[]).filter(x=>x.escalation_recorded&&
Number.isSafeInteger(Number(x.owner_escalation_receipt_id))&&Number(x.owner_escalation_receipt_id)>0)
.map(x=>({case_id:x.case_id,original_resolution_receipt_id:x.original_resolution_receipt_id,
escalation_receipt_id:x.owner_escalation_receipt_id,
critical:x.critical===true,owner_review_recorded:false,owner_review_receipt_id:null,
underlying_financial_incident_resolved:false}));
const caseMap=new Map(cases.map(x=>[x.case_id+'|'+x.escalation_receipt_id,x]));
const master=(prior?.master_closure?.items||[]).map(x=>({
older_receipt_id:x.older_receipt_id,newer_receipt_id:x.newer_receipt_id,
prior_continuity_receipt_id:Number(x.continuity_receipt_id)||null,
current_master_receipt_id:currentMaster?currentMasterId:null,
eligible_for_renewal:!!x.current_master_continuity_recorded&&
!!x.continuity_receipt_id&&currentMaster,
renewal_review_recorded:false,renewal_receipt_id:null,
new_external_attestation_minted:false}));
const masterMap=new Map(master.map(x=>[x.older_receipt_id+'|'+x.newer_receipt_id,x]));
const signedKey=typeof signer.key==='string'&&signer.key.length>0&&
typeof signer.id==='string'&&signer.id.length>0&&
typeof signer.custodianId==='string'&&signer.custodianId.length>0&&
typeof signer.custodianKey==='string'&&signer.custodianKey.length>0&&
signer.id!==signer.custodianId&&signer.key!==signer.custodianKey;
let invalid=0,lastId=Infinity,lastTime=Infinity;const history=[],seen=new Set();
for(const row of rows697){
const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
decision=d.decision,ref=Number(d.reference_receipt_id),newer=Number(d.newer_receipt_id),
time=validDate(row.attempted_at),related=Number(d.prior_receipt_id);
const key=decision+'|'+ref+'|'+newer+'|'+related+'|'+(d.case_id||'');
const expected=({reconcile_correction_evidence:'independent_evidence_reconciliation_attested_697',
review_escalation_resolution:'owner_escalation_resolution_review_recorded_697',
renew_master_attestation:'owner_master_attestation_renewal_reviewed_697'})[decision];
const base=Number.isSafeInteger(id)&&id>0&&id<lastId&&
time!==null&&time<=lastTime&&!seen.has(key)&&row.attempt_status===expected&&
d.fingerprint_sha256===current?.fingerprint_sha256&&
d.source_revision===current?.source_revision&&d.owner_reviewed===true&&
Number.isSafeInteger(Number(d.owner_user_id))&&Number(d.owner_user_id)>0&&
typeof d.resolution_note==='string'&&d.resolution_note.length>=20&&
d.resolution_note.length<=400&&d.source_repair_verified===false&&
d.financial_certified===false&&d.continuous_connection_verified===false;
let paired=false,signatureVerified=false;
if(decision==='reconcile_correction_evidence'){
const witness=correctionMap.get(ref+'|'+newer+'|'+related),
issued=validDate(d.issued_at);
paired=!!witness&&id>related&&!!signedKey&&d.reconciler_id===signer.id&&
/^[A-Za-z0-9_-]{16,100}$/.test(d.nonce||'')&&
issued!==null&&issued<=time&&time-issued<=1200000&&
/^[A-Za-z0-9+/_=-]{80,120}$/.test(d.signature||'');
if(paired)signatureVerified=await verify684(signer.key,claim697({
queue_id:n,older_receipt_id:ref,newer_receipt_id:newer,
custodian_attestation_receipt_id:related,
fingerprint_sha256:current.fingerprint_sha256,source_revision:current.source_revision,
reconciler_id:d.reconciler_id,nonce:d.nonce,issued_at:d.issued_at}),d.signature);
paired=paired&&signatureVerified;
}else if(decision==='review_escalation_resolution'){
const issue=caseMap.get(d.case_id+'|'+related);
paired=!!issue&&newer===0&&ref===Number(issue.original_resolution_receipt_id)&&
id>related&&['follow_up_required','owner_evidence_reviewed'].includes(d.disposition)&&
d.external_remediation_verified===false;
}else if(decision==='renew_master_attestation'){
const candidate=masterMap.get(ref+'|'+newer);
paired=!!candidate&&candidate.eligible_for_renewal&&
candidate.prior_continuity_receipt_id===related&&
id>related&&Number(d.master_receipt_id)===currentMasterId&&
d.historical_signatures_reverified===false&&
d.new_external_master_attestation_minted===false;
}
const valid=base&&paired;
if(valid)seen.add(key);else invalid++;
history.push({receipt_id:id,decision:decision||null,reference_receipt_id:ref,
newer_receipt_id:newer,prior_receipt_id:related,case_id:d.case_id||null,
disposition:d.disposition||null,master_receipt_id:Number(d.master_receipt_id)||null,
recorded_at:row.attempted_at,independent_reconciler_signature_verified:!!(valid&&signatureVerified),
state:!valid?'HOLD_FINANCIAL_697_EVIDENCE_DRIFT':
decision==='reconcile_correction_evidence'?
'INDEPENDENT_EVIDENCE_RECONCILIATION_ATTESTED_SOURCE_REPAIR_HOLD':
decision==='review_escalation_resolution'?
'OWNER_ESCALATION_RESOLUTION_REVIEWED_EXTERNAL_REMEDIATION_HOLD':
'OWNER_MASTER_RENEWAL_CONTINUITY_RECORDED_NO_NEW_EXTERNAL_SIGNATURE'});
lastId=id;lastTime=time===null?-Infinity:time;
}
for(const x of attestations){
const h=history.find(y=>y.decision==='reconcile_correction_evidence'&&
y.reference_receipt_id===x.older_receipt_id&&y.newer_receipt_id===x.newer_receipt_id&&
y.prior_receipt_id===x.custodian_attestation_receipt_id&&
y.independent_reconciler_signature_verified);
x.independent_reconciliation_recorded=!!h;
x.reconciliation_receipt_id=h?.receipt_id||null;
}
for(const x of cases){
const h=history.find(y=>y.decision==='review_escalation_resolution'&&
y.case_id===x.case_id&&y.prior_receipt_id===x.escalation_receipt_id&&
y.state==='OWNER_ESCALATION_RESOLUTION_REVIEWED_EXTERNAL_REMEDIATION_HOLD');
x.owner_review_recorded=!!h;x.owner_review_receipt_id=h?.receipt_id||null;
}
for(const x of master){
const h=history.find(y=>y.decision==='renew_master_attestation'&&
y.reference_receipt_id===x.older_receipt_id&&y.newer_receipt_id===x.newer_receipt_id&&
y.prior_receipt_id===x.prior_continuity_receipt_id&&
y.master_receipt_id===currentMasterId&&
y.state==='OWNER_MASTER_RENEWAL_CONTINUITY_RECORDED_NO_NEW_EXTERNAL_SIGNATURE');
x.renewal_review_recorded=!!h&&x.eligible_for_renewal;
x.renewal_receipt_id=h?.receipt_id||null;
}
const mismatchCount=pairSet.size,complete=selected&&bounded&&invalid===0;
const pendingEvidence=attestations.filter(x=>!x.independent_reconciliation_recorded).length,
pendingAging=cases.filter(x=>!x.owner_review_recorded).length,
pendingMaster=master.filter(x=>x.eligible_for_renewal&&!x.renewal_review_recorded).length;
return{status:!selected?'HOLD_SELECT_CAMPAIGN':!complete?
'HOLD_FINANCIAL_697_EVIDENCE_DRIFT':mismatchCount?
'HOLD_ORIGINAL_SOURCE_REPAIR_UNVERIFIED':!currentMaster?
'HOLD_FRESH_INDEPENDENT_MASTER_ATTESTATION':pendingAging?
'OWNER_FINANCIAL_ESCALATION_RESOLUTION_REVIEW_REQUIRED':pendingMaster?
'OWNER_MASTER_ATTESTATION_RENEWAL_REVIEW_REQUIRED':'OWNER_FINANCIAL_697_REVIEW_ONLY',
campaign_queue_id:selected?n:null,history_complete:complete,observed_at:new Date(now).toISOString(),
reconciliation:{original_mismatch_count:mismatchCount,
verified_custodian_attestation_count:verified.length,
independently_reconciled_count:attestations.filter(x=>x.independent_reconciliation_recorded).length,
pending_reconciliation_count:pendingEvidence,signer_configured:!!signedKey,
expected_reconciler_id:signer.id||null,items:attestations.slice(0,40),
independent_source_repair_verified:false},
aging:{owner_escalation_count:cases.length,pending_resolution_review_count:pendingAging,
recorded_resolution_review_count:cases.length-pendingAging,items:cases.slice(0,40),
automatic_incident_resolution:false},
master:{current_independent_master_receipt_id:currentMaster?currentMasterId:null,
eligible_renewal_count:master.filter(x=>x.eligible_for_renewal).length,
pending_renewal_review_count:pendingMaster,items:master.slice(0,40),
new_external_attestation_minted:false,historical_signatures_reverified:false},
owner_evidence_history:history.slice(0,40),invalid_owner_history_count:invalid,
master_accepted_now:complete&&currentMaster&&mismatchCount===0,
original_source_repair_verified:false,financial_certified:false,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',external_replay_performed:false};
}
async function finance697(db,env,id){
const n=Number(id);
if(!Number.isSafeInteger(n)||n<1)
return await assessFinance697({queue_id:0},{history_complete:false},[],{});
const current=await financial685(db,env,n),prior=await finance696(db,env,n);
const owner=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_review_697' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
return await assessFinance697(current,prior,owner,{
id:normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_SIGNER_ID_697),
key:normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_PUBLIC_KEY_697),
custodianId:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_SIGNER_ID_696),
custodianKey:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_CUSTODIAN_PUBLIC_KEY_696)});
}
async function ownerReview697(db,env,user,p){
const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
report=await finance697(db,env,n),decision=normalizeText(p.decision),
ref=Number(p.reference_receipt_id),newer=Number(p.newer_receipt_id||0),
related=Number(p.prior_receipt_id),note=normalizeText(p.resolution_note);
if(!current.queue_id||!report.history_complete||p.owner_reviewed!==true||
p.expected_fingerprint_sha256!==current.fingerprint_sha256||
p.expected_source_revision!==current.source_revision||
!Number.isSafeInteger(ref)||ref<1||!Number.isSafeInteger(related)||related<1||
note.length<20||note.length>400)
throw Error('Current exact source, original evidence and explicit owner review required. HOLD.');
let candidate=null,status='',extra={};
if(decision==='reconcile_correction_evidence'){
candidate=report.reconciliation.items.find(x=>x.older_receipt_id===ref&&
x.newer_receipt_id===newer&&x.custodian_attestation_receipt_id===related&&
!x.independent_reconciliation_recorded);
const signerId=normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_SIGNER_ID_697),
signerKey=normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_PUBLIC_KEY_697),
custodianId=normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_SIGNER_ID_696),
custodianKey=normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_CUSTODIAN_PUBLIC_KEY_696);
const claim={queue_id:n,older_receipt_id:ref,newer_receipt_id:newer,
custodian_attestation_receipt_id:related,fingerprint_sha256:current.fingerprint_sha256,
source_revision:current.source_revision,reconciler_id:normalizeText(p.reconciler_id),
nonce:normalizeText(p.nonce),issued_at:normalizeText(p.issued_at)},
signature=normalizeText(p.signature);
if(!candidate||!report.reconciliation.signer_configured||!signerId||
claim.reconciler_id!==signerId||signerId===custodianId||
signerKey===custodianKey||!nonce684(claim.nonce)||
!fresh684(claim.issued_at,1200000)||
!/^[A-Za-z0-9+/_=-]{80,120}$/.test(signature)||
!await verify684(signerKey,claim697(claim),signature))
throw Error('Distinct independent reconciler Ed25519 signature must authenticate exact Build 696 custodian receipt; mismatch remains HOLD.');
status='independent_evidence_reconciliation_attested_697';
extra={...claim,signature};
}else if(decision==='review_escalation_resolution'){
const caseId=normalizeText(p.case_id),disposition=normalizeText(p.disposition);
candidate=report.aging.items.find(x=>x.case_id===caseId&&
Number(x.original_resolution_receipt_id)===ref&&
Number(x.escalation_receipt_id)===related&&!x.owner_review_recorded);
if(!candidate||newer!==0||
!['follow_up_required','owner_evidence_reviewed'].includes(disposition))
throw Error('Original escalated owner evidence, pending review and non-closure disposition required. HOLD.');
status='owner_escalation_resolution_review_recorded_697';
extra={case_id:caseId,disposition,external_remediation_verified:false};
}else if(decision==='renew_master_attestation'){
candidate=report.master.items.find(x=>x.older_receipt_id===ref&&
x.newer_receipt_id===newer&&x.prior_continuity_receipt_id===related&&
x.eligible_for_renewal&&!x.renewal_review_recorded);
if(!candidate||!report.master_accepted_now||
Number(p.expected_master_receipt_id)!==current.verified_master_receipt_id||
!current.master_fresh)
throw Error('Exact prior signed Master continuity and current independently signed Master proof required. HOLD.');
status='owner_master_attestation_renewal_reviewed_697';
extra={master_receipt_id:current.verified_master_receipt_id,
historical_signatures_reverified:false,new_external_master_attestation_minted:false};
}else throw Error('Unsupported Build 697 decision. HOLD.');
if(!candidate)throw Error('Original evidence review unavailable or already completed. HOLD.');
const payload={decision,reference_receipt_id:ref,newer_receipt_id:newer,
prior_receipt_id:related,fingerprint_sha256:current.fingerprint_sha256,
source_revision:current.source_revision,owner_user_id:user.user_id,
owner_reviewed:true,resolution_note:note,source_repair_verified:false,
financial_certified:false,continuous_connection_verified:false,...extra};
const nonce='finance697-'+n+'-'+decision+'-'+ref+'-'+newer+'-'+related;
const receipt_id=await append684(db,user,n,'finance_owner_review_697',status,nonce,payload);
const after=await finance697(db,env,n);
if(!after.owner_evidence_history.some(x=>x.receipt_id===receipt_id&&
x.decision===decision&&x.state!=='HOLD_FINANCIAL_697_EVIDENCE_DRIFT'))
throw Error('Protected independently verified owner receipt readback failed. HOLD.');
return{status,receipt_id,original_source_repair_verified:false,
financial_certified:false,master_accepted_now:after.master_accepted_now,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}


// SQLite CURRENT_TIMESTAMP is UTC without a T/Z suffix. Normalize it to an
// explicit UTC timestamp before comparing, rather than interpreting local time.
export function utcAttemptTime698(t,now=Date.now()){
if(typeof t!=='string')return null;
const iso=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(t)?t:
 /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(t)?t.replace(' ','T')+'Z':null;
if(!iso)return null;
const ms=Date.parse(iso);
return Number.isFinite(ms)&&ms<=now+300000?ms:null;
}

// Build 698 — post-reconciliation original source-repair proof *intake*, source
// escalation recovery receipts and Master renewal drift detection. External
// evidence metadata is never a verified repair or a replacement Master signature.
export function assessFinance698(current,prior,ownerRows,now=Date.now()){
const n=Number(current?.queue_id),selected=Number.isSafeInteger(n)&&n>0,
rows698=Array.isArray(ownerRows)?ownerRows:[],bounded=!!prior?.history_complete&&rows698.length<=60;
const date=t=>utcAttemptTime698(t,now);
const source=(prior?.reconciliation?.items||[]).filter(x=>x.independent_reconciliation_recorded&&x.reconciliation_receipt_id)
.map(x=>({older_receipt_id:x.older_receipt_id,newer_receipt_id:x.newer_receipt_id,
reconciliation_receipt_id:Number(x.reconciliation_receipt_id),
custodian_attestation_receipt_id:Number(x.custodian_attestation_receipt_id),
repair_proof_intake_recorded:false,repair_proof_receipt_id:null,
original_source_repaired:false}));
const sourceMap=new Map(source.map(x=>[x.older_receipt_id+'|'+x.newer_receipt_id+'|'+x.reconciliation_receipt_id,x]));
const recoveries=(prior?.aging?.items||[]).filter(x=>x.owner_review_recorded&&x.owner_review_receipt_id)
.map(x=>({case_id:x.case_id,original_resolution_receipt_id:Number(x.original_resolution_receipt_id),
escalation_receipt_id:Number(x.escalation_receipt_id),
owner_review_receipt_id:Number(x.owner_review_receipt_id),
recovery_followup_recorded:false,recovery_receipt_id:null,
external_incident_recovered:false}));
const recoveryMap=new Map(recoveries.map(x=>[x.case_id+'|'+x.owner_review_receipt_id,x]));
const masterCurrent=Number(current?.verified_master_receipt_id),
masterPrior=Number(prior?.master?.current_independent_master_receipt_id);
const freshCurrent=!!current?.master_fresh&&Number.isSafeInteger(masterCurrent)&&masterCurrent>0;
const receiptChanged=!!(Number.isSafeInteger(masterPrior)&&masterPrior>0&&
Number.isSafeInteger(masterCurrent)&&masterCurrent>0&&masterPrior!==masterCurrent);
const sourceRevisionChanged=!!(current?.source_revision&&
prior?.master?.source_revision&&current.source_revision!==prior.master.source_revision);
const masterDrift=receiptChanged||sourceRevisionChanged||!freshCurrent||prior?.master_accepted_now!==true;
const renewals=(prior?.master?.items||[]).filter(x=>x.renewal_review_recorded&&x.renewal_receipt_id)
.map(x=>({older_receipt_id:x.older_receipt_id,newer_receipt_id:x.newer_receipt_id,
renewal_receipt_id:Number(x.renewal_receipt_id),prior_continuity_receipt_id:Number(x.prior_continuity_receipt_id),
drift_review_recorded:false,drift_review_receipt_id:null,master_renewal_current:false}));
const renewalMap=new Map(renewals.map(x=>[x.older_receipt_id+'|'+x.newer_receipt_id+'|'+x.renewal_receipt_id,x]));
let invalid=0,priorId=Infinity,priorTime=Infinity;const history=[],seen=new Set();
for(const row of rows698){
const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
type=d.decision,ref=Number(d.reference_receipt_id),newer=Number(d.newer_receipt_id),
prev=Number(d.prior_receipt_id),time=date(row.attempted_at),
key=type+'|'+ref+'|'+newer+'|'+prev+'|'+(d.case_id||'');
const expected={intake_source_repair_proof:'owner_original_repair_proof_intake_698',
record_escalation_recovery:'owner_escalation_recovery_followup_698',
record_master_drift:'owner_master_renewal_drift_recheck_698'}[type];
const base=Number.isSafeInteger(id)&&id>0&&id<priorId&&time!==null&&time<=priorTime&&
!seen.has(key)&&row.attempt_status===expected&&
d.fingerprint_sha256===current?.fingerprint_sha256&&d.source_revision===current?.source_revision&&
d.owner_reviewed===true&&Number.isSafeInteger(Number(d.owner_user_id))&&
Number(d.owner_user_id)>0&&typeof d.resolution_note==='string'&&
d.resolution_note.length>=20&&d.resolution_note.length<=400&&
d.original_source_repaired===false&&d.financial_certified===false&&
d.continuous_connection_verified===false&&
d.external_repair_verified===false;
let paired=false;
if(type==='intake_source_repair_proof'){
const match=sourceMap.get(ref+'|'+newer+'|'+prev);
paired=!!match&&id>prev&&
/^[a-f0-9]{64}$/.test(d.external_document_sha256||'')&&
/^[A-Za-z0-9][A-Za-z0-9_.:/#-]{7,159}$/.test(d.external_reference||'')&&
date(d.external_observed_at)!==null&&date(d.external_observed_at)<=time&&
d.independent_source_repair_verification===false;
}else if(type==='record_escalation_recovery'){
const match=recoveryMap.get(d.case_id+'|'+prev);
paired=!!match&&ref===match.original_resolution_receipt_id&&newer===0&&id>prev&&
['recovery_evidence_requested','followup_reissued'].includes(d.followup_disposition)&&
d.external_remediation_verified===false;
}else if(type==='record_master_drift'){
const match=renewalMap.get(ref+'|'+newer+'|'+prev);
paired=!!match&&id>prev&&
Number(d.observed_master_receipt_id)===masterCurrent&&
Number(d.prior_master_receipt_id)===masterPrior&&
d.drift_detected===masterDrift&&
d.new_external_master_signature_verified===false;
}
const valid=base&&paired;
if(valid)seen.add(key);else invalid++;
history.push({receipt_id:id,decision:type||null,reference_receipt_id:ref,
newer_receipt_id:newer,prior_receipt_id:prev,case_id:d.case_id||null,
external_document_sha256:type==='intake_source_repair_proof'?d.external_document_sha256:null,
external_reference:type==='intake_source_repair_proof'?d.external_reference:null,
recorded_at:row.attempted_at,drift_detected:d.drift_detected===true,
state:!valid?'HOLD_FINANCIAL_698_EVIDENCE_DRIFT':
type==='intake_source_repair_proof'?'SOURCE_REPAIR_DOCUMENT_INTAKE_UNVERIFIED':
type==='record_escalation_recovery'?'OWNER_RECOVERY_FOLLOWUP_RECORDED_EXTERNAL_RESOLUTION_HOLD':
'MASTER_DRIFT_REVIEW_RECORDED_FRESH_EXTERNAL_ATTESTATION_REQUIRED'});
priorId=id;priorTime=time===null?-Infinity:time;
}
for(const x of source){const y=history.find(h=>h.decision==='intake_source_repair_proof'&&
h.reference_receipt_id===x.older_receipt_id&&h.newer_receipt_id===x.newer_receipt_id&&
h.prior_receipt_id===x.reconciliation_receipt_id&&h.state==='SOURCE_REPAIR_DOCUMENT_INTAKE_UNVERIFIED');
x.repair_proof_intake_recorded=!!y;x.repair_proof_receipt_id=y?.receipt_id||null;}
for(const x of recoveries){const y=history.find(h=>h.decision==='record_escalation_recovery'&&
h.case_id===x.case_id&&h.prior_receipt_id===x.owner_review_receipt_id&&
h.state==='OWNER_RECOVERY_FOLLOWUP_RECORDED_EXTERNAL_RESOLUTION_HOLD');
x.recovery_followup_recorded=!!y;x.recovery_receipt_id=y?.receipt_id||null;}
for(const x of renewals){const y=history.find(h=>h.decision==='record_master_drift'&&
h.reference_receipt_id===x.older_receipt_id&&h.newer_receipt_id===x.newer_receipt_id&&
h.prior_receipt_id===x.renewal_receipt_id&&
h.state==='MASTER_DRIFT_REVIEW_RECORDED_FRESH_EXTERNAL_ATTESTATION_REQUIRED');
x.drift_review_recorded=!!y;x.drift_review_receipt_id=y?.receipt_id||null;}
const complete=selected&&bounded&&invalid===0;
return{status:!selected?'HOLD_SELECT_CAMPAIGN':!complete?'HOLD_FINANCIAL_698_EVIDENCE_DRIFT':
masterDrift?'HOLD_MASTER_RENEWAL_DRIFT':Number(prior?.reconciliation?.original_mismatch_count||0)>0?
'HOLD_INDEPENDENT_SOURCE_REPAIR_VERIFICATION':recoveries.some(x=>!x.recovery_followup_recorded)?
'OWNER_FINANCIAL_RECOVERY_FOLLOWUP_REQUIRED':'OWNER_FINANCIAL_698_REVIEW_ONLY',
campaign_queue_id:selected?n:null,observed_at:new Date(now).toISOString(),history_complete:complete,
source_repair:{original_mismatch_count:Number(prior?.reconciliation?.original_mismatch_count||0),
eligible_reconciliation_count:source.length,pending_intake_count:source.filter(x=>!x.repair_proof_intake_recorded).length,
items:source.slice(0,40),original_source_repaired:false,independent_repair_verification_count:0},
recovery:{eligible_owner_cases:recoveries.length,pending_followup_count:recoveries.filter(x=>!x.recovery_followup_recorded).length,
items:recoveries.slice(0,40),external_financial_remediation_proven:false},
master:{observed_master_receipt_id:freshCurrent?masterCurrent:null,
prior_master_receipt_id:Number.isSafeInteger(masterPrior)&&masterPrior>0?masterPrior:null,
receipt_changed:receiptChanged,source_revision_changed:sourceRevisionChanged,
prior_master_acceptance_missing:prior?.master_accepted_now!==true,
drift_detected:masterDrift,
fresh_independent_master_receipt_now:freshCurrent,items:renewals.slice(0,40),
pending_drift_review_count:renewals.filter(x=>!x.drift_review_recorded).length,
new_independent_signature_verified:false,continuous_connection_verified:false},
owner_evidence_history:history.slice(0,40),invalid_owner_history_count:invalid,
financial_certified:false,original_source_repaired:false,automatic_closure:false,
external_replay_performed:false,connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}
async function finance698(db,env,id){
const n=Number(id);
if(!Number.isSafeInteger(n)||n<1)return assessFinance698({queue_id:0},{history_complete:false},[]);
const current=await financial685(db,env,n),prior=await finance697(db,env,n);
const entries=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_review_698' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
return assessFinance698(current,prior,entries);
}
async function ownerReview698(db,env,user,p){
const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
report=await finance698(db,env,n),
kind=normalizeText(p.decision),ref=Number(p.reference_receipt_id),
newer=Number(p.newer_receipt_id||0),prev=Number(p.prior_receipt_id),
note=normalizeText(p.resolution_note);
if(!current.queue_id||!report.history_complete||p.owner_reviewed!==true||
p.expected_fingerprint_sha256!==current.fingerprint_sha256||
p.expected_source_revision!==current.source_revision||
!Number.isSafeInteger(ref)||ref<1||!Number.isSafeInteger(prev)||prev<1||
note.length<20||note.length>400)
throw Error('Exact original financial source and owner evidence, complete history and explicit review required. HOLD.');
let candidate=null,status='',extra={};
if(kind==='intake_source_repair_proof'){
candidate=report.source_repair.items.find(x=>x.older_receipt_id===ref&&x.newer_receipt_id===newer&&
x.reconciliation_receipt_id===prev&&!x.repair_proof_intake_recorded);
const digest=normalizeText(p.external_document_sha256).toLowerCase(),
reference=normalizeText(p.external_reference),observed=normalizeText(p.external_observed_at);
if(!candidate||!/^[a-f0-9]{64}$/.test(digest)||
!/^[A-Za-z0-9][A-Za-z0-9_.:/#-]{7,159}$/.test(reference)||
!fresh684(observed,2592000000))
throw Error('Original independently reconciled evidence and externally supplied SHA-256/reference/observed UTC time required. Metadata alone never proves repair. HOLD.');
status='owner_original_repair_proof_intake_698';
extra={external_document_sha256:digest,external_reference:reference,
external_observed_at:observed,independent_source_repair_verification:false};
}else if(kind==='record_escalation_recovery'){
const caseId=normalizeText(p.case_id),disposition=normalizeText(p.followup_disposition);
candidate=report.recovery.items.find(x=>x.case_id===caseId&&
x.original_resolution_receipt_id===ref&&x.owner_review_receipt_id===prev&&
!x.recovery_followup_recorded);
if(!candidate||newer!==0||
!['recovery_evidence_requested','followup_reissued'].includes(disposition))
throw Error('Original independently reviewed escalation and explicit external recovery follow-up required. HOLD.');
status='owner_escalation_recovery_followup_698';
extra={case_id:caseId,followup_disposition:disposition,external_remediation_verified:false};
}else if(kind==='record_master_drift'){
candidate=report.master.items.find(x=>x.older_receipt_id===ref&&x.newer_receipt_id===newer&&
x.renewal_receipt_id===prev&&!x.drift_review_recorded);
if(!candidate||Number(p.expected_master_receipt_id||0)!==Number(current.verified_master_receipt_id||0)||
Number(p.expected_prior_master_receipt_id||0)!==Number(report.master.prior_master_receipt_id||0))
throw Error('Exact prior Master renewal and current independently signed receipt continuity required. HOLD.');
status='owner_master_renewal_drift_recheck_698';
extra={observed_master_receipt_id:current.verified_master_receipt_id,
prior_master_receipt_id:report.master.prior_master_receipt_id,
drift_detected:report.master.drift_detected,new_external_master_signature_verified:false};
}else throw Error('Unsupported Build 698 owner financial decision. HOLD.');
if(!candidate)throw Error('Original source-bound review unavailable or already recorded. HOLD.');
const payload={decision:kind,reference_receipt_id:ref,newer_receipt_id:newer,
prior_receipt_id:prev,fingerprint_sha256:current.fingerprint_sha256,
source_revision:current.source_revision,owner_user_id:user.user_id,
owner_reviewed:true,resolution_note:note,original_source_repaired:false,
external_repair_verified:false,financial_certified:false,
continuous_connection_verified:false,...extra};
const nonce='finance698-'+n+'-'+kind+'-'+ref+'-'+newer+'-'+prev;
const receipt_id=await append684(db,user,n,'finance_owner_review_698',status,nonce,payload);
const after=await finance698(db,env,n);
if(!after.owner_evidence_history.some(x=>x.receipt_id===receipt_id&&
x.decision===kind&&x.state!=='HOLD_FINANCIAL_698_EVIDENCE_DRIFT'))
throw Error('Protected Build 698 evidence failed durable original owner readback. HOLD.');
return{status,receipt_id,original_source_repaired:false,financial_certified:false,
master_drift_detected:after.master.drift_detected,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}



// Build 700: owner-triggered ONLY, isolated source-of-record HTTPS GET.
// The external endpoint contract is signed by a fourth independent custodian.
// This verifies a fresh original SOURCE READBACK snapshot, not financial
// certification, bookkeeping correction or a live CONNECTED transition.
export function claim700(x){
return{v:1,purpose:'devilndove_finance_live_original_source_readback_700',
source:'devilndove',queue_id:x.queue_id,
older_receipt_id:x.older_receipt_id,newer_receipt_id:x.newer_receipt_id,
repair_intake_receipt_id:x.repair_intake_receipt_id,
independent_document_witness_receipt_id:x.independent_document_witness_receipt_id,
external_document_sha256:x.external_document_sha256,
source_revision:x.source_revision,fingerprint_sha256:x.fingerprint_sha256,
source_discrepancies_remaining:x.source_discrepancies_remaining,
source_repair_claimed:x.source_repair_claimed,
signer_id:x.signer_id,nonce:x.nonce,observed_at:x.observed_at,
decision:'fresh_live_source_snapshot_only_no_financial_certification'};
}
export async function assessFinance700(current,prior,historyRows,signer={},now=Date.now()){
const n=Number(current?.queue_id),selected=Number.isSafeInteger(n)&&n>0,
rows700=Array.isArray(historyRows)?historyRows:[],
trust=!!signer?.id&&!!signer?.key&&!!signer?.thirdId&&!!signer?.thirdKey&&
!!signer?.custodianId&&!!signer?.reconcilerId&&
!!signer?.custodianKey&&!!signer?.reconcilerKey&&
signer.id!==signer.thirdId&&signer.id!==signer.custodianId&&
signer.id!==signer.reconcilerId&&signer.key!==signer.thirdKey&&
signer.key!==signer.custodianKey&&signer.key!==signer.reconcilerKey;
const cases=(prior?.independent_verification?.items||[])
.filter(x=>x.independent_document_signature_verified&&x.independent_witness_receipt_id)
.map(x=>({older_receipt_id:Number(x.older_receipt_id),
newer_receipt_id:Number(x.newer_receipt_id),
repair_intake_receipt_id:Number(x.repair_intake_receipt_id),
independent_document_witness_receipt_id:Number(x.independent_witness_receipt_id),
external_document_sha256:x.external_document_sha256,
source_readback_recorded:false,source_readback_receipt_id:null,
source_readback_independently_signed:false,independent_bookkeeping_close:false}));
const caseMap=new Map(cases.map(x=>[x.older_receipt_id+'|'+x.newer_receipt_id+'|'+
x.repair_intake_receipt_id+'|'+x.independent_document_witness_receipt_id,x]));
let bad=0,previousId=Infinity,previousAt=Infinity;
const seen=new Set(),ledger=[];
for(const row of rows700){
const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
key=d.older_receipt_id+'|'+d.newer_receipt_id+'|'+d.repair_intake_receipt_id+'|'+d.independent_document_witness_receipt_id,
match=caseMap.get(key),observed=utcAttemptTime698(d.observed_at,now),
recorded=utcAttemptTime698(row.attempted_at,now);
const base=selected&&!!prior?.history_complete&&trust&&!!match&&
id>match.independent_document_witness_receipt_id&&id<previousId&&
row.attempt_status==='independent_live_source_snapshot_readback_700'&&
!seen.has(key)&&observed!==null&&recorded!==null&&
observed<=recorded&&recorded<=previousAt&&recorded-observed<=300000&&
nonce684(d.nonce)&&d.signer_id===signer.id&&
d.external_document_sha256===match.external_document_sha256&&
d.source_revision===current?.source_revision&&
d.fingerprint_sha256===current?.fingerprint_sha256&&
d.source_discrepancies_remaining===0&&d.source_repair_claimed===true&&
d.independent_source_signature_verified===true&&
d.owner_reviewed===true&&Number.isSafeInteger(Number(d.owner_user_id))&&
Number(d.owner_user_id)>0&&typeof d.resolution_note==='string'&&
d.resolution_note.length>=20&&d.resolution_note.length<=400&&
d.original_financial_certified===false&&
d.continuous_connection_verified===false&&
/^[A-Za-z0-9+/_=-]{80,120}$/.test(d.signature||'');
let verified=false;
if(base)verified=await verify684(signer.key,claim700({
queue_id:n,older_receipt_id:match.older_receipt_id,
newer_receipt_id:match.newer_receipt_id,
repair_intake_receipt_id:match.repair_intake_receipt_id,
independent_document_witness_receipt_id:match.independent_document_witness_receipt_id,
external_document_sha256:d.external_document_sha256,
source_revision:d.source_revision,fingerprint_sha256:d.fingerprint_sha256,
source_discrepancies_remaining:d.source_discrepancies_remaining,
source_repair_claimed:d.source_repair_claimed,
signer_id:d.signer_id,nonce:d.nonce,observed_at:d.observed_at
}),d.signature);
if(verified)seen.add(key);else bad++;
ledger.push({receipt_id:id,source_readback_independently_signed:verified,
observed_at:d.observed_at,source_discrepancies_remaining:d.source_discrepancies_remaining,
state:verified?'FRESH_INDEPENDENT_SOURCE_SNAPSHOT_NO_FINANCIAL_CLOSE':
'HOLD_700_SIGNATURE_OR_ORIGINAL_SOURCE_DRIFT',
older_receipt_id:d.older_receipt_id,newer_receipt_id:d.newer_receipt_id,
repair_intake_receipt_id:d.repair_intake_receipt_id,
independent_document_witness_receipt_id:d.independent_document_witness_receipt_id});
previousId=id;previousAt=recorded===null?-Infinity:recorded;
}
for(const x of cases){
const entry=ledger.find(y=>y.source_readback_independently_signed&&
y.older_receipt_id===x.older_receipt_id&&y.newer_receipt_id===x.newer_receipt_id&&
y.repair_intake_receipt_id===x.repair_intake_receipt_id&&
y.independent_document_witness_receipt_id===x.independent_document_witness_receipt_id);
x.source_readback_recorded=!!entry;
x.source_readback_receipt_id=entry?.receipt_id||null;
x.source_readback_independently_signed=!!entry;
}
const complete=selected&&!!prior?.history_complete&&rows700.length<=60&&bad===0;
const signed=cases.filter(x=>x.source_readback_independently_signed).length;
return{status:!selected?'HOLD_SELECT_CAMPAIGN':!complete?'HOLD_700_ORIGINAL_SOURCE_LEDGER_DRIFT':
 !trust?'HOLD_EXTERNAL_SOURCE_OF_RECORD_NOT_CONFIGURED':
 !signed?'HOLD_LIVE_SOURCE_READBACK_REQUIRED':
 'EXTERNAL_SOURCE_SNAPSHOT_VERIFIED_PENDING_INDEPENDENT_BOOKKEEPING_ACCEPTANCE',
campaign_queue_id:selected?n:null,history_complete:complete,
observed_at:new Date(now).toISOString(),
readback:{configured:trust,source_origin_authorized:!!signer?.originAuthorized,
source_receipt_count:signed,eligible_cases:cases.length,pending_count:cases.length-signed,
items:cases.slice(0,40),invalid_count:bad,
external_source_bytes_read_by_this_result:false,independent_bookkeeping_close:false},
receipt_history:ledger.slice(0,40),
original_source_repaired:false,financial_certified:false,
continuous_connection_verified:false,
auto_source_repair:false,automatic_incident_closure:false,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}
async function finance700(db,env,id){
const n=Number(id);if(!Number.isSafeInteger(n)||n<1)
return await assessFinance700({queue_id:0},{history_complete:false},[],{});
const current=await financial685(db,env,n),prior=await finance699(db,env,n);
const ledger=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_review_700' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
return await assessFinance700(current,prior,ledger,{
id:normalizeText(env?.FINANCIAL_SOURCE_LIVE_SIGNER_ID_700),
key:normalizeText(env?.FINANCIAL_SOURCE_LIVE_PUBLIC_KEY_700),
thirdId:normalizeText(env?.FINANCIAL_SOURCE_REPAIR_VERIFIER_ID_699),
thirdKey:normalizeText(env?.FINANCIAL_SOURCE_REPAIR_VERIFIER_PUBLIC_KEY_699),
custodianId:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_SIGNER_ID_696),
reconcilerId:normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_SIGNER_ID_697),
custodianKey:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_CUSTODIAN_PUBLIC_KEY_696),
reconcilerKey:normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_PUBLIC_KEY_697),
originAuthorized:!!sourceOrigin700(env?.FINANCIAL_SOURCE_LIVE_READBACK_URL_700,
env?.FINANCIAL_SOURCE_LIVE_READBACK_ORIGIN_700)
});
}
export function sourceOrigin700(input,origin){
try{
const configured=new URL(String(input||'')),allow=new URL(String(origin||''));
if(configured.protocol!=='https:'||allow.protocol!=='https:'||
configured.origin!==allow.origin||configured.username||configured.password||
configured.hash||allow.pathname!=='/'||allow.search||allow.hash||
!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(configured.hostname)||
/^[0-9.]+$/.test(configured.hostname)||/\.(?:local|internal|localhost)$/i.test(configured.hostname)||
/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(configured.hostname))
return null;
return configured;
}catch{return null;}
}
async function liveSourceReadback700(db,env,user,p){
const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
report=await finance700(db,env,n),
older=Number(p.older_receipt_id),newer=Number(p.newer_receipt_id),
intake=Number(p.repair_intake_receipt_id),
witness=Number(p.independent_document_witness_receipt_id),note=normalizeText(p.resolution_note);
if(!current.queue_id||!report.history_complete||p.owner_reviewed!==true||
p.expected_source_revision!==current.source_revision||
p.expected_fingerprint_sha256!==current.fingerprint_sha256||
note.length<20||note.length>400)
throw Error('Exact current original financial source, 20–400 character owner reason and review required. HOLD.');
const x=report.readback.items.find(x=>x.older_receipt_id===older&&
x.newer_receipt_id===newer&&x.repair_intake_receipt_id===intake&&
x.independent_document_witness_receipt_id===witness&&!x.source_readback_recorded);
const endpoint=sourceOrigin700(env?.FINANCIAL_SOURCE_LIVE_READBACK_URL_700,
env?.FINANCIAL_SOURCE_LIVE_READBACK_ORIGIN_700);
const signerId=normalizeText(env?.FINANCIAL_SOURCE_LIVE_SIGNER_ID_700),
publicKey=normalizeText(env?.FINANCIAL_SOURCE_LIVE_PUBLIC_KEY_700);
if(!x||!endpoint||!report.readback.configured||
!env?.FINANCIAL_SOURCE_LIVE_READBACK_BEARER_700)
throw Error('Independent original source endpoint, signer or exact document witness missing. HOLD.');
const nonce=crypto.randomUUID();
endpoint.searchParams.set('queue_id',String(n));
endpoint.searchParams.set('nonce',nonce);
endpoint.searchParams.set('source_revision',current.source_revision);
endpoint.searchParams.set('witness_receipt_id',String(witness));
const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
let response;
try{
response=await fetch(endpoint.toString(),{method:'GET',redirect:'manual',signal:controller.signal,
headers:{'Accept':'application/json','Cache-Control':'no-store',
'Authorization':'Bearer '+String(env.FINANCIAL_SOURCE_LIVE_READBACK_BEARER_700)}});
}finally{clearTimeout(timeout);}
if(!response.ok||response.redirected||response.status!==200||
!(response.headers.get('Content-Type')||'').toLowerCase().includes('application/json'))
throw Error('Original source-of-record direct HTTPS GET denied, redirected or returned non-JSON. HOLD.');
if(Number(response.headers.get('Content-Length')||0)>32768)
throw Error('Source-of-record readback exceeds bounded size. HOLD.');
const reader=response.body?.getReader();if(!reader)
throw Error('Direct source-of-record response body unavailable. HOLD.');
let total=0,chunks=[];
try{
while(true){
const part=await reader.read();if(part.done)break;
total+=part.value.byteLength;
if(total>32768)throw Error('Unbounded source-of-record response. HOLD.');
chunks.push(part.value);
}
}finally{try{await reader.cancel()}catch{}}
const combined=new Uint8Array(total);let offset=0;
for(const chunk of chunks){combined.set(chunk,offset);offset+=chunk.length;}
let receipt;try{receipt=JSON.parse(new TextDecoder().decode(combined))}
catch{throw Error('Original source returned noncanonical JSON. HOLD.');}
const signed=receipt?.claim,signature=receipt?.signature;
const expected=claim700({queue_id:n,older_receipt_id:older,
newer_receipt_id:newer,repair_intake_receipt_id:intake,
independent_document_witness_receipt_id:witness,
external_document_sha256:x.external_document_sha256,
source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
source_discrepancies_remaining:0,source_repair_claimed:true,
signer_id:signerId,nonce,observed_at:signed?.observed_at});
if(JSON.stringify(signed)!==JSON.stringify(expected)||!fresh684(signed?.observed_at,300000)||
!await verify684(publicKey,expected,signature))
throw Error('Independent live source response signature, nonce, time, digest or source mismatch. HOLD.');
// Recheck original source before append; never translate a document receipt
// into a source closure, bookkeeping acceptance, or CONNECTED status.
const currentAgain=await financial685(db,env,n);
if(currentAgain.source_revision!==current.source_revision||
currentAgain.fingerprint_sha256!==current.fingerprint_sha256)
throw Error('Financial source changed during live readback. HOLD.');
const payload={...signed,signature,
independent_source_signature_verified:true,
original_financial_certified:false,
continuous_connection_verified:false,
owner_user_id:user.user_id,owner_reviewed:true,resolution_note:note};
const receiptId=await append684(db,user,n,'finance_owner_review_700',
'independent_live_source_snapshot_readback_700',
'finance700-'+n+'-'+older+'-'+newer+'-'+intake+'-'+witness,payload);
const check=await finance700(db,env,n);
if(!check.receipt_history.some(x=>x.receipt_id===receiptId&&x.source_readback_independently_signed))
throw Error('Independent source-of-record readback failed durable original receipt verification. HOLD.');
return{status:'EXTERNAL_SOURCE_SNAPSHOT_VERIFIED_PENDING_INDEPENDENT_BOOKKEEPING_ACCEPTANCE',
receipt_id:receiptId,source_of_record_https_readback:true,
original_source_repaired:false,financial_certified:false,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}


// Build 701: a distinct fifth signer verifies bookkeeping EVIDENCE against
// one fresh original source receipt. This is NOT original book closure.
export function claim701(x){
 return {v:1,purpose:'devilndove_independent_bookkeeping_evidence_review_701',
 source:'devilndove',queue_id:x.queue_id,
 original_live_source_receipt_id:x.original_live_source_receipt_id,
 older_receipt_id:x.older_receipt_id,newer_receipt_id:x.newer_receipt_id,
 external_document_sha256:x.external_document_sha256,
 bookkeeping_ledger_sha256:x.bookkeeping_ledger_sha256,
 source_revision:x.source_revision,fingerprint_sha256:x.fingerprint_sha256,
 independent_bookkeeper_id:x.independent_bookkeeper_id,
 nonce:x.nonce,issued_at:x.issued_at,
 decision:'independent_bookkeeping_evidence_review_not_accounting_close'};
}
export async function assessFinance701(current,prior,historyRows,signer={},now=Date.now()){
 const n=Number(current?.queue_id),selected=Number.isSafeInteger(n)&&n>0;
 const historyInput=Array.isArray(historyRows)?historyRows:[];
 const others=[['sourceId','sourceKey'],['thirdId','thirdKey'],
   ['custodianId','custodianKey'],['reconcilerId','reconcilerKey']];
 const trusted=!!signer?.id&&!!signer?.key&&others.every(([a,b])=>
   !!signer[a]&&!!signer[b]&&signer.id!==signer[a]&&signer.key!==signer[b]);
 const cases=(prior?.readback?.items||[]).filter(x=>x.source_readback_independently_signed&&
   Number.isSafeInteger(Number(x.source_readback_receipt_id))&&Number(x.source_readback_receipt_id)>0)
   .map(x=>({original_live_source_receipt_id:Number(x.source_readback_receipt_id),
     older_receipt_id:Number(x.older_receipt_id),newer_receipt_id:Number(x.newer_receipt_id),
     external_document_sha256:x.external_document_sha256,
     independent_bookkeeping_evidence_reviewed:false,bookkeeping_review_receipt_id:null}));
 const sourceMap=new Map(cases.map(x=>[x.original_live_source_receipt_id,x]));
 const seen=new Set(),history=[];let invalid=0,previousId=Infinity,previousAt=Infinity;
 for(const row of historyInput){
   const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
     sourceId=Number(d.original_live_source_receipt_id),source=sourceMap.get(sourceId),
     recorded=utcAttemptTime698(row.attempted_at,now),
     issued=utcAttemptTime698(d.issued_at,now);
   const safe=selected&&!!prior?.history_complete&&trusted&&!!source&&
     id>sourceId&&id<previousId&&recorded!==null&&recorded<=previousAt&&
     issued!==null&&issued<=recorded&&recorded-issued<=1200000&&
     row.attempt_status==='independent_bookkeeping_evidence_review_701'&&
     !seen.has(sourceId)&&nonce684(d.nonce)&&
     d.independent_bookkeeper_id===signer.id&&
     /^[a-f0-9]{64}$/.test(d.bookkeeping_ledger_sha256||'')&&
     d.external_document_sha256===source.external_document_sha256&&
     d.older_receipt_id===source.older_receipt_id&&
     d.newer_receipt_id===source.newer_receipt_id&&
     d.source_revision===current?.source_revision&&
     d.fingerprint_sha256===current?.fingerprint_sha256&&
     d.owner_reviewed===true&&Number.isSafeInteger(Number(d.owner_user_id))&&
     Number(d.owner_user_id)>0&&typeof d.resolution_note==='string'&&
     d.resolution_note.length>=20&&d.resolution_note.length<=400&&
     d.original_source_repaired===false&&d.financial_certified===false&&
     d.bookkeeping_closed===false&&d.continuous_connection_verified===false&&
     /^[A-Za-z0-9+/_=-]{80,120}$/.test(d.signature||'');
   const verified=!!safe&&await verify684(signer.key,claim701({
     queue_id:n,original_live_source_receipt_id:sourceId,
     older_receipt_id:source.older_receipt_id,newer_receipt_id:source.newer_receipt_id,
     external_document_sha256:d.external_document_sha256,
     bookkeeping_ledger_sha256:d.bookkeeping_ledger_sha256,
     source_revision:d.source_revision,fingerprint_sha256:d.fingerprint_sha256,
     independent_bookkeeper_id:d.independent_bookkeeper_id,
     nonce:d.nonce,issued_at:d.issued_at}),d.signature);
   if(verified)seen.add(sourceId);else invalid++;
   history.push({receipt_id:id,original_live_source_receipt_id:sourceId,
     bookkeeping_ledger_sha256:verified?d.bookkeeping_ledger_sha256:null,
     recorded_at:row.attempted_at,
     independent_bookkeeping_evidence_verified:verified,
     state:verified?'SIGNED_INDEPENDENT_BOOKKEEPING_REVIEW_ACCOUNTING_CLOSE_HOLD':
       'HOLD_701_BOOKKEEPING_SIGNATURE_OR_SOURCE_DRIFT'});
   previousId=id;previousAt=recorded===null?-Infinity:recorded;
 }
 for(const item of cases){
   const accepted=history.find(x=>x.original_live_source_receipt_id===item.original_live_source_receipt_id&&
     x.independent_bookkeeping_evidence_verified);
   item.independent_bookkeeping_evidence_reviewed=!!accepted;
   item.bookkeeping_review_receipt_id=accepted?.receipt_id||null;
   item.bookkeeping_ledger_sha256=accepted?.bookkeeping_ledger_sha256||null;
   item.bookkeeping_review_recorded_at=accepted?.recorded_at||null;
 }
 const complete=selected&&!!prior?.history_complete&&historyInput.length<=60&&invalid===0;
 return {status:!selected?'HOLD_SELECT_CAMPAIGN':!complete?'HOLD_701_ORIGINAL_BOOKKEEPING_LEDGER_DRIFT':
   !trusted?'HOLD_INDEPENDENT_BOOKKEEPER_NOT_CONFIGURED':
   !cases.length?'HOLD_ORIGINAL_LIVE_SOURCE_READBACK_REQUIRED':
   cases.some(x=>!x.independent_bookkeeping_evidence_reviewed)?
     'HOLD_INDEPENDENT_BOOKKEEPING_EVIDENCE_REVIEW':
     'INDEPENDENT_BOOKKEEPING_EVIDENCE_REVIEWED_ACCOUNTING_CLOSE_HOLD',
   campaign_queue_id:selected?n:null,history_complete:complete,
   independent_verifier_id:signer.id||null,independent_signer_configured:trusted,
   review:{items:cases.slice(0,40),eligible_cases:cases.length,
     recorded_count:cases.filter(x=>x.independent_bookkeeping_evidence_reviewed).length,
     invalid_count:invalid,pending_count:cases.filter(x=>!x.independent_bookkeeping_evidence_reviewed).length},
   receipt_history:history.slice(0,40),original_source_repaired:false,
   bookkeeping_closed:false,financial_certified:false,
   automatic_financial_close:false,continuous_connection_verified:false,
   connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}
async function finance701(db,env,id){
 const n=Number(id);if(!Number.isSafeInteger(n)||n<1)
   return await assessFinance701({queue_id:0},{history_complete:false},[],{});
 const current=await financial685(db,env,n),prior=await finance700(db,env,n);
 const history=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_review_701' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 return await assessFinance701(current,prior,history,{
   id:normalizeText(env?.FINANCIAL_BOOKKEEPING_VERIFIER_ID_701),
   key:normalizeText(env?.FINANCIAL_BOOKKEEPING_VERIFIER_PUBLIC_KEY_701),
   sourceId:normalizeText(env?.FINANCIAL_SOURCE_LIVE_SIGNER_ID_700),
   sourceKey:normalizeText(env?.FINANCIAL_SOURCE_LIVE_PUBLIC_KEY_700),
   thirdId:normalizeText(env?.FINANCIAL_SOURCE_REPAIR_VERIFIER_ID_699),
   thirdKey:normalizeText(env?.FINANCIAL_SOURCE_REPAIR_VERIFIER_PUBLIC_KEY_699),
   custodianId:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_SIGNER_ID_696),
   custodianKey:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_CUSTODIAN_PUBLIC_KEY_696),
   reconcilerId:normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_SIGNER_ID_697),
   reconcilerKey:normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_PUBLIC_KEY_697)
 });
}
async function ownerBookkeepingReview701(db,env,user,p){
 const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
   prior=await finance701(db,env,n),sourceId=Number(p.original_live_source_receipt_id),
   digest=normalizeText(p.bookkeeping_ledger_sha256).toLowerCase(),
   note=normalizeText(p.resolution_note),issued=normalizeText(p.issued_at),
   nonce=normalizeText(p.nonce),signature=normalizeText(p.signature);
 const source=prior.review?.items?.find(x=>x.original_live_source_receipt_id===sourceId&&
   !x.independent_bookkeeping_evidence_reviewed);
 const signer=normalizeText(env?.FINANCIAL_BOOKKEEPING_VERIFIER_ID_701),
   key=normalizeText(env?.FINANCIAL_BOOKKEEPING_VERIFIER_PUBLIC_KEY_701);
 if(!current.queue_id||!prior.history_complete||!prior.independent_signer_configured||
   p.owner_reviewed!==true||!source||
   p.expected_source_revision!==current.source_revision||
   p.expected_fingerprint_sha256!==current.fingerprint_sha256||
   note.length<20||note.length>400||!/^[a-f0-9]{64}$/.test(digest)||
   !nonce684(nonce)||!fresh684(issued,1200000)||
   !/^[A-Za-z0-9+/_=-]{80,120}$/.test(signature)||
   p.independent_bookkeeper_id!==signer||
   !await verify684(key,claim701({queue_id:n,original_live_source_receipt_id:sourceId,
     older_receipt_id:source.older_receipt_id,newer_receipt_id:source.newer_receipt_id,
     external_document_sha256:source.external_document_sha256,
     bookkeeping_ledger_sha256:digest,source_revision:current.source_revision,
     fingerprint_sha256:current.fingerprint_sha256,independent_bookkeeper_id:signer,
     nonce,issued_at:issued}),signature))
   throw Error('Fresh fifth independent bookkeeper signature, original source receipt, immutable ledger digest and explicit owner review required. HOLD.');
 const currentAgain=await financial685(db,env,n);
 if(currentAgain.source_revision!==current.source_revision||
   currentAgain.fingerprint_sha256!==current.fingerprint_sha256)
   throw Error('Original financial source changed before bookkeeping review admission. HOLD.');
 const payload={original_live_source_receipt_id:sourceId,
   older_receipt_id:source.older_receipt_id,newer_receipt_id:source.newer_receipt_id,
   external_document_sha256:source.external_document_sha256,bookkeeping_ledger_sha256:digest,
   source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
   independent_bookkeeper_id:signer,nonce,issued_at:issued,signature,
   owner_user_id:user.user_id,owner_reviewed:true,resolution_note:note,
   original_source_repaired:false,financial_certified:false,
   bookkeeping_closed:false,continuous_connection_verified:false};
 const receiptId=await append684(db,user,n,'finance_owner_review_701',
   'independent_bookkeeping_evidence_review_701','finance701-'+n+'-'+sourceId,payload);
 const after=await finance701(db,env,n);
 if(!after.receipt_history.some(x=>x.receipt_id===receiptId&&
    x.independent_bookkeeping_evidence_verified))
    throw Error('Signed bookkeeping evidence could not be read back from protected original ledger. HOLD.');
 return {status:'SIGNED_INDEPENDENT_BOOKKEEPING_REVIEW_ACCOUNTING_CLOSE_HOLD',
   receipt_id:receiptId,independent_bookkeeping_evidence_verified:true,
   original_source_repaired:false,bookkeeping_closed:false,
   financial_certified:false,connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}


// Build 702: a sixth independent signer may attest a bookkeeping closure
// DECISION only. A signed recommendation is never a ledger POST, source repair,
// actual accounting close, financial certification, or CONNECTED assertion.
export function claim702(x){
 return {v:1,purpose:'devilndove_independent_bookkeeping_closure_decision_702',
 source:'devilndove',queue_id:x.queue_id,
 original_live_source_receipt_id:x.original_live_source_receipt_id,
 bookkeeping_review_receipt_id:x.bookkeeping_review_receipt_id,
 older_receipt_id:x.older_receipt_id,newer_receipt_id:x.newer_receipt_id,
 external_document_sha256:x.external_document_sha256,
 bookkeeping_ledger_sha256:x.bookkeeping_ledger_sha256,
 source_revision:x.source_revision,fingerprint_sha256:x.fingerprint_sha256,
 independent_closure_signer_id:x.independent_closure_signer_id,
 remaining_exception_count:x.remaining_exception_count,
 decision:x.decision,nonce:x.nonce,issued_at:x.issued_at};
}
export async function assessFinance702(current,prior,reviewRows,signer={},now=Date.now()){
 const n=Number(current?.queue_id),selected=Number.isSafeInteger(n)&&n>0;
 const list=Array.isArray(reviewRows)?reviewRows:[];
 const distinct=!!signer.id&&!!signer.key&&
 [['bookkeeperId','bookkeeperKey'],['sourceId','sourceKey'],
 ['thirdId','thirdKey'],['custodianId','custodianKey'],
 ['reconcilerId','reconcilerKey']].every(([id,key])=>
   !!signer[id]&&!!signer[key]&&signer.id!==signer[id]&&signer.key!==signer[key]);
 const source=(prior?.review?.items||[])
   .filter(x=>x.independent_bookkeeping_evidence_reviewed&&
      Number.isSafeInteger(Number(x.bookkeeping_review_receipt_id))&&
      Number(x.bookkeeping_review_receipt_id)>0&&
      /^[a-f0-9]{64}$/.test(x.bookkeeping_ledger_sha256||''))
   .map(x=>({original_live_source_receipt_id:Number(x.original_live_source_receipt_id),
     bookkeeping_review_receipt_id:Number(x.bookkeeping_review_receipt_id),
     older_receipt_id:Number(x.older_receipt_id),newer_receipt_id:Number(x.newer_receipt_id),
     external_document_sha256:x.external_document_sha256,
     bookkeeping_ledger_sha256:x.bookkeeping_ledger_sha256,
     review_recorded_at:x.bookkeeping_review_recorded_at,
     signed_closure_decision_recorded:false,decision_receipt_id:null,
     signed_decision:null}));
 const map=new Map(source.map(x=>[x.bookkeeping_review_receipt_id,x]));
 const seen=new Set(),history=[];let invalid=0,lastId=Infinity,lastTime=Infinity;
 for(const row of list){
   const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
     reviewId=Number(d.bookkeeping_review_receipt_id),match=map.get(reviewId),
     recorded=utcAttemptTime698(row.attempted_at,now),
     issued=utcAttemptTime698(d.issued_at,now),
     reviewTime=utcAttemptTime698(match?.review_recorded_at,now);
   const decision=['hold_discrepancy','recommend_owner_manual_close'].includes(d.decision);
   const remaining=Number(d.remaining_exception_count);
   const base=selected&&!!prior?.history_complete&&distinct&&!!match&&
     Number.isSafeInteger(id)&&id>reviewId&&id<lastId&&
     recorded!==null&&recorded<=lastTime&&issued!==null&&issued<=recorded&&
     recorded-issued<=1200000&&reviewTime!==null&&recorded-reviewTime>=0&&
     recorded-reviewTime<=86400000&&
     !seen.has(reviewId)&&decision&&
     Number.isSafeInteger(remaining)&&remaining>=0&&remaining<=10000&&
     (d.decision==='hold_discrepancy'||remaining===0&&current?.master_fresh===true&&
       current?.history_complete===true&&Array.isArray(current?.open_cases)&&
       current.open_cases.length===0)&&
     row.attempt_status==='independent_bookkeeping_closure_decision_702'&&
     d.original_live_source_receipt_id===match.original_live_source_receipt_id&&
     d.older_receipt_id===match.older_receipt_id&&d.newer_receipt_id===match.newer_receipt_id&&
     d.external_document_sha256===match.external_document_sha256&&
     d.bookkeeping_ledger_sha256===match.bookkeeping_ledger_sha256&&
     d.source_revision===current?.source_revision&&
     d.fingerprint_sha256===current?.fingerprint_sha256&&
     d.independent_closure_signer_id===signer.id&&nonce684(d.nonce)&&
     d.owner_reviewed===true&&Number.isSafeInteger(Number(d.owner_user_id))&&
     Number(d.owner_user_id)>0&&typeof d.resolution_note==='string'&&
     d.resolution_note.length>=20&&d.resolution_note.length<=400&&
     d.original_source_repaired===false&&d.bookkeeping_closed===false&&
     d.financial_certified===false&&d.continuous_connection_verified===false&&
     /^[A-Za-z0-9+/_=-]{80,120}$/.test(d.signature||'');
   const verified=!!base&&await verify684(signer.key,claim702({
     queue_id:n,original_live_source_receipt_id:match.original_live_source_receipt_id,
     bookkeeping_review_receipt_id:match.bookkeeping_review_receipt_id,
     older_receipt_id:match.older_receipt_id,newer_receipt_id:match.newer_receipt_id,
     external_document_sha256:match.external_document_sha256,
     bookkeeping_ledger_sha256:match.bookkeeping_ledger_sha256,
     source_revision:d.source_revision,fingerprint_sha256:d.fingerprint_sha256,
     independent_closure_signer_id:d.independent_closure_signer_id,
     remaining_exception_count:remaining,decision:d.decision,
     nonce:d.nonce,issued_at:d.issued_at}),d.signature);
   if(verified)seen.add(reviewId);else invalid++;
   history.push({receipt_id:id,bookkeeping_review_receipt_id:reviewId,
     recorded_at:row.attempted_at,
     signed_closure_decision_verified:verified,
     decision:verified?d.decision:null,
     state:!verified?'HOLD_702_SIGNATURE_SOURCE_OR_REVIEW_DRIFT':
      d.decision==='hold_discrepancy'?'INDEPENDENT_SIGNED_BOOKKEEPING_HOLD':
      'INDEPENDENT_SIGNED_CLOSURE_RECOMMENDATION_LEDGER_POSTING_HOLD'});
   lastId=id;lastTime=recorded===null?-Infinity:recorded;
 }
 for(const item of source){
   const hit=history.find(x=>x.signed_closure_decision_verified&&
     x.bookkeeping_review_receipt_id===item.bookkeeping_review_receipt_id);
   item.signed_closure_decision_recorded=!!hit;
   item.decision_receipt_id=hit?.receipt_id||null;
   item.decision_recorded_at=hit?.recorded_at||null;
   item.signed_decision=hit?.decision||null;
 }
 const complete=selected&&!!prior?.history_complete&&list.length<=60&&invalid===0;
 return {status:!selected?'HOLD_SELECT_CAMPAIGN':
   !complete?'HOLD_702_SIGNED_BOOKKEEPING_DECISION_LEDGER_DRIFT':
   !distinct?'HOLD_INDEPENDENT_CLOSURE_SIGNER_NOT_CONFIGURED':
   !source.length?'HOLD_701_INDEPENDENT_BOOKKEEPING_REVIEW_REQUIRED':
   source.some(x=>!x.signed_closure_decision_recorded)?
   'HOLD_SIGNED_INDEPENDENT_BOOKKEEPING_DECISION_REQUIRED':
   source.some(x=>x.signed_decision==='hold_discrepancy')?
   'INDEPENDENT_SIGNED_BOOKKEEPING_DISCREPANCY_HOLD':
   'INDEPENDENT_CLOSURE_RECOMMENDATION_RECORDED_MANUAL_LEDGER_POSTING_HOLD',
   campaign_queue_id:selected?n:null,history_complete:complete,
   expected_signer_id:signer.id||null,independent_signer_configured:distinct,
   review:{eligible_cases:source.length,recorded_count:source.filter(x=>x.signed_closure_decision_recorded).length,
     pending_count:source.filter(x=>!x.signed_closure_decision_recorded).length,
     invalid_count:invalid,items:source.slice(0,40)},
   receipt_history:history.slice(0,40),source_repair_verified:false,
   signed_decision_is_accounting_posting:false,bookkeeping_closed:false,
   financial_certified:false,automatic_financial_close:false,
   continuous_connection_verified:false,
   connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}
async function finance702(db,env,id){
 const n=Number(id);if(!Number.isSafeInteger(n)||n<1)
   return await assessFinance702({queue_id:0},{history_complete:false},[],{});
 const current=await financial685(db,env,n),prior=await finance701(db,env,n);
 const history=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_review_702' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 return await assessFinance702(current,prior,history,{
   id:normalizeText(env?.FINANCIAL_BOOKKEEPING_CLOSURE_VERIFIER_ID_702),
   key:normalizeText(env?.FINANCIAL_BOOKKEEPING_CLOSURE_VERIFIER_PUBLIC_KEY_702),
   bookkeeperId:normalizeText(env?.FINANCIAL_BOOKKEEPING_VERIFIER_ID_701),
   bookkeeperKey:normalizeText(env?.FINANCIAL_BOOKKEEPING_VERIFIER_PUBLIC_KEY_701),
   sourceId:normalizeText(env?.FINANCIAL_SOURCE_LIVE_SIGNER_ID_700),
   sourceKey:normalizeText(env?.FINANCIAL_SOURCE_LIVE_PUBLIC_KEY_700),
   thirdId:normalizeText(env?.FINANCIAL_SOURCE_REPAIR_VERIFIER_ID_699),
   thirdKey:normalizeText(env?.FINANCIAL_SOURCE_REPAIR_VERIFIER_PUBLIC_KEY_699),
   custodianId:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_SIGNER_ID_696),
   custodianKey:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_CUSTODIAN_PUBLIC_KEY_696),
   reconcilerId:normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_SIGNER_ID_697),
   reconcilerKey:normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_PUBLIC_KEY_697)
 });
}
async function ownerBookkeepingDecision702(db,env,user,p){
 const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
   report=await finance702(db,env,n),reviewId=Number(p.bookkeeping_review_receipt_id),
   decision=normalizeText(p.decision),remaining=Number(p.remaining_exception_count),
   note=normalizeText(p.resolution_note),nonce=normalizeText(p.nonce),
   issued=normalizeText(p.issued_at),signature=normalizeText(p.signature);
 const candidate=report.review?.items?.find(x=>x.bookkeeping_review_receipt_id===reviewId&&
   !x.signed_closure_decision_recorded);
 const signer=normalizeText(env?.FINANCIAL_BOOKKEEPING_CLOSURE_VERIFIER_ID_702),
   key=normalizeText(env?.FINANCIAL_BOOKKEEPING_CLOSURE_VERIFIER_PUBLIC_KEY_702);
 if(!current.queue_id||!report.history_complete||!report.independent_signer_configured||
   !candidate||p.owner_reviewed!==true||
   p.expected_source_revision!==current.source_revision||
   p.expected_fingerprint_sha256!==current.fingerprint_sha256||
   !['hold_discrepancy','recommend_owner_manual_close'].includes(decision)||
   !Number.isSafeInteger(remaining)||remaining<0||remaining>10000||
   decision==='recommend_owner_manual_close'&&(remaining!==0||
     current.master_fresh!==true||current.history_complete!==true||
     !Array.isArray(current.open_cases)||current.open_cases.length!==0)||
   note.length<20||note.length>400||!nonce684(nonce)||
   !fresh684(issued,1200000)||p.independent_closure_signer_id!==signer||
   !/^[A-Za-z0-9+/_=-]{80,120}$/.test(signature)||
   !await verify684(key,claim702({queue_id:n,
     original_live_source_receipt_id:candidate.original_live_source_receipt_id,
     bookkeeping_review_receipt_id:reviewId,
     older_receipt_id:candidate.older_receipt_id,newer_receipt_id:candidate.newer_receipt_id,
     external_document_sha256:candidate.external_document_sha256,
     bookkeeping_ledger_sha256:candidate.bookkeeping_ledger_sha256,
     source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
     independent_closure_signer_id:signer,remaining_exception_count:remaining,
     decision,nonce,issued_at:issued}),signature))
   throw Error('Exact recent Build 701 signed receipt, separate sixth signer, source pin, exception decision, fresh nonce and owner approval required. Actual bookkeeping close remains HOLD.');
 const reviewTime=utcAttemptTime698(candidate.review_recorded_at);
 if(reviewTime===null||Date.now()-reviewTime>86400000)
   throw Error('Original bookkeeping review is older than 24 hours. Refresh independent source evidence. HOLD.');
 const again=await financial685(db,env,n);
 if(again.fingerprint_sha256!==current.fingerprint_sha256||
    again.source_revision!==current.source_revision)
   throw Error('Financial source changed before independent closure decision admission. HOLD.');
 const payload={original_live_source_receipt_id:candidate.original_live_source_receipt_id,
   bookkeeping_review_receipt_id:reviewId,
   older_receipt_id:candidate.older_receipt_id,newer_receipt_id:candidate.newer_receipt_id,
   external_document_sha256:candidate.external_document_sha256,
   bookkeeping_ledger_sha256:candidate.bookkeeping_ledger_sha256,
   source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
   independent_closure_signer_id:signer,remaining_exception_count:remaining,
   decision,nonce,issued_at:issued,signature,owner_user_id:user.user_id,
   owner_reviewed:true,resolution_note:note,
   original_source_repaired:false,bookkeeping_closed:false,
   financial_certified:false,continuous_connection_verified:false};
 const receiptId=await append684(db,user,n,'finance_owner_review_702',
   'independent_bookkeeping_closure_decision_702','finance702-'+n+'-'+reviewId,payload);
 const readback=await finance702(db,env,n);
 if(!readback.receipt_history.some(x=>x.receipt_id===receiptId&&
   x.signed_closure_decision_verified))
   throw Error('Independent bookkeeping closure decision failed protected ledger readback. HOLD.');
 return {status:decision==='hold_discrepancy'?
    'INDEPENDENT_SIGNED_BOOKKEEPING_DISCREPANCY_HOLD':
    'INDEPENDENT_SIGNED_CLOSURE_RECOMMENDATION_MANUAL_POSTING_HOLD',
   receipt_id:receiptId,signed_closure_decision_verified:true,
   original_source_repaired:false,bookkeeping_closed:false,financial_certified:false,
   connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}


// Build 703: a seventh independently enrolled public signer attests only a
// proposed external POSTING DOCUMENT, not independently fetched provider bytes.
// Owner acceptance is a source-pinned audit decision, not a ledger mutation.
export function claim703(x){
 return {v:1,purpose:'devilndove_independent_external_bookkeeping_posting_document_703',
 source:'devilndove',queue_id:x.queue_id,
 original_live_source_receipt_id:x.original_live_source_receipt_id,
 bookkeeping_review_receipt_id:x.bookkeeping_review_receipt_id,
 closure_decision_receipt_id:x.closure_decision_receipt_id,
 bookkeeping_ledger_sha256:x.bookkeeping_ledger_sha256,
 posting_document_sha256:x.posting_document_sha256,
 external_posting_reference:x.external_posting_reference,
 source_revision:x.source_revision,fingerprint_sha256:x.fingerprint_sha256,
 independent_posting_verifier_id:x.independent_posting_verifier_id,
 nonce:x.nonce,issued_at:x.issued_at,
 decision:'external_bookkeeping_posting_document_intake_not_live_posting_proof'};
}
export function source703Eligible(current,case703,now=Date.now()){
 const stamp=utcAttemptTime698(case703?.decision_recorded_at,now);
 return !!case703&&case703.signed_closure_decision_recorded===true&&
 case703.signed_decision==='recommend_owner_manual_close'&&
 /^[a-f0-9]{64}$/.test(case703.bookkeeping_ledger_sha256||'')&&
 Number.isSafeInteger(case703.decision_receipt_id)&&case703.decision_receipt_id>0&&
 current?.master_fresh===true&&current.history_complete===true&&
 Array.isArray(current.open_cases)&&current.open_cases.length===0&&
 stamp!==null&&now-stamp>=-300000&&now-stamp<=86400000;
}
export async function assessFinance703(current,prior,postingRows,ownerRows,signer={},now=Date.now()){
 const n=Number(current?.queue_id),selected=Number.isSafeInteger(n)&&n>0;
 const reviews=Array.isArray(postingRows)?postingRows:[],
   owners=Array.isArray(ownerRows)?ownerRows:[];
 const distinct=!!signer.id&&!!signer.key&&
 [['sixthId','sixthKey'],['bookkeeperId','bookkeeperKey'],['sourceId','sourceKey'],
 ['thirdId','thirdKey'],['custodianId','custodianKey'],
 ['reconcilerId','reconcilerKey']].every(([id,key])=>
 !!signer[id]&&!!signer[key]&&signer.id!==signer[id]&&signer.key!==signer[key]);
 const eligible=(prior?.review?.items||[]).filter(x=>
   x.signed_closure_decision_recorded&&x.signed_decision==='recommend_owner_manual_close')
   .map(x=>({...x,posting_receipt_id:null,posting_document_sha256:null,
    external_posting_reference:null,posting_document_signed:false,
    owner_acceptance_receipt_id:null,owner_acceptance_decision:null,
    original_books_actually_closed:false}));
 const byDecision=new Map(eligible.map(x=>[x.decision_receipt_id,x]));
 const postingHistory=[],used=new Set();let invalid=0,lastId=Infinity,lastAt=Infinity;
 for(const row of reviews){
   const d=safeJson(row.response_json,{}),receipt=Number(row.social_post_attempt_id),
     linked=byDecision.get(Number(d.closure_decision_receipt_id)),
     at=utcAttemptTime698(row.attempted_at,now),
     issued=utcAttemptTime698(d.issued_at,now),
     upstream=utcAttemptTime698(linked?.decision_recorded_at,now);
   const safe=selected&&!!prior?.history_complete&&distinct&&!!linked&&
     source703Eligible(current,linked,now)&&
     Number.isSafeInteger(receipt)&&receipt>linked.decision_receipt_id&&receipt<lastId&&
     at!==null&&at<=lastAt&&issued!==null&&issued<=at&&at-issued<=1200000&&
     upstream!==null&&at-upstream>=0&&at-upstream<=86400000&&
     !used.has(linked.decision_receipt_id)&&
     row.attempt_status==='independent_external_posting_document_intake_703'&&
     d.original_live_source_receipt_id===linked.original_live_source_receipt_id&&
     d.bookkeeping_review_receipt_id===linked.bookkeeping_review_receipt_id&&
     d.bookkeeping_ledger_sha256===linked.bookkeeping_ledger_sha256&&
     /^[a-f0-9]{64}$/.test(d.posting_document_sha256||'')&&
     /^[A-Za-z0-9][A-Za-z0-9_.:/#-]{7,159}$/.test(d.external_posting_reference||'')&&
     d.source_revision===current?.source_revision&&
     d.fingerprint_sha256===current?.fingerprint_sha256&&
     d.independent_posting_verifier_id===signer.id&&nonce684(d.nonce)&&
     d.owner_reviewed===true&&Number.isSafeInteger(Number(d.owner_user_id))&&
     Number(d.owner_user_id)>0&&typeof d.resolution_note==='string'&&
     d.resolution_note.length>=20&&d.resolution_note.length<=400&&
     d.actual_posting_independently_read_back===false&&
     d.bookkeeping_closed===false&&d.financial_certified===false&&
     d.continuous_connection_verified===false&&
     /^[A-Za-z0-9+/_=-]{80,120}$/.test(d.signature||'');
   const verified=!!safe&&await verify684(signer.key,claim703({
     queue_id:n,original_live_source_receipt_id:linked.original_live_source_receipt_id,
     bookkeeping_review_receipt_id:linked.bookkeeping_review_receipt_id,
     closure_decision_receipt_id:linked.decision_receipt_id,
     bookkeeping_ledger_sha256:linked.bookkeeping_ledger_sha256,
     posting_document_sha256:d.posting_document_sha256,
     external_posting_reference:d.external_posting_reference,
     source_revision:d.source_revision,fingerprint_sha256:d.fingerprint_sha256,
     independent_posting_verifier_id:d.independent_posting_verifier_id,
     nonce:d.nonce,issued_at:d.issued_at}),d.signature);
   if(verified){
     used.add(linked.decision_receipt_id);
     linked.posting_receipt_id=receipt;
     linked.posting_document_sha256=d.posting_document_sha256;
     linked.external_posting_reference=d.external_posting_reference;
     linked.posting_document_signed=true;
     linked.posting_recorded_at=row.attempted_at;
   }else invalid++;
   postingHistory.push({receipt_id:receipt,
     closure_decision_receipt_id:Number(d.closure_decision_receipt_id),
     signature_verified:verified,
     status:verified?'SIGNED_POSTING_DOCUMENT_INTAKE_LIVE_PROVIDER_READBACK_HOLD':
       'HOLD_INVALID_POSTING_DOCUMENT_PROVENANCE_703'});
   lastId=receipt;lastAt=at===null?-Infinity:at;
 }
 const ownerHistory=[];let ownerInvalid=0,lastOwnerId=Infinity,lastOwnerAt=Infinity;
 const seenOwner=new Set();
 for(const row of owners){
   const d=safeJson(row.response_json,{}),receipt=Number(row.social_post_attempt_id),
     postingId=Number(d.posting_receipt_id),
     linked=eligible.find(x=>x.posting_receipt_id===postingId),
     at=utcAttemptTime698(row.attempted_at,now),
     posted=utcAttemptTime698(linked?.posting_recorded_at,now);
   const decision=['accept_document_for_manual_financial_close','hold_posting_discrepancy'].includes(d.decision);
   const accepted=selected&&!!prior?.history_complete&&distinct&&!!linked&&
     linked.posting_document_signed&&source703Eligible(current,linked,now)&&
     Number.isSafeInteger(receipt)&&receipt>postingId&&receipt<lastOwnerId&&
     at!==null&&at<=lastOwnerAt&&posted!==null&&at-posted>=0&&
     at-posted<=86400000&&!seenOwner.has(postingId)&&decision&&
     row.attempt_status===(d.decision==='accept_document_for_manual_financial_close'?
       'owner_posting_evidence_accepted_703':'owner_posting_evidence_disputed_703')&&
     d.closure_decision_receipt_id===linked.decision_receipt_id&&
     d.posting_document_sha256===linked.posting_document_sha256&&
     d.external_posting_reference===linked.external_posting_reference&&
     d.source_revision===current?.source_revision&&
     d.fingerprint_sha256===current?.fingerprint_sha256&&
     d.owner_reviewed===true&&Number.isSafeInteger(Number(d.owner_user_id))&&
     Number(d.owner_user_id)>0&&typeof d.resolution_note==='string'&&
     d.resolution_note.length>=25&&d.resolution_note.length<=600&&
     d.actual_posting_independently_read_back===false&&
     d.bookkeeping_closed===false&&d.financial_certified===false&&
     d.continuous_connection_verified===false;
   if(accepted){
     seenOwner.add(postingId);
     linked.owner_acceptance_receipt_id=receipt;
     linked.owner_acceptance_decision=d.decision;
     linked.owner_acceptance_recorded_at=row.attempted_at;
   }else ownerInvalid++;
   ownerHistory.push({receipt_id:receipt,posting_receipt_id:postingId,
     owner_source_bound_acceptance:accepted,decision:accepted?d.decision:null});
   lastOwnerId=receipt;lastOwnerAt=at===null?-Infinity:at;
 }
 const complete=selected&&!!prior?.history_complete&&reviews.length<=60&&
   owners.length<=60&&invalid===0&&ownerInvalid===0;
 return {status:!selected?'HOLD_SELECT_CAMPAIGN':
   !complete?'HOLD_703_ORIGINAL_POSTING_OR_OWNER_AUDIT_DRIFT':
   !distinct?'HOLD_SEVENTH_INDEPENDENT_SIGNER_NOT_ENROLLED':
   !eligible.length?'HOLD_702_SIGNED_MANUAL_CLOSE_RECOMMENDATION_REQUIRED':
   eligible.some(x=>!x.posting_document_signed)?'HOLD_INDEPENDENT_POSTING_DOCUMENT_REQUIRED':
   eligible.some(x=>!x.owner_acceptance_decision)?'HOLD_OWNER_FINANCIAL_ACCEPTANCE_REQUIRED':
   eligible.some(x=>x.owner_acceptance_decision==='hold_posting_discrepancy')?
     'OWNER_POSTING_DISCREPANCY_HOLD':
     'OWNER_POSTING_DOCUMENT_ACCEPTANCE_RECORDED_ACTUAL_BOOK_CLOSE_HOLD',
   campaign_queue_id:selected?n:null,history_complete:complete,
   independent_signer_id:signer.id||null,independent_signer_configured:distinct,
   posting:{eligible_count:eligible.length,signed_count:eligible.filter(x=>x.posting_document_signed).length,
     owner_accepted_count:eligible.filter(x=>x.owner_acceptance_decision==='accept_document_for_manual_financial_close').length,
     pending_count:eligible.filter(x=>!x.owner_acceptance_decision).length,
     invalid_count:invalid+ownerInvalid,items:eligible.slice(0,40)},
   posting_history:postingHistory.slice(0,40),owner_history:ownerHistory.slice(0,40),
   original_external_posting_verified:false,
   owner_document_acceptance_is_actual_book_close:false,
   bookkeeping_closed:false,financial_certified:false,
   automatic_financial_close:false,continuous_connection_verified:false,
   connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}
async function finance703(db,env,id){
 const n=Number(id);
 if(!Number.isSafeInteger(n)||n<1)
   return await assessFinance703({queue_id:0},{history_complete:false},[],[],{});
 const current=await financial685(db,env,n),
  prior=await finance702(db,env,n);
 const posting=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_posting_703' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 const owners=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_closure_703' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 return await assessFinance703(current,prior,posting,owners,{
   id:normalizeText(env?.FINANCIAL_POSTING_VERIFIER_ID_703),
   key:normalizeText(env?.FINANCIAL_POSTING_VERIFIER_PUBLIC_KEY_703),
   sixthId:normalizeText(env?.FINANCIAL_BOOKKEEPING_CLOSURE_VERIFIER_ID_702),
   sixthKey:normalizeText(env?.FINANCIAL_BOOKKEEPING_CLOSURE_VERIFIER_PUBLIC_KEY_702),
   bookkeeperId:normalizeText(env?.FINANCIAL_BOOKKEEPING_VERIFIER_ID_701),
   bookkeeperKey:normalizeText(env?.FINANCIAL_BOOKKEEPING_VERIFIER_PUBLIC_KEY_701),
   sourceId:normalizeText(env?.FINANCIAL_SOURCE_LIVE_SIGNER_ID_700),
   sourceKey:normalizeText(env?.FINANCIAL_SOURCE_LIVE_PUBLIC_KEY_700),
   thirdId:normalizeText(env?.FINANCIAL_SOURCE_REPAIR_VERIFIER_ID_699),
   thirdKey:normalizeText(env?.FINANCIAL_SOURCE_REPAIR_VERIFIER_PUBLIC_KEY_699),
   custodianId:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_SIGNER_ID_696),
   custodianKey:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_CUSTODIAN_PUBLIC_KEY_696),
   reconcilerId:normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_SIGNER_ID_697),
   reconcilerKey:normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_PUBLIC_KEY_697)
 });
}
async function ownerPostingEvidence703(db,env,user,p){
 const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
   report=await finance703(db,env,n),
   decisionId=Number(p.closure_decision_receipt_id),
   candidate=report.posting?.items?.find(x=>x.decision_receipt_id===decisionId&&!x.posting_document_signed),
   digest=normalizeText(p.posting_document_sha256).toLowerCase(),
   reference=normalizeText(p.external_posting_reference),
   signer=normalizeText(env?.FINANCIAL_POSTING_VERIFIER_ID_703),
   key=normalizeText(env?.FINANCIAL_POSTING_VERIFIER_PUBLIC_KEY_703),
   nonce=normalizeText(p.nonce),issued=normalizeText(p.issued_at),
   signature=normalizeText(p.signature),note=normalizeText(p.resolution_note);
 if(!current.queue_id||!report.history_complete||!report.independent_signer_configured||
   !source703Eligible(current,candidate)||!candidate||p.owner_reviewed!==true||
   p.expected_source_revision!==current.source_revision||
   p.expected_fingerprint_sha256!==current.fingerprint_sha256||
   !/^[a-f0-9]{64}$/.test(digest)||
   !/^[A-Za-z0-9][A-Za-z0-9_.:/#-]{7,159}$/.test(reference)||
   note.length<20||note.length>400||!nonce684(nonce)||
   !fresh684(issued,1200000)||p.independent_posting_verifier_id!==signer||
   !/^[A-Za-z0-9+/_=-]{80,120}$/.test(signature)||
   !await verify684(key,claim703({queue_id:n,
     original_live_source_receipt_id:candidate.original_live_source_receipt_id,
     bookkeeping_review_receipt_id:candidate.bookkeeping_review_receipt_id,
     closure_decision_receipt_id:decisionId,
     bookkeeping_ledger_sha256:candidate.bookkeeping_ledger_sha256,
     posting_document_sha256:digest,external_posting_reference:reference,
     source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
     independent_posting_verifier_id:signer,nonce,issued_at:issued}),signature))
   throw Error('Seventh signer original closure recommendation, pinned posting document SHA, external reference and fresh owner reviewed source required. Actual provider POST remains HOLD.');
 const latest=await financial685(db,env,n);
 if(latest.source_revision!==current.source_revision||
    latest.fingerprint_sha256!==current.fingerprint_sha256||
    latest.master_fresh!==true||latest.open_cases?.length)
   throw Error('Original financial source or Master changed before posting evidence intake. HOLD.');
 const payload={closure_decision_receipt_id:decisionId,
   original_live_source_receipt_id:candidate.original_live_source_receipt_id,
   bookkeeping_review_receipt_id:candidate.bookkeeping_review_receipt_id,
   bookkeeping_ledger_sha256:candidate.bookkeeping_ledger_sha256,
   posting_document_sha256:digest,external_posting_reference:reference,
   source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
   independent_posting_verifier_id:signer,nonce,issued_at:issued,signature,
   owner_user_id:user.user_id,owner_reviewed:true,resolution_note:note,
   actual_posting_independently_read_back:false,
   bookkeeping_closed:false,financial_certified:false,continuous_connection_verified:false};
 const receiptId=await append684(db,user,n,'finance_posting_703',
   'independent_external_posting_document_intake_703',
   'finance703-posting-'+n+'-'+decisionId,payload);
 const after=await finance703(db,env,n);
 if(!after.posting_history.some(x=>x.receipt_id===receiptId&&x.signature_verified))
   throw Error('Independent posting document intake did not verify on protected readback. HOLD.');
 return {status:'INDEPENDENT_POSTING_DOCUMENT_INTAKE_VERIFIED_PROVIDER_READBACK_HOLD',
   receipt_id:receiptId,actual_external_posting_verified:false,
   bookkeeping_closed:false,financial_certified:false,
   connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}
async function ownerFinancialClosure703(db,env,user,p){
 const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
   report=await finance703(db,env,n),
   postingId=Number(p.posting_receipt_id),
   candidate=report.posting?.items?.find(x=>x.posting_receipt_id===postingId&&
     x.posting_document_signed&&!x.owner_acceptance_decision),
   decision=normalizeText(p.decision),note=normalizeText(p.resolution_note);
 if(!current.queue_id||!report.history_complete||!candidate||
   !source703Eligible(current,candidate)||
   !['accept_document_for_manual_financial_close','hold_posting_discrepancy'].includes(decision)||
   p.owner_reviewed!==true||note.length<25||note.length>600||
   p.expected_source_revision!==current.source_revision||
   p.expected_fingerprint_sha256!==current.fingerprint_sha256||
   p.expected_posting_document_sha256!==candidate.posting_document_sha256)
   throw Error('Source-bound verified seventh-signer posting document and explicit owner acceptance/dispute required. Actual external book close remains HOLD.');
 const posted=utcAttemptTime698(candidate.posting_recorded_at);
 if(posted===null||Date.now()-posted>86400000)
   throw Error('Independent posting document older than 24 hours; refresh external evidence. HOLD.');
 const latest=await financial685(db,env,n);
 if(latest.source_revision!==current.source_revision||
   latest.fingerprint_sha256!==current.fingerprint_sha256||
   latest.master_fresh!==true||latest.open_cases?.length)
   throw Error('Original financial source drift or open owner incidents detected. HOLD.');
 const payload={posting_receipt_id:postingId,
   closure_decision_receipt_id:candidate.decision_receipt_id,
   posting_document_sha256:candidate.posting_document_sha256,
   external_posting_reference:candidate.external_posting_reference,
   source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
   decision,owner_user_id:user.user_id,owner_reviewed:true,resolution_note:note,
   actual_posting_independently_read_back:false,
   bookkeeping_closed:false,financial_certified:false,continuous_connection_verified:false};
 const receiptId=await append684(db,user,n,'finance_owner_closure_703',
   decision==='accept_document_for_manual_financial_close'?
    'owner_posting_evidence_accepted_703':'owner_posting_evidence_disputed_703',
   'finance703-owner-'+n+'-'+postingId,payload);
 const after=await finance703(db,env,n);
 if(!after.owner_history.some(x=>x.receipt_id===receiptId&&x.owner_source_bound_acceptance))
   throw Error('Protected source-bound original owner financial decision failed readback. HOLD.');
 return {status:decision==='accept_document_for_manual_financial_close'?
   'OWNER_POSTING_DOCUMENT_ACCEPTED_ACTUAL_BOOK_CLOSE_HOLD':'OWNER_POSTING_DISCREPANCY_HOLD',
   receipt_id:receiptId,owner_financial_document_accepted:decision==='accept_document_for_manual_financial_close',
   actual_external_posting_verified:false,bookkeeping_closed:false,financial_certified:false,
   connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}


// Build 704: a live, pinned, directly queried HTTPS posting SOURCE with an
// eighth independent Ed25519 verifier. Even its signature does NOT certify
// accounting close, audited profit, bank settlement or continuous connection.
export function claim704(x){
 return {v:1,purpose:'devilndove_live_bookkeeping_posting_source_readback_704',
  source:'devilndove',queue_id:x.queue_id,
  original_live_source_receipt_id:x.original_live_source_receipt_id,
  bookkeeping_review_receipt_id:x.bookkeeping_review_receipt_id,
  closure_decision_receipt_id:x.closure_decision_receipt_id,
  posting_receipt_id:x.posting_receipt_id,
  owner_document_acceptance_receipt_id:x.owner_document_acceptance_receipt_id,
  posting_document_sha256:x.posting_document_sha256,
  bookkeeping_ledger_sha256:x.bookkeeping_ledger_sha256,
  external_posting_reference:x.external_posting_reference,
  source_revision:x.source_revision,fingerprint_sha256:x.fingerprint_sha256,
  posting_status:x.posting_status,external_record_observed:x.external_record_observed,
  signer_id:x.signer_id,nonce:x.nonce,observed_at:x.observed_at,
  decision:'fresh_signed_live_posting_record_not_financial_book_close'};
}
export function eligibleLive704(current,source,now=Date.now()){
 const age=utcAttemptTime698(source?.owner_acceptance_recorded_at,now);
 return !!source&&source.owner_acceptance_decision==='accept_document_for_manual_financial_close'&&
   Number.isSafeInteger(source.owner_acceptance_receipt_id)&&source.owner_acceptance_receipt_id>0&&
   source.posting_document_signed===true&&
   /^[a-f0-9]{64}$/.test(source.posting_document_sha256||'')&&
   current?.master_fresh===true&&current?.history_complete===true&&
   Array.isArray(current?.open_cases)&&current.open_cases.length===0&&
   age!==null&&now-age>=-300000&&now-age<=86400000;
}
export async function assessFinance704(current,prior,liveRows,ownerRows,signer={},now=Date.now()){
 const n=Number(current?.queue_id),valid=Number.isSafeInteger(n)&&n>0,
  live=Array.isArray(liveRows)?liveRows:[],owners=Array.isArray(ownerRows)?ownerRows:[];
 const distinct=!!signer.id&&!!signer.key&&
  [['seventhId','seventhKey'],['sixthId','sixthKey'],['fifthId','fifthKey'],
   ['fourthId','fourthKey'],['thirdId','thirdKey'],['secondId','secondKey'],
   ['firstId','firstKey']].every(([i,k])=>
    !!signer[i]&&!!signer[k]&&signer.id!==signer[i]&&signer.key!==signer[k]);
 const items=(prior?.posting?.items||[]).filter(x=>
   x.owner_acceptance_decision==='accept_document_for_manual_financial_close'&&
   x.posting_document_signed&&Number.isSafeInteger(Number(x.posting_receipt_id))&&
   Number(x.posting_receipt_id)>0).map(x=>({
   ...x,live_receipt_id:null,independent_live_source_verified:false,
   source_observed_at:null,financial_readiness_receipt_id:null,
   financial_readiness_decision:null,actual_book_close_verified:false}));
 const lookup=new Map(items.map(x=>[x.posting_receipt_id,x]));
 let invalid=0,priorId=Infinity,priorAt=Infinity;const used=new Set(),readbacks=[];
 for(const row of live){
   const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
    source=lookup.get(Number(d.posting_receipt_id)),at=utcAttemptTime698(row.attempted_at,now),
    observed=utcAttemptTime698(d.observed_at,now),
    ownerAt=utcAttemptTime698(source?.owner_acceptance_recorded_at,now);
   const safe=valid&&!!prior?.history_complete&&distinct&&!!signer.originAuthorized&&
    !!source&&eligibleLive704(current,source,now)&&
    Number.isSafeInteger(id)&&id>source.owner_acceptance_receipt_id&&id<priorId&&
    at!==null&&at<=priorAt&&observed!==null&&observed<=at&&
    at-observed<=300000&&ownerAt!==null&&at-ownerAt>=0&&
    at-ownerAt<=86400000&&!used.has(source.posting_receipt_id)&&
    row.attempt_status==='independent_live_posting_source_readback_704'&&
    d.original_live_source_receipt_id===source.original_live_source_receipt_id&&
    d.bookkeeping_review_receipt_id===source.bookkeeping_review_receipt_id&&
    d.closure_decision_receipt_id===source.decision_receipt_id&&
    d.owner_document_acceptance_receipt_id===source.owner_acceptance_receipt_id&&
    d.posting_document_sha256===source.posting_document_sha256&&
    d.bookkeeping_ledger_sha256===source.bookkeeping_ledger_sha256&&
    d.external_posting_reference===source.external_posting_reference&&
    d.source_revision===current.source_revision&&
    d.fingerprint_sha256===current.fingerprint_sha256&&
    d.posting_status==='posted'&&d.external_record_observed===true&&
    d.signer_id===signer.id&&nonce684(d.nonce)&&
    d.independent_live_source_verified===true&&d.owner_reviewed===true&&
    Number.isSafeInteger(Number(d.owner_user_id))&&Number(d.owner_user_id)>0&&
    typeof d.resolution_note==='string'&&d.resolution_note.length>=20&&
    d.resolution_note.length<=400&&
    d.bookkeeping_closed===false&&d.financial_certified===false&&
    d.continuous_connection_verified===false&&
    /^[A-Za-z0-9+/_=-]{80,120}$/.test(d.signature||'');
   const signed=!!safe&&await verify684(signer.key,claim704({
    queue_id:n,original_live_source_receipt_id:source.original_live_source_receipt_id,
    bookkeeping_review_receipt_id:source.bookkeeping_review_receipt_id,
    closure_decision_receipt_id:source.decision_receipt_id,
    posting_receipt_id:source.posting_receipt_id,
    owner_document_acceptance_receipt_id:source.owner_acceptance_receipt_id,
    posting_document_sha256:source.posting_document_sha256,
    bookkeeping_ledger_sha256:source.bookkeeping_ledger_sha256,
    external_posting_reference:source.external_posting_reference,
    source_revision:d.source_revision,fingerprint_sha256:d.fingerprint_sha256,
    posting_status:d.posting_status,external_record_observed:d.external_record_observed,
    signer_id:d.signer_id,nonce:d.nonce,observed_at:d.observed_at}),d.signature);
   if(signed){
    used.add(source.posting_receipt_id);
    source.live_receipt_id=id;source.independent_live_source_verified=true;
    source.source_observed_at=d.observed_at;
    source.original_live_nonce_704=d.nonce;
    source.live_receipt_recorded_at=row.attempted_at;
   }else invalid++;
   readbacks.push({receipt_id:id,posting_receipt_id:Number(d.posting_receipt_id),
     independently_signed_posting_readback:signed,
     status:signed?'INDEPENDENT_LIVE_POSTING_SOURCE_CONFIRMED_BOOKS_HOLD':
       'HOLD_LIVE_POSTING_SOURCE_OR_SIGNATURE_DRIFT'});
   priorId=id;priorAt=at===null?-Infinity:at;
 }
 const reviews=[];let badOwners=0,lastReviewId=Infinity,lastReviewAt=Infinity;
 const ownerSeen=new Set();
 for(const row of owners){
   const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
    source=items.find(x=>x.live_receipt_id===Number(d.live_receipt_id)),
    at=utcAttemptTime698(row.attempted_at,now),
    readAt=utcAttemptTime698(source?.live_receipt_recorded_at,now);
   const decision=['hold_external_posting','ready_for_final_owner_closure_review'].includes(d.decision);
   const good=valid&&!!prior?.history_complete&&distinct&&!!signer.originAuthorized&&
    !!source&&source.independent_live_source_verified&&
    Number.isSafeInteger(id)&&id>source.live_receipt_id&&id<lastReviewId&&
    at!==null&&at<=lastReviewAt&&readAt!==null&&at-readAt>=0&&
    at-readAt<=86400000&&!ownerSeen.has(source.live_receipt_id)&&decision&&
    row.attempt_status===(d.decision==='hold_external_posting'?
      'owner_live_posting_readback_hold_704':'owner_financial_closure_readiness_704')&&
    d.posting_receipt_id===source.posting_receipt_id&&
    d.owner_document_acceptance_receipt_id===source.owner_acceptance_receipt_id&&
    d.posting_document_sha256===source.posting_document_sha256&&
    d.external_posting_reference===source.external_posting_reference&&
    d.source_revision===current.source_revision&&
    d.fingerprint_sha256===current.fingerprint_sha256&&
    d.owner_reviewed===true&&Number.isSafeInteger(Number(d.owner_user_id))&&
    Number(d.owner_user_id)>0&&
    typeof d.resolution_note==='string'&&d.resolution_note.length>=25&&
    d.resolution_note.length<=600&&d.bookkeeping_closed===false&&
    d.financial_certified===false&&d.continuous_connection_verified===false;
   if(good){
     ownerSeen.add(source.live_receipt_id);
     source.financial_readiness_receipt_id=id;
     source.financial_readiness_decision=d.decision;
     source.financial_readiness_recorded_at=row.attempted_at;
   }else badOwners++;
   reviews.push({receipt_id:id,live_receipt_id:Number(d.live_receipt_id),
     original_owner_verified:good,decision:good?d.decision:null});
   lastReviewId=id;lastReviewAt=at===null?-Infinity:at;
 }
 const complete=valid&&!!prior?.history_complete&&live.length<=60&&
   owners.length<=60&&invalid===0&&badOwners===0;
 return {status:!valid?'HOLD_SELECT_CAMPAIGN':!complete?
     'HOLD_704_LIVE_SOURCE_OR_OWNER_LEDGER_DRIFT':!distinct?
     'HOLD_EIGHTH_INDEPENDENT_SOURCE_SIGNER_NOT_ENROLLED':
     !signer.originAuthorized?'HOLD_704_PINNED_SOURCE_ORIGIN_REQUIRED':
     !items.length?'HOLD_703_ORIGINAL_OWNER_ACCEPTED_POSTING_DOCUMENT_REQUIRED':
     items.some(x=>!x.independent_live_source_verified)?
       'HOLD_LIVE_BOOKKEEPING_POSTING_SOURCE_READBACK_REQUIRED':
     items.some(x=>!x.financial_readiness_decision)?
       'INDEPENDENT_LIVE_POSTING_VERIFIED_OWNER_READINESS_HOLD':
     items.some(x=>x.financial_readiness_decision==='hold_external_posting')?
       'OWNER_LIVE_POSTING_EXCEPTION_HOLD':
       'OWNER_FINANCIAL_CLOSURE_READINESS_RECORDED_ACTUAL_BOOK_CLOSE_HOLD',
   campaign_queue_id:valid?n:null,history_complete:complete,
   independent_signer_id:signer.id||null,
   independent_signer_configured:distinct,origin_authorized:!!signer.originAuthorized,
   readback:{eligible:items.length,verified_count:items.filter(x=>x.independent_live_source_verified).length,
    owner_reviewed_count:items.filter(x=>!!x.financial_readiness_decision).length,
    invalid_count:invalid+badOwners,items:items.slice(0,40)},
   live_receipts:readbacks.slice(0,40),owner_receipts:reviews.slice(0,40),
   provider_verified_one_time_snapshot_only:true,bookkeeping_closed:false,
   financial_certified:false,continuous_connection_verified:false,
   automatic_financial_close:false,connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}
async function finance704(db,env,id){
 const n=Number(id);
 if(!Number.isSafeInteger(n)||n<1)
   return await assessFinance704({queue_id:0},{history_complete:false},[],[],{});
 const current=await financial685(db,env,n),prior=await finance703(db,env,n);
 const receipts=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_live_posting_704' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 const owners=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_readiness_704' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 return await assessFinance704(current,prior,receipts,owners,{
  id:normalizeText(env?.FINANCIAL_POSTING_LIVE_SIGNER_ID_704),
  key:normalizeText(env?.FINANCIAL_POSTING_LIVE_PUBLIC_KEY_704),
  seventhId:normalizeText(env?.FINANCIAL_POSTING_VERIFIER_ID_703),
  seventhKey:normalizeText(env?.FINANCIAL_POSTING_VERIFIER_PUBLIC_KEY_703),
  sixthId:normalizeText(env?.FINANCIAL_BOOKKEEPING_CLOSURE_VERIFIER_ID_702),
  sixthKey:normalizeText(env?.FINANCIAL_BOOKKEEPING_CLOSURE_VERIFIER_PUBLIC_KEY_702),
  fifthId:normalizeText(env?.FINANCIAL_BOOKKEEPING_VERIFIER_ID_701),
  fifthKey:normalizeText(env?.FINANCIAL_BOOKKEEPING_VERIFIER_PUBLIC_KEY_701),
  fourthId:normalizeText(env?.FINANCIAL_SOURCE_LIVE_SIGNER_ID_700),
  fourthKey:normalizeText(env?.FINANCIAL_SOURCE_LIVE_PUBLIC_KEY_700),
  thirdId:normalizeText(env?.FINANCIAL_SOURCE_REPAIR_VERIFIER_ID_699),
  thirdKey:normalizeText(env?.FINANCIAL_SOURCE_REPAIR_VERIFIER_PUBLIC_KEY_699),
  secondId:normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_SIGNER_ID_697),
  secondKey:normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_PUBLIC_KEY_697),
  firstId:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_SIGNER_ID_696),
  firstKey:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_CUSTODIAN_PUBLIC_KEY_696),
  originAuthorized:!!sourceOrigin700(env?.FINANCIAL_POSTING_LIVE_READBACK_URL_704,
     env?.FINANCIAL_POSTING_LIVE_READBACK_ORIGIN_704)
 });
}
async function livePostingReadback704(db,env,user,p){
 const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
  report=await finance704(db,env,n),postingId=Number(p.posting_receipt_id),
  source=report.readback?.items?.find(x=>x.posting_receipt_id===postingId&&
    !x.independent_live_source_verified),note=normalizeText(p.resolution_note);
 if(!current.queue_id||!report.history_complete||!report.independent_signer_configured||
   !report.origin_authorized||!source||!eligibleLive704(current,source)||
   p.owner_reviewed!==true||note.length<20||note.length>400||
   p.expected_source_revision!==current.source_revision||
   p.expected_fingerprint_sha256!==current.fingerprint_sha256)
   throw Error('Original owner accepted posting document, current source, independent signer and explicit review required. HOLD.');
 const endpoint=sourceOrigin700(env?.FINANCIAL_POSTING_LIVE_READBACK_URL_704,
  env?.FINANCIAL_POSTING_LIVE_READBACK_ORIGIN_704);
 const signerId=normalizeText(env?.FINANCIAL_POSTING_LIVE_SIGNER_ID_704),
  key=normalizeText(env?.FINANCIAL_POSTING_LIVE_PUBLIC_KEY_704);
 if(!endpoint||!signerId||!key||!env?.FINANCIAL_POSTING_LIVE_READBACK_BEARER_704)
   throw Error('Pinned independent live posting source endpoint, bearer and signer required. HOLD.');
 const nonce=crypto.randomUUID();
 endpoint.searchParams.set('queue_id',String(n));
 endpoint.searchParams.set('posting_receipt_id',String(postingId));
 endpoint.searchParams.set('source_revision',String(current.source_revision));
 endpoint.searchParams.set('nonce',nonce);
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
 let response;
 try{
   response=await fetch(endpoint.toString(),{method:'GET',redirect:'manual',signal:controller.signal,
    headers:{Accept:'application/json','Cache-Control':'no-store',
      Authorization:'Bearer '+String(env.FINANCIAL_POSTING_LIVE_READBACK_BEARER_704)}});
 }finally{clearTimeout(timeout);}
 if(!response.ok||response.redirected||response.status!==200||
   !(response.headers.get('Content-Type')||'').toLowerCase().includes('application/json')||
   Number(response.headers.get('Content-Length')||0)>32768)
   throw Error('Live external posting source returned redirect, unbounded size or invalid JSON. HOLD.');
 const reader=response.body?.getReader();
 if(!reader)throw Error('Independent source readback stream unavailable. HOLD.');
 let size=0;const chunks=[];
 try{
  while(true){
   const part=await reader.read();if(part.done)break;
   size+=part.value.byteLength;
   if(size>32768)throw Error('Live posting source exceeded bounded 32KiB read. HOLD.');
   chunks.push(part.value);
  }
 }finally{try{await reader.cancel()}catch{}}
 const combined=new Uint8Array(size);let index=0;
 for(const part of chunks){combined.set(part,index);index+=part.length;}
 let evidence;
 try{evidence=JSON.parse(new TextDecoder().decode(combined))}
 catch{throw Error('External source posted invalid JSON; no signed readback. HOLD.');}
 const signed=evidence?.claim,signature=evidence?.signature;
 const expected=claim704({
  queue_id:n,original_live_source_receipt_id:source.original_live_source_receipt_id,
  bookkeeping_review_receipt_id:source.bookkeeping_review_receipt_id,
  closure_decision_receipt_id:source.decision_receipt_id,
  posting_receipt_id:postingId,
  owner_document_acceptance_receipt_id:source.owner_acceptance_receipt_id,
  posting_document_sha256:source.posting_document_sha256,
  bookkeeping_ledger_sha256:source.bookkeeping_ledger_sha256,
  external_posting_reference:source.external_posting_reference,
  source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
  posting_status:'posted',external_record_observed:true,
  signer_id:signerId,nonce,observed_at:signed?.observed_at
 });
 if(JSON.stringify(signed)!==JSON.stringify(expected)||
   !fresh684(signed?.observed_at,300000)||
   !await verify684(key,expected,signature))
   throw Error('Independent live provider posting receipt failed nonce, timing, digest, source and Ed25519 verification. HOLD.');
 const latest=await financial685(db,env,n);
 if(latest.source_revision!==current.source_revision||
   latest.fingerprint_sha256!==current.fingerprint_sha256||
   latest.master_fresh!==true||latest.open_cases?.length)
   throw Error('Original owner financial source or Master drift detected during readback. HOLD.');
 const payload={...expected,signature,
  independent_live_source_verified:true,owner_user_id:user.user_id,owner_reviewed:true,
  resolution_note:note,bookkeeping_closed:false,financial_certified:false,
  continuous_connection_verified:false};
 const receiptId=await append684(db,user,n,'finance_live_posting_704',
  'independent_live_posting_source_readback_704','finance704-live-'+n+'-'+postingId,payload);
 const after=await finance704(db,env,n);
 if(!after.live_receipts.some(x=>x.receipt_id===receiptId&&x.independently_signed_posting_readback))
   throw Error('Source-bound original signed live posting receipt failed protected readback. HOLD.');
 return {status:'INDEPENDENT_LIVE_POSTING_SOURCE_CONFIRMED_BOOKS_HOLD',
  receipt_id:receiptId,independent_source_readback_verified:true,
  bookkeeping_closed:false,financial_certified:false,
  connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}
async function ownerFinancialReadiness704(db,env,user,p){
 const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
  report=await finance704(db,env,n),liveId=Number(p.live_receipt_id),
  source=report.readback?.items?.find(x=>x.live_receipt_id===liveId&&
   x.independent_live_source_verified&&!x.financial_readiness_decision),
  note=normalizeText(p.resolution_note),decision=normalizeText(p.decision);
 if(!current.queue_id||!report.history_complete||!source||
   !['hold_external_posting','ready_for_final_owner_closure_review'].includes(decision)||
   p.owner_reviewed!==true||note.length<25||note.length>600||
   p.expected_source_revision!==current.source_revision||
   p.expected_fingerprint_sha256!==current.fingerprint_sha256||
   p.expected_posting_document_sha256!==source.posting_document_sha256)
   throw Error('Fresh original live signed posting receipt and explicit owner financial readiness review required. HOLD.');
 const at=utcAttemptTime698(source.live_receipt_recorded_at);
 if(at===null||Date.now()-at>86400000)
   throw Error('Live signed posting source receipt older than 24 hours. Renew evidence. HOLD.');
 const latest=await financial685(db,env,n);
 if(latest.source_revision!==current.source_revision||
   latest.fingerprint_sha256!==current.fingerprint_sha256||
   latest.master_fresh!==true||latest.open_cases?.length)
   throw Error('Original source Master drift or open owner financial exceptions. HOLD.');
 const data={live_receipt_id:liveId,posting_receipt_id:source.posting_receipt_id,
  owner_document_acceptance_receipt_id:source.owner_acceptance_receipt_id,
  posting_document_sha256:source.posting_document_sha256,
  external_posting_reference:source.external_posting_reference,
  source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
  decision,owner_user_id:user.user_id,owner_reviewed:true,resolution_note:note,
  bookkeeping_closed:false,financial_certified:false,continuous_connection_verified:false};
 const receiptId=await append684(db,user,n,'finance_owner_readiness_704',
  decision==='hold_external_posting'?'owner_live_posting_readback_hold_704':
  'owner_financial_closure_readiness_704',
  'finance704-owner-'+n+'-'+liveId,data);
 const after=await finance704(db,env,n);
 if(!after.owner_receipts.some(x=>x.receipt_id===receiptId&&x.original_owner_verified))
   throw Error('Protected original owner financial readiness receipt failed durable readback. HOLD.');
 return {status:decision==='hold_external_posting'?'OWNER_LIVE_POSTING_EXCEPTION_HOLD':
   'OWNER_FINANCIAL_CLOSURE_READINESS_RECORDED_ACTUAL_BOOK_CLOSE_HOLD',
  receipt_id:receiptId,actual_bookkeeping_close:false,financial_certified:false,
  connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}


export function eligibleRenewal705(current,original,now=Date.now()){
 const at=utcAttemptTime698(original?.financial_readiness_recorded_at,now),
   observed=utcAttemptTime698(original?.source_observed_at,now);
 return !!original&&original.independent_live_source_verified===true&&
  original.financial_readiness_decision==='ready_for_final_owner_closure_review'&&
  Number.isSafeInteger(Number(original.live_receipt_id))&&original.live_receipt_id>0&&
  Number.isSafeInteger(Number(original.financial_readiness_receipt_id))&&
  original.financial_readiness_receipt_id>original.live_receipt_id&&
  nonce684(original.original_live_nonce_704)&&observed!==null&&at!==null&&
  at>=observed&&at<=now+300000&&
  current?.master_fresh===true&&current?.history_complete===true&&
  Array.isArray(current.open_cases)&&current.open_cases.length===0;
}
// Build 705 deliberately reuses the independently enrolled eighth signer and
// canonical Build 704 readback claim. The second challenge MUST be unique,
// later, and independently fetched. No cached Build 704 signed response counts.
export async function assessFinance705(current,prior,renewalRows,ownerRows,signer={},now=Date.now()){
 const id=Number(current?.queue_id),selected=Number.isSafeInteger(id)&&id>0,
   renewed=Array.isArray(renewalRows)?renewalRows:[],
   owner=Array.isArray(ownerRows)?ownerRows:[];
 const distinct=!!signer.id&&!!signer.key&&!!signer.originAuthorized&&
  [['seventhId','seventhKey'],['sixthId','sixthKey'],['fifthId','fifthKey'],
   ['fourthId','fourthKey'],['thirdId','thirdKey'],['secondId','secondKey'],
   ['firstId','firstKey']].every(([a,b])=>!!signer[a]&&!!signer[b]&&
    signer.id!==signer[a]&&signer.key!==signer[b]);
 const items=(prior?.readback?.items||[]).filter(x=>
   x.financial_readiness_decision==='ready_for_final_owner_closure_review'&&
   x.independent_live_source_verified===true).map(x=>({...x,
     continuity_receipt_id:null,continuity_verified:false,
     continued_at:null,review_receipt_id:null,review_decision:null}));
 const byPosting=new Map(items.map(x=>[x.posting_receipt_id,x]));
 const history=[];let invalid=0,lastId=Infinity,lastAt=Infinity;
 const seen=new Set();
 for(const row of renewed){
  const d=safeJson(row.response_json,{}),receipt=Number(row.social_post_attempt_id),
    original=byPosting.get(Number(d.posting_receipt_id)),
    at=utcAttemptTime698(row.attempted_at,now),
    observed=utcAttemptTime698(d.observed_at,now),
    older=utcAttemptTime698(original?.source_observed_at,now),
    readiness=utcAttemptTime698(original?.financial_readiness_recorded_at,now);
  const safe=selected&&!!prior?.history_complete&&distinct&&
    !!original&&eligibleRenewal705(current,original,now)&&
    Number.isSafeInteger(receipt)&&receipt>original.financial_readiness_receipt_id&&receipt<lastId&&
    at!==null&&at<=lastAt&&observed!==null&&observed<=at&&
    at-observed<=300000&&older!==null&&observed>older&&
    readiness!==null&&at>=readiness&&
    !seen.has(original.posting_receipt_id)&&
    row.attempt_status==='independent_posting_continuity_source_705'&&
    Number(d.prior_live_receipt_id)===Number(original.live_receipt_id)&&
    Number(d.prior_owner_readiness_receipt_id)===Number(original.financial_readiness_receipt_id)&&
    d.original_live_source_receipt_id===original.original_live_source_receipt_id&&
    d.bookkeeping_review_receipt_id===original.bookkeeping_review_receipt_id&&
    d.closure_decision_receipt_id===original.decision_receipt_id&&
    d.owner_document_acceptance_receipt_id===original.owner_acceptance_receipt_id&&
    d.posting_document_sha256===original.posting_document_sha256&&
    d.bookkeeping_ledger_sha256===original.bookkeeping_ledger_sha256&&
    d.external_posting_reference===original.external_posting_reference&&
    d.source_revision===current.source_revision&&
    d.fingerprint_sha256===current.fingerprint_sha256&&
    d.posting_status==='posted'&&d.external_record_observed===true&&
    d.signer_id===signer.id&&nonce684(d.nonce)&&
    d.nonce!==original.original_live_nonce_704&&
    d.independent_source_continuity_verified===true&&
    d.owner_reviewed===true&&Number.isSafeInteger(Number(d.owner_user_id))&&
    Number(d.owner_user_id)>0&&typeof d.resolution_note==='string'&&
    d.resolution_note.length>=25&&d.resolution_note.length<=600&&
    d.bookkeeping_closed===false&&d.financial_certified===false&&
    d.continuous_connection_verified===false&&
    /^[A-Za-z0-9+/_=-]{80,120}$/.test(d.signature||'');
  const verified=!!safe&&await verify684(signer.key,claim704({
    queue_id:id,original_live_source_receipt_id:original.original_live_source_receipt_id,
    bookkeeping_review_receipt_id:original.bookkeeping_review_receipt_id,
    closure_decision_receipt_id:original.decision_receipt_id,
    posting_receipt_id:original.posting_receipt_id,
    owner_document_acceptance_receipt_id:original.owner_acceptance_receipt_id,
    posting_document_sha256:original.posting_document_sha256,
    bookkeeping_ledger_sha256:original.bookkeeping_ledger_sha256,
    external_posting_reference:original.external_posting_reference,
    source_revision:d.source_revision,fingerprint_sha256:d.fingerprint_sha256,
    posting_status:d.posting_status,external_record_observed:d.external_record_observed,
    signer_id:d.signer_id,nonce:d.nonce,observed_at:d.observed_at}),d.signature);
  if(verified){
    seen.add(original.posting_receipt_id);
    original.continuity_receipt_id=receipt;original.continuity_verified=true;
    original.continued_at=row.attempted_at;
  }else invalid++;
  history.push({receipt_id:receipt,posting_receipt_id:Number(d.posting_receipt_id),
    original_live_receipt_id:Number(d.prior_live_receipt_id),
    continuity_verified:verified,
    status:verified?'FRESH_INDEPENDENT_POSTING_CONTINUITY_VERIFIED_BOOK_CLOSE_HOLD':
      'HOLD_705_SIGNED_CONTINUITY_SOURCE_MISMATCH'});
  lastId=receipt;lastAt=at===null?-Infinity:at;
 }
 let ownerInvalid=0,lastOwnerId=Infinity,lastOwnerAt=Infinity;
 const ownerHistory=[],ownerSeen=new Set();
 for(const row of owner){
  const d=safeJson(row.response_json,{}),receipt=Number(row.social_post_attempt_id),
    original=items.find(x=>x.continuity_receipt_id===Number(d.continuity_receipt_id)),
    at=utcAttemptTime698(row.attempted_at,now),
    witnessed=utcAttemptTime698(original?.continued_at,now),
    decision=['hold_posting_continuity_drift','recommend_manual_financial_closure_review'].includes(d.decision);
  const accepted=selected&&!!prior?.history_complete&&distinct&&!!original&&
    original.continuity_verified&&
    Number.isSafeInteger(receipt)&&receipt>original.continuity_receipt_id&&receipt<lastOwnerId&&
    at!==null&&at<=lastOwnerAt&&witnessed!==null&&at>=witnessed&&
    at-witnessed<=86400000&&!ownerSeen.has(original.continuity_receipt_id)&&decision&&
    row.attempt_status===(d.decision==='hold_posting_continuity_drift'?
      'owner_posting_continuity_hold_705':'owner_financial_evidence_review_705')&&
    d.posting_receipt_id===original.posting_receipt_id&&
    d.prior_live_receipt_id===original.live_receipt_id&&
    d.posting_document_sha256===original.posting_document_sha256&&
    d.bookkeeping_ledger_sha256===original.bookkeeping_ledger_sha256&&
    d.external_posting_reference===original.external_posting_reference&&
    d.source_revision===current.source_revision&&
    d.fingerprint_sha256===current.fingerprint_sha256&&
    d.owner_reviewed===true&&Number.isSafeInteger(Number(d.owner_user_id))&&
    Number(d.owner_user_id)>0&&typeof d.resolution_note==='string'&&
    d.resolution_note.length>=25&&d.resolution_note.length<=600&&
    d.bookkeeping_closed===false&&d.financial_certified===false&&
    d.continuous_connection_verified===false;
  if(accepted){
    ownerSeen.add(original.continuity_receipt_id);
    original.review_receipt_id=receipt;original.review_decision=d.decision;
    original.review_recorded_at=row.attempted_at;
  }else ownerInvalid++;
  ownerHistory.push({receipt_id:receipt,continuity_receipt_id:Number(d.continuity_receipt_id),
    owner_evidence_verified:accepted,decision:accepted?d.decision:null});
  lastOwnerId=receipt;lastOwnerAt=at===null?-Infinity:at;
 }
 const complete=selected&&!!prior?.history_complete&&renewed.length<=60&&
  owner.length<=60&&invalid===0&&ownerInvalid===0;
 return {status:!selected?'HOLD_SELECT_CAMPAIGN':
   !complete?'HOLD_705_SIGNED_SOURCE_OR_OWNER_HISTORY_DRIFT':
   !distinct?'HOLD_INDEPENDENT_POSTING_CONTINUITY_SOURCE_NOT_CONFIGURED':
   !items.length?'HOLD_704_OWNER_FINANCIAL_READINESS_REQUIRED':
   items.some(x=>!x.continuity_verified)?'HOLD_FRESH_INDEPENDENT_POSTING_CONTINUITY_REQUIRED':
   items.some(x=>!x.review_decision)?'FRESH_POSTING_CONTINUITY_VERIFIED_OWNER_EVIDENCE_REVIEW_HOLD':
   items.some(x=>x.review_decision==='hold_posting_continuity_drift')?
      'OWNER_POSTING_CONTINUITY_DISCREPANCY_HOLD':
      'OWNER_EVIDENCE_REVIEW_RECOMMENDATION_BOOKS_STILL_HOLD',
   campaign_queue_id:selected?id:null,history_complete:complete,
   independent_signer_id:signer.id||null,independent_source_configured:distinct,
   eligible_count:items.length,continuity_verified_count:items.filter(x=>x.continuity_verified).length,
   owner_reviewed_count:items.filter(x=>!!x.review_decision).length,
   invalid_count:invalid+ownerInvalid,items:items.slice(0,40),
   continuity_receipts:history.slice(0,40),owner_receipts:ownerHistory.slice(0,40),
   external_posting_reverified_at_one_time_only:true,
   actual_financial_book_close:false,bookkeeping_closed:false,financial_certified:false,
   automatic_ledger_posting:false,continuous_connection_verified:false,
   connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}
async function finance705(db,env,id){
 const n=Number(id);
 if(!Number.isSafeInteger(n)||n<1)
   return await assessFinance705({queue_id:0},{history_complete:false},[],[],{});
 const current=await financial685(db,env,n),prior=await finance704(db,env,n);
 const renew=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_posting_continuity_705' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 const owner=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_evidence_705' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 return await assessFinance705(current,prior,renew,owner,{
  id:normalizeText(env?.FINANCIAL_POSTING_LIVE_SIGNER_ID_704),
  key:normalizeText(env?.FINANCIAL_POSTING_LIVE_PUBLIC_KEY_704),
  seventhId:normalizeText(env?.FINANCIAL_POSTING_VERIFIER_ID_703),
  seventhKey:normalizeText(env?.FINANCIAL_POSTING_VERIFIER_PUBLIC_KEY_703),
  sixthId:normalizeText(env?.FINANCIAL_BOOKKEEPING_CLOSURE_VERIFIER_ID_702),
  sixthKey:normalizeText(env?.FINANCIAL_BOOKKEEPING_CLOSURE_VERIFIER_PUBLIC_KEY_702),
  fifthId:normalizeText(env?.FINANCIAL_BOOKKEEPING_VERIFIER_ID_701),
  fifthKey:normalizeText(env?.FINANCIAL_BOOKKEEPING_VERIFIER_PUBLIC_KEY_701),
  fourthId:normalizeText(env?.FINANCIAL_SOURCE_LIVE_SIGNER_ID_700),
  fourthKey:normalizeText(env?.FINANCIAL_SOURCE_LIVE_PUBLIC_KEY_700),
  thirdId:normalizeText(env?.FINANCIAL_SOURCE_REPAIR_VERIFIER_ID_699),
  thirdKey:normalizeText(env?.FINANCIAL_SOURCE_REPAIR_VERIFIER_PUBLIC_KEY_699),
  secondId:normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_SIGNER_ID_697),
  secondKey:normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_PUBLIC_KEY_697),
  firstId:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_SIGNER_ID_696),
  firstKey:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_CUSTODIAN_PUBLIC_KEY_696),
  originAuthorized:!!sourceOrigin700(env?.FINANCIAL_POSTING_LIVE_READBACK_URL_704,
   env?.FINANCIAL_POSTING_LIVE_READBACK_ORIGIN_704)
 });
}
async function livePostingContinuity705(db,env,user,p){
 const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
  report=await finance705(db,env,n),originalId=Number(p.prior_live_receipt_id),
  original=report.items?.find(x=>x.live_receipt_id===originalId&&!x.continuity_verified),
  note=normalizeText(p.resolution_note);
 if(!current.queue_id||!report.history_complete||!report.independent_source_configured||
   !eligibleRenewal705(current,original)||p.owner_reviewed!==true||
   p.expected_source_revision!==current.source_revision||
   p.expected_fingerprint_sha256!==current.fingerprint_sha256||
   note.length<25||note.length>600)
   throw Error('An original independent live 704 receipt with accepted owner readiness, fresh Master and owner decision is required. HOLD.');
 const endpoint=sourceOrigin700(env?.FINANCIAL_POSTING_LIVE_READBACK_URL_704,
  env?.FINANCIAL_POSTING_LIVE_READBACK_ORIGIN_704);
 const signer=normalizeText(env?.FINANCIAL_POSTING_LIVE_SIGNER_ID_704),
  key=normalizeText(env?.FINANCIAL_POSTING_LIVE_PUBLIC_KEY_704);
 if(!endpoint||!key||!signer||!env?.FINANCIAL_POSTING_LIVE_READBACK_BEARER_704)
   throw Error('An independently configured HTTPS read-only posting source is required. HOLD.');
 const nonce=crypto.randomUUID();
 if(nonce===original.original_live_nonce_704)
   throw Error('Duplicate original posting challenge. HOLD.');
 endpoint.searchParams.set('queue_id',String(n));
 endpoint.searchParams.set('posting_receipt_id',String(original.posting_receipt_id));
 endpoint.searchParams.set('source_revision',current.source_revision);
 endpoint.searchParams.set('nonce',nonce);
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
 let response;
 try{
  response=await fetch(endpoint.toString(),{method:'GET',redirect:'manual',signal:controller.signal,
    headers:{Accept:'application/json','Cache-Control':'no-store',
      Authorization:'Bearer '+String(env.FINANCIAL_POSTING_LIVE_READBACK_BEARER_704)}});
 }finally{clearTimeout(timeout);}
 if(!response.ok||response.redirected||response.status!==200||
   !(response.headers.get('Content-Type')||'').toLowerCase().includes('application/json')||
   Number(response.headers.get('Content-Length')||0)>32768)
   throw Error('Second posting source readback was redirected, invalid or too large. HOLD.');
 const reader=response.body?.getReader();
 if(!reader)throw Error('Independent posting source returned no body. HOLD.');
 const chunks=[];let total=0;
 try{
  while(true){
   const part=await reader.read();if(part.done)break;
   total+=part.value.byteLength;
   if(total>32768)throw Error('Second posting source exceeded bounded response limit. HOLD.');
   chunks.push(part.value);
  }
 }finally{try{await reader.cancel()}catch{}}
 const payloadBytes=new Uint8Array(total);let at=0;
 for(const part of chunks){payloadBytes.set(part,at);at+=part.length;}
 let evidence;
 try{evidence=JSON.parse(new TextDecoder().decode(payloadBytes))}
 catch{throw Error('Second posting source returned invalid JSON. HOLD.');}
 const signed=evidence?.claim,signature=evidence?.signature,
  priorAt=utcAttemptTime698(original.source_observed_at),
  nowAt=utcAttemptTime698(signed?.observed_at);
 const expected=claim704({
  queue_id:n,original_live_source_receipt_id:original.original_live_source_receipt_id,
  bookkeeping_review_receipt_id:original.bookkeeping_review_receipt_id,
  closure_decision_receipt_id:original.decision_receipt_id,
  posting_receipt_id:original.posting_receipt_id,
  owner_document_acceptance_receipt_id:original.owner_acceptance_receipt_id,
  posting_document_sha256:original.posting_document_sha256,
  bookkeeping_ledger_sha256:original.bookkeeping_ledger_sha256,
  external_posting_reference:original.external_posting_reference,
  source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
  posting_status:'posted',external_record_observed:true,
  signer_id:signer,nonce,observed_at:signed?.observed_at
 });
 if(!Number.isFinite(priorAt)||!Number.isFinite(nowAt)||nowAt<=priorAt||
   JSON.stringify(signed)!==JSON.stringify(expected)||
   !fresh684(signed?.observed_at,300000)||
   !await verify684(key,expected,signature))
   throw Error('Fresh independently signed posting continuity is missing or source response changed. HOLD.');
 const latest=await financial685(db,env,n);
 if(latest.source_revision!==current.source_revision||
   latest.fingerprint_sha256!==current.fingerprint_sha256||
   latest.master_fresh!==true||latest.open_cases?.length)
   throw Error('Original financial source or Master drift during independent posting continuity. HOLD.');
 const payload={...expected,signature,
  prior_live_receipt_id:originalId,
  prior_owner_readiness_receipt_id:original.financial_readiness_receipt_id,
  independent_source_continuity_verified:true,
  owner_user_id:user.user_id,owner_reviewed:true,resolution_note:note,
  bookkeeping_closed:false,financial_certified:false,continuous_connection_verified:false};
 const receiptId=await append684(db,user,n,'finance_posting_continuity_705',
  'independent_posting_continuity_source_705','finance705-renew-'+n+'-'+originalId,payload);
 const readback=await finance705(db,env,n);
 if(!readback.continuity_receipts.some(x=>x.receipt_id===receiptId&&x.continuity_verified))
   throw Error('Second live posting evidence failed durable independent signature verification. HOLD.');
 return {status:'FRESH_INDEPENDENT_POSTING_CONTINUITY_VERIFIED_BOOK_CLOSE_HOLD',
   receipt_id:receiptId,bookkeeping_closed:false,financial_certified:false,
   independent_continuity_verified:true};
}
async function ownerFinancialEvidenceReview705(db,env,user,p){
 const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
  report=await finance705(db,env,n),continuityId=Number(p.continuity_receipt_id),
  original=report.items?.find(x=>x.continuity_receipt_id===continuityId&&
    x.continuity_verified&&!x.review_decision),
  decision=normalizeText(p.decision),note=normalizeText(p.resolution_note);
 if(!current.queue_id||!report.history_complete||!original||
   !['hold_posting_continuity_drift','recommend_manual_financial_closure_review'].includes(decision)||
   p.owner_reviewed!==true||note.length<25||note.length>600||
   p.expected_source_revision!==current.source_revision||
   p.expected_fingerprint_sha256!==current.fingerprint_sha256||
   p.expected_posting_document_sha256!==original.posting_document_sha256)
   throw Error('An original source-pinned independent second live posting receipt and explicit owner financial decision are required. HOLD.');
 const renewed=utcAttemptTime698(original.continued_at);
 if(renewed===null||Date.now()-renewed>86400000)
   throw Error('Independent renewed posting receipt older than 24 hours; refresh provider evidence. HOLD.');
 const latest=await financial685(db,env,n);
 if(latest.source_revision!==current.source_revision||
   latest.fingerprint_sha256!==current.fingerprint_sha256||
   latest.master_fresh!==true||latest.open_cases?.length)
   throw Error('Original owner source or Master changed during closure evidence review. HOLD.');
 const data={continuity_receipt_id:continuityId,
  prior_live_receipt_id:original.live_receipt_id,
  posting_receipt_id:original.posting_receipt_id,
  posting_document_sha256:original.posting_document_sha256,
  bookkeeping_ledger_sha256:original.bookkeeping_ledger_sha256,
  external_posting_reference:original.external_posting_reference,
  source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
  decision,owner_user_id:user.user_id,owner_reviewed:true,resolution_note:note,
  bookkeeping_closed:false,financial_certified:false,continuous_connection_verified:false};
 const receiptId=await append684(db,user,n,'finance_owner_evidence_705',
  decision==='hold_posting_continuity_drift'?'owner_posting_continuity_hold_705':
    'owner_financial_evidence_review_705',
  'finance705-owner-'+n+'-'+continuityId,data);
 const readback=await finance705(db,env,n);
 if(!readback.owner_receipts.some(x=>x.receipt_id===receiptId&&x.owner_evidence_verified))
   throw Error('Owner financial evidence review not durably verified. HOLD.');
 return {status:decision==='hold_posting_continuity_drift'?
   'OWNER_POSTING_CONTINUITY_DISCREPANCY_HOLD':
   'OWNER_EVIDENCE_REVIEW_RECOMMENDATION_BOOKS_STILL_HOLD',
  receipt_id:receiptId,bookkeeping_closed:false,financial_certified:false};
}


// Build 706: a NINTH independent public-key reviewer evaluates the exact
// original two live source receipt chain + original owner Build 705 decision.
// Its signature is exception evidence, NOT an external ledger close.
export function claim706(x){
 return {v:1,purpose:'devilndove_independent_bookkeeping_continuity_exception_review_706',
  source:'devilndove',queue_id:x.queue_id,
  original_live_receipt_id:x.original_live_receipt_id,
  continuity_receipt_id:x.continuity_receipt_id,
  original_owner_review_receipt_id:x.original_owner_review_receipt_id,
  posting_receipt_id:x.posting_receipt_id,
  posting_document_sha256:x.posting_document_sha256,
  bookkeeping_ledger_sha256:x.bookkeeping_ledger_sha256,
  external_posting_reference:x.external_posting_reference,
  source_revision:x.source_revision,fingerprint_sha256:x.fingerprint_sha256,
  review_packet_sha256:x.review_packet_sha256,
  reviewer_disposition:x.reviewer_disposition,
  independent_reviewer_id:x.independent_reviewer_id,
  nonce:x.nonce,issued_at:x.issued_at,
  decision:'independent_continuity_exception_review_not_financial_closure'};
}
export function retentionManifest706(x){
 return {v:1,purpose:'devilndove_original_financial_evidence_retention_manifest_706',
  source:'devilndove',queue_id:x.queue_id,
  posting_receipt_id:x.posting_receipt_id,
  original_live_receipt_id:x.original_live_receipt_id,
  continuity_receipt_id:x.continuity_receipt_id,
  original_owner_review_receipt_id:x.original_owner_review_receipt_id,
  independent_exception_review_receipt_id:x.independent_exception_review_receipt_id,
  posting_document_sha256:x.posting_document_sha256,
  bookkeeping_ledger_sha256:x.bookkeeping_ledger_sha256,
  external_posting_reference:x.external_posting_reference,
  source_revision:x.source_revision,fingerprint_sha256:x.fingerprint_sha256,
  review_packet_sha256:x.review_packet_sha256,
  reviewer_disposition:x.reviewer_disposition,
  independent_reviewer_id:x.independent_reviewer_id,
  retention_disposition:x.retention_disposition,
  actual_financial_book_close:false};
}
async function retentionDigest706(x){
 const bytes=await crypto.subtle.digest('SHA-256',
   new TextEncoder().encode(JSON.stringify(retentionManifest706(x))));
 return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function eligibleExceptionReview706(current,source,now=Date.now()){
 const reviewed=utcAttemptTime698(source?.continued_at,now),
  ownerTime=utcAttemptTime698(source?.review_recorded_at,now);
 return !!source&&source.continuity_verified===true&&
  Number.isSafeInteger(Number(source.continuity_receipt_id))&&
  Number.isSafeInteger(Number(source.review_receipt_id))&&
  source.review_receipt_id>source.continuity_receipt_id&&
  ['hold_posting_continuity_drift','recommend_manual_financial_closure_review']
    .includes(source.review_decision)&&
  current?.master_fresh===true&&current?.history_complete===true&&
  Array.isArray(current?.open_cases)&&current.open_cases.length===0&&
  reviewed!==null&&ownerTime!==null&&ownerTime>=reviewed&&
  ownerTime<=now+300000&&now-ownerTime<=86400000;
}
export async function assessFinance706(current,prior,reviewRows,retentionRows,signer={},now=Date.now()){
 const n=Number(current?.queue_id),valid=Number.isSafeInteger(n)&&n>0,
  reviews=Array.isArray(reviewRows)?reviewRows:[],
  retained=Array.isArray(retentionRows)?retentionRows:[];
 const distinct=!!signer.id&&!!signer.key&&
  [['eighthId','eighthKey'],['seventhId','seventhKey'],['sixthId','sixthKey'],
   ['fifthId','fifthKey'],['fourthId','fourthKey'],['thirdId','thirdKey'],
   ['secondId','secondKey'],['firstId','firstKey']].every(([i,k])=>
    !!signer[i]&&!!signer[k]&&signer.id!==signer[i]&&signer.key!==signer[k]);
 const items=(prior?.items||[]).filter(x=>x.continuity_verified===true&&
  Number.isSafeInteger(Number(x.continuity_receipt_id))&&x.continuity_receipt_id>0&&
  Number.isSafeInteger(Number(x.review_receipt_id))&&x.review_receipt_id>0&&
  !!x.review_decision).map(x=>({...x,review_706_receipt_id:null,
   review_706_verified:false,review_706_disposition:null,review_706_recorded_at:null,
   retention_706_receipt_id:null,retention_706_verified:false,
   retention_706_disposition:null,retention_manifest_sha256:null}));
 const byContinuity=new Map(items.map(x=>[x.continuity_receipt_id,x]));
 let invalid=0,previousId=Infinity,previousAt=Infinity;
 const seen=new Set(),reviewReceipts=[];
 for(const row of reviews){
  const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
   source=byContinuity.get(Number(d.continuity_receipt_id)),
   at=utcAttemptTime698(row.attempted_at,now),
   issued=utcAttemptTime698(d.issued_at,now),
   ownerAt=utcAttemptTime698(source?.review_recorded_at,now);
  const decision=['hold_unresolved_continuity_exception','no_new_continuity_exception_observed']
    .includes(d.reviewer_disposition);
  const gate=valid&&!!prior?.history_complete&&distinct&&
   !!source&&eligibleExceptionReview706(current,source,at)&&
   Number.isSafeInteger(id)&&id>source.review_receipt_id&&id<previousId&&
   at!==null&&at<=previousAt&&issued!==null&&issued<=at&&
   at-issued<=1200000&&ownerAt!==null&&at>=ownerAt&&
   !seen.has(source.continuity_receipt_id)&&
   row.attempt_status==='independent_continuity_exception_review_706'&&
   d.original_live_receipt_id===source.live_receipt_id&&
   d.original_owner_review_receipt_id===source.review_receipt_id&&
   d.posting_receipt_id===source.posting_receipt_id&&
   d.posting_document_sha256===source.posting_document_sha256&&
   d.bookkeeping_ledger_sha256===source.bookkeeping_ledger_sha256&&
   d.external_posting_reference===source.external_posting_reference&&
   d.source_revision===current.source_revision&&
   d.fingerprint_sha256===current.fingerprint_sha256&&
   /^[a-f0-9]{64}$/.test(d.review_packet_sha256||'')&&decision&&
   (source.review_decision!=='hold_posting_continuity_drift'||
      d.reviewer_disposition==='hold_unresolved_continuity_exception')&&
   d.independent_reviewer_id===signer.id&&nonce684(d.nonce)&&
   d.independent_signature_verified===true&&d.owner_reviewed===true&&
   Number.isSafeInteger(Number(d.owner_user_id))&&Number(d.owner_user_id)>0&&
   typeof d.resolution_note==='string'&&d.resolution_note.length>=25&&
   d.resolution_note.length<=600&&
   d.bookkeeping_closed===false&&d.financial_certified===false&&
   d.continuous_connection_verified===false&&
   /^[A-Za-z0-9+/_=-]{80,120}$/.test(d.signature||'');
  const verified=!!gate&&await verify684(signer.key,claim706({
   queue_id:n,original_live_receipt_id:source.live_receipt_id,
   continuity_receipt_id:source.continuity_receipt_id,
   original_owner_review_receipt_id:source.review_receipt_id,
   posting_receipt_id:source.posting_receipt_id,
   posting_document_sha256:source.posting_document_sha256,
   bookkeeping_ledger_sha256:source.bookkeeping_ledger_sha256,
   external_posting_reference:source.external_posting_reference,
   source_revision:d.source_revision,fingerprint_sha256:d.fingerprint_sha256,
   review_packet_sha256:d.review_packet_sha256,
   reviewer_disposition:d.reviewer_disposition,
   independent_reviewer_id:d.independent_reviewer_id,
   nonce:d.nonce,issued_at:d.issued_at}),d.signature);
  if(verified){
   seen.add(source.continuity_receipt_id);
   source.review_706_receipt_id=id;
   source.review_706_verified=true;
   source.review_706_disposition=d.reviewer_disposition;
   source.review_706_recorded_at=row.attempted_at;
   source.review_packet_sha256=d.review_packet_sha256;
  }else invalid++;
  reviewReceipts.push({receipt_id:id,continuity_receipt_id:Number(d.continuity_receipt_id),
    independent_review_signature_verified:verified,
    status:verified?'NINTH_INDEPENDENT_CONTINUITY_EXCEPTION_REVIEW_BOOKS_HOLD':
      'HOLD_INDEPENDENT_CONTINUITY_REVIEW_SIGNATURE_OR_SOURCE_DRIFT'});
  previousId=id;previousAt=at===null?-Infinity:at;
 }
 let retentionInvalid=0,retentionId=Infinity,retentionAt=Infinity;
 const held=new Set(),retentionReceipts=[];
 for(const row of retained){
  const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
   source=items.find(x=>x.review_706_receipt_id===Number(d.independent_exception_review_receipt_id)),
   at=utcAttemptTime698(row.attempted_at,now),
   reviewedAt=utcAttemptTime698(source?.review_706_recorded_at,now),
   permitted=['retain_exception_on_hold','retain_for_final_manual_financial_review']
    .includes(d.retention_disposition),
   good=valid&&!!prior?.history_complete&&distinct&&
    !!source&&source.review_706_verified&&
    Number.isSafeInteger(id)&&id>source.review_706_receipt_id&&id<retentionId&&
    at!==null&&at<=retentionAt&&reviewedAt!==null&&at>=reviewedAt&&
    at-reviewedAt<=86400000&&!held.has(source.review_706_receipt_id)&&permitted&&
    row.attempt_status==='owner_financial_evidence_retention_706'&&
    d.posting_receipt_id===source.posting_receipt_id&&
    d.original_live_receipt_id===source.live_receipt_id&&
    d.continuity_receipt_id===source.continuity_receipt_id&&
    d.original_owner_review_receipt_id===source.review_receipt_id&&
    d.posting_document_sha256===source.posting_document_sha256&&
    d.bookkeeping_ledger_sha256===source.bookkeeping_ledger_sha256&&
    d.external_posting_reference===source.external_posting_reference&&
    d.source_revision===current.source_revision&&
    d.fingerprint_sha256===current.fingerprint_sha256&&
    d.review_packet_sha256===source.review_packet_sha256&&
    d.reviewer_disposition===source.review_706_disposition&&
    d.independent_reviewer_id===signer.id&&
    (source.review_706_disposition==='no_new_continuity_exception_observed'||
       d.retention_disposition==='retain_exception_on_hold')&&
    d.owner_reviewed===true&&Number.isSafeInteger(Number(d.owner_user_id))&&
    Number(d.owner_user_id)>0&&
    typeof d.resolution_note==='string'&&d.resolution_note.length>=25&&
    d.resolution_note.length<=600&&
    d.bookkeeping_closed===false&&d.financial_certified===false&&
    d.continuous_connection_verified===false&&
    /^[a-f0-9]{64}$/.test(d.manifest_sha256||'');
  const hashed=!!good&&await retentionDigest706(d)===d.manifest_sha256;
  if(hashed){
   held.add(source.review_706_receipt_id);
   source.retention_706_receipt_id=id;source.retention_706_verified=true;
   source.retention_706_disposition=d.retention_disposition;
   source.retention_manifest_sha256=d.manifest_sha256;
  }else retentionInvalid++;
  retentionReceipts.push({receipt_id:id,
    independent_exception_review_receipt_id:Number(d.independent_exception_review_receipt_id),
    manifest_digest_verified:hashed,
    status:hashed?'DURABLE_SOURCE_BOUND_FINANCIAL_EVIDENCE_RETAINED_BOOK_CLOSE_HOLD':
      'HOLD_706_EVIDENCE_RETENTION_HASH_OR_SOURCE_DRIFT'});
  retentionId=id;retentionAt=at===null?-Infinity:at;
 }
 const complete=valid&&!!prior?.history_complete&&
  reviews.length<=60&&retained.length<=60&&invalid===0&&retentionInvalid===0;
 return {status:!valid?'HOLD_SELECT_CAMPAIGN':
  !complete?'HOLD_706_INDEPENDENT_REVIEW_OR_RETENTION_LEDGER_DRIFT':
  !distinct?'HOLD_NINTH_INDEPENDENT_CONTINUITY_REVIEWER_NOT_ENROLLED':
  !items.length?'HOLD_705_SOURCE_BOUND_OWNER_REVIEW_REQUIRED':
  items.some(x=>!x.review_706_verified)?'HOLD_INDEPENDENT_BOOKKEEPING_CONTINUITY_EXCEPTION_REVIEW_REQUIRED':
  items.some(x=>!x.retention_706_verified)?'INDEPENDENT_EXCEPTION_REVIEW_SIGNED_OWNER_RETENTION_HOLD':
  items.some(x=>x.retention_706_disposition==='retain_exception_on_hold')?
    'OWNER_EXCEPTION_EVIDENCE_RETAINED_BOOKS_HOLD':
    'OWNER_FINANCIAL_CLOSURE_EVIDENCE_RETAINED_MANUAL_CLOSE_REQUIRED',
  campaign_queue_id:valid?n:null,history_complete:complete,
  ninth_signer_id:signer.id||null,ninth_signer_configured:distinct,
  eligible_count:items.length,
  independently_reviewed_count:items.filter(x=>x.review_706_verified).length,
  retained_evidence_count:items.filter(x=>x.retention_706_verified).length,
  invalid_count:invalid+retentionInvalid,items:items.slice(0,40),
  independent_reviews:reviewReceipts.slice(0,40),
  evidence_retention:retentionReceipts.slice(0,40),
  source_bound_append_only_receipts:true,retention_policy_promise:false,
  actual_bookkeeping_closed:false,bookkeeping_closed:false,financial_certified:false,
  continuous_connection_verified:false,
  connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}
async function finance706(db,env,id){
 const n=Number(id);
 if(!Number.isSafeInteger(n)||n<1)
  return await assessFinance706({queue_id:0},{history_complete:false},[],[],{});
 const current=await financial685(db,env,n),prior=await finance705(db,env,n);
 const reviews=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_continuity_review_706' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 const retained=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_closure_retention_706' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 return await assessFinance706(current,prior,reviews,retained,{
  id:normalizeText(env?.FINANCIAL_CONTINUITY_REVIEWER_ID_706),
  key:normalizeText(env?.FINANCIAL_CONTINUITY_REVIEWER_PUBLIC_KEY_706),
  eighthId:normalizeText(env?.FINANCIAL_POSTING_LIVE_SIGNER_ID_704),
  eighthKey:normalizeText(env?.FINANCIAL_POSTING_LIVE_PUBLIC_KEY_704),
  seventhId:normalizeText(env?.FINANCIAL_POSTING_VERIFIER_ID_703),
  seventhKey:normalizeText(env?.FINANCIAL_POSTING_VERIFIER_PUBLIC_KEY_703),
  sixthId:normalizeText(env?.FINANCIAL_BOOKKEEPING_CLOSURE_VERIFIER_ID_702),
  sixthKey:normalizeText(env?.FINANCIAL_BOOKKEEPING_CLOSURE_VERIFIER_PUBLIC_KEY_702),
  fifthId:normalizeText(env?.FINANCIAL_BOOKKEEPING_VERIFIER_ID_701),
  fifthKey:normalizeText(env?.FINANCIAL_BOOKKEEPING_VERIFIER_PUBLIC_KEY_701),
  fourthId:normalizeText(env?.FINANCIAL_SOURCE_LIVE_SIGNER_ID_700),
  fourthKey:normalizeText(env?.FINANCIAL_SOURCE_LIVE_PUBLIC_KEY_700),
  thirdId:normalizeText(env?.FINANCIAL_SOURCE_REPAIR_VERIFIER_ID_699),
  thirdKey:normalizeText(env?.FINANCIAL_SOURCE_REPAIR_VERIFIER_PUBLIC_KEY_699),
  secondId:normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_SIGNER_ID_697),
  secondKey:normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_PUBLIC_KEY_697),
  firstId:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_SIGNER_ID_696),
  firstKey:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_CUSTODIAN_PUBLIC_KEY_696)
 });
}
async function independentContinuityReview706(db,env,user,p){
 const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
  report=await finance706(db,env,n),continuity=Number(p.continuity_receipt_id),
  item=report.items?.find(x=>x.continuity_receipt_id===continuity&&!x.review_706_verified),
  digest=normalizeText(p.review_packet_sha256).toLowerCase(),
  disposition=normalizeText(p.reviewer_disposition),
  signer=normalizeText(env?.FINANCIAL_CONTINUITY_REVIEWER_ID_706),
  key=normalizeText(env?.FINANCIAL_CONTINUITY_REVIEWER_PUBLIC_KEY_706),
  nonce=normalizeText(p.nonce),issued=normalizeText(p.issued_at),
  signature=normalizeText(p.signature),note=normalizeText(p.resolution_note);
 if(!current.queue_id||!report.history_complete||!report.ninth_signer_configured||
  !item||!eligibleExceptionReview706(current,item)||
  !['hold_unresolved_continuity_exception','no_new_continuity_exception_observed']
   .includes(disposition)||
  (item.review_decision==='hold_posting_continuity_drift'&&
     disposition!=='hold_unresolved_continuity_exception')||
  p.owner_reviewed!==true||note.length<25||note.length>600||
  p.expected_source_revision!==current.source_revision||
  p.expected_fingerprint_sha256!==current.fingerprint_sha256||
  p.expected_posting_document_sha256!==item.posting_document_sha256||
  !/^[a-f0-9]{64}$/.test(digest)||!nonce684(nonce)||
  !fresh684(issued,1200000)||p.independent_reviewer_id!==signer||
  !/^[A-Za-z0-9+/_=-]{80,120}$/.test(signature)||
  !await verify684(key,claim706({
   queue_id:n,original_live_receipt_id:item.live_receipt_id,
   continuity_receipt_id:continuity,
   original_owner_review_receipt_id:item.review_receipt_id,
   posting_receipt_id:item.posting_receipt_id,
   posting_document_sha256:item.posting_document_sha256,
   bookkeeping_ledger_sha256:item.bookkeeping_ledger_sha256,
   external_posting_reference:item.external_posting_reference,
   source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
   review_packet_sha256:digest,reviewer_disposition:disposition,
   independent_reviewer_id:signer,nonce,issued_at:issued}),signature))
  throw Error('Original Build 705 receipt, independently signed ninth reviewer, fresh exception packet SHA, and owner source pins required. Actual financial book close HOLD.');
 const latest=await financial685(db,env,n);
 if(latest.source_revision!==current.source_revision||
   latest.fingerprint_sha256!==current.fingerprint_sha256||
   latest.master_fresh!==true||latest.open_cases?.length)
  throw Error('Original financial source or Master drifted before independent exception review. HOLD.');
 const data={original_live_receipt_id:item.live_receipt_id,
  continuity_receipt_id:continuity,
  original_owner_review_receipt_id:item.review_receipt_id,
  posting_receipt_id:item.posting_receipt_id,
  posting_document_sha256:item.posting_document_sha256,
  bookkeeping_ledger_sha256:item.bookkeeping_ledger_sha256,
  external_posting_reference:item.external_posting_reference,
  source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
  review_packet_sha256:digest,reviewer_disposition:disposition,
  independent_reviewer_id:signer,nonce,issued_at:issued,signature,
  independent_signature_verified:true,owner_user_id:user.user_id,
  owner_reviewed:true,resolution_note:note,
  bookkeeping_closed:false,financial_certified:false,continuous_connection_verified:false};
 const receiptId=await append684(db,user,n,'finance_continuity_review_706',
  'independent_continuity_exception_review_706',
  'finance706-review-'+n+'-'+continuity,data);
 const after=await finance706(db,env,n);
 if(!after.independent_reviews.some(x=>x.receipt_id===receiptId&&x.independent_review_signature_verified))
  throw Error('Independent ninth signer exception review failed durable source-bound readback. HOLD.');
 return {status:disposition==='hold_unresolved_continuity_exception'?
  'INDEPENDENT_CONTINUITY_EXCEPTION_UNRESOLVED_HOLD':
  'NINTH_INDEPENDENT_CONTINUITY_EXCEPTION_REVIEWED_OWNER_RETENTION_HOLD',
  receipt_id:receiptId,bookkeeping_closed:false,financial_certified:false};
}
async function ownerEvidenceRetention706(db,env,user,p){
 const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
  report=await finance706(db,env,n),reviewId=Number(p.independent_exception_review_receipt_id),
  item=report.items?.find(x=>x.review_706_receipt_id===reviewId&&
   x.review_706_verified&&!x.retention_706_verified),
  disposition=normalizeText(p.retention_disposition),
  note=normalizeText(p.resolution_note);
 if(!current.queue_id||!report.history_complete||!item||
  !['retain_exception_on_hold','retain_for_final_manual_financial_review'].includes(disposition)||
  (item.review_706_disposition==='hold_unresolved_continuity_exception'&&
    disposition!=='retain_exception_on_hold')||
  p.owner_reviewed!==true||note.length<25||note.length>600||
  p.expected_source_revision!==current.source_revision||
  p.expected_fingerprint_sha256!==current.fingerprint_sha256||
  p.expected_posting_document_sha256!==item.posting_document_sha256)
  throw Error('Independently signed ninth reviewer and source-pinned original owner retention decision required. Actual close HOLD.');
 const time=utcAttemptTime698(item.review_706_recorded_at);
 if(time===null||Date.now()-time>86400000)
  throw Error('Independent ninth review receipt older than 24 hours; owner retention HOLD.');
 const latest=await financial685(db,env,n);
 if(latest.source_revision!==current.source_revision||
   latest.fingerprint_sha256!==current.fingerprint_sha256||
   latest.master_fresh!==true||latest.open_cases?.length)
  throw Error('Original source/Master changed before retention; signed evidence remains HOLD.');
 const manifest={queue_id:n,posting_receipt_id:item.posting_receipt_id,
  original_live_receipt_id:item.live_receipt_id,
  continuity_receipt_id:item.continuity_receipt_id,
  original_owner_review_receipt_id:item.review_receipt_id,
  independent_exception_review_receipt_id:reviewId,
  posting_document_sha256:item.posting_document_sha256,
  bookkeeping_ledger_sha256:item.bookkeeping_ledger_sha256,
  external_posting_reference:item.external_posting_reference,
  source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
  review_packet_sha256:item.review_packet_sha256,
  reviewer_disposition:item.review_706_disposition,
  independent_reviewer_id:report.ninth_signer_id,
  retention_disposition:disposition};
 const manifest_sha256=await retentionDigest706(manifest);
 const data={...manifest,manifest_sha256,
  owner_user_id:user.user_id,owner_reviewed:true,resolution_note:note,
  durable_append_only_record:true,auto_delete_scheduled:false,
  financial_retention_policy_guarantee:false,
  bookkeeping_closed:false,financial_certified:false,continuous_connection_verified:false};
 const receiptId=await append684(db,user,n,'finance_closure_retention_706',
  'owner_financial_evidence_retention_706',
  'finance706-retain-'+n+'-'+reviewId,data);
 const after=await finance706(db,env,n);
 if(!after.evidence_retention.some(x=>x.receipt_id===receiptId&&x.manifest_digest_verified))
  throw Error('Original owner financial evidence retention failed SHA-256 manifest readback. HOLD.');
 return {status:disposition==='retain_exception_on_hold'?
   'OWNER_EXCEPTION_EVIDENCE_RETAINED_BOOKS_HOLD':
   'OWNER_FINANCIAL_CLOSURE_EVIDENCE_RETAINED_MANUAL_CLOSE_REQUIRED',
  receipt_id:receiptId,manifest_sha256,
  bookkeeping_closed:false,financial_certified:false,
  connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}

// Build 699: a distinct independent witness can attest the exact external
// repair-document SHA-256 and original receipt chain. The source-ledger
// mismatch is NOT repaired merely because a document signature is valid.
export function claim699(x){
return{v:1,purpose:'devilndove_independent_source_repair_document_witness_699',
source:'devilndove',queue_id:x.queue_id,
older_receipt_id:x.older_receipt_id,newer_receipt_id:x.newer_receipt_id,
repair_intake_receipt_id:x.repair_intake_receipt_id,
external_document_sha256:x.external_document_sha256,
external_reference:x.external_reference,
source_revision:x.source_revision,fingerprint_sha256:x.fingerprint_sha256,
independent_verifier_id:x.independent_verifier_id,
nonce:x.nonce,issued_at:x.issued_at,
decision:'document_provenance_authenticated_live_source_repair_unverified'};
}
export async function assessFinance699(current,prior,reviewRows,signer={},now=Date.now()){
const n=Number(current?.queue_id);
const selected=Number.isSafeInteger(n)&&n>0;
const rows699=Array.isArray(reviewRows)?reviewRows:[];
const historyComplete=!!prior?.history_complete&&rows699.length<=60;
const trusted=!!signer?.id&&!!signer?.key&&
!!signer?.custodianId&&!!signer?.custodianKey&&
!!signer?.reconcilerId&&!!signer?.reconcilerKey&&
signer.id!==signer.custodianId&&signer.id!==signer.reconcilerId&&
signer.key!==signer.custodianKey&&signer.key!==signer.reconcilerKey;
const exactIntakes=(prior?.owner_evidence_history||[]).filter(x=>
x.decision==='intake_source_repair_proof'&&
x.state==='SOURCE_REPAIR_DOCUMENT_INTAKE_UNVERIFIED'&&
/^[a-f0-9]{64}$/.test(x.external_document_sha256||'')&&
/^[A-Za-z0-9][A-Za-z0-9_.:/#-]{7,159}$/.test(x.external_reference||''));
const intakes=new Map(exactIntakes.map(x=>[Number(x.receipt_id),x]));
const source=(prior?.source_repair?.items||[]).filter(x=>x.repair_proof_intake_recorded&&
Number.isSafeInteger(Number(x.repair_proof_receipt_id))&&Number(x.repair_proof_receipt_id)>0)
.map(x=>({
older_receipt_id:Number(x.older_receipt_id),
newer_receipt_id:Number(x.newer_receipt_id),
repair_intake_receipt_id:Number(x.repair_proof_receipt_id),
external_document_sha256:intakes.get(Number(x.repair_proof_receipt_id))?.external_document_sha256||null,
external_reference:intakes.get(Number(x.repair_proof_receipt_id))?.external_reference||null,
independent_document_signature_verified:false,independent_witness_receipt_id:null,
current_live_source_repair_verified:false}));
const sourceMap=new Map(source.map(x=>[
x.older_receipt_id+'|'+x.newer_receipt_id+'|'+x.repair_intake_receipt_id,x]));
let invalid=0,previousId=Infinity,previousAt=Infinity;
const history=[],seen=new Set();
for(const row of rows699){
const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
older=Number(d.older_receipt_id),newer=Number(d.newer_receipt_id),
intake=Number(d.repair_intake_receipt_id),
recorded=utcAttemptTime698(row.attempted_at,now),
issued=utcAttemptTime698(d.issued_at,now);
const key=older+'|'+newer+'|'+intake;
const exact=sourceMap.get(key);
const safe=Number.isSafeInteger(id)&&id>0&&id<previousId&&
recorded!==null&&recorded<=previousAt&&!seen.has(key)&&
row.attempt_status==='independent_source_repair_document_signature_verified_699'&&
d.decision==='attest_repair_document_provenance'&&
d.fingerprint_sha256===current?.fingerprint_sha256&&
d.source_revision===current?.source_revision&&d.owner_reviewed===true&&
Number.isSafeInteger(Number(d.owner_user_id))&&Number(d.owner_user_id)>0&&
typeof d.resolution_note==='string'&&d.resolution_note.length>=20&&
d.resolution_note.length<=400&&d.original_source_repaired===false&&
d.financial_certified===false&&d.continuous_connection_verified===false&&
d.external_repair_verified===false&&
!!exact&&!!exact.external_document_sha256&&
d.external_document_sha256===exact.external_document_sha256&&
d.external_reference===exact.external_reference&&
trusted&&d.independent_verifier_id===signer.id&&
nonce684(d.nonce)&&issued!==null&&issued<=recorded&&
recorded-issued<=1200000&&id>intake&&
/^[A-Za-z0-9+/_=-]{80,120}$/.test(d.signature||'');
let signed=false;
if(safe){
const signedClaim=claim699({queue_id:n,older_receipt_id:older,newer_receipt_id:newer,
repair_intake_receipt_id:intake,external_document_sha256:d.external_document_sha256,
external_reference:d.external_reference,source_revision:d.source_revision,
fingerprint_sha256:d.fingerprint_sha256,independent_verifier_id:d.independent_verifier_id,
nonce:d.nonce,issued_at:d.issued_at});
signed=await verify684(signer.key,signedClaim,d.signature);
}
const accepted=safe&&signed;
if(accepted)seen.add(key);else invalid++;
history.push({receipt_id:id,older_receipt_id:older,newer_receipt_id:newer,
repair_intake_receipt_id:intake,external_document_sha256:d.external_document_sha256,
recorded_at:row.attempted_at,independent_document_signature_verified:accepted,
state:accepted?'EXTERNAL_REPAIR_DOCUMENT_AUTHENTICATED_SOURCE_READBACK_HOLD':
'HOLD_FINANCIAL_699_SIGNATURE_OR_SOURCE_DRIFT'});
previousId=id;previousAt=recorded===null?-Infinity:recorded;
}
for(const x of source){
const h=history.find(y=>y.older_receipt_id===x.older_receipt_id&&
y.newer_receipt_id===x.newer_receipt_id&&y.repair_intake_receipt_id===x.repair_intake_receipt_id&&
y.independent_document_signature_verified);
x.independent_document_signature_verified=!!h;
x.independent_witness_receipt_id=h?.receipt_id||null;
}
const complete=selected&&historyComplete&&invalid===0;
const currentMismatch=Number(prior?.source_repair?.original_mismatch_count||0);
return{status:!selected?'HOLD_SELECT_CAMPAIGN':!complete?
'HOLD_FINANCIAL_699_SIGNATURE_OR_SOURCE_DRIFT':!trusted?
'HOLD_INDEPENDENT_REPAIR_VERIFIER_NOT_CONFIGURED':currentMismatch?
'HOLD_LIVE_SOURCE_REPAIR_READBACK_REQUIRED':
'HOLD_FINANCIAL_SOURCE_REPAIR_INDEPENDENT_ACCEPTANCE_REQUIRED',
campaign_queue_id:selected?n:null,history_complete:complete,
observed_at:new Date(now).toISOString(),
independent_verification:{
signer_configured:trusted,expected_verifier_id:signer.id||null,
original_mismatch_count:currentMismatch,
document_intake_count:source.length,
independently_signed_document_count:source.filter(x=>x.independent_document_signature_verified).length,
pending_signature_count:source.filter(x=>!x.independent_document_signature_verified).length,
source_readback_verified_count:0,
items:source.slice(0,40),source_repair_verified:false,
external_document_bytes_retrieved:false},
master_drift_detected:prior?.master?.drift_detected!==false,
escalation_recovery_pending:prior?.recovery?.pending_followup_count||0,
invalid_owner_history_count:invalid,
owner_evidence_history:history.slice(0,40),
original_source_repaired:false,financial_certified:false,
automatic_incident_closure:false,external_replay_performed:false,
connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}
async function finance699(db,env,id){
const n=Number(id);
if(!Number.isSafeInteger(n)||n<1)
return await assessFinance699({queue_id:0},{history_complete:false},[],{});
const current=await financial685(db,env,n),prior=await finance698(db,env,n);
const receipts=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_owner_review_699' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
return await assessFinance699(current,prior,receipts,{
id:normalizeText(env?.FINANCIAL_SOURCE_REPAIR_VERIFIER_ID_699),
key:normalizeText(env?.FINANCIAL_SOURCE_REPAIR_VERIFIER_PUBLIC_KEY_699),
custodianId:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_SIGNER_ID_696),
custodianKey:normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_CUSTODIAN_PUBLIC_KEY_696),
reconcilerId:normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_SIGNER_ID_697),
reconcilerKey:normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_PUBLIC_KEY_697)
});
}
async function ownerReview699(db,env,user,p){
const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
report=await finance699(db,env,n),
older=Number(p.older_receipt_id),newer=Number(p.newer_receipt_id),
intake=Number(p.repair_intake_receipt_id),note=normalizeText(p.resolution_note);
if(!current.queue_id||!report.history_complete||p.owner_reviewed!==true||
p.expected_fingerprint_sha256!==current.fingerprint_sha256||
p.expected_source_revision!==current.source_revision||
!Number.isSafeInteger(older)||older<1||
!Number.isSafeInteger(newer)||newer<1||
!Number.isSafeInteger(intake)||intake<1||note.length<20||note.length>400)
throw Error('Original source-bound repair intake and explicit owner review required. HOLD.');
const x=report.independent_verification.items.find(x=>
x.older_receipt_id===older&&x.newer_receipt_id===newer&&
x.repair_intake_receipt_id===intake&&!x.independent_document_signature_verified);
const verifier=normalizeText(env?.FINANCIAL_SOURCE_REPAIR_VERIFIER_ID_699),
key=normalizeText(env?.FINANCIAL_SOURCE_REPAIR_VERIFIER_PUBLIC_KEY_699),
externalId=normalizeText(p.independent_verifier_id),
issued=normalizeText(p.issued_at),nonce=normalizeText(p.nonce),
signature=normalizeText(p.signature);
const originalId=normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_SIGNER_ID_696),
originalKey=normalizeText(env?.FINANCIAL_SOURCE_CORRECTION_CUSTODIAN_PUBLIC_KEY_696),
reconcilerId=normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_SIGNER_ID_697),
reconcilerKey=normalizeText(env?.FINANCIAL_SOURCE_RECONCILIATION_PUBLIC_KEY_697);
if(!x||!x.external_document_sha256||!report.independent_verification.signer_configured||
verifier!==externalId||verifier===originalId||verifier===reconcilerId||
key===originalKey||key===reconcilerKey||!nonce684(nonce)||
!fresh684(issued,1200000)||!/^[A-Za-z0-9+/_=-]{80,120}$/.test(signature)||
!await verify684(key,claim699({queue_id:n,older_receipt_id:older,
newer_receipt_id:newer,repair_intake_receipt_id:intake,
external_document_sha256:x.external_document_sha256,
external_reference:x.external_reference,
source_revision:current.source_revision,
fingerprint_sha256:current.fingerprint_sha256,
independent_verifier_id:externalId,nonce,issued_at:issued}),signature))
throw Error('Distinct external Ed25519 verifier must authenticate the exact original source repair document digest and receipts. No actual source repair is inferred. HOLD.');
const payload={decision:'attest_repair_document_provenance',
older_receipt_id:older,newer_receipt_id:newer,repair_intake_receipt_id:intake,
external_document_sha256:x.external_document_sha256,
external_reference:x.external_reference,source_revision:current.source_revision,
fingerprint_sha256:current.fingerprint_sha256,independent_verifier_id:externalId,
nonce,issued_at:issued,signature,
owner_user_id:user.user_id,owner_reviewed:true,resolution_note:note,
original_source_repaired:false,financial_certified:false,
continuous_connection_verified:false,external_repair_verified:false};
const receipt_id=await append684(db,user,n,'finance_owner_review_699',
'independent_source_repair_document_signature_verified_699',
'finance699-'+n+'-'+older+'-'+newer+'-'+intake,payload);
const readback=await finance699(db,env,n);
if(!readback.owner_evidence_history.some(x=>x.receipt_id===receipt_id&&
x.independent_document_signature_verified))
throw Error('Protected original document signature receipt readback failed. HOLD.');
return{status:'EXTERNAL_REPAIR_DOCUMENT_AUTHENTICATED_SOURCE_READBACK_HOLD',receipt_id,
independent_document_signature_verified:true,original_source_repaired:false,
financial_certified:false,connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}

// Build 682 — source-only financial export and owner discrepancy audit.
async function finance682(db,env,id){
const n=Number(id);
if(!Number.isSafeInteger(n)||n<1)return{status:'HOLD_SELECT_CAMPAIGN',cases:[],reviews:[],master_accepted:false};
const source=await campaignNet679(db,n),f680=await finance680(db,env,n),f681=await finance681(db,env,n);
if(!source?.campaign)throw Error('Campaign evidence not found.');
const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(source.fingerprint||''));
const pin=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
const flags=[];
if(source.blockers?.length)flags.push('SOURCE_FINANCIAL_EVIDENCE_INCOMPLETE');
if(!source.owner_accepted)flags.push('SOURCE_OWNER_SIGNOFF_PENDING');
if(f680.stale_count)flags.push('SOURCE_VERIFIER_EVIDENCE_STALE');
if(f681.exceptions?.some(e=>!e.resolved_at))flags.push('OWNER_EXCEPTION_OPEN');
if(!f681.scan_complete)flags.push('SOURCE_AUDIT_WINDOW_INCOMPLETE');
if(!(f681.master_receipts||[]).some(e=>e.state==='SIGNED_AT_INTAKE_RECEIPT_ONLY'))
flags.push('MASTER_RECEIPT_NOT_CURRENT');
flags.push('MASTER_INDEPENDENT_ADMISSION_UNVERIFIED');
const found=rows(await db.prepare(`SELECT social_post_attempt_id,attempt_status,external_post_id,attempted_at,response_json
 FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_discrepancy_682'
 ORDER BY social_post_attempt_id DESC LIMIT 101`).bind(n).all());
const recent=found.slice(0,100).map(e=>{const d=safeJson(e.response_json,{});
return{receipt_id:e.social_post_attempt_id,case_code:e.external_post_id,
disposition:e.attempt_status==='owner_escalated_682'?'ESCALATED':'OWNER_REVIEWED',
recorded_at:e.attempted_at,current_evidence:d.fingerprint_sha256===pin};});
if(found.length>100)flags.push('DISCREPANCY_AUDIT_WINDOW_INCOMPLETE');
const cases=[...new Set(flags)].map(code=>({code,state:code==='MASTER_INDEPENDENT_ADMISSION_UNVERIFIED'?
'HOLD_EXTERNAL_MASTER_PROOF':'HOLD_SOURCE_OR_OWNER_REVIEW',
last_review:recent.find(x=>x.case_code===code&&x.current_evidence)||null}));
return{format:'devilndove-finance-evidence-682',version:1,campaign:source.campaign,
as_of:new Date().toISOString(),currency:'CAD',source_revision:normalizeText(env?.DEVILNDOVE_SOURCE_REVISION)||null,
fingerprint_sha256:pin,source_status:source.status,source_owner_accepted:!!source.owner_accepted,
financial:source.blockers?.length?null:source.financial||null,
counts:{paid_orders:source.orders_seen||0,verified_expenses:source.expense_receipts_seen||0,
verified_cost_allocations:source.product_cost_receipts_seen||0},
cases,reviews:recent,master_receipts:f681.master_receipts||[],owner_history:f681.owner_history||[],
master_accepted:false,profitability_certified:false,
master_connection:'HOLD_INDEPENDENT_RUNTIME_TRANSPORT_AND_MASTER_ADMISSION',
status:flags.length?'HOLD_DISCREPANCIES':'SOURCE_EVIDENCE_REVIEW_ONLY',
complete:f681.scan_complete&&found.length<=100};
}
async function ownerDiscrepancy682(db,env,user,p){
const id=Number(p.social_post_queue_id),code=normalizeText(p.case_code),
note=normalizeText(p.review_note),decision=normalizeText(p.disposition),
expected=normalizeText(p.expected_fingerprint_sha256);
if(!Number.isSafeInteger(id)||id<1||p.owner_reviewed!==true||
!['acknowledge','escalate'].includes(decision)||note.length<15||note.length>400)
throw Error('Explicit owner review and a 15–400 character decision are required.');
const view=await finance682(db,env,id);
if(!view.complete)throw Error('Audit window incomplete: owner decision HOLD.');
if(expected!==view.fingerprint_sha256||!view.cases.some(c=>c.code===code))
throw Error('Discrepancy or source fingerprint changed. Refresh before review.');
const prior=await db.prepare(`SELECT COALESCE(MAX(social_post_attempt_id),0) last_id FROM social_post_attempts
 WHERE social_post_queue_id=? AND platform_key='finance_discrepancy_682'`).bind(id).first();
const status=decision==='escalate'?'owner_escalated_682':'owner_reviewed_682';
await recordApiAttempt(db,user,id,'finance_discrepancy_682',status,{
external_post_id:code,response:{fingerprint_sha256:expected,decision,owner_user_id:user.user_id,
review_note:note,master_accepted:false,profitability_certified:false},
notes:'Source-only owner review. Independent Master acceptance and financial certification remain HOLD.'});
const saved=await db.prepare(`SELECT social_post_attempt_id FROM social_post_attempts
 WHERE social_post_queue_id=? AND platform_key='finance_discrepancy_682' AND external_post_id=?
 AND attempt_status=? AND social_post_attempt_id>? LIMIT 1`).bind(id,code,status,Number(prior?.last_id||0)).first();
if(!saved)throw Error('Owner audit decision was not durably saved. HOLD.');
return{status,receipt_id:saved.social_post_attempt_id,master_accepted:false,publication_performed:false};
}


// Build 707 — independently signed ninth-reviewer field adoption and owner
// financial custody audit. Owner field acceptance is an explicit *reported*
// off-platform review of the original signed packet, NOT a new signature,
// a verified physical device, a bank receipt, or a financial close.
export function assessFinance707(current,prior,fieldRows=[],custodyRows=[],now=Date.now()){
 const n=Number(current?.queue_id),
  valid=Number.isSafeInteger(n)&&n>0&&current.master_fresh===true&&
    current.history_complete===true&&Array.isArray(current.open_cases)&&
    current.open_cases.length===0&&prior?.history_complete===true,
  fields=Array.isArray(fieldRows)?fieldRows:[],
  custody=Array.isArray(custodyRows)?custodyRows:[],
  originals=(prior?.items||[]).filter(x=>x.review_706_verified&&x.retention_706_verified),
  items=originals.map(x=>({...x,field_707_verified:false,
    field_707_receipt_id:null,field_707_recorded_at:null,
    custody_707_verified:false,custody_707_receipt_id:null}));
 const reviews=new Map(items.map(x=>[x.review_706_receipt_id,x]));
 let invalid=0,priorId=Infinity,priorTime=Infinity;const used=new Set(),fieldReceipts=[];
 for(const row of fields){
  const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
   at=utcAttemptTime698(row.attempted_at,now),
   source=reviews.get(Number(d.original_ninth_review_receipt_id));
  const good=valid&&!!source&&
   row.attempt_status==='owner_ninth_reviewer_field_acceptance_707'&&
   Number.isSafeInteger(id)&&id>Number(source.retention_706_receipt_id)&&id<priorId&&
   at!==null&&at<=priorTime&&!used.has(Number(source.review_706_receipt_id))&&
   d.original_retention_receipt_id===source.retention_706_receipt_id&&
   d.continuity_receipt_id===source.continuity_receipt_id&&
   d.review_packet_sha256===source.review_packet_sha256&&
   d.retention_manifest_sha256===source.retention_manifest_sha256&&
   d.ninth_reviewer_id===prior.ninth_signer_id&&
   d.source_revision===current.source_revision&&
   d.fingerprint_sha256===current.fingerprint_sha256&&
   d.owner_original_field_reviewed===true&&
   Number.isSafeInteger(Number(d.owner_user_id))&&Number(d.owner_user_id)>0&&
   typeof d.resolution_note==='string'&&d.resolution_note.length>=25&&
   d.resolution_note.length<=600&&
   d.independent_ninth_signature_source_verified===true&&
   d.physical_device_independently_witnessed===false&&
   d.bookkeeping_closed===false&&d.financial_certified===false&&
   d.continuous_connection_verified===false;
  if(good){
   used.add(Number(source.review_706_receipt_id));
   source.field_707_verified=true;source.field_707_receipt_id=id;
   source.field_707_recorded_at=row.attempted_at;
  }else invalid++;
  fieldReceipts.push({receipt_id:id,original_ninth_review_receipt_id:Number(d.original_ninth_review_receipt_id),
   verified:!!good,status:good?'OWNER_FIELD_ACCEPTED_NINTH_SIGNED_SOURCE_BOOKS_HOLD':
    'HOLD_707_NINTH_REVIEWER_FIELD_SOURCE_OR_CUSTODY_DRIFT'});
  priorId=id;priorTime=at===null?-Infinity:at;
 }
 let previousId=Infinity,previousTime=Infinity;const audited=new Set(),custodyReceipts=[];
 for(const row of custody){
  const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
   at=utcAttemptTime698(row.attempted_at,now),
   source=items.find(x=>x.field_707_receipt_id===Number(d.field_acceptance_receipt_id)),
   fieldAt=utcAttemptTime698(source?.field_707_recorded_at,now);
  const good=valid&&!!source&&source.field_707_verified&&
   row.attempt_status==='owner_financial_custody_audit_707'&&
   Number.isSafeInteger(id)&&id>Number(source.field_707_receipt_id)&&id<previousId&&
   at!==null&&at<=previousTime&&fieldAt!==null&&at>=fieldAt&&
   !audited.has(Number(source.field_707_receipt_id))&&
   d.original_ninth_review_receipt_id===source.review_706_receipt_id&&
   d.original_retention_receipt_id===source.retention_706_receipt_id&&
   d.retention_manifest_sha256===source.retention_manifest_sha256&&
   d.review_packet_sha256===source.review_packet_sha256&&
   d.ninth_reviewer_id===prior.ninth_signer_id&&
   d.source_revision===current.source_revision&&
   d.fingerprint_sha256===current.fingerprint_sha256&&
   d.owner_custody_reviewed===true&&
   Number.isSafeInteger(Number(d.owner_user_id))&&Number(d.owner_user_id)>0&&
   typeof d.resolution_note==='string'&&d.resolution_note.length>=25&&
   d.resolution_note.length<=600&&
   d.source_manifest_digest_revalidated===true&&
   d.auto_delete_requested===false&&
   d.bookkeeping_closed===false&&d.financial_certified===false&&
   d.continuous_connection_verified===false;
  if(good){audited.add(Number(source.field_707_receipt_id));
   source.custody_707_verified=true;source.custody_707_receipt_id=id;
  }else invalid++;
  custodyReceipts.push({receipt_id:id,field_acceptance_receipt_id:Number(d.field_acceptance_receipt_id),
   verified:!!good,status:good?'OWNER_SOURCE_BOUND_CUSTODY_AUDIT_BOOKS_HOLD':
     'HOLD_707_FINANCIAL_EVIDENCE_CUSTODY_DRIFT'});
  previousId=id;previousTime=at===null?-Infinity:at;
 }
 const complete=valid&&fields.length<=60&&custody.length<=60&&invalid===0;
 return {status:!complete?'HOLD_707_FIELD_ACCEPTANCE_OR_CUSTODY_HISTORY_DRIFT':
   !items.length?'HOLD_706_NINTH_REVIEW_AND_ORIGINAL_RETENTION_REQUIRED':
   items.some(x=>!x.field_707_verified)?'HOLD_707_ORIGINAL_NINTH_REVIEW_FIELD_ACCEPTANCE_REQUIRED':
   items.some(x=>!x.custody_707_verified)?'OWNER_NINTH_REVIEW_FIELD_ACCEPTED_CUSTODY_AUDIT_HOLD':
   'OWNER_SOURCE_BOUND_NINTH_REVIEW_AND_CUSTODY_AUDITED_BOOKS_HOLD',
  campaign_queue_id:valid?n:null,history_complete:complete,
  eligible_count:items.length,field_accepted_count:items.filter(x=>x.field_707_verified).length,
  audited_custody_count:items.filter(x=>x.custody_707_verified).length,
  invalid_count:invalid,items:items.slice(0,40),
  field_receipts:fieldReceipts.slice(0,40),custody_receipts:custodyReceipts.slice(0,40),
  original_ninth_signature_verified_by_706:true,independent_physical_device_witnessed:false,
  continuously_monitored:false,bookkeeping_closed:false,financial_certified:false,
  connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}
async function finance707(db,env,id){
 const n=Number(id);
 if(!Number.isSafeInteger(n)||n<1)return assessFinance707({queue_id:0},{history_complete:false});
 const current=await financial685(db,env,n),prior=await finance706(db,env,n);
 const field=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_ninth_field_707' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 const custody=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_custody_audit_707' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 return assessFinance707(current,prior,field,custody);
}
async function originalNinthFieldAcceptance707(db,env,user,p){
 const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
  base=await finance706(db,env,n),field=await finance707(db,env,n),
  reviewId=Number(p.original_ninth_review_receipt_id),
  source=field.items?.find(x=>x.review_706_receipt_id===reviewId&&!x.field_707_verified),
  note=normalizeText(p.resolution_note);
 if(!current.queue_id||!base.history_complete||!field.history_complete||!source||
  !source.review_706_verified||!source.retention_706_verified||
  p.owner_original_field_reviewed!==true||note.length<25||note.length>600||
  p.expected_source_revision!==current.source_revision||
  p.expected_fingerprint_sha256!==current.fingerprint_sha256||
  p.expected_manifest_sha256!==source.retention_manifest_sha256||
  p.expected_review_packet_sha256!==source.review_packet_sha256)
  throw Error('Original signed ninth review, exact verified 706 manifest, owner field readback and source pins required. HOLD.');
 const latest=await financial685(db,env,n);
 if(latest.source_revision!==current.source_revision||
  latest.fingerprint_sha256!==current.fingerprint_sha256||
  latest.master_fresh!==true||latest.history_complete!==true||latest.open_cases?.length)
  throw Error('Original financial source or Master changed during field acceptance. HOLD.');
 const data={original_ninth_review_receipt_id:reviewId,
  original_retention_receipt_id:source.retention_706_receipt_id,
  continuity_receipt_id:source.continuity_receipt_id,
  review_packet_sha256:source.review_packet_sha256,
  retention_manifest_sha256:source.retention_manifest_sha256,
  ninth_reviewer_id:base.ninth_signer_id,
  source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
  owner_original_field_reviewed:true,owner_user_id:user.user_id,
  independent_ninth_signature_source_verified:true,resolution_note:note,
  physical_device_independently_witnessed:false,bookkeeping_closed:false,
  financial_certified:false,continuous_connection_verified:false};
 const receiptId=await append684(db,user,n,'finance_ninth_field_707',
  'owner_ninth_reviewer_field_acceptance_707','finance707-field-'+n+'-'+reviewId,data);
 const after=await finance707(db,env,n);
 if(!after.field_receipts.some(x=>x.receipt_id===receiptId&&x.verified))
  throw Error('Ninth reviewer field acceptance not independently read back from original D1 history. HOLD.');
 return {status:'OWNER_FIELD_ACCEPTED_NINTH_SIGNED_SOURCE_BOOKS_HOLD',receipt_id:receiptId,
  bookkeeping_closed:false,physical_device_independently_witnessed:false};
}
async function originalFinancialCustodyAudit707(db,env,user,p){
 const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
  field=await finance707(db,env,n),base=await finance706(db,env,n),
  fieldId=Number(p.field_acceptance_receipt_id),
  source=field.items?.find(x=>x.field_707_receipt_id===fieldId&&
    x.field_707_verified&&!x.custody_707_verified),
  note=normalizeText(p.resolution_note);
 if(!current.queue_id||!base.history_complete||!field.history_complete||!source||
  p.owner_custody_reviewed!==true||note.length<25||note.length>600||
  p.expected_source_revision!==current.source_revision||
  p.expected_fingerprint_sha256!==current.fingerprint_sha256||
  p.expected_manifest_sha256!==source.retention_manifest_sha256)
  throw Error('Original independently reviewed ninth receipt, owner field acceptance and signed retention SHA custody required. HOLD.');
 const latest=await financial685(db,env,n);
 if(latest.source_revision!==current.source_revision||
  latest.fingerprint_sha256!==current.fingerprint_sha256||
  latest.master_fresh!==true||latest.history_complete!==true||latest.open_cases?.length)
  throw Error('Original source/Master changed during custody audit; no closure inferred. HOLD.');
 const data={field_acceptance_receipt_id:fieldId,
  original_ninth_review_receipt_id:source.review_706_receipt_id,
  original_retention_receipt_id:source.retention_706_receipt_id,
  retention_manifest_sha256:source.retention_manifest_sha256,
  review_packet_sha256:source.review_packet_sha256,
  ninth_reviewer_id:base.ninth_signer_id,
  source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
  owner_custody_reviewed:true,owner_user_id:user.user_id,
  source_manifest_digest_revalidated:true,resolution_note:note,
  auto_delete_requested:false,bookkeeping_closed:false,financial_certified:false,
  continuous_connection_verified:false};
 const receiptId=await append684(db,user,n,'finance_custody_audit_707',
  'owner_financial_custody_audit_707','finance707-custody-'+n+'-'+fieldId,data);
 const after=await finance707(db,env,n);
 if(!after.custody_receipts.some(x=>x.receipt_id===receiptId&&x.verified))
  throw Error('Original source-bound SHA custody audit failed durable readback. HOLD.');
 return {status:'OWNER_SOURCE_BOUND_CUSTODY_AUDIT_BOOKS_HOLD',receipt_id:receiptId,
  manifest_sha256:source.retention_manifest_sha256,bookkeeping_closed:false};
}


// Build 708: renewal attests rechecking the original signed ninth reviewer
// and retained custody chain. It never asserts a new ninth signature, external
// bookkeeping posting, physical device witness or continuous monitoring.
export function custodyRenewalManifest708(x){
 return {v:1,purpose:'devilndove_manual_source_bound_financial_custody_renewal_708',
  source:'devilndove',queue_id:x.queue_id,
  original_ninth_review_receipt_id:x.original_ninth_review_receipt_id,
  original_706_retention_receipt_id:x.original_706_retention_receipt_id,
  original_707_field_receipt_id:x.original_707_field_receipt_id,
  original_707_custody_receipt_id:x.original_707_custody_receipt_id,
  owner_continuity_receipt_id:x.owner_continuity_receipt_id,
  original_706_manifest_sha256:x.original_706_manifest_sha256,
  review_packet_sha256:x.review_packet_sha256,
  ninth_reviewer_id:x.ninth_reviewer_id,
  source_revision:x.source_revision,fingerprint_sha256:x.fingerprint_sha256,
  audited_outcome:'original_ninth_review_and_sha_custody_rechecked_books_hold'};
}
async function custodyDigest708(x){
 const bytes=await crypto.subtle.digest('SHA-256',
  new TextEncoder().encode(JSON.stringify(custodyRenewalManifest708(x))));
 return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function assessFinance708(current,base706,prior707,continuityRows=[],custodyRows=[],now=Date.now()){
 const n=Number(current?.queue_id),
  valid=Number.isSafeInteger(n)&&n>0&&current.master_fresh===true&&
   current.history_complete===true&&Array.isArray(current.open_cases)&&
   current.open_cases.length===0&&base706?.history_complete===true&&
   base706?.ninth_signer_configured===true&&!!base706.ninth_signer_id&&
   prior707?.history_complete===true,
  continuity=Array.isArray(continuityRows)?continuityRows:[],
  custody=Array.isArray(custodyRows)?custodyRows:[],
  items=(prior707?.items||[]).filter(x=>x.review_706_verified&&
    x.retention_706_verified&&x.field_707_verified&&x.custody_707_verified)
   .map(x=>({...x,continuity_708_verified:false,continuity_708_receipt_id:null,
    continuity_708_recorded_at:null,custody_708_verified:false,
    custody_708_receipt_id:null,custody_708_digest_sha256:null,custody_708_recorded_at:null})),
  sourceMap=new Map(items.map(x=>[Number(x.field_707_receipt_id),x]));
 let invalid=0,prevId=Infinity,prevAt=Infinity;
 const seen=new Set(),seenNonce=new Set(),continuityReceipts=[];
 for(const row of continuity){
  const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
   at=utcAttemptTime698(row.attempted_at,now),
   originalAt=utcAttemptTime698(sourceMap.get(Number(d.original_707_field_receipt_id))?.field_707_recorded_at,now),
   x=sourceMap.get(Number(d.original_707_field_receipt_id));
  const good=valid&&!!x&&row.attempt_status==='owner_ninth_reviewer_continuity_708'&&
   Number.isSafeInteger(id)&&id>Number(x.custody_707_receipt_id)&&id<prevId&&
   at!==null&&at<=prevAt&&originalAt!==null&&at>=originalAt&&
   !seen.has(Number(x.field_707_receipt_id))&&
   d.original_ninth_review_receipt_id===x.review_706_receipt_id&&
   d.original_706_retention_receipt_id===x.retention_706_receipt_id&&
   d.original_707_custody_receipt_id===x.custody_707_receipt_id&&
   d.original_706_manifest_sha256===x.retention_manifest_sha256&&
   d.review_packet_sha256===x.review_packet_sha256&&
   d.ninth_reviewer_id===base706.ninth_signer_id&&
   d.source_revision===current.source_revision&&
   d.fingerprint_sha256===current.fingerprint_sha256&&
   nonce684(d.renewal_nonce)&&!seenNonce.has(d.renewal_nonce)&&
   d.original_ninth_signature_reverified===true&&
   d.new_independent_signature_claimed===false&&
   d.owner_continuity_reviewed===true&&
   Number.isSafeInteger(Number(d.owner_user_id))&&Number(d.owner_user_id)>0&&
   typeof d.resolution_note==='string'&&d.resolution_note.length>=25&&
   d.resolution_note.length<=600&&
   d.physical_device_independently_witnessed===false&&
   d.bookkeeping_closed===false&&d.financial_certified===false&&
   d.continuous_connection_verified===false;
  if(good){seen.add(Number(x.field_707_receipt_id));seenNonce.add(d.renewal_nonce);
   x.continuity_708_verified=true;x.continuity_708_receipt_id=id;
   x.continuity_708_recorded_at=row.attempted_at;
  }else invalid++;
  continuityReceipts.push({receipt_id:id,verified:!!good,
   original_707_field_receipt_id:Number(d.original_707_field_receipt_id),
   status:good?'ORIGINAL_NINTH_REVIEWER_ACCEPTANCE_CONTINUITY_RENEWED_HOLD':
    'HOLD_708_NINTH_ACCEPTANCE_OR_SOURCE_DRIFT'});
  prevId=id;prevAt=at===null?-Infinity:at;
 }
 prevId=Infinity;prevAt=Infinity;const custodySeen=new Set(),custodyReceipts=[];
 for(const row of custody){
  const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
   at=utcAttemptTime698(row.attempted_at,now),
   x=items.find(i=>i.continuity_708_receipt_id===Number(d.owner_continuity_receipt_id)),
   renewedAt=utcAttemptTime698(x?.continuity_708_recorded_at,now);
  const good=valid&&!!x&&x.continuity_708_verified&&
   row.attempt_status==='owner_financial_custody_renewal_708'&&
   Number.isSafeInteger(id)&&id>Number(x.continuity_708_receipt_id)&&id<prevId&&
   at!==null&&at<=prevAt&&renewedAt!==null&&at>=renewedAt&&
   !custodySeen.has(Number(x.continuity_708_receipt_id))&&
   d.queue_id===n&&
   d.original_ninth_review_receipt_id===x.review_706_receipt_id&&
   d.original_706_retention_receipt_id===x.retention_706_receipt_id&&
   d.original_707_field_receipt_id===x.field_707_receipt_id&&
   d.original_707_custody_receipt_id===x.custody_707_receipt_id&&
   d.original_706_manifest_sha256===x.retention_manifest_sha256&&
   d.review_packet_sha256===x.review_packet_sha256&&
   d.ninth_reviewer_id===base706.ninth_signer_id&&
   d.source_revision===current.source_revision&&
   d.fingerprint_sha256===current.fingerprint_sha256&&
   d.owner_custody_rechecked===true&&
   Number.isSafeInteger(Number(d.owner_user_id))&&Number(d.owner_user_id)>0&&
   typeof d.resolution_note==='string'&&d.resolution_note.length>=25&&
   d.resolution_note.length<=600&&
   d.auto_delete_scheduled===false&&
   d.bookkeeping_closed===false&&d.financial_certified===false&&
   d.continuous_connection_verified===false&&
   /^[a-f0-9]{64}$/.test(d.renewal_manifest_sha256||'');
  const hashed=!!good&&(await custodyDigest708(d))===d.renewal_manifest_sha256;
  if(hashed){custodySeen.add(Number(x.continuity_708_receipt_id));
   x.custody_708_verified=true;x.custody_708_receipt_id=id;
   x.custody_708_digest_sha256=d.renewal_manifest_sha256;
   x.custody_708_recorded_at=row.attempted_at;
  }else invalid++;
  custodyReceipts.push({receipt_id:id,verified:hashed,
   owner_continuity_receipt_id:Number(d.owner_continuity_receipt_id),
   status:hashed?'SOURCE_BOUND_FINANCIAL_CUSTODY_RENEWAL_DIGEST_VERIFIED_BOOKS_HOLD':
    'HOLD_708_CUSTODY_RENEWAL_DIGEST_OR_SOURCE_DRIFT'});
  prevId=id;prevAt=at===null?-Infinity:at;
 }
 const complete=valid&&continuity.length<=60&&custody.length<=60&&invalid===0;
 return {status:!complete?'HOLD_708_NINTH_CONTINUITY_OR_CUSTODY_HISTORY_DRIFT':
  !items.length?'HOLD_707_FIELD_ACCEPTANCE_AND_CUSTODY_REQUIRED':
  items.some(x=>!x.continuity_708_verified)?'HOLD_708_NINTH_REVIEWER_ACCEPTANCE_CONTINUITY_REQUIRED':
  items.some(x=>!x.custody_708_verified)?'NINTH_ACCEPTANCE_CONTINUITY_RENEWED_CUSTODY_RECHECK_HOLD':
  'SOURCE_BOUND_FINANCIAL_CUSTODY_RENEWED_MANUAL_BOOK_CLOSE_HOLD',
  campaign_queue_id:valid?n:null,history_complete:complete,
  ninth_reviewer_id:base706?.ninth_signer_id||null,
  eligible_count:items.length,renewed_acceptance_count:items.filter(x=>x.continuity_708_verified).length,
  renewed_custody_count:items.filter(x=>x.custody_708_verified).length,
  invalid_count:invalid,items:items.slice(0,40),
  acceptance_continuity_receipts:continuityReceipts.slice(0,40),
  custody_renewal_receipts:custodyReceipts.slice(0,40),
  new_independent_signature_generated:false,
  independent_physical_device_witnessed:false,continuous_monitoring_enabled:false,
  financial_certified:false,bookkeeping_closed:false,retention_guaranteed:false,
  connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}
async function finance708(db,env,id){
 const n=Number(id);
 if(!Number.isSafeInteger(n)||n<1)
  return assessFinance708({queue_id:0},{history_complete:false},{history_complete:false});
 const current=await financial685(db,env,n),
  base=await finance706(db,env,n),prior=await finance707(db,env,n);
 const continuity=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_ninth_continuity_708' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 const custody=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_custody_renewal_708' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 return assessFinance708(current,base,prior,continuity,custody);
}
async function ownerNinthAcceptanceContinuity708(db,env,user,p){
 const n=Number(p.social_post_queue_id),
  current=await financial685(db,env,n),base=await finance706(db,env,n),
  report=await finance708(db,env,n),
  fieldId=Number(p.original_707_field_receipt_id),
  x=report.items?.find(x=>x.field_707_receipt_id===fieldId&&!x.continuity_708_verified),
  note=normalizeText(p.resolution_note),nonce=normalizeText(p.renewal_nonce);
 if(!current.queue_id||!base.history_complete||!report.history_complete||
  !base.ninth_signer_configured||!x||!x.review_706_verified||
  !x.retention_706_verified||!x.field_707_verified||!x.custody_707_verified||
  p.owner_continuity_reviewed!==true||note.length<25||note.length>600||
  !nonce684(nonce)||p.expected_source_revision!==current.source_revision||
  p.expected_fingerprint_sha256!==current.fingerprint_sha256||
  p.expected_manifest_sha256!==x.retention_manifest_sha256||
  p.expected_review_packet_sha256!==x.review_packet_sha256)
  throw Error('Refresh original ninth signer and exact Build 706/707 accepted custody chain, fresh nonce and owner review. HOLD.');
 const latest=await financial685(db,env,n);
 if(latest.source_revision!==current.source_revision||
  latest.fingerprint_sha256!==current.fingerprint_sha256||
  latest.master_fresh!==true||latest.history_complete!==true||latest.open_cases?.length)
  throw Error('Original finance or Master source drifted during ninth reviewer continuity check. HOLD.');
 const data={original_707_field_receipt_id:fieldId,
  original_707_custody_receipt_id:x.custody_707_receipt_id,
  original_ninth_review_receipt_id:x.review_706_receipt_id,
  original_706_retention_receipt_id:x.retention_706_receipt_id,
  original_706_manifest_sha256:x.retention_manifest_sha256,
  review_packet_sha256:x.review_packet_sha256,
  ninth_reviewer_id:base.ninth_signer_id,
  source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
  renewal_nonce:nonce,original_ninth_signature_reverified:true,
  new_independent_signature_claimed:false,
  owner_continuity_reviewed:true,owner_user_id:user.user_id,resolution_note:note,
  physical_device_independently_witnessed:false,bookkeeping_closed:false,
  financial_certified:false,continuous_connection_verified:false};
 const receiptId=await append684(db,user,n,'finance_ninth_continuity_708',
  'owner_ninth_reviewer_continuity_708','finance708-continuity-'+n+'-'+fieldId+'-'+nonce,data);
 const after=await finance708(db,env,n);
 if(!after.acceptance_continuity_receipts.some(x=>x.receipt_id===receiptId&&x.verified))
  throw Error('Original independently signed ninth acceptance renewal failed exact D1 readback. HOLD.');
 return {status:'ORIGINAL_NINTH_REVIEWER_ACCEPTANCE_CONTINUITY_RENEWED_HOLD',
  receipt_id:receiptId,bookkeeping_closed:false,new_independent_signature_generated:false};
}
async function ownerCustodyRenewal708(db,env,user,p){
 const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
  base=await finance706(db,env,n),report=await finance708(db,env,n),
  continuityId=Number(p.owner_continuity_receipt_id),
  x=report.items?.find(x=>x.continuity_708_receipt_id===continuityId&&
   x.continuity_708_verified&&!x.custody_708_verified),
  note=normalizeText(p.resolution_note);
 if(!current.queue_id||!base.history_complete||!report.history_complete||!x||
  p.owner_custody_rechecked!==true||note.length<25||note.length>600||
  p.expected_source_revision!==current.source_revision||
  p.expected_fingerprint_sha256!==current.fingerprint_sha256||
  p.expected_manifest_sha256!==x.retention_manifest_sha256)
  throw Error('Original valid ninth reviewer continuity receipt and source-pinned 706 manifest required before owner custody renewal. HOLD.');
 const latest=await financial685(db,env,n);
 if(latest.source_revision!==current.source_revision||
  latest.fingerprint_sha256!==current.fingerprint_sha256||
  latest.master_fresh!==true||latest.history_complete!==true||latest.open_cases?.length)
  throw Error('Original financial source/Master changed while reviewing custody renewal. HOLD.');
 const manifest={queue_id:n,original_ninth_review_receipt_id:x.review_706_receipt_id,
  original_706_retention_receipt_id:x.retention_706_receipt_id,
  original_707_field_receipt_id:x.field_707_receipt_id,
  original_707_custody_receipt_id:x.custody_707_receipt_id,
  owner_continuity_receipt_id:continuityId,
  original_706_manifest_sha256:x.retention_manifest_sha256,
  review_packet_sha256:x.review_packet_sha256,
  ninth_reviewer_id:base.ninth_signer_id,
  source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256};
 const renewal_manifest_sha256=await custodyDigest708(manifest);
 const data={...manifest,renewal_manifest_sha256,owner_custody_rechecked:true,
  owner_user_id:user.user_id,resolution_note:note,auto_delete_scheduled:false,
  bookkeeping_closed:false,financial_certified:false,continuous_connection_verified:false};
 const receiptId=await append684(db,user,n,'finance_custody_renewal_708',
  'owner_financial_custody_renewal_708','finance708-custody-'+n+'-'+continuityId,data);
 const after=await finance708(db,env,n);
 if(!after.custody_renewal_receipts.some(x=>x.receipt_id===receiptId&&x.verified))
  throw Error('Recomputed original source SHA custody renewal manifest did not durably read back. HOLD.');
 return {status:'SOURCE_BOUND_FINANCIAL_CUSTODY_RENEWAL_DIGEST_VERIFIED_BOOKS_HOLD',
  receipt_id:receiptId,renewal_manifest_sha256,bookkeeping_closed:false,financial_certified:false};
}


// Build 709: renewal aging and independent-*source* exception escalation.
// "Independent" means existing independently signed ninth-reviewer evidence
// is rechecked, NOT a fresh ninth sign-off, external complaint, or book close.
export function renewalAge709(original,now=Date.now()){
 const at=Date.parse(String(original?.custody_708_verified?
   original.custody_708_recorded_at:original?.continuity_708_recorded_at||''));
 if(!Number.isFinite(at)||at>now+300000)return {age_hours:null,
  status:'HOLD_709_ORIGINAL_RENEWAL_TIMESTAMP_REQUIRED',escalation_due:false};
 const age_hours=Math.max(0,Math.floor((now-at)/3600000));
 return {age_hours,
  status:age_hours>=72?'CRITICAL_ORIGINAL_FINANCIAL_CUSTODY_RENEWAL_AGED_72H_709':
   age_hours>=48?'ORIGINAL_FINANCIAL_CUSTODY_RENEWAL_OVERDUE_48H_709':
   age_hours>=24?'ORIGINAL_FINANCIAL_CUSTODY_RENEWAL_ESCALATION_DUE_24H_709':
   'ORIGINAL_FINANCIAL_CUSTODY_RENEWAL_FRESH_UNDER_24H_709',
  escalation_due:age_hours>=24};
}
export async function assessFinance709(current,base706,prior708,escalations=[],now=Date.now()){
 const n=Number(current?.queue_id),valid=Number.isSafeInteger(n)&&n>0&&
  current.master_fresh===true&&current.history_complete===true&&
  Array.isArray(current.open_cases)&&current.open_cases.length===0&&
  base706?.history_complete===true&&base706.ninth_signer_configured===true&&
  !!base706.ninth_signer_id&&prior708?.history_complete===true,
  log=Array.isArray(escalations)?escalations:[],
  items=(prior708?.items||[]).filter(x=>x.continuity_708_verified)
   .map(x=>({...x,renewal_aging_709:renewalAge709(x,now),
    custody_exception_escalated_709:false,
    custody_exception_escalation_receipt_id_709:null})),
  seen=new Set(),receipts=[];
 let invalid=0,previousId=Infinity,previousAt=Infinity;
 for(const row of log){
  const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
   at=utcAttemptTime698(row.attempted_at,now),
   source=items.find(x=>x.continuity_708_receipt_id===Number(d.original_708_continuity_receipt_id)),
   age=renewalAge709(source,at===null?now:at);
  const good=valid&&!!source&&row.attempt_status==='owner_financial_custody_exception_escalation_709'&&
   Number.isSafeInteger(id)&&id>Number(source.custody_708_receipt_id||source.continuity_708_receipt_id)&&
   id<previousId&&at!==null&&at<=previousAt&&
   !seen.has(Number(source.continuity_708_receipt_id))&&
   age.escalation_due===true&&d.observed_age_hours===age.age_hours&&
   d.observed_age_status===age.status&&
   d.original_ninth_review_receipt_id===source.review_706_receipt_id&&
   d.original_706_retention_receipt_id===source.retention_706_receipt_id&&
   d.original_707_field_receipt_id===source.field_707_receipt_id&&
   d.original_707_custody_receipt_id===source.custody_707_receipt_id&&
   d.original_708_custody_receipt_id===Number(source.custody_708_receipt_id||0)&&
   d.original_706_manifest_sha256===source.retention_manifest_sha256&&
   d.original_708_custody_digest_sha256===(source.custody_708_digest_sha256||null)&&
   d.ninth_reviewer_id===base706.ninth_signer_id&&
   d.source_revision===current.source_revision&&
   d.fingerprint_sha256===current.fingerprint_sha256&&
   d.independent_ninth_source_cryptographically_rechecked===true&&
   d.owner_exception_reviewed===true&&
   Number.isSafeInteger(Number(d.owner_user_id))&&Number(d.owner_user_id)>0&&
   typeof d.resolution_note==='string'&&d.resolution_note.length>=25&&
   d.resolution_note.length<=600&&
   d.no_new_independent_signature_claimed===true&&
   d.automatic_external_escalation_sent===false&&d.bookkeeping_closed===false&&
   d.financial_certified===false&&d.auto_delete_scheduled===false;
  if(good){seen.add(source.continuity_708_receipt_id);
   source.custody_exception_escalated_709=true;
   source.custody_exception_escalation_receipt_id_709=id;
  }else invalid++;
  receipts.push({receipt_id:id,verified:!!good,
   original_708_continuity_receipt_id:Number(d.original_708_continuity_receipt_id),
   status:good?'SOURCE_BOUND_OWNER_FINANCIAL_CUSTODY_EXCEPTION_ESCALATED_BOOKS_HOLD_709':
    'HOLD_709_FINANCIAL_CUSTODY_ESCALATION_REPLAY_OR_SOURCE_DRIFT'});
  previousId=id;previousAt=at===null?-Infinity:at;
 }
 const complete=valid&&log.length<=60&&invalid===0;
 return {status:!complete?'HOLD_709_SOURCE_HISTORY_OR_INDEPENDENT_CUSTODY_DRIFT':
  !items.length?'HOLD_708_NINTH_REVIEWER_RENEWAL_REQUIRED':
  items.some(x=>x.renewal_aging_709.escalation_due&&!x.custody_exception_escalated_709)?
   'OWNER_FINANCIAL_RENEWAL_AGING_ESCALATION_DUE_709':
  items.some(x=>x.custody_exception_escalated_709)?
   'OWNER_SOURCE_BOUND_CUSTODY_EXCEPTION_ESCALATED_BOOKS_HOLD_709':
  'ON_DEMAND_RENEWAL_AGING_CURRENT_BOOKS_HOLD_709',
  campaign_queue_id:valid?n:null,history_complete:complete,
  items:items.slice(0,40),eligible_count:items.length,
  escalation_due_count:items.filter(x=>x.renewal_aging_709.escalation_due&&!x.custody_exception_escalated_709).length,
  critical_72h_count:items.filter(x=>x.renewal_aging_709.age_hours>=72).length,
  escalated_count:items.filter(x=>x.custody_exception_escalated_709).length,
  invalid_count:invalid,exception_escalation_receipts:receipts.slice(0,40),
  on_demand_only:true,automated_external_escalation_sent:false,
  independent_ninth_new_signature_generated:false,
  financial_certified:false,bookkeeping_closed:false,
  connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}
async function finance709(db,env,id){
 const n=Number(id);
 if(!Number.isSafeInteger(n)||n<1)
  return assessFinance709({queue_id:0},{history_complete:false},{history_complete:false});
 const current=await financial685(db,env,n),base=await finance706(db,env,n),
  prior=await finance708(db,env,n),
  escalation=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_custody_escalation_709' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 return assessFinance709(current,base,prior,escalation);
}
async function ownerCustodyExceptionEscalation709(db,env,user,p){
 const n=Number(p.social_post_queue_id),
  current=await financial685(db,env,n),base=await finance706(db,env,n),
  prior=await finance708(db,env,n),report=await finance709(db,env,n),
  continuityId=Number(p.original_708_continuity_receipt_id),
  item=report.items?.find(x=>x.continuity_708_receipt_id===continuityId&&
    !x.custody_exception_escalated_709&&x.renewal_aging_709.escalation_due),
  note=normalizeText(p.resolution_note);
 if(!current.queue_id||!base.history_complete||!base.ninth_signer_configured||
  !prior.history_complete||!report.history_complete||!item||
  p.owner_exception_reviewed!==true||note.length<25||note.length>600||
  p.expected_source_revision!==current.source_revision||
  p.expected_fingerprint_sha256!==current.fingerprint_sha256||
  p.expected_706_manifest_sha256!==item.retention_manifest_sha256||
  p.expected_708_custody_digest_sha256!==(item.custody_708_digest_sha256||null))
  throw Error('Aged 24h original independently signed ninth continuity and exact 706/708 custody source required. HOLD.');
 const latest=await financial685(db,env,n);
 if(latest.source_revision!==current.source_revision||
  latest.fingerprint_sha256!==current.fingerprint_sha256||
  latest.master_fresh!==true||latest.history_complete!==true||latest.open_cases?.length)
  throw Error('Master or original book evidence drifted during custody exception escalation. HOLD.');
 const age=renewalAge709(item);
 if(!age.escalation_due)throw Error('Original source renewal is not yet 24h overdue. HOLD.');
 const data={original_708_continuity_receipt_id:continuityId,
  original_708_custody_receipt_id:Number(item.custody_708_receipt_id||0),
  original_ninth_review_receipt_id:item.review_706_receipt_id,
  original_706_retention_receipt_id:item.retention_706_receipt_id,
  original_707_field_receipt_id:item.field_707_receipt_id,
  original_707_custody_receipt_id:item.custody_707_receipt_id,
  original_706_manifest_sha256:item.retention_manifest_sha256,
  original_708_custody_digest_sha256:item.custody_708_digest_sha256||null,
  ninth_reviewer_id:base.ninth_signer_id,
  source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
  observed_age_hours:age.age_hours,observed_age_status:age.status,
  independent_ninth_source_cryptographically_rechecked:true,
  owner_exception_reviewed:true,owner_user_id:user.user_id,resolution_note:note,
  no_new_independent_signature_claimed:true,
  automatic_external_escalation_sent:false,bookkeeping_closed:false,
  financial_certified:false,auto_delete_scheduled:false};
 const receipt=await append684(db,user,n,'finance_custody_escalation_709',
  'owner_financial_custody_exception_escalation_709',
  'finance709-exception-'+n+'-'+continuityId,data);
 const readback=await finance709(db,env,n);
 if(!readback.exception_escalation_receipts.some(x=>x.receipt_id===receipt&&x.verified))
  throw Error('Original signed source custody escalation failed durable D1 independent readback. HOLD.');
 return {status:'SOURCE_BOUND_OWNER_FINANCIAL_CUSTODY_EXCEPTION_ESCALATED_BOOKS_HOLD_709',
  receipt_id:receipt,age_hours:age.age_hours,
  automatic_external_escalation_sent:false,bookkeeping_closed:false,
  new_independent_signature_generated:false};
}


// Build 710: original independent-signer *provenance* only. Rechecking
// an existing Build 706 Ed25519 verifier is NOT a new external signature.
export function custodyEscalationFollowupAge710(row,now=Date.now()){
 const at=Date.parse(String(row?.attempted_at||''));
 if(!Number.isFinite(at)||at>now+300000)return {
  age_hours:null,status:'HOLD_710_ORIGINAL_ESCALATION_TIMESTAMP_REQUIRED',due:false};
 const age_hours=Math.max(0,Math.floor((now-at)/3600000));
 return {age_hours,status:age_hours>=48?
  'CRITICAL_ORIGINAL_CUSTODY_ESCALATION_FOLLOWUP_AGED_48H_710':
  age_hours>=24?'OVERDUE_ORIGINAL_CUSTODY_ESCALATION_FOLLOWUP_24H_710':
  'ORIGINAL_CUSTODY_ESCALATION_FOLLOWUP_NOT_YET_OVERDUE_710',
  due:age_hours>=24};
}
export function ninthProvenanceManifest710(x){
 return {v:1,purpose:'devilndove_ninth_reviewer_source_provenance_stability_710',
  queue_id:x.queue_id,original_ninth_review_receipt_id:x.original_ninth_review_receipt_id,
  original_706_retention_receipt_id:x.original_706_retention_receipt_id,
  original_707_field_receipt_id:x.original_707_field_receipt_id,
  original_707_custody_receipt_id:x.original_707_custody_receipt_id,
  original_708_continuity_receipt_id:x.original_708_continuity_receipt_id,
  original_708_custody_receipt_id:x.original_708_custody_receipt_id,
  original_709_escalation_receipt_id:x.original_709_escalation_receipt_id,
  original_710_followup_receipt_id:x.original_710_followup_receipt_id,
  original_706_manifest_sha256:x.original_706_manifest_sha256,
  original_708_custody_digest_sha256:x.original_708_custody_digest_sha256,
  review_packet_sha256:x.review_packet_sha256,
  ninth_reviewer_id:x.ninth_reviewer_id,
  source_revision:x.source_revision,fingerprint_sha256:x.fingerprint_sha256,
  audit_outcome:'original_ed25519_ninth_source_rechecked_no_new_signature_books_hold'};
}
async function ninthProvenanceSha710(x){
 const bytes=await crypto.subtle.digest('SHA-256',
  new TextEncoder().encode(JSON.stringify(ninthProvenanceManifest710(x))));
 return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function assessFinance710(current,base706,prior709,escalationRows=[],
 followupRows=[],provenanceRows=[],now=Date.now()){
 const n=Number(current?.queue_id),valid=Number.isSafeInteger(n)&&n>0&&
  current.master_fresh===true&&current.history_complete===true&&
  Array.isArray(current.open_cases)&&current.open_cases.length===0&&
  base706?.history_complete===true&&base706?.ninth_signer_configured===true&&
  !!base706.ninth_signer_id&&prior709?.history_complete===true,
  escalations=Array.isArray(escalationRows)?escalationRows:[],
  follows=Array.isArray(followupRows)?followupRows:[],
  provenance=Array.isArray(provenanceRows)?provenanceRows:[],
  items=(prior709?.items||[]).filter(x=>x.custody_exception_escalated_709)
   .map(x=>({...x,followup_710_verified:false,followup_710_receipt_id:null,
    followup_710_recorded_at:null,provenance_710_verified:false,
    provenance_710_receipt_id:null,provenance_710_digest_sha256:null,provenance_710_recorded_at:null,
    followup_710_age:null,followup_710_due:false,
    original_709_escalation_at:null})),
  cases=new Map(items.map(x=>[Number(x.custody_exception_escalation_receipt_id_709),x]));
 let invalid=0;
 for(const x of items){
  const row=escalations.find(r=>Number(r.social_post_attempt_id)===
    Number(x.custody_exception_escalation_receipt_id_709)),
   d=safeJson(row?.response_json,{}),
   age=custodyEscalationFollowupAge710(row,now);
  // Independently link original ledger rows, never infer a 709 receipt date
  // from an owner-supplied 710 note.
  if(!row||row.attempt_status!=='owner_financial_custody_exception_escalation_709'||
   d.original_708_continuity_receipt_id!==x.continuity_708_receipt_id||
   d.original_ninth_review_receipt_id!==x.review_706_receipt_id||
   d.original_706_manifest_sha256!==x.retention_manifest_sha256||
   d.original_708_custody_digest_sha256!==(x.custody_708_digest_sha256||null)||
   d.ninth_reviewer_id!==base706.ninth_signer_id||
   age.age_hours===null)invalid++;
  x.original_709_escalation_at=row?.attempted_at||null;
  x.followup_710_age=age;
  x.followup_710_due=age.due;
 }
 let priorId=Infinity,priorAt=Infinity;
 const usedFollowups=new Set(),followupReceipts=[];
 for(const row of follows){
  const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
   at=utcAttemptTime698(row.attempted_at,now),
   x=cases.get(Number(d.original_709_escalation_receipt_id)),
   age=custodyEscalationFollowupAge710(
    {attempted_at:x?.original_709_escalation_at},at===null?now:at),
   escalatedAt=utcAttemptTime698(x?.original_709_escalation_at,now);
  const good=valid&&!!x&&row.attempt_status==='owner_custody_escalation_followup_710'&&
   Number.isSafeInteger(id)&&id>Number(x.custody_exception_escalation_receipt_id_709)&&
   id<priorId&&at!==null&&at<=priorAt&&escalatedAt!==null&&at>=escalatedAt&&
   !usedFollowups.has(Number(x.custody_exception_escalation_receipt_id_709))&&
   age.due&&d.followup_age_hours===age.age_hours&&
   d.followup_age_status===age.status&&
   d.original_ninth_review_receipt_id===x.review_706_receipt_id&&
   d.original_708_continuity_receipt_id===x.continuity_708_receipt_id&&
   d.original_708_custody_receipt_id===Number(x.custody_708_receipt_id||0)&&
   d.original_706_manifest_sha256===x.retention_manifest_sha256&&
   d.original_708_custody_digest_sha256===(x.custody_708_digest_sha256||null)&&
   d.ninth_reviewer_id===base706.ninth_signer_id&&
   d.source_revision===current.source_revision&&
   d.fingerprint_sha256===current.fingerprint_sha256&&
   ['manual_independent_reviewer_contact_pending','owner_manual_source_followup_pending']
    .includes(d.followup_disposition)&&
   d.owner_followup_reviewed===true&&
   Number.isSafeInteger(Number(d.owner_user_id))&&Number(d.owner_user_id)>0&&
   typeof d.resolution_note==='string'&&d.resolution_note.length>=25&&
   d.resolution_note.length<=600&&
   d.external_contact_confirmed===false&&d.new_independent_signature_obtained===false&&
   d.bookkeeping_closed===false&&d.financial_certified===false;
  if(good){usedFollowups.add(Number(x.custody_exception_escalation_receipt_id_709));
   x.followup_710_verified=true;x.followup_710_receipt_id=id;
   x.followup_710_recorded_at=row.attempted_at;
  }else invalid++;
  followupReceipts.push({receipt_id:id,verified:!!good,
   original_709_escalation_receipt_id:Number(d.original_709_escalation_receipt_id),
   status:good?'ORIGINAL_OVERDUE_CUSTODY_EXCEPTION_FOLLOWUP_DURABLY_RECORDED_BOOKS_HOLD_710':
    'HOLD_710_FOLLOWUP_AGE_OR_SOURCE_DRIFT'});
  priorId=id;priorAt=at===null?-Infinity:at;
 }
 priorId=Infinity;priorAt=Infinity;const usedAudit=new Set(),provenanceReceipts=[];
 for(const row of provenance){
  const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
   at=utcAttemptTime698(row.attempted_at,now),
   x=items.find(x=>x.followup_710_receipt_id===Number(d.original_710_followup_receipt_id)),
   followedAt=utcAttemptTime698(x?.followup_710_recorded_at,now);
  const good=valid&&!!x&&x.followup_710_verified&&
   row.attempt_status==='owner_ninth_reviewer_provenance_audit_710'&&
   Number.isSafeInteger(id)&&id>Number(x.followup_710_receipt_id)&&id<priorId&&
   at!==null&&at<=priorAt&&followedAt!==null&&at>=followedAt&&
   !usedAudit.has(Number(x.followup_710_receipt_id))&&
   d.queue_id===n&&
   d.original_ninth_review_receipt_id===x.review_706_receipt_id&&
   d.original_706_retention_receipt_id===x.retention_706_receipt_id&&
   d.original_707_field_receipt_id===x.field_707_receipt_id&&
   d.original_707_custody_receipt_id===x.custody_707_receipt_id&&
   d.original_708_continuity_receipt_id===x.continuity_708_receipt_id&&
   d.original_708_custody_receipt_id===Number(x.custody_708_receipt_id||0)&&
   d.original_709_escalation_receipt_id===x.custody_exception_escalation_receipt_id_709&&
   d.original_706_manifest_sha256===x.retention_manifest_sha256&&
   d.original_708_custody_digest_sha256===(x.custody_708_digest_sha256||null)&&
   d.review_packet_sha256===x.review_packet_sha256&&
   d.ninth_reviewer_id===base706.ninth_signer_id&&
   d.source_revision===current.source_revision&&
   d.fingerprint_sha256===current.fingerprint_sha256&&
   d.owner_provenance_reviewed===true&&
   Number.isSafeInteger(Number(d.owner_user_id))&&Number(d.owner_user_id)>0&&
   typeof d.resolution_note==='string'&&d.resolution_note.length>=25&&
   d.resolution_note.length<=600&&
   d.original_ninth_signature_source_reverified===true&&
   d.new_independent_signature_obtained===false&&
   d.external_contact_confirmed===false&&
   d.bookkeeping_closed===false&&d.financial_certified===false&&
   /^[a-f0-9]{64}$/.test(d.provenance_manifest_sha256||'');
  const verified=!!good&&(await ninthProvenanceSha710(d))===d.provenance_manifest_sha256;
  if(verified){usedAudit.add(Number(x.followup_710_receipt_id));
   x.provenance_710_verified=true;x.provenance_710_receipt_id=id;
   x.provenance_710_digest_sha256=d.provenance_manifest_sha256;
   x.provenance_710_recorded_at=row.attempted_at;
  }else invalid++;
  provenanceReceipts.push({receipt_id:id,verified,
   original_710_followup_receipt_id:Number(d.original_710_followup_receipt_id),
   status:verified?'ORIGINAL_NINTH_REVIEWER_PROVENANCE_SHA_STABLE_BOOKS_HOLD_710':
    'HOLD_710_NINTH_PROVENANCE_SHA_OR_SOURCE_DRIFT'});
  priorId=id;priorAt=at===null?-Infinity:at;
 }
 const complete=valid&&escalations.length<=60&&follows.length<=60&&
  provenance.length<=60&&invalid===0;
 return {status:!complete?'HOLD_710_ORIGINAL_NINTH_PROVENANCE_OR_CUSTODY_HISTORY_DRIFT':
  !items.length?'HOLD_709_SOURCE_BOUND_CUSTODY_ESCALATION_REQUIRED':
  items.some(x=>x.followup_710_due&&!x.followup_710_verified)?
    'ORIGINAL_OVERDUE_CUSTODY_ESCALATION_FOLLOWUP_REQUIRED_710':
  items.some(x=>x.followup_710_verified&&!x.provenance_710_verified)?
    'OWNER_CUSTODY_FOLLOWUP_RECORDED_NINTH_PROVENANCE_AUDIT_REQUIRED_710':
  items.some(x=>x.provenance_710_verified)?
    'OWNER_NINTH_SOURCE_PROVENANCE_STABLE_BOOKS_HOLD_710':
    'ORIGINAL_CUSTODY_ESCALATION_FOLLOWUP_NOT_YET_DUE_710',
  campaign_queue_id:valid?n:null,history_complete:complete,items:items.slice(0,40),
  eligible_count:items.length,due_followup_count:items.filter(x=>x.followup_710_due&&!x.followup_710_verified).length,
  completed_followup_count:items.filter(x=>x.followup_710_verified).length,
  provenance_audited_count:items.filter(x=>x.provenance_710_verified).length,
  invalid_count:invalid,followup_receipts:followupReceipts.slice(0,40),
  provenance_receipts:provenanceReceipts.slice(0,40),
  independent_ninth_new_signature_generated:false,independent_external_contact_verified:false,
  on_demand_only:true,bookkeeping_closed:false,financial_certified:false,
  connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}
async function finance710(db,env,id){
 const n=Number(id);
 if(!Number.isSafeInteger(n)||n<1)
  return assessFinance710({queue_id:0},{history_complete:false},{history_complete:false});
 const current=await financial685(db,env,n),base=await finance706(db,env,n),
  prior=await finance709(db,env,n);
 const esc=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_custody_escalation_709' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 const follows=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_custody_followup_710' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 const provenances=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_ninth_provenance_710' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 return assessFinance710(current,base,prior,esc,follows,provenances);
}
async function ownerCustodyFollowup710(db,env,user,p){
 const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
  base=await finance706(db,env,n),report=await finance710(db,env,n),
  escalationId=Number(p.original_709_escalation_receipt_id),
  x=report.items?.find(x=>x.custody_exception_escalation_receipt_id_709===escalationId&&
    x.followup_710_due&&!x.followup_710_verified),
  note=normalizeText(p.resolution_note),
  disposition=String(p.followup_disposition||'');
 if(!current.queue_id||!base.history_complete||!report.history_complete||!x||
  p.owner_followup_reviewed!==true||note.length<25||note.length>600||
  !['manual_independent_reviewer_contact_pending','owner_manual_source_followup_pending'].includes(disposition)||
  p.expected_source_revision!==current.source_revision||
  p.expected_fingerprint_sha256!==current.fingerprint_sha256||
  p.expected_706_manifest_sha256!==x.retention_manifest_sha256||
  p.expected_708_custody_digest_sha256!==(x.custody_708_digest_sha256||null))
  throw Error('Original 24h aged 709 owner escalation and source-pinned ninth/706/708 custody required. HOLD.');
 const fresh=await financial685(db,env,n),age=custodyEscalationFollowupAge710(
  {attempted_at:x.original_709_escalation_at});
 if(fresh.source_revision!==current.source_revision||
  fresh.fingerprint_sha256!==current.fingerprint_sha256||
  !fresh.master_fresh||!fresh.history_complete||fresh.open_cases?.length||!age.due)
  throw Error('Original financial/Master drift or escalation not overdue; HOLD.');
 const data={original_709_escalation_receipt_id:escalationId,
  original_ninth_review_receipt_id:x.review_706_receipt_id,
  original_708_continuity_receipt_id:x.continuity_708_receipt_id,
  original_708_custody_receipt_id:Number(x.custody_708_receipt_id||0),
  original_706_manifest_sha256:x.retention_manifest_sha256,
  original_708_custody_digest_sha256:x.custody_708_digest_sha256||null,
  ninth_reviewer_id:base.ninth_signer_id,
  source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
  followup_age_hours:age.age_hours,followup_age_status:age.status,
  followup_disposition:disposition,owner_followup_reviewed:true,
  owner_user_id:user.user_id,resolution_note:note,
  external_contact_confirmed:false,new_independent_signature_obtained:false,
  bookkeeping_closed:false,financial_certified:false};
 const receipt=await append684(db,user,n,'finance_custody_followup_710',
  'owner_custody_escalation_followup_710','finance710-followup-'+n+'-'+escalationId,data);
 const after=await finance710(db,env,n);
 if(!after.followup_receipts.some(x=>x.receipt_id===receipt&&x.verified))
  throw Error('Original custody overdue follow-up not independently read back in D1 ledger. HOLD.');
 return {status:'ORIGINAL_OVERDUE_CUSTODY_EXCEPTION_FOLLOWUP_DURABLY_RECORDED_BOOKS_HOLD_710',
  receipt_id:receipt,bookkeeping_closed:false,external_contact_confirmed:false};
}
async function ownerNinthProvenanceAudit710(db,env,user,p){
 const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
  base=await finance706(db,env,n),report=await finance710(db,env,n),
  followupId=Number(p.original_710_followup_receipt_id),
  x=report.items?.find(x=>x.followup_710_receipt_id===followupId&&
    x.followup_710_verified&&!x.provenance_710_verified),
  note=normalizeText(p.resolution_note);
 if(!current.queue_id||!base.history_complete||!report.history_complete||!x||
  p.owner_provenance_reviewed!==true||note.length<25||note.length>600||
  p.expected_source_revision!==current.source_revision||
  p.expected_fingerprint_sha256!==current.fingerprint_sha256||
  p.expected_706_manifest_sha256!==x.retention_manifest_sha256||
  p.expected_708_custody_digest_sha256!==(x.custody_708_digest_sha256||null))
  throw Error('Original independent ninth signed source, 709 overdue escalation and 710 source-bound follow-up required. HOLD.');
 const fresh=await financial685(db,env,n);
 if(fresh.source_revision!==current.source_revision||
  fresh.fingerprint_sha256!==current.fingerprint_sha256||
  !fresh.master_fresh||!fresh.history_complete||fresh.open_cases?.length)
  throw Error('Financial source or Master changed during ninth provenance review. HOLD.');
 const evidence={queue_id:n,original_ninth_review_receipt_id:x.review_706_receipt_id,
  original_706_retention_receipt_id:x.retention_706_receipt_id,
  original_707_field_receipt_id:x.field_707_receipt_id,
  original_707_custody_receipt_id:x.custody_707_receipt_id,
  original_708_continuity_receipt_id:x.continuity_708_receipt_id,
  original_708_custody_receipt_id:Number(x.custody_708_receipt_id||0),
  original_709_escalation_receipt_id:x.custody_exception_escalation_receipt_id_709,
  original_710_followup_receipt_id:followupId,
  original_706_manifest_sha256:x.retention_manifest_sha256,
  original_708_custody_digest_sha256:x.custody_708_digest_sha256||null,
  review_packet_sha256:x.review_packet_sha256,
  ninth_reviewer_id:base.ninth_signer_id,source_revision:current.source_revision,
  fingerprint_sha256:current.fingerprint_sha256};
 const provenance_manifest_sha256=await ninthProvenanceSha710(evidence);
 const data={...evidence,provenance_manifest_sha256,owner_provenance_reviewed:true,
  owner_user_id:user.user_id,resolution_note:note,
  original_ninth_signature_source_reverified:true,
  new_independent_signature_obtained:false,external_contact_confirmed:false,
  bookkeeping_closed:false,financial_certified:false};
 const receipt=await append684(db,user,n,'finance_ninth_provenance_710',
  'owner_ninth_reviewer_provenance_audit_710','finance710-provenance-'+n+'-'+followupId,data);
 const after=await finance710(db,env,n);
 if(!after.provenance_receipts.some(x=>x.receipt_id===receipt&&x.verified))
  throw Error('Original ninth source provenance SHA did not read back from protected D1. HOLD.');
 return {status:'ORIGINAL_NINTH_REVIEWER_PROVENANCE_SHA_STABLE_BOOKS_HOLD_710',
  receipt_id:receipt,provenance_manifest_sha256,bookkeeping_closed:false,
  new_independent_signature_obtained:false};
}


// Build 711: reconcile original owner follow-up outcomes; this is not proof
// that an outside reviewer was contacted or a financial institution posted.
export function originalProvenanceAge711(x,now=Date.now()){
 const at=Date.parse(String(x?.provenance_710_recorded_at||''));
 if(!Number.isFinite(at)||at>now+300000)
  return {age_hours:null,status:'HOLD_711_ORIGINAL_PROVENANCE_TIMESTAMP_REQUIRED'};
 const age_hours=Math.max(0,Math.floor((now-at)/3600000));
 return {age_hours,status:age_hours>=48?'ORIGINAL_NINTH_PROVENANCE_AGED_48H_RENEWAL_DUE_711':
  age_hours>=24?'ORIGINAL_NINTH_PROVENANCE_RENEWAL_DUE_24H_711':
  'ORIGINAL_NINTH_PROVENANCE_FRESH_UNDER_24H_711'};
}
export function ninthProvenanceRenewalManifest711(x){
 return {v:1,purpose:'devilndove_original_ninth_source_provenance_renewal_711',
  queue_id:x.queue_id,
  original_ninth_review_receipt_id:x.original_ninth_review_receipt_id,
  original_706_retention_receipt_id:x.original_706_retention_receipt_id,
  original_707_field_receipt_id:x.original_707_field_receipt_id,
  original_707_custody_receipt_id:x.original_707_custody_receipt_id,
  original_708_continuity_receipt_id:x.original_708_continuity_receipt_id,
  original_708_custody_receipt_id:x.original_708_custody_receipt_id,
  original_709_escalation_receipt_id:x.original_709_escalation_receipt_id,
  original_710_followup_receipt_id:x.original_710_followup_receipt_id,
  original_710_provenance_receipt_id:x.original_710_provenance_receipt_id,
  original_711_reconciliation_receipt_id:x.original_711_reconciliation_receipt_id,
  original_706_manifest_sha256:x.original_706_manifest_sha256,
  original_708_custody_digest_sha256:x.original_708_custody_digest_sha256,
  original_710_provenance_sha256:x.original_710_provenance_sha256,
  review_packet_sha256:x.review_packet_sha256,
  ninth_reviewer_id:x.ninth_reviewer_id,
  source_revision:x.source_revision,fingerprint_sha256:x.fingerprint_sha256,
  audited_outcome:'original_independent_ninth_source_reverified_owner_only_books_hold'};
}
async function ninthRenewalSha711(x){
 const bytes=await crypto.subtle.digest('SHA-256',
  new TextEncoder().encode(JSON.stringify(ninthProvenanceRenewalManifest711(x))));
 return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function assessFinance711(current,base706,prior710,reconciliations=[],renewals=[],now=Date.now()){
 const n=Number(current?.queue_id),
  valid=Number.isSafeInteger(n)&&n>0&&current.master_fresh===true&&
   current.history_complete===true&&Array.isArray(current.open_cases)&&
   current.open_cases.length===0&&base706?.history_complete===true&&
   base706?.ninth_signer_configured===true&&!!base706.ninth_signer_id&&
   prior710?.history_complete===true,
  reconcileRows=Array.isArray(reconciliations)?reconciliations:[],
  renewalRows=Array.isArray(renewals)?renewals:[],
  items=(prior710?.items||[]).filter(x=>x.followup_710_verified&&x.provenance_710_verified)
   .map(x=>({...x,provenance_aging_711:originalProvenanceAge711(x,now),
    outcome_reconciled_711:false,outcome_receipt_id_711:null,
    outcome_recorded_at_711:null,provenance_renewed_711:false,
    renewal_receipt_id_711:null,renewal_manifest_sha256_711:null})),
  original=new Map(items.map(x=>[Number(x.provenance_710_receipt_id),x]));
 let invalid=0,lastId=Infinity,lastAt=Infinity;const outcomeReceipts=[],used=new Set();
 for(const row of reconcileRows){
  const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
   at=utcAttemptTime698(row.attempted_at,now),
   x=original.get(Number(d.original_710_provenance_receipt_id)),
   originAt=utcAttemptTime698(x?.provenance_710_recorded_at,now);
  const good=valid&&!!x&&row.attempt_status==='owner_custody_followup_outcome_reconciliation_711'&&
   Number.isSafeInteger(id)&&id>Number(x.provenance_710_receipt_id)&&id<lastId&&
   at!==null&&at<=lastAt&&originAt!==null&&at>=originAt&&
   !used.has(Number(x.provenance_710_receipt_id))&&d.queue_id===n&&
   d.original_710_followup_receipt_id===x.followup_710_receipt_id&&
   d.original_709_escalation_receipt_id===x.custody_exception_escalation_receipt_id_709&&
   d.original_ninth_review_receipt_id===x.review_706_receipt_id&&
   d.original_706_manifest_sha256===x.retention_manifest_sha256&&
   d.original_708_custody_digest_sha256===(x.custody_708_digest_sha256||null)&&
   d.original_710_provenance_sha256===x.provenance_710_digest_sha256&&
   d.ninth_reviewer_id===base706.ninth_signer_id&&
   d.source_revision===current.source_revision&&
   d.fingerprint_sha256===current.fingerprint_sha256&&
   ['owner_original_source_review_documented','manual_outside_reviewer_contact_pending',
    'owner_further_custody_repair_pending'].includes(d.followup_outcome)&&
   d.original_ninth_provenance_rechecked===true&&
   d.owner_reconciliation_reviewed===true&&
   Number.isSafeInteger(Number(d.owner_user_id))&&Number(d.owner_user_id)>0&&
   typeof d.resolution_note==='string'&&d.resolution_note.length>=25&&
   d.resolution_note.length<=600&&d.external_contact_confirmed===false&&
   d.new_independent_signature_obtained===false&&d.bookkeeping_closed===false&&
   d.financial_certified===false;
  if(good){used.add(Number(x.provenance_710_receipt_id));
   x.outcome_reconciled_711=true;x.outcome_receipt_id_711=id;
   x.outcome_recorded_at_711=row.attempted_at;
  }else invalid++;
  outcomeReceipts.push({receipt_id:id,verified:!!good,
   original_710_provenance_receipt_id:Number(d.original_710_provenance_receipt_id),
   status:good?'OWNER_SOURCE_BOUND_CUSTODY_FOLLOWUP_OUTCOME_RECONCILED_HOLD_711':
    'HOLD_711_CUSTODY_OUTCOME_OR_SOURCE_DRIFT'});
  lastId=id;lastAt=at===null?-Infinity:at;
 }
 lastId=Infinity;lastAt=Infinity;const renewalReceipts=[],renewed=new Set();
 for(const row of renewalRows){
  const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
   at=utcAttemptTime698(row.attempted_at,now),
   x=items.find(x=>x.outcome_receipt_id_711===Number(d.original_711_reconciliation_receipt_id)),
   originAt=utcAttemptTime698(x?.outcome_recorded_at_711,now);
  const good=valid&&!!x&&x.outcome_reconciled_711&&
   row.attempt_status==='owner_ninth_provenance_renewal_audit_711'&&
   Number.isSafeInteger(id)&&id>Number(x.outcome_receipt_id_711)&&id<lastId&&
   at!==null&&at<=lastAt&&originAt!==null&&at>=originAt&&
   !renewed.has(Number(x.outcome_receipt_id_711))&&d.queue_id===n&&
   d.original_ninth_review_receipt_id===x.review_706_receipt_id&&
   d.original_706_retention_receipt_id===x.retention_706_receipt_id&&
   d.original_707_field_receipt_id===x.field_707_receipt_id&&
   d.original_707_custody_receipt_id===x.custody_707_receipt_id&&
   d.original_708_continuity_receipt_id===x.continuity_708_receipt_id&&
   d.original_708_custody_receipt_id===Number(x.custody_708_receipt_id||0)&&
   d.original_709_escalation_receipt_id===x.custody_exception_escalation_receipt_id_709&&
   d.original_710_followup_receipt_id===x.followup_710_receipt_id&&
   d.original_710_provenance_receipt_id===x.provenance_710_receipt_id&&
   d.original_706_manifest_sha256===x.retention_manifest_sha256&&
   d.original_708_custody_digest_sha256===(x.custody_708_digest_sha256||null)&&
   d.original_710_provenance_sha256===x.provenance_710_digest_sha256&&
   d.review_packet_sha256===x.review_packet_sha256&&
   d.ninth_reviewer_id===base706.ninth_signer_id&&
   d.source_revision===current.source_revision&&
   d.fingerprint_sha256===current.fingerprint_sha256&&
   d.original_ninth_signature_source_reverified===true&&
   d.owner_provenance_reviewed===true&&
   Number.isSafeInteger(Number(d.owner_user_id))&&Number(d.owner_user_id)>0&&
   typeof d.resolution_note==='string'&&d.resolution_note.length>=25&&
   d.resolution_note.length<=600&&
   d.external_contact_confirmed===false&&d.new_independent_signature_obtained===false&&
   d.bookkeeping_closed===false&&d.financial_certified===false&&
   /^[a-f0-9]{64}$/.test(d.renewal_manifest_sha256||'');
  const verified=!!good&&(await ninthRenewalSha711(d))===d.renewal_manifest_sha256;
  if(verified){renewed.add(Number(x.outcome_receipt_id_711));x.provenance_renewed_711=true;
   x.renewal_receipt_id_711=id;x.renewal_manifest_sha256_711=d.renewal_manifest_sha256;
  }else invalid++;
  renewalReceipts.push({receipt_id:id,verified,
   original_711_reconciliation_receipt_id:Number(d.original_711_reconciliation_receipt_id),
   status:verified?'ORIGINAL_NINTH_PROVENANCE_RENEWED_SHA_VERIFIED_BOOKS_HOLD_711':
    'HOLD_711_NINTH_RENEWAL_SHA_OR_SOURCE_DRIFT'});
  lastId=id;lastAt=at===null?-Infinity:at;
 }
 const complete=valid&&reconcileRows.length<=60&&renewalRows.length<=60&&invalid===0;
 return {status:!complete?'HOLD_711_CUSTODY_OUTCOME_OR_NINTH_PROVENANCE_HISTORY_DRIFT':
  !items.length?'HOLD_710_ORIGINAL_NINTH_PROVENANCE_AND_OWNER_FOLLOWUP_REQUIRED':
  items.some(x=>!x.outcome_reconciled_711)?'OWNER_CUSTODY_FOLLOWUP_OUTCOME_RECONCILIATION_REQUIRED_711':
  items.some(x=>!x.provenance_renewed_711)?'OWNER_CUSTODY_OUTCOME_RECORDED_PROVENANCE_RENEWAL_REQUIRED_711':
  'ORIGINAL_NINTH_REVIEWER_PROVENANCE_RENEWED_BOOKS_HOLD_711',
  campaign_queue_id:valid?n:null,history_complete:complete,
  items:items.slice(0,40),eligible_count:items.length,
  outcome_reconciled_count:items.filter(x=>x.outcome_reconciled_711).length,
  provenance_renewed_count:items.filter(x=>x.provenance_renewed_711).length,
  invalid_count:invalid,outcome_receipts:outcomeReceipts.slice(0,40),
  renewal_receipts:renewalReceipts.slice(0,40),
  new_independent_signature_generated:false,external_contact_verified:false,
  continuous_provenance_monitoring:false,bookkeeping_closed:false,financial_certified:false,
  connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}
async function finance711(db,env,id){
 const n=Number(id);
 if(!Number.isSafeInteger(n)||n<1)
  return assessFinance711({queue_id:0},{history_complete:false},{history_complete:false});
 const current=await financial685(db,env,n),base=await finance706(db,env,n),
  prior=await finance710(db,env,n);
 const outcomes=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_custody_outcome_711' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 const renewals=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_ninth_renewal_711' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 return assessFinance711(current,base,prior,outcomes,renewals);
}
async function ownerCustodyOutcome711(db,env,user,p){
 const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
  base=await finance706(db,env,n),report=await finance711(db,env,n),
  provenanceId=Number(p.original_710_provenance_receipt_id),
  x=report.items?.find(x=>x.provenance_710_receipt_id===provenanceId&&!x.outcome_reconciled_711),
  note=normalizeText(p.resolution_note),outcome=String(p.followup_outcome||'');
 if(!current.queue_id||!base.history_complete||!report.history_complete||!x||
  p.owner_reconciliation_reviewed!==true||note.length<25||note.length>600||
  !['owner_original_source_review_documented','manual_outside_reviewer_contact_pending',
   'owner_further_custody_repair_pending'].includes(outcome)||
  p.expected_source_revision!==current.source_revision||
  p.expected_fingerprint_sha256!==current.fingerprint_sha256||
  p.expected_706_manifest_sha256!==x.retention_manifest_sha256||
  p.expected_710_provenance_sha256!==x.provenance_710_digest_sha256)
  throw Error('Original verified Build 710 ninth provenance, exact source and owner follow-up outcome review required. HOLD.');
 const fresh=await financial685(db,env,n);
 if(!fresh.master_fresh||!fresh.history_complete||fresh.open_cases?.length||
  fresh.source_revision!==current.source_revision||
  fresh.fingerprint_sha256!==current.fingerprint_sha256)
  throw Error('Original financial/Master source drifted during custody outcome review. HOLD.');
 const data={queue_id:n,original_710_provenance_receipt_id:provenanceId,
  original_710_followup_receipt_id:x.followup_710_receipt_id,
  original_709_escalation_receipt_id:x.custody_exception_escalation_receipt_id_709,
  original_ninth_review_receipt_id:x.review_706_receipt_id,
  original_706_manifest_sha256:x.retention_manifest_sha256,
  original_708_custody_digest_sha256:x.custody_708_digest_sha256||null,
  original_710_provenance_sha256:x.provenance_710_digest_sha256,
  ninth_reviewer_id:base.ninth_signer_id,source_revision:current.source_revision,
  fingerprint_sha256:current.fingerprint_sha256,followup_outcome:outcome,
  original_ninth_provenance_rechecked:true,owner_reconciliation_reviewed:true,
  owner_user_id:user.user_id,resolution_note:note,external_contact_confirmed:false,
  new_independent_signature_obtained:false,bookkeeping_closed:false,financial_certified:false};
 const receipt=await append684(db,user,n,'finance_custody_outcome_711',
  'owner_custody_followup_outcome_reconciliation_711',
  'finance711-outcome-'+n+'-'+provenanceId,data);
 const after=await finance711(db,env,n);
 if(!after.outcome_receipts.some(x=>x.receipt_id===receipt&&x.verified))
  throw Error('Source-bound custody outcome failed exact protected D1 readback. HOLD.');
 return {status:'OWNER_SOURCE_BOUND_CUSTODY_FOLLOWUP_OUTCOME_RECONCILED_HOLD_711',
  receipt_id:receipt,bookkeeping_closed:false,external_contact_confirmed:false};
}
async function ownerNinthRenewal711(db,env,user,p){
 const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
  base=await finance706(db,env,n),report=await finance711(db,env,n),
  outcomeId=Number(p.original_711_reconciliation_receipt_id),
  x=report.items?.find(x=>x.outcome_receipt_id_711===outcomeId&&
    x.outcome_reconciled_711&&!x.provenance_renewed_711),
  note=normalizeText(p.resolution_note);
 if(!current.queue_id||!base.history_complete||!report.history_complete||!x||
  p.owner_provenance_reviewed!==true||note.length<25||note.length>600||
  p.expected_source_revision!==current.source_revision||
  p.expected_fingerprint_sha256!==current.fingerprint_sha256||
  p.expected_706_manifest_sha256!==x.retention_manifest_sha256||
  p.expected_710_provenance_sha256!==x.provenance_710_digest_sha256)
  throw Error('Original verified independently signed ninth source and reconciled 711 owner custody outcome required. HOLD.');
 const fresh=await financial685(db,env,n);
 if(!fresh.master_fresh||!fresh.history_complete||fresh.open_cases?.length||
  fresh.source_revision!==current.source_revision||
  fresh.fingerprint_sha256!==current.fingerprint_sha256)
  throw Error('Financial original source or Master changed during ninth provenance renewal. HOLD.');
 const manifest={queue_id:n,original_ninth_review_receipt_id:x.review_706_receipt_id,
  original_706_retention_receipt_id:x.retention_706_receipt_id,
  original_707_field_receipt_id:x.field_707_receipt_id,
  original_707_custody_receipt_id:x.custody_707_receipt_id,
  original_708_continuity_receipt_id:x.continuity_708_receipt_id,
  original_708_custody_receipt_id:Number(x.custody_708_receipt_id||0),
  original_709_escalation_receipt_id:x.custody_exception_escalation_receipt_id_709,
  original_710_followup_receipt_id:x.followup_710_receipt_id,
  original_710_provenance_receipt_id:x.provenance_710_receipt_id,
  original_711_reconciliation_receipt_id:outcomeId,
  original_706_manifest_sha256:x.retention_manifest_sha256,
  original_708_custody_digest_sha256:x.custody_708_digest_sha256||null,
  original_710_provenance_sha256:x.provenance_710_digest_sha256,
  review_packet_sha256:x.review_packet_sha256,
  ninth_reviewer_id:base.ninth_signer_id,source_revision:current.source_revision,
  fingerprint_sha256:current.fingerprint_sha256};
 const renewal_manifest_sha256=await ninthRenewalSha711(manifest);
 const data={...manifest,renewal_manifest_sha256,owner_provenance_reviewed:true,
  original_ninth_signature_source_reverified:true,owner_user_id:user.user_id,
  resolution_note:note,external_contact_confirmed:false,
  new_independent_signature_obtained:false,bookkeeping_closed:false,financial_certified:false};
 const receipt=await append684(db,user,n,'finance_ninth_renewal_711',
  'owner_ninth_provenance_renewal_audit_711','finance711-renewal-'+n+'-'+outcomeId,data);
 const after=await finance711(db,env,n);
 if(!after.renewal_receipts.some(x=>x.receipt_id===receipt&&x.verified))
  throw Error('Original ninth provenance renewal SHA failed protected D1 readback. HOLD.');
 return {status:'ORIGINAL_NINTH_PROVENANCE_RENEWED_SHA_VERIFIED_BOOKS_HOLD_711',
  receipt_id:receipt,renewal_manifest_sha256,bookkeeping_closed:false,
  new_independent_signature_generated:false};
}


// Build 712 independently re-reads durable Build 711 renewal ledger rows and
// computes 24/48/72 hour horizons; there is no continuous runtime watcher.
export function originalNinthRenewalAge712(row,now=Date.now()){
 const at=Date.parse(String(row?.attempted_at||''));
 if(!Number.isFinite(at)||at>now+300000)
  return {age_hours:null,due:false,status:'HOLD_712_ORIGINAL_RENEWAL_TIMESTAMP_INVALID'};
 const age_hours=Math.max(0,Math.floor((now-at)/3600000));
 return {age_hours,due:age_hours>=24,status:age_hours>=72?
  'ORIGINAL_NINTH_RENEWAL_HORIZON_72H_SOURCE_REVIEW_DUE_712':
  age_hours>=48?'ORIGINAL_NINTH_RENEWAL_HORIZON_48H_SOURCE_REVIEW_DUE_712':
  age_hours>=24?'ORIGINAL_NINTH_RENEWAL_HORIZON_24H_SOURCE_REVIEW_DUE_712':
  'ORIGINAL_NINTH_RENEWAL_HORIZON_UNDER_24H_712'};
}
export async function assessFinance712(current,base706,prior711,renewalRows=[],followupRows=[],now=Date.now()){
 const n=Number(current?.queue_id),valid=Number.isSafeInteger(n)&&n>0&&
  current.master_fresh===true&&current.history_complete===true&&
  Array.isArray(current.open_cases)&&current.open_cases.length===0&&
  base706?.history_complete===true&&base706?.ninth_signer_configured===true&&
  !!base706.ninth_signer_id&&prior711?.history_complete===true,
  origin=Array.isArray(renewalRows)?renewalRows:[],
  followups=Array.isArray(followupRows)?followupRows:[],
  items=(prior711?.items||[]).filter(x=>x.provenance_renewed_711)
   .map(x=>({...x,original_711_renewal_recorded_at:null,
    original_ninth_drift_712:'HOLD_712_ORIGINAL_SIGNED_RENEWAL_ROW_MISSING',
    source_stable_712:false,renewal_horizon_712:null,
    custody_followup_evidence_recorded_712:false,
    custody_followup_evidence_receipt_id_712:null})),
  byId=new Map(items.map(x=>[Number(x.renewal_receipt_id_711),x]));
 let invalid=0,prevId=Infinity,prevAt=Infinity;
 const observedRenewalIds=new Set();
 for(const row of origin){
  const id=Number(row.social_post_attempt_id),d=safeJson(row.response_json,{}),
   at=utcAttemptTime698(row.attempted_at,now),
   x=byId.get(id),age=originalNinthRenewalAge712(row,now);
  const verified=valid&&!!x&&
   row.attempt_status==='owner_ninth_provenance_renewal_audit_711'&&
   !observedRenewalIds.has(id)&&Number.isSafeInteger(id)&&
   id>Number(x.outcome_receipt_id_711)&&id<prevId&&
   at!==null&&at<=prevAt&&age.age_hours!==null&&
   d.queue_id===n&&
   d.original_ninth_review_receipt_id===x.review_706_receipt_id&&
   d.original_710_provenance_receipt_id===x.provenance_710_receipt_id&&
   d.original_711_reconciliation_receipt_id===x.outcome_receipt_id_711&&
   d.original_706_manifest_sha256===x.retention_manifest_sha256&&
   d.original_708_custody_digest_sha256===(x.custody_708_digest_sha256||null)&&
   d.original_710_provenance_sha256===x.provenance_710_digest_sha256&&
   d.renewal_manifest_sha256===x.renewal_manifest_sha256_711&&
   d.ninth_reviewer_id===base706.ninth_signer_id&&
   d.source_revision===current.source_revision&&
   d.fingerprint_sha256===current.fingerprint_sha256&&
   d.original_ninth_signature_source_reverified===true&&
   d.new_independent_signature_obtained===false&&
   d.external_contact_confirmed===false&&
   d.bookkeeping_closed===false&&d.financial_certified===false;
  if(verified){observedRenewalIds.add(id);
   x.original_711_renewal_recorded_at=row.attempted_at;
   x.original_ninth_drift_712='NO_SOURCE_DRIFT_ORIGINAL_711_SIGNED_RENEWAL_RECHECKED_712';
   x.source_stable_712=true;x.renewal_horizon_712=age;
  }else{invalid++;
   if(x)x.original_ninth_drift_712='HOLD_712_NINTH_RENEWAL_SOURCE_OR_TIMESTAMP_DRIFT';
  }
  prevId=id;prevAt=at===null?-Infinity:at;
 }
 for(const x of items)if(!observedRenewalIds.has(Number(x.renewal_receipt_id_711))){
  if(x.original_ninth_drift_712==='HOLD_712_ORIGINAL_SIGNED_RENEWAL_ROW_MISSING')invalid++;
 }
 let lastId=Infinity,lastAt=Infinity;const seen=new Set(),receipts=[];
 for(const row of followups){
  const d=safeJson(row.response_json,{}),id=Number(row.social_post_attempt_id),
   at=utcAttemptTime698(row.attempted_at,now),
   x=items.find(x=>x.renewal_receipt_id_711===Number(d.original_711_renewal_receipt_id)),
   originalAt=utcAttemptTime698(x?.original_711_renewal_recorded_at,now),
   age=originalNinthRenewalAge712({attempted_at:x?.original_711_renewal_recorded_at},
    at===null?now:at);
  const good=valid&&!!x&&x.source_stable_712&&
   row.attempt_status==='owner_custody_followup_evidence_712'&&
   Number.isSafeInteger(id)&&id>Number(x.renewal_receipt_id_711)&&id<lastId&&
   at!==null&&at<=lastAt&&originalAt!==null&&at>=originalAt&&
   !seen.has(Number(x.renewal_receipt_id_711))&&age.due===true&&
   d.queue_id===n&&d.original_711_outcome_receipt_id===x.outcome_receipt_id_711&&
   d.original_710_followup_receipt_id===x.followup_710_receipt_id&&
   d.original_710_provenance_receipt_id===x.provenance_710_receipt_id&&
   d.original_ninth_review_receipt_id===x.review_706_receipt_id&&
   d.original_706_manifest_sha256===x.retention_manifest_sha256&&
   d.original_708_custody_digest_sha256===(x.custody_708_digest_sha256||null)&&
   d.original_710_provenance_sha256===x.provenance_710_digest_sha256&&
   d.original_711_renewal_sha256===x.renewal_manifest_sha256_711&&
   d.ninth_reviewer_id===base706.ninth_signer_id&&
   d.source_revision===current.source_revision&&
   d.fingerprint_sha256===current.fingerprint_sha256&&
   d.observed_original_renewal_age_hours===age.age_hours&&
   d.observed_original_renewal_age_status===age.status&&
   ['owner_documented_custody_source_review_pending',
    'manual_reviewer_followup_requested_unconfirmed',
    'original_custody_repair_still_pending'].includes(d.manual_evidence_disposition)&&
   typeof d.manual_evidence_reference==='string'&&
    d.manual_evidence_reference.length>=8&&d.manual_evidence_reference.length<=160&&
   d.owner_reviewed_original_source===true&&
   Number.isSafeInteger(Number(d.owner_user_id))&&Number(d.owner_user_id)>0&&
   typeof d.resolution_note==='string'&&d.resolution_note.length>=25&&
   d.resolution_note.length<=600&&
   d.independent_reviewer_response_confirmed===false&&
   d.external_financial_source_verified===false&&
   d.new_independent_signature_obtained===false&&
   d.financial_certified===false&&d.bookkeeping_closed===false;
  if(good){seen.add(Number(x.renewal_receipt_id_711));
   x.custody_followup_evidence_recorded_712=true;
   x.custody_followup_evidence_receipt_id_712=id;
  }else invalid++;
  receipts.push({receipt_id:id,verified:!!good,recorded_at:row.attempted_at,
   original_711_renewal_receipt_id:Number(d.original_711_renewal_receipt_id),
   status:good?'OWNER_SOURCE_BOUND_CUSTODY_FOLLOWUP_EVIDENCE_RECORDED_BOOKS_HOLD_712':
    'HOLD_712_CUSTODY_FOLLOWUP_EVIDENCE_SOURCE_REPLAY_OR_DRIFT'});
  lastId=id;lastAt=at===null?-Infinity:at;
 }
 const complete=valid&&origin.length<=60&&followups.length<=60&&invalid===0;
 return {status:!complete?'HOLD_712_SIGNED_NINTH_RENEWAL_OR_CUSTODY_SOURCE_DRIFT':
  !items.length?'HOLD_711_ORIGINAL_NINTH_RENEWAL_REQUIRED':
  items.some(x=>!x.source_stable_712)?'HOLD_712_ORIGINAL_RENEWAL_SOURCE_DRIFT':
  items.some(x=>x.renewal_horizon_712?.due&&!x.custody_followup_evidence_recorded_712)?
   'ORIGINAL_NINTH_RENEWAL_HORIZON_FOLLOWUP_EVIDENCE_DUE_712':
  items.some(x=>x.custody_followup_evidence_recorded_712)?
   'ORIGINAL_CUSTODY_FOLLOWUP_EVIDENCE_RECORDED_SOURCE_STABLE_BOOKS_HOLD_712':
  'ON_DEMAND_NINTH_RENEWAL_SOURCE_STABLE_UNDER_24H_712',
  campaign_queue_id:valid?n:null,history_complete:complete,
  items:items.slice(0,40),eligible_count:items.length,
  renewed_source_drift_count:items.filter(x=>!x.source_stable_712).length,
  horizon_due_count:items.filter(x=>x.renewal_horizon_712?.due&&!x.custody_followup_evidence_recorded_712).length,
  evidence_recorded_count:items.filter(x=>x.custody_followup_evidence_recorded_712).length,
  invalid_count:invalid,evidence_receipts:receipts.slice(0,40),
  independent_original_ninth_signature_rechecked:complete,
  new_independent_signature_generated:false,
  independent_reviewer_response_confirmed:false,
  continuous_drift_watcher_enabled:false,bookkeeping_closed:false,financial_certified:false,
  connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}
async function finance712(db,env,id){
 const n=Number(id);
 if(!Number.isSafeInteger(n)||n<1)
  return assessFinance712({queue_id:0},{history_complete:false},{history_complete:false});
 const current=await financial685(db,env,n),base=await finance706(db,env,n),
  prior=await finance711(db,env,n);
 const renewals=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_ninth_renewal_711' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 const followups=rows(await db.prepare("SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_custody_evidence_712' ORDER BY social_post_attempt_id DESC LIMIT 61").bind(n).all());
 return assessFinance712(current,base,prior,renewals,followups);
}

/* Build 713 re-reads the original 706 independent Ed25519 ninth authority and
 * persisted 711/712 D1 source rows through finance712; never signs anew. */
export function assessFinance713(prior,base706,now=Date.now()){
 const valid=prior?.history_complete===true&&
  prior?.independent_original_ninth_signature_rechecked===true&&
  prior?.new_independent_signature_generated===false&&
  prior?.bookkeeping_closed===false&&
  base706?.history_complete===true&&base706?.ninth_signer_configured===true&&
  typeof base706.ninth_signer_id==='string'&&!!base706.ninth_signer_id;
 const originals=Array.isArray(prior?.items)?prior.items:[],
  evidence=Array.isArray(prior?.evidence_receipts)?prior.evidence_receipts:[];
 let invalid=0,reviewDue=0,outcomes=0;
 const ids=new Set(),observed=new Set();
 const time=x=>Date.parse(String(x||'').replace(
  /^([0-9]{4}-[0-9]{2}-[0-9]{2}) ([0-9]{2}:[0-9]{2}:[0-9]{2})$/,'$1T$2Z'));
 const items=originals.slice(0,40).map(x=>{
  const renewalId=Number(x.renewal_receipt_id_711),
   age=originalNinthRenewalAge712({attempted_at:x.original_711_renewal_recorded_at},now),
   matched=evidence.filter(y=>Number(y.original_711_renewal_receipt_id)===renewalId),
   receipt=matched[0],receiptAt=time(receipt?.recorded_at),
   renewalAt=time(x.original_711_renewal_recorded_at),
   chronological=!receipt||(Number.isFinite(receiptAt)&&receiptAt>=renewalAt&&
    receiptAt<=now+300000&&Number(receipt.receipt_id)>renewalId),
   unique=Number.isSafeInteger(renewalId)&&renewalId>0&&!ids.has(renewalId);
  ids.add(renewalId);
  const stable=valid&&unique&&x.source_stable_712===true&&
   age.age_hours!==null&&!!x.review_706_receipt_id&&
   !!x.retention_manifest_sha256&&!!x.provenance_710_digest_sha256&&
   !!x.renewal_manifest_sha256_711&&matched.length<=1&&chronological&&
   (!receipt||receipt.verified===true)&&
   (!!receipt===!!x.custody_followup_evidence_recorded_712)&&
   (!receipt||Number(x.custody_followup_evidence_receipt_id_712)===Number(receipt.receipt_id));
  if(!stable)invalid++;
  if(stable&&age.due&&!receipt)reviewDue++;
  if(stable&&receipt){outcomes++;observed.add(Number(receipt.receipt_id))}
  const status=!stable?'HOLD_713_NINTH_RENEWAL_AUTHORITY_OR_CUSTODY_SOURCE_DRIFT':
   !age.due?'ORIGINAL_NINTH_RENEWAL_UNDER_24H_REVIEW_713':
   !receipt?'ORIGINAL_CUSTODY_ESCALATION_OUTCOME_FOLLOWUP_DUE_713':
   'ORIGINAL_OWNER_CUSTODY_OUTCOME_RECHECKED_EXTERNAL_CONFIRMATION_HOLD_713';
  return {renewal_receipt_id_711:renewalId,
   ninth_reviewer_id:valid?base706.ninth_signer_id:null,
   original_ninth_review_receipt_id:x.review_706_receipt_id||null,
   custody_evidence_receipt_id_712:receipt?.receipt_id||null,
   renewal_horizon:age.status,renewal_age_hours:age.age_hours,
   status,authority_continuity_stable:stable,
   outside_reply_verified:false,books_closed:false};
 });
 invalid+=evidence.filter(y=>!observed.has(Number(y.receipt_id))).length;
 const history=valid&&originals.length<=40&&evidence.length<=40&&invalid===0&&
  prior.invalid_count===0&&prior.renewed_source_drift_count===0;
 return {status:!history?'HOLD_713_ORIGINAL_NINTH_AUTHORITY_OR_CUSTODY_REPLAY':
  !items.length?'HOLD_713_ORIGINAL_NINTH_RENEWAL_REQUIRED':
  reviewDue?'ORIGINAL_CUSTODY_OUTCOME_ESCALATION_FOLLOWUP_DUE_713':
  'ORIGINAL_NINTH_RENEWAL_AUTHORITY_STABLE_OUTSIDE_CLOSURE_HOLD_713',
  campaign_queue_id:history?prior.campaign_queue_id:null,
  history_complete:history,items,outcome_evidence_rechecked:outcomes,
  outstanding_custody_followups:reviewDue,invalid_count:invalid,
  original_ninth_reviewer_id:valid?base706.ninth_signer_id:null,
  independent_external_reply_verified:false,owner_financial_close_verified:false,
  new_independent_signature_generated:false,continuous_monitoring_enabled:false,
  connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'};
}
/* Build 714 revalidates original persisted ninth signer and owner custody evidence.
 * No new signatures, automatic review or independent financial closure. */
export function reviewOriginalCustodyDrift714(a713,a712,ninth,now=Date.now()){
 const valid=a713?.history_complete===true&&a712?.history_complete===true&&
  ninth?.history_complete===true&&ninth?.ninth_signer_configured===true&&
  !!ninth.ninth_signer_id&&a713.original_ninth_reviewer_id===ninth.ninth_signer_id&&
  a713.campaign_queue_id===a712.campaign_queue_id&&
  a713.independent_external_reply_verified===false&&
  a713.owner_financial_close_verified===false,
  source=Array.isArray(a712?.items)?a712.items:[],
  previous=Array.isArray(a713?.items)?a713.items:[],
  items=[],ids=new Set();
 let drift=0,due=0,reviewed=0,critical=0;
 for(const x of previous.slice(0,40)){
  const id=Number(x.renewal_receipt_id_711),
   original=source.find(y=>Number(y.renewal_receipt_id_711)===id),
   age=originalNinthRenewalAge712({attempted_at:original?.original_711_renewal_recorded_at},now),
   matched=valid&&Number.isSafeInteger(id)&&id>0&&!ids.has(id)&&!!original&&
    x.authority_continuity_stable===true&&original.source_stable_712===true&&
    x.original_ninth_review_receipt_id===original.review_706_receipt_id&&
    x.ninth_reviewer_id===ninth.ninth_signer_id&&
    Number(x.custody_evidence_receipt_id_712||0)===
     Number(original.custody_followup_evidence_receipt_id_712||0)&&
    age.age_hours!==null&&!!original.renewal_manifest_sha256_711&&
    !!original.provenance_710_digest_sha256;
  ids.add(id);
  const ageWindow=age.age_hours===null?'INVALID':age.age_hours>=72?'72H':
   age.age_hours>=48?'48H':age.age_hours>=24?'24H':'UNDER_24H',
   evidence=!!original?.custody_followup_evidence_recorded_712;
  if(!matched)drift++;
  else if(age.due&&!evidence){due++;if(age.age_hours>=72)critical++}
  else if(evidence)reviewed++;
  items.push({renewal_receipt_id_711:id,original_ninth_receipt_id:x.original_ninth_review_receipt_id,
   original_custody_receipt_id:x.custody_evidence_receipt_id_712||null,
   age_window:ageWindow,status:!matched?'HOLD_714_NINTH_AUTHORITY_OR_CUSTODY_PROVENANCE_DRIFT':
    age.due&&!evidence?'OWNER_CUSTODY_FOLLOWUP_OVERDUE_'+ageWindow+'_714':
    evidence?'OWNER_CUSTODY_EVIDENCE_REVALIDATED_EXTERNAL_REPLY_HOLD_714':
    'ORIGINAL_NINTH_RENEWAL_REVIEW_NOT_DUE_714',
   signed_source_stable:!!matched,independent_external_reply:false,financial_books_closed:false});
 }
 if(previous.length!==source.length||previous.length>40||
  a713?.invalid_count>0||a712?.invalid_count>0||a712?.renewed_source_drift_count>0)drift++;
 const complete=valid&&drift===0;
 return {status:!complete?'HOLD_714_NINTH_AUTHORITY_DRIFT_OR_HISTORY_INCOMPLETE':
  critical?'ORIGINAL_CUSTODY_ESCALATION_72H_OWNER_FOLLOWUP_REQUIRED_714':
  due?'ORIGINAL_CUSTODY_ESCALATION_FOLLOWUP_DUE_714':
  'ORIGINAL_NINTH_AUTHORITY_REVALIDATED_EXTERNAL_CLOSURE_HOLD_714',
  campaign_queue_id:valid?a713.campaign_queue_id:null,history_complete:complete,
  items,drift_count:drift,followup_due_count:due,followup_72h_count:critical,
  owner_evidence_revalidated_count:reviewed,
  original_ninth_reviewer_id:valid?ninth.ninth_signer_id:null,
  independent_external_reply_verified:false,financial_books_closed:false,
  new_independent_signature:false,continuous_monitoring:false};
}
/* Build 715: source-bound owner custody SLA classification and ninth
 * re-attestation readiness; never a new signature or third-party reply. */
export function assessOriginalCustodySla715(a714,a713,a712,ninth,now=Date.now()){
 const original=Array.isArray(a712?.items)?a712.items:[],
  prior=Array.isArray(a714?.items)?a714.items:[],
  evidence=Array.isArray(a712?.evidence_receipts)?a712.evidence_receipts:[],
  valid=a714?.history_complete===true&&a713?.history_complete===true&&
   a712?.history_complete===true&&ninth?.history_complete===true&&
   ninth?.ninth_signer_configured===true&&!!ninth.ninth_signer_id&&
   a714.original_ninth_reviewer_id===ninth.ninth_signer_id&&
   a713.original_ninth_reviewer_id===ninth.ninth_signer_id&&
   a714.campaign_queue_id===a713.campaign_queue_id&&
   a713.campaign_queue_id===a712.campaign_queue_id,
  seen=new Set(),items=[];
 let invalid=0,ownerDocumented=0,due=0,ready=0;
 for(const x of prior.slice(0,40)){
  const id=Number(x.renewal_receipt_id_711),
   orig=original.find(z=>Number(z.renewal_receipt_id_711)===id),
   age=originalNinthRenewalAge712({attempted_at:orig?.original_711_renewal_recorded_at},now),
   receiptId=Number(orig?.custody_followup_evidence_receipt_id_712||0),
   receipts=evidence.filter(z=>Number(z.original_711_renewal_receipt_id)===id),
   receipt=receipts[0],
   proof=!!receiptId&&receipts.length===1&&Number(receipt?.receipt_id)===receiptId&&
    receipt.verified===true&&x.original_custody_receipt_id===receiptId,
   absent=!receiptId&&receipts.length===0&&
    !orig?.custody_followup_evidence_recorded_712&&
    !x.original_custody_receipt_id,
   source=valid&&Number.isSafeInteger(id)&&id>0&&!seen.has(id)&&!!orig&&
    x.signed_source_stable===true&&age.age_hours!==null&&
    x.original_ninth_receipt_id===orig.review_706_receipt_id&&
    !!orig.retention_manifest_sha256&&!!orig.provenance_710_digest_sha256&&
    !!orig.renewal_manifest_sha256_711&&
    (proof||absent);
  seen.add(id);
  if(!source)invalid++;
  if(source&&proof)ownerDocumented++;
  if(source&&age.due&&!proof)due++;
  const canRequest=source&&proof&&ninth.ninth_signer_configured===true;
  if(canRequest)ready++;
  const sla=age.age_hours===null?'INVALID_TIME':
   age.age_hours>=72?'72H':age.age_hours>=48?'48H':
   age.age_hours>=24?'24H':'NOT_DUE';
  items.push({renewal_receipt_id_711:id,
   original_ninth_receipt_id:x.original_ninth_receipt_id||null,
   original_custody_evidence_receipt_id:receiptId||null,
   age_hours:age.age_hours,sla_window:sla,
   status:!source?'HOLD_715_ORIGINAL_CUSTODY_SLA_OR_NINTH_SOURCE_DRIFT':
    proof?'OWNER_CUSTODY_FOLLOWUP_RECEIPT_RECHECKED_EXTERNAL_OUTCOME_UNVERIFIED_715':
    age.due?'ORIGINAL_CUSTODY_OWNER_SLA_FOLLOWUP_DUE_'+sla+'_715':
    'ORIGINAL_CUSTODY_OWNER_FOLLOWUP_NOT_DUE_715',
   owner_followup_evidence_verified:!!(source&&proof),
   independent_external_outcome_verified:false,
   ninth_re_attestation_readiness:canRequest?
    'READY_TO_REQUEST_FRESH_INDEPENDENT_NINTH_SIGNED_SOURCE_715':
    'HOLD_715_NEW_NINTH_RE_ATTESTATION_SOURCE_REQUIRED',
   new_independent_signature_obtained:false,financial_bookkeeping_closed:false});
 }
 if(prior.length!==original.length||prior.length>40||evidence.length>40||
  a714?.drift_count>0||a713?.invalid_count>0||a712?.invalid_count>0)invalid++;
 const complete=valid&&invalid===0;
 return {status:!complete?'HOLD_715_CUSTODY_SLA_OR_NINTH_SOURCE_INVALID':
  !items.length?'HOLD_715_ORIGINAL_NINTH_SOURCE_REQUIRED':
  due?'ORIGINAL_CUSTODY_OWNER_SLA_FOLLOWUP_REQUIRED_EXTERNAL_OUTCOME_HOLD_715':
  'ORIGINAL_OWNER_CUSTODY_EVIDENCE_RECHECKED_NINTH_SOURCE_REQUEST_ONLY_715',
  campaign_queue_id:complete?a714.campaign_queue_id:null,
  history_complete:complete,items,invalid_count:invalid,
  original_ninth_reviewer_id:complete?ninth.ninth_signer_id:null,
  original_owner_evidence_verified_count:ownerDocumented,
  original_owner_followup_due_count:due,
  source_reattest_request_ready_count:ready,
  independently_signed_new_source_available:false,
  external_sla_outcome_confirmed:false,books_closed:false,
  independent_phone_witness:false,background_monitoring:false};
}
/* Build 716 — independently signed, original-source-pinned ninth review intake.
 * The signing key is never accepted or generated on the owner server. */
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
const time716=x=>Date.parse(String(x||'').replace(
 /^([0-9]{4}-[0-9]{2}-[0-9]{2}) ([0-9]{2}:[0-9]{2}:[0-9]{2})$/,'$1T$2Z'));
export async function assessIndependentNinthIntake716(a715,a712,current,signerId,signerKey,rawRows=[],now=Date.now()){
 const eligible=Array.isArray(a715?.items)?a715.items:[],
  originals=Array.isArray(a712?.items)?a712.items:[],
  valid=a715?.history_complete===true&&a712?.history_complete===true&&
   a715.campaign_queue_id===a712.campaign_queue_id&&
   current?.master_fresh===true&&current?.history_complete===true&&
   current.queue_id===a715.campaign_queue_id&&
   Array.isArray(current.open_cases)&&current.open_cases.length===0&&
   !!signerId&&!!signerKey&&a715.original_ninth_reviewer_id===signerId;
 let invalid=0,verified=0;
 const rows=Array.isArray(rawRows)?rawRows:[],seen=new Set(),receipts=[];
 for(const row of rows.slice(0,40)){
  const data=safeJson(row.response_json,{}),c=data.claim||{},
   id=Number(row.social_post_attempt_id),renewal=Number(c.original_711_renewal_receipt_id),
   original=originals.find(x=>Number(x.renewal_receipt_id_711)===renewal),
   item=eligible.find(x=>Number(x.renewal_receipt_id_711)===renewal),
   at=time716(row.attempted_at),issued=time716(c.issued_at),
   signature=String(data.signature||''),
   allowDisposition=['reconfirm_original_ninth_source_under_hold',
    'independent_custody_exception_requires_followup'].includes(c.disposition),
   canonical=claimIndependentNinth716(c),
   shape=Object.keys(c).length===Object.keys(canonical).length&&
    Object.keys(c).every(k=>Object.hasOwn(canonical,k))&&
    Object.keys(canonical).every(k=>c[k]===canonical[k]);
  const gate=valid&&!!original&&!!item&&item.owner_followup_evidence_verified===true&&
   Number.isSafeInteger(id)&&id>Number(item.original_custody_evidence_receipt_id)&&
   Number.isSafeInteger(renewal)&&renewal>0&&!seen.has(renewal)&&
   row.attempt_status==='independent_ninth_source_signed_intake_716'&&
   c.queue_id===current.queue_id&&
   c.original_706_review_receipt_id===original.review_706_receipt_id&&
   c.original_712_owner_custody_receipt_id===item.original_custody_evidence_receipt_id&&
   c.original_710_provenance_sha256===original.provenance_710_digest_sha256&&
   c.original_711_renewal_sha256===original.renewal_manifest_sha256_711&&
   c.source_revision===current.source_revision&&
   c.fingerprint_sha256===current.fingerprint_sha256&&
   c.independent_reviewer_id===signerId&&c.purpose===canonical.purpose&&c.v===1&&
   allowDisposition&&shape&&nonce684(c.nonce)&&
   Number.isFinite(at)&&Number.isFinite(issued)&&
   at>=issued&&at-issued<=86400000&&at<=now+300000&&issued<=now+300000&&
   at>=time716(original.original_711_renewal_recorded_at)&&
   data.owner_reviewed_original_source===true&&
   Number.isSafeInteger(Number(data.owner_user_id))&&Number(data.owner_user_id)>0&&
   data.financial_books_closed===false&&data.external_sla_closed===false&&
   data.new_signature_generated_by_owner===false;
  const ok=!!gate&&await verify684(signerKey,canonical,signature);
  if(!ok)invalid++;else verified++;
  seen.add(renewal);
  receipts.push({receipt_id:id,original_711_renewal_receipt_id:renewal,
   signed_issued_at:c.issued_at,received_at:row.attempted_at,
   original_712_owner_custody_receipt_id:Number(c.original_712_owner_custody_receipt_id||0),
   independent_signature_verified:!!ok,
   status:ok?'FRESH_INDEPENDENT_NINTH_SOURCE_REATTESTED_BOOKS_HOLD_716':
     'HOLD_716_NINTH_SIGNATURE_SOURCE_OR_REPLAY_INVALID',
   external_sla_closed:false,financial_books_closed:false});
 }
 if(rows.length>40)invalid++;
 return {status:!valid||invalid?'HOLD_716_INDEPENDENT_NINTH_SOURCE_OR_HISTORY_INVALID':
   verified?'ORIGINAL_INDEPENDENT_NINTH_SIGNED_SOURCE_VERIFIED_BOOKS_HOLD_716':
   'HOLD_716_FRESH_INDEPENDENT_NINTH_SIGNED_EVIDENCE_REQUIRED',
  campaign_queue_id:valid?current.queue_id:null,
  history_complete:!!valid&&invalid===0,
  original_custody_sla_due_count:a715?.original_owner_followup_due_count||0,
  original_owner_evidence_count:a715?.original_owner_evidence_verified_count||0,
  source_reattest_request_ready_count:a715?.source_reattest_request_ready_count||0,
  signed_evidence_verified_count:verified,invalid_count:invalid,
  original_ninth_reviewer_id:valid?signerId:null,
  receipts,independent_external_sla_closure_verified:false,
  financial_books_closed:false,automatic_escalation:false,background_watcher:false};
}
/* Build 717: original 716 signatures are reverified through finance716 each
 * time. External SLA evidence must use a distinct independently controlled key. */
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
export async function assessExternalCustodySla717(a716,a715,a712,current,
 verifierId,verifierKey,ninthId,ninthKey,rawRows=[],now=Date.now()){
 const old=Array.isArray(a716?.receipts)?a716.receipts:[],
  owner=Array.isArray(a715?.items)?a715.items:[],
  original=Array.isArray(a712?.items)?a712.items:[],
  rows=Array.isArray(rawRows)?rawRows:[],
  valid=a716?.history_complete===true&&a716.invalid_count===0&&
   a715?.history_complete===true&&a712?.history_complete===true&&
   current?.master_fresh===true&&current?.history_complete===true&&
   Array.isArray(current?.open_cases)&&current.open_cases.length===0&&
   current.queue_id===a716.campaign_queue_id&&
   a715.campaign_queue_id===current.queue_id&&a712.campaign_queue_id===current.queue_id,
  independent=!!verifierId&&!!verifierKey&&!!ninthId&&!!ninthKey&&
   verifierId!==ninthId&&verifierKey!==ninthKey&&
   verifierKey.length>=40&&ninthKey.length>=40;
 let invalid=0,verified=0,prevId=Infinity,prevAt=Infinity,continuity=0,renewalDue=0;
 const seen=new Set(),receipts=[];
 for(const rec of old){
  const id=Number(rec.original_711_renewal_receipt_id),
   owned=owner.find(x=>Number(x.renewal_receipt_id_711)===id),
   src=original.find(x=>Number(x.renewal_receipt_id_711)===id);
  if(!rec.independent_signature_verified||
   !Number.isSafeInteger(Number(rec.receipt_id))||
   Number(rec.receipt_id)<=Number(rec.original_712_owner_custody_receipt_id)||
   !owned?.owner_followup_evidence_verified||!src||
   owned.original_custody_evidence_receipt_id!==rec.original_712_owner_custody_receipt_id||
   owned.original_ninth_receipt_id!==src.review_706_receipt_id||seen.has(id))
   invalid++;
  else continuity++;
  const signedAt=time716(rec.received_at);
  if(!Number.isFinite(signedAt)||signedAt>now+300000)invalid++;
  else if(now-signedAt>=72*3600000)renewalDue++;
  seen.add(id);
 }
 seen.clear();
 for(const row of rows.slice(0,40)){
  const d=safeJson(row.response_json,{}),c=d.claim||{},
   canonical=claimExternalCustodySla717(c),
   shape=Object.keys(c).length===Object.keys(canonical).length&&
    Object.keys(c).every(k=>Object.hasOwn(canonical,k))&&
    Object.keys(canonical).every(k=>c[k]===canonical[k]),
   rid=Number(c.original_711_renewal_receipt_id),
   signerReceipt=old.find(x=>Number(x.original_711_renewal_receipt_id)===rid&&
    Number(x.receipt_id)===Number(c.original_716_independent_ninth_receipt_id)),
   owned=owner.find(x=>Number(x.renewal_receipt_id_711)===rid),
   src=original.find(x=>Number(x.renewal_receipt_id_711)===rid),
   id=Number(row.social_post_attempt_id),at=time716(row.attempted_at),
   issued=time716(c.issued_at);
  const gate=valid&&independent&&!invalid&&!!signerReceipt&&
   signerReceipt.independent_signature_verified===true&&!!owned&&!!src&&
   owned.owner_followup_evidence_verified===true&&
   c.queue_id===current.queue_id&&
   c.original_706_ninth_review_receipt_id===src.review_706_receipt_id&&
   c.original_712_owner_custody_receipt_id===owned.original_custody_evidence_receipt_id&&
   c.original_710_provenance_sha256===src.provenance_710_digest_sha256&&
   c.original_711_renewal_sha256===src.renewal_manifest_sha256_711&&
   c.source_revision===current.source_revision&&
   c.fingerprint_sha256===current.fingerprint_sha256&&
   c.external_verifier_id===verifierId&&c.v===1&&
   c.purpose===canonical.purpose&&shape&&nonce684(c.nonce)&&
   ['confirm_independent_manual_custody_sla_followup',
    'independent_custody_sla_exception_unresolved'].includes(c.disposition)&&
   Number.isSafeInteger(id)&&id>Number(signerReceipt.receipt_id)&&
   id<prevId&&!seen.has(rid)&&
   row.attempt_status==='independent_external_custody_sla_ack_717'&&
   Number.isFinite(issued)&&Number.isFinite(at)&&
   issued<=at&&at-issued<=86400000&&at<=now+300000&&
   Number.isFinite(time716(signerReceipt.received_at))&&
   issued>=time716(signerReceipt.received_at)&&
   at<=prevAt&&issued>=time716(src.original_711_renewal_recorded_at)&&
   d.owner_reviewed_original_source===true&&
   Number.isSafeInteger(Number(d.owner_user_id))&&Number(d.owner_user_id)>0&&
   d.financial_books_closed===false&&d.provider_posting_closed===false&&
   d.auto_escalation_sent===false;
  const ok=!!gate&&await verify684(verifierKey,canonical,d.signature);
  if(ok)verified++;else invalid++;
  seen.add(rid);prevId=id;prevAt=Number.isFinite(at)?at:-Infinity;
  receipts.push({receipt_id:id,original_711_renewal_receipt_id:rid,
   original_716_ninth_receipt_id:Number(c.original_716_independent_ninth_receipt_id||0),
   independent_external_signature_verified:!!ok,
   custody_sla_followup_attested:!!ok&&c.disposition==='confirm_independent_manual_custody_sla_followup',
   status:!ok?'HOLD_717_OUTSIDE_SLA_SIGNATURE_OR_SOURCE_INVALID':
    c.disposition==='confirm_independent_manual_custody_sla_followup'?
    'SIGNED_OUTSIDE_CUSTODY_SLA_FOLLOWUP_CONFIRMED_BOOKS_HOLD_717':
    'SIGNED_OUTSIDE_CUSTODY_SLA_EXCEPTION_UNRESOLVED_BOOKS_HOLD_717',
   books_closed:false,provider_posting_closed:false});
 }
 if(rows.length>40||old.length>40)invalid++;
 return {status:!valid||invalid?'HOLD_717_ORIGINAL_SIGNED_SOURCE_CONTINUITY_OR_EXTERNAL_SLA_INVALID':
   !independent?'HOLD_717_DISTINCT_EXTERNAL_SLA_VERIFIER_NOT_CONFIGURED':
   verified?'ORIGINAL_EXTERNAL_SIGNED_CUSTODY_SLA_EVIDENCE_READBACK_BOOKS_HOLD_717':
   'HOLD_717_EXTERNAL_SLA_SIGNED_SOURCE_REQUIRED',
  campaign_queue_id:valid?current.queue_id:null,history_complete:!!valid&&invalid===0,
  independent_external_verifier_configured:!!independent,
  original_ninth_signature_continuity_count:continuity,
  original_ninth_signatures_checked:old.length,
  original_ninth_signed_72h_renewal_due_count:renewalDue,
  signed_external_receipt_verified_count:verified,invalid_count:invalid,
  original_owner_followups_due:a715?.original_owner_followup_due_count||0,
  receipts,independently_attested_sla_followup_count:receipts.filter(x=>x.custody_sla_followup_attested).length,
  actual_bookkeeping_closed:false,provider_posting_closed:false,
  automatic_external_contact:false,continuous_monitoring:false};
}
async function finance717(db,env,id){
 const n=Number(id);
 if(!Number.isSafeInteger(n)||n<1)
  return assessExternalCustodySla717(null,null,null,null,'','','','',[]);
 const [a716,a715,a712,current,ninth]=await Promise.all([
  finance716(db,env,n),finance715(db,env,n),finance712(db,env,n),
  financial685(db,env,n),finance706(db,env,n)]);
 const outside=rows(await db.prepare(
  "SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_external_sla_intake_717' ORDER BY social_post_attempt_id DESC LIMIT 41").bind(n).all());
 const id717=normalizeText(env?.FINANCIAL_CUSTODY_SLA_EXTERNAL_VERIFIER_ID_717),
  key717=normalizeText(env?.FINANCIAL_CUSTODY_SLA_EXTERNAL_PUBLIC_KEY_717),
  ninthKey=normalizeText(env?.FINANCIAL_CONTINUITY_REVIEWER_PUBLIC_KEY_706);
 const audit=await assessExternalCustodySla717(a716,a715,a712,current,
  id717,key717,ninth.ninth_signer_id,ninthKey,outside);
 const templates=audit.history_complete&&audit.independent_external_verifier_configured?
  (a716.receipts||[]).filter(x=>x.independent_signature_verified&&
   !audit.receipts.some(y=>y.original_711_renewal_receipt_id===x.original_711_renewal_receipt_id))
   .slice(0,40).flatMap(x=>{
    const original=a712.items?.find(z=>z.renewal_receipt_id_711===x.original_711_renewal_receipt_id);
    if(!original)return [];
    return [claimExternalCustodySla717({
     queue_id:n,original_706_ninth_review_receipt_id:original.review_706_receipt_id,
     original_711_renewal_receipt_id:x.original_711_renewal_receipt_id,
     original_712_owner_custody_receipt_id:x.original_712_owner_custody_receipt_id,
     original_716_independent_ninth_receipt_id:x.receipt_id,
     original_710_provenance_sha256:original.provenance_710_digest_sha256,
     original_711_renewal_sha256:original.renewal_manifest_sha256_711,
     source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
     external_verifier_id:id717,disposition:'independent_custody_sla_exception_unresolved',
     nonce:crypto.randomUUID(),issued_at:new Date().toISOString()
    })];
   }):[];
 return {...audit,unsigned_external_sla_claim_templates:templates,
  owner_controls_no_external_private_key:true};
}
async function intakeExternalCustodySla717(db,env,user,p){
 const n=Number(p.social_post_queue_id),
  [a716,a715,a712,current,prior,ninth]=await Promise.all([
   finance716(db,env,n),finance715(db,env,n),finance712(db,env,n),
   financial685(db,env,n),finance717(db,env,n),finance706(db,env,n)]);
 let envelope;
 try{
  if(typeof p.signed_evidence_json!=='string'||p.signed_evidence_json.length>4096)
   throw Error('Independent signed external SLA response missing.');
  envelope=JSON.parse(p.signed_evidence_json);
 }catch{throw Error('Invalid original external signed SLA JSON. HOLD.')}
 const c=envelope?.claim||{},renewal=Number(c.original_711_renewal_receipt_id),
  source=a712.items?.find(x=>x.renewal_receipt_id_711===renewal),
  owner=a715.items?.find(x=>x.renewal_receipt_id_711===renewal),
  ninthReceipt=a716.receipts?.find(x=>x.original_711_renewal_receipt_id===renewal&&
   x.receipt_id===Number(c.original_716_independent_ninth_receipt_id)&&
   x.independent_signature_verified),
  canonical=claimExternalCustodySla717(c),
  shape=Object.keys(c).length===Object.keys(canonical).length&&
   Object.keys(c).every(k=>Object.hasOwn(canonical,k))&&
   Object.keys(canonical).every(k=>c[k]===canonical[k]),
  signerId=normalizeText(env?.FINANCIAL_CUSTODY_SLA_EXTERNAL_VERIFIER_ID_717),
  signerKey=normalizeText(env?.FINANCIAL_CUSTODY_SLA_EXTERNAL_PUBLIC_KEY_717),
  ninthKey=normalizeText(env?.FINANCIAL_CONTINUITY_REVIEWER_PUBLIC_KEY_706);
 if(!Number.isSafeInteger(n)||n<1||!current.master_fresh||
  !current.history_complete||current.open_cases?.length||
  !a716.history_complete||!a715.history_complete||!a712.history_complete||
  !prior.history_complete||prior.invalid_count||!ninth.history_complete||
  !prior.independent_external_verifier_configured||
  !source||!owner?.owner_followup_evidence_verified||!ninthReceipt||
  prior.receipts.some(x=>x.original_711_renewal_receipt_id===renewal)||
  p.owner_reviewed_original_source!==true||
  p.expected_source_revision!==current.source_revision||
  p.expected_fingerprint_sha256!==current.fingerprint_sha256||
  signerId===ninth.ninth_signer_id||signerKey===ninthKey||
  c.queue_id!==n||c.original_706_ninth_review_receipt_id!==source.review_706_receipt_id||
  c.original_712_owner_custody_receipt_id!==owner.original_custody_evidence_receipt_id||
  c.original_710_provenance_sha256!==source.provenance_710_digest_sha256||
  c.original_711_renewal_sha256!==source.renewal_manifest_sha256_711||
  c.source_revision!==current.source_revision||
  c.fingerprint_sha256!==current.fingerprint_sha256||
  c.external_verifier_id!==signerId||c.v!==1||c.purpose!==canonical.purpose||
  !shape||!nonce684(c.nonce)||!fresh684(c.issued_at,86400000)||
  !['confirm_independent_manual_custody_sla_followup',
   'independent_custody_sla_exception_unresolved'].includes(c.disposition))
  throw Error('Original ninth signer continuity, independent outside authority or custody SLA evidence missing. HOLD.');
 if(!await verify684(signerKey,canonical,envelope.signature))
  throw Error('Independent external SLA Ed25519 signature invalid or not from enrolled outside signer. HOLD.');
 const fresh=await financial685(db,env,n);
 if(!fresh.master_fresh||!fresh.history_complete||fresh.open_cases?.length||
  fresh.source_revision!==current.source_revision||
  fresh.fingerprint_sha256!==current.fingerprint_sha256)
  throw Error('Original Master source changed during independent SLA confirmation. HOLD.');
 const data={claim:canonical,signature:envelope.signature,
  owner_user_id:user.user_id,owner_reviewed_original_source:true,
  financial_books_closed:false,provider_posting_closed:false,auto_escalation_sent:false};
 const receipt=await append684(db,user,n,'finance_external_sla_intake_717',
  'independent_external_custody_sla_ack_717',
  'finance717-external-'+n+'-'+renewal,data);
 const after=await finance717(db,env,n);
 if(!after.history_complete||!after.receipts.some(x=>
  x.receipt_id===receipt&&x.independent_external_signature_verified))
  throw Error('Independent external SLA signed D1 source readback invalid. HOLD.');
 return {status:'INDEPENDENT_EXTERNAL_CUSTODY_SLA_SOURCE_SIGNED_BOOKS_HOLD_717',
  receipt_id:receipt,independent_external_signature_verified:true,
  actual_bookkeeping_closed:false,provider_posting_closed:false};
}

async function finance716(db,env,id){
 const n=Number(id);
 if(!Number.isSafeInteger(n)||n<1)
  return assessIndependentNinthIntake716(null,null,null,'','',[]);
 const a715=await finance715(db,env,n),a712=await finance712(db,env,n),
  current=await financial685(db,env,n),ninth=await finance706(db,env,n);
 const source=rows(await db.prepare(
  "SELECT social_post_attempt_id,attempt_status,response_json,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key='finance_ninth_signed_intake_716' ORDER BY social_post_attempt_id DESC LIMIT 41").bind(n).all());
 const audit=await assessIndependentNinthIntake716(a715,a712,current,ninth.ninth_signer_id,
  normalizeText(env?.FINANCIAL_CONTINUITY_REVIEWER_PUBLIC_KEY_706),source);
 const unsigned_requests=audit.history_complete?(a715.items||[]).filter(item=>
  item.owner_followup_evidence_verified===true&&
  item.ninth_re_attestation_readiness?.startsWith('READY_TO_REQUEST')&&
  !audit.receipts.some(x=>x.original_711_renewal_receipt_id===item.renewal_receipt_id_711))
  .slice(0,40).flatMap(item=>{
   const original=(a712.items||[]).find(x=>
    x.renewal_receipt_id_711===item.renewal_receipt_id_711);
   if(!original||!item.original_custody_evidence_receipt_id)return [];
   return [claimIndependentNinth716({
    queue_id:n,original_706_review_receipt_id:original.review_706_receipt_id,
    original_711_renewal_receipt_id:item.renewal_receipt_id_711,
    original_712_owner_custody_receipt_id:item.original_custody_evidence_receipt_id,
    original_710_provenance_sha256:original.provenance_710_digest_sha256,
    original_711_renewal_sha256:original.renewal_manifest_sha256_711,
    source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
    independent_reviewer_id:ninth.ninth_signer_id,
    disposition:'reconfirm_original_ninth_source_under_hold',
    nonce:crypto.randomUUID(),issued_at:new Date().toISOString()
   })];
  }):[];
 return {...audit,unsigned_reviewer_claim_templates:unsigned_requests,
  template_is_unsigned:true,no_private_signing_key_held:true};
}
async function intakeIndependentNinth716(db,env,user,p){
 const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
  a715=await finance715(db,env,n),a712=await finance712(db,env,n),
  ninth=await finance706(db,env,n),existing=await finance716(db,env,n),
  revision=normalizeText(p.expected_source_revision),
  fingerprint=normalizeText(p.expected_fingerprint_sha256);
 let evidence={};
 try{
  if(typeof p.signed_evidence_json!=='string'||p.signed_evidence_json.length>4096)
   throw Error('Signed evidence too long or absent.');
  evidence=JSON.parse(p.signed_evidence_json);
 }catch{throw Error('Original independent signed JSON evidence missing or malformed. HOLD.')}
 const c=evidence?.claim||{},signature=evidence?.signature,
  renewalId=Number(c.original_711_renewal_receipt_id),
  item=a715.items?.find(x=>x.renewal_receipt_id_711===renewalId),
  original=a712.items?.find(x=>x.renewal_receipt_id_711===renewalId),
  canonical=claimIndependentNinth716(c),
  shape=Object.keys(c).length===Object.keys(canonical).length&&
   Object.keys(c).every(k=>Object.hasOwn(canonical,k))&&
   Object.keys(canonical).every(k=>c[k]===canonical[k]);
 if(!Number.isSafeInteger(n)||n<1||!current.master_fresh||!current.history_complete||
  current.open_cases?.length||!a715.history_complete||!a712.history_complete||
  !existing.history_complete||existing.invalid_count||!ninth.history_complete||
  !ninth.ninth_signer_configured||!ninth.ninth_signer_id||
  !item||!original||!item.owner_followup_evidence_verified||
  !item.ninth_re_attestation_readiness?.startsWith('READY_TO_REQUEST')||
  p.owner_reviewed_original_source!==true||
  revision!==current.source_revision||fingerprint!==current.fingerprint_sha256||
  c.queue_id!==n||c.original_706_review_receipt_id!==original.review_706_receipt_id||
  c.original_711_renewal_receipt_id!==renewalId||
  c.original_712_owner_custody_receipt_id!==item.original_custody_evidence_receipt_id||
  c.original_710_provenance_sha256!==original.provenance_710_digest_sha256||
  c.original_711_renewal_sha256!==original.renewal_manifest_sha256_711||
  c.source_revision!==current.source_revision||
  c.fingerprint_sha256!==current.fingerprint_sha256||
  c.independent_reviewer_id!==ninth.ninth_signer_id||
  c.purpose!==canonical.purpose||c.v!==1||!shape||
  !['reconfirm_original_ninth_source_under_hold',
    'independent_custody_exception_requires_followup'].includes(c.disposition)||
  !nonce684(c.nonce)||!fresh684(c.issued_at,86400000)||
  existing.receipts.some(x=>x.original_711_renewal_receipt_id===renewalId))
  throw Error('Original owner SLA, source signer, fresh independent evidence or one-time claim mismatch. HOLD.');
 const publicKey=normalizeText(env?.FINANCIAL_CONTINUITY_REVIEWER_PUBLIC_KEY_706);
 if(!await verify684(publicKey,canonical,signature))
  throw Error('Independent ninth Ed25519 signature invalid or not from enrolled reviewer. HOLD.');
 const fresh=await financial685(db,env,n);
 if(!fresh.master_fresh||!fresh.history_complete||fresh.open_cases?.length||
  fresh.source_revision!==current.source_revision||
  fresh.fingerprint_sha256!==current.fingerprint_sha256)
  throw Error('Original financial source changed during signed intake. HOLD.');
 const data={claim:canonical,signature,owner_user_id:user.user_id,
  owner_reviewed_original_source:true,
  independent_signature_cryptographically_verified:true,
  financial_books_closed:false,external_sla_closed:false,
  new_signature_generated_by_owner:false};
 const receipt=await append684(db,user,n,'finance_ninth_signed_intake_716',
  'independent_ninth_source_signed_intake_716',
  'finance716-ninth-'+n+'-'+renewalId,data);
 const after=await finance716(db,env,n);
 if(!after.history_complete||
  !after.receipts.some(x=>x.receipt_id===receipt&&x.independent_signature_verified))
  throw Error('Original independent ninth D1 receipt did not pass on-demand source signature readback. HOLD.');
 return {status:'INDEPENDENT_NINTH_SIGNED_SOURCE_INTAKE_VERIFIED_BOOKS_HOLD_716',
  receipt_id:receipt,independent_signature_verified:true,
  external_sla_closed:false,financial_books_closed:false,automatic_escalation:false};
}

async function finance715(db,env,id){
 const n=Number(id);
 if(!Number.isSafeInteger(n)||n<1)return assessOriginalCustodySla715(null,null,null,null);
 const a714=await finance714(db,env,n),a713=await finance713(db,env,n),
  a712=await finance712(db,env,n),ninth=await finance706(db,env,n);
 return assessOriginalCustodySla715(a714,a713,a712,ninth);
}

async function finance714(db,env,id){
 const n=Number(id);
 if(!Number.isSafeInteger(n)||n<1)return reviewOriginalCustodyDrift714(null,null,null);
 const a713=await finance713(db,env,n),a712=await finance712(db,env,n),
  ninth=await finance706(db,env,n);
 return reviewOriginalCustodyDrift714(a713,a712,ninth);
}

async function finance713(db,env,id){
 const n=Number(id);
 if(!Number.isSafeInteger(n)||n<1)return assessFinance713(null,null);
 const prior=await finance712(db,env,n),base=await finance706(db,env,n);
 return assessFinance713(prior,base);
}

async function ownerCustodyEvidence712(db,env,user,p){
 const n=Number(p.social_post_queue_id),current=await financial685(db,env,n),
  base=await finance706(db,env,n),report=await finance712(db,env,n),
  renewalId=Number(p.original_711_renewal_receipt_id),
  x=report.items?.find(y=>y.renewal_receipt_id_711===renewalId&&
   y.source_stable_712&&y.renewal_horizon_712?.due&&
   !y.custody_followup_evidence_recorded_712),
  note=normalizeText(p.resolution_note),
  disposition=String(p.manual_evidence_disposition||''),
  reference=normalizeText(p.manual_evidence_reference);
 if(!current.queue_id||!base.history_complete||!report.history_complete||!x||
  p.owner_reviewed_original_source!==true||note.length<25||note.length>600||
  reference.length<8||reference.length>160||
  !['owner_documented_custody_source_review_pending',
    'manual_reviewer_followup_requested_unconfirmed',
    'original_custody_repair_still_pending'].includes(disposition)||
  p.expected_source_revision!==current.source_revision||
  p.expected_fingerprint_sha256!==current.fingerprint_sha256||
  p.expected_706_manifest_sha256!==x.retention_manifest_sha256||
  p.expected_710_provenance_sha256!==x.provenance_710_digest_sha256||
  p.expected_711_renewal_sha256!==x.renewal_manifest_sha256_711)
  throw Error('24h aged original 711 ninth renewal, exact signed source and owner-reported custody evidence required. HOLD.');
 const fresh=await financial685(db,env,n);
 if(!fresh.master_fresh||!fresh.history_complete||fresh.open_cases?.length||
  fresh.source_revision!==current.source_revision||
  fresh.fingerprint_sha256!==current.fingerprint_sha256)
  throw Error('Original independent Master or source changed during Build 712 follow-up. HOLD.');
 const age=originalNinthRenewalAge712({attempted_at:x.original_711_renewal_recorded_at});
 if(!age.due)throw Error('Original ninth renewal was not at least 24h old. HOLD.');
 const data={queue_id:n,original_711_renewal_receipt_id:renewalId,
  original_711_outcome_receipt_id:x.outcome_receipt_id_711,
  original_710_followup_receipt_id:x.followup_710_receipt_id,
  original_710_provenance_receipt_id:x.provenance_710_receipt_id,
  original_ninth_review_receipt_id:x.review_706_receipt_id,
  original_706_manifest_sha256:x.retention_manifest_sha256,
  original_708_custody_digest_sha256:x.custody_708_digest_sha256||null,
  original_710_provenance_sha256:x.provenance_710_digest_sha256,
  original_711_renewal_sha256:x.renewal_manifest_sha256_711,
  ninth_reviewer_id:base.ninth_signer_id,
  source_revision:current.source_revision,fingerprint_sha256:current.fingerprint_sha256,
  observed_original_renewal_age_hours:age.age_hours,
  observed_original_renewal_age_status:age.status,
  manual_evidence_disposition:disposition,manual_evidence_reference:reference,
  owner_reviewed_original_source:true,owner_user_id:user.user_id,resolution_note:note,
  independent_reviewer_response_confirmed:false,
  external_financial_source_verified:false,new_independent_signature_obtained:false,
  financial_certified:false,bookkeeping_closed:false};
 const receipt=await append684(db,user,n,'finance_custody_evidence_712',
  'owner_custody_followup_evidence_712','finance712-evidence-'+n+'-'+renewalId,data);
 const after=await finance712(db,env,n);
 if(!after.evidence_receipts.some(y=>y.receipt_id===receipt&&y.verified))
  throw Error('Original source-pinned owner follow-up evidence failed protected D1 readback. HOLD.');
 return {status:'OWNER_SOURCE_BOUND_CUSTODY_FOLLOWUP_EVIDENCE_RECORDED_BOOKS_HOLD_712',
  receipt_id:receipt,independent_reviewer_response_confirmed:false,
  bookkeeping_closed:false,new_independent_signature_generated:false};
}

export async function onRequestGet(context){
const adminUser=await getAdminUserFromRequest(context.request,context.env);
if (!adminUser) return jsonResponse({ ok:false,error:'Admin access required.'},401);
const db=getDb(context.env);
if (!db) return jsonResponse({ ok:false,error:'Database binding is not configured.'},500);
try{
const params=new URL(context.request.url).searchParams;
if(params.get('audit')==='financial717'||params.get('export')==='financial717'){
 const n=Number(params.get('campaign_queue_id'));
 if(!Number.isSafeInteger(n)||n<1)
  return jsonResponse({ok:false,error:'Exact protected original campaign required.'},
   400,{'Cache-Control':'no-store'});
 const report=await finance717(db,context.env,n),exporting=params.get('export')==='financial717';
 return new Response(JSON.stringify({financial717:report,actual_financial_close:false,
  no_automated_external_escalation:true},null,exporting?2:0),
 {status:200,headers:{'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',
  ...(exporting?{'Content-Disposition':
  'attachment; filename="devilndove-external-custody-sla-717-'+n+'.json"'}:{})}});
}
if(params.get('audit')==='financial716'||params.get('export')==='financial716'){
 const n=Number(params.get('campaign_queue_id'));
 if(!Number.isSafeInteger(n)||n<1)
  return jsonResponse({ok:false,error:'Exact authenticated original campaign required.'},
   400,{'Cache-Control':'no-store'});
 const report=await finance716(db,context.env,n),
  exporting=params.get('export')==='financial716';
 return new Response(JSON.stringify({financial716:report,
  original_external_sla_closure_verified:false,financial_books_closed:false},null,exporting?2:0),
 {status:200,headers:{'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',
  ...(exporting?{'Content-Disposition':
  'attachment; filename="devilndove-independent-ninth-source-716-'+n+'.json"'}:{})}});
}
if(params.get('audit')==='financial715'||params.get('export')==='financial715'){
 const n=Number(params.get('campaign_queue_id'));
 if(!Number.isSafeInteger(n)||n<1)
  return jsonResponse({ok:false,error:'Exact authenticated original campaign required.'},
   400,{'Cache-Control':'no-store'});
 const report=await finance715(db,context.env,n),
  exporting=params.get('export')==='financial715';
 return new Response(JSON.stringify({financial715:report,
  independent_outside_response_verified:false,new_ninth_signature_generated:false,
  actual_financial_close:false},null,exporting?2:0),
  {status:200,headers:{'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',
  ...(exporting?{'Content-Disposition':
  'attachment; filename="devilndove-original-custody-sla-ninth-readiness-715-'+n+'.json"'}:{})}});
}
if(params.get('audit')==='financial714'||params.get('export')==='financial714'){
 const n=Number(params.get('campaign_queue_id'));
 if(!Number.isSafeInteger(n)||n<1)
  return jsonResponse({ok:false,error:'Original authenticated campaign required.'},400,{'Cache-Control':'no-store'});
 const report=await finance714(db,context.env,n);
 const exporting=params.get('export')==='financial714';
 return new Response(JSON.stringify({financial714:report,independent_reviewer_reply:false,
  actual_financial_closure:false},null,exporting?2:0),
  {status:200,headers:{'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',
  ...(exporting?{'Content-Disposition':
  'attachment; filename="devilndove-ninth-custody-trend-714-'+n+'.json"'}:{})}});
}
if(params.get('export')==='financial713'){
 const n=Number(params.get('campaign_queue_id'));
 if(!Number.isSafeInteger(n)||n<1)
  return jsonResponse({ok:false,error:'Exact authenticated original financial campaign required.'},400,{'Cache-Control':'no-store'});
 const report=await finance713(db,context.env,n);
 return new Response(JSON.stringify({report_type:'ORIGINAL_MULTI_HORIZON_CUSTODY_OUTCOME_NINTH_AUTHORITY_713',
  report,external_reviewer_reply_verified:false,financial_books_closed:false},null,2),
  {status:200,headers:{'Content-Type':'application/json; charset=utf-8',
  'Content-Disposition':'attachment; filename="devilndove-custody-ninth-authority-713-'+n+'.json"',
  'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial712'){
 const n=Number(params.get('campaign_queue_id'));
 if(!Number.isSafeInteger(n)||n<1)
  return jsonResponse({ok:false,error:'Exact authenticated owner campaign required.'},400,{'Cache-Control':'no-store'});
 const report=await finance712(db,context.env,n);
 return new Response(JSON.stringify({report_type:'ORIGINAL_NINTH_RENEWAL_HORIZON_DRIFT_AND_CUSTODY_EVIDENCE_712',
  report,independent_reviewer_reply_verified:false,financial_books_closed:false},null,2),
  {status:200,headers:{'Content-Type':'application/json; charset=utf-8',
   'Content-Disposition':'attachment; filename="devilndove-ninth-horizon-custody-712-'+n+'.json"',
   'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial711'){
 const n=Number(params.get('campaign_queue_id'));
 if(!Number.isSafeInteger(n)||n<1)
  return jsonResponse({ok:false,error:'Exact protected original financial campaign required.'},400,{'Cache-Control':'no-store'});
 const report=await finance711(db,context.env,n);
 return new Response(JSON.stringify({report_type:'CUSTODY_FOLLOWUP_OUTCOME_NINTH_RENEWAL_711',
  report,external_contact_verified:false,bookkeeping_closed:false},null,2),
  {status:200,headers:{'Content-Type':'application/json; charset=utf-8',
   'Content-Disposition':'attachment; filename="devilndove-custody-outcome-provenance-711-'+n+'.json"',
   'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial710'){
 const n=Number(params.get('campaign_queue_id'));
 if(!Number.isSafeInteger(n)||n<1)
  return jsonResponse({ok:false,error:'Exact original financial campaign required.'},400,{'Cache-Control':'no-store'});
 const report=await finance710(db,context.env,n);
 return new Response(JSON.stringify({report_type:'OVERDUE_CUSTODY_FOLLOWUP_AND_NINTH_PROVENANCE_STABILITY_710',
  report,bookkeeping_closed:false,external_contact_verified:false},null,2),
  {status:200,headers:{'Content-Type':'application/json; charset=utf-8',
   'Content-Disposition':'attachment; filename="devilndove-original-provenance-710-'+n+'.json"',
   'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial709'){
 const n=Number(params.get('campaign_queue_id'));
 if(!Number.isSafeInteger(n)||n<1)
  return jsonResponse({ok:false,error:'Exact owner financial campaign required.'},400,{'Cache-Control':'no-store'});
 const report=await finance709(db,context.env,n);
 return new Response(JSON.stringify({report_type:'ORIGINAL_REVIEWER_RENEWAL_AGING_FINANCIAL_CUSTODY_ESCALATION_709',
  report,bookkeeping_closed:false,external_escalation_sent:false},null,2),
  {status:200,headers:{'Content-Type':'application/json; charset=utf-8',
   'Content-Disposition':'attachment; filename="devilndove-financial-exception-709-'+n+'.json"',
   'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial708'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Exact original financial campaign required.'},400,{'Cache-Control':'no-store'});
const report=await finance708(db,context.env,n);
return new Response(JSON.stringify({report_type:'NINTH_REVIEWER_ACCEPTANCE_CONTINUITY_AND_FINANCIAL_CUSTODY_RENEWAL_708',
 report,bookkeeping_closed:false,financial_certified:false},null,2),
 {status:200,headers:{'Content-Type':'application/json; charset=utf-8',
 'Content-Disposition':'attachment; filename="devilndove-financial-custody-renewal-'+n+'-708.json"',
 'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial707'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Exact original finance campaign required.'},400,{'Cache-Control':'no-store'});
const report=await finance707(db,context.env,n);
return new Response(JSON.stringify({report_type:'ORIGINAL_NINTH_FIELD_ACCEPTANCE_AND_FINANCIAL_CUSTODY_AUDIT_707',
 report,bookkeeping_closed:false,financial_certified:false},null,2),
 {status:200,headers:{'Content-Type':'application/json; charset=utf-8',
 'Content-Disposition':'attachment; filename="devilndove-ninth-field-custody-707-'+n+'.json"',
 'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial706'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Exact original financial campaign required.'},400,{'Cache-Control':'no-store'});
const report=await finance706(db,context.env,n);
return new Response(JSON.stringify({
 report_type:'ORIGINAL_INDEPENDENT_EXCEPTION_REVIEW_AND_FINANCIAL_EVIDENCE_RETENTION_706',
 report,bookkeeping_closed:false,financial_certified:false,
 connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'},null,2),
 {status:200,headers:{'Content-Type':'application/json; charset=utf-8',
  'Content-Disposition':'attachment; filename="devilndove-independent-review-retention-'+n+'-706.json"',
  'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial705'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Exact original financial campaign required.'},400,{'Cache-Control':'no-store'});
const report=await finance705(db,context.env,n);
return new Response(JSON.stringify({
 report_type:'FINANCIAL_INDEPENDENT_POSTING_CONTINUITY_OWNER_EVIDENCE_REVIEW_705',
 report,bookkeeping_closed:false,financial_certified:false,
 connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'},null,2),
 {status:200,headers:{'Content-Type':'application/json; charset=utf-8',
  'Content-Disposition':'attachment; filename="devilndove-posting-continuity-'+n+'-705.json"',
  'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial704'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Exact original campaign required.'},400,{'Cache-Control':'no-store'});
const report=await finance704(db,context.env,n);
return new Response(JSON.stringify({
 report_type:'FINANCIAL_INDEPENDENT_LIVE_POSTING_SOURCE_AND_OWNER_READINESS_704',
 report,bookkeeping_closed:false,financial_certified:false,continuous_connection_verified:false
},null,2),{status:200,headers:{'Content-Type':'application/json; charset=utf-8',
 'Content-Disposition':'attachment; filename="devilndove-live-posting-readiness-'+n+'-704.json"',
 'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial703'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Exact campaign required.'},400,{'Cache-Control':'no-store'});
const report=await finance703(db,context.env,n);
return new Response(JSON.stringify({report_type:'FINANCIAL_INDEPENDENT_POSTING_DOCUMENT_OWNER_CLOSURE_REVIEW_703',
 report,actual_external_posting_proven:false,bookkeeping_closed:false,
 financial_certified:false,connection:'HOLD'},null,2),{
 status:200,headers:{'Content-Type':'application/json; charset=utf-8',
 'Content-Disposition':'attachment; filename="devilndove-finance-posting-review-'+n+'-703.json"',
 'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial702'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Exact campaign required.'},400,{'Cache-Control':'no-store'});
const report=await finance702(db,context.env,n);
return new Response(JSON.stringify({report_type:'FINANCIAL_INDEPENDENT_CLOSURE_DECISION_702',
 report,actual_bookkeeping_close:false,financial_certified:false,
 connection:'HOLD'},null,2),{status:200,headers:{'Content-Type':'application/json; charset=utf-8',
 'Content-Disposition':'attachment; filename="devilndove-bookkeeping-decision-'+n+'-702.json"',
 'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial701'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Exact campaign required.'},400,{'Cache-Control':'no-store'});
const report=await finance701(db,context.env,n);
return new Response(JSON.stringify({report_type:'FINANCIAL_INDEPENDENT_BOOKKEEPING_EVIDENCE_701',
  report,bookkeeping_closed:false,financial_certified:false,connection:'HOLD'},null,2),
  {status:200,headers:{'Content-Type':'application/json; charset=utf-8',
    'Content-Disposition':'attachment; filename="devilndove-financial-bookkeeping-review-'+n+'-701.json"',
    'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial700'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Exact financial campaign required.'},400,{'Cache-Control':'no-store'});
const report=await finance700(db,context.env,n);
return new Response(JSON.stringify({report_type:'FINANCIAL_ORIGINAL_EXTERNAL_SOURCE_READBACK_700',
financial_source_readback_report:report,
original_financial_certified:false,connection:'HOLD'},null,2),
{status:200,headers:{'Content-Type':'application/json; charset=utf-8',
'Content-Disposition':'attachment; filename="devilndove-finance-source-readback-'+n+'-700.json"',
'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial699'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Exact financial campaign required.'},400,{'Cache-Control':'no-store'});
const report=await finance699(db,context.env,n);
return new Response(JSON.stringify({report_type:'FINANCIAL_SOURCE_REPAIR_INDEPENDENT_DOCUMENT_WITNESS_699',
financial_source_document_verification_report:report,
live_source_repair_verified:false,financial_certified:false},null,2),
{status:200,headers:{'Content-Type':'application/json; charset=utf-8',
'Content-Disposition':'attachment; filename="devilndove-finance-source-witness-'+n+'-699.json"',
'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial698'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Exact financial campaign required.'},400,{'Cache-Control':'no-store'});
const report=await finance698(db,context.env,n);
return new Response(JSON.stringify({report_type:'FINANCIAL_SOURCE_REPAIR_INTAKE_RECOVERY_MASTER_DRIFT_698',
financial_recovery_report:report,external_source_repaired:false,
financial_certified:false,connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'},null,2),
{status:200,headers:{'Content-Type':'application/json; charset=utf-8',
'Content-Disposition':'attachment; filename="devilndove-finance-recovery-'+n+'-698.json"',
'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial697'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Exact financial campaign required.'},400,{'Cache-Control':'no-store'});
const report=await finance697(db,context.env,n);
return new Response(JSON.stringify({
report_type:'FINANCIAL_INDEPENDENT_RECONCILIATION_ESCALATION_MASTER_RENEWAL_697',
financial_reconciliation_report:report,source_repair_verified:false,
financial_certified:false,connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'},null,2),
{status:200,headers:{'Content-Type':'application/json; charset=utf-8',
'Content-Disposition':'attachment; filename="devilndove-finance-reconciliation-'+n+'-697.json"',
'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial696'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Exact original campaign required.'},400,{'Cache-Control':'no-store'});
const report=await finance696(db,context.env,n);
return new Response(JSON.stringify({report_type:'FINANCIAL_INDEPENDENT_CORRECTION_AGING_MASTER_CONTINUITY_696',
financial_source_verification_report:report,source_mismatch_cleared:false,
financial_certified:false,runtime_connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'},null,2),{
status:200,headers:{'Content-Type':'application/json; charset=utf-8',
'Content-Disposition':'attachment; filename="devilndove-finance-correction-'+n+'-696.json"',
'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial695'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Exact financial campaign required.'},400,{'Cache-Control':'no-store'});
const report=await finance695(db,context.env,n);
return new Response(JSON.stringify({report_type:'FINANCIAL_RESOLUTION_AGING_SOURCE_CORRECTION_MASTER_REVALIDATION_695',
owner_aging_correction_report:report,external_source_repair_verified:false,
runtime_connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
financial_certified:false},null,2),{status:200,headers:{
'Content-Type':'application/json; charset=utf-8',
'Content-Disposition':'attachment; filename="devilndove-finance-review-'+n+'-695.json"',
'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial694'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Exact financial campaign required for owner resolution ledger export.'},400,{'Cache-Control':'no-store'});
const report=await finance694(db,context.env,n);
return new Response(JSON.stringify({report_type:'FINANCIAL_RESOLUTION_MASTER_PROVENANCE_OWNER_CONTINUITY_694',
owner_resolution_report:report,historical_signatures_reverified:false,
runtime_connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
financial_certified:false,external_remediation_proven:false},null,2),{
status:200,headers:{'Content-Type':'application/json; charset=utf-8',
'Content-Disposition':'attachment; filename="devilndove-finance-resolution-'+n+'-694.json"',
'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial693'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Exact campaign required for protected owner financial audit export.'},400,{'Cache-Control':'no-store'});
const report=await finance693(db,context.env,n);
return new Response(JSON.stringify({report_type:'FINANCIAL_SLA_AGING_PROVENANCE_OWNER_HISTORY_693',
owner_evidence_report:report,historical_signatures_reverified:false,
continuous_runtime_connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
profitability_certified:false},null,2),{status:200,headers:{
'Content-Type':'application/json; charset=utf-8',
'Content-Disposition':'attachment; filename="devilndove-finance-audit-'+n+'-693.json"',
'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial692'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Exact campaign required for protected owner SLA export.'},400,{'Cache-Control':'no-store'});
const report=await finance692(db,context.env,n);
return new Response(JSON.stringify({report_type:'FINANCIAL_SLA_PROVENANCE_OWNER_AUDIT_692',
owner_evidence_report:report,historical_signatures_reverified:false,
continuous_runtime_connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
financial_certified:false},null,2),{status:200,headers:{
'Content-Type':'application/json; charset=utf-8',
'Content-Disposition':'attachment; filename="devilndove-finance-owner-'+n+'-692.json"',
'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial691'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Exact campaign required for owner continuity export.'},400,{'Cache-Control':'no-store'});
const report=await finance691(db,context.env,n);
return new Response(JSON.stringify({report_type:'FINANCIAL_EXCEPTION_AGING_AND_OWNER_CLOSURE_691',
owner_continuity_report:report,historical_signature_reverification:false,
continuous_connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
profitability_certified:false},null,2),{status:200,headers:{
'Content-Type':'application/json; charset=utf-8',
'Content-Disposition':'attachment; filename="devilndove-finance-continuity-'+n+'-691.json"',
'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial690'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Exact financial campaign required.'},400,{'Cache-Control':'no-store'});
const report=await finance690(db,context.env,n);
return new Response(JSON.stringify({report_type:'FINANCIAL_REPLAY_RENEWAL_RECONCILIATION_690',
owner_continuity_report:report,independent_master_accepted_now:report.master_accepted_now,
historical_signatures_reverified:false,financial_certified:false},null,2),{
status:200,headers:{'Content-Type':'application/json; charset=utf-8',
'Content-Disposition':'attachment; filename="devilndove-finance-continuity-'+n+'-690.json"',
'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial689'){
const id=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(id)||id<1)return jsonResponse({ok:false,error:'Select an exact campaign for protected audit replay.'},400,{'Cache-Control':'no-store'});
const result=await finance689(db,context.env,id);
return new Response(JSON.stringify({report_type:'FINANCIAL_REPLAY_AND_OWNER_AUDIT_689',
owner_replay_report:result,historical_signatures_reverified:false,
external_master_connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY',
financial_certified:false},null,2),{status:200,headers:{
'Content-Type':'application/json; charset=utf-8',
'Content-Disposition':'attachment; filename="devilndove-finance-replay-'+id+'-689.json"',
'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial688'){
const n=Number(params.get('campaign_queue_id'));
if(!Number.isSafeInteger(n)||n<1)return jsonResponse({ok:false,error:'Select a valid campaign for protected Build 688 owner report.'},400,{'Cache-Control':'no-store'});
const report=await finance688(db,context.env,n);
return new Response(JSON.stringify({report_type:'FINANCIAL_OWNER_RECOVERY_688',
owner_signoff_report:report,current_master_proof_independent:report.master_accepted_now,
historical_acceptance_is_not_current_proof:true,financial_certified:false},null,2),{
status:200,headers:{'Content-Type':'application/json; charset=utf-8',
'Content-Disposition':'attachment; filename="devilndove-financial-owner-recovery-'+n+'-688.json"',
'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
if(params.get('export')==='financial682'){
const evidence=await finance682(db,context.env,params.get('campaign_queue_id'));
if(!evidence.campaign||!evidence.complete)return jsonResponse({ok:false,error:'Complete campaign evidence required for protected export.'},409,{'Cache-Control':'no-store'});
return new Response(JSON.stringify(evidence,null,2),{status:200,headers:{
'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="devilndove-financial-evidence-'+Number(params.get('campaign_queue_id'))+'.json"',
'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
const data=await summarize(db,context.env);
return jsonResponse({ ok:true,...data,receipts673:await receipts673(db),engagement675:await engagement675(db),financial676:await financial676(db),financial678:await financialSummary678(db,context.request.headers.get('x-campaign-queue-id')||new URL(context.request.url).searchParams.get('campaign_queue_id')),financial679:await campaignNet679(db,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial680:await finance680(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial681:await finance681(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial682:await finance682(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial683:await financial683(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial684:await financial684(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial685:await financial685(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financialRecoveryQueue686:await globalFinanceQueue686(db),financial687:await finance687(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial688:await finance688(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial689:await finance689(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial690:await finance690(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial691:await finance691(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial692:await finance692(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial693:await finance693(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial694:await finance694(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial695:await finance695(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial696:await finance696(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial697:await finance697(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial698:await finance698(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial699:await finance699(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial700:await finance700(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial701:await finance701(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial702:await finance702(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial703:await finance703(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial704:await finance704(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial705:await finance705(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial706:await finance706(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial707:await finance707(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial708:await finance708(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial709:await finance709(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial710:await finance710(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial711:await finance711(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial712:await finance712(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial713:await finance713(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),queue:data.queue.map(normalizeQueueRow),mode:'review_first_api_when_configured'},200,{ 'Cache-Control':'no-store'});
} catch (error){
await captureRuntimeIncident(context.env,context.request,{
incident_scope:'admin_social',
incident_code:'social_queue_get_failed',
severity:'error',
message:error?.message || 'Social queue failed to load.',
details:{ error:String(error?.stack || error?.message || error) },
related_user_id:adminUser.user_id
});
return jsonResponse({ ok:true,degraded:true,backend_warning:error?.message || 'Social queue is temporarily unavailable. Refresh after the database migration completes.',summary:{ total:0,open_count:0,needs_review_count:0,posted_count:0,scheduled_count:0,due_count:0,duplicate_warning_count:0 },queue:[],platforms:[],attempts:[],templates:[],calendar:[],utm_rollups:[],mode:'review_first_api_when_configured'},200,{ 'Cache-Control':'no-store'});
}
}

export async function onRequestPost(context){
const adminUser=await getAdminUserFromRequest(context.request,context.env);
if (!adminUser) return jsonResponse({ ok:false,error:'Admin access required.'},401);
const db=getDb(context.env);
if (!db) return jsonResponse({ ok:false,error:'Database binding is not configured.'},500);

let payload={};
try{ payload=await context.request.json();} catch{ payload={};}
const action=slugKey(payload.action || 'create');

try{
await ensureSchema(db);
let result={};
if (action==='create') result=await createQueuedPost(db,adminUser,payload);
else if (action==='update_status') await updateStatus(db,adminUser,payload);
else if (action==='record_manual_post') await recordManualPost(db,adminUser,payload);
else if (action==='generate_from_recent_media') result=await generateFromRecentMedia(db,adminUser);
else if (action==='preview_caption_template') result=await previewCaptionTemplate(db,payload);
else if (action==='save_caption_template') result=await saveCaptionTemplate(db,payload);
else if (action==='archive_caption_template') result=await archiveCaptionTemplate(db,payload);
else if (action==='dry_run_platforms') result=await dryRunQueuedPost(context,db,adminUser,payload);
else if (action==='publish_platforms') result=await publishQueuedPost(context,db,adminUser,payload);
else if (action==='verify_accounts_672') result={accounts:await verifyAccounts672(context.env),verified_at:new Date().toISOString(),publication_performed:false};
else if (action==='approve_caip_derivative_672') result=await approveCaipDerivative672(db,adminUser,payload);
else if (action==='verify_publication_673') result=await verifyPublication673(context,db,adminUser,payload);
else if (action==='retry_failed_673') result=await retryFailed673(context,db,adminUser,payload);
else if (action==='campaign_schedule_674') result=await scheduleCampaign674(db,adminUser,payload);
else if (action==='verify_engagement_675') result=await verifyEngagement675(context,db,adminUser,payload);
else if (action==='financial_evidence_676') result=await recordFinancialEvidence676(db,adminUser,payload);
else if (action==='verify_product_cost_679') result=await verifyCost679(db,context.env,adminUser,payload,recordApiAttempt);
else if (action==='owner_net_signoff_679') result=await ownerNetSignoff679(db,adminUser,payload,recordApiAttempt);
else if (action==='master_ack_680') result=await masterAck680(db,context.env,adminUser,payload);
else if (action==='owner_profit_exception_680') result=await exception680(db,adminUser,payload);
else if (action==='owner_exception_ack_681') result=await ownerExceptionAck681(db,adminUser,payload);
else if (action==='owner_discrepancy_review_682') result=await ownerDiscrepancy682(db,context.env,adminUser,payload);
else if (action==='admit_financial_signer_683') result=await admission683(db,context.env,adminUser,payload);
else if (action==='correlate_financial_master_683') result=await masterCorrelation683(db,context.env,adminUser,payload);
else if (action==='close_financial_discrepancy_683') result=await ownerClosure683(db,context.env,adminUser,payload);
else if (action==='enroll_finance_signer_684') result=await enroll684(db,context.env,adminUser,payload);
else if (action==='verify_finance_master_684') result=await accept684(db,context.env,adminUser,payload);
else if (action==='close_finance_continuity_684') result=await continuity684(db,context.env,adminUser,payload);
else if (action==='revalidate_finance_master_685') result=await revalidate685(db,context.env,adminUser,payload);
else if (action==='owner_finance_recovery_685') result=await recovery685(db,context.env,adminUser,payload);
else if (action==='owner_finance_review_688') result=await ownerReview688(db,context.env,adminUser,payload);
else if (action==='owner_finance_audit_689') result=await ownerAudit689(db,context.env,adminUser,payload);
else if (action==='owner_finance_reconcile_690') result=await ownerReconcile690(db,context.env,adminUser,payload);
else if (action==='owner_finance_continuity_691') result=await ownerContinuity691(db,context.env,adminUser,payload);
else if (action==='owner_finance_followup_692') result=await ownerFollowup692(db,context.env,adminUser,payload);
else if (action==='owner_finance_audit_693') result=await ownerAudit693(db,context.env,adminUser,payload);
else if (action==='owner_finance_resolution_694') result=await ownerResolution694(db,context.env,adminUser,payload);
else if (action==='owner_finance_review_695') result=await ownerReview695(db,context.env,adminUser,payload);
else if (action==='owner_finance_review_696') result=await ownerReview696(db,context.env,adminUser,payload);
else if (action==='owner_finance_review_697') result=await ownerReview697(db,context.env,adminUser,payload);
else if (action==='owner_finance_review_698') result=await ownerReview698(db,context.env,adminUser,payload);
else if (action==='owner_finance_review_699') result=await ownerReview699(db,context.env,adminUser,payload);
else if (action==='owner_live_source_readback_700') result=await liveSourceReadback700(db,context.env,adminUser,payload);
else if (action==='owner_bookkeeping_review_701') result=await ownerBookkeepingReview701(db,context.env,adminUser,payload);
else if (action==='owner_bookkeeping_decision_702') result=await ownerBookkeepingDecision702(db,context.env,adminUser,payload);
else if (action==='independent_posting_document_703') result=await ownerPostingEvidence703(db,context.env,adminUser,payload);
else if (action==='owner_financial_closure_703') result=await ownerFinancialClosure703(db,context.env,adminUser,payload);
else if (action==='live_posting_source_readback_704') result=await livePostingReadback704(db,context.env,adminUser,payload);
else if (action==='owner_financial_readiness_704') result=await ownerFinancialReadiness704(db,context.env,adminUser,payload);
else if (action==='live_posting_continuity_705') result=await livePostingContinuity705(db,context.env,adminUser,payload);
else if (action==='owner_financial_evidence_review_705') result=await ownerFinancialEvidenceReview705(db,context.env,adminUser,payload);
else if (action==='independent_continuity_exception_review_706') result=await independentContinuityReview706(db,context.env,adminUser,payload);
else if (action==='owner_financial_evidence_retention_706') result=await ownerEvidenceRetention706(db,context.env,adminUser,payload);
else if (action==='owner_ninth_reviewer_field_acceptance_707') result=await originalNinthFieldAcceptance707(db,context.env,adminUser,payload);
else if (action==='owner_financial_custody_audit_707') result=await originalFinancialCustodyAudit707(db,context.env,adminUser,payload);
else if (action==='owner_ninth_reviewer_continuity_708') result=await ownerNinthAcceptanceContinuity708(db,context.env,adminUser,payload);
else if (action==='owner_financial_custody_renewal_708') result=await ownerCustodyRenewal708(db,context.env,adminUser,payload);
else if (action==='owner_financial_custody_exception_escalation_709') result=await ownerCustodyExceptionEscalation709(db,context.env,adminUser,payload);
else if (action==='owner_custody_escalation_followup_710') result=await ownerCustodyFollowup710(db,context.env,adminUser,payload);
else if (action==='owner_ninth_reviewer_provenance_audit_710') result=await ownerNinthProvenanceAudit710(db,context.env,adminUser,payload);
else if (action==='owner_custody_followup_outcome_reconciliation_711') result=await ownerCustodyOutcome711(db,context.env,adminUser,payload);
else if (action==='owner_ninth_provenance_renewal_audit_711') result=await ownerNinthRenewal711(db,context.env,adminUser,payload);
else if (action==='owner_custody_followup_evidence_712') result=await ownerCustodyEvidence712(db,context.env,adminUser,payload);
else if (action==='independent_ninth_source_intake_716') result=await intakeIndependentNinth716(db,context.env,adminUser,payload);
else if (action==='independent_external_custody_sla_intake_717') result=await intakeExternalCustodySla717(db,context.env,adminUser,payload);
else if (action==='expense_attestation_678') result=await expenseAttestation678(db,context.env,adminUser,payload,recordApiAttempt);
else if (action==='owner_marketing_signoff_678') result=await ownerSignoff678(db,adminUser,payload,recordApiAttempt);
else throw new Error(`Unsupported social queue action: ${action}`);

await auditAdminAction(context.env,context.request,adminUser,{
action_type:`social_queue_${action}`,
target_type:'social_post_queue',
target_id:result.social_post_queue_id || payload.social_post_queue_id || null,
target_key:result.social_post_key || null,
details:{ action,platforms:payload.target_platforms || payload.platforms || null }
});

const data=await summarize(db,context.env);
return jsonResponse({ ok:true,message:'Social queue updated.',result,...data,queue:data.queue.map(normalizeQueueRow),mode:'review_first_api_when_configured'},200,{ 'Cache-Control':'no-store'});
} catch (error){
await captureRuntimeIncident(context.env,context.request,{
incident_scope:'admin_social',
incident_code:'social_queue_post_failed',
severity:'error',
message:error?.message || 'Social queue update failed.',
details:{ action,error:String(error?.stack || error?.message || error) },
related_user_id:adminUser.user_id
});
return jsonResponse({ ok:false,error:error?.message || 'Social queue update failed.'},500);
}
}
