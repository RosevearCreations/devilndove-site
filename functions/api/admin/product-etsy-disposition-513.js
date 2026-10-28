/* Build 513: owner-led exception disposition notes and independent content
 * correction RECHECK. No Etsy write, local claim transfer or final approval. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {onRequestGet as evidenceGet512} from './product-etsy-review-512.js';
import {readExistingDraftLocal486} from './product-etsy-existing-draft.js';
import {reviewOwnerEtsy504} from './product-etsy-owner-signoff-504.js';
import {readOverride499} from '../_lib/channelTagOverrides499.mjs';
import {disposition513} from '../_lib/etsyDisposition513.mjs';
const listing='4603838854';
const uuid=x=>/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(String(x||''));
const response=(data,status=200)=>jsonResponse({ok:status<400,build:513,product_id:53,
 listing_id:listing,connection_state:'HOLD',provider_modified:false,publication_performed:false,
 etsy_draft_created:false,local_claim_reassigned:false,owner_final_approval:false,...data},status,{'Cache-Control':'no-store'});
const gate=c=>{const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:response({error:'Verified Admin required.'},401)}:
  !db?{error:response({error:'Product/evidence D1 unavailable.'},503)}:{admin,db};};
async function read(c,db,admin){
 const evidenceResponse=await evidenceGet512({...c,request:new Request(new URL('/api/admin/product-etsy-review-512?product_id=53',c.request.url),{
  method:'GET',headers:c.request.headers})});
 if(!evidenceResponse.ok)throw Error('Build 512 exact primary claim evidence cannot be confirmed.');
 const claimEvidence=await evidenceResponse.json();
 const [state,seo,override,witness,recheck]=await Promise.all([
  readExistingDraftLocal486(db,53),
  db.prepare('SELECT keywords FROM product_seo WHERE product_id=53 LIMIT 1').first(),
  readOverride499(db,53,'etsy'),
  db.prepare("SELECT admin_action_audit_id,actor_user_id,details_json FROM admin_action_audit WHERE action_type='etsy_512_local_conflict_witness' AND target_type='product' AND target_key='53' ORDER BY admin_action_audit_id DESC LIMIT 1").first(),
  db.prepare("SELECT admin_action_audit_id,actor_user_id,details_json FROM admin_action_audit WHERE action_type='etsy_512_independent_photo_recheck' AND target_type='product' AND target_key='53' ORDER BY admin_action_audit_id DESC LIMIT 1").first()]);
 if(!state.product)return {error:'Saved Product #53 is missing.',issues:['Local Product not found.']};
 let live=null,error=null;
 if(claimEvidence.linked)try{live=await reviewOwnerEtsy504(c,db,53);}catch(e){error=String(e?.message||'unavailable').slice(0,140);}
 const result=disposition513({claimEvidence,product:state.product,seo,override,
  live,priorWitness:witness,priorPhotoRecheck:recheck,actorId:admin.user_id});
 if(error){result.issues.push('Live Etsy comparison unavailable: '+error);result.can_record_independent_content_recheck=false;}
 return result;
}
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
 if(new URL(c.request.url).searchParams.get('product_id')!=='53')return response({error:'Exact Product #53 required.'},400);
 try{return response({...await read(c,g.db,g.admin),read_only:true});}
 catch{return response({error:'Product/Etsy content and source exception readback unavailable; HOLD.'},503);}
}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return response({error:'Same-origin verified Admin required.'},403);
 let b;try{b=await c.request.json();}catch{return response({error:'JSON required.'},400);}
 const follow=b?.action==='record_exception_disposition_followup',recheck=b?.action==='record_content_correction_recheck';
 if((!follow&&!recheck)||!uuid(b.request_key)||b.product_id!==53||String(b.listing_id)!==listing||
    b.confirm_no_etsy_changes!==true)return response({error:'Exact existing draft, UUID and no-provider-write consent required.'},400);
 if(follow&&(typeof b.disposition_note!=='string'||b.disposition_note.trim().length<20||
   b.disposition_note.length>600||b.confirm_unresolved_exception_review!==true))
  return response({error:'A factual 20–600 character unresolved-exception note and manual review are required.'},400);
 if(recheck&&(b.confirm_saved_description!==true||b.confirm_product_specific_tags!==true||
   b.confirm_etsy_category!==true||b.confirm_price_quantity_delivery!==true||
   b.confirm_original_344!==true||b.confirm_original_345!==true||b.confirm_original_346!==true||
   b.confirm_distinct_reviewer!==true||!/^[a-f0-9]{64}$/.test(String(b.evidence_fingerprint||''))))
  return response({error:'Actual owner content, category, saved tags, Canada-only delivery, each original and separate reviewer confirmations are required.'},400);
 try{const state=await read(c,g.db,g.admin);
  if(b.expected_claim_state!==state.source_claim_state||
    b.expected_claim_receipt_id!==(state.source_claim_receipt_id||null)||
    JSON.stringify(b.expected_conflicting_receipt_ids)!==JSON.stringify(state.conflicting_photo_receipt_ids))
   return response({error:'Local claim or historical media conflict changed; refresh before recording.'},409);
  if(follow&&!state.can_record_disposition_followup)return response({error:'Exact prior witness and Product exception context required.'},409);
  if(recheck&&(!state.can_record_independent_content_recheck||
    b.evidence_fingerprint!==state.current_evidence_fingerprint||
    Number(b.prior_photo_recheck_id)!==state.prior_photo_recheck_id))
   return response({error:'HOLD — current Etsy content/photos have not passed a separate source-backed review.',issues:state.issues},409);
  const action=recheck?'etsy_513_independent_content_recheck':'etsy_513_exception_disposition_followup';
  const details={build:513,request_key:b.request_key,product_id:53,listing_id:listing,
   source_claim_state:state.source_claim_state,source_claim_receipt_id:state.source_claim_receipt_id,
   conflicting_photo_receipt_ids:state.conflicting_photo_receipt_ids,
   prior_conflict_witness_id:state.prior_conflict_witness_id,
   prior_photo_recheck_id:recheck?state.prior_photo_recheck_id:null,
   evidence_fingerprint:recheck?state.current_evidence_fingerprint:null,
   tag_source:state.tag_source,description_sufficient:state.description_sufficient,
   disposition_note:follow?b.disposition_note.trim():null,
   decision:follow?'unresolved_exception_owner_followup_only':'independent_content_evidence_rechecked_only',
   final_owner_approval:false,etsy_listing_link_changed:false,provider_modified:false,publication_performed:false};
  const written=await g.db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,?,'product','53','POST',?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type=? AND target_type='product' AND target_key='53' AND json_extract(details_json,'$.request_key')=?) AND (?=0 OR ((SELECT COUNT(*) FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=?)=1 AND EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=? AND product_id=53) AND EXISTS (SELECT 1 FROM admin_action_audit WHERE admin_action_audit_id=? AND action_type='etsy_512_independent_photo_recheck' AND actor_user_id<>? AND json_extract(details_json,'$.evidence_fingerprint')=?))) AND (?=1 OR (?=CASE WHEN (SELECT COUNT(*) FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=?)=0 THEN 'unclaimed' WHEN (SELECT COUNT(*) FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=?)>1 THEN 'multiple_local_claims' WHEN EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=? AND product_id=53) THEN 'same_product' ELSE 'another_product' END))")
   .bind(g.admin.user_id,action,new URL(c.request.url).pathname,JSON.stringify(details),action,b.request_key,
    recheck?1:0,listing,listing,recheck?state.prior_photo_recheck_id:null,g.admin.user_id,
    recheck?state.current_evidence_fingerprint:null,recheck?1:0,state.source_claim_state,listing,listing,listing).run();
  if(Number(written.meta?.changes)!==1)return response({error:'Exact claim/prior reviewer changed or this request was already recorded. Refresh.'},409);
  return response({receipt_id:Number(written.meta?.last_row_id)||null,
   disposition_followup_recorded:follow,independent_content_recheck_recorded:recheck,
   decision:'LOCAL_EVIDENCE_HOLD',message:'Local exception/content evidence saved. Final Etsy approval, provider actions and gateway connection remain separate.'});
 }catch{return response({error:'Local evidence unavailable; nothing was approved, closed or sent to Etsy.'},503);}
}
