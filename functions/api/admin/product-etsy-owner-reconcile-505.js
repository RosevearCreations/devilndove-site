/* Build 505: optional, explicit owner-witnessed LOCAL Etsy claim and photo reconciliation.
 * All Etsy network activity is GET-only. Never creates, deletes, uploads or publishes. */
import {getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {readCanonicalDistributionGallery} from '../_lib/canonicalDistributionGallery436.mjs';
import {imageReady} from '../_lib/productEtsyImages443.mjs';
import {readExistingDraftLocal486,existingDraftCredentials486,verifyExistingDraft486,readEtsy486,claimedListing505} from './product-etsy-existing-draft.js';
import {validEtsyId505,validOwnerKey505,reassignmentReview505,ownerPhotoMatches505} from '../_lib/etsyOwnerReconciliation505.mjs';

const respond=(value,status=200)=>jsonResponse({ok:status<400,build:505,provider_modified:false,publication_performed:false,automatic_retry:false,...value},status,{'Cache-Control':'no-store'});
const parse=row=>{try{return JSON.parse(row?.details_json||'{}');}catch{return {}}};
const payload=row=>{try{return JSON.parse(row?.payload_json||'{}');}catch{return {}}};
const safeImages=rows=>(rows||[]).filter(imageReady).slice(0,10);
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);
  return !admin?{error:respond({error:'Verified administrator required.'},401)}:
    !db?{error:respond({error:'Product database unavailable.'},503)}:{admin,db};}
