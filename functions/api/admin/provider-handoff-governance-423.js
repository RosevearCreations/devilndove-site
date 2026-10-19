// Release 467 Build 423 — verified Admin, read-only scoped handoff and owner governance.
import {getDb} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {onRequestGet as read414} from './provider-completion-414.js';
import {TYPE as APPROVAL_TYPE} from '../_lib/providerClosureApproval417.mjs';
import {DECISION_TYPE} from '../_lib/providerReopenDecision419.mjs';
import {HANDOFF_TYPE,FOLLOWUP_TYPE} from '../_lib/providerFollowup413.mjs';
import {COMPLETION_TYPE} from '../_lib/providerCompletion414.mjs';
import {ACK_TYPE,review422} from '../_lib/providerExceptionAck422.mjs';
import {reconcileContinuity420} from '../_lib/providerReopenContinuity420.mjs';
import {reviewExceptionFollowup421} from '../_lib/providerExceptionFollowup421.mjs';
import {reconcileHandoffGovernance423} from '../_lib/providerHandoffGovernance423.mjs';
const reply=(d,status=200)=>Response.json({ok:status<400,build:423,read_only:true,
 provider_called:false,publication_performed:false,notifications_sent:false,
 automatic_reopen:false,automatic_closure:false,us_shipping_suspended:true,...d},
 {status,headers:{'Cache-Control':'no-store'}});
const statement='SELECT admin_action_audit_id,actor_user_id,action_type,created_at,details_json FROM admin_action_audit WHERE target_type=? AND target_key=? AND action_type IN (?,?) ORDER BY admin_action_audit_id DESC LIMIT 101';
export async function onRequestGet(c){
 const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 if(!admin)return reply({error:'Verified active Admin required.'},401);
 if(!db)return reply({error:'Local audit database unavailable.'},503);
 const u=new URL(c.request.url),destination=u.searchParams.get('destination'),
  productId=u.searchParams.get('product_id'),draftId=u.searchParams.get('draft_id');
 if(u.searchParams.get('mode')!=='detail'||!['etsy','facebook'].includes(destination)||
 !/^[1-9]\d{0,14}$/.test(String(productId||''))||
 (destination==='etsy'&&!/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(String(draftId||''))))
  return reply({error:'Explicit valid Product and case required.'},400);
 try{
  const response=await read414(c);
  if(!response.ok)return response;
  const snapshot=await response.json();
  if(!snapshot?.ok||String(snapshot.product_id)!==String(productId)||
    snapshot.destination!==destination||
    (destination==='etsy'&&snapshot.draft_id!==draftId))
   return reply({error:'Current selected case could not be verified.'},409);
  const kind=destination==='etsy'?'marketplace_draft':'product';
  const key=destination==='etsy'?draftId:productId;
  const single='SELECT admin_action_audit_id,actor_user_id,action_type,created_at,details_json FROM admin_action_audit WHERE target_type=? AND target_key=? AND action_type=? ORDER BY admin_action_audit_id DESC LIMIT 101';
  const [decisionSet,followupSet,handoffSet,ackSet]=await Promise.all([
   db.prepare(statement).bind(kind,key,APPROVAL_TYPE,DECISION_TYPE).all(),
   db.prepare(statement).bind(kind,key,FOLLOWUP_TYPE,COMPLETION_TYPE).all(),
   db.prepare(single).bind(kind,key,HANDOFF_TYPE).all(),
   db.prepare(single).bind(kind,key,ACK_TYPE).all()
  ]);
  if(![decisionSet,followupSet,handoffSet,ackSet].every(x=>Array.isArray(x?.results)))
   return reply({error:'Bounded audit evidence scan unavailable.'},503);
  const decisions=decisionSet.results,followups=followupSet.results,
   handoffs=handoffSet.results,acks=ackSet.results;
  const continuity=reconcileContinuity420({rows:decisions.slice(0,100),snapshot,scanComplete:decisions.length<101});
  const followup=reviewExceptionFollowup421({continuity,sourceRows:followups.slice(0,100),
   snapshot,scanComplete:followups.length<101});
  const owner=review422({snapshot,continuity,review:followup,
   ackRows:acks.slice(0,100),complete:acks.length<101});
  const governance=reconcileHandoffGovernance423({snapshot,continuity,followup,ownerReview:owner,
   handoffRows:handoffs.slice(0,100),ackRows:acks.slice(0,100),
   handoffScanComplete:handoffs.length<101,ackScanComplete:acks.length<101});
  return reply({product_id:snapshot.product_id,destination,governance,
   manual_review_only:true,
   owner_review_status:owner.status,followup_review_status:followup.status,
   operator_action:'Review original handoff and exception receipts. Escalations, assignments and provider state remain unchanged.'});
 }catch{return reply({error:'Local governance evidence unavailable; no provider write attempted.'},503);}
}
