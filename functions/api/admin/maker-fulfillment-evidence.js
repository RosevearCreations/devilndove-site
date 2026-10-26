// Build 454: Admin-only, source-linked fulfillment/aftercare review; never books a carrier or contacts a customer.
import {getAdminUserFromRequest,getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
const reply=(body,status=200)=>jsonResponse({release:467,build:454,...body},status,{'Cache-Control':'no-store'});
const policy={canada_only:true,us_shipping_suspended:true,provider_booking:false,customer_message:false,refund_execution:false,order_status_mutation:false};
const kinds=new Set(['packing_review','shipping_receipt','pickup_receipt','damage_hold','return_hold','repair_followup','aftercare_followup']);
const rows=r=>Array.isArray(r?.results)?r.results:[];
const clean=(v,max)=>String(v??'').trim().slice(0,max);
const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const digest=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)))),b=>b.toString(16).padStart(2,'0')).join('');
async function access(ctx){
 const admin=await getAdminUserFromRequest(ctx.request,ctx.env);
 if(!admin)return {error:reply({ok:false,error:'Admin sign-in required.'},401)};
 const db=getDb(ctx.env);if(!db)return {error:reply({ok:false,error:'D1 binding unavailable.'},503)};
 const ready=await db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name='maker_order_fulfillment_evidence'").first().catch(()=>null);
 if(Number(ready?.n)!==1)return {error:reply({ok:false,error:'Build 454 migration 0049 is required.',code:'MIGRATION_REQUIRED'},503)};
 return {admin,db};
}
async function view(db,id){
 const order=await db.prepare('SELECT order_id,order_number,order_status,payment_status,fulfillment_type,shipping_country,currency,updated_at FROM orders WHERE order_id=?').bind(id).first();
 if(!order)return null;
 const evidence=rows(await db.prepare('SELECT evidence_id,event_kind,package_instructions,carrier,tracking_reference,receipt_reference,review_note,actor_user_id,created_at FROM maker_order_fulfillment_evidence WHERE order_id=? ORDER BY evidence_id DESC LIMIT 51').bind(id).all());
 return {order,evidence:evidence.slice(0,50),history_truncated:evidence.length>50,policy};
}
export async function onRequestGet(ctx){const a=await access(ctx);if(a.error)return a.error;
 const id=positive(new URL(ctx.request.url).searchParams.get('order_id'));if(!id)return reply({ok:false,error:'Select an order.'},400);
 try{const result=await view(a.db,id);return result?reply({ok:true,...result,reviewer_actor_id:positive(a.admin.user_id)}):reply({ok:false,error:'Order not found.'},404)}
 catch(e){console.error('BUILD454_READ',e?.name);return reply({ok:false,error:'Fulfillment evidence unavailable.'},503)}
}
export async function onRequestPost(ctx){const a=await access(ctx);if(a.error)return a.error;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)return reply({ok:false,error:'Same-origin request required.'},403);
 let b;try{b=await ctx.request.json()}catch{return reply({ok:false,error:'Valid JSON required.'},400)}
 const orderId=positive(b?.order_id),eventKind=clean(b?.event_kind,40),reviewNote=clean(b?.review_note,1200);
 const packageInstructions=clean(b?.package_instructions,1200),carrier=clean(b?.carrier,120),trackingReference=clean(b?.tracking_reference,160),receiptReference=clean(b?.receipt_reference,160),key=String(b?.request_key??'');
 if(!orderId||!kinds.has(eventKind)||reviewNote.length<16||!/^[a-zA-Z0-9_-]{16,80}$/.test(key))return reply({ok:false,error:'Valid order, event, unique request key and 16-character review note required.'},400);
 if(eventKind==='shipping_receipt'&&(!carrier||!trackingReference||!receiptReference))return reply({ok:false,error:'Carrier, tracking and independently recorded postage receipt reference required.'},400);
 if(eventKind==='pickup_receipt'&&!receiptReference)return reply({ok:false,error:'Record the actual pickup receipt/reference.'},400);
 const actor=positive(a.admin.user_id);if(!actor)return reply({ok:false,error:'Verified Admin actor required.'},401);
 const auditMode=b?.audit_mode==='independent_aftercare_477';
 const reconciliationMode=b?.reconciliation_mode==='owner_aftercare_478';
 const outstandingMode=b?.outstanding_mode==='aftercare_followup_479';
 if(reviewNote.includes('Build 477 independent audit;')&&!auditMode)return reply({ok:false,error:'Independent audit requires the protected Build 477 source-validation path.'},400);
 if(reviewNote.includes('Build 478 owner reconciliation;')&&!reconciliationMode)return reply({ok:false,error:'Owner reconciliation requires protected original evidence checks.'},400);
 if(reviewNote.includes('Build 479 outstanding review;')&&!outstandingMode)return reply({ok:false,error:'Outstanding follow-up requires protected original evidence checks.'},400);
 if([auditMode,reconciliationMode,outstandingMode].filter(Boolean).length>1)return reply({ok:false,error:'Select only one evidence review mode.'},400);
 const sourceId=positive(b?.audit_source_hold_id),followupId=positive(b?.audit_followup_id),caseRef=clean(b?.audit_case_reference,120);
 if(auditMode){
  if(eventKind!=='aftercare_followup'||!sourceId||!followupId||sourceId===followupId||!/^[a-zA-Z0-9 _.-]{8,120}$/.test(caseRef))return reply({ok:false,error:'Original case, separate source and follow-up receipts are required for independent audit.'},400);
  const evidence=rows(await a.db.prepare('SELECT evidence_id,order_id,event_kind,review_note,actor_user_id FROM maker_order_fulfillment_evidence WHERE order_id=? AND evidence_id IN (?,?)').bind(orderId,sourceId,followupId).all().catch(()=>({results:[]})));
  const source=evidence.find(e=>positive(e.evidence_id)===sourceId),followup=evidence.find(e=>positive(e.evidence_id)===followupId);
  if(!source||!followup||!['damage_hold','return_hold','repair_followup'].includes(source.event_kind)||followup.event_kind!=='aftercare_followup'
    ||!String(source.review_note||'').includes(`Trial II case ref=${caseRef};`)
    ||!String(followup.review_note||'').includes(`source hold #${sourceId};`)
    ||!String(followup.review_note||'').includes(`case=${caseRef};`)
    ||![positive(source.actor_user_id),positive(followup.actor_user_id)].every(x=>x>0&&x!==actor)
    ||!reviewNote.includes(`Build 477 independent audit; source hold #${sourceId}; follow-up #${followupId}; case=${caseRef};`))
   return reply({ok:false,error:'HOLD: original HOLD/follow-up provenance or independent actor check failed. No audit receipt recorded.',code:'INDEPENDENT_AUDIT_HOLD'},409);
 }
 const reconcileAuditId=positive(b?.reconcile_audit_id);
 if(reconciliationMode){
  if(eventKind!=='aftercare_followup'||!sourceId||!followupId||!reconcileAuditId||new Set([sourceId,followupId,reconcileAuditId]).size!==3||!/^[a-zA-Z0-9 _.-]{8,120}$/.test(caseRef))return reply({ok:false,error:'Three distinct source receipts and an exact private case are required.'},400);
  const evidence=rows(await a.db.prepare('SELECT evidence_id,event_kind,review_note,actor_user_id FROM maker_order_fulfillment_evidence WHERE order_id=? AND evidence_id IN (?,?,?)').bind(orderId,sourceId,followupId,reconcileAuditId).all().catch(()=>({results:[]})));
  const source=evidence.find(e=>positive(e.evidence_id)===sourceId),followup=evidence.find(e=>positive(e.evidence_id)===followupId),audit=evidence.find(e=>positive(e.evidence_id)===reconcileAuditId);
  if(!source||!followup||!audit||!['damage_hold','return_hold','repair_followup'].includes(source.event_kind)||followup.event_kind!=='aftercare_followup'||audit.event_kind!=='aftercare_followup'
   ||!String(source.review_note||'').includes(`Trial II case ref=${caseRef};`)
   ||!String(followup.review_note||'').includes(`source hold #${sourceId};`)||!String(followup.review_note||'').includes(`case=${caseRef};`)
   ||!String(audit.review_note||'').includes(`Build 477 independent audit; source hold #${sourceId}; follow-up #${followupId}; case=${caseRef};`)
   ||!positive(audit.actor_user_id)||positive(audit.actor_user_id)===actor
   ||!reviewNote.includes(`Build 478 owner reconciliation; audit #${reconcileAuditId}; source hold #${sourceId}; follow-up #${followupId}; case=${caseRef};`)
   ||!/; evidence=[a-zA-Z0-9 _.-]{8,120}; exception=(missing_evidence|owner_followup_needed|external_decision_pending|owner_evidence_reconciled); review only, no closure or external action\.$/.test(reviewNote))
   return reply({ok:false,error:'HOLD: original evidence chain or separate owner actor cannot be verified.',code:'OWNER_RECONCILIATION_HOLD'},409);
 }
 const outstandingOwnerId=positive(b?.outstanding_owner_id);
 if(outstandingMode){
  const ids=[sourceId,followupId,reconcileAuditId,outstandingOwnerId];
  if(eventKind!=='aftercare_followup'||ids.some(x=>!x)||new Set(ids).size!==4||!/^[a-zA-Z0-9 _.-]{8,120}$/.test(caseRef))return reply({ok:false,error:'Four distinct original evidence receipts and exact case required.'},400);
  const records=rows(await a.db.prepare('SELECT evidence_id,event_kind,review_note,actor_user_id FROM maker_order_fulfillment_evidence WHERE order_id=? AND evidence_id IN (?,?,?,?)').bind(orderId,...ids).all().catch(()=>({results:[]})));
  const [source,followup,audit,owner]=ids.map(n=>records.find(r=>positive(r.evidence_id)===n));
  const has=(r,s)=>String(r?.review_note||'').includes(s);
  if(!source||!followup||!audit||!owner||!['damage_hold','return_hold','repair_followup'].includes(source.event_kind)
   ||[followup,audit,owner].some(r=>r.event_kind!=='aftercare_followup')
   ||!has(source,`Trial II case ref=${caseRef};`)||!has(followup,`source hold #${sourceId};`)||!has(followup,`case=${caseRef};`)
   ||!has(audit,`Build 477 independent audit; source hold #${sourceId}; follow-up #${followupId}; case=${caseRef};`)
   ||!has(owner,`Build 478 owner reconciliation; audit #${reconcileAuditId}; source hold #${sourceId}; follow-up #${followupId}; case=${caseRef};`)
   ||!positive(owner.actor_user_id)||positive(owner.actor_user_id)===actor
   ||!reviewNote.includes(`Build 479 outstanding review; owner #${outstandingOwnerId}; audit #${reconcileAuditId}; source hold #${sourceId}; follow-up #${followupId}; case=${caseRef};`)
   ||!/; evidence=[a-zA-Z0-9 _.-]{8,120}; state=(evidence_still_missing|awaiting_owner_action|awaiting_external_decision|reassessment_complete_case_open); case remains open, no external action\.$/.test(reviewNote))
   return reply({ok:false,error:'HOLD: original owner reconciliation or independent follow-up evidence failed server validation.',code:'OUTSTANDING_CASE_SOURCE_HOLD'},409);
 }
 // Preserve pre-477 request digests exactly, so historical idempotent retries still replay.
 const payload={orderId,eventKind,reviewNote,packageInstructions,carrier,trackingReference,receiptReference};
 if(auditMode)Object.assign(payload,{auditMode:true,sourceId,followupId,caseRef});
 if(reconciliationMode)Object.assign(payload,{reconciliationMode:true,sourceId,followupId,reconcileAuditId,caseRef});
 if(outstandingMode)Object.assign(payload,{outstandingMode:true,sourceId,followupId,reconcileAuditId,outstandingOwnerId,caseRef});
 const hash=await digest(payload);
 const previous=await a.db.prepare('SELECT evidence_id,actor_user_id,payload_sha256 FROM maker_order_fulfillment_evidence WHERE request_key=?').bind(key).first();
 if(previous)return previous.actor_user_id===actor&&previous.payload_sha256===hash?reply({ok:true,replayed:true,receipt_id:previous.evidence_id,policy}):reply({ok:false,error:'Request key conflict.'},409);
 if(auditMode){
  const prior=await a.db.prepare("SELECT evidence_id FROM maker_order_fulfillment_evidence WHERE order_id=? AND event_kind='aftercare_followup' AND review_note LIKE ? LIMIT 1").bind(orderId,`%Build 477 independent audit; source hold #${sourceId}; follow-up #${followupId};%`).first();
  if(prior)return reply({ok:false,error:'HOLD: independent audit already exists for this evidence pair.',code:'AUDIT_ALREADY_RECORDED'},409);
 }
 if(reconciliationMode){
  const prior=await a.db.prepare("SELECT evidence_id FROM maker_order_fulfillment_evidence WHERE order_id=? AND event_kind='aftercare_followup' AND review_note LIKE ? LIMIT 1").bind(orderId,`%Build 478 owner reconciliation; audit #${reconcileAuditId}; source hold #${sourceId}; follow-up #${followupId};%`).first();
  if(prior)return reply({ok:false,error:'HOLD: audit already has an owner reconciliation receipt.',code:'OWNER_RECONCILIATION_ALREADY_RECORDED'},409);
 }
 if(outstandingMode){
  const prior=await a.db.prepare("SELECT evidence_id FROM maker_order_fulfillment_evidence WHERE order_id=? AND event_kind='aftercare_followup' AND review_note LIKE ? LIMIT 1").bind(orderId,`%Build 479 outstanding review; owner #${outstandingOwnerId}; audit #${reconcileAuditId};%`).first();
  if(prior)return reply({ok:false,error:'HOLD: owner reconciliation already has an outstanding-case follow-up.',code:'OUTSTANDING_FOLLOWUP_ALREADY_RECORDED'},409);
 }
 try{
  const run=await a.db.prepare('INSERT INTO maker_order_fulfillment_evidence(order_id,event_kind,package_instructions,carrier,tracking_reference,receipt_reference,review_note,actor_user_id,request_key,payload_sha256) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(orderId,eventKind,packageInstructions,carrier,trackingReference,receiptReference,reviewNote,actor,key,hash).run();
  const receiptId=Number(run.meta?.last_row_id||0);
  await auditAdminAction(ctx.env,ctx.request,a.admin,{action_type:'build454_'+eventKind,target_type:'maker_order_fulfillment_evidence',target_id:receiptId,details:{order_id:orderId,private:true,external_actions:false}});
  return reply({ok:true,receipt_id:receiptId,review:await view(a.db,orderId),policy});
 }catch(e){
  const repeat=await a.db.prepare('SELECT evidence_id,actor_user_id,payload_sha256 FROM maker_order_fulfillment_evidence WHERE request_key=?').bind(key).first().catch(()=>null);
  if(repeat&&repeat.actor_user_id===actor&&repeat.payload_sha256===hash)return reply({ok:true,replayed:true,receipt_id:repeat.evidence_id,policy});
  console.error('BUILD454_WRITE',e?.name);return reply({ok:false,error:'HOLD: order eligibility or fulfillment evidence could not be verified. Nothing was booked or sent.',code:'SOURCE_HOLD'},409);
 }
}
