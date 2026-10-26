/* Build 486: append-only independent decision-handoff outcome reconciliation. */
import {getAdminUserFromRequest,getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {outcomes486} from '../../../public/js/maker-aftercare-outcome-policy-486.mjs';
const reply=(x,status=200)=>jsonResponse({release:467,build:486,...x},status,{'Cache-Control':'no-store'});
const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const digest=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)))),b=>b.toString(16).padStart(2,'0')).join('');
export async function onRequestPost(c){const admin=await getAdminUserFromRequest(c.request,c.env);if(!admin)return reply({ok:false,error:'Admin sign-in required.'},401);
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return reply({ok:false,error:'Same-origin required.'},403);
 const db=getDb(c.env);if(!db)return reply({ok:false,error:'D1 unavailable.'},503);
 let b;try{b=await c.request.json()}catch{return reply({ok:false,error:'Valid JSON required.'},400)}
 const fields=['order_id','source_receipt_id','priority_receipt_id','handoff_receipt_id','reassessment_receipt_id','decision_receipt_id','independent_decision_handoff_receipt_id'],ids=fields.map(f=>id(b?.[f]));const [order,source,priority,handoff,reassessment,decision,independent]=ids;
 const actor=id(admin.user_id),outcome=String(b?.outcome||''),evidence=String(b?.evidence_reference||'').trim(),key=String(b?.request_key||'');
 if(ids.some(x=>!x)||!actor||!outcomes486.includes(outcome)||!/^[a-zA-Z0-9 _.-]{8,120}$/.test(evidence)||b?.owner_reconciled!==true||!/^[a-zA-Z0-9_-]{16,80}$/.test(key))return reply({ok:false,error:'Verified source receipts, non-executing outcome, private evidence and independent attestation required.'},400);
 try{
  const rows=await Promise.all(ids.slice(1).map(x=>db.prepare('SELECT event_kind,review_note,actor_user_id FROM maker_order_fulfillment_evidence WHERE order_id=? AND evidence_id=?').bind(order,x).first()));
  if(rows.some(x=>x?.event_kind!=='aftercare_followup'))return reply({ok:false,error:'HOLD: source chain missing.',code:'OUTCOME_SOURCE_HOLD'},409);
  const notes=rows.map(x=>String(x.review_note||''));
  if(!/^Build 479 outstanding review; owner #\d+; audit #\d+; source hold #\d+; follow-up #\d+; case=[a-zA-Z0-9 _.-]{8,120}; evidence=[a-zA-Z0-9 _.-]{8,120}; state=(evidence_still_missing|awaiting_owner_action|awaiting_external_decision|reassessment_complete_case_open); case remains open, no external action\.$/.test(notes[0])||
   !notes[1].startsWith(`Build 481 priority review; source follow-up #${source};`)||!/; owner observed; case remains open; no customer action\.$/.test(notes[1])||
   !notes[2].startsWith(`Build 482 owner handoff; source follow-up #${source}; priority receipt #${priority};`)||!/; receiver independently verified; case remains open; no external action\.$/.test(notes[2])||
   !notes[3].startsWith(`Build 483 handoff reassessment; source follow-up #${source}; priority receipt #${priority}; handoff receipt #${handoff};`)||!/; independently reassessed; case remains open; no external action\.$/.test(notes[3])||
   !notes[4].startsWith(`Build 484 follow-up decision; source follow-up #${source}; priority receipt #${priority}; handoff receipt #${handoff}; reassessment receipt #${reassessment};`)||!/; owner separately reviewed; case remains open; no external action\.$/.test(notes[4])||
   !notes[5].startsWith(`Build 485 independent decision handoff; source follow-up #${source}; priority receipt #${priority}; handoff receipt #${handoff}; reassessment receipt #${reassessment}; decision receipt #${decision};`)||
   !/; receiver independently verified; case remains open; no external action\.$/.test(notes[5]))return reply({ok:false,error:'HOLD: source-linked Build 479–485 chain cannot be verified.',code:'OUTCOME_CHAIN_HOLD'},409);
  if(Number(rows[5].actor_user_id)===actor)return reply({ok:false,error:'Independent outcome Admin must differ from Build 485 receiving Admin.',code:'INDEPENDENCE_REQUIRED'},409);
  const note=`Build 486 independent handoff outcome; source follow-up #${source}; priority receipt #${priority}; handoff receipt #${handoff}; reassessment receipt #${reassessment}; decision receipt #${decision}; independent receipt #${independent}; outcome=${outcome}; evidence=${evidence}; owner independently reconciled; case remains open; no external action.`;
  const hash=await digest({ids,outcome,evidence,note});
  const prev=await db.prepare('SELECT evidence_id,actor_user_id,payload_sha256 FROM maker_order_fulfillment_evidence WHERE request_key=?').bind(key).first();
  if(prev)return Number(prev.actor_user_id)===actor&&prev.payload_sha256===hash?reply({ok:true,replayed:true,receipt_id:prev.evidence_id,case_closed:false,external_actions:false}):reply({ok:false,error:'Request key conflict.'},409);
  const marker=`%Build 486 independent handoff outcome; source follow-up #${source}; priority receipt #${priority}; handoff receipt #${handoff}; reassessment receipt #${reassessment}; decision receipt #${decision}; independent receipt #${independent};%`;
  const run=await db.prepare("INSERT INTO maker_order_fulfillment_evidence(order_id,event_kind,review_note,actor_user_id,request_key,payload_sha256) SELECT ?,'aftercare_followup',?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM maker_order_fulfillment_evidence WHERE order_id=? AND event_kind='aftercare_followup' AND review_note LIKE ?)").bind(order,note,actor,key,hash,order,marker).run();
  if(!Number(run.meta?.changes)){const retry=await db.prepare('SELECT evidence_id,actor_user_id,payload_sha256 FROM maker_order_fulfillment_evidence WHERE request_key=?').bind(key).first();
   if(retry&&Number(retry.actor_user_id)===actor&&retry.payload_sha256===hash)return reply({ok:true,replayed:true,receipt_id:retry.evidence_id,case_closed:false,external_actions:false});
   return reply({ok:false,error:'Outcome reconciliation already exists for this independent handoff.',code:'OUTCOME_ALREADY_RECORDED'},409);}
  const receipt=Number(run.meta?.last_row_id||0);await auditAdminAction(c.env,c.request,admin,{action_type:'build486_aftercare_independent_outcome',target_type:'maker_order_fulfillment_evidence',target_id:receipt,details:{order_id:order,private:true,independent_review:true,external_actions:false}});
  return reply({ok:true,receipt_id:receipt,case_closed:false,external_actions:false,read_only_effects:true});
 }catch(e){console.error('BUILD486_OUTCOME_WRITE',e?.name);return reply({ok:false,error:'HOLD: outcome reconciliation not confirmed. No external action.',code:'OUTCOME_WRITE_HOLD'},409)}
}
