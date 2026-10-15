// Release 467 Build 404 — owner evidence, verified exception closure, publication-decision revalidation.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {connectionBlockers} from '../_lib/etsyDraftTrial399.mjs';
import {decryptOAuthSecret} from '../_lib/oauthSecurity.js';
import {validId} from '../_lib/etsyListingEvidence400.mjs';
import {validRequestKey} from '../_lib/etsyDraftDecision403.mjs';
import {validHoldId,evidenceDescription,fullConsent,holdIsOriginal,evidenceForHold,resolutionForHold,gateFreshDraft,finalRevalidation,receiptDetails} from '../_lib/etsyExceptionResolution404.mjs';

const reply=(body,status=200)=>jsonResponse({ok:status<400,build:404,provider_write:false,publication_performed:false,listing_activation:false,automatic_retry:false,...body},status,{'Cache-Control':'no-store'});
const draftPattern=/^[a-zA-Z0-9-]{16,80}$/;
const q={
 draft:"SELECT id,channel_key,product_id,payload_json,status,external_reference FROM marketplace_syndication_drafts WHERE id=? AND channel_key='etsy' LIMIT 1",
 product:"SELECT product_id,name,price_cents,currency,inventory_quantity FROM products WHERE product_id=? LIMIT 1",
 conn:"SELECT remote_subject_id,connection_status,scopes_json,access_expires_at,access_token_ciphertext FROM oauth_provider_connections WHERE provider_key='etsy' LIMIT 1",
 shop:"SELECT shop_id,owner_user_id,shop_name,currency_code,acceptance_status FROM etsy_oauth_shop_connections WHERE provider_key='etsy' LIMIT 1",
 receipt:"SELECT admin_action_audit_id,created_at,details_json FROM admin_action_audit WHERE action_type=? AND target_type='marketplace_draft' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1",
 latestDecision:"SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='etsy_draft_403_owner_decision' AND target_type='marketplace_draft' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1",
 latestHold:"SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='etsy_draft_403_owner_decision' AND json_extract(details_json,'$.decision')='HOLD_OWNER_REVIEW' AND target_type='marketplace_draft' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1",
 activeHolds:"SELECT h.admin_action_audit_id,h.created_at,h.details_json FROM admin_action_audit h WHERE h.action_type='etsy_draft_403_owner_decision' AND h.target_type='marketplace_draft' AND h.target_key=? AND json_extract(h.details_json,'$.decision')='HOLD_OWNER_REVIEW' AND NOT EXISTS (SELECT 1 FROM admin_action_audit r WHERE r.action_type='etsy_exception_404_resolved' AND r.target_type='marketplace_draft' AND r.target_key=h.target_key AND CAST(json_extract(r.details_json,'$.hold_receipt') AS INTEGER)=h.admin_action_audit_id) ORDER BY h.admin_action_audit_id DESC LIMIT 12",
 exactHold:"SELECT admin_action_audit_id,created_at,details_json FROM admin_action_audit WHERE action_type='etsy_draft_403_owner_decision' AND target_type='marketplace_draft' AND target_key=? AND admin_action_audit_id=? LIMIT 1",
 exactEvidence:"SELECT admin_action_audit_id,created_at,details_json FROM admin_action_audit WHERE action_type='etsy_exception_404_evidence' AND target_type='marketplace_draft' AND target_key=? AND admin_action_audit_id=? LIMIT 1",
 resolvedByHold:"SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='etsy_exception_404_resolved' AND target_type='marketplace_draft' AND target_key=? AND CAST(json_extract(details_json,'$.hold_receipt') AS INTEGER)=? ORDER BY admin_action_audit_id DESC LIMIT 1",
 latestRevalidation:"SELECT admin_action_audit_id,created_at,details_json FROM admin_action_audit WHERE action_type='etsy_decision_404_revalidated' AND target_type='marketplace_draft' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1",
 requestReceipt:"SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type=? AND target_type='marketplace_draft' AND target_key=? AND json_extract(details_json,'$.request_key')=? ORDER BY admin_action_audit_id DESC LIMIT 1"
};
const receipt=(db,action,id)=>db.prepare(q.receipt).bind(action,id).first();
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:reply({error:'Verified active Administrator required.'},401)}:!db?
 {error:reply({error:'Database unavailable.'},503)}:{admin,db};}
