// Build 443 — one explicitly requested, approved canonical Product image per call.
// No publication, provider retry, arbitrary URL fetch, or cross-product media transfer.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {decryptOAuthSecret} from '../_lib/oauthSecurity.js';
import {connectionBlockers} from '../_lib/etsyDraftTrial399.mjs';
import {readCanonicalDistributionGallery} from '../_lib/canonicalDistributionGallery436.mjs';
import {approvedR2Key,checkedEtsyBytes,completedImageIds,confirmedEtsyImageReadback497,imageReady,MAX_ETSY_IMAGE_BYTES} from '../_lib/productEtsyImages443.mjs';
import {assessExistingDraftPhotoGap492} from '../_lib/etsyPhotoGap492.mjs';
import {verifyExistingDraft486,linkedReceipt506} from './product-etsy-existing-draft.js';

const respond=(value,status=200)=>jsonResponse({ok:status<400,build:443,publication_performed:false,
  automatic_retry:false,shipping_modified:false,...value},status,{'Cache-Control':'no-store'});
const validId=x=>/^[1-9]\d{0,14}$/.test(String(x??''))&&Number.isSafeInteger(Number(x));
const requestKey=x=>/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(String(x||''));
const recordKey=(productId,imageId)=>`${productId}:${imageId}`;
const bucket=env=>env.PRODUCT_MEDIA_BUCKET||env.MEDIA_BUCKET||env.R2_PRODUCT_MEDIA||null;
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);
  return !admin?{error:respond({error:'Active administrator access required.'},401)}:
    !db?{error:respond({error:'D1 unavailable.'},503)}:{admin,db};}
// Build 515: the listing-ID receipt UI already uses D1 first-primary. The
// gallery-read endpoint must read the same primary authority, or a recent
// legitimate link can appear missing here even while it is confirmed in the
// Product identity view. This does not turn stale/foreign media into proof.
const currentDb=db=>typeof db.withSession==='function'?db.withSession('first-primary'):db;
function details(row){try{return JSON.parse(row?.payload_json||'{}');}catch{return {};}}
async function source(db,id,env={}){
  const [product,draft,gallery,accepted]=await Promise.all([
    db.prepare('SELECT product_id,name,status FROM products WHERE product_id=? LIMIT 1').bind(id).first(),
    db.prepare("SELECT id,product_id,external_reference,payload_json,status FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND product_id=? AND external_reference IS NOT NULL ORDER BY updated_at DESC LIMIT 1").bind(id).first(),
    readCanonicalDistributionGallery(db,id),
    db.prepare("SELECT details_json FROM admin_action_audit WHERE action_type IN ('etsy_product_editor_image_443_accepted','etsy_505_owner_existing_image_matched') AND target_type='product' AND target_key=? ORDER BY admin_action_audit_id ASC LIMIT 30").bind(String(id)).all()
  ]);
  const receiptRows=accepted?.results||[],done=completedImageIds(receiptRows);
  const images=(gallery?.images||[]).filter(imageReady).slice(0,10).map(row=>({
    product_image_id:Number(row.product_image_id),alt_text:String(row.alt_text||'').trim(),
    image_url:row.image_url,transferred:done.has(Number(row.product_image_id)),
    transferable:!!approvedR2Key(row.image_url,id,env)
  }));
  const claimResult=await db.prepare("SELECT target_key FROM admin_action_audit WHERE action_type='etsy_product_editor_image_443_claimed' AND target_type='product' AND target_key LIKE ? ORDER BY admin_action_audit_id ASC LIMIT 11").bind(`${id}:%`).all();
  const claimed=new Set((claimResult?.results||[]).map(row=>String(row.target_key)));
  return {product,draft,payload:details(draft),images,done,receiptRows,claimed};
}
// Build 516: a Product's uniquely saved numeric Etsy ID must not disappear
// because an older *media* or shipping snapshot lacks a verification flag.
// These flags are not authorization: every provider write checks the live
// unpublished listing and its Canada-only shipping profile below.
function localView(s){const linked=validId(s.draft?.external_reference);
  const outstanding=[...s.claimed].filter(key=>!s.done.has(Number(key.split(':')[1])));
  return {product_id:Number(s.product?.product_id||0),listing_id:linked?String(s.draft.external_reference):null,
    listing_status:linked?'UNPUBLISHED_DRAFT_RECORDED':'NO_VERIFIED_ETSY_DRAFT',
    local_canada_only_receipt:s.payload?.canada_only_shipping_verified===true,
    images:s.images.map(im=>({...im,hold:outstanding.length>0})),
    hold_unconfirmed_claims:outstanding.length,
    transferred:s.images.filter(im=>im.transferred).length,
    pending:s.images.filter(im=>!im.transferred&&!s.claimed.has(recordKey(s.product.product_id,im.product_image_id))).length,
    provider_contacted:false,publication_allowed:false};}
