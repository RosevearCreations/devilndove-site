/* Build 507: owner-controlled READ-ONLY original Etsy trial diagnosis.
 * No owner signoff, local claim mutation, provider update or photo upload.
 */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {readCanonicalDistributionGallery} from '../_lib/canonicalDistributionGallery436.mjs';
import {imageReady} from '../_lib/productEtsyImages443.mjs';
import {readOverride499,effectiveEtsyTags499} from '../_lib/channelTagOverrides499.mjs';
import {preparedEtsyTags497,tagsMatch497} from '../_lib/etsyNativeTags497.mjs';
import {assessOwnerApproval504} from '../_lib/etsyOwnerApproval504.mjs';
import {readExistingDraftLocal486,existingDraftCredentials486,verifyExistingDraft486,readEtsy486,linkedReceipt506} from './product-etsy-existing-draft.js';

const respond=(v,status=200)=>jsonResponse({ok:status<400,build:507,provider_modified:false,
  publication_performed:false,owner_approval_recorded:false,automatic_retry:false,...v},status,{'Cache-Control':'no-store'});
const valid=x=>/^[1-9]\d{0,14}$/.test(String(x??''))&&Number.isSafeInteger(Number(x));
const parse=x=>{try{return JSON.parse(x?.details_json||'{}')}catch{return {}}};
export function metadataReview507({product,listing,tags,receipt}){
 const issues=[],name=String(product?.name||'').trim(),description=String(product?.description||'').trim();
 if(description.length<Math.max(16,name.length+8)||description.toLocaleLowerCase()===name.toLocaleLowerCase())
   issues.push('Description must contain verified item materials, dimensions and making details; do not invent them.');
 if(!tags?.ready)issues.push('Saved Product or Etsy-specific search tags are not ready.');
 if((tags?.tags||[]).some(tag=>/\bsoap\s*bars?\b/i.test(String(tag))))
   issues.push('Owner must confirm whether the saved “Soap bars” term truthfully describes this item; correct the channel override if not.');
 if(!receipt?.confirmed)issues.push(`Saved Etsy ID receipt is not uniquely confirmed (${receipt?.claim_state||'unavailable'}). No new listing or automatic retry.`);
 if(!listing)issues.push('Actual Etsy draft, shipping, category, description, CAD price, tags and photographs could not be independently read.');
 return issues;
}
export async function onRequestGet(c){
 const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 if(!admin)return respond({error:'Verified administrator required.'},401);
 if(!db)return respond({error:'Product database unavailable.'},503);
 const q=new URL(c.request.url).searchParams,id=q.get('product_id'),listingId=q.get('listing_id');
 if(!valid(id)||!valid(listingId))return respond({error:'Choose one saved Product and its exact existing Etsy draft ID.'},400);
 try{
  const productId=Number(id),s=await readExistingDraftLocal486(db,productId);
  if(!s.product)return respond({error:'Product not found.'},404);
  const [link,gallery,seo,receipts]=await Promise.all([
   linkedReceipt506(db,productId,String(listingId)),readCanonicalDistributionGallery(db,productId),
   db.prepare('SELECT keywords FROM product_seo WHERE product_id=? LIMIT 1').bind(productId).first(),
   db.prepare("SELECT details_json FROM admin_action_audit WHERE action_type IN ('etsy_product_editor_image_443_accepted','etsy_505_owner_existing_image_matched') AND target_type='product' AND target_key=? ORDER BY admin_action_audit_id ASC LIMIT 30").bind(String(id)).all()
  ]);
  const override=await readOverride499(db,productId,'etsy');
  const tags=override?effectiveEtsyTags499(seo?.keywords,override):preparedEtsyTags497(seo?.keywords);
  const originals=(gallery.images||[]).filter(imageReady).slice(0,10);
  const result={product_id:productId,product_sku:String(s.product.sku||''),product_slug:String(s.product.slug||''),
   listing_id:String(listingId),local_link_confirmed:link.confirmed,local_claim_state:link.claim_state,
   local_receipt_id:link.receipt_id||null,local_claim_count_capped:link.claim_count_capped,
   tag_source:override?.mode||'shared_product_seo',saved_tag_phrases:tags.tags||[],
   original_image_ids:originals.map(row=>Number(row.product_image_id)),expected_originals:productId===53?[344,345,346]:[],
   remote_readback_confirmed:false,approved_photo_count:originals.length,photo_receipts_confirmed:0,
   remote_photo_count:null,issues:[],ready_for_owner_signoff:false,read_only:true};
  let listing=null,remoteImages=[];
  try{
   const headers=await existingDraftCredentials486(c.env,s);
   listing=await verifyExistingDraft486(c.env,s,String(listingId),headers);
   const imageRead=await readEtsy486('listings/'+encodeURIComponent(String(listingId))+'/images',headers);
   remoteImages=Array.isArray(imageRead?.results)?imageRead.results:[];
   result.remote_readback_confirmed=true;
   result.remote_photo_count=remoteImages.length;
   result.etsy_title=String(listing.title||'').slice(0,140);
   result.etsy_taxonomy_id=Number(listing.taxonomy_id||0);
  }catch(e){result.remote_hold=String(e?.message||'Etsy draft read unavailable').slice(0,160);}
  const accepted=(receipts?.results||[]).map(parse);
  if(listing){
   const audit=assessOwnerApproval504({product:s.product,listing,gallery:originals,accepted,remoteImages,
     tagsReady:tags.ready===true&&Array.isArray(listing.tags)&&tagsMatch497(tags.tags,listing.tags),
     expected:productId===53?[344,345,346]:originals.map(row=>Number(row.product_image_id))});
   result.photo_receipts_confirmed=audit.confirmed_photo_ids.length;
   result.photo_readback_issues=audit.issues;
  }
  result.issues=[...metadataReview507({product:s.product,listing,tags,receipt:link}),...(result.photo_readback_issues||[])];
  if(productId===53&&!([344,345,346].every(imageId=>result.original_image_ids.includes(imageId))))
   result.issues.push('One of the three approved Product originals #344–346 is missing from the saved canonical gallery.');
  result.ready_for_owner_signoff=result.issues.length===0&&result.remote_readback_confirmed&&link.confirmed;
  return respond(result);
 }catch(e){return respond({error:'Owner trial readback unavailable: '+String(e?.message||'read-only check failed').slice(0,155),no_etsy_changes:true},409);}
}