async function local(db,id){
 const draft=await db.prepare(q.draft).bind(id).first();if(!draft)return null;
 const [product,claim,imageClaim,uploaded,review,reconciled,accepted,active,lastDecision,lastHold,revalidated]=await Promise.all([
 db.prepare(q.product).bind(draft.product_id).first(),
 ...['etsy_remote_draft_trial_claimed','etsy_image_upload_401_claimed','etsy_image_upload_401_accepted',
  'etsy_draft_completion_401_review','etsy_image_outcome_402_reconciled','etsy_draft_402_final_accepted']
  .map(a=>receipt(db,a,id)),
 db.prepare(q.activeHolds).bind(id).all(),
 db.prepare(q.latestDecision).bind(id).first(),
 db.prepare(q.latestHold).bind(id).first(),
 db.prepare(q.latestRevalidation).bind(id).first()
 ]);
 return {draft,product,claim,imageClaim,uploaded,review,reconciled,accepted,
  activeHolds:active?.results||[],lastDecision,lastHold,revalidated};
}
const summary=s=>({draft_id:s.draft.id,listing_id:s.draft.external_reference||null,product_id:s.product?.product_id||null,
 active_holds:s.activeHolds.map(h=>({receipt:h.admin_action_audit_id,category:receiptDetails(h)?.category,
  notes:receiptDetails(h)?.notes,at:h.created_at})),
 newest_403_decision:s.lastDecision?.admin_action_audit_id||null,
 last_403_decision:receiptDetails(s.lastDecision)?.decision||null,
 last_hold_receipt:s.lastHold?.admin_action_audit_id||null,
 build402_acceptance_receipt:s.accepted?.admin_action_audit_id||null,
 last_revalidation_receipt:s.revalidated?.admin_action_audit_id||null});
