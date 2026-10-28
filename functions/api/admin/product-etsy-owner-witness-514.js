/* Build 514: exact saved Etsy draft owner observation and separate local
 * disposition evidence only. It cannot close an unverified conflict or write Etsy. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {onRequestGet as evidenceGet513} from './product-etsy-disposition-513.js';
import {ownerWitnessReadiness514} from '../_lib/etsyOwnerWitness514.mjs';
const listing='4603838854';
const uuid=x=>/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(String(x||''));
const response=(data,status=200)=>jsonResponse({ok:status<400,build:514,product_id:53,
 listing_id:listing,owner_final_approval:false,verified_owner_identity:false,
 etsy_draft_created:false,local_listing_claim_reassigned:false,
 etsy_provider_modified:false,publication_performed:false,connection_state:'DISCONNECTED',...data},
 status,{'Cache-Control':'no-store'});
const gate=c=>{const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:response({error:'Verified Admin required.'},401)}:
 !db?{error:response({error:'Local D1 unavailable.'},503)}:{admin,db};};
async function read(c,g){
 const evidence=await evidenceGet513({...c,request:new Request(new URL('/api/admin/product-etsy-disposition-513?product_id=53',c.request.url),{
  method:'GET',headers:c.request.headers})});
 if(!evidence.ok)throw Error('Build 513 actual Product/Etsy review unavailable.');
 const source=await evidence.json();
 if(!source.ok)throw Error('Build 513 exact Product source is not valid.');
 const [priorOwner,priorContent]=await Promise.all([
  g.db.prepare("SELECT admin_action_audit_id,actor_user_id,details_json FROM admin_action_audit WHERE action_type='etsy_514_factual_owner_witness' AND target_type='product' AND target_key='53' ORDER BY admin_action_audit_id DESC LIMIT 1").first(),
  g.db.prepare("SELECT admin_action_audit_id,actor_user_id,details_json FROM admin_action_audit WHERE action_type='etsy_513_independent_content_recheck' AND target_type='product' AND target_key='53' ORDER BY admin_action_audit_id DESC LIMIT 1").first()]);
 return ownerWitnessReadiness514({evidence513:source,priorOwner,priorContent,actorId:g.admin.user_id});
}
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
 if(new URL(c.request.url).searchParams.get('product_id')!=='53')return response({error:'Exact Product #53 required.'},400);
 try{return response({...await read(c,g),read_only:true});}
 catch{return response({error:'Current primary claim/owner-content evidence unavailable; HOLD.'},503);}
}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return response({error:'Same origin required.'},403);
 let b;try{b=await c.request.json();}catch{return response({error:'JSON object required.'},400);}
 const note=b?.action==='record_factual_owner_witness',recheck=b?.action==='record_independent_disposition_recheck';
 if((!note&&!recheck)||!uuid(b?.request_key)||b.product_id!==53||String(b.listing_id)!==listing||
  b.confirm_existing_draft_only!==true||b.confirm_no_etsy_changes!==true||
  b.confirm_not_final_approval!==true)return response({error:'Exact saved listing, unique request and non-publishing acknowledgments required.'},400);
 if(note&&(typeof b.observation_note!=='string'||b.observation_note.trim().length<30||
  b.observation_note.length>800||b.confirm_direct_owner_draft_inspection!==true||
  b.confirm_unresolved_media_conflicts!==true))
  return response({error:'A factual 30–800 character owner observation and direct-draft/unresolved-conflict confirmations are required.'},400);
 if(recheck&&(b.confirm_corrected_description!==true||b.confirm_corrected_tags!==true||
  b.confirm_current_category_delivery!==true||b.confirm_all_three_originals!==true||
  b.confirm_independent_reviewer!==true||!/^[a-f0-9]{64}$/.test(String(b.evidence_fingerprint||''))))
  return response({error:'Fresh real owner metadata/photo confirmations and a distinct Admin reviewer are required.'},400);
 try{const state=await read(c,g);
  if(b.expected_claim_state!==state.claim_state||
   b.expected_claim_receipt_id!==(state.claim_receipt_id||null)||
   JSON.stringify(b.expected_conflicting_photo_receipt_ids)!==JSON.stringify(state.conflicting_photo_receipt_ids))
   return response({error:'Saved claim or historical media conflict changed. Refresh and inspect again.'},409);
  if(note&&!state.can_record_factual_owner_observation)return response({error:'No saved Product #53 evidence for an observation.'},409);
  if(recheck&&(!state.can_record_independent_disposition_recheck||
   b.prior_content_recheck_id!==state.prior_content_recheck_id||
   b.evidence_fingerprint!==state.current_evidence_fingerprint))
   return response({error:'Independent reviewer, saved-content source or three originals not verified. HOLD.',issues:state.issues},409);
  const action=note?'etsy_514_factual_owner_witness':'etsy_514_independent_disposition_recheck';
  const details={build:514,request_key:b.request_key,product_id:53,listing_id:listing,
   claim_state:state.claim_state,claim_receipt_id:state.claim_receipt_id,
   conflicting_photo_receipt_ids:state.conflicting_photo_receipt_ids,
   prior_content_recheck_id:recheck?state.prior_content_recheck_id:null,
   evidence_fingerprint:recheck?state.current_evidence_fingerprint:null,
   observation_note:note?b.observation_note.trim():null,
   decision:note?'factual_owner_draft_observation_only':'independent_local_disposition_recheck_only',
   independent_owner_identity_verified:false,final_owner_approval:false,
   historical_conflicts_closed:false,etsy_provider_modified:false,publication_performed:false};
  const sql="INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,?,'product','53','POST',?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type=? AND target_type='product' AND target_key='53' AND json_extract(details_json,'$.request_key')=?) AND (?=0 OR (EXISTS (SELECT 1 FROM admin_action_audit WHERE admin_action_audit_id=? AND action_type='etsy_513_independent_content_recheck' AND actor_user_id<>? AND json_extract(details_json,'$.evidence_fingerprint')=?) AND (SELECT COUNT(*) FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=?)=1 AND EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=? AND product_id=53))) AND (?=1 OR (?=CASE WHEN (SELECT COUNT(*) FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=?)=0 THEN 'unclaimed' WHEN (SELECT COUNT(*) FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=?)>1 THEN 'multiple_local_claims' WHEN EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=? AND product_id=53) THEN 'same_product' ELSE 'another_product' END))";
  const result=await g.db.prepare(sql).bind(g.admin.user_id,action,new URL(c.request.url).pathname,
   JSON.stringify(details),action,b.request_key,recheck?1:0,
   recheck?state.prior_content_recheck_id:null,g.admin.user_id,
   recheck?state.current_evidence_fingerprint:null,listing,listing,
   recheck?1:0,state.claim_state,listing,listing,listing).run();
  if(Number(result.meta?.changes)!==1)return response({error:'Saved evidence/reviewer changed or duplicate request. Refresh.'},409);
  return response({receipt_id:Number(result.meta?.last_row_id)||null,
   factual_owner_observation_recorded:note,independent_local_recheck_recorded:recheck,
   outcome:'OWNER_EVIDENCE_HOLD',message:'Only an owner observation/local independent evidence receipt was recorded. Etsy and gateway remain unchanged.'});
 }catch{return response({error:'Owner-evidence D1 review unavailable; no Etsy or gateway change.'},503);}
}
