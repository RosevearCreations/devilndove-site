// Build 442 — parcel measurements and audited, manually authorized recovery of a confirmed 400 rejection.
// This endpoint cannot activate, publish, renew, upload images, or modify shipping.
import {getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {decryptOAuthSecret} from '../_lib/oauthSecurity.js';
import {connectionBlockers,positive} from '../_lib/etsyDraftTrial399.mjs';
import {productDraftDetails,productDraftFingerprint,flattenEtsyTaxonomy,safeEtsyDraftInput,etsyDraftForm,
  safeEtsyShopOptions,canadaOnlyShippingProfile} from '../_lib/etsyProductDraft438.mjs';

const respond=(data,status=200)=>jsonResponse({ok:true,build:442,publication_performed:false,automatic_retry:false,...data},status,{'Cache-Control':'no-store'});
const connSql="SELECT remote_subject_id,connection_status,scopes_json,access_expires_at,access_token_ciphertext FROM oauth_provider_connections WHERE provider_key='etsy' LIMIT 1";
const shopSql="SELECT shop_id,owner_user_id,shop_name,currency_code,acceptance_status FROM etsy_oauth_shop_connections WHERE provider_key='etsy' LIMIT 1";
const productSql="SELECT product_id,name,description,short_description,product_type,price_cents,currency,inventory_quantity FROM products WHERE product_id=? LIMIT 1";
const existingSql="SELECT id,external_reference,status FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND product_id=? AND external_reference IS NOT NULL ORDER BY updated_at DESC LIMIT 1";
const claimedSql="SELECT admin_action_audit_id,created_at,details_json FROM admin_action_audit WHERE action_type='etsy_product_editor_draft_claimed' AND target_type='product' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const countSql="SELECT COUNT(*) AS total FROM admin_action_audit WHERE action_type='etsy_product_editor_draft_claimed' AND target_type='product' AND target_key=?";
const rejectionSql="SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='etsy_product_editor_draft_rejected' AND target_type='product' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const recoverySql="SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='etsy_product_editor_rejected_attempt_reconciled' AND target_type='product' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const shopDisplay=shop=>shop?{shop_id:String(shop.shop_id||''),name:String(shop.shop_name||'').slice(0,100),currency:String(shop.currency_code||'')}:null;

const auditDetails=row=>{try{return JSON.parse(row?.details_json||'{}');}catch{return {};}};
function hasConfirmed400Rejection(g){
  if(g.existing||Number(g.claimCount)!==1||!g.claim||!g.rejection)return false;
  const claimed=auditDetails(g.claim),rejected=auditDetails(g.rejection);
  return Number(rejected.provider_http_status)===400&&
    Boolean(claimed.request_key)&&claimed.request_key===rejected.request_key&&
    Number(claimed.product_id)===Number(g.product.product_id);
}
function recoveryStatus(g){
  if(!g.claim)return {state:'not_needed',eligible:false};
  if(g.existing)return {state:'already_created',eligible:false};
  if(Number(g.claimCount)>1)return {state:'second_attempt_already_claimed',eligible:false};
  if(g.recovery&&hasConfirmed400Rejection(g))return {state:'owner_reconciled_one_final_attempt',eligible:false,
    receipt_id:Number(g.recovery.admin_action_audit_id)};
  if(hasConfirmed400Rejection(g))return {state:'confirmed_http_400_owner_review_required',eligible:true,
    claim_receipt_id:Number(g.claim.admin_action_audit_id)};
  return {state:'outcome_unknown_or_not_proven_rejected',eligible:false};
}

async function load(context,productId) {
  const admin=verifiedAdminFromModule(context);
  if(!admin)return {error:respond({ok:false,error:'Sign in as a verified administrator.'},401)};
  const db=getDb(context.env);
  if(!db)return {error:respond({ok:false,error:'Database is unavailable.'},503)};
  if(!positive(productId))return {error:respond({ok:false,error:'Save and open an existing Product first.'},400)};
  try{
    const [product,conn,shop,existing,claim,count,rejection,recovery]=await Promise.all([
      db.prepare(productSql).bind(Number(productId)).first(),db.prepare(connSql).first(),db.prepare(shopSql).first(),
      db.prepare(existingSql).bind(String(productId)).first(),db.prepare(claimedSql).bind(String(productId)).first(),
      db.prepare(countSql).bind(String(productId)).first(),db.prepare(rejectionSql).bind(String(productId)).first(),
      db.prepare(recoverySql).bind(String(productId)).first()
    ]);
    if(!product)return {error:respond({ok:false,error:'Product does not exist.'},404)};
    const details=productDraftDetails(product),blockers=[...connectionBlockers(conn,shop,context.env),...details.blockers];
    if(String(product.product_type||'physical')!=='physical')blockers.push('physical_listing_only');
    if(existing?.external_reference)blockers.push('etsy_listing_already_created_for_product');
    const claimCount=Number(count?.total||0);
    const g={admin,db,product,conn,shop,existing,claim,claimCount,rejection,recovery,details,blockers,
      fingerprint:productDraftFingerprint(product,shop,conn)};
    // Only the *first* confirmed HTTP 400 rejection can be manually cleared,
    // and only after a separate audited owner review and live read-only check.
    if(claim&&!(claimCount===1&&recovery&&hasConfirmed400Rejection(g)))blockers.push('previous_etsy_remote_attempt_needs_reconciliation');
    return g;
  }catch{return {error:respond({ok:false,code:'etsy_draft_preflight_unavailable',error:'Etsy draft history could not be checked. No remote action was attempted.'},503)};}
}

async function apiGet(env,conn,path) {
  const token=await decryptOAuthSecret(env,conn.access_token_ciphertext,'oauth-token|etsy|access');
  if(!token)throw Error('etsy_access_token_missing');
  const res=await fetch('https://api.etsy.com/v3/application/'+path,{
    method:'GET',headers:{'Accept':'application/json','x-api-key':String(env.ETSY_API_KEYSTRING)+':'+String(env.ETSY_SHARED_SECRET),'Authorization':'Bearer '+token},redirect:'manual',signal:AbortSignal.timeout(12000)});
  if(res.status>=300&&res.status<400)throw Error('etsy_redirect_rejected');
  if(!res.ok)throw Error('etsy_live_request_http_'+res.status);
  return res.json().catch(()=>({}));
}
async function liveShop(env,conn,shop) {
  const remote=await apiGet(env,conn,'shops/'+encodeURIComponent(String(shop.shop_id)));
  const value=remote?.results?.[0]||remote?.results||remote;
  if(String(value?.shop_id||'')!==String(shop.shop_id)||
     (value?.user_id!=null&&String(value.user_id)!==String(shop.owner_user_id))||
     (value?.currency_code&&String(value.currency_code).toUpperCase()!=='CAD'))throw Error('etsy_live_shop_identity_mismatch');
  return {shop_id:String(shop.shop_id),shop_name:String(value?.shop_name||shop.shop_name||''),currency:'CAD'};
}
async function liveTaxonomy(env,conn){
  const raw=await apiGet(env,conn,'seller-taxonomy/nodes');
  return flattenEtsyTaxonomy(Array.isArray(raw?.results)?raw.results:[]);
}
async function liveOptions(env,conn,shop){
  const root='shops/'+encodeURIComponent(String(shop.shop_id));
  const [taxonomy,shipping,readiness]=await Promise.all([
    liveTaxonomy(env,conn),apiGet(env,conn,root+'/shipping-profiles'),
    apiGet(env,conn,root+'/readiness-state-definitions')]);
  const options=safeEtsyShopOptions(shipping,readiness);
  return {...options,taxonomy};
}
async function liveCanadaOnlyProfile(env,conn,shop,profileId){
  const root='shops/'+encodeURIComponent(String(shop.shop_id))+'/shipping-profiles/'+encodeURIComponent(String(profileId));
  const [profile,destinations]=await Promise.all([
    apiGet(env,conn,root),apiGet(env,conn,root+'/destinations?limit=100')]);
  return canadaOnlyShippingProfile(profile,destinations,profileId);
}
async function checkRemoteEtsyDraftsForProduct(env,conn,shop,product){
  // Read-only, bounded and fail-closed. Etsy supports the state query on shop
  // listings. A matching title must be investigated, even if it predates us.
  const root='shops/'+encodeURIComponent(String(shop.shop_id))+'/listings';
  const title=String(product.name||'').trim().toLowerCase();
  let expected=null,seen=0;
  for(let offset=0;offset<300;offset+=100){
    const batch=await apiGet(env,conn,root+'?state=draft&limit=100&offset='+offset);
    const rows=batch?.results,count=Number(batch?.count);
    if(!Array.isArray(rows)||!Number.isSafeInteger(count)||count<0||count>300||
      (expected!=null&&count!==expected)||rows.length!==Math.min(100,count-offset))
      throw Error('etsy_draft_listing_review_incomplete');
    expected=count;seen+=rows.length;
    if(rows.some(row=>!positive(row?.listing_id)||typeof row?.title!=='string'))
      throw Error('etsy_draft_listing_review_missing_fields');
    const duplicate=rows.find(row=>row.title.trim().toLowerCase()===title);
    if(duplicate)return {clear:false,listing_id:String(duplicate.listing_id),reviewed:seen};
    if(seen===count)return {clear:true,reviewed:seen};
  }
  throw Error('etsy_draft_listing_review_limit');
}
function overview(g) {
  return {source:'stored_state_only',shop:shopDisplay(g.shop),connection_ready:g.blockers.filter(b=>
    !['positive_saved_cad_price_required','positive_inventory_required','product_name_required_max_140',
      'product_description_required_max_15000','physical_listing_only','etsy_listing_already_created_for_product',
      'previous_etsy_remote_attempt_needs_reconciliation'].includes(b)).length===0,
    connection:{status:String(g.conn?.connection_status||'missing'),
      scopes:(()=>{try{const list=JSON.parse(g.conn?.scopes_json||'[]');return Array.isArray(list)?list.filter(x=>['shops_r','listings_r','listings_w'].includes(x)):[];}catch{return [];}})(),
      access_expires_at:g.conn?.access_expires_at||null},
    product:{id:Number(g.product.product_id),name:String(g.product.name||''),price_cents:Number(g.product.price_cents||0),
      quantity:Number(g.product.inventory_quantity||0),description_preview:g.details.description.slice(0,240),
      description_length:g.details.description.length},fingerprint:g.fingerprint,blockers:g.blockers,
    existing_listing:g.existing?.external_reference?{listing_id:String(g.existing.external_reference),status:String(g.existing.status||'')}:null,
    prior_attempt:g.claim?{receipt_id:Number(g.claim.admin_action_audit_id),created_at:g.claim.created_at}:null,
    recovery:recoveryStatus(g)};
}
export async function onRequestGet(context) {
  const g=await load(context,new URL(context.request.url).searchParams.get('product_id'));
  return g.error||respond({...overview(g),remote_etsy_calls_performed:false});
}

export async function onRequestPost(context) {
  let body={};try{body=await context.request.json();}catch{return respond({ok:false,error:'Valid JSON is required.'},400);}
  const action=String(body?.action||'');
  if(!['test_connection','test_shipping','create_draft','reconcile_rejected_draft'].includes(action))return respond({ok:false,error:'Unsupported Etsy Product Editor action.'},400);
  const g=await load(context,body?.product_id);
  if(g.error)return g.error;
  const connectionIssues=connectionBlockers(g.conn,g.shop,context.env);
  if(connectionIssues.length)return respond({ok:false,code:'etsy_connection_not_ready',blockers:connectionIssues,
    error:'Etsy connection is not usable yet. Refresh the connection or reconnect Etsy, then test again.'},409);
  if(action==='test_connection'){
    try{
      const shop=await liveShop(context.env,g.conn,g.shop);
      const options=await liveOptions(context.env,g.conn,g.shop);
      if(!options.taxonomy.length)return respond({ok:false,code:'etsy_taxonomy_empty',error:'Etsy shop responded, but seller categories were unavailable. No draft created.'},502);
      return respond({...overview(g),shop,options,live_connection_verified:true,remote_request_type:'GET_ONLY',remote_draft_created:false});
    }catch(error){return respond({ok:false,code:'etsy_live_test_failed',diagnostic:String(error.message||'').slice(0,90),
      error:'Live Etsy shop, category or profile verification failed. No draft was created.'},502);}
  }
  if(action==='test_shipping'){
    if(!positive(body.shipping_profile_id))return respond({ok:false,code:'etsy_shipping_profile_required',error:'Choose a shipping profile to verify.'},400);
    try{
      const shop=await liveShop(context.env,g.conn,g.shop);
      const shipping=await apiGet(context.env,g.conn,'shops/'+encodeURIComponent(shop.shop_id)+'/shipping-profiles');
      if(!safeEtsyShopOptions(shipping,{results:[]}).shipping.some(x=>x.id===Number(body.shipping_profile_id)))
        return respond({ok:false,code:'etsy_shipping_profile_missing',error:'The selected shipping profile is not available for this shop.'},409);
      const verified=await liveCanadaOnlyProfile(context.env,g.conn,shop,body.shipping_profile_id);
      return respond({shipping_profile_verified:verified.allowed,shipping_review:verified,
        remote_request_type:'GET_ONLY',remote_draft_created:false});
    }catch(error){return respond({ok:false,code:'etsy_shipping_inspection_failed',diagnostic:String(error.message||'').slice(0,90),
      error:'Etsy shipping destinations could not be verified. No draft created.'},502);}
  }
  if(action==='reconcile_rejected_draft'){
    if(body?.confirm_etsy_drafts_checked!==true||body?.confirm_no_matching_draft!==true)
      return respond({ok:false,code:'etsy_owner_draft_review_required',
        error:'Open Etsy Drafts and confirm that no matching draft exists before requesting recovery.'},400);
    if(!hasConfirmed400Rejection(g)||g.recovery)
      return respond({ok:false,code:'etsy_recovery_not_eligible',
        error:'Only one matching, confirmed HTTP 400 provider rejection can be reconciled. Unknown outcomes remain on HOLD.'},409);
    let review;
    try{
      const shop=await liveShop(context.env,g.conn,g.shop);
      review=await checkRemoteEtsyDraftsForProduct(context.env,g.conn,shop,g.product);
    }catch(error){return respond({ok:false,code:'etsy_remote_drafts_review_incomplete',diagnostic:String(error.message||'').slice(0,90),
      error:'Could not check the full live Etsy Drafts list. Recovery stays on HOLD; no listing was created.'},502);}
    if(!review.clear)return respond({ok:false,code:'etsy_matching_remote_draft_found',listing_id:review.listing_id,
      error:'Etsy already contains a draft with this Product title. Review that listing; a duplicate will not be created.'},409);
    const claimKey=auditDetails(g.claim).request_key;
    const details=JSON.stringify({build:442,claim_receipt_id:Number(g.claim.admin_action_audit_id),
      rejected_receipt_id:Number(g.rejection.admin_action_audit_id),original_request_key:claimKey,
      original_provider_http_status:400,etsy_draft_count_reviewed:review.reviewed,
      owner_checked_no_matching_draft:true,remote_request_type:'GET_ONLY',
      one_final_manual_attempt_authorized:true,automatic_retry:false,publication_allowed:false});
    try{
      const record=await g.db.prepare("INSERT INTO admin_action_audit "+
        "(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) "+
        "SELECT ?,'etsy_product_editor_rejected_attempt_reconciled','product',?,'POST',?,?,CURRENT_TIMESTAMP "+
        "WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_product_editor_rejected_attempt_reconciled' AND target_type='product' AND target_key=?) "+
        "AND (SELECT COUNT(*) FROM admin_action_audit WHERE action_type='etsy_product_editor_draft_claimed' AND target_type='product' AND target_key=?)=1 "+
        "AND EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_product_editor_draft_rejected' AND target_type='product' AND target_key=? "+
        "AND json_extract(details_json,'$.request_key')=? AND json_extract(details_json,'$.provider_http_status')=400) "+
        "AND NOT EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND product_id=? AND external_reference IS NOT NULL)")
        .bind(g.admin.user_id,String(body.product_id),new URL(context.request.url).pathname,details,
          String(body.product_id),String(body.product_id),String(body.product_id),claimKey,String(body.product_id)).run();
      if(Number(record?.meta?.changes||0)!==1)return respond({ok:false,code:'etsy_recovery_claim_conflict',
        error:'The previous Etsy attempt changed during review. Recovery stays on HOLD.'},409);
    }catch{return respond({ok:false,code:'etsy_recovery_receipt_unconfirmed',
      error:'Could not record the owner reconciliation. The Etsy attempt remains on HOLD.'},503);}
    return respond({reconciled:true,remote_draft_created:false,etsy_drafts_reviewed:review.reviewed,
      one_final_manual_attempt_available:true,
      message:'Owner reconciliation was recorded. Test the connection again and explicitly review one final draft attempt.'});
  }
  const input=safeEtsyDraftInput(body);
  if(!input)return respond({ok:false,code:'etsy_missing_or_invalid_parcel',
    error:'Enter positive packaged weight, length, width and height with valid units. Confirm one unpublished draft and Canada-only delivery.'},400);
  if(g.blockers.length||g.fingerprint!==input.fingerprint)return respond({ok:false,code:'etsy_product_or_connection_changed',
    blockers:g.blockers,error:'Saved Product, Etsy connection or previous draft history changed. Test connection again before creating a draft.'},409);
  let shop,options,shippingReview;
  try{
    shop=await liveShop(context.env,g.conn,g.shop);
    options=await liveOptions(context.env,g.conn,g.shop);
    if(!options.shipping.some(x=>x.id===input.shipping_profile_id)||
       !options.readiness.some(x=>x.id===input.readiness_state_id)||
       !options.taxonomy.some(x=>x.id===input.taxonomy_id))
      return respond({ok:false,code:'etsy_selected_options_stale',
        error:'Etsy did not confirm the category, shipping and processing profiles. Test connection again.'},409);
    shippingReview=await liveCanadaOnlyProfile(context.env,g.conn,shop,input.shipping_profile_id);
    if(!shippingReview.allowed)return respond({ok:false,code:'etsy_shipping_not_canada_only',
      error:shippingReview.reason+' Select a strictly Canada-only Etsy shipping profile; no draft was attempted.'},409);
    if(g.claim&&g.recovery){
      // The next click is manual, never a background retry. Recheck again
      // immediately before claiming to catch new matching Etsy drafts.
      const review=await checkRemoteEtsyDraftsForProduct(context.env,g.conn,shop,g.product);
      if(!review.clear)return respond({ok:false,code:'etsy_matching_remote_draft_found',listing_id:review.listing_id,
        error:'Etsy now has a draft matching this Product title. No duplicate attempt was made.'},409);
    }
  }catch(error){
    return respond({ok:false,code:'etsy_prewrite_live_check_failed',diagnostic:String(error.message||'').slice(0,90),
      error:'Etsy could not be verified immediately before writing. No draft was attempted.'},502);
  }
  const draftId=crypto.randomUUID();
  // D1 claim is a one-time per-Product fence against double clicks, race conditions,
  // unknown provider outcomes and duplicate remote listings. No retry after claim.
  const claimDetails=JSON.stringify({build:442,request_key:input.request_key,product_id:input.product_id,
    local_draft_id:draftId,shop_id:shop.shop_id,price_cents:g.details.price_cents,quantity:g.details.quantity,
    taxonomy_id:input.taxonomy_id,shipping_profile_id:input.shipping_profile_id,
    parcel:input.parcel,prior_reconciliation_receipt_id:g.recovery?.admin_action_audit_id||null,
    readiness_state_id:input.readiness_state_id,shipping_destinations_checked:shippingReview.destinations,
    listing_state_requested:'draft',automatic_retry:false,
    publication_allowed:false,us_shipping_unchanged:true});
  try{
    const claim=await g.db.prepare("INSERT INTO admin_action_audit "+
      "(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) "+
      "SELECT ?,'etsy_product_editor_draft_claimed','product',?,'POST',?,?,CURRENT_TIMESTAMP "+
      "WHERE ((SELECT COUNT(*) FROM admin_action_audit WHERE action_type='etsy_product_editor_draft_claimed' AND target_type='product' AND target_key=?)=0 "+
      "OR ((SELECT COUNT(*) FROM admin_action_audit WHERE action_type='etsy_product_editor_draft_claimed' AND target_type='product' AND target_key=?)=1 "+
      "AND EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_product_editor_rejected_attempt_reconciled' AND target_type='product' AND target_key=?))) "+
      "AND NOT EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND product_id=? AND external_reference IS NOT NULL) "+
      "AND EXISTS (SELECT 1 FROM products WHERE product_id=? AND name=? AND COALESCE(description,'')=? AND COALESCE(short_description,'')=? AND price_cents=? AND currency='CAD' AND inventory_quantity=?)")
      .bind(g.admin.user_id,String(input.product_id),new URL(context.request.url).pathname,claimDetails,
        String(input.product_id),String(input.product_id),String(input.product_id),String(input.product_id),input.product_id,g.product.name,
        String(g.product.description||''),String(g.product.short_description||''),g.details.price_cents,g.details.quantity).run();
    if(Number(claim?.meta?.changes||0)!==1)return respond({ok:false,code:'etsy_single_attempt_claim_conflict',
      error:'This Product has already been claimed or changed. Inspect Etsy draft history before trying another listing.'},409);
  }catch{return respond({ok:false,code:'etsy_claim_unconfirmed',error:'Could not reserve a safe Etsy attempt. No provider write was started.'},503);}
  let response,remote;
  try{
    const token=await decryptOAuthSecret(context.env,g.conn.access_token_ciphertext,'oauth-token|etsy|access');
    if(!token)throw Error('etsy_token_unavailable_after_claim');
    response=await fetch('https://api.etsy.com/v3/application/shops/'+encodeURIComponent(shop.shop_id)+'/listings',{
      method:'POST',headers:{'Accept':'application/json','Content-Type':'application/x-www-form-urlencoded',
        'x-api-key':String(context.env.ETSY_API_KEYSTRING)+':'+String(context.env.ETSY_SHARED_SECRET),
        'Authorization':'Bearer '+token},body:etsyDraftForm(input,g.details),redirect:'manual',signal:AbortSignal.timeout(12000)});
    if(response.status>=300&&response.status<400)throw Error('etsy_redirect_rejected');
    remote=await response.json().catch(()=>null);
  }catch{return respond({ok:false,code:'etsy_attempt_outcome_unknown',
    error:'Etsy draft request could not be confirmed. We will not retry automatically; inspect Etsy Drafts first.'},502);}
  if(!response.ok){
    try{await auditAdminAction(context.env,context.request,g.admin,{action_type:'etsy_product_editor_draft_rejected',
      target_type:'product',target_key:String(input.product_id),details:{build:442,provider_http_status:response.status,
        request_key:input.request_key,provider_message:String(remote?.error||remote?.error_description||'').slice(0,300),
        listing_state_requested:'draft'}});}catch{}
    return respond({ok:false,code:'etsy_provider_rejected_draft',provider_http_status:response.status,
    provider_message:String(remote?.error||remote?.error_description||'').slice(0,180),
    error:'Etsy rejected the draft request. The attempt is held for review; do not retry automatically.'},409);
  }
  if(!positive(remote?.listing_id)||String(remote.state||'').toLowerCase()!=='draft')return respond({ok:false,
    code:'etsy_unexpected_draft_response',error:'Etsy did not confirm an unpublished draft. Inspect Etsy before another attempt.'},409);
  const listingId=String(remote.listing_id);
  try{
    const payload={title:g.details.title,description:g.details.description,currency:'CAD',parcel:input.parcel,
      price_cents:g.details.price_cents,quantity:g.details.quantity,request_key:input.request_key,
      remote_etsy_draft_created:true,publication_performed:false,shipping_profile_attached:true,
      shipping_profile_id:input.shipping_profile_id,readiness_state_id:input.readiness_state_id,
      canada_only_shipping_verified:true,taxonomy_id:input.taxonomy_id,who_made:input.who_made,
      when_made:input.when_made,is_supply:input.is_supply};
    await g.db.prepare("INSERT INTO marketplace_syndication_drafts "+
      "(id,channel_key,product_id,draft_title,payload_json,status,external_reference,publication_requested,created_by,created_at,updated_at) "+
      "VALUES (?,'etsy',?,?,?,?,?,0,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)")
      .bind(draftId,String(input.product_id),g.details.title,JSON.stringify(payload),'needs_review',listingId,
        String(g.admin.email||'admin')).run();
    const saved=await g.db.prepare("SELECT external_reference FROM marketplace_syndication_drafts WHERE id=? AND channel_key='etsy' LIMIT 1").bind(draftId).first();
    if(String(saved?.external_reference||'')!==listingId)throw Error('etsy_receipt_readback_missing');
    await auditAdminAction(context.env,context.request,g.admin,{action_type:'etsy_product_editor_draft_created',
      target_type:'product',target_key:String(input.product_id),details:{build:442,draft_id:draftId,
        listing_id:listingId,shop_id:shop.shop_id,shipping_profile_id:input.shipping_profile_id,
        readiness_state_id:input.readiness_state_id,state:'draft',publication_performed:false}});
  }catch{return respond({ok:false,code:'etsy_remote_created_local_record_unconfirmed',listing_id:listingId,
    error:'Etsy confirmed the draft, but our local receipt could not be verified. Save this Etsy listing ID; do not retry.'},503);}
  return respond({created:true,listing_id:listingId,listing_state:'draft',local_draft_id:draftId,
    shop_id:shop.shop_id,remote_draft_created:true,no_auto_retry:true,product_changed:false,
    us_shipping_unchanged:true,canada_only_shipping_verified:true,images_uploaded:false});
}