async function auth(db,env){
 const [conn,shop]=await Promise.all([db.prepare(q.conn).first(),db.prepare(q.shop).first()]);
 const blockers=connectionBlockers(conn,shop,env);
 let scopes=[];try{scopes=JSON.parse(conn?.scopes_json||'[]');}catch{}
 if(!Array.isArray(scopes)||!scopes.includes('listings_r'))blockers.push('listings_r_missing');
 if(blockers.length)return {error:reply({error:'Current Etsy read authorization unavailable.',blockers},409)};
 const token=await decryptOAuthSecret(env,conn.access_token_ciphertext,'oauth-token|etsy|access');
 if(!token)return {error:reply({error:'Etsy token unavailable.'},409)};
 return {shop,headers:{Accept:'application/json','x-api-key':String(env.ETSY_API_KEYSTRING)+':'+String(env.ETSY_SHARED_SECRET),Authorization:'Bearer '+token}};
}
async function providerGet(path,headers){
 const r=await fetch('https://api.etsy.com/v3/application/'+path,{method:'GET',redirect:'manual',headers});
 if(r.status>=300&&r.status<400)throw Error('etsy_redirect');
 if(!r.ok)throw Error('etsy_read_'+r.status);
 return r.json();
}
async function fresh(a,s,chosen,shipping){
 const listingId=String(s.draft.external_reference||'');
 if(!validId(listingId)||!s.product||!s.claim)throw Error('build399_400_local_link_required');
 const [listing,images]=await Promise.all([
 providerGet('listings/'+encodeURIComponent(listingId),a.headers),
 providerGet('listings/'+encodeURIComponent(listingId)+'/images',a.headers)
 ]);
 return gateFreshDraft({listing,images,shop:a.shop,product:s.product,draft:s.draft,claim:s.claim,
  imageClaim:s.imageClaim,uploaded:s.uploaded,reconciled:s.reconciled,review:s.review,accepted:s.accepted,
  selected_image_id:chosen,shipping_reviewed:shipping});
}
async function writeOnce(g,id,request,action,details){
 const existing=await g.db.prepare(q.requestReceipt).bind(action,id,details.request_key).first();
 if(existing){
  const old=receiptDetails(existing);
  if(JSON.stringify(old)!==JSON.stringify(details))return {error:reply({error:'Request key already belongs to different evidence.'},409)};
  return {receipt:existing.admin_action_audit_id,idempotent:true};
 }
 const sql="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) "+
 "SELECT ?,?,'marketplace_draft',?,'POST',?,?,CURRENT_TIMESTAMP "+
 "WHERE EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE id=? AND channel_key='etsy' AND external_reference=?) "+
 "AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type=? AND target_type='marketplace_draft' AND target_key=? AND json_extract(details_json,'$.request_key')=?)";
 await g.db.prepare(sql).bind(g.admin.user_id,action,id,new URL(request.url).pathname,JSON.stringify(details),
  id,details.listing_id,action,id,details.request_key).run();
 const confirmed=await g.db.prepare(q.requestReceipt).bind(action,id,details.request_key).first();
 if(!confirmed||JSON.stringify(receiptDetails(confirmed))!==JSON.stringify(details))
  return {error:reply({error:'Evidence receipt not confirmed; manual audit HOLD.'},409)};
 return {receipt:confirmed.admin_action_audit_id,idempotent:false};
}
export async function onRequestGet(c){
 const g=gate(c);if(g.error)return g.error;
 const id=new URL(c.request.url).searchParams.get('draft_id');
 if(!draftPattern.test(String(id||'')))return reply({error:'Choose staged draft UUID.'},400);
 try{const s=await local(g.db,id);return s?reply({...summary(s),provider_read_performed:false,readiness:'OPERATOR_RECHECK_REQUIRED'}):
  reply({error:'Local Etsy draft not found.'},404);}
 catch{return reply({error:'Local audit unavailable. No Etsy call.'},503);}
}
export async function onRequestPost(c){
 const g=gate(c);if(g.error)return g.error;
 let b;try{b=await c.request.json();}catch{return reply({error:'JSON required.'},400);}
 const id=String(b?.draft_id||''),action=b?.action;
 if(!draftPattern.test(id)||!['inspect_resolution','record_remediation_evidence','resolve_exception','revalidate_decision'].includes(action))
  return reply({error:'Choose valid draft and supported owner action.'},400);
 const isWrite=action!=='inspect_resolution';
 if(isWrite&&!validRequestKey(b.request_key))return reply({error:'Unique request key required.'},400);
 if(action==='record_remediation_evidence'&&!evidenceDescription(b.operator_correction))
  return reply({error:'Describe actual corrective work and evidence in 20–1600 characters.'},400);
 if((action==='resolve_exception'||action==='revalidate_decision')&&!fullConsent(b))
  return reply({error:'All owner compliance, correction and unpublished-only confirmations required.'},400);
 if(action!=='revalidate_decision'&&b.hold_receipt!=null&&!validHoldId(b.hold_receipt))
  return reply({error:'Valid Build 403 HOLD audit receipt required.'},400);
 try{
  const s=await local(g.db,id);
  if(!s?.claim||!s.product||!validId(s.draft.external_reference))return reply({error:'Verified Build 399/400 local draft linkage required.'},409);
  const shared={...summary(s),provider_read_performed:false};
  const holdID=validHoldId(b.hold_receipt)?Number(b.hold_receipt):null;
  let hold=null;if(holdID)hold=await g.db.prepare(q.exactHold).bind(id,holdID).first();
  if((action==='record_remediation_evidence'||action==='resolve_exception')&&!holdIsOriginal(hold,holdID,s.draft.external_reference))
   return reply({...shared,error:'Specific original Build 403 HOLD receipt not found for this listing.'},409);
  if(action==='record_remediation_evidence'){
   const details={build:404,request_key:b.request_key,hold_receipt:holdID,listing_id:String(s.draft.external_reference),
    category:receiptDetails(hold)?.category||'OTHER',operator_correction:b.operator_correction.trim(),
    verification:'OWNER_REPORTED_UNVERIFIED',provider_read_performed:false,publication_performed:false};
   const saved=await writeOnce(g,id,c.request,'etsy_exception_404_evidence',details);
   if(saved.error)return saved.error;
   return reply({...shared,evidence_receipt:saved.receipt,idempotent:saved.idempotent,
    message:'Owner correction evidence recorded locally; HOLD remains until independent provider recheck and explicit resolution.'});
  }
  const a=await auth(g.db,c.env);if(a.error)return a.error;
  let snapshot;try{snapshot=await fresh(a,s,b.image_id,b.owner_checked_shipping===true);}
  catch(e){return reply({...shared,error:'Current Etsy draft verification failed: '+String(e?.message||'unknown')+'. No resolution recorded.'},409);}
  if(action==='inspect_resolution')return reply({...shared,provider_read_performed:true,snapshot,
   message:'Live Etsy draft and image evidence checked. Provider unchanged.'});
  if(action==='resolve_exception'){
   const evidenceId=validHoldId(b.evidence_receipt)?Number(b.evidence_receipt):null;
   const evidence=evidenceId?await g.db.prepare(q.exactEvidence).bind(id,evidenceId).first():null;
   if(!evidenceForHold(evidence,holdID,s.draft.external_reference))
    return reply({...shared,snapshot,error:'Original owner corrective evidence receipt required for this HOLD.'},409);
   if(!snapshot.can_close_exception)return reply({...shared,snapshot,error:'Provider evidence is still blocked; cannot resolve HOLD.'},409);
   const previous=await g.db.prepare(q.resolvedByHold).bind(id,holdID).first();
   if(previous){
    if(!resolutionForHold(previous,holdID,s.draft.external_reference)||
     receiptDetails(previous)?.evidence_receipt!==evidenceId)
     return reply({...shared,error:'Conflicting previous HOLD resolution; manual review required.'},409);
    return reply({...shared,resolved:true,idempotent:true,resolution_receipt:previous.admin_action_audit_id});
   }
   const details={build:404,request_key:b.request_key,hold_receipt:holdID,evidence_receipt:evidenceId,
    listing_id:String(s.draft.external_reference),selected_image_id:snapshot.selected_image_id,
    resolution:'RESOLVED_BY_FRESH_PROVIDER_GET',build402_acceptance_receipt:s.accepted?.admin_action_audit_id||null,
    owner_approvals:true,publication_performed:false};
   // One resolution per exact hold receipt, even with different request keys.
   const insert="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) "+
    "SELECT ?,'etsy_exception_404_resolved','marketplace_draft',?,'POST',?,?,CURRENT_TIMESTAMP "+
    "WHERE EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE id=? AND channel_key='etsy' AND external_reference=?) "+
    "AND EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_exception_404_evidence' AND target_type='marketplace_draft' AND target_key=? AND admin_action_audit_id=?) "+
    "AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_exception_404_resolved' AND target_type='marketplace_draft' AND target_key=? AND CAST(json_extract(details_json,'$.hold_receipt') AS INTEGER)=?)";
   await g.db.prepare(insert).bind(g.admin.user_id,id,new URL(c.request.url).pathname,JSON.stringify(details),
    id,details.listing_id,id,evidenceId,id,holdID).run();
   const resolved=await g.db.prepare(q.resolvedByHold).bind(id,holdID).first();
   if(!resolutionForHold(resolved,holdID,s.draft.external_reference)||receiptDetails(resolved)?.evidence_receipt!==evidenceId)
    return reply({...shared,error:'Conflicting concurrent resolution. Inspect audit, no repeat upload.'},409);
   return reply({...shared,resolved:true,resolution_receipt:resolved.admin_action_audit_id,
    idempotent:receiptDetails(resolved)?.request_key!==b.request_key,
    message:'Specific HOLD resolved against current Etsy GET evidence; no Etsy write and no publication.'});
  }
  // Recheck current exception ledger before any decision can be marked revalidated.
  const freshState=await local(g.db,id);
  const result=finalRevalidation({snapshot,activeHolds:freshState.activeHolds,
   lastDecision:freshState.lastDecision,lastHold:freshState.lastHold,selectedImage:b.image_id,acceptance:freshState.accepted});
  if(result.status!=='REVALIDATED_FOR_SEPARATE_MANUAL_ETSY_DECISION')
   return reply({...summary(freshState),provider_read_performed:true,revalidation:result,
    error:'Unresolved or later HOLD / stale owner readiness. Revisit Build 403 after correction.'},409);
  const details={build:404,request_key:b.request_key,listing_id:String(s.draft.external_reference),
   image_id:result.selected_image_id,latest_403_receipt:result.latest_403_receipt,
   build402_acceptance_receipt:freshState.accepted.admin_action_audit_id,
   decision:'REVALIDATED_FOR_SEPARATE_MANUAL_ETSY_DECISION',owner_acknowledgements:true,
   provider_evidence:'FRESH_GET_ONLY',publication_performed:false,publication_authorized:false};
  const saved=await writeOnce(g,id,c.request,'etsy_decision_404_revalidated',details);
  if(saved.error)return saved.error;
  return reply({...summary(freshState),provider_read_performed:true,revalidation:result,
   revalidation_receipt:saved.receipt,idempotent:saved.idempotent,
   message:'Readiness for a separate manual owner publication decision revalidated. Etsy remains an unpublished draft.'});
 }catch{return reply({error:'Resolution/revalidation not confirmed. Inspect local audit; no Etsy mutation or retry.'},503);}
}
