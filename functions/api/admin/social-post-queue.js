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
.bind(id,platform,status,nonce,JSON.stringify(data),user.user_id,'Exact external signed financial evidence; independent runtime telemetry separate.',platform,nonce).run();
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
source_revision:current?.source_revision||null}));
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
d.decision==='escalate_renewal_gap'?candidate?.newer_recorded_at:null);
const historicalClosure=d.decision!=='accept_closure_continuity'||
historicalMaster.has(Number(d.verified_master_receipt_id))&&
Number(d.verified_master_receipt_id)>0;
const valid=Number.isSafeInteger(id)&&id>0&&id>ref&&id<previousId&&
time!==null&&time<=previousTime&&row.attempt_status===status&&
!!candidate&&validSource(d)&&validOwner(d)&&
(sourceTime===null||time>=sourceTime)&&
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
const unresolvedAged=aged.filter(x=>
x.age_minutes!==null&&x.age_minutes>=120&&
x.reference_receipt_id&&!x.escalation_recorded).length;
const unresolvedGaps=gapCases.filter(x=>
x.source_pins_match&&!x.owner_escalation_recorded).length;
const full=selected&&bounded&&invalid===0;
const lineage=!!prior?.renewal?.historical_chain_pin_matches&&
!!prior?.renewal?.current_receipt_in_bounded_history;
return{status:!selected?'HOLD_SELECT_CAMPAIGN':!bounded||invalid?
'HOLD_FINANCIAL_CONTINUITY_HISTORY':!lineage?'HOLD_RENEWAL_SOURCE_PIN':
unresolvedAged?'OWNER_REPLAY_AGING_ESCALATION_REQUIRED':
unresolvedGaps?'OWNER_MASTER_RENEWAL_GAP_REVIEW_REQUIRED':
!acceptedNow?'HOLD_CURRENT_SIGNED_MASTER':
'OWNER_CLOSURE_EVIDENCE_REVIEW_ONLY',
campaign_queue_id:selected?Number(current.queue_id):null,
observed_at:new Date(now).toISOString(),history_complete:full,
replay_exception_count:exceptions.length,
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

export async function onRequestGet(context){
const adminUser=await getAdminUserFromRequest(context.request,context.env);
if (!adminUser) return jsonResponse({ ok:false,error:'Admin access required.'},401);
const db=getDb(context.env);
if (!db) return jsonResponse({ ok:false,error:'Database binding is not configured.'},500);
try{
const params=new URL(context.request.url).searchParams;
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
return jsonResponse({ ok:true,...data,receipts673:await receipts673(db),engagement675:await engagement675(db),financial676:await financial676(db),financial678:await financialSummary678(db,context.request.headers.get('x-campaign-queue-id')||new URL(context.request.url).searchParams.get('campaign_queue_id')),financial679:await campaignNet679(db,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial680:await finance680(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial681:await finance681(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial682:await finance682(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial683:await financial683(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial684:await financial684(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial685:await financial685(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financialRecoveryQueue686:await globalFinanceQueue686(db),financial687:await finance687(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial688:await finance688(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial689:await finance689(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial690:await finance690(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),financial691:await finance691(db,context.env,new URL(context.request.url).searchParams.get('campaign_queue_id')),queue:data.queue.map(normalizeQueueRow),mode:'review_first_api_when_configured'},200,{ 'Cache-Control':'no-store'});
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
