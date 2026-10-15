// Build 405: final non-publishing Etsy decision packet. Verified owner and live GET only.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {connectionBlockers} from '../_lib/etsyDraftTrial399.mjs';
import {decryptOAuthSecret} from '../_lib/oauthSecurity.js';
import {validId} from '../_lib/etsyListingEvidence400.mjs';
import {gateFreshDraft,receiptDetails} from '../_lib/etsyExceptionResolution404.mjs';
import {decisionPacket,normalizeChannelPrefs,ownerPacketConsent} from '../_lib/etsyPublicationPacket405.mjs';
import {validRequestKey} from '../_lib/etsyDraftDecision403.mjs';
const reply=(v,status=200)=>jsonResponse({ok:status<400,build:405,provider_write:false,publication_performed:false,publication_authorized:false,automatic_retry:false,...v},status,{'Cache-Control':'no-store'});
const uuid=/^[a-zA-Z0-9-]{16,80}$/;
const q={
 draft:"SELECT id,product_id,channel_key,payload_json,status,external_reference FROM marketplace_syndication_drafts WHERE id=? AND channel_key='etsy' LIMIT 1",
 product:"SELECT product_id,name,price_cents,currency,inventory_quantity FROM products WHERE product_id=? LIMIT 1",
 conn:"SELECT remote_subject_id,connection_status,scopes_json,access_expires_at,access_token_ciphertext FROM oauth_provider_connections WHERE provider_key='etsy' LIMIT 1",
 shop:"SELECT shop_id,owner_user_id,shop_name,currency_code,acceptance_status FROM etsy_oauth_shop_connections WHERE provider_key='etsy' LIMIT 1",
 receipt:"SELECT admin_action_audit_id,details_json,created_at FROM admin_action_audit WHERE action_type=? AND target_type='marketplace_draft' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1",
 holds:"SELECT h.admin_action_audit_id,h.details_json FROM admin_action_audit h WHERE h.action_type='etsy_draft_403_owner_decision' AND h.target_type='marketplace_draft' AND h.target_key=? AND json_extract(h.details_json,'$.decision')='HOLD_OWNER_REVIEW' AND NOT EXISTS(SELECT 1 FROM admin_action_audit r WHERE r.action_type='etsy_exception_404_resolved' AND r.target_type=h.target_type AND r.target_key=h.target_key AND CAST(json_extract(r.details_json,'$.hold_receipt') AS INTEGER)=h.admin_action_audit_id) ORDER BY h.admin_action_audit_id DESC LIMIT 15",
 lastDecision:"SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='etsy_draft_403_owner_decision' AND target_type='marketplace_draft' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1",
 lastHold:"SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='etsy_draft_403_owner_decision' AND target_type='marketplace_draft' AND target_key=? AND json_extract(details_json,'$.decision')='HOLD_OWNER_REVIEW' ORDER BY admin_action_audit_id DESC LIMIT 1",
 prefs:"SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='product_channel_intent_405' AND target_type='product' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1"
};
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);return !admin?{error:reply({error:'Verified Admin required.'},401)}:!db?{error:reply({error:'Database unavailable.'},503)}:{admin,db};}
const receipt=(db,k,id)=>db.prepare(q.receipt).bind(k,id).first();
async function local(db,id){
 const draft=await db.prepare(q.draft).bind(id).first();if(!draft)return null;
 const [product,claim,imageClaim,uploaded,reconciled,review,accepted,revalidated,holds,decision,lastHold,prefs]=await Promise.all([
 db.prepare(q.product).bind(draft.product_id).first(),
 ...['etsy_remote_draft_trial_claimed','etsy_image_upload_401_claimed','etsy_image_upload_401_accepted',
 'etsy_image_outcome_402_reconciled','etsy_draft_completion_401_review','etsy_draft_402_final_accepted','etsy_decision_404_revalidated']
 .map(k=>receipt(db,k,id)),db.prepare(q.holds).bind(id).all(),
 db.prepare(q.lastDecision).bind(id).first(),db.prepare(q.lastHold).bind(id).first(),
 db.prepare(q.prefs).bind(String(draft.product_id)).first()
 ]);
 return {draft,product,claim,imageClaim,uploaded,reconciled,review,accepted,revalidated,
  activeHolds:holds?.results||[],lastDecision:decision,lastHold,prefs};
}
const summary=s=>({draft_id:s.draft.id,product_id:s.draft.product_id,listing_id:s.draft.external_reference||null,
 final_402_receipt:s.accepted?.admin_action_audit_id||null,
 owner_403_receipt:s.lastDecision?.admin_action_audit_id||null,owner_404_receipt:s.revalidated?.admin_action_audit_id||null,
 open_exception_count:s.activeHolds.length,channel_preferences:normalizeChannelPrefs(s.prefs)});
