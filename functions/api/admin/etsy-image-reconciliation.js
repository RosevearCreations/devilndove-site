// Release 467 Build 402: final operator acceptance is local audit only; NEVER mutate Etsy.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {connectionBlockers} from '../_lib/etsyDraftTrial399.mjs';
import {decryptOAuthSecret} from '../_lib/oauthSecurity.js';
import {validId,verifyRemote} from '../_lib/etsyListingEvidence400.mjs';
import {reconcileClassification,parseReceipt,imageId,strictOwnerApproval,finalReviewReady} from '../_lib/etsyImageReconciliation402.mjs';
const respond=(o,status=200)=>jsonResponse({ok:status<400,build:402,provider_write:false,publication_performed:false,automatic_retry:false,etsy_listing_activation:false,...o},status,{'Cache-Control':'no-store'});
const UUID=/^[a-zA-Z0-9-]{16,80}$/;
const sql={
 draft:"SELECT id,channel_key,product_id,payload_json,status,external_reference FROM marketplace_syndication_drafts WHERE id=? AND channel_key='etsy' LIMIT 1",
 product:"SELECT product_id,name,price_cents,currency,inventory_quantity FROM products WHERE product_id=? LIMIT 1",
 conn:"SELECT remote_subject_id,connection_status,scopes_json,access_expires_at,access_token_ciphertext FROM oauth_provider_connections WHERE provider_key='etsy' LIMIT 1",
 shop:"SELECT shop_id,owner_user_id,shop_name,currency_code,acceptance_status FROM etsy_oauth_shop_connections WHERE provider_key='etsy' LIMIT 1",
};
const receiptQuery="SELECT admin_action_audit_id,created_at,details_json FROM admin_action_audit WHERE action_type=? AND target_type='marketplace_draft' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1";
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 if(!admin)return {error:respond({error:'Verified active administrator required.'},401)};
 if(!db)return {error:respond({error:'Database unavailable.'},503)};
 return {admin,db};}
async function local(db,id){
 const draft=await db.prepare(sql.draft).bind(id).first();
 if(!draft)return null;
 const [product,claim,imageClaim,uploaded,review,reconciled,accepted]=await Promise.all([
 db.prepare(sql.product).bind(draft.product_id).first(),
 ...['etsy_remote_draft_trial_claimed','etsy_image_upload_401_claimed','etsy_image_upload_401_accepted',
  'etsy_draft_completion_401_review','etsy_image_outcome_402_reconciled','etsy_draft_402_final_accepted']
  .map(action=>db.prepare(receiptQuery).bind(action,id).first())]);
 return {draft,product,claim,imageClaim,uploaded,review,reconciled,accepted};
}
const summary=s=>({draft_id:s.draft.id,listing_id:s.draft.external_reference||null,product_id:s.product?.product_id||null,
 previous_upload_claim:s.imageClaim?.admin_action_audit_id||null,
 previous_upload_acceptance:s.uploaded?.admin_action_audit_id||null,
 build401_review_receipt:s.review?.admin_action_audit_id||null,
 build402_reconciliation_receipt:s.reconciled?.admin_action_audit_id||null,
 final_acceptance_receipt:s.accepted?.admin_action_audit_id||null,
 no_provider_mutation:true});