export function reconcileEtsyPhotoInventory487(remote,receipts){
  if(!Array.isArray(remote)||!Array.isArray(receipts)||!remote.every(row=>validId(row?.listing_image_id)))return {ready:false,reason:'etsy_image_inventory_unverified',remote_count:null,tracked_count:receipts?.length||0};
  const remoteIds=new Set(remote.map(row=>String(row.listing_image_id)));
  const trackedIds=new Set(receipts.map(row=>String(row.etsy_image_id||'')));
  const untracked=[...remoteIds].filter(id=>!trackedIds.has(id));
  const missing=[...trackedIds].filter(id=>!remoteIds.has(id));
  return {ready:untracked.length===0&&missing.length===0,reason:untracked.length?'existing_etsy_photos_need_manual_reconciliation':missing.length?'tracked_photo_missing_from_etsy':'matched',remote_count:remoteIds.size,tracked_count:trackedIds.size,untracked_count:untracked.length,missing_count:missing.length};
}
async function authorized(c,db){
  const [conn,shop]=await Promise.all([
    // connectionBlockers must see the OAuth account ID to compare it with Etsy's shop owner.
    db.prepare("SELECT remote_subject_id,connection_status,scopes_json,access_expires_at,access_token_ciphertext FROM oauth_provider_connections WHERE provider_key='etsy' LIMIT 1").first(),
    db.prepare("SELECT shop_id,owner_user_id,shop_name,currency_code,acceptance_status FROM etsy_oauth_shop_connections WHERE provider_key='etsy' LIMIT 1").first()
  ]);
  const blockers=connectionBlockers(conn,shop,c.env);let scopes=[];
  try{scopes=JSON.parse(conn?.scopes_json||'[]');}catch{}
  if(!Array.isArray(scopes)||!scopes.includes('listings_w')||!scopes.includes('listings_r'))blockers.push('etsy_image_scopes_missing');
  if(blockers.length)return {error:respond({error:'Etsy connection or scopes are not ready.',blockers},409)};
  const token=await decryptOAuthSecret(c.env,conn.access_token_ciphertext,'oauth-token|etsy|access');
  if(!token)return {error:respond({error:'Etsy token unavailable.'},409)};
  return {shop,headers:{'Accept':'application/json','x-api-key':String(c.env.ETSY_API_KEYSTRING)+':'+String(c.env.ETSY_SHARED_SECRET),
    'Authorization':'Bearer '+token}};
}
async function getEtsy(path,headers){const r=await fetch('https://api.etsy.com/v3/application/'+path,
  {headers,redirect:'manual',signal:AbortSignal.timeout(12000)});
  if(!r.ok||r.status>=300)throw Error('etsy_read_http_'+r.status);
  return r.json();}
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
  const id=new URL(c.request.url).searchParams.get('product_id');
  if(!validId(id))return respond({error:'Choose a saved Product.'},400);
  try{const s=await source(currentDb(g.db),Number(id),c.env);
    if(!s.product)return respond({error:'Product not found.'},404);
    const local=localView(s);
    if(local.listing_id){const claim=await linkedReceipt506(g.db,Number(id),local.listing_id);
      if(!claim.confirmed)return respond({...local,listing_id:null,listing_status:'AMBIGUOUS_PRIMARY_LISTING_CLAIM',
        remote_reconciliation:{ready:false,reason:claim.claim_state},provider_contacted:false});}
    if(new URL(c.request.url).searchParams.get('reconcile')!=='1')return respond(local);
    if(!local.listing_id)return respond({...local,remote_reconciliation:{ready:false,reason:'link_existing_draft_first'},provider_contacted:false});
    const a=await authorized(c,g.db);if(a.error)return a.error;
    const [listing,remoteImages]=await Promise.all([
      verifyExistingDraft486(c.env,{shop:a.shop},local.listing_id,a.headers),
      getEtsy('listings/'+encodeURIComponent(local.listing_id)+'/images',a.headers)]);
    if(String(listing?.listing_id)!==local.listing_id||String(listing?.shop_id)!==String(a.shop.shop_id)||String(listing?.state).toLowerCase()!=='draft')
      return respond({...local,remote_reconciliation:{ready:false,reason:'original_etsy_draft_identity_or_state_changed'},provider_contacted:true});
    let receipts=[];try{receipts=s.receiptRows.map(row=>JSON.parse(row.details_json))}catch{}
    const foreign=receipts.some(row=>String(row.listing_id||'')!==local.listing_id);
    const comparison=foreign?{ready:false,reason:'receipt_listing_identity_changed'}:
      reconcileEtsyPhotoInventory487(remoteImages?.results,receipts);
    return respond({...local,remote_reconciliation:comparison,
      photo_gap_492:foreign?{state:'hold',reason:'receipt_listing_identity_changed',provider_write_allowed:false}:
        assessExistingDraftPhotoGap492(remoteImages?.results,receipts,s.images,s.claimed,id),provider_contacted:true});
  }catch{return respond({error:'Canonical Etsy media readiness is temporarily unavailable.'},503);}}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
  if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return respond({error:'Same-origin required for Etsy photo transfer.'},403);
  let b;try{b=await c.request.json();}catch{return respond({error:'JSON required.'},400);}
  if(b?.action!=='transfer_one'||!validId(b?.product_id)||!validId(b?.product_image_id)||
    !requestKey(b?.request_key)||b?.confirm_approved_media!==true||b?.confirm_unpublished_only!==true||
    b?.confirm_canada_only!==true)return respond({error:'Explicit media, Canada-only and unpublished-only approval required.'},400);
  const id=Number(b.product_id),imageId=Number(b.product_image_id),key=recordKey(id,imageId);
  try{
    const s=await source(currentDb(g.db),id,c.env);
    if(!s.product||!validId(s.draft?.external_reference)||s.payload?.publication_performed===true)
      return respond({error:'Only a verified, unpublished Canada-only Etsy Product draft may receive images. Link the exact saved listing ID first.'},409);
    const claimProof=await linkedReceipt506(g.db,id,String(s.draft.external_reference));
    if(!claimProof.confirmed)return respond({error:'The Etsy draft ID does not have one unique Product claim on the D1 primary. No upload attempted.',claim_state:claimProof.claim_state},409);
    const selected=s.images.find(im=>im.product_image_id===imageId);
    if(!selected||!selected.transferable)return respond({error:'Select an approved, >=800px JPEG/PNG image from our Product gallery in R2.'},409);
    if(s.claimed.has(key)||selected.transferred)return respond({error:'This photo was previously attempted or uploaded. Inspect Etsy; never retry blindly.'},409);
    if([...s.claimed].some(claimed=>!s.done.has(Number(claimed.split(':')[1]))))
      return respond({error:'An earlier Product image upload has not been reconciled. Review Etsy before transferring any other image.'},409);
    const a=await authorized(c,g.db);if(a.error)return a.error;
    const listingId=String(s.draft.external_reference);
    const [listing,remoteImages]=await Promise.all([
      verifyExistingDraft486(c.env,{shop:a.shop},listingId,a.headers),
      getEtsy('listings/'+encodeURIComponent(listingId)+'/images',a.headers)
    ]);
    if(String(listing?.listing_id||'')!==listingId||String(listing?.shop_id||'')!==String(a.shop.shop_id)||
      String(listing?.state||'').toLowerCase()!=='draft')return respond({error:'Etsy listing is not our live unpublished draft. Nothing transferred.'},409);
    const remote=remoteImages?.results;
    let receipts=[];try{receipts=s.receiptRows.map(row=>JSON.parse(row.details_json));}catch{}
    const comparison=receipts.some(row=>String(row.listing_id||'')!==listingId)?
      {ready:false,reason:'receipt_listing_identity_changed'}:reconcileEtsyPhotoInventory487(remote,receipts);
    if(!comparison.ready)return respond({error:'Etsy photo inventory is not fully reconciled. Review the original draft manually; never overwrite or duplicate existing photos.',remote_reconciliation:comparison},409);
    const r2=bucket(c.env),objectKey=approvedR2Key(selected.image_url,id,c.env);
    if(!r2?.get||!objectKey)return respond({error:'Approved image R2 source unavailable.'},503);
    const object=await r2.get(objectKey);
    if(!object||Number(object.size||0)>MAX_ETSY_IMAGE_BYTES)return respond({error:'Approved original image missing or too large (8 MiB max).'},409);
    const bytes=await object.arrayBuffer(),checked=checkedEtsyBytes(object.httpMetadata?.contentType,bytes);
    if(!checked)return respond({error:'Only original JPEG/PNG images under 8 MiB can be sent. Convert or replace this gallery image first.'},409);
    // This INSERT is the durable at-most-once fence. An uncertain outcome remains held.
    const claim=await g.db.prepare("INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,'etsy_product_editor_image_443_claimed','product',?,'POST',?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_product_editor_image_443_claimed' AND target_type='product' AND target_key=?) AND (SELECT COUNT(*) FROM admin_action_audit WHERE action_type='etsy_product_editor_image_443_claimed' AND target_type='product' AND target_key LIKE ?)=(SELECT COUNT(*) FROM admin_action_audit WHERE action_type='etsy_product_editor_image_443_accepted' AND target_type='product' AND target_key=?) AND EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE id=? AND channel_key='etsy' AND product_id=? AND external_reference=?)")
      .bind(g.admin.user_id,key,new URL(c.request.url).pathname,JSON.stringify({build:443,product_id:id,product_image_id:imageId,listing_id:listingId,request_key:b.request_key,automatic_retry:false,publication_performed:false}),key,`${id}:%`,String(id),s.draft.id,id,listingId).run();
    if(Number(claim?.meta?.changes||0)!==1)return respond({error:'Another image transfer was claimed. Inspect Etsy before continuing.'},409);
    const form=new FormData();form.set('image',new Blob([bytes],{type:checked.type}),`product-${id}-image-${imageId}.${checked.extension}`);
    form.set('rank',String(remote.length+1));form.set('overwrite','false');form.set('is_watermarked','false');
    form.set('alt_text',selected.alt_text.slice(0,500));
    let provider,result;
    try{provider=await fetch('https://api.etsy.com/v3/application/shops/'+encodeURIComponent(String(a.shop.shop_id))+
      '/listings/'+encodeURIComponent(listingId)+'/images',{method:'POST',headers:a.headers,body:form,
        redirect:'manual',signal:AbortSignal.timeout(15000)});
      result=await provider.json().catch(()=>null);
    }catch{return respond({error:'Etsy upload outcome unknown. Check Etsy Drafts; never retry this photo automatically.'},502);}
    if(provider.status!==201||String(result?.listing_id)!==listingId||!validId(result?.listing_image_id))
      return respond({error:'Etsy did not confirm the image. Manual reconciliation required; no retry.',provider_http_status:provider.status},409);
    let verifiedPhotos;
    try{verifiedPhotos=await getEtsy('listings/'+encodeURIComponent(listingId)+'/images',a.headers);}catch{
      return respond({error:'Etsy accepted a photo but the live readback was unavailable. Outcome held; never resend automatically.'},502);
    }
    if(!confirmedEtsyImageReadback497(verifiedPhotos,listingId,result.listing_image_id))
      return respond({error:'Etsy photo ID was not present on the verified draft readback. Outcome held for manual review.'},409);
    await g.db.prepare("INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) VALUES (?,'etsy_product_editor_image_443_accepted','product',?,'POST',?,?,CURRENT_TIMESTAMP)")
      .bind(g.admin.user_id,String(id),new URL(c.request.url).pathname,JSON.stringify({build:443,product_id:id,product_image_id:imageId,
        listing_id:listingId,etsy_image_id:String(result.listing_image_id),verified_remote_readback:true,
        publication_performed:false,automatic_retry:false})).run();
    return respond({product_id:id,listing_id:listingId,product_image_id:imageId,etsy_image_id:String(result.listing_image_id),
      uploaded:true,verified_remote_readback:true,message:'Etsy confirmed this approved image, and its ID was verified on the unpublished draft. No publication.'});
  }catch{return respond({error:'Image result not fully confirmed. Inspect the Etsy draft and audit receipt before another action.'},503);}
}
