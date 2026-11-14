// Build 702. Server-owned D1 audit; Cloudflare R2 HEAD proof is supplied
// only by the authenticated same-owner original camera endpoint.
import {jsonResponse} from '../_lib/adminAudit.js';

const out=(value,status=200)=>jsonResponse({build:702,...value},status,{'Cache-Control':'private, no-store'});
const parse=x=>{try{return JSON.parse(String(x||''))}catch{return null}};
const goodId=n=>Number.isSafeInteger(Number(n))&&Number(n)>0;
const noteOK=x=>typeof x==='string'&&x.trim().length>=25&&x.trim().length<=600;
const nonceOK=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{16,100}$/.test(x);
const isoTime=t=>Date.parse(String(t||'').replace(/^([0-9]{4}-[0-9]{2}-[0-9]{2}) ([0-9]{2}:[0-9]{2}:[0-9]{2})$/,'$1T$2Z'));
const tuple=m=>[m.kind,m.attachment_id,m.r2_key,m.r2_bytes,m.confirmed,m.publication_status];
export const sameMedia702=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&
 JSON.stringify(a.map(tuple))===JSON.stringify(b.map(tuple));
export function reattestationReady702(original,live,flags,note,client,ready701){
 return original?.build===701&&original.owner_reported_real_phone===true&&
 original.independent_device_witness_verified===false&&
 live?.bounded_rows===true&&sameMedia702(original.media_snapshot,live.media)&&
 ready701(live,flags,note,client);
}
export function canCloseMedia702(open,media,reattest,live,now=Date.now()){
 if(open?.kind!=='linked'||!goodId(open.attachment_id)||!open.r2_key||
 !media?.confirmed||media.kind!==open.media_kind||
 Number(media.attachment_id)!==Number(open.attachment_id)||
 media.r2_key!==open.r2_key||Number(media.r2_bytes)<=0||
 (media.kind==='video'&&media.publication_status!=='internal_review'))return false;
 const observed=isoTime(reattest?.issued_at);
 return !!reattest?.owner_re_attested&&
 reattest?.original_701_receipt_id===open.original_701_receipt_id&&
 sameMedia702(reattest.media_snapshot,live?.media)&&
 Number.isFinite(observed)&&observed<=now+300000&&now-observed>=-300000&&now-observed<=86400000;
}
// Build 703: age from durable D1-created timestamp, not client clock.
export function ageMedia703(open,now=Date.now()){
 const timestamp=isoTime(open?.opened_at);
 const valid=Number.isFinite(timestamp)&&timestamp<=now+300000&&now-timestamp>=-300000;
 const ageMinutes=valid?Math.max(0,Math.floor((now-timestamp)/60000)):null;
 return {receipt_id:open?.receipt_id||null,age_minutes:ageMinutes,
   age_hours:ageMinutes===null?null:Math.floor(ageMinutes/60),
   escalation_due:!open?.closed&&valid&&ageMinutes>=1440,
   status:open?.closed?'CLOSED_LINKED_RECOVERY_ONLY':
     !valid?'HOLD_INVALID_SOURCE_TIMESTAMP':
     ageMinutes>=2880?'CRITICAL_ORIGINAL_MEDIA_EXCEPTION_AGED_48H':
     ageMinutes>=1440?'ESCALATE_ORIGINAL_MEDIA_EXCEPTION_24H':
     'OPEN_ORIGINAL_MEDIA_EXCEPTION_HOLD'};
}
export function mediaEscalationEligible703(caseInfo,aged,existing){
 return !!caseInfo&&!caseInfo.closed&&!!aged?.escalation_due&&
   Number.isSafeInteger(Number(caseInfo.receipt_id))&&Number(caseInfo.receipt_id)>0&&
   !existing.some(x=>Number(x.data?.open_receipt_id)===Number(caseInfo.receipt_id));
}

export function ownerFollowupEligible704(caseInfo,escalation,prior,now=Date.now()){
 if(!caseInfo||caseInfo.closed||!escalation||
   Number(escalation.data?.open_receipt_id)!==Number(caseInfo.receipt_id)||
   !Number.isSafeInteger(Number(escalation.admin_action_audit_id))||
   Number(escalation.admin_action_audit_id)<=Number(caseInfo.receipt_id)||
   Array.isArray(prior)&&prior.some(x=>
     Number(x.data?.escalation_receipt_id)===Number(escalation.admin_action_audit_id)))return false;
 const original=ageMedia703(caseInfo,now);
 const escalated=isoTime(escalation.created_at);
 return original.escalation_due&&Number.isFinite(escalated)&&
   escalated<=now+300000&&now-escalated>=-300000;
}

// Build 705: recording recovery evidence is not the same as closing the case.
export function canReconcileLinked705(open,followup,latest,media,live,now=Date.now()){
 const started=isoTime(followup?.created_at),attested=isoTime(latest?.data?.issued_at);
 return open?.kind==='linked'&&!open.closed&&
   !!followup?.data&&Number(followup.data.open_receipt_id)===Number(open.receipt_id)&&
   Number(followup.data.escalation_receipt_id)>Number(open.receipt_id)&&
   Number(followup.admin_action_audit_id)>Number(followup.data.escalation_receipt_id)&&
   Number.isFinite(started)&&started<=now+300000&&
   Number.isFinite(attested)&&attested>=started&&
   canCloseMedia702(open,media,latest?.data,live,now);
}
// Build 706 accepts owner-linked recovery only AFTER independent R2 HEAD,
// protected Build 705 recovery receipt and explicit Build 702 linked case close.
// An original unrecorded upload cannot satisfy this source-bound sign-off.
export function canOwnerSignoff706(open,recovery,closure,latest,media,live,now=Date.now()){
 const recoveredAt=isoTime(recovery?.created_at),closedAt=isoTime(closure?.created_at);
 return open?.kind==='linked'&&open.closed===true&&
  Number.isSafeInteger(Number(open.receipt_id))&&Number(open.receipt_id)>0&&
  !!recovery?.data&&Number(recovery.data.open_receipt_id)===Number(open.receipt_id)&&
  recovery.data.recovery_kind==='LINKED_D1_ATTACHMENT_R2_HEAD_VERIFIED_ONLY'&&
  Number(recovery.data.followup_receipt_id)>Number(open.receipt_id)&&
  Number(recovery.admin_action_audit_id)>Number(recovery.data.followup_receipt_id)&&
  !!closure?.data&&Number(closure.data.open_receipt_id)===Number(open.receipt_id)&&
  closure.data.status==='CLOSED_VERIFIED_LINKED_R2_ATTACHMENT_ONLY'&&
  Number(closure.admin_action_audit_id)>Number(recovery.admin_action_audit_id)&&
  Number(closure.data.reattest_receipt_id)>=Number(recovery.data.original_reattest_receipt_id)&&
  Number.isFinite(recoveredAt)&&Number.isFinite(closedAt)&&closedAt>=recoveredAt&&
  closedAt<=now+300000&&
  media?.confirmed===true&&
  Number(media.r2_bytes)>0&&Number(media.r2_bytes)===Number(recovery.data.r2_bytes)&&
  Number(media.r2_bytes)===Number(closure.data.verified_r2_bytes)&&
  media.r2_key===open.r2_key&&
  recovery.data.r2_key===open.r2_key&&closure.data.r2_key===open.r2_key&&
  media.kind===open.media_kind&&recovery.data.media_kind===open.media_kind&&
  closure.data.media_kind===open.media_kind&&
  Number(media.attachment_id)===Number(open.attachment_id)&&
  Number(recovery.data.attachment_id)===Number(open.attachment_id)&&
  Number(closure.data.attachment_id)===Number(open.attachment_id)&&
  canCloseMedia702(open,media,latest?.data,live,now);
}

 // Build 707: independent on-demand D1/R2 HEAD comparison to an original owner
 // sign-off. This is not continuous monitoring or an independent phone witness.
 export function auditSignoffDrift707(open,recovery,closure,signoff,latest,media,live,now=Date.now()){
  const d=signoff?.data||{},signedAt=isoTime(signoff?.created_at),
   closedAt=isoTime(closure?.created_at);
  const pinned=open?.kind==='linked'&&open.closed===true&&
   Number.isSafeInteger(Number(signoff?.admin_action_audit_id))&&
   Number(signoff.admin_action_audit_id)>Number(closure?.admin_action_audit_id)&&
   Number(d.open_receipt_id)===Number(open.receipt_id)&&
   Number(d.recovery_receipt_id)===Number(recovery?.admin_action_audit_id)&&
   Number(d.closure_receipt_id)===Number(closure?.admin_action_audit_id)&&
   d.owner_signoff_decision==='accept_verified_linked_recovery_only'&&
   d.original_issue_closed_by_explicit_owner_action===true&&
   d.physical_device_independently_witnessed===false&&
   d.unrecorded_upload_recovery_certified===false&&
   d.financial_closed===false&&
   d.media_kind===open.media_kind&&d.r2_key===open.r2_key&&
   Number(d.attachment_id)===Number(open.attachment_id)&&
   Number(d.verified_r2_bytes)>0&&
   Number.isFinite(signedAt)&&Number.isFinite(closedAt)&&
   signedAt>=closedAt&&signedAt<=now+300000;
  if(!pinned)return {status:'HOLD_707_SIGNOFF_CUSTODY_MISMATCH',stable:false};
  if(!media||media.confirmed!==true||media.r2_key!==d.r2_key||
   Number(media.r2_bytes)!==Number(d.verified_r2_bytes)||
   media.kind!==d.media_kind||Number(media.attachment_id)!==Number(d.attachment_id)||
   !live?.media?.some(m=>m===media))
    return {status:'HOLD_707_SIGNED_MEDIA_D1_R2_DRIFT',stable:false};
  if(!canOwnerSignoff706(open,recovery,closure,latest,media,live,now))
   return {status:'HOLD_707_FRESH_OWNER_REATTESTATION_OR_SOURCE_REQUIRED',stable:false};
  return {status:'SIGNED_LINKED_MEDIA_SOURCE_STABLE_ON_DEMAND_707',stable:true};
 }


