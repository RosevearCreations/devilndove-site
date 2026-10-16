// Release 467 Build 399 — explicit, operator-confirmed, ONE-ATTEMPT remote Etsy draft; never publish.
// No automatic token refresh, provider retries, inventory/price edits or schema changes.
import {getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {decryptOAuthSecret} from '../_lib/oauthSecurity.js';
import {loadTrial409,isAuthorized409} from '../_lib/etsyTrialGate409.mjs';
import {positive,safeSettings,connectionBlockers,localDraftReview,collectTaxonomy,remoteDraftForm} from '../_lib/etsyDraftTrial399.mjs';
const output=(data,status=200)=>jsonResponse({ok:true,build:399,publication_performed:false,automatic_retry:false,...data},status,{'Cache-Control':'no-store'});
const connSql="SELECT remote_subject_id,connection_status,scopes_json,access_expires_at,access_token_ciphertext FROM oauth_provider_connections WHERE provider_key='etsy' LIMIT 1";
const shopSql="SELECT shop_id,owner_user_id,shop_name,currency_code,acceptance_status FROM etsy_oauth_shop_connections WHERE provider_key='etsy' LIMIT 1";
const prodSql="SELECT product_id,name,price_cents,currency,inventory_quantity FROM products WHERE product_id=? LIMIT 1";
const draftSql="SELECT id,channel_key,product_id,draft_title,payload_json,status,external_reference,updated_at FROM marketplace_syndication_drafts WHERE id=? AND channel_key='etsy' LIMIT 1";
const listSql="SELECT id,draft_title,status,external_reference,updated_at FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND product_id=? ORDER BY updated_at DESC LIMIT 12";
const claimsSql="SELECT admin_action_audit_id,details_json,created_at FROM admin_action_audit WHERE action_type='etsy_remote_draft_trial_claimed' AND target_type='marketplace_draft' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1";
async function gate(context){
 const admin=verifiedAdminFromModule(context);
 if(!admin)return {error:output({ok:false,error:'Verified administrator access required.'},401)};
 const db=getDb(context.env);return db?{admin,db}:{error:output({ok:false,error:'Database unavailable.'},503)};
}
const shopSafe=row=>row?{shop_id:String(row.shop_id||''),shop_name:String(row.shop_name||'').slice(0,120),currency_code:String(row.currency_code||''),
 acceptance_status:String(row.acceptance_status||'')}:null;
async function initial(db,env){
 const [conn,shop]=await Promise.all([db.prepare(connSql).first(),db.prepare(shopSql).first()]);
 return {conn,shop,blockers:connectionBlockers(conn,shop,env)};
}
const idFrom=(url,name)=>String(url.searchParams.get(name)||'');
async function local(db,productId,draftId){
 const p=await db.prepare(prodSql).bind(productId).first();
 if(!p)return null;
 const draft=draftId?await db.prepare(draftSql).bind(draftId).first():null;
 return {product:p,draft,review:draft?localDraftReview(p,draft,null,null):null};
}
async function getToken(env,conn){
 return decryptOAuthSecret(env,conn.access_token_ciphertext,'oauth-token|etsy|access');
}
async function safeEtsyGet(path,env,token){
 const res=await fetch('https://api.etsy.com/v3/application/'+path,{
 method:'GET',headers:{'Accept':'application/json','x-api-key':String(env.ETSY_API_KEYSTRING)+':'+String(env.ETSY_SHARED_SECRET),
 'Authorization':'Bearer '+token},redirect:'manual'});
 if(res.status>=300&&res.status<400)throw Error('etsy_redirect_blocked');
 if(!res.ok)throw Error('etsy_options_unavailable');
 return res.json().catch(()=>({}));
}
async function providerOptions(env,conn,shop){
 const token=await getToken(env,conn);if(!token)throw Error('etsy_credential_unavailable');
 const prefix='shops/'+encodeURIComponent(String(shop.shop_id));
 const [shipping,readiness,taxonomy]=await Promise.all([
  safeEtsyGet(prefix+'/shipping-profiles',env,token),
  safeEtsyGet(prefix+'/readiness-state-definitions',env,token),
  safeEtsyGet('seller-taxonomy/nodes',env,token)
 ]);
 const profiles=(Array.isArray(shipping?.results)?shipping.results:[]).slice(0,40).filter(x=>positive(x.shipping_profile_id))
 .map(x=>({id:Number(x.shipping_profile_id),name:String(x.title||x.profile_name||'Shipping profile').slice(0,100)}));
 const ready=(Array.isArray(readiness?.results)?readiness.results:[]).slice(0,40).filter(x=>positive(x.readiness_state_id))
 .map(x=>({id:Number(x.readiness_state_id),name:String(x.readiness_state||'Processing profile').slice(0,75),
 min_days:Number(x.min_processing_time||0),max_days:Number(x.max_processing_time||0)}));
 const tax=collectTaxonomy(Array.isArray(taxonomy?.results)?taxonomy.results:[], 'soap');
 return {shipping:profiles,readiness:ready,taxonomy:tax};
}
export async function onRequestGet(context){
 const g=await gate(context);if(g.error)return g.error;
 const url=new URL(context.request.url),raw=idFrom(url,'product_id'),draftId=idFrom(url,'draft_id');
 if(!positive(raw))return output({ok:false,error:'Select an existing Product first.'},400);
 try{
  const pre=await initial(g.db,context.env);
  const drafts=(await g.db.prepare(listSql).bind(raw).all())?.results||[];
  const localResult=await local(g.db,Number(raw),draftId);
  if(!localResult)return output({ok:false,error:'Product not found.'},404);
  const review=localResult.draft?localDraftReview(localResult.product,localResult.draft,pre.shop,pre.conn):null;
  const claim=draftId?await g.db.prepare(claimsSql).bind(draftId).first():null;
  const blockers=[...pre.blockers,...(review?.blockers||[])];
  if(!draftId)blockers.push('select_existing_local_draft');
  if(claim)blockers.push('remote_attempt_already_claimed_manual_reconciliation');
  return output({source:'stored_preflight_only',shop:shopSafe(pre.shop),product:{id:Number(raw),name:String(localResult.product.name||''),
    price_cents:Number(localResult.product.price_cents),quantity:Number(localResult.product.inventory_quantity),currency:String(localResult.product.currency||'')},
   drafts:drafts.map(d=>({id:d.id,title:d.draft_title,status:d.status,external_reference:d.external_reference||null})),
   selected_draft:review?{id:draftId,title:review.details.title,description:review.details.description,quantity:review.details.quantity,price_cents:review.details.price_cents}:null,
   fingerprint:review?.fingerprint||null,blockers,ready_for_operator_options:blockers.length===0,
   previous_attempt_receipt:claim?Number(claim.admin_action_audit_id):null,
   remote_etsy_calls_performed:false,remote_draft_created:false});
 }catch{return output({ok:false,code:'draft_preflight_unavailable',error:'Draft preflight evidence unavailable; no provider action was attempted.'},503);}
}
export async function onRequestPost(context){
 const g=await gate(context);if(g.error)return g.error;
 let body;try{body=await context.request.json();}catch{return output({ok:false,error:'Valid JSON required.'},400);}
 if(body?.action==='load_remote_options'){
  const productId=Number(body.product_id);
  if(!positive(productId))return output({ok:false,error:'Choose Product first.'},400);
  try{
   const pre=await initial(g.db,context.env);
   if(pre.blockers.length)return output({ok:false,code:'remote_options_blocked',blockers:pre.blockers,
     error:'Etsy connection requires review before reading live shop profiles.'},409);
   const options=await providerOptions(context.env,pre.conn,pre.shop);
   return output({shop:shopSafe(pre.shop),options,remote_request_type:'GET_ONLY',provider_writes:false});
  }catch{return output({ok:false,code:'etsy_options_unavailable',error:'Etsy profile options could not be read. No listing was created.'},502);}
 }
 const input=safeSettings(body);
 if(!input)return output({ok:false,error:'Explicit unpublished draft confirmation and valid Etsy options are required.'},400);
 try{
  const pre=await initial(g.db,context.env);
  if(pre.blockers.length)return output({ok:false,code:'oauth_or_shop_not_ready',blockers:pre.blockers,
   error:'Etsy access, permissions, shop ownership or currency need attention. No remote draft created.'},409);
  const localResult=await local(g.db,input.product_id,input.draft_id);
  if(!localResult?.draft)return output({ok:false,error:'Stage a local Devil n Dove draft before an Etsy trial.'},409);
  const review=localDraftReview(localResult.product,localResult.draft,pre.shop,pre.conn);
  if(review.blockers.length||review.fingerprint!==input.fingerprint)
   return output({ok:false,code:'local_evidence_changed',blockers:review.blockers,
    error:'Product, local draft or Etsy connection changed; reload readiness and review before any provider write.'},409);
  // Build 409: a fresh canonical Product/image/shipping/owner approval is mandatory
  // before the existing one-attempt unpublished Etsy POST can be claimed or sent.
  const trial409=await loadTrial409(g.db,context.env,input.product_id,input.draft_id);
  if(!trial409||!Number.isSafeInteger(Number(body.trial_409_receipt))||
    !isAuthorized409({receipt:trial409.trial,source:trial409,draftId:input.draft_id,shippingProfileId:input.shipping_profile_id})||
    Number(body.trial_409_receipt)!==Number(trial409.trial?.admin_action_audit_id))
    return output({ok:false,code:'build409_operator_trial_authorization_missing_or_stale',
      blockers:trial409?.blockers||['canonical_source_or_draft_not_found'],
      error:'Fresh Build 409 owner authorization, original Product/media review, approved non-US shipping profile and bounded trial receipt are required. No Etsy request made.'},409);
  const prior=await g.db.prepare(claimsSql).bind(input.draft_id).first();
  if(prior)return output({ok:false,code:'prior_etsy_attempt_requires_reconciliation',
    receipt_id:Number(prior.admin_action_audit_id),
    error:'An Etsy draft attempt was already recorded for this local draft. Inspect Etsy drafts before attempting another.'},409);
  const token=await getToken(context.env,pre.conn);
  if(!token)return output({ok:false,error:'Etsy token unavailable. No remote attempt was made.'},409);
  // Validate all option IDs against Etsy read-only metadata before claiming a single remote POST.
  let options;try{options=await providerOptions(context.env,pre.conn,pre.shop);}catch{
    return output({ok:false,error:'Could not validate Etsy taxonomy, shipping and readiness profiles. No draft created.'},502);
  }
  if(!options.shipping.some(x=>x.id===input.shipping_profile_id)||
     !options.readiness.some(x=>x.id===input.readiness_state_id)||
     !options.taxonomy.some(x=>x.id===input.taxonomy_id))
    return output({ok:false,code:'etsy_options_not_verified',
     error:'Etsy did not confirm the selected Soap taxonomy, shipping and processing profiles.'},409);
  // Durable single-claim fence. No retries after this statement, even if the provider response is lost.
  const detail=JSON.stringify({build:399,request_key:input.request_key,operator_user_id:g.admin.user_id,
   shop_id:String(pre.shop.shop_id),product_id:input.product_id,local_draft_id:input.draft_id,
   fingerprint:input.fingerprint,remote_post_attempted:true,listing_state_requested:'draft',
   has_automatic_retry:false,provider_publication_allowed:false});
  const claimSql="INSERT INTO admin_action_audit "+
   "(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) "+
   "SELECT ?, 'etsy_remote_draft_trial_claimed','marketplace_draft',?,'POST',?,?,CURRENT_TIMESTAMP "+
   "WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_remote_draft_trial_claimed' "+
   "AND target_type='marketplace_draft' AND target_key=?) "+
   "AND EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE id=? AND channel_key='etsy' AND external_reference IS NULL) "+
   "AND EXISTS (SELECT 1 FROM products WHERE product_id=? AND price_cents=? AND currency='CAD' AND inventory_quantity>=?)";
  const claimed=await g.db.prepare(claimSql).bind(g.admin.user_id,input.draft_id,
   new URL(context.request.url).pathname,detail,input.draft_id,input.draft_id,
   input.product_id,review.details.price_cents,review.details.quantity).run();
  if(Number(claimed?.meta?.changes||0)!==1)return output({ok:false,code:'draft_trial_claim_conflict',
   error:'Draft changed or another operator claimed its one Etsy attempt. Inspect the audit before retrying.'},409);
  const claim=await g.db.prepare(claimsSql).bind(input.draft_id).first();
  if(!claim)return output({ok:false,code:'draft_trial_claim_unconfirmed',
   error:'Audit claim could not be verified; NO Etsy request made. Manual reconciliation required.'},409);
  let response,remote;
  try{
   response=await fetch('https://api.etsy.com/v3/application/shops/'+encodeURIComponent(String(pre.shop.shop_id))+'/listings',{
    method:'POST',
    headers:{'Accept':'application/json','Content-Type':'application/x-www-form-urlencoded',
      'x-api-key':String(context.env.ETSY_API_KEYSTRING)+':'+String(context.env.ETSY_SHARED_SECRET),'Authorization':'Bearer '+token},
    body:remoteDraftForm(input,review),redirect:'manual'
   });
   if(response.status>=300&&response.status<400)throw Error('provider_redirect_blocked');
   remote=await response.json().catch(()=>null);
  }catch{
   return output({ok:false,code:'etsy_draft_attempt_outcome_unknown',receipt_id:Number(claim.admin_action_audit_id),
    error:'An Etsy request was attempted but its result is unknown. Check Etsy Draft Listings; this local draft cannot be automatically retried.'},502);
  }
  if(!response.ok){
   return output({ok:false,code:'etsy_draft_rejected',provider_http_status:response.status,
    receipt_id:Number(claim.admin_action_audit_id),
    error:'Etsy rejected the draft. Inspect Etsy and review the issue manually before any different local draft is attempted.'},409);
  }
  if(!positive(remote?.listing_id)||String(remote?.state||'').toLowerCase()!=='draft'){
   return output({ok:false,code:'etsy_draft_response_unverified',receipt_id:Number(claim.admin_action_audit_id),
    error:'Etsy returned an unexpected listing response. Inspect Etsy manually; no automatic retry or publication.'},409);
  }
  const listingId=String(remote.listing_id);
  try{
   await g.db.prepare("UPDATE marketplace_syndication_drafts SET external_reference=?,status='needs_review',updated_at=CURRENT_TIMESTAMP "+
    "WHERE id=? AND channel_key='etsy' AND external_reference IS NULL").bind(listingId,input.draft_id).run();
   const readback=await g.db.prepare(draftSql).bind(input.draft_id).first();
   if(String(readback?.external_reference||'')!==listingId)throw Error('missing_readback');
   await auditAdminAction(context.env,context.request,g.admin,{action_type:'etsy_remote_draft_created',
    target_type:'marketplace_draft',target_key:input.draft_id,
    details:{build:399,listing_id:listingId,shop_id:String(pre.shop.shop_id),
    claim_receipt:Number(claim.admin_action_audit_id),state:'draft',publication_performed:false}});
  }catch{
   return output({ok:false,code:'etsy_created_but_local_receipt_unconfirmed',
    listing_id:listingId,receipt_id:Number(claim.admin_action_audit_id),
    error:'Etsy returned a draft ID, but local reconciliation could not be confirmed. Record the ID and inspect Etsy; do not retry.'},503);
  }
  return output({ok:true,created:true,remote_draft_created:true,shop_id:String(pre.shop.shop_id),
   listing_id:listingId,listing_state:'draft',local_draft_id:input.draft_id,
   claim_receipt:Number(claim.admin_action_audit_id),publication_performed:false,
   product_changed:false,quantity_synced:false,no_auto_retry:true});
 }catch{
  return output({ok:false,code:'etsy_trial_outcome_unknown',
    error:'The trial did not confirm completion. Check local audit and Etsy before attempting another draft; no automatic retry.'},503);
 }
}
