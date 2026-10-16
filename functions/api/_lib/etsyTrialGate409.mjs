// Release 467 Build 409 — current-source, draft-bound one-attempt Etsy authorization.
import {reviewEvidence,reviewedSourceSignature,productIdValid} from './productDistribution406.mjs';
import {evidenceFingerprint,reconciliation,parseReceipt} from './listingSyncOperator408.mjs';
import {connectionBlockers,localDraftReview,positive} from './etsyDraftTrial399.mjs';
const q={
 product:"SELECT product_id,name,description,price_cents,currency,inventory_quantity,status FROM products WHERE product_id=? LIMIT 1",
 images:"SELECT product_image_id,product_id,image_url,alt_text,image_role,public_use_status,width_px,height_px,sort_order FROM product_images WHERE product_id=? ORDER BY sort_order ASC,product_image_id ASC LIMIT 60",
 pref:"SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='product_channel_intent_405' AND target_type='product' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1",
 policy:"SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='product_distribution_policy_406' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.channel')='etsy' ORDER BY admin_action_audit_id DESC LIMIT 1",
 selected:"SELECT selected_product_image_ids_json FROM marketplace_export_image_selections WHERE channel='etsy' AND product_id=? LIMIT 1",
 receipt:"SELECT admin_action_audit_id,details_json,created_at FROM admin_action_audit WHERE action_type=? AND target_type='product' AND target_key=? AND json_extract(details_json,'$.destination')='etsy' ORDER BY admin_action_audit_id DESC LIMIT 1",
 draft:"SELECT id,channel_key,product_id,draft_title,payload_json,status,external_reference,updated_at FROM marketplace_syndication_drafts WHERE id=? AND channel_key='etsy' LIMIT 1",
 conn:"SELECT remote_subject_id,connection_status,scopes_json,access_expires_at,access_token_ciphertext FROM oauth_provider_connections WHERE provider_key='etsy' LIMIT 1",
 shop:"SELECT shop_id,owner_user_id,shop_name,currency_code,acceptance_status FROM etsy_oauth_shop_connections WHERE provider_key='etsy' LIMIT 1",
 claim:"SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='etsy_remote_draft_trial_claimed' AND target_type='marketplace_draft' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1",
 trial:"SELECT admin_action_audit_id,details_json,created_at FROM admin_action_audit WHERE action_type='etsy_trial_409_authorized' AND target_type='marketplace_draft' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1",
 reconcile:"SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='etsy_remote_draft_reconciled' AND target_type='marketplace_draft' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1",
 reconciliation409:"SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='etsy_trial_409_reconciliation_reviewed' AND target_type='marketplace_draft' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1"
};
export const uuidDraft=s=>/^[a-zA-Z0-9-]{16,80}$/.test(String(s||''));
export const keyValid=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s||''));
export async function loadTrial409(db,env,productId,draftId){
 if(!productIdValid(productId)||!uuidDraft(draftId))return null;
 const id=Number(productId);
 const [product,gallery,pref,policy,selected,acceptance,prepared,conn,shop,draft,claim,trial,verified,reconciled409]=await Promise.all([
 db.prepare(q.product).bind(id).first(),db.prepare(q.images).bind(id).all(),
 db.prepare(q.pref).bind(String(id)).first(),db.prepare(q.policy).bind(String(id)).first(),
 db.prepare(q.selected).bind(id).first(),
 ...['product_destination_408_owner_acceptance','product_destination_408_local_draft_preparation'].map(t=>db.prepare(q.receipt).bind(t,String(id)).first()),
 db.prepare(q.conn).first(),db.prepare(q.shop).first(),db.prepare(q.draft).bind(draftId).first(),
 db.prepare(q.claim).bind(draftId).first(),db.prepare(q.trial).bind(draftId).first(),
 db.prepare(q.reconcile).bind(draftId).first(),db.prepare(q.reconciliation409).bind(draftId).first()]);
 if(!product||!draft||Number(draft.product_id)!==id)return null;
 let selectedIds=[];try{selectedIds=JSON.parse(selected?.selected_product_image_ids_json||'[]')}catch{}
 const images=gallery?.results||[];
 const distribution=reviewEvidence({channel:'etsy',product,images,selectedIds,preference:pref,policyReceipt:policy});
 const fingerprint=evidenceFingerprint({channel:'etsy',product,images,selectedIds,preference:pref,policyReceipt:policy});
 const state=reconciliation({currentFingerprint:fingerprint,acceptance,preparation:prepared,latestReviewReceipt:policy?.admin_action_audit_id});
 const connBlockers=connectionBlockers(conn,shop,env);
 const draftReview=localDraftReview(product,draft,shop,conn);
 const blockers=[...distribution.blockers,...connBlockers,...draftReview.blockers,...state.blockers];
 if(draft.external_reference)blockers.push('already_linked_to_remote_etsy');
 if(claim)blockers.push('previous_remote_attempt_claimed');
 if(parseReceipt(acceptance).destination!=='etsy'||parseReceipt(acceptance).confirmed_draft_only!==true)blockers.push('owner_etsy_acceptance_required');
 if(parseReceipt(prepared).payload?.shipping_policy!=='US_SHIPPING_DISABLED')blockers.push('prepared_shipping_policy_missing');
 return {product,draft,selectedIds,fingerprint,reviewReceipt:Number(policy?.admin_action_audit_id||0),
  draftFingerprint:draftReview.fingerprint,blockers:[...new Set(blockers)],trial,claim,verified,reconciled409,
  shopId:String(shop?.shop_id||''),shippingPolicy:'US_SHIPPING_DISABLED'};
}
export function isAuthorized409({receipt,source,draftId,shippingProfileId,now=Date.now()}){
 const x=parseReceipt(receipt);
 const timestamp=String(receipt?.created_at||'').trim();
 const created=Date.parse(/(?:[zZ]|[+-]\d{2}:\d{2})$/.test(timestamp)?timestamp:timestamp.replace(' ','T')+'Z');
 if(!receipt||!source||source.blockers.length||receipt.admin_action_audit_id!==source.trial?.admin_action_audit_id)return false;
 return x.build===409&&x.product_id===Number(source.product.product_id)&&x.draft_id===String(draftId)&&
 x.shop_id===source.shopId&&x.destination==='etsy'&&x.source_fingerprint===source.fingerprint&&
 x.draft_fingerprint===source.draftFingerprint&&x.review_receipt===source.reviewReceipt&&
 x.shipping_profile_id===Number(shippingProfileId)&&positive(shippingProfileId)&&
 x.confirmed_no_publish===true&&x.confirmed_one_attempt===true&&x.confirmed_us_shipping_disabled===true&&
 x.owner_verified_shipping_profile_us_excluded===true&&x.provider_write_permitted==='unpublished_draft_only'&&
 Number.isFinite(created)&&created<=now+60000&&created>=now-15*60*1000;
}
export function trial409Summary(s){
 return {product_id:Number(s.product.product_id),draft_id:s.draft.id,source_fingerprint:s.fingerprint,
 draft_fingerprint:s.draftFingerprint,review_receipt:s.reviewReceipt,shop_id:s.shopId,
 blockers:s.blockers,ready_for_operator_trial:s.blockers.length===0,
 trial_receipt:s.trial?.admin_action_audit_id||0,remote_attempt_claim:s.claim?.admin_action_audit_id||0,
 existing_listing_id:s.draft.external_reference||null,
 provider_reconciliation_receipt:s.verified?.admin_action_audit_id||0,
 reconciliation_409_receipt:s.reconciled409?.admin_action_audit_id||0,
 provider_verified_receipt_present:!!s.verified,unpublished_draft_only:true,
 publication_allowed:false,us_shipping_suspended:true};
}
