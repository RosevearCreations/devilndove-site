// Release 467 Build 408 — authenticated, click-only local operator acceptance, draft preparation and reconciliation.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {outboundChannel,productIdValid,ownerKeyValid,reviewEvidence,reviewedSourceSignature} from '../_lib/productDistribution406.mjs';
import {listingSyncReadiness} from '../_lib/listingSyncReadiness407.mjs';
import {connectionBlockers} from '../_lib/etsyDraftTrial399.mjs';
import {parseReceipt,evidenceFingerprint,localDraftPayload,reconciliation} from '../_lib/listingSyncOperator408.mjs';
const reply=(v,status=200)=>jsonResponse({ok:status<400,build:408,provider_called:false,external_execution_allowed:false,publication_performed:false,...v},status,{'Cache-Control':'no-store'});
const Q={
 product:"SELECT product_id,name,description,price_cents,currency,inventory_quantity,status FROM products WHERE product_id=? LIMIT 1",
 gallery:"SELECT product_image_id,product_id,image_url,alt_text,image_role,public_use_status,width_px,height_px,sort_order FROM product_images WHERE product_id=? ORDER BY sort_order ASC,product_image_id ASC LIMIT 60",
 preference:"SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='product_channel_intent_405' AND target_type='product' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1",
 policy:"SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='product_distribution_policy_406' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.channel')=? ORDER BY admin_action_audit_id DESC LIMIT 1",
 selection:"SELECT selected_product_image_ids_json FROM marketplace_export_image_selections WHERE channel=? AND product_id=? LIMIT 1",
 receipt:"SELECT admin_action_audit_id,details_json,created_at FROM admin_action_audit WHERE action_type=? AND target_type='product' AND target_key=? AND json_extract(details_json,'$.destination')=? ORDER BY admin_action_audit_id DESC LIMIT 1",
 connection:"SELECT remote_subject_id,connection_status,scopes_json,access_expires_at,access_token_ciphertext FROM oauth_provider_connections WHERE provider_key='etsy' LIMIT 1",
 shop:"SELECT shop_id,owner_user_id,shop_name,currency_code,acceptance_status FROM etsy_oauth_shop_connections WHERE provider_key='etsy' LIMIT 1"
};
const types={accept:'product_destination_408_owner_acceptance',prepare:'product_destination_408_local_draft_preparation',reconcile:'product_destination_408_local_reconciliation'};
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:reply({error:'Verified administrator required.'},401)}:!db?{error:reply({error:'D1 binding unavailable.'},503)}:{admin,db};}
async function load(db,env,id,channel){
 const [product,gallery,preference,policy,selection,acceptance,preparation,lastReconciliation]=await Promise.all([
  db.prepare(Q.product).bind(id).first(),db.prepare(Q.gallery).bind(id).all(),
  db.prepare(Q.preference).bind(String(id)).first(),db.prepare(Q.policy).bind(String(id),channel).first(),
  db.prepare(Q.selection).bind(channel,id).first(),
  ...[types.accept,types.prepare,types.reconcile].map(t=>db.prepare(Q.receipt).bind(t,String(id),channel).first())
 ]);
 if(!product)return null;
 let selectedIds=[];try{selectedIds=JSON.parse(selection?.selected_product_image_ids_json||'[]')}catch{}
 const images=gallery?.results||[];
 const local=reviewEvidence({channel,product,images,selectedIds,preference,policyReceipt:policy});
 const fingerprint=evidenceFingerprint({channel,product,images,selectedIds,preference,policyReceipt:policy});
 // Stored verified Etsy data are authoritative. A user checkbox never forges provider scopes.
 const evidence={};let providerBlockers=[];
 if(channel==='etsy'){
  try{const [conn,shop]=await Promise.all([db.prepare(Q.connection).first(),db.prepare(Q.shop).first()]);
   providerBlockers=connectionBlockers(conn,shop,env);
   evidence.etsy_oauth_connected=providerBlockers.length===0;
   evidence.shop_identity_verified=providerBlockers.length===0;
   evidence.provider_draft_permission=providerBlockers.length===0;
  }catch{providerBlockers=['etsy_connection_status_unavailable'];}
 }else providerBlockers=['facebook_marketplace_permission_not_verified'];
 const owner=parseReceipt(acceptance);
 const accepted=owner.fingerprint===fingerprint&&owner.review_receipt===Number(policy?.admin_action_audit_id||0);
 const acceptanceState=accepted?{destination:channel,product_id:Number(id),accepted:true,source_signature:reviewedSourceSignature(product,selectedIds.map(Number)),
 owner_draft_approval:channel==='etsy'&&owner.confirmed_draft_only===true,
 owner_destination_approval:channel==='facebook'&&owner.confirmed_draft_only===true}:{};
 const readiness=listingSyncReadiness({destination:channel,product,images,selectedIds,preference,policyReceipt:policy,
  providerEvidence:evidence,ownerAcceptance:acceptanceState});
 if(!accepted&&acceptance)readiness.blockers.push('owner_acceptance_stale_reapprove');
 const reconcile=reconciliation({currentFingerprint:fingerprint,acceptance,preparation,latestReviewReceipt:policy?.admin_action_audit_id});
 return {product,images,selectedIds,local,providerBlockers,fingerprint,policy,preference,
  acceptance,preparation,lastReconciliation,readiness,reconcile,accepted};
}
const publicSummary=s=>({product_id:Number(s.product.product_id),destination:s.local.destination,
 owner_review_receipt:s.policy?.admin_action_audit_id||0,source_fingerprint:s.fingerprint,
 canonical_image_ids:s.selectedIds,local_blockers:s.local.blockers,provider_blockers:s.providerBlockers,
 operator_accepted:s.accepted,acceptance_receipt:s.acceptance?.admin_action_audit_id||0,
 prepared_receipt:s.preparation?.admin_action_audit_id||0,
 reconciliation_receipt:s.lastReconciliation?.admin_action_audit_id||0,
 readiness_blockers:s.readiness.blockers,local_draft_ready:s.readiness.safe_to_prepare_draft&&s.local.blockers.length===0,
 preparation_current:s.reconcile.status==='LOCAL_PREPARATION_MATCHED',
 reconciliation:s.reconcile,
 source:'CANONICAL_LOCAL_D1_NO_PROVIDER_CONTACT'});
