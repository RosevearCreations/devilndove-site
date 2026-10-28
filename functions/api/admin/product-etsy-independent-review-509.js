/* Build 509: separate reviewer evidence freshness and exception follow-up.
 * Never moves Etsy claims, uploads photos, creates or publishes listings. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {reviewOwnerEtsy504} from './product-etsy-owner-signoff-504.js';
import {independentReceipt509} from '../_lib/etsyIndependent509.mjs';

const respond=(data,status=200)=>jsonResponse({ok:status<400,build:509,publication_performed:false,provider_modified:false,
  automatic_retry:false,hold_override:false,...data},status,{'Cache-Control':'no-store'});
const uuid=x=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(String(x||''));
const hex=x=>/^[a-f0-9]{64}$/.test(String(x||''));
const exactListing=x=>String(x||'')==='4603838854';
const categories=new Set(['listing_claim','photo_receipt','metadata','owner_signoff','provider_readback','other']);
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:respond({error:'Independent verified Admin required.'},401)}:!db?{error:respond({error:'Product audit database unavailable.'},503)}:{admin,db};}
async function review509(c,db,actor){
 const [review,prior]=await Promise.all([reviewOwnerEtsy504(c,db,53),
  db.prepare("SELECT admin_action_audit_id,actor_user_id,details_json,created_at FROM admin_action_audit WHERE action_type='etsy_508_verified_owner_closeout' AND target_type='product' AND target_key='53' ORDER BY admin_action_audit_id DESC LIMIT 1").first()]);
 let independent={ready:false,reason:'No verified owner closeout receipt.'};
 if(prior)try{independent=independentReceipt509({prior,review,actorId:actor.user_id});}catch{independent={ready:false,reason:'Owner evidence receipt cannot be parsed.'};}
 const issues=[...(review.issues||[]),...(review.photo_freshness_509?.issues||[])];
 if(!prior)issues.push('No owner-witnessed Build 508 closeout receipt was recorded.');
 else if(!independent.ready)issues.push(independent.reason);
 return {review,prior,independent,issues};
}
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
 if(new URL(c.request.url).searchParams.get('product_id')!=='53')return respond({error:'Build 509 is scoped to Product #53.'},400);
 try{
  const r=await review509(c,g.db,g.admin);
  return respond({product_id:53,listing_id:r.review.listing_id||null,candidate_existing_listing_id:'4603838854',
   original_photo_receipts:r.review.photo_freshness_509?.rows||[],photo_freshness_ready:r.review.photo_freshness_509?.ready===true,
   evidence_fingerprint:r.review.evidence_fingerprint_508||null,owner_closeout_receipt_id:r.prior?.admin_action_audit_id||null,
   independent_reviewer_required:true,separate_reviewer:r.independent.separate_reviewer===true,
   exception_followup_allowed:true,
   ready_for_independent_review:r.independent.ready===true,issues:r.issues,
   next_action:r.independent.ready?'Review the actual existing Etsy draft and confirm the independent acceptance separately.':
    'Record only a local exception follow-up if needed; correct the source evidence and obtain fresh owner acceptance first.',
   read_only:true,etsy_unpublished:true,owner_exception_resolved:false});
 }catch(error){return respond({error:'Independent Etsy/photo review on HOLD: '+String(error?.message||'readback unavailable').slice(0,180)},409);}
}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return respond({error:'Same-origin independent review required.'},403);
 let b;try{b=await c.request.json();}catch{return respond({error:'JSON required.'},400);}
 if(Number(b?.product_id)!==53||!exactListing(b?.listing_id)||!uuid(b?.request_key)||
    !['record_exception_followup','record_independent_acceptance'].includes(b?.action)||b?.confirm_no_etsy_changes!==true)
  return respond({error:'Exact existing Product/draft, fresh readback digest, separate authorization and unique request key are required.'},400);
 if(b.action==='record_independent_acceptance'&&!hex(b?.evidence_fingerprint))
  return respond({error:'Independent acceptance requires a verified current Etsy and three-photo fingerprint.'},400);
 if(b.action==='record_exception_followup'&&b.evidence_fingerprint!=null&&!hex(b.evidence_fingerprint))
  return respond({error:'Exception receipt fingerprint must be current verified evidence or explicitly unknown.'},400);
 if(b.action==='record_exception_followup'&&(!categories.has(b.category)||typeof b.next_action!=='string'||b.next_action.trim().length<15||b.next_action.length>500))
  return respond({error:'Choose the actual exception category and a specific manual follow-up (15–500 characters).'},400);
 if(b.action==='record_independent_acceptance'&&(b.confirm_all_originals!==true||b.confirm_description_tags!==true||
    b.confirm_canada_only_unpublished!==true||b.confirm_independent_review!==true))
  return respond({error:'A separate reviewer must confirm each actual Etsy/media/content safety check.'},400);
 try{
  const r=await review509(c,g.db,g.admin);
  if((b.action==='record_independent_acceptance'&&!exactListing(r.review.listing_id))||
     (r.review.evidence_fingerprint_508||null)!==(b.evidence_fingerprint||null))
   return respond({error:'HOLD — live Product, Etsy, or media fingerprint changed. Read the exact draft again; no local acceptance was recorded.'},409);
  if(b.action==='record_independent_acceptance'&&!r.independent.ready)
   return respond({error:'HOLD — '+r.independent.reason,issues:r.issues},409);
  const acceptance=b.action==='record_independent_acceptance';
  const actionType=acceptance?'etsy_509_independent_owner_trial_accepted':'etsy_509_exception_followup_recorded';
  const details={build:509,request_key:b.request_key,product_id:53,listing_id:b.listing_id,
   evidence_fingerprint:b.evidence_fingerprint||null,source_owner_closeout_receipt_id:r.prior?.admin_action_audit_id||null,
   source_owner_actor_id:r.prior?.actor_user_id||null,
   photo_evidence:r.review.photo_freshness_509?.rows||[],category:acceptance?null:b.category,
   next_action:acceptance?null:b.next_action.trim(),outcome:acceptance?'independent_evidence_reviewed':'followup_pending_source_resolution',
   source_evidence_verified:hex(r.review.evidence_fingerprint_508),
   owner_exception_resolved:acceptance,publication_performed:false,provider_modified:false};
  const statement="INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,?,'product','53','POST',?,?,CURRENT_TIMESTAMP WHERE (?=0 OR EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND product_id=53 AND external_reference=?)) AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type=? AND target_type='product' AND target_key='53' AND (json_extract(details_json,'$.request_key')=? OR (?=1 AND json_extract(details_json,'$.evidence_fingerprint')=?)))";
  const saved=await g.db.prepare(statement).bind(g.admin.user_id,actionType,new URL(c.request.url).pathname,JSON.stringify(details),
    Number(acceptance),b.listing_id,actionType,b.request_key,Number(acceptance),b.evidence_fingerprint).run();
  if(Number(saved.meta?.changes||0)!==1)return respond({error:'The same exception/independent decision may already be recorded. Recheck the latest evidence, never retry blindly.'},409);
  return respond({receipt_id:Number(saved.meta?.last_row_id)||null,independent_acceptance_recorded:acceptance,
   exception_followup_recorded:!acceptance,owner_exception_resolved:acceptance,
   message:acceptance?'Independent reviewer recorded a matching local evidence decision; Etsy remains unpublished.':
    'Exception follow-up recorded locally. HOLD remains until source evidence is verified; Etsy was not changed.'});
 }catch(error){return respond({error:'Independent reviewer follow-up on HOLD: '+String(error?.message||'proof unavailable').slice(0,170)},409);}
}
