/* Build 515: independent factual owner-observation reassessment. This only
 * appends an unresolved evidence decision to existing D1 admin audit. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {onRequestGet as review514Get} from './product-etsy-owner-witness-514.js';
import {conflictReassessment515,DISPOSITIONS_515} from '../_lib/etsyConflictReassessment515.mjs';
const listing='4603838854';
const uuid=x=>/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(String(x||''));
const response=(data,status=200)=>jsonResponse({ok:status<400,build:515,
 product_id:53,listing_id:listing,owner_final_approval:false,
 historical_media_conflict_resolved:false,etsy_provider_modified:false,
 listing_id_reassigned:false,etsy_draft_created:false,publication_performed:false,
 connection_state:'DISCONNECTED',...data},status,{'Cache-Control':'no-store'});
const gate=c=>{const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:response({error:'Verified Admin required.'},401)}:
 !db?{error:response({error:'D1 source unavailable.'},503)}:{admin,db};};
async function read(c,g){const prior=await review514Get({...c,request:new Request(
 new URL('/api/admin/product-etsy-owner-witness-514?product_id=53',c.request.url),{
 method:'GET',headers:c.request.headers})});
 if(!prior.ok)throw Error('Build 514 primary owner evidence not readable.');
 const source=await prior.json();if(!source.ok)throw Error('Build 514 source invalid.');
 const [owner,independent]=await Promise.all([
  g.db.prepare("SELECT admin_action_audit_id,actor_user_id,details_json FROM admin_action_audit WHERE action_type='etsy_514_factual_owner_witness' AND target_type='product' AND target_key='53' ORDER BY admin_action_audit_id DESC LIMIT 1").first(),
  g.db.prepare("SELECT admin_action_audit_id,actor_user_id,details_json FROM admin_action_audit WHERE action_type='etsy_514_independent_disposition_recheck' AND target_type='product' AND target_key='53' ORDER BY admin_action_audit_id DESC LIMIT 1").first()]);
 return conflictReassessment515({review514:source,priorOwner:owner,priorIndependent:independent,actorId:g.admin.user_id});
}
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
 if(new URL(c.request.url).searchParams.get('product_id')!=='53')return response({error:'Exact Product #53 required.'},400);
 try{return response({...await read(c,g),read_only:true});}
 catch{return response({error:'Product #53 conflict source unavailable; HOLD.'},503);}
}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return response({error:'Same origin Admin request required.'},403);
 let b;try{b=await c.request.json();}catch{return response({error:'JSON required.'},400);}
 if(b?.action!=='record_independent_conflict_reassessment'||!uuid(b.request_key)||
   b.product_id!==53||String(b.listing_id)!==listing||
   !DISPOSITIONS_515.includes(b.disposition)||
   b.confirm_exact_existing_draft!==true||b.confirm_distinct_reviewer!==true||
   b.confirm_unresolved_only!==true||b.confirm_no_etsy_changes!==true||
   typeof b.observation_note!=='string'||b.observation_note.trim().length<30||
   b.observation_note.length>800)
  return response({error:'A factual unresolved disposition, separate reviewer, exact existing draft and no-provider-write consent are required.'},400);
 try{const e=await read(c,g);
  if(!e.can_record_independent_conflict_reassessment||
    Number(b.prior_owner_witness_id)!==e.prior_owner_witness_id||
    b.expected_claim_state!==e.source_claim_state||
    b.expected_claim_receipt_id!==(e.source_claim_receipt_id||null)||
    JSON.stringify(b.expected_conflicting_receipt_ids)!==JSON.stringify(e.conflicting_photo_receipt_ids)||
    b.expected_photo_fingerprint!==(e.source_evidence_fingerprint||null))
   return response({error:'Owner observation or exact source claim/media fingerprint changed; refresh before any local note.',issues:e.issues},409);
  const details={build:515,request_key:b.request_key,product_id:53,listing_id:listing,
   prior_owner_witness_id:e.prior_owner_witness_id,
   claim_state:e.source_claim_state,claim_receipt_id:e.source_claim_receipt_id,
   conflicting_photo_receipt_ids:e.conflicting_photo_receipt_ids,
   source_evidence_fingerprint:e.source_evidence_fingerprint,
   disposition:b.disposition,observation_note:b.observation_note.trim(),
   decision:'independent_owner_conflict_reassessment_unresolved_only',
   independently_verified_owner_identity:false,history_repaired:false,
   owner_final_approval:false,etsy_provider_modified:false,publication_performed:false};
  const sql="INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,'etsy_515_independent_owner_conflict_reassessment','product','53','POST',?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_515_independent_owner_conflict_reassessment' AND target_type='product' AND target_key='53' AND json_extract(details_json,'$.request_key')=?) AND EXISTS (SELECT 1 FROM admin_action_audit WHERE admin_action_audit_id=? AND action_type='etsy_514_factual_owner_witness' AND actor_user_id<>? AND json_extract(details_json,'$.claim_state')=? AND json_extract(details_json,'$.claim_receipt_id') IS ?) AND (?=CASE WHEN (SELECT COUNT(*) FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=?)=0 THEN 'unclaimed' WHEN (SELECT COUNT(*) FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=?)>1 THEN 'multiple_local_claims' WHEN EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=? AND product_id=53) THEN 'same_product' ELSE 'another_product' END)";
  const result=await g.db.prepare(sql).bind(g.admin.user_id,new URL(c.request.url).pathname,
   JSON.stringify(details),b.request_key,e.prior_owner_witness_id,g.admin.user_id,
   e.source_claim_state,e.source_claim_receipt_id,e.source_claim_state,listing,listing,listing).run();
  if(Number(result.meta?.changes)!==1)return response({error:'Owner witness or local claim changed or request already recorded; refresh.'},409);
  return response({receipt_id:Number(result.meta?.last_row_id)||null,
   independent_unresolved_reassessment_recorded:true,
   outcome:'UNRESOLVED_EVIDENCE_HOLD',
   message:'Independent unresolved owner-exception note saved. The existing Etsy draft and gateway remain unchanged.'});
 }catch{return response({error:'D1 evidence unavailable; no Etsy or gateway change occurred.'},503);}
}