async function auth(db,env){
 const [conn,shop]=await Promise.all([db.prepare(q.conn).first(),db.prepare(q.shop).first()]);
 const blockers=connectionBlockers(conn,shop,env);
 let scopes=[];try{scopes=JSON.parse(conn?.scopes_json||'[]');}catch{}
 if(!Array.isArray(scopes)||!scopes.includes('listings_r'))blockers.push('listings_r_missing');
 if(blockers.length)return {error:reply({error:'Reconnect Etsy or restore verified read-only scope.',blockers},409)};
 const token=await decryptOAuthSecret(env,conn.access_token_ciphertext,'oauth-token|etsy|access');
 if(!token)return {error:reply({error:'Etsy access token unavailable.'},409)};
 return {shop,headers:{Accept:'application/json','x-api-key':String(env.ETSY_API_KEYSTRING)+':'+String(env.ETSY_SHARED_SECRET),Authorization:'Bearer '+token}};
}
async function remote(path,headers){const r=await fetch('https://api.etsy.com/v3/application/'+path,{method:'GET',redirect:'manual',headers});if(r.status>=300&&r.status<400)throw Error('provider_redirect');if(!r.ok)throw Error('provider_read_'+r.status);return r.json();}
async function snapshot(a,s,image,shipping){
 const id=String(s.draft.external_reference||'');
 if(!validId(id)||!s.product||!s.claim)throw Error('original_draft_and_399_claim_required');
 const [listing,images]=await Promise.all([remote('listings/'+encodeURIComponent(id),a.headers),
 remote('listings/'+encodeURIComponent(id)+'/images',a.headers)]);
 return gateFreshDraft({listing,images,shop:a.shop,product:s.product,draft:s.draft,claim:s.claim,
 imageClaim:s.imageClaim,uploaded:s.uploaded,reconciled:s.reconciled,review:s.review,accepted:s.accepted,
 selected_image_id:image,shipping_reviewed:shipping});
}
export async function onRequestGet(c){
 const g=gate(c);if(g.error)return g.error;const id=new URL(c.request.url).searchParams.get('draft_id');
 if(!uuid.test(String(id||'')))return reply({error:'Choose a linked local draft UUID.'},400);
 try{const s=await local(g.db,id);return s?reply({...summary(s),provider_contacted:false,packet_status:'OPERATOR_LIVE_RECHECK_REQUIRED'}):reply({error:'Local draft unavailable.'},404);}
 catch{return reply({error:'Local decision packet unavailable.'},503);}
}
export async function onRequestPost(c){
 const g=gate(c);if(g.error)return g.error;
 let b;try{b=await c.request.json();}catch{return reply({error:'JSON required.'},400);}
 if(!uuid.test(String(b?.draft_id||''))||!['inspect_final_packet','record_final_nonpublishing_review'].includes(b.action))
  return reply({error:'Select local draft and supported review action.'},400);
 const isWrite=b.action==='record_final_nonpublishing_review';
 if(isWrite&&(!validRequestKey(b.request_key)||!ownerPacketConsent(b)))return reply({error:'All owner consent and a secure request key are required.'},400);
 try{
 const s=await local(g.db,b.draft_id);
 if(!s?.product||!s.claim||!validId(s.draft.external_reference))return reply({error:'Verified Build 399–400 unpublished linkage required.'},409);
 const a=await auth(g.db,c.env);if(a.error)return a.error;
 let current;try{current=await snapshot(a,s,b.image_id,b.owner_checked_shipping===true);}
 catch(e){return reply({...summary(s),error:'Live Etsy evidence unavailable: '+String(e?.message||'unknown')},409);}
 const packet=decisionPacket({snapshot:current,activeHolds:s.activeHolds,lastDecision:s.lastDecision,lastHold:s.lastHold,
 selectedImage:b.image_id||current.selected_image_id,acceptance:s.accepted,revalidation:s.revalidated,channelPreference:normalizeChannelPrefs(s.prefs)});
 if(!isWrite)return reply({...summary(s),provider_read_performed:true,packet,
  message:'Live unpublished listing and canonical Product evidence checked. No listing updated.'});
 if(packet.status!=='READY_FOR_SEPARATE_OWNER_ETSY_DECISION')return reply({...summary(s),packet,error:'Final owner packet is HOLD; no review acceptance receipt recorded.'},409);
 const details={build:405,request_key:b.request_key,listing_id:String(s.draft.external_reference),
  image_id:packet.image_id,owner_403_decision_receipt:packet.owner_403_decision_receipt,
  owner_404_revalidation_receipt:packet.owner_404_revalidation_receipt,
  decision:'OWNER_NONPUBLISHING_PACKET_REVIEWED',publication_performed:false,
  provider_get_only:true,owner_approvals:true};
 const existing=await g.db.prepare("SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='etsy_packet_405_reviewed' AND target_type='marketplace_draft' AND target_key=? AND json_extract(details_json,'$.request_key')=? LIMIT 1").bind(b.draft_id,b.request_key).first();
 if(existing){
  const d=receiptDetails(existing);
  if(d?.listing_id!==details.listing_id||d?.image_id!==details.image_id)return reply({error:'Conflicting request-key evidence.'},409);
  return reply({...summary(s),packet,packet_receipt:existing.admin_action_audit_id,idempotent:true});
 }
 const sql="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) "+
 "SELECT ?,'etsy_packet_405_reviewed','marketplace_draft',?,'POST',?,?,CURRENT_TIMESTAMP "+
 "WHERE EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE id=? AND external_reference=? AND channel_key='etsy') "+
 "AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_packet_405_reviewed' AND target_type='marketplace_draft' AND target_key=? AND json_extract(details_json,'$.request_key')=?)";
 await g.db.prepare(sql).bind(g.admin.user_id,b.draft_id,new URL(c.request.url).pathname,JSON.stringify(details),
 b.draft_id,details.listing_id,b.draft_id,b.request_key).run();
 const row=await g.db.prepare("SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='etsy_packet_405_reviewed' AND target_type='marketplace_draft' AND target_key=? AND json_extract(details_json,'$.request_key')=? LIMIT 1").bind(b.draft_id,b.request_key).first();
 if(!row||receiptDetails(row)?.image_id!==details.image_id)return reply({error:'Local packet receipt unconfirmed. Review audit before repeating.'},409);
 return reply({...summary(s),packet,packet_receipt:row.admin_action_audit_id,
 message:'Owner packet recorded locally. Etsy listing remains an UNPUBLISHED draft; separate manual publication decision required.'});
 }catch{return reply({error:'Final packet review not confirmed; no Etsy write.'},503);}
}
