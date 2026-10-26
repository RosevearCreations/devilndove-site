/* Build 484: source-verified owner decision receipt, no external decision execution. */
import {getAdminUserFromRequest,getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {decisions484} from '../../../public/js/maker-aftercare-decision-policy-484.mjs';
const reply=(body,status=200)=>jsonResponse({release:467,build:484,...body},status,{'Cache-Control':'no-store'});
const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const safe=v=>/^[a-zA-Z0-9 _.-]{8,120}$/.test(String(v??'').trim());
const digest=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)))),b=>b.toString(16).padStart(2,'0')).join('');
export async function onRequestPost(ctx){
 const admin=await getAdminUserFromRequest(ctx.request,ctx.env);
 if(!admin)return reply({ok:false,error:'Admin sign-in required.'},401);
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)return reply({ok:false,error:'Same-origin request required.'},403);
 const db=getDb(ctx.env);if(!db)return reply({ok:false,error:'D1 binding unavailable.'},503);
 let b;try{b=await ctx.request.json()}catch{return reply({ok:false,error:'Valid JSON required.'},400)}
 const orderId=id(b?.order_id),sourceId=id(b?.source_receipt_id),priorityId=id(b?.priority_receipt_id),handoffId=id(b?.handoff_receipt_id),reassessmentId=id(b?.reassessment_receipt_id),actor=id(admin.user_id),decision=String(b?.decision??''),evidence=String(b?.evidence_reference??'').trim(),key=String(b?.request_key??'');
 if(!orderId||!sourceId||!priorityId||!handoffId||!reassessmentId||!actor||!decisions484.includes(decision)||!safe(evidence)||b?.owner_observed!==true||!/^[a-zA-Z0-9_-]{16,80}$/.test(key))return reply({ok:false,error:'Actual source chain, manual follow-up decision, private evidence, separate Admin attestation and unique key required.'},400);
 try{
  const table=await db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name='maker_order_fulfillment_evidence'").first();
  if(Number(table?.n)!==1)return reply({ok:false,error:'Build 454 migration 0049 required.'},503);
  const source=await db.prepare('SELECT event_kind,review_note FROM maker_order_fulfillment_evidence WHERE order_id=? AND evidence_id=?').bind(orderId,sourceId).first();
  if(source?.event_kind!=='aftercare_followup'||!/^Build 479 outstanding review; owner #\d+; audit #\d+; source hold #\d+; follow-up #\d+; case=[a-zA-Z0-9 _.-]{8,120}; evidence=[a-zA-Z0-9 _.-]{8,120}; state=(evidence_still_missing|awaiting_owner_action|awaiting_external_decision|reassessment_complete_case_open); case remains open, no external action\.$/.test(String(source.review_note||'')))return reply({ok:false,error:'HOLD: original Build 479 source missing.',code:'DECISION_SOURCE_HOLD'},409);
  const priority=await db.prepare('SELECT event_kind,review_note FROM maker_order_fulfillment_evidence WHERE order_id=? AND evidence_id=?').bind(orderId,priorityId).first();
  if(priority?.event_kind!=='aftercare_followup'||!String(priority.review_note||'').startsWith(`Build 481 priority review; source follow-up #${sourceId};`)||!/; owner observed; case remains open; no customer action\.$/.test(String(priority.review_note||'')))return reply({ok:false,error:'HOLD: original Build 481 priority missing.',code:'DECISION_PRIORITY_HOLD'},409);
  const handoff=await db.prepare('SELECT event_kind,review_note FROM maker_order_fulfillment_evidence WHERE order_id=? AND evidence_id=?').bind(orderId,handoffId).first();
  if(handoff?.event_kind!=='aftercare_followup'||!String(handoff.review_note||'').startsWith(`Build 482 owner handoff; source follow-up #${sourceId}; priority receipt #${priorityId};`)||!/; receiver independently verified; case remains open; no external action\.$/.test(String(handoff.review_note||'')))return reply({ok:false,error:'HOLD: original Build 482 handoff missing.',code:'DECISION_HANDOFF_HOLD'},409);
  const review=await db.prepare('SELECT event_kind,review_note,actor_user_id FROM maker_order_fulfillment_evidence WHERE order_id=? AND evidence_id=?').bind(orderId,reassessmentId).first();
  if(review?.event_kind!=='aftercare_followup'||!/^Build 483 handoff reassessment; source follow-up #\d+; priority receipt #\d+; handoff receipt #\d+; finding=(further_evidence_required|owner_action_pending|external_authorization_pending|manual_reassessment_complete_case_open); evidence=[a-zA-Z0-9 _.-]{8,120}; independently reassessed; case remains open; no external action\.$/.test(String(review.review_note||''))||!String(review.review_note).startsWith(`Build 483 handoff reassessment; source follow-up #${sourceId}; priority receipt #${priorityId}; handoff receipt #${handoffId};`))return reply({ok:false,error:'HOLD: matching Build 483 reassessment missing.',code:'DECISION_REASSESSMENT_HOLD'},409);
  if(Number(review.actor_user_id)===actor)return reply({ok:false,error:'HOLD: decision Admin must differ from independent reassessment reviewer.',code:'INDEPENDENCE_REQUIRED'},409);
  const note=`Build 484 follow-up decision; source follow-up #${sourceId}; priority receipt #${priorityId}; handoff receipt #${handoffId}; reassessment receipt #${reassessmentId}; decision=${decision}; evidence=${evidence}; owner separately reviewed; case remains open; no external action.`;
  const hash=await digest({orderId,sourceId,priorityId,handoffId,reassessmentId,decision,evidence,note});
  const previous=await db.prepare('SELECT evidence_id,actor_user_id,payload_sha256 FROM maker_order_fulfillment_evidence WHERE request_key=?').bind(key).first();
  if(previous)return Number(previous.actor_user_id)===actor&&previous.payload_sha256===hash?reply({ok:true,replayed:true,receipt_id:previous.evidence_id}):reply({ok:false,error:'Request key conflict.'},409);
  const marker=`%Build 484 follow-up decision; source follow-up #${sourceId}; priority receipt #${priorityId}; handoff receipt #${handoffId}; reassessment receipt #${reassessmentId};%`;
  const run=await db.prepare("INSERT INTO maker_order_fulfillment_evidence(order_id,event_kind,review_note,actor_user_id,request_key,payload_sha256) SELECT ?, 'aftercare_followup', ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM maker_order_fulfillment_evidence WHERE order_id=? AND event_kind='aftercare_followup' AND review_note LIKE ?)")
   .bind(orderId,note,actor,key,hash,orderId,marker).run();
  if(!Number(run.meta?.changes)){
   const repeat=await db.prepare('SELECT evidence_id,actor_user_id,payload_sha256 FROM maker_order_fulfillment_evidence WHERE request_key=?').bind(key).first();
   if(repeat&&Number(repeat.actor_user_id)===actor&&repeat.payload_sha256===hash)return reply({ok:true,replayed:true,receipt_id:repeat.evidence_id});
   return reply({ok:false,error:'HOLD: an owner decision already exists for this reassessment.',code:'DECISION_ALREADY_RECORDED'},409);
  }
  const receiptId=Number(run.meta?.last_row_id||0);
  await auditAdminAction(ctx.env,ctx.request,admin,{action_type:'build484_aftercare_owner_decision',target_type:'maker_order_fulfillment_evidence',target_id:receiptId,details:{order_id:orderId,private:true,independent_review:true,external_actions:false}});
  return reply({ok:true,receipt_id:receiptId,read_only_effects:true,case_closed:false,external_actions:false});
 }catch(e){console.error('BUILD484_DECISION_WRITE',e?.name);return reply({ok:false,error:'HOLD: follow-up decision could not be verified or recorded; no external action.',code:'DECISION_WRITE_HOLD'},409)}
}