// Build 708: a drift exception exists only when a signed original linked
// attachment mismatches the current actual server-side D1/R2 HEAD readback.
export function canOpenSignedDrift708(open,signoff,audit){
 return open?.kind==='linked'&&open.closed===true&&
  Number.isSafeInteger(Number(signoff?.admin_action_audit_id))&&
  Number(signoff.admin_action_audit_id)>0&&
  audit?.stable===false&&audit.status==='HOLD_707_SIGNED_MEDIA_D1_R2_DRIFT';
}
export function canReconcileSignedDrift708(drift,signoff,latest,audit,now=Date.now()){
 const d=drift?.data||{},observed=isoTime(drift?.created_at),
  attested=isoTime(latest?.data?.issued_at);
 return d.build===708&&d.drift_observed_status==='HOLD_707_SIGNED_MEDIA_D1_R2_DRIFT'&&
  Number.isSafeInteger(Number(drift?.admin_action_audit_id))&&
  Number(drift.admin_action_audit_id)>Number(signoff?.admin_action_audit_id)&&
  Number(d.original_signoff_receipt_id)===Number(signoff.admin_action_audit_id)&&
  d.original_signed_r2_key===signoff.data?.r2_key&&
  Number(d.original_signed_r2_bytes)===Number(signoff.data?.verified_r2_bytes)&&
  Number.isSafeInteger(Number(latest?.admin_action_audit_id))&&
  Number(latest.admin_action_audit_id)>Number(drift.admin_action_audit_id)&&
  Number.isFinite(observed)&&Number.isFinite(attested)&&
  attested>=observed&&attested<=now+300000&&
  latest.data?.owner_re_attested===true&&
  audit?.stable===true&&audit.status==='SIGNED_LINKED_MEDIA_SOURCE_STABLE_ON_DEMAND_707';
}


// Build 709 is ON-DEMAND, not a continuous watcher. A recurrence requires a
// *previously recovered* Build 708 original signed-media exception and a new
// actual D1/R2 HEAD mismatch. No history or timestamp alone proves drift.
export function canOpenMediaRecurrence709(recovered,signoff,audit){
 const d=recovered?.data||{};
 return d.build===708&&
  d.status==='SOURCE_MATCHED_DRIFT_RECOVERY_REVALIDATED_UNRECORDED_HOLD_708'&&
  Number.isSafeInteger(Number(recovered?.admin_action_audit_id))&&
  Number(recovered.admin_action_audit_id)>Number(d.drift_receipt_id)&&
  Number(d.original_signoff_receipt_id)===Number(signoff?.admin_action_audit_id)&&
  d.original_signed_r2_key===signoff?.data?.r2_key&&
  Number(d.verified_current_r2_bytes)===Number(signoff?.data?.verified_r2_bytes)&&
  audit?.status==='HOLD_707_SIGNED_MEDIA_D1_R2_DRIFT'&&audit.stable===false;
}
export function mediaRecurrenceAge709(recurrence,now=Date.now()){
 const at=isoTime(recurrence?.created_at);
 if(!Number.isFinite(at)||at>now+300000)return {hours:null,
  status:'HOLD_709_INVALID_OR_FUTURE_RECURRING_RECEIPT',escalation_due:false};
 const hours=Math.max(0,Math.floor((now-at)/3600000));
 return {hours,status:hours>=48?'CRITICAL_SIGNED_MEDIA_RECURRENCE_AGED_48H_709':
  hours>=24?'SIGNED_MEDIA_RECURRENCE_ESCALATION_DUE_24H_709':
  'SIGNED_MEDIA_RECURRENCE_OPEN_UNDER_24H_709',
  escalation_due:hours>=24};
}
export function canEscalateMediaRecurrence709(recurrence,signoff,audit,now=Date.now()){
 const d=recurrence?.data||{};
 return d.build===709&&
  d.recurrence_observed_status==='HOLD_707_SIGNED_MEDIA_D1_R2_DRIFT'&&
  Number(d.original_signoff_receipt_id)===Number(signoff?.admin_action_audit_id)&&
  Number.isSafeInteger(Number(recurrence?.admin_action_audit_id))&&
  Number(recurrence.admin_action_audit_id)>Number(d.recovered_708_receipt_id)&&
  mediaRecurrenceAge709(recurrence,now).escalation_due===true&&
  audit?.status==='HOLD_707_SIGNED_MEDIA_D1_R2_DRIFT'&&audit.stable===false;
}


// Build 710 requires the original Build 709 recurrence, its original 708
// recovery, later owner re-attestation, and independently re-read original R2.
// A receipt is resolution *evidence*, not a physical-phone or all-media close.
export function canResolveOriginalRecurrence710(recurrence,recovered,signoff,latest,audit,now=Date.now()){
 const d=recurrence?.data||{},resolutionAt=isoTime(latest?.data?.issued_at),
  recurrenceAt=isoTime(recurrence?.created_at);
 return d.build===709&&
  d.recurrence_observed_status==='HOLD_707_SIGNED_MEDIA_D1_R2_DRIFT'&&
  d.status==='RECURRENT_SIGNED_ORIGINAL_MEDIA_DRIFT_OPEN_OWNER_HOLD_709'&&
  Number.isSafeInteger(Number(recurrence?.admin_action_audit_id))&&
  Number(recurrence.admin_action_audit_id)>Number(recovered?.admin_action_audit_id)&&
  Number(d.recovered_708_receipt_id)===Number(recovered.admin_action_audit_id)&&
  Number(d.original_signoff_receipt_id)===Number(signoff?.admin_action_audit_id)&&
  d.original_signed_r2_key===signoff?.data?.r2_key&&
  Number(d.original_signed_r2_bytes)===Number(signoff?.data?.verified_r2_bytes)&&
  Number.isSafeInteger(Number(latest?.admin_action_audit_id))&&
  Number(latest.admin_action_audit_id)>Number(recurrence.admin_action_audit_id)&&
  latest.data?.owner_re_attested===true&&
  Number.isFinite(resolutionAt)&&Number.isFinite(recurrenceAt)&&
  resolutionAt>=recurrenceAt&&resolutionAt<=now+300000&&
  audit?.stable===true&&audit.status==='SIGNED_LINKED_MEDIA_SOURCE_STABLE_ON_DEMAND_707';
}
export function recurrenceResolutionReadback710(resolution,recurrence,signoff,audit){
 const d=resolution?.data||{};
 return d.build===710&&recurrence?.data?.build===709&&
  d.owner_resolution_decision==='accept_original_signed_source_only'&&
  d.physical_phone_independently_witnessed===false&&
  d.unrecorded_uploads_closed===false&&d.automatic_publication===false&&
  Number.isSafeInteger(Number(resolution?.admin_action_audit_id))&&
  Number(resolution.admin_action_audit_id)>Number(recurrence?.admin_action_audit_id)&&
  Number(d.recurrence_receipt_id)===Number(recurrence.admin_action_audit_id)&&
  Number(d.original_signoff_receipt_id)===Number(signoff?.admin_action_audit_id)&&
  d.original_signed_r2_key===signoff?.data?.r2_key&&
  d.original_signed_r2_key===recurrence?.data?.original_signed_r2_key&&
  Number(d.original_signed_r2_bytes)===Number(signoff?.data?.verified_r2_bytes)&&
  Number(d.original_signed_r2_bytes)===Number(recurrence?.data?.original_signed_r2_bytes)&&
  d.restored_source_status==='SIGNED_LINKED_MEDIA_SOURCE_STABLE_ON_DEMAND_707'&&
  audit?.stable===true;
}


// Build 711: never claim continuous monitoring. A fresh, original source
// inspection is needed after at least one day of Build 710 recovery stability.
export function postResolutionStabilityAge711(resolution,now=Date.now()){
 const at=isoTime(resolution?.created_at);
 if(!Number.isFinite(at)||at>now+300000)return {age_hours:null,due:false,status:'HOLD_711_INVALID_RESOLUTION_TIMESTAMP'};
 const age_hours=Math.max(0,Math.floor((now-at)/3600000));
 return {age_hours,due:age_hours>=24,status:age_hours>=48?
  'ORIGINAL_RESOLUTION_STABILITY_RECHECK_AGED_48H_711':
  age_hours>=24?'ORIGINAL_RESOLUTION_STABILITY_RECHECK_DUE_24H_711':
  'ORIGINAL_RESOLUTION_STABILITY_RECHECK_NOT_YET_DUE_711'};
}
export function canRecordPostResolutionStability711(resolution,recurrence,signoff,latest,audit,now=Date.now()){
 const d=resolution?.data||{};
 return postResolutionStabilityAge711(resolution,now).due===true&&
  recurrenceResolutionReadback710(resolution,recurrence,signoff,audit)&&
  Number.isSafeInteger(Number(latest?.admin_action_audit_id))&&
  Number(latest.admin_action_audit_id)>Number(resolution.admin_action_audit_id)&&
  latest.data?.owner_re_attested===true&&
  Number.isFinite(isoTime(latest?.data?.issued_at))&&
  isoTime(latest.data.issued_at)>=isoTime(resolution.created_at)&&
  isoTime(latest.data.issued_at)<=now+300000&&
  d.server_side_r2_head_rechecked===true;
}
export function stabilityReceiptReadback711(receipt,resolution,recurrence,signoff,audit){
 const d=receipt?.data||{};
 return d.build===711&&d.original_inspection_type==='signed_media_post_resolution_stability'&&
  Number.isSafeInteger(Number(receipt?.admin_action_audit_id))&&
  Number(receipt.admin_action_audit_id)>Number(resolution?.admin_action_audit_id)&&
  Number(d.original_710_resolution_receipt_id)===Number(resolution?.admin_action_audit_id)&&
  Number(d.original_709_recurrence_receipt_id)===Number(recurrence?.admin_action_audit_id)&&
  Number(d.original_signoff_receipt_id)===Number(signoff?.admin_action_audit_id)&&
  d.original_signed_r2_key===signoff?.data?.r2_key&&
  Number(d.original_signed_r2_bytes)===Number(signoff?.data?.verified_r2_bytes)&&
  d.current_source_status==='SIGNED_LINKED_MEDIA_SOURCE_STABLE_ON_DEMAND_707'&&
  d.independent_physical_phone_witnessed===false&&
  d.unrecorded_uploads_closed===false&&d.automatic_publication===false&&
  audit?.stable===true&&audit?.status===d.current_source_status;
}

