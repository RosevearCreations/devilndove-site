// Release 467 Build 411 — bounded, operator-click-only D1 audit snapshot governance and escalation.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {productIdValid} from '../_lib/productDistribution406.mjs';
import {uuidDraft,keyValid} from '../_lib/etsyTrialGate409.mjs';
import {parseReceipt} from '../_lib/listingSyncOperator408.mjs';
import {ACTIONS,sourceState,snapshotSignature,snapshotGovernance,escalationStatus,decisionAllowed,safeText,auditId} from '../_lib/providerEvidence411.mjs';
const reply=(v,status=200)=>jsonResponse({ok:status<400,build:411,provider_called:false,provider_write:false,
 publication_performed:false,automatic_retry:false,us_shipping_suspended:true,...v},status,{'Cache-Control':'no-store'});
const snapshotType='provider_evidence_411_snapshot',escalationType='provider_evidence_411_escalation';
const latest="SELECT admin_action_audit_id,details_json,created_at FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const history="SELECT admin_action_audit_id,action_type,details_json,created_at FROM admin_action_audit WHERE target_type=? AND target_key=? AND action_type IN ('etsy_remote_draft_trial_claimed','etsy_remote_draft_reconciled','etsy_trial_410_case_review','provider_evidence_411_snapshot','provider_evidence_411_escalation') ORDER BY admin_action_audit_id DESC LIMIT 12";
function auth(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:reply({error:'Active verified administrator required.'},401)}:
 !db?{error:reply({error:'D1 unavailable.'},503)}:{admin,db};}
function scope(destination,id,draftId){return {type:destination==='etsy'?'marketplace_draft':'product',
 key:destination==='etsy'?draftId:String(id)};}
