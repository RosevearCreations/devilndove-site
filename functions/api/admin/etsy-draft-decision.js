// Release 467 Build 403 — operator exceptions and publication-decision readiness, no provider mutation.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {connectionBlockers} from '../_lib/etsyDraftTrial399.mjs';
import {decryptOAuthSecret} from '../_lib/oauthSecurity.js';
import {validId} from '../_lib/etsyListingEvidence400.mjs';
import {assessDraftPublicationReadiness,ownerReadyConsent,validRequestKey,validException,priorDecision} from '../_lib/etsyDraftDecision403.mjs';
const respond=(v,status=200)=>jsonResponse({ok:status<400,build:403,provider_write:false,automatic_retry:false,listing_activation:false,publication_performed:false,...v},status,{'Cache-Control':'no-store'});
const uuid=/^[a-zA-Z0-9-]{16,80}$/;
const sql={
 draft:"SELECT id,channel_key,product_id,payload_json,status,external_reference FROM marketplace_syndication_drafts WHERE id=? AND channel_key='etsy' LIMIT 1",
 product:"SELECT product_id,name,price_cents,currency,inventory_quantity FROM products WHERE product_id=? LIMIT 1",
 conn:"SELECT remote_subject_id,connection_status,scopes_json,access_expires_at,access_token_ciphertext FROM oauth_provider_connections WHERE provider_key='etsy' LIMIT 1",
 shop:"SELECT shop_id,owner_user_id,shop_name,currency_code,acceptance_status FROM etsy_oauth_shop_connections WHERE provider_key='etsy' LIMIT 1",
 receipt:"SELECT admin_action_audit_id,created_at,details_json FROM admin_action_audit WHERE action_type=? AND target_type='marketplace_draft' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1",
 decisions:"SELECT admin_action_audit_id,created_at,details_json FROM admin_action_audit WHERE action_type='etsy_draft_403_owner_decision' AND target_type='marketplace_draft' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 5"
};
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:respond({error:'Verified active Administrator required.'},401)}:!db?
 {error:respond({error:'Database unavailable.'},503)}:{admin,db};}
async function local(db,id){
 const draft=await db.prepare(sql.draft).bind(id).first();if(!draft)return null;
 const [product,claim,imageClaim,uploaded,review,reconciled,accepted,history]=await Promise.all([
  db.prepare(sql.product).bind(draft.product_id).first(),
  ...['etsy_remote_draft_trial_claimed','etsy_image_upload_401_claimed','etsy_image_upload_401_accepted',
   'etsy_draft_completion_401_review','etsy_image_outcome_402_reconciled','etsy_draft_402_final_accepted']
    .map(action=>db.prepare(sql.receipt).bind(action,id).first()),
  db.prepare(sql.decisions).bind(id).all()
 ]);
 return {draft,product,claim,imageClaim,uploaded,review,reconciled,accepted,history:history?.results||[]};
}
const summary=s=>({
 draft_id:s.draft.id,listing_id:s.draft.external_reference||null,product_id:s.product?.product_id||null,
 build402_final_acceptance_receipt:s.accepted?.admin_action_audit_id||null,
 decisions:s.history.map(r=>({receipt:r.admin_action_audit_id,at:r.created_at,decision:priorDecision(r)?.decision||'UNKNOWN',
   category:priorDecision(r)?.category||null,notes:priorDecision(r)?.notes||null,
   listing_id:priorDecision(r)?.listing_id||null})),
 provider_read_performed:false,no_automatic_publish:true});