function validBody(b){return b&&productIdValid(b.product_id)&&outboundChannel(b.destination)&&
 ownerKeyValid(b.request_key)&&['accept','prepare','reconcile'].includes(b.action)&&
 b.confirmed_local_only===true&&b.us_shipping_disabled===true&&b.no_auto_publish===true&&
 Number.isSafeInteger(b.expected_acceptance_receipt)&&b.expected_acceptance_receipt>=0&&
 Number.isSafeInteger(b.expected_prepared_receipt)&&b.expected_prepared_receipt>=0&&
 Number.isSafeInteger(b.expected_review_receipt)&&b.expected_review_receipt>=0&&
 /^[a-f0-9]{8}$/.test(String(b.expected_fingerprint||''));}
async function findKey(db,id,key){
 return db.prepare("SELECT admin_action_audit_id,action_type,details_json FROM admin_action_audit WHERE target_type='product' AND target_key=? AND action_type IN ('product_destination_408_owner_acceptance','product_destination_408_local_draft_preparation','product_destination_408_local_reconciliation') AND json_extract(details_json,'$.request_key')=? ORDER BY admin_action_audit_id DESC LIMIT 1").bind(String(id),key).first();
}
export async function onRequestGet(c){
 const g=gate(c);if(g.error)return g.error;
 const u=new URL(c.request.url),id=u.searchParams.get('product_id'),channel=u.searchParams.get('destination');
 if(!productIdValid(id)||!outboundChannel(channel))return reply({error:'Valid saved Product and destination required.'},400);
 try{const s=await load(g.db,c.env,Number(id),channel);
  return s?reply(publicSummary(s)):reply({error:'Product not found.'},404);
 }catch{return reply({error:'Local D1 evidence unavailable; no changes made.'},503);}
}
export async function onRequestPost(c){
 const g=gate(c);if(g.error)return g.error;
 let b;try{b=await c.request.json()}catch{return reply({error:'Valid JSON required.'},400)}
 if(!validBody(b))return reply({error:'Invalid action, stale review tokens, or missing explicit no-publish/US shipping consent.'},400);
 if(b.action==='accept'&&b.confirmed_draft_only!==true)return reply({error:'Explicit operator destination acceptance required.'},400);
 const id=Number(b.product_id),channel=b.destination,type=types[b.action];
 try{
  const previous=await findKey(g.db,id,b.request_key);
  if(previous)return previous.action_type===type?reply({receipt:previous.admin_action_audit_id,idempotent:true,message:'Existing locally recorded request; reload for current readiness.'}):
    reply({error:'Request key reused for a different action.'},409);
  const s=await load(g.db,c.env,id,channel);
  if(!s)return reply({error:'Product not found.'},404);
  if(b.expected_fingerprint!==s.fingerprint||b.expected_review_receipt!==Number(s.policy?.admin_action_audit_id||0)||
    b.expected_acceptance_receipt!==Number(s.acceptance?.admin_action_audit_id||0)||
    b.expected_prepared_receipt!==Number(s.preparation?.admin_action_audit_id||0))
    return reply({error:'Product or review changed; reload before acting.',blockers:['stale_operator_snapshot']},409);
  if(s.local.blockers.length)return reply({error:'Canonical Product mapping not approved.',blockers:s.local.blockers},409);
  if(b.action!=='accept'&&!s.accepted)return reply({error:'Fresh owner acceptance is required.',blockers:['missing_or_stale_owner_acceptance']},409);
  if(b.action==='prepare'&&(!s.readiness.safe_to_prepare_draft||s.providerBlockers.length))
    return reply({error:'Provider readiness or owner acceptance missing.',blockers:[...new Set([...s.readiness.blockers,...s.providerBlockers])]},409);
  if(b.action==='reconcile'&&s.reconcile.status!=='LOCAL_PREPARATION_MATCHED')
    return reply({error:'Cannot reconcile stale or missing local preparation.',blockers:s.reconcile.blockers},409);
  if(b.action==='prepare'&&s.preparation&&parseReceipt(s.preparation).fingerprint===s.fingerprint&&
    Number(parseReceipt(s.preparation).owner_acceptance_receipt)===Number(s.acceptance?.admin_action_audit_id||0))
    return reply({receipt:s.preparation.admin_action_audit_id,idempotent:true,preparation_current:true});
  const detail={build:408,request_key:b.request_key,destination:channel,product_id:id,action:b.action,
   fingerprint:s.fingerprint,source_signature:reviewedSourceSignature(s.product,s.selectedIds.map(Number)),
   review_receipt:Number(s.policy?.admin_action_audit_id||0),owner_acceptance_receipt:Number(s.acceptance?.admin_action_audit_id||0),
   confirmed_draft_only:b.confirmed_draft_only===true,us_shipping_disabled:true,local_only:true,provider_called:false,
   publication_performed:false,external_execution_allowed:false};
  if(b.action==='prepare')detail.payload=localDraftPayload({channel,product:s.product,images:s.images,selectedIds:s.selectedIds});
  if(b.action==='reconcile')detail.result=s.reconcile;
  // Single local write, request-key deduplication. Never mutate Product/gallery/channel/provider tables.
  const sql="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,?,'product',?,'POST',?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE target_type='product' AND target_key=? AND action_type IN ('product_destination_408_owner_acceptance','product_destination_408_local_draft_preparation','product_destination_408_local_reconciliation') AND json_extract(details_json,'$.request_key')=?)";
  await g.db.prepare(sql).bind(g.admin.user_id,type,String(id),new URL(c.request.url).pathname,JSON.stringify(detail),String(id),b.request_key).run();
  const receipt=await findKey(g.db,id,b.request_key);
  if(!receipt||receipt.action_type!==type)return reply({error:'Audit commit could not be confirmed; inspect before retry.'},409);
  return reply({receipt:receipt.admin_action_audit_id,action:b.action,
   message:b.action==='prepare'?'LOCAL provider draft payload prepared; nothing sent to Etsy or Meta.':
   b.action==='reconcile'?'LOCAL receipt compared to current canonical source; provider status remains unverified.':
   'Owner destination acceptance recorded locally; provider readiness is checked separately.',
   provider_listing_verified:false,publication_performed:false});
 }catch{return reply({error:'Local operation could not be confirmed. Reload before retrying.'},503);}
}
