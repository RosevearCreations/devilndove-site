/* Build 508 — verified, explicit local owner closeout of the SAME Etsy draft.
 * GET is entirely read-only. POST records one immutable local audit receipt;
 * no Etsy create/update/photo upload/publication is authorized here. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {reviewOwnerEtsy504} from './product-etsy-owner-signoff-504.js';
import {priorOwnerApproval508} from '../_lib/etsyCloseout508.mjs';

const respond=(value,status=200)=>jsonResponse({ok:status<400,build:508,publication_performed:false,
  provider_modified:false,automatic_retry:false,...value},status,{'Cache-Control':'no-store'});
const positive=x=>/^[1-9]\d{0,14}$/.test(String(x??''))&&Number.isSafeInteger(Number(x));
const uuid=x=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(String(x||''));
const fingerprint=x=>/^[a-f0-9]{64}$/.test(String(x||''));
function gate(c){const actor=verifiedAdminFromModule(c),db=getDb(c.env);
 return !actor?{error:respond({error:'Verified owner admin required.'},401)}:!db?{error:respond({error:'Product database unavailable.'},503)}:{actor,db};}
async function ownerProof508(c,db,productId){
 const review=await reviewOwnerEtsy504(c,db,productId);
 const latest=await db.prepare("SELECT admin_action_audit_id,details_json,created_at FROM admin_action_audit WHERE action_type='etsy_504_owner_final_content_approved' AND target_type='product' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1")
   .bind(String(productId)).first();
 let prior=false;try{prior=priorOwnerApproval508(latest?.details_json||null,review);}catch{}
 return {review,prior,prior_receipt_id:prior?Number(latest.admin_action_audit_id):null,
   ready:review.ready===true&&review.photo_freshness_509?.ready===true&&prior&&fingerprint(review.evidence_fingerprint_508)};
}
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
 const productId=new URL(c.request.url).searchParams.get('product_id');
 if(Number(productId)!==53)return respond({error:'Build 508 owner closeout is limited to Product #53.'},400);
 try{const result=await ownerProof508(c,g.db,Number(productId));
  return respond({product_id:Number(productId),ready_for_owner_closeout:result.ready,
   prior_owner_signoff_confirmed:result.prior,prior_owner_signoff_receipt_id:result.prior_receipt_id,
   evidence_fingerprint:result.review.evidence_fingerprint_508||null,
   listing_id:result.review.listing_id||null,confirmed_photo_ids:result.review.confirmed_photo_ids||[],
   verified_media_pairs:result.review.verified_media_pairs_508||[],issues:result.review.issues||[],
   approved_gallery_count:result.review.approved_gallery_count||0,etsy_remote_photo_count:result.review.etsy_remote_photo_count??null,
   next_action:result.prior?'Confirm current Etsy content and each original before local closeout.':'First complete the separate, witnessed final owner sign-off for the same verified draft.',
   owner_closeout_recorded:false,read_only:true});
 }catch(e){return respond({error:'Owner closeout preflight on HOLD: '+String(e?.message||'readback unavailable').slice(0,160)},409);}
}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return respond({error:'Same-origin owner closeout required.'},403);
 let body;try{body=await c.request.json();}catch{return respond({error:'JSON required.'},400);}
 const id=Number(body?.product_id),listingId=String(body?.listing_id||''),fp=String(body?.evidence_fingerprint||'');
 if(body?.action!=='record_owner_closeout_508'||id!==53||!positive(listingId)||!uuid(body?.request_key)||!fingerprint(fp)||
   body?.confirm_same_draft!==true||body?.confirm_each_original_photo!==true||body?.confirm_actual_metadata!==true||
   body?.confirm_unpublished_canada_only!==true)
  return respond({error:'Exact Etsy draft, fresh evidence fingerprint, unique request key and all separate owner confirmations are required.'},400);
 try{
  const proof=await ownerProof508(c,g.db,id),readback=proof.review;
  if(!proof.ready||String(readback.listing_id)!==listingId||readback.evidence_fingerprint_508!==fp)
   return respond({error:'HOLD — prior owner sign-off, Product/Etsy metadata, 3 photos or evidence fingerprint changed. Read the actual draft again; do not publish or retry blindly.',review:readback,prior_owner_signoff_confirmed:proof.prior},409);
  const expected=id===53?[344,345,346]:(readback.expected_photo_ids||[]);
  if(!expected.every(photo=>readback.confirmed_photo_ids.includes(photo)))return respond({error:'All expected originals need independently confirmed actual Etsy photo receipts.'},409);
  const details={build:508,product_id:id,listing_id:listingId,request_key:String(body.request_key),
   evidence_fingerprint:fp,prior_owner_signoff_receipt_id:proof.prior_receipt_id,
   confirmed_photo_ids:readback.confirmed_photo_ids,verified_media_pairs:readback.verified_media_pairs_508,
   publication_performed:false,provider_modified:false};
  const claim=await g.db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,'etsy_508_verified_owner_closeout','product',?,'POST',?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND product_id=? AND external_reference=?) AND EXISTS (SELECT 1 FROM admin_action_audit WHERE admin_action_audit_id=? AND action_type='etsy_504_owner_final_content_approved' AND target_key=?) AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_508_verified_owner_closeout' AND target_type='product' AND target_key=? AND (json_extract(details_json,'$.request_key')=? OR json_extract(details_json,'$.evidence_fingerprint')=?))")
    .bind(g.actor.user_id,String(id),new URL(c.request.url).pathname,JSON.stringify(details),id,listingId,proof.prior_receipt_id,String(id),String(id),body.request_key,fp).run();
  if(Number(claim.meta?.changes)!==1)return respond({error:'This closeout evidence was already recorded or changed. Refresh the saved receipt; do not create a duplicate.'},409);
  return respond({owner_closeout_recorded:true,receipt_id:Number(claim.meta?.last_row_id||0)||null,
   listing_id:listingId,evidence_fingerprint:fp,confirmed_photo_ids:readback.confirmed_photo_ids,
   message:'Owner-witnessed final Etsy content/media closeout recorded locally; draft remains unpublished.'});
 }catch(e){return respond({error:'Owner closeout on HOLD: '+String(e?.message||'verified readback unavailable').slice(0,160)},409);}
}
