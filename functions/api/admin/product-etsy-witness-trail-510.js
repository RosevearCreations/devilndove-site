/* Build 510: Product #53 exact local Etsy claim witness and read-only photo retest.
 * Candidate owner testimony never becomes a verified provider receipt. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {linkedReceipt506} from './product-etsy-existing-draft.js';
import {reviewOwnerEtsy504} from './product-etsy-owner-signoff-504.js';
import {ORIGINAL_IDS_509} from '../_lib/etsyIndependent509.mjs';

const listing='4603838854';
const respond=(data,status=200)=>jsonResponse({ok:status<400,build:510,product_id:53,candidate_listing_id:listing,
  provider_modified:false,publication_performed:false,duplicate_draft_created:false,
  local_link_changed:false,automatic_retry:false,...data},status,{'Cache-Control':'no-store'});
const uuid=x=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(String(x||''));
const hex=x=>/^[a-f0-9]{64}$/.test(String(x||''));
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);return !admin?{error:respond({error:'Verified owner Admin required.'},401)}:
 !db?{error:respond({error:'Source audit database unavailable.'},503)}:{admin,db};}
async function snapshot(c,db){
 const claim=await linkedReceipt506(db,53,listing);
 let provider=null,error=null;
 if(claim.confirmed){try{provider=await reviewOwnerEtsy504(c,db,53);}catch(e){error=String(e?.message||'Remote Etsy readback unavailable').slice(0,160);}}
 const photos=provider?.photo_freshness_509;
 return {claim,provider,photos,issues:[...(!claim.confirmed?['Exact Etsy listing #'+listing+' is not uniquely linked to Product #53 in the D1 primary.']:[]),
   ...(provider?.issues||[]),...(photos?.issues||[]),...(error?[error]:[])]};
}
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
 if(new URL(c.request.url).searchParams.get('product_id')!=='53')return respond({error:'Product #53 is required.'},400);
 try{const r=await snapshot(c,g.db);
  return respond({listing_id:r.claim.listing_id||null,local_claim_state:r.claim.claim_state,
   local_claim_receipt_id:r.claim.receipt_id,local_link_confirmed:r.claim.confirmed,
   live_etsy_readback_confirmed:Boolean(r.provider?.ready),
   photo_freshness_ready:r.photos?.ready===true,photo_pairs:r.photos?.rows||[],
   current_evidence_fingerprint:r.provider?.evidence_fingerprint_508||null,issues:r.issues,
   candidate_owner_observation_not_provider_proof:true,
   read_only:true,owner_acceptance_recorded:false});
 }catch(e){return respond({error:'Cannot read exact primary Etsy claim: '+String(e?.message||'unavailable').slice(0,170)},409);}
}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return respond({error:'Same-origin witness review required.'},403);
 let b;try{b=await c.request.json();}catch{return respond({error:'JSON required.'},400);}
 if(Number(b?.product_id)!==53||String(b?.listing_id)!==listing||!uuid(b?.request_key)||
   !['record_candidate_witness','record_photo_retest'].includes(b?.action)||b?.confirm_no_etsy_changes!==true)
  return respond({error:'Exact existing Product/draft, unique request key and no-provider-change acknowledgement required.'},400);
 if(b.action==='record_candidate_witness'&&(b.confirm_checked_actual_etsy!==true||
    !['unclaimed','multiple_local_claims','same_product','another_product'].includes(b.expected_claim_state)||
    typeof b.witness_note!=='string'||b.witness_note.trim().length<15||b.witness_note.length>500))
  return respond({error:'Manually inspect the draft and supply exact claim-state, note and explicit owner witness.'},400);
 if(b.action==='record_photo_retest'&&(!hex(b.evidence_fingerprint)||b.confirm_original_344!==true||
    b.confirm_original_345!==true||b.confirm_original_346!==true||b.confirm_visual_equality!==true))
  return respond({error:'Three current original/Etsy photo pairs, exact digest and individual visual confirmations are required.'},400);
 try{
  const r=await snapshot(c,g.db),retest=b.action==='record_photo_retest';
  if(retest&&(!r.claim.confirmed||r.provider?.verified_unpublished!==true||!r.photos?.ready||
     r.provider.evidence_fingerprint_508!==b.evidence_fingerprint||
     !ORIGINAL_IDS_509.every(id=>r.photos.rows.some(row=>row.product_image_id===id&&row.ready))))
   return respond({error:'HOLD — exact saved Etsy link, current three photo URLs, remote receipts or fingerprint are not independently verified.',issues:r.issues},409);
  if(!retest&&r.claim.claim_state!==b.expected_claim_state)
   return respond({error:'HOLD — local listing ownership changed. Refresh the D1 primary witness before writing a note.'},409);
  const actionType=retest?'etsy_510_three_originals_retested':'etsy_510_unlinked_candidate_witnessed';
  const details={build:510,request_key:b.request_key,product_id:53,listing_id:listing,
   source_claim_state:r.claim.claim_state,source_claim_receipt_id:r.claim.receipt_id,
   evidence_fingerprint:retest?b.evidence_fingerprint:null,
   photo_original_ids:retest?[...ORIGINAL_IDS_509]:[],
   source_evidence_verified:retest,owner_observed_actual_etsy:!retest,
   witness_note:retest?null:b.witness_note.trim(),
   conclusion:retest?'owner_visual_retest_only':'observation_only_not_provider_verified',
   owner_approval_granted:false,publication_performed:false,provider_modified:false};
  const saved=await g.db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,?,'product','53','POST',?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type=? AND target_type='product' AND target_key='53' AND (json_extract(details_json,'$.request_key')=? OR (?=1 AND json_extract(details_json,'$.evidence_fingerprint')=?)))")
   .bind(g.admin.user_id,actionType,new URL(c.request.url).pathname,JSON.stringify(details),actionType,b.request_key,Number(retest),retest?b.evidence_fingerprint:null).run();
  if(Number(saved.meta?.changes||0)!==1)return respond({error:'The same witness request or photo digest was already recorded. Refresh first; do not duplicate.'},409);
  return respond({witness_receipt_id:Number(saved.meta?.last_row_id)||null,
   candidate_observation_recorded:!retest,photo_retest_recorded:retest,
   local_link_confirmed:r.claim.confirmed,owner_approval_granted:false,
   message:retest?'Local three-original visual retest recorded; separate final approval still required.':
    'Owner observation recorded locally; the Etsy link remains unverified until independent primary and provider proof.'});
 }catch(e){return respond({error:'Witness/retest stays on HOLD: '+String(e?.message||'proof not available').slice(0,170)},409);}
}
