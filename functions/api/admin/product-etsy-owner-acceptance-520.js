/* Build 520: authenticated GET-only persisted owner-approval readback.
 * A historical audit row is accepted only when its fingerprint matches a fresh
 * real Etsy draft read. No owner decision is created by this endpoint. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {reviewOwnerEtsy504} from './product-etsy-owner-signoff-504.js';

const DRAFT='4603838854';
const reply=(data,status=200)=>jsonResponse({ok:status<400,build:520,read_only:true,
  provider_modified:false,publication_performed:false,approval_created:false,...data},status,{'Cache-Control':'no-store'});
const parse=value=>{try{return JSON.parse(value||'{}');}catch{return {};}};
const validKey=value=>/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(String(value||''));
export function inspectOwnerAcceptance520({record,review}={}){
  if(!record)return {receipt_recorded:false,current_acceptance_verified:false,
    owner_confirmed_in_this_request:false,issues:['No persisted owner approval receipt was found for this exact draft.']};
  const issues=[];
  if(Number(record.product_id)!==53||String(record.listing_id)!==DRAFT)
    issues.push('Persisted owner receipt belongs to a different Product or draft.');
  if(!record.evidence_fingerprint_508||record.evidence_fingerprint_508!==review?.evidence_fingerprint_508)
    issues.push('Current Etsy draft evidence fingerprint differs from the owner-approved snapshot.');
  if(review?.ready!==true||review?.photo_freshness_509?.ready!==true||review?.verified_unpublished!==true||
    review?.verified_canada_only!==true||String(review?.listing_id)!==DRAFT)
    issues.push('Current live unpublished, Canada-only Etsy draft and original-photo evidence is incomplete.');
  const originals=[344,345,346];
  const receiptIds=Array.isArray(record.confirmed_photo_ids)?record.confirmed_photo_ids:[];
  const checkedIds=Array.isArray(review?.confirmed_photo_ids)?review.confirmed_photo_ids:[];
  const pairs=Array.isArray(review?.verified_media_pairs_508)?review.verified_media_pairs_508:[];
  if(receiptIds.length!==3||checkedIds.length!==3||pairs.length!==3||
    !originals.every(n=>receiptIds.includes(n)&&checkedIds.includes(n)&&pairs.some(p=>Number(p.product_image_id)===n))||
    new Set(pairs.map(p=>String(p.etsy_image_id))).size!==3)
    issues.push('The current draft does not have three distinct original-to-Etsy receipt pairs.');
  if(record.publication_performed!==false)
    issues.push('Approval record does not explicitly confirm unpublished-only consent.');
  return {receipt_recorded:true,current_acceptance_verified:issues.length===0,
    owner_confirmed_in_this_request:false,issues};
}
export async function onRequestGet(c){
  if(!verifiedAdminFromModule(c))return reply({error:'Verified administrator required.'},401);
  const db=getDb(c.env);if(!db)return reply({error:'Product database unavailable.'},503);
  const q=new URL(c.request.url).searchParams;
  if(q.get('product_id')!=='53'||q.get('listing_id')!==DRAFT||
    (q.has('request_key')&&!validKey(q.get('request_key'))))
    return reply({error:'Exact Product #53, existing Etsy draft and an optional valid request key required.'},400);
  try{
    const primary=typeof db.withSession==='function'?db.withSession('first-primary'):db;
    const row=await primary.prepare("SELECT details_json,created_at FROM admin_action_audit WHERE action_type='etsy_504_owner_final_content_approved' AND target_type='product' AND target_key='53' AND json_extract(details_json,'$.listing_id')=? AND (? IS NULL OR json_extract(details_json,'$.request_key')=?) ORDER BY admin_action_audit_id DESC LIMIT 1")
      .bind(DRAFT,q.get('request_key')||null,q.get('request_key')||null).first();
    const record=row?parse(row.details_json):null;
    if(!record)return reply({listing_id:DRAFT,...inspectOwnerAcceptance520({})});
    const review=await reviewOwnerEtsy504(c,primary,53);
    const check=inspectOwnerAcceptance520({record,review});
    return reply({listing_id:DRAFT,receipt_created_at:row.created_at||null,
      ...check,owner_approval_source:'persisted_local_owner_action',
      owner_test_decision:'NOT_GIVEN',connection_state:'DISCONNECTED'});
  }catch(error){return reply({error:'HOLD — persisted owner acceptance or fresh Etsy readback unavailable: '+
      String(error?.message||'read unavailable').slice(0,160),receipt_state:'UNCERTAIN',
      no_automatic_owner_retry:true},409);}
}