async function auth(db,env){
 const [conn,shop]=await Promise.all([db.prepare(sql.conn).first(),db.prepare(sql.shop).first()]);
 const blockers=connectionBlockers(conn,shop,env);
 let scopes=[];try{scopes=JSON.parse(conn?.scopes_json||'[]');}catch{}
 if(!Array.isArray(scopes)||!scopes.includes('listings_r'))blockers.push('listings_r_missing');
 if(blockers.length)return {error:respond({error:'Current Etsy OAuth/shop read access not verified.',blockers},409)};
 const token=await decryptOAuthSecret(env,conn.access_token_ciphertext,'oauth-token|etsy|access');
 if(!token)return {error:respond({error:'Etsy read token unavailable.'},409)};
 return {shop,headers:{Accept:'application/json','x-api-key':String(env.ETSY_API_KEYSTRING)+':'+String(env.ETSY_SHARED_SECRET),Authorization:'Bearer '+token}};
}
async function getEtsy(path,headers){
 const response=await fetch('https://api.etsy.com/v3/application/'+path,{method:'GET',headers,redirect:'manual'});
 if(response.status>=300&&response.status<400)throw Error('etsy_redirect_refused');
 if(!response.ok)throw Error('etsy_get_'+response.status);
 return response.json();
}
async function evaluate(a,s,selected,shippingReviewed){
 const id=String(s.draft.external_reference||'');
 if(!validId(id)||!s.claim||!s.product)throw Error('build399_400_verified_linkage_missing');
 const [listing,images]=await Promise.all([
  getEtsy('listings/'+encodeURIComponent(id),a.headers),
  getEtsy('listings/'+encodeURIComponent(id)+'/images',a.headers)]);
 return assessDraftPublicationReadiness({listing,images,shop:a.shop,product:s.product,draft:s.draft,
  claim:s.claim,imageClaim:s.imageClaim,uploaded:s.uploaded,reconciled:s.reconciled,review:s.review,accepted:s.accepted,
  selected_image_id:selected,shipping_reviewed:shippingReviewed});
}
export async function onRequestGet(c){
 const g=gate(c);if(g.error)return g.error;
 const id=new URL(c.request.url).searchParams.get('draft_id');
 if(!uuid.test(String(id||'')))return respond({error:'Enter existing local draft UUID.'},400);
 try{const s=await local(g.db,id);return s?respond({...summary(s),source:'D1_ONLY',
  decision_readiness:'REQUIRES_FRESH_OPERATOR_ETSY_RECHECK'}):respond({error:'Local Etsy draft not found.'},404);}
 catch{return respond({error:'Local audit read unavailable. No provider call.'},503);}
}
export async function onRequestPost(c){
 const g=gate(c);if(g.error)return g.error;
 let b;try{b=await c.request.json();}catch{return respond({error:'JSON required.'},400);}
 const id=String(b?.draft_id||''),action=b?.action;
 if(!uuid.test(id)||!['inspect_exceptions','record_owner_hold','record_owner_ready'].includes(action))
  return respond({error:'Choose local Etsy draft and supported operator action.'},400);
 if(action!=='inspect_exceptions'&&!validRequestKey(b?.request_key))
  return respond({error:'Unique valid operator request key required.'},400);
 if(action==='record_owner_hold'&&!validException(b.category,b.notes))
  return respond({error:'Choose exception category and supply meaningful 12–1200 character owner notes.'},400);
 if(action==='record_owner_ready'&&!ownerReadyConsent(b))
  return respond({error:'Explicit owner acknowledgements including shipping restriction review required.'},400);
 try{
  const s=await local(g.db,id);if(!s?.product||!s.claim||!validId(s.draft.external_reference))
   return respond({error:'Verified Build 399/400 local draft required.'},409);
  if(action==='record_owner_hold'){
   const details={build:403,request_key:b.request_key,decision:'HOLD_OWNER_REVIEW',category:b.category,
    notes:b.notes.trim(),listing_id:String(s.draft.external_reference),
    evidence_type:'LOCAL_OWNER_HOLD_NO_ETSY_READ',publication_performed:false};
   return await append(g,s,c.request,details);
  }
  const a=await auth(g.db,c.env);if(a.error)return a.error;
  let report;try{report=await evaluate(a,s,b.image_id,b.owner_checked_shipping===true);}
  catch(err){return respond({...summary(s),error:'Etsy read unavailable; HOLD and record an exception locally. '+String(err?.message||'unknown')},409);}
  if(action==='inspect_exceptions')return respond({...summary(s),provider_read_performed:true,
   report,decision_readiness:report.readiness,message:'Fresh provider image and listing evidence inspected, no Etsy mutation. Owner publication choice is separate.'});
  if(report.readiness!=='READY_FOR_SEPARATE_MANUAL_ETSY_DECISION')
   return respond({...summary(s),report,error:'Blockers remain. Record an owner HOLD instead of readiness.'},409);
  const details={build:403,request_key:b.request_key,decision:'READY_FOR_SEPARATE_MANUAL_ETSY_DECISION',
   listing_id:String(s.draft.external_reference),image_id:report.selected_image_id,
   build402_final_acceptance_receipt:s.accepted.admin_action_audit_id,
   reviewed_image_ids:report.image_ids,owner_confirmations:true,listing_state:'draft',
   shipping_and_destinations_attested:true,
   evidence_type:'LIVE_ETSY_GET_PLUS_LOCAL_RECEIPTS',publication_performed:false,publication_requires_separate_owner_action:true};
  return await append(g,s,c.request,details);
 }catch{return respond({error:'Owner decision unconfirmed. Manual audit required; no provider mutation.'},503);}
}
async function append(g,s,request,details){
 const existing=s.history.find(r=>priorDecision(r)?.request_key===details.request_key);
 if(existing){
  const old=priorDecision(existing);
  if(old?.decision!==details.decision||old?.listing_id!==details.listing_id||
     (details.decision==='HOLD_OWNER_REVIEW'&&(old?.category!==details.category||old?.notes!==details.notes)))
   return respond({error:'Request key collision with different operator decision.'},409);
  return respond({...summary(s),recorded:true,idempotent:true,receipt:existing.admin_action_audit_id,
   decision:old.decision});
 }
 // Each operator decision uses a distinct request_key; no Etsy POST/PATCH, no publication.
 // One atomic insert-per-request-key; only the last five are displayed in the UI.
 const q="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) "+
  "SELECT ?,'etsy_draft_403_owner_decision','marketplace_draft',?,'POST',?,?,CURRENT_TIMESTAMP "+
  "WHERE EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE id=? AND channel_key='etsy' AND external_reference=?) "+
  "AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_draft_403_owner_decision' "+
  "AND target_type='marketplace_draft' AND target_key=? AND json_extract(details_json,'$.request_key')=?)";
 await g.db.prepare(q).bind(g.admin.user_id,s.draft.id,new URL(request.url).pathname,JSON.stringify(details),
  s.draft.id,details.listing_id,s.draft.id,details.request_key).run();
 const row=await g.db.prepare("SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE "+
  "action_type='etsy_draft_403_owner_decision' AND target_type='marketplace_draft' AND target_key=? "+
  "AND json_extract(details_json,'$.request_key')=? ORDER BY admin_action_audit_id DESC LIMIT 1")
  .bind(s.draft.id,details.request_key).first();
 const stored=priorDecision(row);
 if(!row||stored?.decision!==details.decision||stored?.listing_id!==details.listing_id||
    (details.decision==='HOLD_OWNER_REVIEW'&&(stored?.category!==details.category||stored?.notes!==details.notes)))
  return respond({error:'Decision receipt conflict or unavailable; HOLD for manual audit.'},409);
 return respond({draft_id:s.draft.id,listing_id:details.listing_id,recorded:true,
  decision:details.decision,receipt:row.admin_action_audit_id,publication_performed:false,
  message:details.decision==='HOLD_OWNER_REVIEW'?'Owner exception HOLD recorded locally. Etsy unchanged.':
   'Owner readiness decision recorded locally. Etsy draft remains unpublished; any publication is separate.'});
}
