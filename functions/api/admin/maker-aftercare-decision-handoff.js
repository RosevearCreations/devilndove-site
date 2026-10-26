/* Build 485: independently received owner decision, evidence-only and append-only. */
import {getAdminUserFromRequest,getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {dispositions485} from '../../../public/js/maker-aftercare-decision-handoff-policy-485.mjs';
const reply=(body,status=200)=>jsonResponse({release:467,build:485,...body},status,{'Cache-Control':'no-store'});
const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const safe=v=>/^[a-zA-Z0-9 _.-]{8,120}$/.test(String(v??'').trim());
const digest=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)))),b=>b.toString(16).padStart(2,'0')).join('');
export async function onRequestPost(ctx){
 const admin=await getAdminUserFromRequest(ctx.request,ctx.env);
 if(!admin)return reply({ok:false,error:'Admin sign-in required.'},401);
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)return reply({ok:false,error:'Same-origin request required.'},403);
 const db=getDb(ctx.env);if(!db)return reply({ok:false,error:'D1 binding unavailable.'},503);
 let b;try{b=await ctx.request.json()}catch{return reply({ok:false,error:'Valid JSON required.'},400)}
 const orderId=id(b?.order_id),sourceId=id(b?.source_receipt_id),priorityId=id(b?.priority_receipt_id),handoffId=id(b?.handoff_receipt_id),reassessmentId=id(b?.reassessment_receipt_id),decisionId=id(b?.decision_receipt_id),actor=id(admin.user_id),disposition=String(b?.disposition??''),evidence=String(b?.evidence_reference??'').trim(),key=String(b?.request_key??'');
 if(![orderId,sourceId,priorityId,handoffId,reassessmentId,decisionId,actor].every(Boolean)||!dispositions485.includes(disposition)||!safe(evidence)||b?.receiver_observed!==true||!/^[a-zA-Z0-9_-]{16,80}$/.test(key))return reply({ok:false,error:'Original decision chain, private evidence, separate reviewer attestation and unique request key required.'},400);
 try{
  const table=await db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name='maker_order_fulfillment_evidence'").first();
  if(Number(table?.n)!==1)return reply({ok:false,error:'Build 454 migration 0049 required.'},503);
  const receipts=await Promise.all([sourceId,priorityId,handoffId,reassessmentId,decisionId].map(receiptId=>db.prepare('SELECT event_kind,review_note,actor_user_id FROM maker_order_fulfillment_evidence WHERE order_id=? AND evidence_id=?').bind(orderId,receiptId).first()));
  const [source,priority,handoff,reassessment,decision]=receipts;
  if(receipts.some(r=>r?.event_kind!=='aftercare_followup'))return reply({ok:false,error:'HOLD: original aftercare receipt chain missing.',code:'HANDOFF_SOURCE_HOLD'},409);
  const s=String(source.review_note||''),p=String(priority.review_note||''),h=String(handoff.review_note||''),r=String(reassessment.review_note||''),d=String(decision.review_note||'');
  if(!/^Build 479 outstanding review; owner #\d+; audit #\d+; source hold #\d+; follow-up #\d+; case=[a-zA-Z0-9 _.-]{8,120}; evidence=[a-zA-Z0-9 _.-]{8,120}; state=(evidence_still_missing|awaiting_owner_action|awaiting_external_decision|reassessment_complete_case_open); case remains open, no external action\.$/.test(s)||
   !p.startsWith(`Build 481 priority review; source follow-up #${sourceId};`)||!/; owner observed; case remains open; no customer action\.$/.test(p)||
   !h.startsWith(`Build 482 owner handoff; source follow-up #${sourceId}; priority receipt #${priorityId};`)||!/; receiver independently verified; case remains open; no external action\.$/.test(h)||
   !r.startsWith(`Build 483 handoff reassessment; source follow-up #${sourceId}; priority receipt #${priorityId}; handoff receipt #${handoffId};`)||!/; independently reassessed; case remains open; no external action\.$/.test(r)||
   !d.startsWith(`Build 484 follow-up decision; source follow-up #${sourceId}; priority receipt #${priorityId}; handoff receipt #${handoffId}; reassessment receipt #${reassessmentId};`)||!/; decision=(continue_evidence_collection|owner_manual_followup|external_approval_hold|schedule_independent_recheck); evidence=[a-zA-Z0-9 _.-]{8,120}; owner separately reviewed; case remains open; no external action\.$/.test(d))return reply({ok:false,error:'HOLD: original Build 479–484 source chain cannot be matched.',code:'HANDOFF_CHAIN_HOLD'},409);
  if(Number(decision.actor_user_id)===actor)return reply({ok:false,error:'HOLD: receiving Admin must differ from Build 484 decision writer.',code:'INDEPENDENCE_REQUIRED'},409);
  const note=`Build 485 independent decision handoff; source follow-up #${sourceId}; priority receipt #${priorityId}; handoff receipt #${handoffId}; reassessment receipt #${reassessmentId}; decision receipt #${decisionId}; disposition=${disposition}; evidence=${evidence}; receiver independently verified; case remains open; no external action.`;
  const hash=await digest({orderId,sourceId,priorityId,handoffId,reassessmentId,decisionId,disposition,evidence,note});
  const previous=await db.prepare('SELECT evidence_id,actor_user_id,payload_sha256 FROM maker_order_fulfillment_evidence WHERE request_key=?').bind(key).first();
  if(previous)return Number(previous.actor_user_id)===actor&&previous.payload_sha256===hash?reply({ok:true,replayed:true,receipt_id:previous.evidence_id,case_closed:false,external_actions:false}):reply({ok:false,error:'Request key conflict.'},409);
  const marker=`%Build 485 independent decision handoff; source follow-up #${sourceId}; priority receipt #${priorityId}; handoff receipt #${handoffId}; reassessment receipt #${reassessmentId}; decision receipt #${decisionId};%`;
  const run=await db.prepare("INSERT INTO maker_order_fulfillment_evidence(order_id,event_kind,review_note,actor_user_id,request_key,payload_sha256) SELECT ?, 'aftercare_followup', ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM maker_order_fulfillment_evidence WHERE order_id=? AND event_kind='aftercare_followup' AND review_note LIKE ?)").bind(orderId,note,actor,key,hash,orderId,marker).run();
  if(!Number(run.meta?.changes)){
   const retry=await db.prepare('SELECT evidence_id,actor_user_id,payload_sha256 FROM maker_order_fulfillment_evidence WHERE request_key=?').bind(key).first();
   if(retry&&Number(retry.actor_user_id)===actor&&retry.payload_sha256===hash)return reply({ok:true,replayed:true,receipt_id:retry.evidence_id,case_closed:false,external_actions:false});
   return reply({ok:false,error:'HOLD: independent handoff already exists for this decision.',code:'HANDOFF_ALREADY_RECORDED'},409);
  }
  const receiptId=Number(run.meta?.last_row_id||0);
  await auditAdminAction(ctx.env,ctx.request,admin,{action_type:'build485_aftercare_independent_decision_handoff',target_type:'maker_order_fulfillment_evidence',target_id:receiptId,details:{order_id:orderId,private:true,decision_id:decisionId,independent_review:true,external_actions:false}});
  return reply({ok:true,receipt_id:receiptId,read_only_effects:true,case_closed:false,external_actions:false});
 }catch(e){console.error('BUILD485_HANDOFF_WRITE',e?.name);return reply({ok:false,error:'HOLD: independent decision handoff could not be verified or recorded; no external action.',code:'HANDOFF_WRITE_HOLD'},409)}
}
