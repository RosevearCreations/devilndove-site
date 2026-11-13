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

export async function handleCamera702({db,form,adminUser,id,token,live,ready701}){
 const action=String(form.get('action')||'');
 const auditRows=await db.prepare(
 "SELECT admin_action_audit_id,action_type,created_at,details_json FROM admin_action_audit "+
 "WHERE target_type='product' AND target_id=? AND actor_user_id=? "+
 "AND action_type IN ('camera701_owner_field_receipt','camera702_owner_reattest','camera702_media_issue_open','camera702_media_issue_close','camera703_media_aging_escalation','camera704_media_owner_followup','camera705_media_recovery_reconciled','camera706_owner_linked_recovery_signoff') "+
 "ORDER BY admin_action_audit_id DESC LIMIT 81").bind(id,adminUser.user_id).all();
 const raw=Array.isArray(auditRows?.results)?auditRows.results:[];
 if(raw.length>80)return out({ok:false,error:'Unbounded original device receipt history; independent review required. HOLD.'},409);
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
  independently_authenticated_phone:false,
  unrecorded_upload_recovery_certified:false,publication_performed:false});
 if(action==='camera702_inspect'||action==='camera703_inspect'||action==='camera704_inspect'||action==='camera705_inspect'||action==='camera706_inspect'||action==='camera707_inspect')return state();
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
 return out({ok:false,error:'Unsupported Build 702/703/704/705/706/707 action.'},400);
}
