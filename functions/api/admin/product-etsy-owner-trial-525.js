/* Build 525 — real-owner fresh Product trial. GET performs actual Etsy reads;
 * POST records only a separately acknowledged LOCAL owner visual statement. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {readCanonicalDistributionGallery} from '../_lib/canonicalDistributionGallery436.mjs';
import {allowedImage} from '../_lib/productDistribution406.mjs';
import {readOverride499,effectiveEtsyTags499} from '../_lib/channelTagOverrides499.mjs';
import {preparedEtsyTags497,tagsMatch497} from '../_lib/etsyNativeTags497.mjs';
import {assessOwnerApproval504} from '../_lib/etsyOwnerApproval504.mjs';
import {readExistingDraftLocal486,existingDraftCredentials486,verifyExistingDraft486,readEtsy486,linkedReceipt506} from './product-etsy-existing-draft.js';
import {evaluateFreshOwnerTrial525,ownerPhotoDecision525} from '../_lib/etsyFreshOwnerTrial525.mjs';

const reply=(data,status=200)=>jsonResponse({ok:status<400,build:525,
 provider_modified:false,publication_performed:false,automatic_retry:false,...data},status,{'Cache-Control':'no-store'});
const valid=x=>/^[1-9]\d{0,14}$/.test(String(x??''))&&Number.isSafeInteger(Number(x));
const uuid=x=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(x||''));
const primary=db=>typeof db.withSession==='function'?db.withSession('first-primary'):db;
const parse=row=>{try{return JSON.parse(row?.details_json||'{}')}catch{return {};}};
const gate=c=>{const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:reply({error:'Verified Admin required.'},401)}:
  !db?{error:reply({error:'Primary D1 source unavailable.'},503)}:{admin,db};};
async function fingerprint(value){const bytes=new TextEncoder().encode(JSON.stringify(value));
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');}

async function liveRead(c,id,db){
 const sourceDb=primary(db),s=await readExistingDraftLocal486(sourceDb,id);
 if(!s.product)throw Error('This saved Product was not found.');
 const listingId=String(s.draft?.external_reference||'');
 if(!valid(listingId))throw Error('There is no saved Etsy listing ID for this Product. Do not create a duplicate.');
 const [claim,galleryResult,seo,receiptRows,override]=await Promise.all([
  linkedReceipt506(db,id,listingId),readCanonicalDistributionGallery(sourceDb,id),
  sourceDb.prepare('SELECT keywords FROM product_seo WHERE product_id=? LIMIT 1').bind(id).first(),
  sourceDb.prepare("SELECT details_json FROM admin_action_audit WHERE action_type IN ('etsy_product_editor_image_443_accepted','etsy_505_owner_existing_image_matched') AND target_type='product' AND target_key=? ORDER BY admin_action_audit_id ASC LIMIT 60").bind(String(id)).all(),
  readOverride499(sourceDb,id,'etsy')]);
 if(!claim.confirmed)throw Error('The exact Etsy listing does not have one unique primary D1 Product receipt: '+claim.claim_state);
 const headers=await existingDraftCredentials486(c.env,s);
 const [listing,remoteRead]=await Promise.all([
  verifyExistingDraft486(c.env,s,listingId,headers),
  readEtsy486('listings/'+encodeURIComponent(listingId)+'/images',headers)]);
 if(!Array.isArray(remoteRead?.results))throw Error('Etsy did not supply a complete image inventory.');
 const gallery=(galleryResult.images||[]).map(x=>({...x,approved_for_distribution:allowedImage(x)}));
 const receipts=(receiptRows?.results||[]).map(parse);
 const tags=override?effectiveEtsyTags499(seo?.keywords,override):preparedEtsyTags497(seo?.keywords);
 const assessment=assessOwnerApproval504({product:s.product,listing,gallery,accepted:receipts,
  remoteImages:remoteRead.results,tagsReady:tags.ready===true&&Array.isArray(listing.tags)&&tagsMatch497(tags.tags,listing.tags),
  expected:gallery.map(x=>Number(x.product_image_id))});
 const trial=evaluateFreshOwnerTrial525({productId:id,listingId,claim,product:s.product,gallery,
  remoteListing:listing,remoteImages:remoteRead.results,receipts,metadataIssues:assessment.issues});
 const evidence_fingerprint=await fingerprint({product_id:id,listing_id:listingId,receipt_id:claim.receipt_id,
  title:s.product.name,description:s.product.description,short_description:s.product.short_description,
  price_cents:s.product.price_cents,currency:s.product.currency,quantity:s.product.inventory_quantity,
  photos:trial.photos,remote_photo_ids:remoteRead.results.map(x=>String(x.listing_image_id)),issues:trial.issues});
 return {trial,evidence_fingerprint,source_product:{product_id:id,sku:String(s.product.sku||''),slug:String(s.product.slug||''),
  title:String(s.product.name||'')},etsy:{listing_id:listingId,unpublished:true,canada_only_shipping_verified:true,
  remote_photo_count:remoteRead.results.length},readback_at:new Date().toISOString()};
}

export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
 const id=Number(new URL(c.request.url).searchParams.get('product_id'));
 if(!valid(id)||[48,53].includes(id))return reply({error:'Use one fresh saved Product; #48 and #53 are owner-managed.'},400);
 try{return reply({...await liveRead(c,id,g.db),read_only:true});}
 catch(error){return reply({error:'Live owner trial could not be confirmed: '+String(error.message||'unavailable').slice(0,180),
  owner_acceptance_recorded:false,provider_modified:false,retry_safe_get:true},409);}
}

export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return reply({error:'Same-origin owner acceptance required.'},403);
 let b;try{b=await c.request.json();}catch{return reply({error:'JSON required.'},400);}
 if(!valid(b?.product_id)||[48,53].includes(Number(b.product_id))||!uuid(b?.request_key)||
  b?.owner_compared_every_image!==true||b?.confirm_unpublished_only!==true||b?.confirm_local_receipt_only!==true)
  return reply({error:'Fresh Product, unique request key and explicit original-photo, draft-only LOCAL acceptance required.'},400);
 try{
  // Re-read current D1 primary AND live Etsy before accepting the exact source fingerprint.
  const read=await liveRead(c,Number(b.product_id),g.db);
  const decision=ownerPhotoDecision525({trial:read.trial,expectedFingerprint:b.expected_fingerprint,
   actualFingerprint:read.evidence_fingerprint,confirmedPairs:b.confirmed_pairs});
  if(!decision.may_record_owner_statement)return reply({error:'Owner trial evidence changed or remains incomplete.',issues:decision.issues},409);
  const detail={build:525,product_id:Number(b.product_id),listing_id:read.etsy.listing_id,
   primary_receipt_id:read.trial.primary_receipt_id,evidence_fingerprint:read.evidence_fingerprint,
   confirmed_pairs:read.trial.photos.map(p=>({product_image_id:p.product_image_id,etsy_image_id:p.etsy_image_id})),
   owner_compared_every_image:true,owner_reported_visual_acceptance:true,
   independently_proven_pixel_identity:false,provider_modified:false,publication_performed:false,
   request_key:b.request_key};
  const insert=await g.db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,'etsy_fresh_owner_trial_525_accepted','product',?,'POST',?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_fresh_owner_trial_525_accepted' AND target_type='product' AND target_key=? AND (json_extract(details_json,'$.evidence_fingerprint')=? OR json_extract(details_json,'$.request_key')=?))")
   .bind(g.admin.user_id,String(b.product_id),new URL(c.request.url).pathname,JSON.stringify(detail),
    String(b.product_id),read.evidence_fingerprint,b.request_key).run();
  if(Number(insert?.meta?.changes)!==1)return reply({error:'This owner evidence is already recorded or the request key was reused. Review the existing receipt; no resend.'},409);
  const audit=await primary(g.db).prepare("SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='etsy_fresh_owner_trial_525_accepted' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.request_key')=? ORDER BY admin_action_audit_id DESC LIMIT 1")
   .bind(String(b.product_id),b.request_key).first();
  if(!audit||parse(audit).evidence_fingerprint!==read.evidence_fingerprint)return reply({error:'Owner receipt persistence is uncertain. Read audit before any new acceptance attempt.'},409);
  return reply({owner_statement_recorded:true,read_only:false,local_audit_only:true,owner_receipt_id:audit.admin_action_audit_id,
   product_id:Number(b.product_id),listing_id:read.etsy.listing_id,evidence_fingerprint:read.evidence_fingerprint,
   confirmed_photo_count:read.trial.photos.length,independently_proven_pixel_identity:false,
   note:'The verified Admin recorded an owner visual comparison statement. This is not an independent pixel-signature witness or provider publication.'});
 }catch(error){return reply({error:'Owner evidence acceptance HELD: '+String(error.message||'live source unavailable').slice(0,170),
  no_automatic_retry:true},409);}
}
