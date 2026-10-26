/* Build 481: protected, idempotent and append-only priority receipt; no case mutation. */
import {getAdminUserFromRequest,getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {priorities481,actions481} from '../../../public/js/maker-aftercare-priority-policy-481.mjs';
const reply=(body,status=200)=>jsonResponse({release:467,build:481,...body},status,{'Cache-Control':'no-store'});
const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const safe=v=>/^[a-zA-Z0-9 _.-]{8,120}$/.test(String(v??'').trim());
const digest=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)))),b=>b.toString(16).padStart(2,'0')).join('');
export async function onRequestPost(ctx){
 const admin=await getAdminUserFromRequest(ctx.request,ctx.env);
 if(!admin)return reply({ok:false,error:'Admin sign-in required.'},401);
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)return reply({ok:false,error:'Same-origin request required.'},403);
 const db=getDb(ctx.env);if(!db)return reply({ok:false,error:'D1 binding unavailable.'},503);
 let b;try{b=await ctx.request.json()}catch{return reply({ok:false,error:'Valid JSON required.'},400)}
 const orderId=id(b?.order_id),sourceId=id(b?.source_receipt_id),actor=id(admin.user_id),priority=String(b?.priority??''),action=String(b?.next_action??''),evidence=String(b?.evidence_reference??'').trim(),key=String(b?.request_key??'');
 if(!orderId||!sourceId||!actor||!priorities481.includes(priority)||!actions481.includes(action)||!safe(evidence)||b?.owner_observed!==true||!/^[a-zA-Z0-9_-]{16,80}$/.test(key))return reply({ok:false,error:'Actual source, permitted priority, action, private reference, Admin attestation and unique key required.'},400);
 try{
  const table=await db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name='maker_order_fulfillment_evidence'").first();
  if(Number(table?.n)!==1)return reply({ok:false,error:'Build 454 migration 0049 required.'},503);
  const source=await db.prepare('SELECT evidence_id,event_kind,review_note FROM maker_order_fulfillment_evidence WHERE order_id=? AND evidence_id=?').bind(orderId,sourceId).first();
  if(source?.event_kind!=='aftercare_followup'||!/Build 479 outstanding review; owner #\d+; audit #\d+; source hold #\d+; follow-up #\d+; case=[a-zA-Z0-9 _.-]{8,120}; evidence=[a-zA-Z0-9 _.-]{8,120}; state=(evidence_still_missing|awaiting_owner_action|awaiting_external_decision|reassessment_complete_case_open); case remains open, no external action\./.test(String(source.review_note||'')))
   return reply({ok:false,error:'HOLD: original Build 479 follow-up not found for this order.',code:'PRIORITY_SOURCE_HOLD'},409);
  const note=`Build 481 priority review; source follow-up #${sourceId}; priority=${priority}; next=${action}; evidence=${evidence}; owner observed; case remains open; no customer action.`;
  const hash=await digest({orderId,sourceId,priority,action,evidence,note});
  const previous=await db.prepare('SELECT evidence_id,actor_user_id,payload_sha256 FROM maker_order_fulfillment_evidence WHERE request_key=?').bind(key).first();
  if(previous)return Number(previous.actor_user_id)===actor&&previous.payload_sha256===hash?reply({ok:true,replayed:true,receipt_id:previous.evidence_id}):reply({ok:false,error:'Request key conflict.'},409);
  // Atomic first-write guard: one priority receipt per Build 479 source, even under concurrent requests.
  const marker=`%Build 481 priority review; source follow-up #${sourceId};%`;
  const run=await db.prepare("INSERT INTO maker_order_fulfillment_evidence(order_id,event_kind,review_note,actor_user_id,request_key,payload_sha256) SELECT ?, 'aftercare_followup', ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM maker_order_fulfillment_evidence WHERE order_id=? AND event_kind='aftercare_followup' AND review_note LIKE ?)")
   .bind(orderId,note,actor,key,hash,orderId,marker).run();
  if(!Number(run.meta?.changes)){
   const repeat=await db.prepare('SELECT evidence_id,actor_user_id,payload_sha256 FROM maker_order_fulfillment_evidence WHERE request_key=?').bind(key).first();
   if(repeat&&Number(repeat.actor_user_id)===actor&&repeat.payload_sha256===hash)return reply({ok:true,replayed:true,receipt_id:repeat.evidence_id});
   return reply({ok:false,error:'HOLD: a priority annotation already exists for this source.',code:'PRIORITY_ALREADY_RECORDED'},409);
  }
  const receiptId=Number(run.meta?.last_row_id||0);
  await auditAdminAction(ctx.env,ctx.request,admin,{action_type:'build481_aftercare_priority_review',target_type:'maker_order_fulfillment_evidence',target_id:receiptId,details:{order_id:orderId,private:true,external_actions:false}});
  return reply({ok:true,receipt_id:receiptId,read_only_effects:true,case_closed:false,external_actions:false});
 }catch(e){console.error('BUILD481_PRIORITY_WRITE',e?.name);return reply({ok:false,error:'HOLD: priority annotation could not be verified or recorded; no external action.',code:'PRIORITY_WRITE_HOLD'},409)}
}
