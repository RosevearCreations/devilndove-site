/* Build 504: independent readback and explicit LOCAL owner approval receipt.
 * Never creates, updates, publishes or retries an Etsy listing or image. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {readCanonicalDistributionGallery} from '../_lib/canonicalDistributionGallery436.mjs';
import {imageReady} from '../_lib/productEtsyImages443.mjs';
import {readOverride499,effectiveEtsyTags499} from '../_lib/channelTagOverrides499.mjs';
import {preparedEtsyTags497,tagsMatch497} from '../_lib/etsyNativeTags497.mjs';
import {readExistingDraftLocal486,existingDraftCredentials486,verifyExistingDraft486,readEtsy486} from './product-etsy-existing-draft.js';
import {assessOwnerApproval504} from '../_lib/etsyOwnerApproval504.mjs';
import {evidencePacket508,fingerprint508} from '../_lib/etsyCloseout508.mjs';
import {sourcePhotoSnapshot509} from '../_lib/etsyIndependent509.mjs';
const respond=(value,status=200)=>jsonResponse({ok:status<400,build:504,publication_performed:false,provider_modified:false,automatic_retry:false,...value},status,{'Cache-Control':'no-store'});
const valid=x=>/^[1-9]\d{0,14}$/.test(String(x??''))&&Number.isSafeInteger(Number(x));
const uuid=x=>/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(String(x||''));
const parse=row=>{try{return JSON.parse(row?.details_json||'{}');}catch{return {};}};
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);return !admin?{error:respond({error:'Verified administrator required.'},401)}:!db?{error:respond({error:'Product database unavailable.'},503)}:{admin,db};}
export async function reviewOwnerEtsy504(c,db,id){
  const s=await readExistingDraftLocal486(db,id),listingId=String(s.draft?.external_reference||'');
  if(!s.product||!valid(listingId))return {ready:false,issues:['Step 1: link Product #'+id+' to its existing Etsy draft before checking photos.'],listing_id:null};
  const headers=await existingDraftCredentials486(c.env,s);
  const listing=await verifyExistingDraft486(c.env,s,listingId,headers);
  const [galleryResult,receiptResult,seo,remoteResult]=await Promise.all([
    readCanonicalDistributionGallery(db,id),
    db.prepare("SELECT details_json FROM admin_action_audit WHERE action_type IN ('etsy_product_editor_image_443_accepted','etsy_505_owner_existing_image_matched') AND target_type='product' AND target_key=? ORDER BY admin_action_audit_id ASC LIMIT 60").bind(String(id)).all(),
    db.prepare('SELECT keywords FROM product_seo WHERE product_id=? LIMIT 1').bind(id).first(),
    readEtsy486('listings/'+encodeURIComponent(listingId)+'/images',headers)
  ]);
  const override=await readOverride499(db,id,'etsy');
  const tags=override?effectiveEtsyTags499(seo?.keywords,override):preparedEtsyTags497(seo?.keywords);
  const gallery=(galleryResult.images||[]).filter(imageReady).slice(0,20);
  const accepted=(receiptResult.results||[]).map(parse);
  const remoteImages=Array.isArray(remoteResult?.results)?remoteResult.results:[];
  const summary=assessOwnerApproval504({product:s.product,listing,gallery,accepted,
    remoteImages,tagsReady:tags.ready&&Array.isArray(listing.tags)&&tagsMatch497(tags.tags,listing.tags),
    expected:id===53?[344,345,346]:gallery.map(x=>Number(x.product_image_id))});
  const packet=evidencePacket508({product:s.product,listing,gallery,remoteImages,accepted,tags:tags.tags||[]});
  const evidenceFingerprint=await fingerprint508(packet);
  const liveIds=new Set(remoteImages.map(row=>String(row.listing_image_id)));
  const pairs=accepted.filter(row=>row.verified_remote_readback===true&&String(row.listing_id)===listingId&&liveIds.has(String(row.etsy_image_id)))
    .map(row=>({product_image_id:Number(row.product_image_id),etsy_image_id:String(row.etsy_image_id)}));
  const freshness=sourcePhotoSnapshot509({gallery,remoteImages,accepted,listingId,
    expected:id===53?[344,345,346]:gallery.map(x=>Number(x.product_image_id))});
  return {...summary,product_id:id,listing_id:listingId,verified_unpublished:true,verified_canada_only:true,
    publication_performed:false,category_taxonomy_id:Number(listing.taxonomy_id||0),title:String(listing.title||''),price_currency:String(listing.price?.currency_code||''),quantity:Number(listing.quantity||0),
    evidence_fingerprint_508:evidenceFingerprint,verified_media_pairs_508:pairs,photo_freshness_509:freshness};
}
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
  const id=new URL(c.request.url).searchParams.get('product_id');if(!valid(id))return respond({error:'Saved Product required.'},400);
  try{return respond(await reviewOwnerEtsy504(c,g.db,Number(id)));}
  catch(error){return respond({error:'Could not independently verify the Etsy listing/photos: '+String(error?.message||'remote read unavailable').slice(0,170),no_etsy_changes:true},409);}
}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
  if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return respond({error:'Same-origin owner approval required.'},403);
  let b;try{b=await c.request.json();}catch{return respond({error:'JSON required.'},400);}
  if(b?.action!=='approve_verified_draft'||!valid(b?.product_id)||!valid(b?.listing_id)||!uuid(b?.request_key)||
    b?.confirm_actual_etsy_content!==true||b?.confirm_canada_only!==true||b?.confirm_unpublished_only!==true)
    return respond({error:'An exact listing ID, a unique request key, and explicit owner content/shipping approval are required.'},400);
  try{
    const result=await reviewOwnerEtsy504(c,g.db,Number(b.product_id));
    if(!result.ready||(Number(b.product_id)===53&&!result.photo_freshness_509?.ready)||result.listing_id!==String(b.listing_id))return respond({error:'Final approval is on HOLD until the same Etsy draft, Product details, tags and each original photo/source URL match independent readback.',review:result},409);
    const claim=await g.db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,'etsy_504_owner_final_content_approved','product',?,'POST',?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_504_owner_final_content_approved' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.request_key')=?) AND EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND product_id=? AND external_reference=?)")
      .bind(g.admin.user_id,String(b.product_id),new URL(c.request.url).pathname,JSON.stringify({build:504,request_key:b.request_key,product_id:Number(b.product_id),listing_id:result.listing_id,confirmed_photo_ids:result.confirmed_photo_ids,category_taxonomy_id:result.category_taxonomy_id,evidence_fingerprint_508:result.evidence_fingerprint_508,publication_performed:false}),String(b.product_id),b.request_key,Number(b.product_id),result.listing_id).run();
    if(Number(claim.meta?.changes)!==1)return respond({error:'Owner approval may already be recorded. Refresh the evidence before another attempt.',review:result},409);
    return respond({owner_approval_recorded:true,listing_id:result.listing_id,confirmed_photo_ids:result.confirmed_photo_ids,message:'Final owner content approval recorded locally. Etsy draft remains unpublished.'});
  }catch(error){return respond({error:'Final Etsy owner approval not confirmed: '+String(error?.message||'readback unavailable').slice(0,170)},409);}
}