async function load(db,destination,id,draftId){
 const sc=scope(destination,id,draftId);
 const [product,draft,claim,verified,caseReceipt,channelIntent,policyReceipt,snapshot,escalation,timeline]=await Promise.all([
 db.prepare('SELECT product_id,name,price_cents,inventory_quantity FROM products WHERE product_id=? LIMIT 1').bind(id).first(),
 destination==='etsy'?db.prepare("SELECT id,channel_key,product_id,status,external_reference,updated_at FROM marketplace_syndication_drafts WHERE id=? AND channel_key='etsy' LIMIT 1").bind(draftId).first():Promise.resolve(null),
 destination==='etsy'?db.prepare(latest).bind('etsy_remote_draft_trial_claimed','marketplace_draft',draftId).first():Promise.resolve(null),
 destination==='etsy'?db.prepare(latest).bind('etsy_remote_draft_reconciled','marketplace_draft',draftId).first():Promise.resolve(null),
 destination==='etsy'?db.prepare(latest).bind('etsy_trial_410_case_review','marketplace_draft',draftId).first():Promise.resolve(null),
 db.prepare(latest).bind('product_channel_intent_405','product',String(id)).first(),
 db.prepare("SELECT admin_action_audit_id,details_json,created_at FROM admin_action_audit WHERE action_type='product_distribution_policy_406' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.channel')=? ORDER BY admin_action_audit_id DESC LIMIT 1").bind(String(id),destination).first(),
 db.prepare(latest).bind(snapshotType,sc.type,sc.key).first(),
 db.prepare(latest).bind(escalationType,sc.type,sc.key).first(),
 db.prepare(history).bind(sc.type,sc.key).all()
 ]);
 if(!product||(destination==='etsy'&&(!draft||Number(draft.product_id)!==id)))return null;
 const state=sourceState({destination,product,draft,claim,verified,caseReceipt,channelIntent,policyReceipt});
 const signature=snapshotSignature({state,product,draft,escalation});
 const gov=snapshotGovernance({signature,latestSnapshot:snapshot});
 const escalationReview=escalationStatus({latestEscalation:escalation,state});
 const items=(timeline?.results||[]).map(r=>({receipt:auditId(r),event:r.action_type,
  created_at:r.created_at||null,decision:r.action_type===escalationType?parseReceipt(r).decision||'':null,
  source:'local_audit_only'}));
 return {sc,product,draft,state,signature,gov,escalationReview,snapshot,escalation,items};
}
function summary(d){
 return {product_id:Number(d.product.product_id),product_name:safeText(d.product.name,160),
 destination:d.state.destination,draft_id:d.state.draft_id,
 outcome:d.state.outcome,blockers:d.state.blockers,
 remote_claim_receipt:d.state.claim_receipt,verified_draft_receipt:d.state.verified_receipt,
 latest_case_receipt:d.state.case_receipt,shipping_policy_receipt:d.state.policy_receipt,
 listing_id:d.state.listing_id,source_signature:d.signature,
 snapshot:d.gov,escalation:d.escalationReview,timeline:d.items,
 can_capture_snapshot:true,can_escalate:decisionAllowed({action:'escalate',state:d.state,governance:d.gov,escalation:d.escalationReview,
 body:{owner_note:'placeholder valid note',no_provider_retry:true,no_publication:true,us_shipping_suspended:true}}),
 can_resolve:decisionAllowed({action:'resolve',state:d.state,governance:d.gov,escalation:d.escalationReview,
 body:{owner_note:'placeholder valid note',no_provider_retry:true,no_publication:true,us_shipping_suspended:true,confirm_verified_draft_closure:true}}),
 provider_live_checked_now:false,provider_publication_allowed:false,automatic_retry:false,
 history_limited_to:12,source:'D1_CURRENT_ROWS_AND_HISTORICAL_RECEIPTS_ONLY'};
}
export async function onRequestGet(c){
 const g=auth(c);if(g.error)return g.error;
 const u=new URL(c.request.url),id=u.searchParams.get('product_id'),destination=u.searchParams.get('destination'),draftId=u.searchParams.get('draft_id');
 if(!productIdValid(id)||!['etsy','facebook'].includes(destination)||(destination==='etsy'&&!uuidDraft(draftId)))
 return reply({error:'Valid Product, destination and existing local Etsy draft required.'},400);
 try{const d=await load(g.db,destination,Number(id),draftId);return d?reply(summary(d)):
 reply({error:'Product or saved local Etsy draft missing.'},404);}
 catch{return reply({error:'Evidence D1 read unavailable. No provider calls.'},503);}
}
export async function onRequestPost(c){
 const g=auth(c);if(g.error)return g.error;
 let b;try{b=await c.request.json()}catch{return reply({error:'JSON required.'},400)}
 const destination=b?.destination,id=b?.product_id,draftId=b?.draft_id;
 if(!productIdValid(id)||!['etsy','facebook'].includes(destination)||(destination==='etsy'&&!uuidDraft(draftId))||
 !['snapshot','escalate','resolve'].includes(b?.action)||!keyValid(b?.request_key)||
 !/^[a-f0-9]{8}$/.test(String(b?.expected_signature||''))||
 !Number.isSafeInteger(b?.expected_snapshot_receipt)||b.expected_snapshot_receipt<0||
 !Number.isSafeInteger(b?.expected_escalation_receipt)||b.expected_escalation_receipt<0)
 return reply({error:'Valid Product, source snapshot, destination and request key required.'},400);
 const sc=scope(destination,Number(id),draftId),type=ACTIONS[b.action];
 try{
 const existing=await g.db.prepare("SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type IN (?,?) AND target_type=? AND target_key=? AND json_extract(details_json,'$.request_key')=? ORDER BY admin_action_audit_id DESC LIMIT 1")
  .bind(snapshotType,escalationType,sc.type,sc.key,b.request_key).first();
 if(existing){const old=parseReceipt(existing);return old.action===b.action&&old.product_id===Number(id)&&old.destination===destination?
  reply({receipt:existing.admin_action_audit_id,idempotent:true}):reply({error:'Conflicting request-key reuse.'},409);}
 const d=await load(g.db,destination,Number(id),draftId);
 if(!d)return reply({error:'Saved Product / draft missing or mismatched.'},404);
 if(d.signature!==b.expected_signature||d.gov.snapshot_receipt!==b.expected_snapshot_receipt||
   d.escalationReview.receipt!==b.expected_escalation_receipt)
 return reply({error:'Evidence, snapshot, or escalation changed; reload first.',blockers:['stale_evidence_snapshot']},409);
 if(!decisionAllowed({action:b.action,state:d.state,governance:d.gov,escalation:d.escalationReview,body:b}))
 return reply({error:'Unresolved evidence or missing explicit owner review. Snapshot must be captured before escalation; verified Build 410 closure is required to resolve.',blockers:d.state.blockers},409);
 if(b.action==='snapshot'&&d.gov.source_matches_snapshot&&!d.gov.review_due)
 return reply({receipt:d.gov.snapshot_receipt,idempotent:true,message:'Retained identical current-source audit snapshot; no duplicate created.'});
 const detail={build:411,action:b.action,request_key:b.request_key,product_id:Number(id),draft_id:destination==='etsy'?draftId:null,
  destination,source_signature:d.signature,outcome:d.state.outcome,claim_receipt:d.state.claim_receipt,
  verified_receipt:d.state.verified_receipt,case_receipt:d.state.case_receipt,
  linked_listing_id:d.state.listing_id,prior_snapshot_receipt:d.gov.snapshot_receipt,
  prior_escalation_receipt:d.escalationReview.receipt,
  decision:b.action==='escalate'?'OPEN_OWNER_REVIEW':b.action==='resolve'?'RESOLVED_WITH_VERIFIED_EVIDENCE':null,
  owner_note:b.action==='snapshot'?null:b.owner_note.trim(),no_provider_retry:true,no_publication:true,
  us_shipping_suspended:true,provider_called:false,publication_performed:false,
  historical_only:true,source:'D1_LOCAL_AUDIT'};
 const sql="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,?,?,?,'POST',?,?,CURRENT_TIMESTAMP WHERE COALESCE((SELECT admin_action_audit_id FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1),0)=? AND COALESCE((SELECT admin_action_audit_id FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1),0)=? AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type IN (?,?) AND target_type=? AND target_key=? AND json_extract(details_json,'$.request_key')=?)";
 const result=await g.db.prepare(sql).bind(g.admin.user_id,type,sc.type,sc.key,new URL(c.request.url).pathname,JSON.stringify(detail),
  snapshotType,sc.type,sc.key,b.expected_snapshot_receipt,escalationType,sc.type,sc.key,b.expected_escalation_receipt,
  snapshotType,escalationType,sc.type,sc.key,b.request_key).run();
 if(Number(result?.meta?.changes||0)!==1)return reply({error:'Concurrent evidence or escalation update; reload before acting.'},409);
 const receipt=await g.db.prepare("SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? AND json_extract(details_json,'$.request_key')=? LIMIT 1").bind(type,sc.type,sc.key,b.request_key).first();
 if(!receipt||parseReceipt(receipt).action!==b.action)return reply({error:'Local audit result unconfirmed; reload.'},409);
 return reply({receipt:receipt.admin_action_audit_id,action:b.action,
  decision:detail.decision,provider_called:false,publication_performed:false,
  message:b.action==='snapshot'?'Historical evidence snapshot recorded. This does NOT verify live marketplace status.':
  b.action==='escalate'?'Owner-review escalation recorded locally. No automatic notification or provider retry.':
  'Escalation resolved against already-verified Build 410 case evidence; provider unchanged.'});
 }catch{return reply({error:'Local audit outcome unknown; refresh before retry. Provider was not contacted.'},503);}
}