async function allReceipts(db,id){
  const r=await db.prepare("SELECT details_json FROM admin_action_audit WHERE target_type='product' AND target_key=? AND action_type IN ('etsy_product_editor_image_443_accepted','etsy_505_owner_existing_image_matched') ORDER BY admin_action_audit_id ASC LIMIT 30").bind(String(id)).all();
  return (r?.results||[]).map(parse).filter(row=>row.verified_remote_readback===true);
}
async function live(c,db,id,listingId){
  const s=await readExistingDraftLocal486(db,id);
  if(!s.product)throw Error('This Product could not be found.');
  const credentials=await existingDraftCredentials486(c.env,s);
  const listing=await verifyExistingDraft486(c.env,s,listingId,credentials);
  return {s,listing,credentials};
}
async function linkedGallery(c,db,id,listingId){
  const proof=await live(c,db,id,listingId);
  if(String(proof.s.draft?.external_reference||'')!==listingId)throw Error('This Product does not own that verified Etsy listing ID. Resolve its local claim first.');
  const [gallery,remote,receipts,claims]=await Promise.all([
    readCanonicalDistributionGallery(db,id),
    readEtsy486('listings/'+encodeURIComponent(listingId)+'/images',proof.credentials),
    allReceipts(db,id),
    db.prepare("SELECT details_json,target_key FROM admin_action_audit WHERE action_type='etsy_product_editor_image_443_claimed' AND target_type='product' AND target_key LIKE ? ORDER BY admin_action_audit_id ASC LIMIT 12").bind(`${id}:%`).all()
  ]);
  const images=safeImages(gallery.images),remoteImages=Array.isArray(remote?.results)?remote.results:[];
  if(remoteImages.some(row=>!validEtsyId505(row.listing_image_id)))throw Error('Etsy returned an invalid photo ID. No mapping can be accepted.');
  if(remoteImages.some(row=>row.listing_id&&String(row.listing_id)!==listingId))throw Error('An Etsy image belongs to a different listing. Nothing was mapped.');
  if(receipts.some(row=>String(row.listing_id)!==listingId))throw Error('A prior local photo receipt belongs to a different Etsy listing. Review that claim manually before matching anything.');
  const outstanding=(claims?.results||[]).filter(row=>!receipts.some(receipt=>Number(receipt.product_image_id)===Number(String(row.target_key).split(':')[1])));
  return {images,remoteImages,receipts,outstanding};
}
async function conflictReview(c,db,id,listingId){
  const claim=await claimedListing505(db,listingId),sourceId=Number(claim?.product_id);
  if(!claim||sourceId===id)return {state:claim?'already_owned':'unclaimed',safe_to_offer:false,issues:['No separate Product claims this Etsy listing ID.'],claim:null};
  const [target,source,conflicts,activity,proof]=await Promise.all([
    db.prepare('SELECT product_id,name,sku,slug FROM products WHERE product_id=? LIMIT 1').bind(id).first(),
    db.prepare('SELECT product_id,name,sku,slug FROM products WHERE product_id=? LIMIT 1').bind(sourceId).first(),
    db.prepare("SELECT COUNT(*) AS count FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=? AND id<>?").bind(listingId,claim.id).first(),
    db.prepare("SELECT COUNT(*) AS count FROM admin_action_audit WHERE target_type='product' AND target_key=? AND action_type IN ('etsy_product_editor_image_443_claimed','etsy_product_editor_image_443_accepted','etsy_505_owner_existing_image_matched','etsy_existing_draft_486_update_claimed','etsy_advanced_499_claimed','etsy_native_tags_497_claimed')").bind(String(sourceId)).first(),
    live(c,db,id,listingId)
  ]);
  const review=reassignmentReview505({target,claimant:source,listing:proof.listing,priorClaims:Number(activity?.count||0),otherClaims:Number(conflicts?.count||0)});
  return {...review,state:'another_product',listing_id:listingId,claim:{receipt_id:String(claim.id),product_id:sourceId,product_name:String(source?.name||''),sku:String(source?.sku||''),slug:String(source?.slug||'')},etsy_title:String(proof.listing?.title||''),target_title:String(target?.name||'')};
}
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
  const q=new URL(c.request.url).searchParams,id=Number(q.get('product_id')),listingId=String(q.get('listing_id')||''),mode=q.get('mode');
  if(!validEtsyId505(id)||!validEtsyId505(listingId)||!['claim','photos'].includes(mode))return respond({error:'Select an exact saved Product, Etsy draft and review type.'},400);
  try{
    if(mode==='claim')return respond({review:await conflictReview(c,g.db,id,listingId)});
    const proof=await linkedGallery(c,g.db,id,listingId);
    return respond({product_id:id,listing_id:listingId,
      originals:proof.images.map(row=>({product_image_id:Number(row.product_image_id),image_url:String(row.image_url||''),alt_text:String(row.alt_text||'')})),
      etsy_photos:proof.remoteImages.map(row=>({etsy_image_id:String(row.listing_image_id),image_url:String(row.url_570xN||row.url_fullxfull||row.url_75x75||'')})),
      matched:proof.receipts.filter(row=>String(row.listing_id)===listingId).map(row=>({product_image_id:Number(row.product_image_id),etsy_image_id:String(row.etsy_image_id)})),
      unresolved_upload_attempts:proof.outstanding.length,read_only:true});
  }catch(error){return respond({error:'Owner reconciliation cannot be verified: '+String(error?.message||'live read unavailable').slice(0,190)},409);}
}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
  if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return respond({error:'Same-origin owner review required.'},403);
  let b;try{b=await c.request.json();}catch{return respond({error:'JSON required.'},400);}
  const id=Number(b?.product_id),listingId=String(b?.listing_id||''),action=String(b?.action||'');
  if(!validEtsyId505(id)||!validEtsyId505(listingId)||!validOwnerKey505(b?.request_key)||!['resolve_local_claim','match_existing_photo'].includes(action)||b?.confirm_unpublished_canada_only!==true)
    return respond({error:'An exact Product, Etsy listing ID, unique request key and Canada-only unpublished consent are required.'},400);
  try{
    if(action==='resolve_local_claim'){
      if(b?.confirm_claimant_reviewed!==true||b?.confirm_correct_product!==true||!validEtsyId505(b?.expected_claimant_product_id)||!b?.expected_receipt_id)
        return respond({error:'Review the other Product and explicitly approve moving only the local Etsy link.'},400);
      const review=await conflictReview(c,g.db,id,listingId);
      if(!review.safe_to_offer||review.claim?.product_id!==Number(b.expected_claimant_product_id)||review.claim?.receipt_id!==String(b.expected_receipt_id))
        return respond({error:'Owner resolution is on HOLD: the conflicting Product, Etsy content or other claims changed. No link moved.',review},409);
      const before=await readExistingDraftLocal486(g.db,id);
      if(before.draft?.external_reference)return respond({error:'This Product already has a different Etsy ID. Nothing was reassigned.'},409);
      const collision=await claimedListing505(g.db,listingId);
      const snapshot={...payload(collision),verified_remote_existing_draft:true,canada_only_shipping_verified:true,
        remote_etsy_draft_created:false,publication_performed:false,owner_reassigned_505:{from_product_id:review.claim.product_id,to_product_id:id,listing_id:listingId,request_key:b.request_key}};
      const moved=await g.db.prepare("UPDATE marketplace_syndication_drafts SET product_id=?,draft_title=?,payload_json=?,status='needs_review',updated_at=CURRENT_TIMESTAMP WHERE id=? AND channel_key='etsy' AND product_id=? AND external_reference=? AND NOT EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND product_id=? AND external_reference IS NOT NULL) AND (SELECT COUNT(*) FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=?)=1 AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE target_type='product' AND target_key=? AND action_type IN ('etsy_product_editor_image_443_claimed','etsy_product_editor_image_443_accepted','etsy_505_owner_existing_image_matched','etsy_existing_draft_486_update_claimed','etsy_advanced_499_claimed','etsy_native_tags_497_claimed'))")
        .bind(String(id),String(before.product.name),JSON.stringify(snapshot),review.claim.receipt_id,String(review.claim.product_id),listingId,String(id),listingId,String(review.claim.product_id)).run();
      if(Number(moved.meta?.changes||0)!==1)return respond({error:'The local claim changed while it was being reviewed. Recheck both Products; no automatic retry.',code:'local_claim_changed'},409);
      await auditAdminAction(c.env,c.request,g.admin,{action_type:'etsy_505_owner_local_claim_reassigned',target_type:'product',target_key:String(id),details:{request_key:b.request_key,from_product_id:review.claim.product_id,to_product_id:id,listing_id:listingId,receipt_id:review.claim.receipt_id,provider_modified:false}});
      return respond({claim_reassigned:true,listing_id:listingId,product_id:id,previous_product_id:review.claim.product_id,message:'Local listing receipt moved to the owner-confirmed Product. The Etsy draft was not touched; next verify its existing photos.'});
    }
    if(!validEtsyId505(b?.product_image_id)||!validEtsyId505(b?.etsy_image_id)||b?.confirm_exact_photo_match!==true)
      return respond({error:'Select one approved original and one existing Etsy photo, then confirm they show the exact same image.'},400);
    const proof=await linkedGallery(c,g.db,id,listingId);
    if(proof.outstanding.length)return respond({error:'An earlier Etsy upload is unresolved. We cannot assign photo receipts until that attempt is independently reconciled.'},409);
    const check=ownerPhotoMatches505({gallery:proof.images,remoteImages:proof.remoteImages,receipts:proof.receipts,listingId,productImageId:b.product_image_id,etsyImageId:b.etsy_image_id});
    if(!check.ready)return respond({error:'Photo owner review on HOLD. '+check.issues.join(' '),issues:check.issues},409);
    const details={build:505,product_id:id,listing_id:listingId,product_image_id:Number(b.product_image_id),etsy_image_id:String(b.etsy_image_id),
      request_key:b.request_key,verified_remote_readback:true,owner_witnessed_existing_photo:true,provider_modified:false,publication_performed:false};
    const recorded=await g.db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,'etsy_505_owner_existing_image_matched','product',?,'POST',?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND product_id=? AND external_reference=?) AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type IN ('etsy_product_editor_image_443_accepted','etsy_505_owner_existing_image_matched') AND target_type='product' AND target_key=? AND (CAST(json_extract(details_json,'$.product_image_id') AS TEXT)=? OR CAST(json_extract(details_json,'$.etsy_image_id') AS TEXT)=? OR json_extract(details_json,'$.request_key')=?))")
      .bind(g.admin.user_id,String(id),new URL(c.request.url).pathname,JSON.stringify(details),id,listingId,String(id),String(b.product_image_id),String(b.etsy_image_id),b.request_key).run();
    if(Number(recorded.meta?.changes||0)!==1)return respond({error:'Another photo mapping was already recorded. Refresh the live Etsy image list; no duplicate match was accepted.'},409);
    return respond({photo_matched:true,product_image_id:Number(b.product_image_id),etsy_image_id:String(b.etsy_image_id),listing_id:listingId,message:'Owner witnessed the matching existing Etsy photo. Local proof recorded; nothing uploaded or published.'});
  }catch(error){return respond({error:'Owner reconciliation was not fully confirmed. Read the current Product and Etsy draft before another attempt: '+String(error?.message||'verification unavailable').slice(0,150)},409);}
}