// Build 712: a multi-horizon on-demand source audit after original Build
// 711 stability. This never installs continuous monitoring or a new witness.
export function signedMediaHorizonAge712(stability,now=Date.now()){
 const at=isoTime(stability?.created_at);
 if(!Number.isFinite(at)||at>now+300000)return {age_hours:null,due:false,
  status:'HOLD_712_ORIGINAL_STABILITY_TIMESTAMP_INVALID'};
 const age_hours=Math.max(0,Math.floor((now-at)/3600000));
 return {age_hours,due:age_hours>=24,status:age_hours>=72?
  'ORIGINAL_SIGNED_MEDIA_HORIZON_72H_RECHECK_DUE_712':
  age_hours>=48?'ORIGINAL_SIGNED_MEDIA_HORIZON_48H_RECHECK_DUE_712':
  age_hours>=24?'ORIGINAL_SIGNED_MEDIA_HORIZON_24H_RECHECK_DUE_712':
  'ORIGINAL_SIGNED_MEDIA_HORIZON_UNDER_24H_712'};
}
export function canReviewSignedMediaHorizon712(stability,resolution,recurrence,signoff,latest,audit,now=Date.now()){
 const horizon=signedMediaHorizonAge712(stability,now);
 const time=isoTime(latest?.data?.issued_at),stabilityTime=isoTime(stability?.created_at);
 return horizon.due===true&&
  stabilityReceiptReadback711(stability,resolution,recurrence,signoff,audit)&&
  recurrenceResolutionReadback710(resolution,recurrence,signoff,audit)&&
  Number.isSafeInteger(Number(latest?.admin_action_audit_id))&&
  Number(latest.admin_action_audit_id)>Number(stability?.admin_action_audit_id)&&
  latest?.data?.owner_re_attested===true&&Number.isFinite(time)&&
  Number.isFinite(stabilityTime)&&time>=stabilityTime&&time<=now+300000&&
  stability?.data?.server_side_r2_head_confirmed===true;
}
export function signedMediaHorizonReadback712(row,stability,resolution,recurrence,signoff,audit){
 const d=row?.data||{};
 return d.build===712&&d.source_recheck==='independent_server_d1_r2_head_on_demand'&&
  Number.isSafeInteger(Number(row?.admin_action_audit_id))&&
  Number(row.admin_action_audit_id)>Number(stability?.admin_action_audit_id)&&
  Number(d.original_711_stability_receipt_id)===Number(stability?.admin_action_audit_id)&&
  Number(d.original_710_resolution_receipt_id)===Number(resolution?.admin_action_audit_id)&&
  Number(d.original_709_recurrence_receipt_id)===Number(recurrence?.admin_action_audit_id)&&
  Number(d.original_706_signoff_receipt_id)===Number(signoff?.admin_action_audit_id)&&
  d.original_signed_r2_key===signoff?.data?.r2_key&&
  Number(d.original_signed_r2_bytes)===Number(signoff?.data?.verified_r2_bytes)&&
  d.observed_current_r2_key===signoff?.data?.r2_key&&
  Number(d.observed_current_r2_bytes)===Number(signoff?.data?.verified_r2_bytes)&&
  Number.isSafeInteger(Number(d.observed_stability_horizon_hours))&&
  Number(d.observed_stability_horizon_hours)>=24&&
  ['ORIGINAL_SIGNED_MEDIA_HORIZON_24H_RECHECK_DUE_712',
   'ORIGINAL_SIGNED_MEDIA_HORIZON_48H_RECHECK_DUE_712',
   'ORIGINAL_SIGNED_MEDIA_HORIZON_72H_RECHECK_DUE_712'].includes(d.observed_horizon_status)&&
  d.rechecked_source_status==='SIGNED_LINKED_MEDIA_SOURCE_STABLE_ON_DEMAND_707'&&
  d.automatic_media_repair===false&&d.continuous_monitoring_enabled===false&&
  d.independent_physical_phone_witness===false&&d.unrecorded_uploads_closed===false&&
  d.publication_performed===false&&audit?.stable===true&&
  audit?.status===d.rechecked_source_status;
}
export async function handleCamera702({db,form,adminUser,id,token,live,ready701}){
 const action=String(form.get('action')||'');
 const auditRows=await db.prepare(
 "SELECT admin_action_audit_id,action_type,created_at,details_json FROM admin_action_audit "+
 "WHERE target_type='product' AND target_id=? AND actor_user_id=? "+
 "AND action_type IN ('camera701_owner_field_receipt','camera702_owner_reattest','camera702_media_issue_open','camera702_media_issue_close','camera703_media_aging_escalation','camera704_media_owner_followup','camera705_media_recovery_reconciled','camera706_owner_linked_recovery_signoff','camera708_signed_media_drift_open','camera708_signed_media_drift_recovered','camera709_signed_media_recurrence_open','camera709_signed_media_recurrence_escalation','camera710_signed_media_recurrence_resolved','camera711_post_resolution_stability_receipt','camera712_media_stability_horizon_review') "+
 "ORDER BY admin_action_audit_id DESC LIMIT 181").bind(id,adminUser.user_id).all();
 const raw=Array.isArray(auditRows?.results)?auditRows.results:[];
 if(raw.length>180)return out({ok:false,error:'Unbounded original device receipt history; independent review required. HOLD.'},409);
 const history=raw.map(row=>({...row,data:parse(row.details_json)}));
 const accepted=history.find(row=>row.action_type==='camera701_owner_field_receipt'&&
  row.data?.build===701&&row.data.product_id===id&&
  row.data.capture_reference===token&&row.data.actor_user_id===Number(adminUser.user_id)&&
  row.data.owner_reported_real_phone===true);
 const original=accepted?.data,originalId=Number(accepted?.admin_action_audit_id||0);
 const reattestations=history.filter(x=>x.action_type==='camera702_owner_reattest'&&
   x.data?.original_701_receipt_id===originalId);
 const latest=reattestations[0]||null;
 const closeRows=history.filter(x=>x.action_type==='camera702_media_issue_close');
 const closed=new Set(closeRows
   .map(x=>Number(x.data?.open_receipt_id||0)));
 const cases=history.filter(x=>x.action_type==='camera702_media_issue_open'&&
   x.data?.original_701_receipt_id===originalId)
   .map(x=>({receipt_id:Number(x.admin_action_audit_id),kind:x.data.kind,
    media_kind:x.data.media_kind,attachment_id:x.data.attachment_id,
    r2_key:x.data.r2_key,opened_at:x.created_at,
    closed:closed.has(Number(x.admin_action_audit_id))}));
 const escalationRecords=history.filter(x=>x.action_type==='camera703_media_aging_escalation'&&
   x.data?.original_701_receipt_id===originalId);
 const followupRows=history.filter(x=>x.action_type==='camera704_media_owner_followup'&&
   x.data?.original_701_receipt_id===originalId);
 const recoveryRows=history.filter(x=>x.action_type==='camera705_media_recovery_reconciled'&&
   x.data?.original_701_receipt_id===originalId);
 const signoffs=history.filter(x=>x.action_type==='camera706_owner_linked_recovery_signoff'&&
   x.data?.original_701_receipt_id===originalId);
 const driftRows=history.filter(x=>x.action_type==='camera708_signed_media_drift_open'&&
    x.data?.original_701_receipt_id===originalId);
 const driftRecoveryRows=history.filter(x=>x.action_type==='camera708_signed_media_drift_recovered'&&
    x.data?.original_701_receipt_id===originalId);
 const recurrenceRows=history.filter(x=>x.action_type==='camera709_signed_media_recurrence_open'&&
    x.data?.original_701_receipt_id===originalId);
 const recurrenceEscalationRows=history.filter(x=>x.action_type==='camera709_signed_media_recurrence_escalation'&&
    x.data?.original_701_receipt_id===originalId);
 const recurrenceResolutionRows=history.filter(x=>
    x.action_type==='camera710_signed_media_recurrence_resolved'&&
    x.data?.original_701_receipt_id===originalId);
 const postResolutionRows=history.filter(x=>x.action_type==='camera711_post_resolution_stability_receipt'&&
   x.data?.original_701_receipt_id===originalId);
 const horizonRows=history.filter(y=>y.action_type==='camera712_media_stability_horizon_review'&&
  y.data?.original_701_receipt_id===originalId);
 const aging=cases.map(x=>{
   const esc=escalationRecords.find(e=>Number(e.data?.open_receipt_id)===x.receipt_id);
   const followup=followupRows.find(y=>Number(y.data?.open_receipt_id)===x.receipt_id&&
     Number(y.data?.escalation_receipt_id)===Number(esc?.admin_action_audit_id));
   const recovery=recoveryRows.find(y=>Number(y.data?.open_receipt_id)===x.receipt_id&&
     Number(y.data?.followup_receipt_id)===Number(followup?.admin_action_audit_id));
   const closure=closeRows.find(y=>Number(y.data?.open_receipt_id)===x.receipt_id);
   const signoff=signoffs.find(y=>Number(y.data?.open_receipt_id)===x.receipt_id&&
     Number(y.data?.recovery_receipt_id)===Number(recovery?.admin_action_audit_id)&&
     Number(y.data?.closure_receipt_id)===Number(closure?.admin_action_audit_id));
   const current=live?.media?.find(m=>m.kind===x.media_kind&&
     Number(m.attachment_id)===Number(x.attachment_id));
   const drift707=signoff?auditSignoffDrift707({...x,original_701_receipt_id:originalId},recovery,closure,signoff,latest,current,live):null;
   const originalDrift=driftRows.find(y=>Number(y.data?.open_receipt_id)===x.receipt_id&&
     Number(y.data?.original_signoff_receipt_id)===Number(signoff?.admin_action_audit_id));
   const driftRecovery=driftRecoveryRows.find(y=>Number(y.data?.drift_receipt_id)===Number(originalDrift?.admin_action_audit_id)&&
     Number(y.data?.original_signoff_receipt_id)===Number(signoff?.admin_action_audit_id));
   const recoveryReady=!!originalDrift&&!driftRecovery&&
     canReconcileSignedDrift708(originalDrift,signoff,latest,drift707);
   const recurrence=recurrenceRows.find(y=>Number(y.data?.open_receipt_id)===x.receipt_id&&
     Number(y.data?.recovered_708_receipt_id)===Number(driftRecovery?.admin_action_audit_id)&&
     Number(y.data?.original_signoff_receipt_id)===Number(signoff?.admin_action_audit_id));
   const recurrenceEscalation=recurrenceEscalationRows.find(y=>
     Number(y.data?.recurrence_receipt_id)===Number(recurrence?.admin_action_audit_id));
   const recurrenceAge=recurrence?mediaRecurrenceAge709(recurrence):null;
   const resolution=recurrenceResolutionRows.find(y=>
     Number(y.data?.recurrence_receipt_id)===Number(recurrence?.admin_action_audit_id)&&
     Number(y.data?.original_signoff_receipt_id)===Number(signoff?.admin_action_audit_id));
   const resolvedNow=resolution?recurrenceResolutionReadback710(resolution,recurrence,signoff,drift707):false;
   const stability=postResolutionRows.find(y=>Number(y.data?.original_710_resolution_receipt_id)===
     Number(resolution?.admin_action_audit_id));
   const stabilityAge=resolution?postResolutionStabilityAge711(resolution):null;
   const stabilityReady=!!resolution&&!stability&&
     canRecordPostResolutionStability711(resolution,recurrence,signoff,latest,drift707);
   const stabilityValid=!!stability&&stabilityReceiptReadback711(stability,resolution,recurrence,signoff,drift707);
   const horizon=signedMediaHorizonAge712(stability);
   const horizonReceipt=horizonRows.find(y=>Number(y.data?.original_711_stability_receipt_id)===
    Number(stability?.admin_action_audit_id));
   const horizonReady=!!stability&&!horizonReceipt&&
    canReviewSignedMediaHorizon712(stability,resolution,recurrence,signoff,latest,drift707);
   const horizonValid=!!horizonReceipt&&
    signedMediaHorizonReadback712(horizonReceipt,stability,resolution,recurrence,signoff,drift707);
   const resolutionReady=!!recurrence&&!resolution&&
     canResolveOriginalRecurrence710(recurrence,driftRecovery,signoff,latest,drift707);
   return {...ageMedia703(x),escalated:!!esc,
     escalation_receipt_id:Number(esc?.admin_action_audit_id||0),
     followup_receipt_id:Number(followup?.admin_action_audit_id||0),
     followup_disposition:followup?.data?.followup_disposition||null,
     followup_due:ownerFollowupEligible704(x,esc,followupRows),
     recovery_receipt_id:Number(recovery?.admin_action_audit_id||0),
     closure_receipt_id:Number(closure?.admin_action_audit_id||0),
     owner_recovery_signoff_receipt_id:Number(signoff?.admin_action_audit_id||0),
     media_signoff_drift_707:drift707?.status||'NO_ORIGINAL_SIGNOFF_707',
     media_signoff_stable_707:drift707?.stable===true,
     signed_drift_open_ready_708:!originalDrift&&canOpenSignedDrift708(x,signoff,drift707),
     signed_drift_receipt_id_708:Number(originalDrift?.admin_action_audit_id||0),
     signed_drift_recovery_receipt_id_708:Number(driftRecovery?.admin_action_audit_id||0),
     signed_drift_recovery_ready_708:recoveryReady,
     signed_media_recurrence_ready_709:!recurrence&&
       canOpenMediaRecurrence709(driftRecovery,signoff,drift707),
     signed_media_recurrence_receipt_id_709:Number(recurrence?.admin_action_audit_id||0),
     signed_media_recurrence_age_hours_709:recurrenceAge?.hours??null,
     signed_media_resolution_ready_710:resolutionReady,
     signed_media_resolution_receipt_id_710:Number(resolution?.admin_action_audit_id||0),
     signed_media_resolution_valid_now_710:resolvedNow,
     signed_media_post_resolution_age_hours_711:stabilityAge?.age_hours??null,
     signed_media_stability_ready_711:stabilityReady,
     signed_media_stability_receipt_id_711:Number(stability?.admin_action_audit_id||0),
     signed_media_stability_valid_now_711:stabilityValid,
     signed_media_horizon_age_hours_712:horizon.age_hours,
     signed_media_horizon_status_712:!stability?'HOLD_711_ORIGINAL_STABILITY_REQUIRED':
       !horizonReceipt?(horizonReady?'ORIGINAL_SIGNED_MEDIA_HORIZON_RECHECK_READY_712':
        horizon.status):
       horizonValid?'ON_DEMAND_SIGNED_MEDIA_HORIZON_STABLE_712':
        'HOLD_712_SIGNED_MEDIA_DRIFT_AFTER_HORIZON',
     signed_media_horizon_ready_712:horizonReady,
     signed_media_horizon_receipt_id_712:Number(horizonReceipt?.admin_action_audit_id||0),
     signed_media_horizon_valid_now_712:horizonValid,
     signed_media_stability_status_711:!resolution?'HOLD_710_ORIGINAL_SOURCE_RESOLUTION_REQUIRED':
       !stability?(stabilityReady?'ORIGINAL_STABILITY_RECEIPT_READY_FOR_OWNER_711':
         stabilityAge?.status||'HOLD_711_STABILITY_RECHECK'):
       stabilityValid?'ON_DEMAND_ORIGINAL_SIGNED_MEDIA_STABILITY_CONFIRMED_711':
         'HOLD_711_POST_RESOLUTION_SOURCE_DRIFT',
     signed_media_resolution_status_710:!recurrence?'NO_ORIGINAL_RECURRENCE_TO_RESOLVE':
       !resolution?(resolutionReady?'ORIGINAL_SIGNED_MEDIA_RECURRENCE_RESOLUTION_READY_710':
        'HOLD_710_FRESH_ORIGINAL_R2_AND_OWNER_REATTEST_REQUIRED'):
       resolvedNow?'ORIGINAL_SIGNED_MEDIA_RECURRENCE_SOURCE_RESOLVED_ON_DEMAND_710':
        'HOLD_710_RECURRENT_MEDIA_DRIFT_AFTER_RESOLUTION',
     signed_media_recurrence_status_709:!recurrence?
       'NO_ORIGINAL_SIGNED_MEDIA_RECURRENCE_RECORD':
       drift707?.stable?'SOURCE_STABLE_AFTER_RECORDED_RECURRENCE_MONITOR_709':
       recurrenceAge?.status||'HOLD_RECURRENCE_AGE_UNVERIFIED',
     signed_media_recurrence_escalation_due_709:!!recurrence&&!resolution&&!recurrenceEscalation&&
       canEscalateMediaRecurrence709(recurrence,signoff,drift707),
     signed_media_recurrence_escalation_receipt_id_709:Number(recurrenceEscalation?.admin_action_audit_id||0),
     signed_drift_status_708:!signoff?'HOLD_NO_ORIGINAL_SIGNOFF':
       !originalDrift?'NO_RECORDED_DRIFT_EXCEPTION':
       driftRecovery?(drift707?.stable?'SOURCE_RECHECK_RECONCILED_708':'HOLD_RECURRENT_MEDIA_DRIFT_AFTER_RECOVERY_708'):
       recoveryReady?'ORIGINAL_MEDIA_RECOVERY_READY_FOR_OWNER_RECONCILIATION_708':
       'HOLD_SIGNED_MEDIA_DRIFT_NOT_RECOVERED_708',
     owner_recovery_signoff_ready:!signoff&&
       canOwnerSignoff706({...x,original_701_receipt_id:originalId},
         recovery,closure,latest,current,live),
     linked_recovery_reconciliation_ready:!recovery&&
       canReconcileLinked705({...x,original_701_receipt_id:originalId},
         followup,latest,current,live)};
 });
 const state=()=>out({ok:true,status:original?'OWNER_701_SOURCE_FOUND':'HOLD_ORIGINAL_PHONE_701_REQUIRED',
  product_id:id,original_701_receipt_id:originalId,
  reattest_receipt_id:Number(latest?.admin_action_audit_id||0),
  media:live,exceptions:cases.slice(0,50),
  unresolved_count:cases.filter(x=>!x.closed).length,
  exception_aging_703:aging.slice(0,50),
  escalation_due_count:aging.filter(x=>x.escalation_due&&!x.escalated).length,
  critical_aging_count:aging.filter(x=>x.status==='CRITICAL_ORIGINAL_MEDIA_EXCEPTION_AGED_48H').length,
  owner_followup_due_704:aging.filter(x=>x.followup_due).length,
  linked_recovery_ready_705:aging.filter(x=>x.linked_recovery_reconciliation_ready).length,
  reconciled_linked_count_705:aging.filter(x=>x.recovery_receipt_id>0).length,
  owner_recovery_signoff_ready_706:aging.filter(x=>x.owner_recovery_signoff_ready).length,
  owner_recovery_signed_count_706:aging.filter(x=>x.owner_recovery_signoff_receipt_id>0).length,
  stable_signed_media_count_707:aging.filter(x=>x.media_signoff_stable_707).length,
  signed_media_recheck_hold_count_707:aging.filter(x=>x.owner_recovery_signoff_receipt_id>0&&!x.media_signoff_stable_707).length,
  on_demand_d1_r2_head_check_only_707:true,
  signed_drift_open_count_708:aging.filter(x=>x.signed_drift_receipt_id_708>0&&!x.signed_drift_recovery_receipt_id_708).length,
  signed_drift_recovery_ready_708:aging.filter(x=>x.signed_drift_recovery_ready_708).length,
  signed_drift_reconciled_count_708:aging.filter(x=>x.signed_drift_recovery_receipt_id_708>0).length,
  automatic_media_restoration_708:false,independent_physical_witness_708:false,
  signed_media_recurrence_ready_709:aging.filter(x=>x.signed_media_recurrence_ready_709).length,
  signed_media_recurrence_open_count_709:aging.filter(x=>x.signed_media_recurrence_receipt_id_709>0).length,
  signed_media_recurrence_due_709:aging.filter(x=>x.signed_media_recurrence_escalation_due_709).length,
  signed_media_recurrence_escalated_709:aging.filter(x=>x.signed_media_recurrence_escalation_receipt_id_709>0).length,
  on_demand_recurrence_readback_only_709:true,automated_escalation_sent_709:false,
  signed_media_resolution_ready_710:aging.filter(x=>x.signed_media_resolution_ready_710).length,
  signed_media_resolved_count_710:aging.filter(x=>x.signed_media_resolution_receipt_id_710>0).length,
  signed_media_resolution_recheck_hold_710:aging.filter(x=>x.signed_media_resolution_receipt_id_710>0&&!x.signed_media_resolution_valid_now_710).length,
  on_demand_original_media_resolution_only_710:true,unrecorded_media_closed_710:false,
  signed_media_stability_ready_711:aging.filter(x=>x.signed_media_stability_ready_711).length,
  signed_media_stability_recorded_711:aging.filter(x=>x.signed_media_stability_receipt_id_711>0).length,
  signed_media_stability_drift_hold_711:aging.filter(x=>x.signed_media_stability_receipt_id_711>0&&!x.signed_media_stability_valid_now_711).length,
  continuous_media_monitoring_enabled_711:false,automated_media_repair_711:false,
  signed_media_horizon_ready_712:aging.filter(x=>x.signed_media_horizon_ready_712).length,
  signed_media_horizon_recorded_712:aging.filter(x=>x.signed_media_horizon_receipt_id_712>0).length,
  signed_media_horizon_current_drift_hold_712:aging.filter(x=>
    x.signed_media_horizon_receipt_id_712>0&&!x.signed_media_horizon_valid_now_712).length,
  independent_server_d1_r2_readback_on_demand_712:true,
  background_media_horizon_watcher_712:false,
  independently_authenticated_phone:false,
  unrecorded_upload_recovery_certified:false,publication_performed:false});
 if(action==='camera702_inspect'||action==='camera703_inspect'||action==='camera704_inspect'||action==='camera705_inspect'||action==='camera706_inspect'||action==='camera707_inspect'||action==='camera708_inspect'||action==='camera709_inspect'||action==='camera710_inspect'||action==='camera711_inspect'||action==='camera712_inspect')return state();
 if(!original)return out({ok:false,error:'Original owner-reported Build 701 receipt required. HOLD.'},409);
 const note=String(form.get('owner_device_notes')||'').trim();
 const nonce=String(form.get('nonce')||'');
 if(!noteOK(note)||!nonceOK(nonce))
  return out({ok:false,error:'Owner notes (25–600 characters) and a fresh operation nonce are required.'},400);
 const append=async(type,extra,purpose)=>{
   const key='camera702-'+id+'-'+purpose+'-'+nonce;
   const details=JSON.stringify({build:702,product_id:id,capture_reference:token,
     actor_user_id:Number(adminUser.user_id),original_701_receipt_id:originalId,
     issued_at:new Date().toISOString(),owner_review_note:note,
     physical_phone_independently_verified:false,automatic_publication:false,
     unrecorded_uploads_certified:false,...extra});
   const result=await db.prepare(
     "INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_id,target_key,request_method,request_path,details_json,created_at) "+
     "SELECT ?,?,'product',?,?,'POST','/api/admin/mobile-create-product',?,CURRENT_TIMESTAMP "+
     "WHERE NOT EXISTS(SELECT 1 FROM admin_action_audit WHERE actor_user_id=? AND action_type=? AND target_key=?)")
    .bind(adminUser.user_id,type,id,key,details,adminUser.user_id,type,key).run();
   if(!result?.success||Number(result?.meta?.changes)!==1)
    throw Error('Original device evidence nonce duplicated, pending or not committed. Inspect the ledger before retry. HOLD.');
   const saved=await db.prepare(
    'SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE actor_user_id=? AND target_id=? AND action_type=? AND target_key=? LIMIT 2')
    .bind(adminUser.user_id,id,type,key).all();
   const list=saved?.results||[];
   if(list.length!==1||list[0].details_json!==details)
    throw Error('Unique original device evidence did not read back. HOLD.');
   return Number(list[0].admin_action_audit_id);
 };
 if(action==='camera702_reattest'){
   const flags=parse(form.get('owner_checklist_json')),
     snapshot=parse(form.get('media_snapshot_json'));
   if(!reattestationReady702(original,live,flags,note,snapshot,ready701))
    return out({ok:false,error:'Fresh original D1/R2 objects, 701 source and all phone checks must match. Missing links remain HOLD.'},409);
   const receipt=await append('camera702_owner_reattest',{
    owner_re_attested:true,owner_reported_physical_phone:true,
    owner_checklist:flags,media_snapshot:live.media,
    original_media_snapshot:original.media_snapshot,
    source_status:'OWNER_REATTESTED_SAME_DRAFT_LIVE_R2_HEAD_NO_INDEPENDENT_PHONE_WITNESS'},'reattest');
   return out({ok:true,status:'OWNER_REATTESTED_LINKED_MEDIA_ONLY',receipt_id:receipt,
    independently_authenticated_phone:false,publication_performed:false});
 }
 if(action==='camera702_triage_open'){
   const kind=String(form.get('exception_kind')||''),
    mediaKind=String(form.get('media_kind')||''),
    attachment=Number(form.get('attachment_id')||0);
   if(!['linked','unrecorded'].includes(kind)||!['photo','video'].includes(mediaKind))
    return out({ok:false,error:'Choose a linked R2 failure or an explicitly unrecorded photo/video upload.'},400);
   const item=kind==='linked'?live.media?.find(m=>m.kind===mediaKind&&m.attachment_id===attachment):null;
   if(kind==='linked'&&(!item||item.confirmed)||
     kind==='unrecorded'&&attachment!==0)
    return out({ok:false,error:'A linked failure requires a missing exact original R2 object; unrecorded uploads require HOLD.'},409);
   if(cases.some(x=>!x.closed&&x.kind===kind&&x.media_kind===mediaKind&&
      (kind==='unrecorded'||x.attachment_id===attachment)))
    return out({ok:false,error:'An unresolved case already exists for this same draft/media. HOLD.'},409);
   const receipt=await append('camera702_media_issue_open',{
    kind,media_kind:mediaKind,attachment_id:kind==='linked'?attachment:0,
    r2_key:item?.r2_key||null,observed_r2_bytes:item?.r2_bytes||0,
    status:'OPEN_MEDIA_UPLOAD_EXCEPTION_SAME_ORIGINAL_DRAFT',
    unrecorded_upload_declared_by_owner:kind==='unrecorded',
    independently_verified_media_recovered:false},'open');
   return out({ok:true,status:'MEDIA_EXCEPTION_OPEN_HOLD',receipt_id:receipt,
    unrecorded_upload_recovery_certified:false,publication_performed:false});
 }
 if(action==='camera702_triage_close'){
   const openId=Number(form.get('open_receipt_id')),
    caseInfo=cases.find(x=>x.receipt_id===openId&&!x.closed&&x.kind==='linked'),
    current=live.media?.find(x=>x.kind===caseInfo?.media_kind&&
      x.attachment_id===caseInfo?.attachment_id);
   if(!caseInfo||!goodId(latest?.admin_action_audit_id)||
     !canCloseMedia702({...caseInfo,original_701_receipt_id:originalId},
      current,latest.data,live))
    return out({ok:false,error:'Only a linked R2 object restored with current owner re-attestation may close. Unrecorded uploads remain HOLD.'},409);
   const receipt=await append('camera702_media_issue_close',{
    status:'CLOSED_VERIFIED_LINKED_R2_ATTACHMENT_ONLY',open_receipt_id:openId,
    reattest_receipt_id:Number(latest.admin_action_audit_id),
    media_kind:caseInfo.media_kind,attachment_id:caseInfo.attachment_id,
    r2_key:current.r2_key,verified_r2_bytes:current.r2_bytes,
    original_financial_close:false},'close');
   return out({ok:true,status:'CLOSED_VERIFIED_LINKED_R2_ATTACHMENT_ONLY',
    receipt_id:receipt,open_receipt_id:openId,
    unrecorded_upload_recovery_certified:false,publication_performed:false});
 }
 if(action==='camera703_escalate'){
   const openId=Number(form.get('open_receipt_id'));
   const caseInfo=cases.find(x=>x.receipt_id===openId);
   const aged=ageMedia703(caseInfo);
   if(!mediaEscalationEligible703(caseInfo,aged,escalationRecords))
     return out({ok:false,error:'Aging escalation requires an actual unresolved original receipt older than 24 hours with no prior escalation. Invalid timestamps remain HOLD.'},409);
   const receipt=await append('camera703_media_aging_escalation',{
     build:703,open_receipt_id:openId,media_kind:caseInfo.media_kind,
     exception_kind:caseInfo.kind,age_minutes_at_review:aged.age_minutes,
     source_opened_at:caseInfo.opened_at,source_r2_key:caseInfo.r2_key,
     escalation_reason:'UNRESOLVED_ORIGINAL_PHONE_MEDIA_EXCEPTION_24H',
     owner_followup_required:true,unrecorded_uploads_certified:false,
     physical_phone_independently_verified:false,
     status:'ESCALATED_UNRESOLVED_ORIGINAL_MEDIA_EXCEPTION_HOLD'
   },'escalate');
   return out({ok:true,status:'ESCALATED_UNRESOLVED_ORIGINAL_MEDIA_EXCEPTION_HOLD',
     receipt_id:receipt,open_receipt_id:openId,source_age_minutes:aged.age_minutes,
     independently_verified_upload_recovery:false,publication_performed:false});
 }
 if(action==='camera704_followup'){
   const caseId=Number(form.get('open_receipt_id')),
     escalationId=Number(form.get('escalation_receipt_id')),
     disposition=String(form.get('followup_disposition')||'');
   const item=cases.find(x=>x.receipt_id===caseId),
     escalation=escalationRecords.find(x=>
       Number(x.admin_action_audit_id)===escalationId&&
       Number(x.data?.open_receipt_id)===caseId);
   if(!['manual_retry_scheduled','original_phone_recheck_pending','external_media_source_investigation'].includes(disposition)||
     !ownerFollowupEligible704(item,escalation,followupRows))
     return out({ok:false,error:'Only an original unresolved case with an existing 24h owner escalation, no prior follow-up and a selected pending disposition can be recorded. HOLD.'},409);
   const receiptId=await append('camera704_media_owner_followup',{
     build:704,open_receipt_id:caseId,escalation_receipt_id:escalationId,
     escalation_source_time:escalation.created_at,
     followup_disposition:disposition,
     status:'OWNER_ESCALATION_FOLLOWUP_RECORDED_MEDIA_RECOVERY_HOLD',
     original_media_kind:item.media_kind,original_exception_kind:item.kind,
     media_recovery_independently_verified:false,unrecorded_uploads_certified:false
   },'followup');
   return out({ok:true,status:'OWNER_ESCALATION_FOLLOWUP_RECORDED_MEDIA_RECOVERY_HOLD',
     receipt_id:receiptId,open_receipt_id:caseId,
     original_media_recovery_verified:false,publication_performed:false});
 }
 if(action==='camera705_reconcile_linked'){
   const caseId=Number(form.get('open_receipt_id')),
     followupId=Number(form.get('followup_receipt_id')),
     item=cases.find(x=>x.receipt_id===caseId&&!x.closed),
     followup=followupRows.find(x=>Number(x.admin_action_audit_id)===followupId&&
       Number(x.data?.open_receipt_id)===caseId),
     media=live?.media?.find(x=>x.kind===item?.media_kind&&
       Number(x.attachment_id)===Number(item?.attachment_id));
   if(!item||!followup||!goodId(latest?.admin_action_audit_id)||
     recoveryRows.some(x=>Number(x.data?.open_receipt_id)===caseId)||
     !canReconcileLinked705({...item,original_701_receipt_id:originalId},
       followup,latest,media,live))
     return out({ok:false,error:'An open original linked case, unique 704 follow-up, subsequent owner re-attestation and exact current D1/R2 HEAD are required. Unrecorded uploads remain HOLD.'},409);
   const receipt=await append('camera705_media_recovery_reconciled',{
     build:705,open_receipt_id:caseId,followup_receipt_id:followupId,
     original_reattest_receipt_id:Number(latest.admin_action_audit_id),
     recovery_kind:'LINKED_D1_ATTACHMENT_R2_HEAD_VERIFIED_ONLY',
     media_kind:item.media_kind,attachment_id:item.attachment_id,
     r2_key:item.r2_key,r2_bytes:media.r2_bytes,
     unrecorded_upload_recovery_verified:false,
     independent_physical_device_witness:false,original_issue_closed:false,
     status:'LINKED_RECOVERY_EVIDENCE_RECONCILED_FINAL_OWNER_CASE_CLOSE_HOLD'
   },'reconcile');
   return out({ok:true,status:'LINKED_RECOVERY_EVIDENCE_RECONCILED_FINAL_OWNER_CASE_CLOSE_HOLD',
     receipt_id:receipt,open_receipt_id:caseId,
     unrecorded_upload_recovery_verified:false,original_issue_closed:false,
     publication_performed:false});
 }
 if(action==='camera706_owner_signoff'){
   const caseId=Number(form.get('open_receipt_id')),
    recoveryId=Number(form.get('recovery_receipt_id')),
    closureId=Number(form.get('closure_receipt_id')),
    caseInfo=cases.find(x=>x.receipt_id===caseId&&x.closed&&x.kind==='linked'),
    recovery=recoveryRows.find(x=>Number(x.admin_action_audit_id)===recoveryId&&
      Number(x.data?.open_receipt_id)===caseId),
    closure=closeRows.find(x=>Number(x.admin_action_audit_id)===closureId&&
      Number(x.data?.open_receipt_id)===caseId),
    media=live?.media?.find(x=>x.kind===caseInfo?.media_kind&&
      Number(x.attachment_id)===Number(caseInfo?.attachment_id));
   if(!caseInfo||!recovery||!closure||!goodId(latest?.admin_action_audit_id)||
     form.get('owner_reviewed')!=='true'||
     signoffs.some(x=>Number(x.data?.open_receipt_id)===caseId)||
     !canOwnerSignoff706({...caseInfo,original_701_receipt_id:originalId},
       recovery,closure,latest,media,live))
      return out({ok:false,error:'Original linked 705 D1/R2 recovery, later explicit 702 case close, fresh same-owner re-attestation, matching exact R2 HEAD and unique owner sign-off required. Unrecorded uploads remain HOLD.'},409);
   const receipt=await append('camera706_owner_linked_recovery_signoff',{
     build:706,open_receipt_id:caseId,recovery_receipt_id:recoveryId,
     closure_receipt_id:closureId,owner_reattest_receipt_id:Number(latest.admin_action_audit_id),
     owner_signoff_decision:'accept_verified_linked_recovery_only',
     media_kind:caseInfo.media_kind,attachment_id:caseInfo.attachment_id,
     r2_key:caseInfo.r2_key,verified_r2_bytes:media.r2_bytes,
     original_issue_closed_by_explicit_owner_action:true,
     physical_device_independently_witnessed:false,
     unrecorded_upload_recovery_certified:false,financial_closed:false,
     status:'ORIGINAL_OWNER_LINKED_MEDIA_RECOVERY_SIGNED_UNRECORDED_HOLD'
   },'owner-signoff');
   return out({ok:true,status:'ORIGINAL_OWNER_LINKED_MEDIA_RECOVERY_SIGNED_UNRECORDED_HOLD',
     receipt_id:receipt,open_receipt_id:caseId,original_case_already_closed:true,
     independent_physical_phone_verified:false,
     unrecorded_upload_recovery_certified:false,publication_performed:false});
 }
 if(action==='camera708_signed_drift_open'){
   const caseId=Number(form.get('open_receipt_id')),
    signoffId=Number(form.get('original_signoff_receipt_id')),
    caseInfo=cases.find(x=>x.receipt_id===caseId&&x.kind==='linked'&&x.closed),
    signoff=signoffs.find(x=>Number(x.admin_action_audit_id)===signoffId&&
     Number(x.data?.open_receipt_id)===caseId),
    recovery=recoveryRows.find(x=>Number(x.data?.open_receipt_id)===caseId&&
      Number(x.admin_action_audit_id)===Number(signoff?.data?.recovery_receipt_id)),
    closure=closeRows.find(x=>Number(x.admin_action_audit_id)===Number(signoff?.data?.closure_receipt_id)&&
      Number(x.data?.open_receipt_id)===caseId),
    media=live?.media?.find(x=>x.kind===caseInfo?.media_kind&&
      Number(x.attachment_id)===Number(caseInfo?.attachment_id)),
    audit=signoff?auditSignoffDrift707({...caseInfo,original_701_receipt_id:originalId},
      recovery,closure,signoff,latest,media,live):null;
   if(form.get('owner_reviewed')!=='true'||!caseInfo||!signoff||
     driftRows.some(x=>Number(x.data?.original_signoff_receipt_id)===signoffId)||
     !canOpenSignedDrift708(caseInfo,signoff,audit))
    return out({ok:false,error:'A fresh server-observed original signed D1/R2 media mismatch and unrecorded drift exception are required. No automatic repair. HOLD.'},409);
   const receipt=await append('camera708_signed_media_drift_open',{
     build:708,open_receipt_id:caseId,original_signoff_receipt_id:signoffId,
     original_recovery_receipt_id:Number(signoff.data.recovery_receipt_id),
     original_closure_receipt_id:Number(signoff.data.closure_receipt_id),
     original_signed_r2_key:signoff.data.r2_key,
     original_signed_r2_bytes:Number(signoff.data.verified_r2_bytes),
     observed_current_r2_key:media?.r2_key||null,
     observed_current_r2_bytes:Number(media?.r2_bytes||0),
     observed_current_r2_head_confirmed:media?.confirmed===true,
     drift_observed_status:audit.status,server_side_r2_head_checked:true,
     independent_physical_media_witness:false,automatic_restoration:false,
     unresolved_unrecorded_media_cleared:false,
     status:'ORIGINAL_SIGNED_MEDIA_DRIFT_EXCEPTION_DURABLY_OPEN_708'
   },'drift708-open');
   return out({ok:true,status:'ORIGINAL_SIGNED_MEDIA_DRIFT_EXCEPTION_DURABLY_OPEN_708',
     receipt_id:receipt,open_receipt_id:caseId,automatic_restoration:false,
     independently_witnessed_phone:false,publication_performed:false});
 }
 if(action==='camera708_signed_drift_revalidate'){
   const caseId=Number(form.get('open_receipt_id')),
    driftId=Number(form.get('drift_receipt_id')),
    signoffId=Number(form.get('original_signoff_receipt_id')),
    caseInfo=cases.find(x=>x.receipt_id===caseId&&x.kind==='linked'&&x.closed),
    signoff=signoffs.find(x=>Number(x.admin_action_audit_id)===signoffId&&
      Number(x.data?.open_receipt_id)===caseId),
    drift=driftRows.find(x=>Number(x.admin_action_audit_id)===driftId&&
      Number(x.data?.open_receipt_id)===caseId&&
      Number(x.data?.original_signoff_receipt_id)===signoffId),
    recovery=recoveryRows.find(x=>Number(x.admin_action_audit_id)===Number(signoff?.data?.recovery_receipt_id)),
    closure=closeRows.find(x=>Number(x.admin_action_audit_id)===Number(signoff?.data?.closure_receipt_id)),
    media=live?.media?.find(x=>x.kind===caseInfo?.media_kind&&
      Number(x.attachment_id)===Number(caseInfo?.attachment_id)),
    audit=signoff?auditSignoffDrift707({...caseInfo,original_701_receipt_id:originalId},
      recovery,closure,signoff,latest,media,live):null;
   if(form.get('owner_reviewed')!=='true'||!caseInfo||!drift||!signoff||
     driftRecoveryRows.some(x=>Number(x.data?.drift_receipt_id)===driftId)||
     !canReconcileSignedDrift708(drift,signoff,latest,audit))
    return out({ok:false,error:'A later owner re-attestation and fresh exact D1/R2 HEAD matching the original signed key/bytes are required after a durable drift case. HOLD.'},409);
   const receipt=await append('camera708_signed_media_drift_recovered',{
     build:708,open_receipt_id:caseId,drift_receipt_id:driftId,
     original_signoff_receipt_id:signoffId,
     original_recovery_receipt_id:Number(signoff.data.recovery_receipt_id),
     original_closure_receipt_id:Number(signoff.data.closure_receipt_id),
     fresh_original_reattest_receipt_id:Number(latest.admin_action_audit_id),
     original_signed_r2_key:signoff.data.r2_key,
     verified_current_r2_key:media.r2_key,
     verified_current_r2_bytes:media.r2_bytes,
     source_status:'SIGNED_LINKED_MEDIA_SOURCE_STABLE_ON_DEMAND_707',
     independent_server_side_r2_head_rechecked:true,
     independent_physical_media_witness:false,automatic_restoration:false,
     original_unrecorded_uploads_closed:false,publication_performed:false,
     status:'SOURCE_MATCHED_DRIFT_RECOVERY_REVALIDATED_UNRECORDED_HOLD_708'
   },'drift708-revalidate');
   return out({ok:true,status:'SOURCE_MATCHED_DRIFT_RECOVERY_REVALIDATED_UNRECORDED_HOLD_708',
     receipt_id:receipt,open_receipt_id:caseId,independently_witnessed_phone:false,
     unrecorded_media_closed:false,publication_performed:false});
 }
 if(action==='camera709_signed_recurrence_open'||action==='camera709_signed_recurrence_escalate'){
   const caseId=Number(form.get('open_receipt_id')),
    signoffId=Number(form.get('original_signoff_receipt_id')),
    recoveredId=Number(form.get('recovered_708_receipt_id')),
    c=cases.find(x=>x.receipt_id===caseId&&x.closed&&x.kind==='linked'),
    signoff=signoffs.find(x=>Number(x.admin_action_audit_id)===signoffId&&
      Number(x.data?.open_receipt_id)===caseId),
    recovered=driftRecoveryRows.find(x=>Number(x.admin_action_audit_id)===recoveredId&&
      Number(x.data?.open_receipt_id)===caseId&&
      Number(x.data?.original_signoff_receipt_id)===signoffId),
    recovery=recoveryRows.find(x=>Number(x.admin_action_audit_id)===
      Number(signoff?.data?.recovery_receipt_id)),
    closure=closeRows.find(x=>Number(x.admin_action_audit_id)===
      Number(signoff?.data?.closure_receipt_id)),
    media=live?.media?.find(x=>x.kind===c?.media_kind&&
      Number(x.attachment_id)===Number(c?.attachment_id)),
    drift=signoff?auditSignoffDrift707({...c,original_701_receipt_id:originalId},
      recovery,closure,signoff,latest,media,live):null,
    recurrence=recurrenceRows.find(x=>Number(x.data?.recovered_708_receipt_id)===recoveredId);
   if(form.get('owner_reviewed')!=='true'||!c||!signoff||!recovered)
    return out({ok:false,error:'Owner must review an actual recovered original signed Build 708 source; HOLD.'},409);
   if(action==='camera709_signed_recurrence_open'){
    if(recurrence||!canOpenMediaRecurrence709(recovered,signoff,drift))
      return out({ok:false,error:'Only a new server-observed signed D1/R2 mismatch AFTER a protected 708 recovery permits recurrence intake. HOLD.'},409);
    const receipt=await append('camera709_signed_media_recurrence_open',{
      build:709,open_receipt_id:caseId,original_signoff_receipt_id:signoffId,
      recovered_708_receipt_id:recoveredId,
      original_signed_r2_key:signoff.data.r2_key,
      original_signed_r2_bytes:Number(signoff.data.verified_r2_bytes),
      observed_current_r2_key:media?.r2_key||null,
      observed_current_r2_bytes:Number(media?.r2_bytes||0),
      observed_current_r2_head_confirmed:media?.confirmed===true,
      recurrence_observed_status:drift.status,server_side_r2_head_checked:true,
      independent_phone_witnessed:false,automatic_media_restoration:false,
      automated_escalation_sent:false,unrecorded_uploads_closed:false,
      status:'RECURRENT_SIGNED_ORIGINAL_MEDIA_DRIFT_OPEN_OWNER_HOLD_709'
    },'recurrence709-open-'+recoveredId);
    return out({ok:true,status:'RECURRENT_SIGNED_ORIGINAL_MEDIA_DRIFT_OPEN_OWNER_HOLD_709',
      receipt_id:receipt,automated_escalation_sent:false,publication_performed:false});
   }
   const recurrenceId=Number(form.get('recurrence_receipt_id'));
   if(!recurrence||Number(recurrence.admin_action_audit_id)!==recurrenceId||
     recurrenceResolutionRows.some(x=>Number(x.data?.recurrence_receipt_id)===recurrenceId)||
     recurrenceEscalationRows.some(x=>Number(x.data?.recurrence_receipt_id)===recurrenceId)||
     !canEscalateMediaRecurrence709(recurrence,signoff,drift))
     return out({ok:false,error:'24h aged original recurrence and fresh live D1/R2 mismatch required; no duplicate or automated escalation. HOLD.'},409);
   const age=mediaRecurrenceAge709(recurrence);
   const receipt=await append('camera709_signed_media_recurrence_escalation',{
     build:709,open_receipt_id:caseId,recurrence_receipt_id:recurrenceId,
     recovered_708_receipt_id:recoveredId,original_signoff_receipt_id:signoffId,
     signed_r2_key:signoff.data.r2_key,signed_r2_bytes:Number(signoff.data.verified_r2_bytes),
     observed_current_r2_bytes:Number(media?.r2_bytes||0),
     age_hours:age.hours,recurrence_age_status:age.status,
     source_status:drift.status,
     independent_phone_witnessed:false,automated_escalation_sent:false,
     financial_closed:false,unrecorded_uploads_closed:false,
     status:'ORIGINAL_MEDIA_RECURRENCE_ESCALATION_RECEIPT_OWNER_FOLLOWUP_REQUIRED_709'
   },'recurrence709-escalate-'+recurrenceId);
   return out({ok:true,
     status:'ORIGINAL_MEDIA_RECURRENCE_ESCALATION_RECEIPT_OWNER_FOLLOWUP_REQUIRED_709',
     receipt_id:receipt,automated_escalation_sent:false,publication_performed:false});
 }
 if(action==='camera710_signed_recurrence_resolve'){
   const caseId=Number(form.get('open_receipt_id')),
    recurrenceId=Number(form.get('recurrence_receipt_id')),
    signoffId=Number(form.get('original_signoff_receipt_id')),
    recoveredId=Number(form.get('recovered_708_receipt_id')),
    c=cases.find(x=>x.receipt_id===caseId&&x.kind==='linked'&&x.closed),
    signoff=signoffs.find(x=>Number(x.admin_action_audit_id)===signoffId&&
      Number(x.data?.open_receipt_id)===caseId),
    recovered=driftRecoveryRows.find(x=>Number(x.admin_action_audit_id)===recoveredId&&
      Number(x.data?.original_signoff_receipt_id)===signoffId&&
      Number(x.data?.open_receipt_id)===caseId),
    recurrence=recurrenceRows.find(x=>Number(x.admin_action_audit_id)===recurrenceId&&
      Number(x.data?.open_receipt_id)===caseId&&
      Number(x.data?.recovered_708_receipt_id)===recoveredId),
    recovery=recoveryRows.find(x=>
      Number(x.admin_action_audit_id)===Number(signoff?.data?.recovery_receipt_id)),
    closure=closeRows.find(x=>
      Number(x.admin_action_audit_id)===Number(signoff?.data?.closure_receipt_id)),
    media=live?.media?.find(x=>x.kind===c?.media_kind&&
      Number(x.attachment_id)===Number(c?.attachment_id)),
    audit=signoff?auditSignoffDrift707({...c,original_701_receipt_id:originalId},
      recovery,closure,signoff,latest,media,live):null;
   if(form.get('owner_reviewed')!=='true'||!c||!signoff||!recovered||!recurrence||
     recurrenceResolutionRows.some(x=>Number(x.data?.recurrence_receipt_id)===recurrenceId)||
     !canResolveOriginalRecurrence710(recurrence,recovered,signoff,latest,audit))
     return out({ok:false,error:'Original 709 recurrence, 708 recovery, later original owner re-attestation and fresh actual D1/R2 HEAD matching the exact signed source required. HOLD.'},409);
   const receipt=await append('camera710_signed_media_recurrence_resolved',{
     build:710,open_receipt_id:caseId,recurrence_receipt_id:recurrenceId,
     recovered_708_receipt_id:recoveredId,original_signoff_receipt_id:signoffId,
     original_709_escalation_receipt_id:Number(recurrenceEscalationRows.find(x=>
       Number(x.data?.recurrence_receipt_id)===recurrenceId)?.admin_action_audit_id||0),
     fresh_owner_reattest_receipt_id:Number(latest.admin_action_audit_id),
     original_signed_r2_key:signoff.data.r2_key,
     original_signed_r2_bytes:Number(signoff.data.verified_r2_bytes),
     restored_r2_key:media.r2_key,restored_r2_bytes:media.r2_bytes,
     restored_source_status:audit.status,
     owner_resolution_decision:'accept_original_signed_source_only',
     server_side_r2_head_rechecked:true,physical_phone_independently_witnessed:false,
     unrecorded_uploads_closed:false,automatic_publication:false,
     financial_closed:false,
     status:'OWNER_SIGNED_MEDIA_RECURRENCE_SOURCE_RESTORED_UNRECORDED_HOLD_710'
   },'recurrence710-resolution-'+recurrenceId);
   return out({ok:true,status:'OWNER_SIGNED_MEDIA_RECURRENCE_SOURCE_RESTORED_UNRECORDED_HOLD_710',
     receipt_id:receipt,open_receipt_id:caseId,physical_phone_independently_witnessed:false,
     unrecorded_media_closed:false,publication_performed:false});
 }
 if(action==='camera711_post_resolution_stability'){
   const caseId=Number(form.get('open_receipt_id')),
    resolutionId=Number(form.get('original_710_resolution_receipt_id')),
    recurrenceId=Number(form.get('original_709_recurrence_receipt_id')),
    signoffId=Number(form.get('original_signoff_receipt_id')),
    c=cases.find(x=>x.receipt_id===caseId&&x.closed&&x.kind==='linked'),
    signoff=signoffs.find(x=>Number(x.admin_action_audit_id)===signoffId&&
      Number(x.data?.open_receipt_id)===caseId),
    resolution=recurrenceResolutionRows.find(x=>Number(x.admin_action_audit_id)===resolutionId&&
      Number(x.data?.recurrence_receipt_id)===recurrenceId&&
      Number(x.data?.original_signoff_receipt_id)===signoffId),
    recurrence=recurrenceRows.find(x=>Number(x.admin_action_audit_id)===recurrenceId&&
      Number(x.data?.open_receipt_id)===caseId),
    recovery=recoveryRows.find(x=>Number(x.admin_action_audit_id)===
      Number(signoff?.data?.recovery_receipt_id)),
    closure=closeRows.find(x=>Number(x.admin_action_audit_id)===
      Number(signoff?.data?.closure_receipt_id)),
    media=live?.media?.find(x=>x.kind===c?.media_kind&&
      Number(x.attachment_id)===Number(c?.attachment_id)),
    audit=signoff?auditSignoffDrift707({...c,original_701_receipt_id:originalId},
      recovery,closure,signoff,latest,media,live):null;
   if(form.get('owner_reviewed')!=='true'||!c||!signoff||!recurrence||!resolution||
     postResolutionRows.some(x=>Number(x.data?.original_710_resolution_receipt_id)===resolutionId)||
     !canRecordPostResolutionStability711(resolution,recurrence,signoff,latest,audit))
     return out({ok:false,error:'Original 710 resolution aged 24h, fresh later owner re-attestation and actual signed D1/R2 HEAD unchanged required. No automated monitoring. HOLD.'},409);
   const age=postResolutionStabilityAge711(resolution);
   const receipt=await append('camera711_post_resolution_stability_receipt',{
     build:711,original_inspection_type:'signed_media_post_resolution_stability',
     open_receipt_id:caseId,original_710_resolution_receipt_id:resolutionId,
     original_709_recurrence_receipt_id:recurrenceId,original_signoff_receipt_id:signoffId,
     later_original_reattest_receipt_id:Number(latest.admin_action_audit_id),
     original_signed_r2_key:signoff.data.r2_key,
     original_signed_r2_bytes:Number(signoff.data.verified_r2_bytes),
     observed_current_r2_key:media.r2_key,observed_current_r2_bytes:media.r2_bytes,
     resolution_age_hours:age.age_hours,current_source_status:audit.status,
     server_side_r2_head_confirmed:true,independent_physical_phone_witnessed:false,
     unrecorded_uploads_closed:false,automatic_publication:false,
     continuous_monitoring_enabled:false,bookkeeping_closed:false,
     status:'ORIGINAL_SIGNED_MEDIA_STABILITY_RECHECK_VERIFIED_ON_DEMAND_711'
   },'stability711-'+resolutionId);
   return out({ok:true,
    status:'ORIGINAL_SIGNED_MEDIA_STABILITY_RECHECK_VERIFIED_ON_DEMAND_711',
    receipt_id:receipt,continuous_monitoring_enabled:false,
    unrecorded_uploads_closed:false,publication_performed:false});
 }
 if(action==='camera712_signed_horizon_review'){
   const caseId=Number(form.get('open_receipt_id')),
    stabilityId=Number(form.get('original_711_stability_receipt_id')),
    resolutionId=Number(form.get('original_710_resolution_receipt_id')),
    recurrenceId=Number(form.get('original_709_recurrence_receipt_id')),
    signoffId=Number(form.get('original_706_signoff_receipt_id')),
    c=cases.find(x=>x.receipt_id===caseId&&x.kind==='linked'&&x.closed),
    signoff=signoffs.find(x=>Number(x.admin_action_audit_id)===signoffId&&
     Number(x.data?.open_receipt_id)===caseId),
    recurrence=recurrenceRows.find(x=>Number(x.admin_action_audit_id)===recurrenceId&&
     Number(x.data?.open_receipt_id)===caseId),
    resolution=recurrenceResolutionRows.find(x=>Number(x.admin_action_audit_id)===resolutionId&&
     Number(x.data?.recurrence_receipt_id)===recurrenceId&&
     Number(x.data?.original_signoff_receipt_id)===signoffId),
    stability=postResolutionRows.find(x=>Number(x.admin_action_audit_id)===stabilityId&&
     Number(x.data?.original_710_resolution_receipt_id)===resolutionId&&
     Number(x.data?.original_709_recurrence_receipt_id)===recurrenceId),
    recovery=recoveryRows.find(x=>Number(x.admin_action_audit_id)===
     Number(signoff?.data?.recovery_receipt_id)),
    closure=closeRows.find(x=>Number(x.admin_action_audit_id)===
     Number(signoff?.data?.closure_receipt_id)),
    media=live?.media?.find(x=>x.kind===c?.media_kind&&
     Number(x.attachment_id)===Number(c?.attachment_id)),
    audit=signoff?auditSignoffDrift707({...c,original_701_receipt_id:originalId},
     recovery,closure,signoff,latest,media,live):null;
   if(form.get('owner_reviewed')!=='true'||!c||!signoff||!recurrence||!resolution||!stability||
    horizonRows.some(x=>Number(x.data?.original_711_stability_receipt_id)===stabilityId)||
    !canReviewSignedMediaHorizon712(stability,resolution,recurrence,signoff,latest,audit))
    return out({ok:false,error:'Original 711 signed stability at least 24h old, later owner 702 re-attestation and fresh exact signed D1/R2 HEAD required; HOLD.'},409);
   const horizon=signedMediaHorizonAge712(stability);
   const receipt=await append('camera712_media_stability_horizon_review',{
    build:712,source_recheck:'independent_server_d1_r2_head_on_demand',
    open_receipt_id:caseId,
    original_711_stability_receipt_id:stabilityId,
    original_710_resolution_receipt_id:resolutionId,
    original_709_recurrence_receipt_id:recurrenceId,
    original_706_signoff_receipt_id:signoffId,
    later_owner_702_reattest_receipt_id:Number(latest.admin_action_audit_id),
    original_signed_r2_key:signoff.data.r2_key,
    original_signed_r2_bytes:Number(signoff.data.verified_r2_bytes),
    observed_current_r2_key:media.r2_key,observed_current_r2_bytes:media.r2_bytes,
    observed_stability_horizon_hours:horizon.age_hours,
    observed_horizon_status:horizon.status,
    rechecked_source_status:audit.status,
    automatic_media_repair:false,continuous_monitoring_enabled:false,
    independent_physical_phone_witness:false,unrecorded_uploads_closed:false,
    publication_performed:false,financial_closed:false,
    status:'ORIGINAL_SIGNED_MEDIA_HORIZON_SOURCE_VERIFIED_ON_DEMAND_712'
   },'media712-horizon-'+stabilityId);
   return out({ok:true,status:'ORIGINAL_SIGNED_MEDIA_HORIZON_SOURCE_VERIFIED_ON_DEMAND_712',
    receipt_id:receipt,automatic_media_repair:false,continuous_monitoring_enabled:false,
    independently_witnessed_phone:false,publication_performed:false});
 }
 return out({ok:false,error:'Unsupported Build 702/703/704/705/706/707/708/709/710/711/712 action.'},400);
}