async function auth(db,env){
 const [conn,shop]=await Promise.all([db.prepare(sql.conn).first(),db.prepare(sql.shop).first()]);
 const blockers=connectionBlockers(conn,shop,env);
 let scopes=[];try{scopes=JSON.parse(conn?.scopes_json||'[]');}catch{}
 if(!Array.isArray(scopes)||!scopes.includes('listings_r'))blockers.push('listings_r_missing');
 if(blockers.length)return {error:respond({error:'Connected Etsy shop/token not verified.',blockers},409)};
 const token=await decryptOAuthSecret(env,conn.access_token_ciphertext,'oauth-token|etsy|access');
 if(!token)return {error:respond({error:'Etsy read token unavailable.'},409)};
 return {shop,headers:{Accept:'application/json',
  'x-api-key':String(env.ETSY_API_KEYSTRING)+':'+String(env.ETSY_SHARED_SECRET),
  Authorization:'Bearer '+token}};
}
async function providerRead(path,headers){
 const r=await fetch('https://api.etsy.com/v3/application/'+path,{method:'GET',redirect:'manual',headers});
 if(r.status>=300&&r.status<400)throw Error('etsy_redirect_blocked');
 if(!r.ok)throw Error('etsy_get_'+r.status);
 return r.json();
}
async function snapshot(a,s){
 const id=String(s.draft.external_reference||'');
 if(!validId(id)||!s.product||!s.claim)throw Error('build400_linkage_missing');
 const [listing,images]=await Promise.all([
  providerRead('listings/'+encodeURIComponent(id),a.headers),
  providerRead('listings/'+encodeURIComponent(id)+'/images',a.headers)]);
 const verified=verifyRemote(listing,a.shop,s.product,s.draft,s.claim);
 if(!verified.verified)throw Error('remote_unpublished_draft_mismatch_'+verified.blockers.join('_'));
 const report=reconcileClassification({listing,images,claim:s.imageClaim,uploaded:s.uploaded,reconciled:s.reconciled,review:s.review});
 return {verified,report,listing,images};
}
async function insertOnce(db,admin,id,request,action,details){
 const q="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) "+
 "SELECT ?,?,'marketplace_draft',?,'POST',?,?,CURRENT_TIMESTAMP "+
 "WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type=? AND target_type='marketplace_draft' AND target_key=?) "+
 "AND EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE id=? AND channel_key='etsy' AND external_reference=?)";
 const changes=await db.prepare(q).bind(admin.user_id,action,id,new URL(request.url).pathname,JSON.stringify(details),
  action,id,id,String(details.listing_id)).run();
 return Number(changes?.meta?.changes||0)===1;
}
export async function onRequestGet(c){
 const g=gate(c);if(g.error)return g.error;
 const id=new URL(c.request.url).searchParams.get('draft_id');
 if(!UUID.test(String(id||'')))return respond({error:'Valid staged draft UUID required.'},400);
 try{
  const s=await local(g.db,id);
  return s?respond({...summary(s),provider_read_performed:false,
   outcome_status:s.imageClaim?(s.uploaded?'CLAIM_AND_UPLOAD_RECEIPT_STORED':'CLAIMED_UNCONFIRMED_MANUAL_GET_REQUIRED'):'NO_PRIOR_IMAGE_UPLOAD_CLAIM',
   ready_for_final_acceptance:false,provider_acceptance:'NOT_CHECKED'}):respond({error:'Local draft not found.'},404);
 }catch{return respond({error:'Local audit unavailable; no provider call performed.'},503);}
}
export async function onRequestPost(c){
 const g=gate(c);if(g.error)return g.error;
 let b;try{b=await c.request.json();}catch{return respond({error:'Valid JSON required.'},400);}
 if(!UUID.test(String(b?.draft_id||''))||!['inspect_remote','reconcile_image_outcome','accept_final_draft'].includes(b?.action))
  return respond({error:'Choose draft and supported manual action.'},400);
 const owner=b.action!=='inspect_remote';
 if(owner&&!strictOwnerApproval(b))return respond({error:'All owner acknowledgement boxes must be checked.'},400);
 const id=b.draft_id;
 if(owner&&!imageId(b.image_id))return respond({error:'Select the exact live Etsy image ID.'},400);
 try{
  const s=await local(g.db,id);
  if(!s?.claim||!s.product||!validId(s.draft.external_reference))
   return respond({error:'Build 399 claim and verified Build 400 unpublished listing link required.'},409);
  const a=await auth(g.db,c.env);if(a.error)return a.error;
  let snapshotNow;try{snapshotNow=await snapshot(a,s);}
  catch(e){return respond({error:'Provider evidence unavailable: '+String(e?.message||'unknown')+'. Local state unchanged.'},409);}
  const report=snapshotNow.report,imageSelected=imageId(b.image_id);
  const shared={...summary(s),provider_read_performed:true,listing_verification:snapshotNow.verified,
   outcome:report};
  if(b.action==='inspect_remote')return respond({...shared,provider_acceptance:'OWNER_ACTION_REQUIRED',
   message:'Live unpublished Etsy listing and image metadata read; no provider writes.'});
  if(!report.photo.images.some(x=>x.id===imageSelected))
   return respond({...shared,error:'Selected image ID not in current Etsy draft; owner reconciliation HOLD.'},409);
  if(b.action==='reconcile_image_outcome'){
   if(!s.imageClaim)return respond({...shared,error:'No Build 401 image upload attempt to reconcile; use Build 401 review for pre-existing images.'},409);
   if(s.uploaded&&imageSelected!==report.accepted_image_id)return respond({...shared,error:'Confirmed Build 401 upload image ID mismatch; HOLD.'},409);
   if(!s.uploaded&&s.reconciled&&imageSelected!==report.corroborated_image_id)
    return respond({...shared,error:'Earlier owner corroboration points to a different image. HOLD.'},409);
   if(report.blockers.some(x=>x!=='build401_compliance_review_receipt_missing'&&x!=='review_receipt_image_evidence_invalid'))
    return respond({...shared,error:'Provider image claim/reconciliation mismatch; HOLD.'},409);
   const details={build:402,listing_id:String(s.draft.external_reference),shop_id:String(a.shop.shop_id),
    image_id:imageSelected,upload_claim_receipt:s.imageClaim.admin_action_audit_id,
    prior_upload_receipt:s.uploaded?.admin_action_audit_id||null,
    attestation:'OWNER_CORROBORATED_PRESENT_NOT_UPLOAD_ATTRIBUTION',
    provider_state:'draft',provider_read_only:true,publication_performed:false};
   if(s.reconciled){
    if(parseReceipt(s.reconciled)?.image_id!==imageSelected)return respond({...shared,error:'Conflicting existing reconciliation receipt.'},409);
    return respond({...shared,reconciled:true,idempotent:true,reconciliation_receipt:s.reconciled.admin_action_audit_id});
   }
   const saved=await insertOnce(g.db,g.admin,id,c.request,'etsy_image_outcome_402_reconciled',details);
   const receipt=await g.db.prepare(receiptQuery).bind('etsy_image_outcome_402_reconciled',id).first();
   if(!receipt||parseReceipt(receipt)?.image_id!==imageSelected)
    return respond({...shared,error:'Concurrent receipt mismatch, manual audit required.'},409);
   return respond({...shared,reconciled:true,idempotent:!saved,reconciliation_receipt:receipt.admin_action_audit_id,
    evidence_label:details.attestation,
    message:'Owner corroborated current Etsy image on a live unpublished draft. This does not prove attribution to the prior upload. No retry.'});
  }
  if(s.accepted){
   const detail=parseReceipt(s.accepted);
   if(detail?.image_id!==imageSelected||detail?.listing_id!==String(s.draft.external_reference))
    return respond({...shared,error:'Existing final acceptance references different evidence; HOLD.'},409);
  }
  const gateResult=finalReviewReady(report,imageSelected,!!s.imageClaim);
  if(!gateResult.ready)return respond({...shared,ready:false,blockers:gateResult.reasons,
   error:'Final acceptance withheld: fresh image, Build 401 compliance review or outcome reconciliation incomplete.'},409);
  if(s.accepted)return respond({...shared,accepted:true,idempotent:true,
   final_receipt:s.accepted.admin_action_audit_id,readiness:'OWNER_ACCEPTED_LOCAL_DRAFT_ONLY'});
  const detail={build:402,listing_id:String(s.draft.external_reference),shop_id:String(a.shop.shop_id),
   image_id:imageSelected,upload_outcome:report.upload_outcome,
   compliance_review_receipt:s.review.admin_action_audit_id,
   image_reconciliation_receipt:s.reconciled?.admin_action_audit_id||null,
   owner_attestations:true,listing_state:'draft',final_scope:'LOCAL_EVIDENCE_ACCEPTANCE_ONLY',
   provider_get_only:true,publication_performed:false};
  const saved=await insertOnce(g.db,g.admin,id,c.request,'etsy_draft_402_final_accepted',detail);
  const receipt=await g.db.prepare(receiptQuery).bind('etsy_draft_402_final_accepted',id).first();
  if(!receipt||parseReceipt(receipt)?.image_id!==imageSelected||parseReceipt(receipt)?.listing_id!==detail.listing_id)
   return respond({...shared,error:'Final receipt not confirmed; manual audit HOLD.'},409);
  return respond({...shared,accepted:true,idempotent:!saved,
   readiness:'OWNER_ACCEPTED_LOCAL_DRAFT_ONLY',final_receipt:receipt.admin_action_audit_id,
   message:'Owner final local evidence acceptance recorded for an unpublished Etsy draft. Listing remains unpublished; no Etsy update.'});
 }catch{return respond({error:'Reconciliation unconfirmed; inspect Etsy and local audit. No provider write, retry or publication.'},503);}
}
